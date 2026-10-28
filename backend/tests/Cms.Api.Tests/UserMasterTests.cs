using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Cms.Api.Tests;

/// <summary>User Master (TC-USR-*). Admin-only management API, uniqueness, status/role rules, password reset, secrecy of credentials.</summary>
public class UserMasterTests(CmsFactory f) : ApiTestBase(f)
{
    private static string Mail() => $"u{Guid.NewGuid():N}@test.local";

    [Fact] // TC-USR-001
    public async Task Create_valid_user_returns_201_with_derived_display_name_and_audit()
    {
        var admin = await AdminClient();
        var me = (await admin.GetFromJsonAsync<UserInfo>("/api/auth/me"))!;
        var email = Mail();
        var r = await admin.PostAsJsonAsync("/api/users", NewUser(email, username: "Jane.Doe", first: "Jane", last: "Doe"));
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        Assert.NotNull(r.Headers.Location);
        var u = (await r.Content.ReadFromJsonAsync<UserInfo>())!;
        Assert.Equal("Jane Doe", u.DisplayName);
        Assert.Equal("jane.doe", u.Username); // stored lower-case
        Assert.Equal(email, u.Email);
        Assert.True(u.IsActive);
        Assert.Equal(me.Id, u.CreatedById);
        Assert.Null(u.LastLoginAt);
    }

    [Theory] // TC-USR-002
    [InlineData("firstName")] [InlineData("lastName")] [InlineData("username")] [InlineData("email")] [InlineData("password")]
    public async Task Create_rejects_missing_required_field(string field)
    {
        var admin = await AdminClient();
        var body = new Dictionary<string, object?>
        {
            ["firstName"] = "A", ["lastName"] = "B", ["username"] = "user" + Guid.NewGuid().ToString("N")[..8], ["email"] = Mail(), ["password"] = "Passw0rd!", ["role"] = "Editor",
        };
        body.Remove(field);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", body)).StatusCode);
    }

