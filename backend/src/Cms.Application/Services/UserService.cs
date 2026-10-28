using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Constants;
using Cms.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

/// <summary>User Master: admin-only user management. Credentials (hash, tokens) never leave this service.</summary>
public class UserService(IAppDbContext db, IPasswordHasher<User> hasher, AuthService auth)
{
    private const string LastAdminMessage = "The last active Admin cannot be demoted, deactivated or deleted.";

    public async Task<PagedResult<UserDto>> ListAsync(string? search, string? role, bool? isActive, int? companyId,
        string? sortBy, string? sortDir, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Users.AsNoTracking().Include(u => u.Company).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim().ToLower();
            q = q.Where(u => u.Email.Contains(t) || u.Username.Contains(t) || u.DisplayName.ToLower().Contains(t)
                || u.FirstName.ToLower().Contains(t) || u.LastName.ToLower().Contains(t));
        }
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        if (isActive is bool a) q = q.Where(u => u.IsActive == a);
        if (companyId is int c) q = q.Where(u => u.CompanyId == c);
        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        q = (sortBy?.ToLowerInvariant()) switch
        {
            "name" => desc ? q.OrderByDescending(u => u.DisplayName).ThenBy(u => u.Id) : q.OrderBy(u => u.DisplayName).ThenBy(u => u.Id),
            "username" => desc ? q.OrderByDescending(u => u.Username).ThenBy(u => u.Id) : q.OrderBy(u => u.Username).ThenBy(u => u.Id),
            "role" => desc ? q.OrderByDescending(u => u.Role).ThenBy(u => u.Id) : q.OrderBy(u => u.Role).ThenBy(u => u.Id),
            "created" or "createdat" => desc ? q.OrderByDescending(u => u.CreatedAt).ThenBy(u => u.Id) : q.OrderBy(u => u.CreatedAt).ThenBy(u => u.Id),
            "lastlogin" or "lastloginat" => desc ? q.OrderByDescending(u => u.LastLoginAt).ThenBy(u => u.Id) : q.OrderBy(u => u.LastLoginAt).ThenBy(u => u.Id),
            _ => desc ? q.OrderByDescending(u => u.Email).ThenBy(u => u.Id) : q.OrderBy(u => u.Email).ThenBy(u => u.Id),
        };
        var total = await q.CountAsync(ct);
        var items = await q.Skip((p - 1) * s).Take(s).ToListAsync(ct);
        return new(items.Select(AuthService.ToDto).ToList(), total, p, s);
    }

    public async Task<UserDto> GetAsync(int id, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().Include(x => x.Company).FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        return AuthService.ToDto(u);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest r, int? actingUserId, CancellationToken ct)
    {
        EnsureValidRole(r.Role);
        PasswordRules.Validate(r.Password);
        var email = r.Email.Trim().ToLowerInvariant();
        var username = r.Username.Trim().ToLowerInvariant();
        await EnsureUniqueAsync(null, email, username, ct);
        await EnsureCompanyAsync(r.CompanyId, null, ct);
        var now = DateTime.UtcNow;
        var u = new User
        {
            Email = email, Username = username, FirstName = r.FirstName.Trim(), LastName = r.LastName.Trim(),
            Phone = NullIfBlank(r.Phone), Role = r.Role, IsActive = r.IsActive ?? true, CompanyId = r.CompanyId,
            CreatedAt = now, UpdatedAt = now, CreatedById = actingUserId, UpdatedById = actingUserId,
        };
        u.DisplayName = User.BuildDisplayName(u.FirstName, u.LastName);
        u.PasswordHash = hasher.HashPassword(u, r.Password);
        db.Users.Add(u);
        await db.SaveChangesAsync(ct);
        return await GetAsync(u.Id, ct);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest r, int? actingUserId, CancellationToken ct)
    {
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        var email = r.Email.Trim().ToLowerInvariant();
        var username = r.Username.Trim().ToLowerInvariant();
        await EnsureUniqueAsync(id, email, username, ct);
        await EnsureCompanyAsync(r.CompanyId, u.CompanyId, ct);
        u.Email = email; u.Username = username; u.FirstName = r.FirstName.Trim(); u.LastName = r.LastName.Trim();
        u.DisplayName = User.BuildDisplayName(u.FirstName, u.LastName);
        u.Phone = NullIfBlank(r.Phone); u.CompanyId = r.CompanyId;
        Touch(u, actingUserId);
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<UserDto> SetStatusAsync(int id, bool isActive, int? actingUserId, CancellationToken ct)
    {
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        if (!isActive && u.IsActive)
        {
            if (id == actingUserId) throw new BadRequestException("You cannot deactivate your own account.");
            if (u.Role == Roles.Admin) await EnsureAnotherAdmin(id, ct);
        }
        var changed = u.IsActive != isActive;
        u.IsActive = isActive;
        Touch(u, actingUserId);
        await db.SaveChangesAsync(ct);
        if (changed && !isActive) await auth.RevokeAllAsync(id, ct);
        return await GetAsync(id, ct);
    }

    public async Task<UserDto> SetRoleAsync(int id, string role, int? actingUserId, CancellationToken ct)
    {
        EnsureValidRole(role);
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        if (u.Role == Roles.Admin && role != Roles.Admin && u.IsActive) await EnsureAnotherAdmin(id, ct);
        var changed = u.Role != role;
        u.Role = role;
        Touch(u, actingUserId);
        await db.SaveChangesAsync(ct);
        // Existing refresh tokens must not mint access tokens for the old role without a fresh sign-in.
        if (changed) await auth.RevokeAllAsync(id, ct);
        return await GetAsync(id, ct);
    }

    public async Task ResetPasswordAsync(int id, string newPassword, int? actingUserId, CancellationToken ct)
    {
        PasswordRules.Validate(newPassword);
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        u.PasswordHash = hasher.HashPassword(u, newPassword);
        Touch(u, actingUserId);
        await db.SaveChangesAsync(ct);
        await auth.RevokeAllAsync(id, ct);
    }

    public async Task DeleteAsync(int id, int? actingUserId, CancellationToken ct)
    {
        if (id == actingUserId) throw new BadRequestException("You cannot delete your own account.");
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        if (u.Role == Roles.Admin && u.IsActive) await EnsureAnotherAdmin(id, ct);
        var referenced = await db.Pages.AnyAsync(x => x.CreatedById == id || x.UpdatedById == id, ct)
            || await db.Posts.AnyAsync(x => x.CreatedById == id || x.UpdatedById == id, ct)
            || await db.MediaFiles.AnyAsync(x => x.UploadedById == id, ct)
            || await db.Companies.AnyAsync(x => x.CreatedById == id || x.UpdatedById == id, ct)
            || await db.Users.AnyAsync(x => x.Id != id && (x.CreatedById == id || x.UpdatedById == id), ct);
        if (referenced)
            throw new ConflictException("This user is referenced by content, media or audit records and cannot be deleted. Deactivate the user instead.");
        db.Users.Remove(u);
        await db.SaveChangesAsync(ct);
    }

    private static void EnsureValidRole(string role)
    {
        if (!Roles.All.Contains(role)) throw new BadRequestException("Role must be Admin or Editor.");
    }

    private static void Touch(User u, int? actingUserId) { u.UpdatedAt = DateTime.UtcNow; u.UpdatedById = actingUserId; }
    private static string? NullIfBlank(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private async Task EnsureUniqueAsync(int? selfId, string email, string username, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(u => u.Id != selfId && u.Email == email, ct)) throw new ConflictException("A user with this email already exists.");
        if (await db.Users.AnyAsync(u => u.Id != selfId && u.Username == username, ct)) throw new ConflictException("A user with this username already exists.");
    }

    private async Task EnsureCompanyAsync(int? companyId, int? currentCompanyId, CancellationToken ct)
    {
        if (companyId is not int cid || cid == currentCompanyId) return;
        var c = await db.Companies.AsNoTracking().FirstOrDefaultAsync(x => x.CompanyId == cid, ct) ?? throw new BadRequestException("Selected company does not exist.");
        if (!c.IsActive) throw new BadRequestException("Selected company is inactive.");
    }

    private async Task EnsureAnotherAdmin(int excludingId, CancellationToken ct)
    {
        if (!await db.Users.AnyAsync(x => x.Id != excludingId && x.Role == Roles.Admin && x.IsActive, ct))
            throw new ConflictException(LastAdminMessage);
    }
}
