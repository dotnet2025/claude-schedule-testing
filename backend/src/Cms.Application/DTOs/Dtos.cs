using System.ComponentModel.DataAnnotations;

namespace Cms.Application.DTOs;

/// <summary>Validates that an optional string is an absolute http/https URL.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter | AttributeTargets.Field)]
public sealed class HttpUrlAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
        => value is null or "" || (value is string s && Uri.TryCreate(s.Trim(), UriKind.Absolute, out var u) && (u.Scheme == Uri.UriSchemeHttp || u.Scheme == Uri.UriSchemeHttps));
}

/// <summary>Sign in with e-mail OR username. <c>Email</c> may carry either; <c>Username</c> is an explicit alias.</summary>
public record LoginRequest([MaxLength(256)] string? Email, [MaxLength(100)] string? Username, [Required, MaxLength(256)] string Password);
public record RefreshRequest(string? RefreshToken);
public record ChangePasswordRequest([Required] string CurrentPassword, [Required, MinLength(8), MaxLength(128)] string NewPassword);
public record UserDto(int Id, string Email, string Username, string FirstName, string LastName, string DisplayName, string? Phone,
    string Role, bool IsActive, int? CompanyId, string? CompanyName, DateTime? LastLoginAt, DateTime CreatedAt, DateTime UpdatedAt,
    int? CreatedById, int? UpdatedById);
public record AuthResponse(string AccessToken, DateTime ExpiresAt, string RefreshToken, UserDto User);

public record CreateUserRequest(
    [Required, StringLength(100, MinimumLength = 1)] string FirstName,
    [Required, StringLength(100, MinimumLength = 1)] string LastName,
    [Required, StringLength(100, MinimumLength = 3), RegularExpression(@"^[A-Za-z0-9._\-]+$", ErrorMessage = "Username may contain letters, digits, '.', '_' and '-' only.")] string Username,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [MaxLength(25)] string? Phone,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [Required] string Role,
    bool? IsActive,
    int? CompanyId);
/// <summary>Profile data only. Role, status and password are changed through their dedicated admin endpoints.</summary>
public record UpdateUserRequest(
    [Required, StringLength(100, MinimumLength = 1)] string FirstName,
    [Required, StringLength(100, MinimumLength = 1)] string LastName,
    [Required, StringLength(100, MinimumLength = 3), RegularExpression(@"^[A-Za-z0-9._\-]+$", ErrorMessage = "Username may contain letters, digits, '.', '_' and '-' only.")] string Username,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [MaxLength(25)] string? Phone,
    int? CompanyId);
public record SetStatusRequest(bool IsActive);
public record SetRoleRequest([Required] string Role);
public record ResetPasswordRequest([Required, MinLength(8), MaxLength(128)] string NewPassword);

public record CompanyRequest(
    [Required, StringLength(30, MinimumLength = 1)] string CompanyCode,
    [Required, StringLength(200, MinimumLength = 1)] string CompanyName,
    [EmailAddress, MaxLength(256)] string? Email,
    [MaxLength(25)] string? Phone,
    [HttpUrl(ErrorMessage = "Website must be a valid http or https URL."), MaxLength(500)] string? Website,
    [MaxLength(250)] string? AddressLine1,
    [MaxLength(250)] string? AddressLine2,
    [MaxLength(100)] string? City,
    [MaxLength(100)] string? State,
    [MaxLength(100)] string? Country,
    [MaxLength(20)] string? PostalCode,
    int? LogoMediaId,
    bool? IsActive);
public record CompanyDto(int CompanyId, string CompanyCode, string CompanyName, string? Email, string? Phone, string? Website,
    string? AddressLine1, string? AddressLine2, string? City, string? State, string? Country, string? PostalCode,
    int? LogoMediaId, string? LogoUrl, bool IsActive, DateTime CreatedAt, DateTime UpdatedAt,
    int? CreatedById, string? CreatedByName, int? UpdatedById, string? UpdatedByName, int UserCount);

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
