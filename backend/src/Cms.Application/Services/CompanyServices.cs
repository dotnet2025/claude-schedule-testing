using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Constants;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

/// <summary>Minimal Company master (prerequisite for the Company-User module): list, get, create, update.</summary>
public class CompanyService(IAppDbContext db)
{
    private static IQueryable<CompanyDto> Project(IQueryable<Company> q) => q.Select(c => new CompanyDto(
        c.CompanyId, c.CompanyCode, c.CompanyName, c.IsActive, c.CreatedAt, c.UpdatedAt,
        c.CompanyUsers.Count(m => m.IsActive)));

    public async Task<PagedResult<CompanyDto>> ListAsync(string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Companies.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim().ToLower();
            q = q.Where(c => c.CompanyCode.ToLower().Contains(t) || c.CompanyName.ToLower().Contains(t));
        }
        if (isActive.HasValue) q = q.Where(c => c.IsActive == isActive.Value);
        var total = await q.CountAsync(ct);
        var items = await Project(q.OrderBy(c => c.CompanyName).ThenBy(c => c.CompanyId).Skip((p - 1) * s).Take(s)).ToListAsync(ct);
        return new(items, total, p, s);
    }

    public async Task<CompanyDto> GetAsync(int id, CancellationToken ct)
        => await Project(db.Companies.AsNoTracking().Where(c => c.CompanyId == id)).FirstOrDefaultAsync(ct)
           ?? throw new NotFoundException("Company not found.");

    public async Task<CompanyDto> CreateAsync(CompanyRequest r, int? actingUserId, CancellationToken ct)
    {
        var code = r.CompanyCode.Trim().ToUpperInvariant();
        if (await db.Companies.AnyAsync(c => c.CompanyCode == code, ct)) throw new ConflictException("A company with this code already exists.");
        var c = new Company { CompanyCode = code, CompanyName = r.CompanyName.Trim(), IsActive = r.IsActive, CreatedById = actingUserId, UpdatedById = actingUserId };
        db.Companies.Add(c);
        await db.SaveChangesAsync(ct);
        return await GetAsync(c.CompanyId, ct);
    }

    public async Task<CompanyDto> UpdateAsync(int id, CompanyRequest r, int? actingUserId, CancellationToken ct)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.CompanyId == id, ct) ?? throw new NotFoundException("Company not found.");
        var code = r.CompanyCode.Trim().ToUpperInvariant();
        if (await db.Companies.AnyAsync(x => x.CompanyCode == code && x.CompanyId != id, ct)) throw new ConflictException("A company with this code already exists.");
        c.CompanyCode = code; c.CompanyName = r.CompanyName.Trim(); c.IsActive = r.IsActive;
        c.UpdatedAt = DateTime.UtcNow; c.UpdatedById = actingUserId;
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }
}

/// <summary>
/// Company-User mapping. Rules (see README "Company-User mapping"):
///  * one mapping per (CompanyId, UserId) - unique index; assigning again to an inactive mapping reactivates it (documented choice);
///  * only ONE active primary mapping per user - enforced by the filtered unique index UX_CompanyUsers_OnePrimaryPerUser AND here,
///    inside a transaction, by demoting the user's other primary mapping before promoting the new one;
///  * unassign = soft delete (IsActive=false, IsPrimaryCompany=false), never deletes users or companies;
///  * system role is never touched by membership changes.
/// </summary>
public class CompanyUserService(IAppDbContext db, UserService users)
{
    private const int MaxAttempts = 6;

    private static IQueryable<CompanyUserDto> Project(IQueryable<CompanyUser> q) => q.Select(m => new CompanyUserDto(
        m.CompanyUserId, m.CompanyId, m.Company!.CompanyCode, m.Company.CompanyName, m.Company.IsActive,
        m.UserId, m.User!.DisplayName, m.User.Username, m.User.Email, m.User.Phone, m.User.Role, m.User.IsActive,
        m.IsActive, m.IsPrimaryCompany, m.CreatedAt, m.UpdatedAt));