    [Fact] // TC-USR-003
    public async Task Create_rejects_duplicate_email_and_username_case_insensitively()
    {
        var admin = await AdminClient();
        var email = Mail();
        var first = await admin.PostAsJsonAsync("/api/users", NewUser(email, username: "dupe.user"));
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsJsonAsync("/api/users", NewUser(email.ToUpperInvariant()))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PostAsJsonAsync("/api/users", NewUser(Mail(), username: "DUPE.USER"))).StatusCode);
    }

    [Theory] // TC-USR-004
    [InlineData("not-an-email", "validuser", "Passw0rd!", "Editor")]
    [InlineData("a@test.local", "ab", "Passw0rd!", "Editor")]            // username too short
    [InlineData("a@test.local", "bad name!", "Passw0rd!", "Editor")]     // illegal characters
    [InlineData("a@test.local", "validuser", "short1", "Editor")]        // weak password
    [InlineData("a@test.local", "validuser", "NoDigitsHere", "Editor")]  // no digit
    [InlineData("a@test.local", "validuser", "Passw0rd!", "SuperAdmin")] // unknown role
    public async Task Create_rejects_invalid_input(string email, string username, string password, string role)
    {
        var admin = await AdminClient();
        var r = await admin.PostAsJsonAsync("/api/users", NewUser(email, role, password, username));
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
    }

    [Fact] // TC-USR-005 (boundaries)
    public async Task Field_length_boundaries_are_enforced()
    {
        var admin = await AdminClient();
        Assert.Equal(HttpStatusCode.Created, (await admin.PostAsJsonAsync("/api/users", NewUser(Mail(), first: new string('a', 100), last: new string('b', 100)))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", NewUser(Mail(), first: new string('a', 101)))).StatusCode);
        var longPhone = new { firstName = "A", lastName = "B", username = "ph" + Guid.NewGuid().ToString("N")[..8], email = Mail(), phone = new string('1', 26), password = "Passw0rd!", role = "Editor" };
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", longPhone)).StatusCode);
    }

    [Fact] // TC-USR-006
    public async Task Get_by_id_and_unknown_id()
    {
        var admin = await AdminClient();
        var u = await CreateUserAsync(admin);
        Assert.Equal(u.Email, (await admin.GetFromJsonAsync<UserInfo>($"/api/users/{u.Id}"))!.Email);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync("/api/users/999999")).StatusCode);
    }

    [Fact] // TC-USR-007
    public async Task Update_profile_changes_names_username_email_phone_company_and_audit()
    {
        var admin = await AdminClient();
        var u = await CreateUserAsync(admin);
        var newMail = Mail();
        var r = await admin.PutAsJsonAsync($"/api/users/{u.Id}", new { firstName = "New", lastName = "Name", username = "renamed" + u.Id, email = newMail, phone = "+1 555 0100", companyId = (int?)null });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var upd = (await r.Content.ReadFromJsonAsync<UserInfo>())!;
        Assert.Equal("New Name", upd.DisplayName);
        Assert.Equal(newMail, upd.Email);
        Assert.Equal("+1 555 0100", upd.Phone);
        Assert.True(upd.UpdatedAt >= u.UpdatedAt);
        Assert.NotNull(upd.UpdatedById);
    }

    [Fact] // TC-USR-008
    public async Task Update_rejects_email_or_username_owned_by_another_user_but_allows_keeping_own()
    {
        var admin = await AdminClient();
        var a = await CreateUserAsync(admin);
        var b = await CreateUserAsync(admin);
        object Body(string email, string username) => new { firstName = "X", lastName = "Y", username, email, phone = (string?)null, companyId = (int?)null };
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/users/{b.Id}", Body(a.Email, b.Username))).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/users/{b.Id}", Body(b.Email, a.Username))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/users/{b.Id}", Body(b.Email, b.Username))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PutAsJsonAsync("/api/users/999999", Body(Mail(), "nobody1"))).StatusCode);
    }

    [Fact] // TC-USR-009
    public async Task Put_ignores_role_and_status_fields_so_it_cannot_escalate_privilege()
    {
        var admin = await AdminClient();
        var u = await CreateUserAsync(admin);
        var r = await admin.PutAsJsonAsync($"/api/users/{u.Id}", new { firstName = "X", lastName = "Y", username = u.Username, email = u.Email, role = "Admin", isActive = false });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var after = (await admin.GetFromJsonAsync<UserInfo>($"/api/users/{u.Id}"))!;
        Assert.Equal("Editor", after.Role);
        Assert.True(after.IsActive);
    }

    [Fact] // TC-USR-010
    public async Task Change_role_via_patch_and_validate_value()
    {
        var admin = await AdminClient();
        var u = await CreateUserAsync(admin);
        var r = await admin.PatchJsonAsync($"/api/users/{u.Id}/role", new { role = "Admin" });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.Equal("Admin", (await r.Content.ReadFromJsonAsync<UserInfo>())!.Role);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PatchJsonAsync($"/api/users/{u.Id}/role", new { role = "Root" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PatchJsonAsync("/api/users/999999/role", new { role = "Editor" })).StatusCode);
    }

    [Fact] // TC-USR-011
    public async Task Deactivate_and_reactivate_user_and_inactive_user_cannot_login_or_refresh()
    {
        var admin = await AdminClient();
        var email = Mail();
        var u = await CreateUserAsync(admin, email, password: "Passw0rd!");
        var auth = await LoginAsync(email, "Passw0rd!");

        var off = await admin.PatchJsonAsync($"/api/users/{u.Id}/status", new { isActive = false });
        Assert.Equal(HttpStatusCode.OK, off.StatusCode);
        Assert.False((await off.Content.ReadFromJsonAsync<UserInfo>())!.IsActive);

        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "Passw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/refresh", new { refreshToken = auth.RefreshToken })).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await admin.PatchJsonAsync($"/api/users/{u.Id}/status", new { isActive = true })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "Passw0rd!" })).StatusCode);
    }

    [Fact] // TC-USR-012
    public async Task Last_active_admin_cannot_be_demoted_deactivated_or_deleted()
    {
        var admin = await AdminClient();
        var me = (await admin.GetFromJsonAsync<UserInfo>("/api/auth/me"))!;
        var admins = (await admin.GetFromJsonAsync<Paged<UserInfo>>("/api/users?role=Admin&isActive=true&pageSize=100"))!;
        foreach (var other in admins.Items.Where(x => x.Id != me.Id)) // earlier tests in this class may have created admins
            Assert.Equal(HttpStatusCode.OK, (await admin.PatchJsonAsync($"/api/users/{other.Id}/status", new { isActive = false })).StatusCode);

        Assert.Equal(HttpStatusCode.Conflict, (await admin.PatchJsonAsync($"/api/users/{me.Id}/role", new { role = "Editor" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PatchJsonAsync($"/api/users/{me.Id}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.DeleteAsync($"/api/users/{me.Id}")).StatusCode);

        // with a second active admin the first may be demoted by the second, but never the last one
        var second = await CreateUserAsync(admin, role: "Admin", password: "Passw0rd!");
        var viaSecond = await ClientFor(second.Email, "Passw0rd!");
        Assert.Equal(HttpStatusCode.OK, (await viaSecond.PatchJsonAsync($"/api/users/{me.Id}/role", new { role = "Editor" })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await viaSecond.PatchJsonAsync($"/api/users/{second.Id}/role", new { role = "Editor" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await viaSecond.PatchJsonAsync($"/api/users/{second.Id}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await viaSecond.DeleteAsync($"/api/users/{second.Id}")).StatusCode);
        // restore the seeded admin for the remaining tests
        Assert.Equal(HttpStatusCode.OK, (await viaSecond.PatchJsonAsync($"/api/users/{me.Id}/role", new { role = "Admin" })).StatusCode);
    }

    [Fact] // TC-USR-023
    public async Task Access_token_of_deactivated_or_demoted_user_is_rejected()
    {
        var admin = await AdminClient();
        var email = Mail();
        var u = await CreateUserAsync(admin, email, "Admin", "Passw0rd!");
        var c = await ClientFor(email, "Passw0rd!");
        Assert.Equal(HttpStatusCode.OK, (await c.GetAsync("/api/users")).StatusCode);
        await admin.PatchJsonAsync($"/api/users/{u.Id}/role", new { role = "Editor" });
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/users")).StatusCode); // stale Admin claim
        var c2 = await ClientFor(email, "Passw0rd!");
        Assert.Equal(HttpStatusCode.Forbidden, (await c2.GetAsync("/api/users")).StatusCode);
        await admin.PatchJsonAsync($"/api/users/{u.Id}/status", new { isActive = false });
        Assert.Equal(HttpStatusCode.Unauthorized, (await c2.GetAsync("/api/auth/me")).StatusCode);
    }

    [Fact] // TC-USR-013
    public async Task Reset_password_new_works_old_fails_and_refresh_tokens_are_revoked()
    {
        var admin = await AdminClient();
        var email = Mail();
        var u = await CreateUserAsync(admin, email, password: "OldPassw0rd!");
        var before = await LoginAsync(email, "OldPassw0rd!");

        var r = await admin.PostAsJsonAsync($"/api/users/{u.Id}/reset-password", new { newPassword = "NewPassw0rd!" });
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "OldPassw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "NewPassw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/refresh", new { refreshToken = before.RefreshToken })).StatusCode);
    }

    [Theory] // TC-USR-014
    [InlineData("short1")]
    [InlineData("NoDigitsAtAll")]
    [InlineData("12345678")]
    public async Task Reset_password_rejects_weak_passwords(string pw)
    {
        var admin = await AdminClient();
        var u = await CreateUserAsync(admin);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync($"/api/users/{u.Id}/reset-password", new { newPassword = pw })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsJsonAsync("/api/users/999999/reset-password", new { newPassword = "Passw0rd!x" })).StatusCode);
    }

    [Fact] // TC-USR-015
    public async Task List_supports_search_role_status_sort_and_paging()
    {
        var admin = await AdminClient();
        var tag = "zq" + Guid.NewGuid().ToString("N")[..6];
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Created, (await admin.PostAsJsonAsync("/api/users", NewUser($"{tag}{i}@test.local", i == 0 ? "Admin" : "Editor", first: $"First{tag}{i}", last: "Searchable"))).StatusCode);
        var inactive = (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}1"))!.Items.Single();
        await admin.PatchJsonAsync($"/api/users/{inactive.Id}/status", new { isActive = false });

        var bySearch = (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&pageSize=50"))!;
        Assert.Equal(5, bySearch.Total);
        Assert.Equal(1, (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&role=Admin"))!.Total);
        Assert.Equal(1, (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&isActive=false"))!.Total);
        Assert.Equal(4, (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&isActive=true"))!.Total);
        Assert.Equal(5, (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search=SEARCHABLE&pageSize=50"))!.Items.Count(x => x.Email.StartsWith(tag)));

        var page2 = (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&pageSize=2&page=2&sortBy=email&sortDir=asc"))!;
        Assert.Equal(2, page2.Items.Count);
        Assert.Equal(3, page2.TotalPages);
        Assert.Equal($"{tag}2@test.local", page2.Items[0].Email);
        var desc = (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?search={tag}&sortBy=email&sortDir=desc&pageSize=50"))!;
        Assert.Equal($"{tag}4@test.local", desc.Items[0].Email);
    }

    [Fact] // TC-USR-016
    public async Task Delete_unreferenced_user_succeeds_and_referenced_user_is_refused_with_409()
    {
        var admin = await AdminClient();
        var loose = await CreateUserAsync(admin);
        // users created by the admin are audit-referenced by *their* creator only; `loose` itself is unreferenced
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/users/{loose.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/users/{loose.Id}")).StatusCode);

        var email = Mail();
        var author = await CreateUserAsync(admin, email, password: "Passw0rd!");
        var ed = await ClientFor(email, "Passw0rd!");
        Assert.Equal(HttpStatusCode.Created, (await ed.PostAsJsonAsync("/api/pages", new { title = "Authored " + Unique() })).StatusCode);
        var del = await admin.DeleteAsync($"/api/users/{author.Id}");
        Assert.Equal(HttpStatusCode.Conflict, del.StatusCode);
        Assert.Contains("Deactivate", await del.Content.ReadAsStringAsync());
        // deactivation keeps the author valid
        Assert.Equal(HttpStatusCode.OK, (await admin.PatchJsonAsync($"/api/users/{author.Id}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.DeleteAsync("/api/users/999999")).StatusCode);
    }

    [Fact] // TC-USR-017
    public async Task Login_works_with_username_and_with_email_and_sets_last_login()
    {
        var admin = await AdminClient();
        var email = Mail();
        var r = await admin.PostAsJsonAsync("/api/users", NewUser(email, "Editor", "Passw0rd!", username: "Login.Name"));
        var u = (await r.Content.ReadFromJsonAsync<UserInfo>())!;
        Assert.Null(u.LastLoginAt);
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email = "LOGIN.name", password = "Passw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { username = "login.name", password = "Passw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email, password = "Passw0rd!" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email = "login.name", password = "wrong-Passw0rd!" })).StatusCode);
        var after = (await admin.GetFromJsonAsync<UserInfo>($"/api/users/{u.Id}"))!;
        Assert.NotNull(after.LastLoginAt);
        Assert.True((DateTime.UtcNow - after.LastLoginAt!.Value).TotalMinutes < 5);
    }

    [Fact] // TC-USR-018
    public async Task Editor_is_forbidden_from_every_user_management_endpoint_and_cannot_self_promote()
    {
        var admin = await AdminClient();
        var email = Mail();
        var ed = await CreateUserAsync(admin, email, password: "Passw0rd!");
        var c = await ClientFor(email, "Passw0rd!");
        var other = await CreateUserAsync(admin);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.GetAsync("/api/users")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.GetAsync($"/api/users/{other.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.PostAsJsonAsync("/api/users", NewUser(Mail()))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.PutAsJsonAsync($"/api/users/{ed.Id}", new { firstName = "A", lastName = "B", username = ed.Username, email = ed.Email, role = "Admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.PatchJsonAsync($"/api/users/{ed.Id}/role", new { role = "Admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.PatchJsonAsync($"/api/users/{ed.Id}/status", new { isActive = false })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.PostAsJsonAsync($"/api/users/{other.Id}/reset-password", new { newPassword = "Hacked123!" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await c.DeleteAsync($"/api/users/{other.Id}")).StatusCode);
        Assert.Equal("Editor", (await admin.GetFromJsonAsync<UserInfo>($"/api/users/{ed.Id}"))!.Role);
    }

    [Fact] // TC-USR-019
    public async Task Anonymous_gets_401_on_user_endpoints()
    {
        var c = Anonymous();
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.GetAsync("/api/users/1")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.PostAsJsonAsync("/api/users", NewUser(Mail()))).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.PatchJsonAsync("/api/users/1/role", new { role = "Admin" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await c.PostAsJsonAsync("/api/users/1/reset-password", new { newPassword = "Passw0rd!x" })).StatusCode);
    }

    [Fact] // TC-USR-020
    public async Task Responses_never_contain_password_hash_tokens_or_the_password()
    {
        var admin = await AdminClient();
        var email = Mail();
        var create = await admin.PostAsJsonAsync("/api/users", NewUser(email, "Editor", "S3cretPassw0rd!"));
        var bodies = new List<string> { await create.Content.ReadAsStringAsync(), await admin.GetStringAsync("/api/users?pageSize=100"),
            await admin.GetStringAsync($"/api/users/{(await create.Content.ReadFromJsonAsync<UserInfo>())!.Id}") };
        foreach (var b in bodies)
        {
            Assert.DoesNotContain("passwordhash", b, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("S3cretPassw0rd!", b);
            Assert.DoesNotContain("refreshToken", b, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("AQAAAA", b); // ASP.NET Identity v3 hash prefix
        }
        using var doc = JsonDocument.Parse(bodies[1]);
        Assert.False(doc.RootElement.GetProperty("items")[0].TryGetProperty("passwordHash", out _));
    }

    [Fact] // TC-USR-021
    public async Task Company_assignment_validates_existence_and_active_state()
    {
        var admin = await AdminClient();
        var code = "UC" + Guid.NewGuid().ToString("N")[..8];
        var company = (await (await admin.PostAsJsonAsync("/api/companies", new { companyCode = code, companyName = "Assign Co" })).Content.ReadFromJsonAsync<CompanyInfo>())!;
        var u = await CreateUserAsync(admin, companyId: company.CompanyId);
        Assert.Equal(company.CompanyId, u.CompanyId);
        Assert.Equal("Assign Co", u.CompanyName);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", NewUser(Mail(), companyId: 999999))).StatusCode);
        await admin.PatchJsonAsync($"/api/companies/{company.CompanyId}/status", new { isActive = false });
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/users", NewUser(Mail(), companyId: company.CompanyId))).StatusCode);
        var byCompany = (await admin.GetFromJsonAsync<Paged<UserInfo>>($"/api/users?companyId={company.CompanyId}"))!;
        Assert.Single(byCompany.Items);
    }

    [Fact] // TC-USR-022
    public async Task Seeded_admin_has_names_and_username()
    {
        var admin = await AdminClient();
        var me = (await admin.GetFromJsonAsync<UserInfo>("/api/auth/me"))!;
        Assert.False(string.IsNullOrWhiteSpace(me.FirstName));
        Assert.False(string.IsNullOrWhiteSpace(me.LastName));
        Assert.Equal("admin", me.Username);
        Assert.Equal($"{me.FirstName} {me.LastName}", me.DisplayName);
    }
}
