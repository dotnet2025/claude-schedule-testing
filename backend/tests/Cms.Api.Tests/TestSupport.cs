using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace Cms.Api.Tests;

public class CmsFactory : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@test.local";
    public const string AdminPassword = "Admin123!test";
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "cms-tests-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(_dir);
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, cfg) => cfg.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = $"Data Source={Path.Combine(_dir, "test.db")}",
            ["Storage:RootPath"] = Path.Combine(_dir, "uploads"),
            ["Jwt:SigningKey"] = "test-signing-key-test-signing-key-0123456789",
            ["Seed:Enabled"] = "true",
            ["Seed:AdminEmail"] = AdminEmail,
            ["Seed:AdminPassword"] = AdminPassword,
            ["RateLimit:LoginPermitPerMinute"] = "1000",
        }));
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try { Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools(); Directory.Delete(_dir, true); } catch { /* best effort */ }
    }
}

public record AuthDto(string AccessToken, DateTime ExpiresAt, string RefreshToken, UserInfo User);
public record UserInfo(int Id, string Email, string Username, string FirstName, string LastName, string DisplayName, string? Phone, string Role, bool IsActive,
    int? CompanyId, string? CompanyName, DateTime? LastLoginAt, DateTime CreatedAt, DateTime UpdatedAt, int? CreatedById, int? UpdatedById);
public record CompanyInfo(int CompanyId, string CompanyCode, string CompanyName, string? Email, string? Phone, string? Website, string? AddressLine1,
    string? AddressLine2, string? City, string? State, string? Country, string? PostalCode, int? LogoMediaId, string? LogoUrl, bool IsActive,
    DateTime CreatedAt, DateTime UpdatedAt, int? CreatedById, string? CreatedByName, int? UpdatedById, string? UpdatedByName, int UserCount);
public record ContentInfo(int Id, string Title, string Slug, string Content, string Status, Guid ConcurrencyStamp);
public record Paged<T>(List<T> Items, int Total, int Page, int PageSize, int TotalPages = 0);

public static class HttpClientExtensions
{
    public static Task<HttpResponseMessage> PatchJsonAsync<T>(this HttpClient c, string url, T body)
        => c.PatchAsync(url, JsonContent.Create(body));
}

public abstract class ApiTestBase : IClassFixture<CmsFactory>
{
    protected readonly CmsFactory Factory;
    protected ApiTestBase(CmsFactory f) => Factory = f;

    protected HttpClient Anonymous() => Factory.CreateClient();

    protected async Task<AuthDto> LoginAsync(string email, string password)
    {
        var r = await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password });
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<AuthDto>())!;
    }

    protected async Task<HttpClient> AdminClient() => await ClientFor(CmsFactory.AdminEmail, CmsFactory.AdminPassword);

    protected async Task<HttpClient> ClientFor(string email, string password)
    {
        var auth = await LoginAsync(email, password);
        var c = Factory.CreateClient();
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);
        return c;
    }

    protected async Task<HttpClient> EditorClient()
    {
        var admin = await AdminClient();
        var email = $"editor{Guid.NewGuid():N}@test.local";
        var r = await admin.PostAsJsonAsync("/api/users", NewUser(email));
        r.EnsureSuccessStatusCode();
        return await ClientFor(email, "Editor123!");
    }

    /// <summary>Request body for POST /api/users with sensible defaults.</summary>
    protected static object NewUser(string email, string role = "Editor", string password = "Editor123!", string? username = null, int? companyId = null, string first = "Test", string last = "User")
        => new { firstName = first, lastName = last, username = username ?? ("u" + Guid.NewGuid().ToString("N")[..12]), email, phone = (string?)null, password, role, companyId };

    protected async Task<UserInfo> CreateUserAsync(HttpClient admin, string? email = null, string role = "Editor", string password = "Editor123!", int? companyId = null)
    {
        var r = await admin.PostAsJsonAsync("/api/users", NewUser(email ?? $"u{Guid.NewGuid():N}@test.local", role, password, companyId: companyId));
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<UserInfo>())!;
    }

    protected static string Unique(string prefix = "t") => $"{prefix}-{Guid.NewGuid():N}"[..20];
}