    // ---------- queries ----------
    public async Task<PagedResult<CompanyUserDto>> ListAsync(string? search, int? companyId, int? userId, bool? userIsActive, bool? assignmentIsActive,
        string? sortBy, bool desc, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.CompanyUsers.AsNoTracking().AsQueryable();
        if (companyId.HasValue) q = q.Where(m => m.CompanyId == companyId.Value);
        if (userId.HasValue) q = q.Where(m => m.UserId == userId.Value);
        if (userIsActive.HasValue) q = q.Where(m => m.User!.IsActive == userIsActive.Value);
        if (assignmentIsActive.HasValue) q = q.Where(m => m.IsActive == assignmentIsActive.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim().ToLower();
            q = q.Where(m => m.Company!.CompanyName.ToLower().Contains(t) || m.Company.CompanyCode.ToLower().Contains(t)
                || m.User!.DisplayName.ToLower().Contains(t) || m.User.Username.Contains(t) || m.User.Email.Contains(t));
        }
        var total = await q.CountAsync(ct);
        IOrderedQueryable<CompanyUser> ordered = (sortBy?.ToLowerInvariant()) switch
        {
            "company" => desc ? q.OrderByDescending(m => m.Company!.CompanyName) : q.OrderBy(m => m.Company!.CompanyName),
            "code" => desc ? q.OrderByDescending(m => m.Company!.CompanyCode) : q.OrderBy(m => m.Company!.CompanyCode),
            "user" => desc ? q.OrderByDescending(m => m.User!.DisplayName) : q.OrderBy(m => m.User!.DisplayName),
            "username" => desc ? q.OrderByDescending(m => m.User!.Username) : q.OrderBy(m => m.User!.Username),
            "email" => desc ? q.OrderByDescending(m => m.User!.Email) : q.OrderBy(m => m.User!.Email),
            "role" => desc ? q.OrderByDescending(m => m.User!.Role) : q.OrderBy(m => m.User!.Role),
            "status" => desc ? q.OrderByDescending(m => m.IsActive) : q.OrderBy(m => m.IsActive),
            "primary" => desc ? q.OrderByDescending(m => m.IsPrimaryCompany) : q.OrderBy(m => m.IsPrimaryCompany),
            _ => desc ? q.OrderByDescending(m => m.CreatedAt) : q.OrderBy(m => m.CreatedAt),
        };
        var items = await Project(ordered.ThenBy(m => m.CompanyUserId).Skip((p - 1) * s).Take(s)).ToListAsync(ct);
        return new(items, total, p, s);
    }

    public async Task<CompanyUserDto> GetAsync(int id, CancellationToken ct)
        => await Project(db.CompanyUsers.AsNoTracking().Where(m => m.CompanyUserId == id)).FirstOrDefaultAsync(ct)
           ?? throw new NotFoundException("Company-user assignment not found.");

    public async Task<PagedResult<CompanyUserDto>> ListForCompanyAsync(int companyId, string? search, bool? assignmentIsActive, int page, int pageSize, CancellationToken ct)
    {
        if (!await db.Companies.AnyAsync(c => c.CompanyId == companyId, ct)) throw new NotFoundException("Company not found.");
        return await ListAsync(search, companyId, null, null, assignmentIsActive, "user", false, page, pageSize, ct);
    }

    public async Task<List<UserCompanyDto>> ListForUserAsync(int userId, CancellationToken ct)
    {
        if (!await db.Users.AnyAsync(u => u.Id == userId, ct)) throw new NotFoundException("User not found.");
        return await db.CompanyUsers.AsNoTracking().Where(m => m.UserId == userId)
            .OrderByDescending(m => m.IsPrimaryCompany).ThenBy(m => m.Company!.CompanyName)
            .Select(m => new UserCompanyDto(m.CompanyUserId, m.CompanyId, m.Company!.CompanyCode, m.Company.CompanyName, m.Company.IsActive,
                m.IsActive, m.IsPrimaryCompany, m.CreatedAt)).ToListAsync(ct);
    }

    // ---------- commands ----------

