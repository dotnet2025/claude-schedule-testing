using System.Net;
using System.Net.Http.Json;

namespace Cms.Api.Tests;

public class AuthorizationTests(CmsFactory f) : ApiTestBase(f)
{
    [Theory] // TC-AUTHZ-001
    [InlineData("/api/pages")] [InlineData("/api/posts")] [InlineData("/api/media")] [InlineData("/api/users")]
    [InlineData("/api/dashboard")] [InlineData("/api/categories")] [InlineData("/api/tags")]
    public async Task Anonymous_cannot_access_admin_endpoints(string url)
        => Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().GetAsync(url)).StatusCode);

    [Fact] // TC-AUTHZ-002
    public async Task Editor_cannot_manage_users_or_settings()
    {
        var ed = await EditorClient();
        Assert.Equal(HttpStatusCode.Forbidden, (await ed.GetAsync("/api/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ed.PostAsJsonAsync("/api/users", new { email = "x@y.zz", displayName = "x", password = "Passw0rd!", role = "Admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ed.DeleteAsync("/api/users/1")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await ed.PutAsJsonAsync("/api/settings", new { websiteName = "Hacked" })).StatusCode);
    }

    [Fact] // TC-AUTHZ-003
    public async Task Editor_can_manage_content()
    {
        var ed = await EditorClient();
        Assert.Equal(HttpStatusCode.OK, (await ed.GetAsync("/api/pages")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await ed.PostAsJsonAsync("/api/pages", new { title = "Editor page " + Unique() })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await ed.PostAsJsonAsync("/api/categories", new { name = "Cat " + Unique() })).StatusCode);
    }

    [Fact] // TC-AUTHZ-004
    public async Task Admin_can_manage_users_and_settings()
    {
        var admin = await AdminClient();
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/users")).StatusCode);
        var r = await admin.PutAsJsonAsync("/api/settings", new { websiteName = "Test Site", footerText = "foot" });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var pub = await Anonymous().GetFromJsonAsync<System.Text.Json.JsonElement>("/api/settings");
        Assert.Equal("Test Site", pub.GetProperty("websiteName").GetString());
    }

    [Fact] // TC-AUTHZ-005
    public async Task Dashboard_hides_user_count_from_editor()
    {
        var ed = await EditorClient();
        var d = await ed.GetFromJsonAsync<System.Text.Json.JsonElement>("/api/dashboard");
        Assert.Equal(System.Text.Json.JsonValueKind.Null, d.GetProperty("totalUsers").ValueKind);
        var a = await (await AdminClient()).GetFromJsonAsync<System.Text.Json.JsonElement>("/api/dashboard");
        Assert.True(a.GetProperty("totalUsers").GetInt32() >= 1);
    }

    [Fact] // TC-USR-001..004
    public async Task Last_active_admin_is_protected_and_users_can_be_managed()
    {
        var admin = await AdminClient();
        var me = (await admin.GetFromJsonAsync<UserInfo>("/api/auth/me"))!;
        // Only one admin exists in a fresh DB scope; demoting self must fail while no other active admin exists.
        var all = await admin.GetFromJsonAsync<Paged<UserInfo>>("/api/users?pageSize=100");
        var otherAdmins = all!.Items.Count(u => u.Role == "Admin" && u.IsActive && u.Id != me.Id);
        if (otherAdmins == 0)
        {
            Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/users/{me.Id}", new { displayName = "Admin", role = "Editor", isActive = true })).StatusCode);
            Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/users/{me.Id}", new { displayName = "Admin", role = "Admin", isActive = false })).StatusCode);
        }
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.DeleteAsync($"/api/users/{me.Id}")).StatusCode);

        var email = $"u{Guid.NewGuid():N}@test.local";
        var created = await admin.PostAsJsonAsync("/api/users", new { email, displayName = "U", password = "Passw0rd!", role = "Editor" });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.DoesNotContain("password", (await created.Content.ReadAsStringAsync()), StringComparison.OrdinalIgnoreCase);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsJsonAsync("/api/users", new { email, displayName = "U", password = "Passw0rd!", role = "Editor" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", new { email = "not-an-email", displayName = "U", password = "Passw0rd!", role = "Editor" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", new { email = "r@test.local", displayName = "U", password = "Passw0rd!", role = "Root" })).StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<UserInfo>())!.Id;
        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/users/{id}", new { displayName = "U2", role = "Editor", isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "Passw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/users/{id}")).StatusCode);
    }
}
