using Cms.Domain.Enums;

namespace Cms.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    /// <summary>Unique, stored lower-case (case-insensitive uniqueness).</summary>
    public string Username { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    /// <summary>Derived from FirstName + LastName on every write; kept as a column so author names stay queryable.</summary>
    public string DisplayName { get; set; } = "";
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = Constants.Roles.Editor;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public int? CompanyId { get; set; }
    public Company? Company { get; set; }
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = [];

    public static string BuildDisplayName(string first, string last) => $"{first.Trim()} {last.Trim()}".Trim();
}

public class Company
{
    public int CompanyId { get; set; }
    public string CompanyCode { get; set; } = "";
    public string CompanyName { get; set; } = "";
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public int? LogoMediaId { get; set; }
    public MediaFile? LogoMedia { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
    public List<User> Users { get; set; } = [];
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string TokenHash { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByHash { get; set; }
    public bool IsActive => RevokedAt == null && ExpiresAt > DateTime.UtcNow;
}

public class MediaFile
{
    public int Id { get; set; }
    public string OriginalName { get; set; } = "";
    public string StoredName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? UploadedById { get; set; }
    public User? UploadedBy { get; set; }
}

public abstract class ContentBase
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Content { get; set; } = "";
    public int? FeaturedImageId { get; set; }
    public MediaFile? FeaturedImage { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
    /// <summary>Optimistic concurrency token.</summary>
    public Guid ConcurrencyStamp { get; set; } = Guid.NewGuid();
}

public class Page : ContentBase
{
    public string? ShortDescription { get; set; }
}

public class Post : ContentBase
{
    public string? Excerpt { get; set; }
    public List<Category> Categories { get; set; } = [];
    public List<Tag> Tags { get; set; } = [];
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string? Description { get; set; }
    public List<Post> Posts { get; set; } = [];
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class WebsiteSettings
{
    public int Id { get; set; } = 1;
    public string WebsiteName { get; set; } = "My CMS";
    public string? Description { get; set; }
    public int? LogoId { get; set; }
    public int? FaviconId { get; set; }
    public string? ContactEmail { get; set; }
    public string? FooterText { get; set; }
    public string? DefaultSeoTitle { get; set; }
    public string? DefaultSeoDescription { get; set; }
}
