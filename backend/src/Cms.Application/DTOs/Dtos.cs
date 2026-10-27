using System.ComponentModel.DataAnnotations;

namespace Cms.Application.DTOs;

public record LoginRequest([Required, EmailAddress, MaxLength(256)] string Email, [Required, MaxLength(256)] string Password);
public record RefreshRequest(string? RefreshToken);
public record ChangePasswordRequest([Required] string CurrentPassword, [Required, MinLength(8), MaxLength(128)] string NewPassword);
public record UserDto(int Id, string Email, string DisplayName, string Role, bool IsActive, DateTime CreatedAt);
public record AuthResponse(string AccessToken, DateTime ExpiresAt, string RefreshToken, UserDto User);

public record CreateUserRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, StringLength(100, MinimumLength = 1)] string DisplayName,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required] string Role);
public record UpdateUserRequest(
    [Required, StringLength(100, MinimumLength = 1)] string DisplayName,
    [Required] string Role,
    bool IsActive,
    [MinLength(8), MaxLength(128)] string? NewPassword);

public record ContentRequest(
    [Required, StringLength(200, MinimumLength = 1)] string Title,
    [MaxLength(200)] string? Slug,
    [MaxLength(500000)] string? Content,
    [MaxLength(1000)] string? ShortDescription,
    [MaxLength(1000)] string? Excerpt,
    int? FeaturedImageId,
    [MaxLength(200)] string? MetaTitle,
    [MaxLength(400)] string? MetaDescription,
    List<int>? CategoryIds,
    List<int>? TagIds,
    Guid? ConcurrencyStamp);

public record ContentSummaryDto(int Id, string Title, string Slug, string Status, DateTime CreatedAt, DateTime UpdatedAt, DateTime? PublishedAt, string? Author);
public record ContentDto(int Id, string Title, string Slug, string Content, string? ShortDescription, string? Excerpt,
    int? FeaturedImageId, string? FeaturedImageUrl, string? MetaTitle, string? MetaDescription, string Status,
    DateTime CreatedAt, DateTime UpdatedAt, DateTime? PublishedAt, string? CreatedBy, string? UpdatedBy,
    List<TaxonomyDto> Categories, List<TaxonomyDto> Tags, Guid ConcurrencyStamp);

public record TaxonomyRequest([Required, StringLength(100, MinimumLength = 1)] string Name, [MaxLength(100)] string? Slug, [MaxLength(500)] string? Description);
public record TaxonomyDto(int Id, string Name, string Slug, string? Description, int PostCount);

public record MediaDto(int Id, string OriginalName, string ContentType, long Size, string Url, DateTime CreatedAt);

public record SettingsDto(
    [Required, StringLength(100, MinimumLength = 1)] string WebsiteName,
    [MaxLength(500)] string? Description, int? LogoId, int? FaviconId, string? LogoUrl, string? FaviconUrl,
    [EmailAddress, MaxLength(256)] string? ContactEmail, [MaxLength(500)] string? FooterText,
    [MaxLength(200)] string? DefaultSeoTitle, [MaxLength(400)] string? DefaultSeoDescription);

public record DashboardDto(int TotalPages, int TotalPosts, int PublishedPosts, int DraftPosts, int MediaFiles, int? TotalUsers, List<RecentContentDto> Recent);
public record RecentContentDto(int Id, string Type, string Title, string Status, DateTime UpdatedAt);

public record PublicContentDto(int Id, string Title, string Slug, string Content, string? Summary, string? FeaturedImageUrl,
    string? MetaTitle, string? MetaDescription, DateTime? PublishedAt, string? Author, List<TaxonomyDto> Categories, List<TaxonomyDto> Tags);
public record PublicSummaryDto(int Id, string Title, string Slug, string? Summary, string? FeaturedImageUrl, DateTime? PublishedAt, string? Author);
