using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

public class AuthService(IAppDbContext db, ITokenService tokens, IPasswordHasher<User> hasher)
{
    public static UserDto ToDto(User u) => new(u.Id, u.Email, u.Username, u.FirstName, u.LastName, u.DisplayName, u.Phone, u.Role, u.IsActive,
        u.CompanyId, u.Company?.CompanyName, u.LastLoginAt, u.CreatedAt, u.UpdatedAt, u.CreatedById, u.UpdatedById);

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var identifier = (req.Email ?? req.Username)?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(identifier)) throw new BadRequestException("Email or username is required.");
        var user = await db.Users.Include(u => u.Company).FirstOrDefaultAsync(u => u.Email == identifier || u.Username == identifier, ct);
        // Same message for unknown user / bad password / inactive to avoid enumeration.
        if (user is null || !user.IsActive ||
            hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
            throw new UnauthorizedException("Invalid email or password.");
        user.LastLoginAt = DateTime.UtcNow;
        return await IssueAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string? refreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) throw new UnauthorizedException("Invalid refresh token.");
        var hash = tokens.HashToken(refreshToken);
        var stored = await db.RefreshTokens.Include(r => r.User).ThenInclude(u => u!.Company).FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (stored?.User is null) throw new UnauthorizedException("Invalid refresh token.");
        if (stored.RevokedAt != null)
        {
            // Reuse of a rotated/revoked token: assume theft, revoke the whole family for this user.
            await RevokeAllAsync(stored.UserId, ct);
            throw new UnauthorizedException("Refresh token has been revoked.");
        }
        if (stored.ExpiresAt <= DateTime.UtcNow || !stored.User.IsActive) throw new UnauthorizedException("Refresh token expired.");
        var response = await IssueAsync(stored.User, ct, save: false);
        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedByHash = tokens.HashToken(response.RefreshToken);
        await db.SaveChangesAsync(ct);
        return response;
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;
        var hash = tokens.HashToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (stored is { RevokedAt: null }) { stored.RevokedAt = DateTime.UtcNow; await db.SaveChangesAsync(ct); }
    }

    public async Task<UserDto> MeAsync(int userId, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().Include(x => x.Company).FirstOrDefaultAsync(x => x.Id == userId && x.IsActive, ct)
            ?? throw new UnauthorizedException("User not found or inactive.");
        return ToDto(u);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest req, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new UnauthorizedException("User not found.");
        if (hasher.VerifyHashedPassword(user, user.PasswordHash, req.CurrentPassword) == PasswordVerificationResult.Failed)
            throw new BadRequestException("Current password is incorrect.");
        PasswordRules.Validate(req.NewPassword);
        user.PasswordHash = hasher.HashPassword(user, req.NewPassword);
        await db.SaveChangesAsync(ct);
        await RevokeAllAsync(userId, ct);
    }

    public async Task RevokeAllAsync(int userId, CancellationToken ct)
    {
        var active = await db.RefreshTokens.Where(r => r.UserId == userId && r.RevokedAt == null).ToListAsync(ct);
        foreach (var t in active) t.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task<AuthResponse> IssueAsync(User user, CancellationToken ct, bool save = true)
    {
        var (access, exp) = tokens.CreateAccessToken(user);
        var refresh = tokens.GenerateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken { UserId = user.Id, TokenHash = tokens.HashToken(refresh), ExpiresAt = DateTime.UtcNow.Add(tokens.RefreshLifetime) });
        if (save) await db.SaveChangesAsync(ct);
        return new AuthResponse(access, exp, refresh, ToDto(user));
    }
}

public static class PasswordRules
{
    public static void Validate(string password)
    {
        if (password.Length < 8 || !password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            throw new BadRequestException("Password must be at least 8 characters and contain a letter and a digit.");
    }
}
