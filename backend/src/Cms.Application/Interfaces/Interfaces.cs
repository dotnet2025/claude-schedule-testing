using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Company> Companies { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Page> Pages { get; }
    DbSet<Post> Posts { get; }
    DbSet<Category> Categories { get; }
    DbSet<Tag> Tags { get; }
    DbSet<MediaFile> MediaFiles { get; }
    DbSet<WebsiteSettings> Settings { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public interface IFileStorage
{
    Task SaveAsync(string storedName, Stream content, CancellationToken ct);
    Task<Stream?> OpenReadAsync(string storedName, CancellationToken ct);
    Task DeleteAsync(string storedName, CancellationToken ct);
}

public interface ITokenService
{
    (string token, DateTime expiresAt) CreateAccessToken(User user);
    string GenerateRefreshToken();
    string HashToken(string token);
    TimeSpan RefreshLifetime { get; }
}

public interface IHtmlSanitizerService
{
    string Sanitize(string? html);
}

public interface ICurrentUser
{
    int? UserId { get; }
}
