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
public record UserInfo(int Id, string Email, string DisplayName, string Role, bool IsActive);
public record ContentInfo(int Id, string Title, string Slug, string Content, string Status, Guid ConcurrencyStamp);
public record Paged<T>(List<T> Items, int Total, int Page, int PageSize);

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
        var r = await admin.PostAsJsonAsync("/api/users", new { email, displayName = "Ed", password = "Editor123!", role = "Editor" });
        r.EnsureSuccessStatusCode();
        return await ClientFor(email, "Editor123!");
    }

    protected static string Unique(string prefix = "t") => $"{prefix}-{Guid.NewGuid():N}"[..20];
}