    /// <summary>Assign an existing user. Re-assigning an INACTIVE mapping reactivates it (200 semantics, Created=false).</summary>
    public async Task<(CompanyUserDto Dto, bool Created)> AssignAsync(int companyId, int userId, bool isActive, bool isPrimary, int? actingUserId, CancellationToken ct)
    {
        var id = 0; var created = false;
        await InTransactionAsync(async () =>
        {
            var company = await db.Companies.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct) ?? throw new NotFoundException("Company not found.");
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new NotFoundException("User not found.");
            if (!company.IsActive) throw new BadRequestException("Inactive companies cannot receive new assignments.");
            if (isActive && !user.IsActive) throw new BadRequestException("Inactive users cannot receive an active assignment.");
            if (isPrimary && !isActive) throw new BadRequestException("An inactive assignment cannot be the primary company.");
            var existing = await db.CompanyUsers.FirstOrDefaultAsync(m => m.CompanyId == companyId && m.UserId == userId, ct);
            if (existing is { IsActive: true }) throw new ConflictException("This user is already assigned to this company.");
            if (isPrimary) await DemoteOtherPrimariesAsync(userId, existing?.CompanyUserId ?? 0, ct);
            var now = DateTime.UtcNow;
            if (existing is null)
            {
                existing = new CompanyUser { CompanyId = companyId, UserId = userId, IsActive = isActive, IsPrimaryCompany = isPrimary, CreatedAt = now, UpdatedAt = now, CreatedById = actingUserId, UpdatedById = actingUserId };
                db.CompanyUsers.Add(existing); created = true;
            }
            else { existing.IsActive = isActive; existing.IsPrimaryCompany = isPrimary; existing.UpdatedAt = now; existing.UpdatedById = actingUserId; }
            await db.SaveChangesAsync(ct);
            id = existing.CompanyUserId;
        }, ct);
        return (await GetAsync(id, ct), created);
    }

    /// <summary>Creates the user through the existing UserService and the mapping in ONE transaction (all-or-nothing).</summary>
    public async Task<CreatedCompanyUserResultDto> CreateUserAndAssignAsync(int companyId, CreateCompanyUserRequest r, int? actingUserId, CancellationToken ct)
    {
        var userId = 0; var mappingId = 0;
        await InTransactionAsync(async () =>
        {
            var company = await db.Companies.FirstOrDefaultAsync(c => c.CompanyId == companyId, ct) ?? throw new NotFoundException("Company not found.");
            if (!company.IsActive) throw new BadRequestException("Inactive companies cannot receive new assignments.");
            if (r.IsPrimaryCompany && !r.IsActive) throw new BadRequestException("An inactive assignment cannot be the primary company.");
            var user = await users.CreateEntityAsync(r.Email, r.FirstName, r.LastName, r.Username, r.Phone, r.Password, r.Role, r.IsActive, actingUserId, ct);
            userId = user.Id;
            var now = DateTime.UtcNow;
            var m = new CompanyUser { CompanyId = companyId, UserId = user.Id, IsActive = r.IsActive, IsPrimaryCompany = r.IsPrimaryCompany, CreatedAt = now, UpdatedAt = now, CreatedById = actingUserId, UpdatedById = actingUserId };
            db.CompanyUsers.Add(m);
            await db.SaveChangesAsync(ct);
            mappingId = m.CompanyUserId;
        }, ct);
        var u = await db.Users.AsNoTracking().FirstAsync(x => x.Id == userId, ct);
        return new(AuthService.ToDto(u), await GetAsync(mappingId, ct));
    }

    /// <summary>Only IsActive and IsPrimaryCompany can change.</summary>
    public async Task<CompanyUserDto> UpdateAsync(int id, UpdateCompanyUserRequest r, int? actingUserId, CancellationToken ct)
    {
        await InTransactionAsync(async () =>
        {
            var m = await db.CompanyUsers.Include(x => x.User).Include(x => x.Company).FirstOrDefaultAsync(x => x.CompanyUserId == id, ct)
                    ?? throw new NotFoundException("Company-user assignment not found.");
            if (r.IsPrimaryCompany && !r.IsActive) throw new BadRequestException("An inactive assignment cannot be the primary company.");
            if (r.IsActive && !m.IsActive)
            {
                if (!m.Company!.IsActive) throw new BadRequestException("Inactive companies cannot receive new assignments.");
                if (!m.User!.IsActive) throw new BadRequestException("Inactive users cannot receive an active assignment.");
            }
            if (r.IsPrimaryCompany) await DemoteOtherPrimariesAsync(m.UserId, m.CompanyUserId, ct);
            m.IsActive = r.IsActive;
            m.IsPrimaryCompany = r.IsActive && r.IsPrimaryCompany; // deactivating always clears primary
            m.UpdatedAt = DateTime.UtcNow; m.UpdatedById = actingUserId;
            await db.SaveChangesAsync(ct);
        }, ct);
        return await GetAsync(id, ct);
    }

    /// <summary>Soft delete: IsActive=false and IsPrimaryCompany=false (a primary assignment loses its flag; the user is left with no primary).</summary>
    public async Task UnassignAsync(int id, int? actingUserId, CancellationToken ct)
    {
        await InTransactionAsync(async () =>
        {
            var m = await db.CompanyUsers.FirstOrDefaultAsync(x => x.CompanyUserId == id, ct) ?? throw new NotFoundException("Company-user assignment not found.");
            m.IsActive = false; m.IsPrimaryCompany = false; m.UpdatedAt = DateTime.UtcNow; m.UpdatedById = actingUserId;
            await db.SaveChangesAsync(ct);
        }, ct);
    }

    // ---------- helpers ----------
    private async Task DemoteOtherPrimariesAsync(int userId, int exceptId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        await db.CompanyUsers.Where(x => x.UserId == userId && x.IsPrimaryCompany && x.CompanyUserId != exceptId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsPrimaryCompany, false).SetProperty(x => x.UpdatedAt, now), ct);
    }

    /// <summary>
    /// Runs work in one DB transaction (commit on success, rollback on any exception). SQLite allows a single writer, so concurrent
    /// writers can get "database is locked" or hit the filtered unique index; those are retried a few times (the retry re-reads
    /// current state, so the last writer wins deterministically) and finally reported as 409.
    /// </summary>
    private async Task InTransactionAsync(Func<Task> work, CancellationToken ct)
    {
        for (var attempt = 1; ; attempt++)
        {
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            try { await work(); await tx.CommitAsync(ct); return; }
            catch (Exception ex) when ((ex is DbUpdateException || ex is System.Data.Common.DbException) && attempt < MaxAttempts)
            {
                await tx.RollbackAsync(CancellationToken.None);
                db.ChangeTracker.Clear();
                await Task.Delay(25 * attempt, ct);
            }
            catch (Exception ex) when (ex is DbUpdateException || ex is System.Data.Common.DbException)
            {
                await tx.RollbackAsync(CancellationToken.None);
                throw new ConflictException("The assignment conflicts with a concurrent change or existing data. Please retry.");
            }
            catch { await tx.RollbackAsync(CancellationToken.None); throw; }
        }
    }
}
