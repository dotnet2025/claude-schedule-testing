using System.Linq.Expressions;
using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

/// <summary>Company Master: admin-only CRUD with safe delete (referenced companies must be deactivated instead).</summary>
public class CompanyService(IAppDbContext db)
{
    private static readonly Expression<Func<Company, CompanyDto>> Projection = c => new CompanyDto(
        c.CompanyId, c.CompanyCode, c.CompanyName, c.Email, c.Phone, c.Website, c.AddressLine1, c.AddressLine2, c.City, c.State, c.Country,
        c.PostalCode, c.LogoMediaId, null, c.IsActive, c.CreatedAt, c.UpdatedAt,
        c.CreatedById, c.CreatedBy == null ? null : c.CreatedBy.DisplayName, c.UpdatedById, c.UpdatedBy == null ? null : c.UpdatedBy.DisplayName,
        c.Users.Count);

    public async Task<PagedResult<CompanyDto>> ListAsync(string? search, bool? isActive, string? sortBy, string? sortDir, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Companies.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim().ToLower();
            q = q.Where(c => c.CompanyCode.ToLower().Contains(t) || c.CompanyName.ToLower().Contains(t));
        }
        if (isActive is bool a) q = q.Where(c => c.IsActive == a);
        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "name" or "companyname" => desc ? q.OrderByDescending(c => c.CompanyName).ThenBy(c => c.CompanyId) : q.OrderBy(c => c.CompanyName).ThenBy(c => c.CompanyId),
            "created" or "createdat" => desc ? q.OrderByDescending(c => c.CreatedAt).ThenBy(c => c.CompanyId) : q.OrderBy(c => c.CreatedAt).ThenBy(c => c.CompanyId),
            _ => desc ? q.OrderByDescending(c => c.CompanyCode).ThenBy(c => c.CompanyId) : q.OrderBy(c => c.CompanyCode).ThenBy(c => c.CompanyId),
        };
        var total = await q.CountAsync(ct);
        var items = await q.Skip((p - 1) * s).Take(s).Select(Projection).ToListAsync(ct);
        return new(items.Select(WithLogoUrl).ToList(), total, p, s);
    }

    public async Task<CompanyDto> GetAsync(int id, CancellationToken ct)
        => WithLogoUrl(await db.Companies.AsNoTracking().Where(c => c.CompanyId == id).Select(Projection).FirstOrDefaultAsync(ct)
           ?? throw new NotFoundException("Company not found."));

    private static CompanyDto WithLogoUrl(CompanyDto d) => d.LogoMediaId is int m ? d with { LogoUrl = ContentMapping.MediaUrl(m) } : d;

    public async Task<CompanyDto> CreateAsync(CompanyRequest r, int? actingUserId, CancellationToken ct)
    {
        var code = NormalizeCode(r.CompanyCode);
        await EnsureCodeFreeAsync(null, code, ct);
        await EnsureLogoAsync(r.LogoMediaId, ct);
        var now = DateTime.UtcNow;
        var c = new Company { CompanyCode = code, IsActive = r.IsActive ?? true, CreatedAt = now, UpdatedAt = now, CreatedById = actingUserId, UpdatedById = actingUserId };
        Apply(c, r);
        db.Companies.Add(c);
        await db.SaveChangesAsync(ct);
        return await GetAsync(c.CompanyId, ct);
    }

    public async Task<CompanyDto> UpdateAsync(int id, CompanyRequest r, int? actingUserId, CancellationToken ct)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.CompanyId == id, ct) ?? throw new NotFoundException("Company not found.");
        var code = NormalizeCode(r.CompanyCode);
        await EnsureCodeFreeAsync(id, code, ct);
        await EnsureLogoAsync(r.LogoMediaId, ct);
        c.CompanyCode = code;
        if (r.IsActive is bool a) c.IsActive = a;
        Apply(c, r);
        c.UpdatedAt = DateTime.UtcNow; c.UpdatedById = actingUserId;
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<CompanyDto> SetStatusAsync(int id, bool isActive, int? actingUserId, CancellationToken ct)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.CompanyId == id, ct) ?? throw new NotFoundException("Company not found.");
        c.IsActive = isActive; c.UpdatedAt = DateTime.UtcNow; c.UpdatedById = actingUserId;
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var c = await db.Companies.FirstOrDefaultAsync(x => x.CompanyId == id, ct) ?? throw new NotFoundException("Company not found.");
        var users = await db.Users.CountAsync(u => u.CompanyId == id, ct);
        if (users > 0)
            throw new ConflictException($"This company is referenced by {users} user(s) and cannot be deleted. Deactivate the company instead, or reassign its users first.");
        db.Companies.Remove(c);
        await db.SaveChangesAsync(ct);
    }

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
    private static string? Blank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static void Apply(Company c, CompanyRequest r)
    {
        c.CompanyName = r.CompanyName.Trim();
        c.Email = Blank(r.Email)?.ToLowerInvariant(); c.Phone = Blank(r.Phone); c.Website = Blank(r.Website);
        c.AddressLine1 = Blank(r.AddressLine1); c.AddressLine2 = Blank(r.AddressLine2);
        c.City = Blank(r.City); c.State = Blank(r.State); c.Country = Blank(r.Country); c.PostalCode = Blank(r.PostalCode);
        c.LogoMediaId = r.LogoMediaId;
    }

    private async Task EnsureCodeFreeAsync(int? selfId, string code, CancellationToken ct)
    {
        if (await db.Companies.AnyAsync(x => x.CompanyId != selfId && x.CompanyCode == code, ct))
            throw new ConflictException("A company with this code already exists.");
    }

    private async Task EnsureLogoAsync(int? mediaId, CancellationToken ct)
    {
        if (mediaId is int m && !await db.MediaFiles.AnyAsync(x => x.Id == m, ct)) throw new BadRequestException("Selected logo does not exist in the media library.");
    }
}
