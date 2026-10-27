using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Cms.Api.Tests;

public class AuthTests(CmsFactory f) : ApiTestBase(f)
{
    [Fact] // TC-AUTH-001
    public async Task Login_with_valid_admin_returns_tokens_and_no_password_hash()
    {
        var r = await Anonymous().PostAsJsonAsync("/api/auth/login", new { email = CmsFactory.AdminEmail, password = CmsFactory.AdminPassword });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var body = await r.Content.ReadAsStringAsync();
        Assert.DoesNotContain("passwordHash", body, StringComparison.OrdinalIgnoreCase);
        var auth = System.Text.Json.JsonSerializer.Deserialize<AuthDto>(body, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web))!;
        Assert.False(string.IsNullOrEmpty(auth.AccessToken));
        Assert.Equal("Admin", auth.User.Role);
    }

    [Theory] // TC-AUTH-002/003/004
    [InlineData("admin@test.local", "wrong-password")]
    [InlineData("nobody@test.local", "Admin123!test")]
    [InlineData("", "")]
    public async Task Login_with_invalid_credentials_fails(string email, string password)
    {
        var r = await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password });
        Assert.True(r.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.BadRequest);
    }

    [Fact] // TC-AUTH-005
    public async Task Protected_endpoint_without_token_is_401()
        => Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().GetAsync("/api/auth/me")).StatusCode);

    [Fact] // TC-AUTH-006
    public async Task Tampered_token_is_rejected()
    {
        var auth = await LoginAsync(CmsFactory.AdminEmail, CmsFactory.AdminPassword);
        var c = Anonymous();
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken[..^3] + "abc");
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact] // TC-AUTH-007
    public async Task Expired_token_is_rejected()
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("test-signing-key-test-signing-key-0123456789"));
        var jwt = new JwtSecurityToken("cms-api", "cms-clients",
            [new System.Security.Claims.Claim("sub", "1"), new System.Security.Claims.Claim("role", "Admin")],
            DateTime.UtcNow.AddHours(-2), DateTime.UtcNow.AddHours(-1), new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        var c = Anonymous();
        c.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(jwt));
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact] // TC-AUTH-008
    public async Task Me_returns_current_user()
    {
        var c = await AdminClient();
        var me = await c.GetFromJsonAsync<UserInfo>("/api/auth/me");
        Assert.Equal(CmsFactory.AdminEmail, me!.Email);
    }

    [Fact] // TC-AUTH-009
    public async Task Refresh_rotates_token_and_old_token_cannot_be_reused()
    {
        var auth = await LoginAsync(CmsFactory.AdminEmail, CmsFactory.AdminPassword);
        var c = Anonymous();
        var r1 = await c.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, r1.StatusCode);
        var next = (await r1.Content.ReadFromJsonAsync<AuthDto>())!;
        Assert.NotEqual(auth.RefreshToken, next.RefreshToken);
        var reuse = await Anonymous().PostAsJsonAsync("/api/auth/refresh", new { refreshToken = auth.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
        // reuse detection revokes the family, so the rotated token is dead too
        var after = await Anonymous().PostAsJsonAsync("/api/auth/refresh", new { refreshToken = next.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, after.StatusCode);
    }

    [Fact] // TC-AUTH-010
    public async Task Invalid_refresh_token_is_401()
        => Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/refresh", new { refreshToken = "garbage" })).StatusCode);

    [Fact] // TC-AUTH-011
    public async Task Logout_revokes_refresh_token()
    {
        var auth = await LoginAsync(CmsFactory.AdminEmail, CmsFactory.AdminPassword);
        var c = Anonymous();
        Assert.Equal(HttpStatusCode.NoContent, (await c.PostAsJsonAsync("/api/auth/logout", new { refreshToken = auth.RefreshToken })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.PostAsJsonAsync("/api/auth/refresh", new { refreshToken = auth.RefreshToken })).StatusCode);
    }

    [Fact] // TC-AUTH-012
    public async Task Change_password_requires_correct_current_password_and_enforces_rules()
    {
        var admin = await AdminClient();
        var email = $"pw{Guid.NewGuid():N}@test.local";
        (await admin.PostAsJsonAsync("/api/users", new { email, displayName = "Pw", password = "Initial123!", role = "Editor" })).EnsureSuccessStatusCode();
        var c = await ClientFor(email, "Initial123!");
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/auth/change-password", new { currentPassword = "nope", newPassword = "NewPass123!" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/auth/change-password", new { currentPassword = "Initial123!", newPassword = "short" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/auth/change-password", new { currentPassword = "Initial123!", newPassword = "onlyletters" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await c.PostAsJsonAsync("/api/auth/change-password", new { currentPassword = "Initial123!", newPassword = "NewPass123!" })).StatusCode);
        await LoginAsync(email, "NewPass123!");
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "Initial123!" })).StatusCode);
    }
}
