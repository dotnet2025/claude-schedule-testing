using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Cms.Api.Tests;

public record CompanyInfo(int CompanyId, string CompanyCode, string CompanyName, bool IsActive, int ActiveUserCount);
public record MappingInfo(int CompanyUserId, int CompanyId, string CompanyCode, string CompanyName, int UserId, string UserName, string Username,
    string Email, string SystemRole, bool UserIsActive, bool IsActive, bool IsPrimaryCompany);
public record UserCompanyInfo(int CompanyUserId, int CompanyId, string CompanyName, bool IsActive, bool IsPrimaryCompany);
public record CreatedResult(UserInfo User, MappingInfo Assignment);

/// <summary>Integration tests for the Company-User module. Test IDs refer to tests/test-cases/company-users.md.</summary>
public class CompanyUserTests(CmsFactory f) : ApiTestBase(f)
{
    private async Task<CompanyInfo> NewCompany(HttpClient admin, bool active = true)
    {
        var code = Unique("C").ToUpperInvariant();
        var r = await admin.PostAsJsonAsync("/api/companies", new { companyCode = code, companyName = "Company " + code, isActive = active });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<CompanyInfo>())!;
    }

    private async Task<UserInfo> NewUser(HttpClient admin, string role = "Editor", bool active = true)
    {
        var email = $"u{Guid.NewGuid():N}@test.local";
        var r = await admin.PostAsJsonAsync("/api/users", new { email, displayName = "Test User", password = "Passw0rd!", role });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var u = (await r.Content.ReadFromJsonAsync<UserInfo>())!;
        if (!active) Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/users/{u.Id}", new { displayName = "Test User", role, isActive = false })).StatusCode);
        return u with { IsActive = active };
    }

    private static Task<HttpResponseMessage> Assign(HttpClient c, int companyId, int userId, bool primary = false, bool active = true)
        => c.PostAsJsonAsync("/api/company-users", new { companyId, userId, isActive = active, isPrimaryCompany = primary });

    private static async Task<MappingInfo> AssignOk(HttpClient c, int companyId, int userId, bool primary = false)
    {
        var r = await Assign(c, companyId, userId, primary);
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<MappingInfo>())!;
    }

    private static Task<MappingInfo?> Get(HttpClient c, int id) => c.GetFromJsonAsync<MappingInfo>($"/api/company-users/{id}");

    [Fact] // TC-CU-001
    public async Task Assign_existing_user_returns_201_with_details()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        var m = await AssignOk(a, co.CompanyId, u.Id, primary: true);
        Assert.Equal(co.CompanyCode, m.CompanyCode); Assert.Equal(u.Email, m.Email); Assert.True(m.IsActive); Assert.True(m.IsPrimaryCompany);
        Assert.Equal(u.Role, m.SystemRole);
    }

    [Fact] // TC-CU-002
    public async Task Create_new_user_and_assign_in_one_call()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var n = Unique("nu");
        var r = await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", new { firstName = "Ann", lastName = "Lee", username = n, email = $"{n}@test.local", phone = "123", role = "Editor", password = "Passw0rd!", isActive = true, isPrimaryCompany = true });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var body = await r.Content.ReadAsStringAsync();
        Assert.DoesNotContain("password", body, StringComparison.OrdinalIgnoreCase);
        var res = JsonSerializer.Deserialize<CreatedResult>(body, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        Assert.Equal("Ann Lee", res.User.DisplayName); Assert.True(res.Assignment.IsPrimaryCompany); Assert.Equal(co.CompanyId, res.Assignment.CompanyId);
        // created through the existing User Master service => the password hash works for login
        Assert.Equal(HttpStatusCode.OK, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email = $"{n}@test.local", password = "Passw0rd!" })).StatusCode);
    }

    [Fact] // TC-CU-003
    public async Task Duplicate_active_assignment_is_409()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        await AssignOk(a, co.CompanyId, u.Id);
        Assert.Equal(HttpStatusCode.Conflict, (await Assign(a, co.CompanyId, u.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users/assign", new { userId = u.Id })).StatusCode);
    }

    [Fact] // TC-CU-004, TC-CU-005
    public async Task Invalid_company_or_user_is_404_and_bad_ids_are_400()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(a, 999999, u.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Assign(a, co.CompanyId, 999999)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await Assign(a, 0, u.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await a.GetAsync("/api/company-users/999999")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await a.GetAsync("/api/companies/999999/users")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await a.GetAsync("/api/users/999999/companies")).StatusCode);
    }

    [Fact] // TC-CU-006
    public async Task Inactive_company_cannot_receive_assignments()
    {
        var a = await AdminClient(); var co = await NewCompany(a, active: false); var u = await NewUser(a);
        Assert.Equal(HttpStatusCode.BadRequest, (await Assign(a, co.CompanyId, u.Id)).StatusCode);
        var n = Unique("nu");
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users",
            new { firstName = "A", lastName = "B", username = n, email = $"{n}@test.local", role = "Editor", password = "Passw0rd!" })).StatusCode);
        using var scope = Factory.Services.CreateScope();
        Assert.False(await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users.AnyAsync(x => x.Username == n)); // nothing created
    }

    [Fact] // TC-CU-007
    public async Task Inactive_user_cannot_get_active_assignment_but_can_get_inactive_one()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a, active: false);
        Assert.Equal(HttpStatusCode.BadRequest, (await Assign(a, co.CompanyId, u.Id)).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await Assign(a, co.CompanyId, u.Id, active: false)).StatusCode);
    }

    [Fact] // TC-CU-008, TC-CU-009, TC-CU-010
    public async Task View_users_of_company_companies_of_user_and_multi_company_membership()
    {
        var a = await AdminClient(); var c1 = await NewCompany(a); var c2 = await NewCompany(a); var u = await NewUser(a); var u2 = await NewUser(a);
        await AssignOk(a, c1.CompanyId, u.Id, primary: true); await AssignOk(a, c2.CompanyId, u.Id); await AssignOk(a, c1.CompanyId, u2.Id);
        var users = await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/companies/{c1.CompanyId}/users");
        Assert.Equal(2, users!.Total); Assert.All(users.Items, i => Assert.Equal(c1.CompanyId, i.CompanyId));
        var companies = await a.GetFromJsonAsync<List<UserCompanyInfo>>($"/api/users/{u.Id}/companies");
        Assert.Equal(2, companies!.Count); Assert.True(companies[0].IsPrimaryCompany); // primary listed first
        Assert.Equal(2, (await a.GetFromJsonAsync<CompanyInfo>($"/api/companies/{c1.CompanyId}"))!.ActiveUserCount);
    }

    [Fact] // TC-CU-011, TC-CU-012, TC-CU-013
    public async Task Only_one_active_primary_per_user_and_changing_primary_demotes_the_old_one()
    {
        var a = await AdminClient(); var c1 = await NewCompany(a); var c2 = await NewCompany(a); var u = await NewUser(a);
        var m1 = await AssignOk(a, c1.CompanyId, u.Id, primary: true);
        var m2 = await AssignOk(a, c2.CompanyId, u.Id);
        Assert.False(m2.IsPrimaryCompany);
        var r = await a.PutAsJsonAsync($"/api/company-users/{m2.CompanyUserId}", new { isActive = true, isPrimaryCompany = true });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        Assert.False((await Get(a, m1.CompanyUserId))!.IsPrimaryCompany);
        Assert.True((await Get(a, m2.CompanyUserId))!.IsPrimaryCompany);
        // assigning a third company as primary also demotes
        var c3 = await NewCompany(a);
        var m3 = await AssignOk(a, c3.CompanyId, u.Id, primary: true);
        var all = await a.GetFromJsonAsync<List<UserCompanyInfo>>($"/api/users/{u.Id}/companies");
        Assert.Single(all!, x => x.IsPrimaryCompany && x.IsActive);
        Assert.Equal(m3.CompanyUserId, all!.Single(x => x.IsPrimaryCompany).CompanyUserId);
    }

    [Fact] // TC-CU-014
    public async Task Database_filtered_unique_index_rejects_a_second_active_primary()
    {
        var a = await AdminClient(); var c1 = await NewCompany(a); var c2 = await NewCompany(a); var u = await NewUser(a);
        await AssignOk(a, c1.CompanyId, u.Id, primary: true); var m2 = await AssignOk(a, c2.CompanyId, u.Id);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        // bypass the service on purpose: the DB itself must refuse.
        await Assert.ThrowsAnyAsync<Exception>(() => db.Database.ExecuteSqlRawAsync($"UPDATE CompanyUsers SET IsPrimaryCompany = 1 WHERE CompanyUserId = {m2.CompanyUserId}"));
    }

    [Fact] // TC-CU-015
    public async Task Edit_status_and_primary_only_and_deactivating_clears_primary()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a, role: "Editor");
        var m = await AssignOk(a, co.CompanyId, u.Id, primary: true);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PutAsJsonAsync($"/api/company-users/{m.CompanyUserId}", new { isActive = false, isPrimaryCompany = true })).StatusCode);
        var r = await a.PutAsJsonAsync($"/api/company-users/{m.CompanyUserId}", new { isActive = false, isPrimaryCompany = false, companyId = 12345, userId = 54321 });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var after = (await r.Content.ReadFromJsonAsync<MappingInfo>())!;
        Assert.False(after.IsActive); Assert.False(after.IsPrimaryCompany);
        Assert.Equal(co.CompanyId, after.CompanyId); Assert.Equal(u.Id, after.UserId); // ids cannot be changed
        Assert.Equal("Editor", after.SystemRole);                                       // role untouched
        Assert.Equal(HttpStatusCode.NotFound, (await a.PutAsJsonAsync("/api/company-users/999999", new { isActive = true, isPrimaryCompany = false })).StatusCode);
    }

    [Fact] // TC-CU-016
    public async Task Unassign_soft_deletes_keeps_user_and_company_and_clears_primary()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        var m = await AssignOk(a, co.CompanyId, u.Id, primary: true);
        Assert.Equal(HttpStatusCode.NoContent, (await a.DeleteAsync($"/api/company-users/{m.CompanyUserId}")).StatusCode);
        var after = (await Get(a, m.CompanyUserId))!;
        Assert.False(after.IsActive); Assert.False(after.IsPrimaryCompany);
        Assert.Equal(HttpStatusCode.OK, (await a.GetAsync($"/api/companies/{co.CompanyId}")).StatusCode);
        Assert.Contains((await a.GetFromJsonAsync<Paged<UserInfo>>("/api/users?pageSize=100"))!.Items, x => x.Id == u.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await a.DeleteAsync("/api/company-users/999999")).StatusCode);
    }

    [Fact] // TC-CU-017
    public async Task Assigning_again_reactivates_inactive_mapping_with_200()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        var m = await AssignOk(a, co.CompanyId, u.Id);
        await a.DeleteAsync($"/api/company-users/{m.CompanyUserId}");
        var r = await Assign(a, co.CompanyId, u.Id, primary: true);
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var again = (await r.Content.ReadFromJsonAsync<MappingInfo>())!;
        Assert.Equal(m.CompanyUserId, again.CompanyUserId); Assert.True(again.IsActive); Assert.True(again.IsPrimaryCompany);
        var list = await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co.CompanyId}&userId={u.Id}");
        Assert.Equal(1, list!.Total); // no duplicate row
    }

    [Fact] // TC-CU-018
    public async Task Create_user_and_assign_rolls_back_when_assignment_fails()
    {
        var a = await AdminClient();
        var code = "BOOM" + Guid.NewGuid().ToString("N")[..6];
        var r0 = await a.PostAsJsonAsync("/api/companies", new { companyCode = code, companyName = "Boom" });
        var co = (await r0.Content.ReadFromJsonAsync<CompanyInfo>())!;
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // simulate a failure of the second step (mapping insert) after the user row was already written
            await db.Database.ExecuteSqlRawAsync($"CREATE TRIGGER IF NOT EXISTS fail_cu_{co.CompanyId} BEFORE INSERT ON CompanyUsers WHEN NEW.CompanyId = {co.CompanyId} BEGIN SELECT RAISE(ABORT, 'simulated failure'); END;");
        }
        var n = Unique("rb");
        var r = await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", new { firstName = "R", lastName = "B", username = n, email = $"{n}@test.local", role = "Editor", password = "Passw0rd!" });
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
        using var scope2 = Factory.Services.CreateScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await db2.Users.AnyAsync(x => x.Username == n)); // user creation rolled back with the mapping
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsJsonAsync("/api/auth/login", new { email = $"{n}@test.local", password = "Passw0rd!" })).StatusCode);
    }

    [Fact] // TC-CU-019
    public async Task Create_user_validation_and_duplicates_leave_nothing_behind()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var existing = await NewUser(a); var n = Unique("v");
        object Body(string username, string email, string role = "Editor", string password = "Passw0rd!") => new { firstName = "F", lastName = "L", username, email, role, password };
        Assert.Equal(HttpStatusCode.Conflict, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, existing.Email))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, $"{n}@test.local", "Root"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, "bad-email"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, $"{n}@test.local", "Editor", "short"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, $"{n}@test.local", "Editor", "allletters"))).StatusCode);
        var ok = await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n, $"{n}@test.local"));
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await a.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", Body(n.ToUpperInvariant(), $"x{n}@test.local"))).StatusCode); // username unique, case-insensitive
        Assert.Equal(HttpStatusCode.NotFound, (await a.PostAsJsonAsync("/api/companies/999999/users", Body(Unique("q"), $"{Unique("q")}@test.local"))).StatusCode);
        Assert.Equal(1, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/companies/{co.CompanyId}/users"))!.Total);
    }

    [Fact] // TC-CU-020
    public async Task Editor_is_forbidden_and_anonymous_unauthorized_on_every_endpoint()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a); var m = await AssignOk(a, co.CompanyId, u.Id);
        var ed = await EditorClient(); var anon = Anonymous();
        var body = new { companyId = co.CompanyId, userId = u.Id, isActive = true, isPrimaryCompany = false };
        foreach (var (c, want) in new[] { (ed, HttpStatusCode.Forbidden), (anon, HttpStatusCode.Unauthorized) })
        {
            Assert.Equal(want, (await c.GetAsync("/api/company-users")).StatusCode);
            Assert.Equal(want, (await c.GetAsync($"/api/company-users/{m.CompanyUserId}")).StatusCode);
            Assert.Equal(want, (await c.PostAsJsonAsync("/api/company-users", body)).StatusCode);
            Assert.Equal(want, (await c.PutAsJsonAsync($"/api/company-users/{m.CompanyUserId}", new { isActive = true, isPrimaryCompany = true })).StatusCode);
            Assert.Equal(want, (await c.DeleteAsync($"/api/company-users/{m.CompanyUserId}")).StatusCode);
            Assert.Equal(want, (await c.GetAsync($"/api/companies/{co.CompanyId}/users")).StatusCode);
            Assert.Equal(want, (await c.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users", new { firstName = "a", lastName = "b", username = "zzz", email = "z@z.zz", role = "Admin", password = "Passw0rd!" })).StatusCode);
            Assert.Equal(want, (await c.PostAsJsonAsync($"/api/companies/{co.CompanyId}/users/assign", new { userId = u.Id })).StatusCode);
            Assert.Equal(want, (await c.GetAsync($"/api/users/{u.Id}/companies")).StatusCode);
        }
    }

    [Fact] // TC-CU-021
    public async Task Membership_changes_never_change_the_system_role()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a, "Editor");
        var m = await AssignOk(a, co.CompanyId, u.Id, primary: true);
        await a.PutAsJsonAsync($"/api/company-users/{m.CompanyUserId}", new { isActive = false, isPrimaryCompany = false });
        await a.DeleteAsync($"/api/company-users/{m.CompanyUserId}");
        var users = await a.GetFromJsonAsync<Paged<UserInfo>>("/api/users?pageSize=100");
        Assert.Equal("Editor", users!.Items.Single(x => x.Id == u.Id).Role);
    }

    [Fact] // TC-CU-022, TC-CU-023
    public async Task Search_filter_sort_and_paging_use_the_paging_shape()
    {
        var a = await AdminClient(); var tag = Unique("S"); var co1 = await NewCompany(a); var co2 = await NewCompany(a);
        var users = new List<UserInfo>(); for (var i = 0; i < 5; i++) users.Add(await NewUser(a));
        var inactiveUser = await NewUser(a, active: false);
        foreach (var u in users) await AssignOk(a, co1.CompanyId, u.Id);
        await AssignOk(a, co2.CompanyId, users[0].Id);
        var off = await Assign(a, co2.CompanyId, inactiveUser.Id, active: false); Assert.Equal(HttpStatusCode.Created, off.StatusCode);

        var p1 = await a.GetFromJsonAsync<JsonElement>($"/api/company-users?companyId={co1.CompanyId}&pageSize=2&page=1&sortBy=email");
        Assert.Equal(5, p1.GetProperty("total").GetInt32()); Assert.Equal(3, p1.GetProperty("totalPages").GetInt32());
        Assert.Equal(2, p1.GetProperty("items").GetArrayLength()); Assert.Equal(1, p1.GetProperty("page").GetInt32()); Assert.Equal(2, p1.GetProperty("pageSize").GetInt32());
        var last = await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co1.CompanyId}&pageSize=2&page=3");
        Assert.Single(last!.Items);

        var asc = (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co1.CompanyId}&sortBy=email"))!.Items.Select(x => x.Email).ToList();
        var desc = (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co1.CompanyId}&sortBy=email&desc=true"))!.Items.Select(x => x.Email).ToList();
        Assert.Equal(asc, asc.OrderBy(x => x, StringComparer.Ordinal).ToList()); // SQLite default BINARY collation
        Assert.Equal(asc.Count, desc.Count); Assert.Equal(desc, desc.OrderByDescending(x => x, StringComparer.Ordinal).ToList());

        Assert.Single((await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?search={users[1].Email}"))!.Items);
        Assert.Equal(co2.CompanyName, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?search={co2.CompanyCode}"))!.Items.First().CompanyName);
        Assert.Equal(1, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co2.CompanyId}&userIsActive=false"))!.Total);
        Assert.Equal(1, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co2.CompanyId}&assignmentIsActive=false"))!.Total);
        Assert.Equal(1, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co2.CompanyId}&assignmentIsActive=true"))!.Total);
        // boundaries: page 0 / huge pageSize are normalised, unknown sort falls back, empty result is a valid page
        var norm = await a.GetFromJsonAsync<JsonElement>("/api/company-users?page=0&pageSize=100000&sortBy=nonsense");
        Assert.Equal(1, norm.GetProperty("page").GetInt32()); Assert.Equal(100, norm.GetProperty("pageSize").GetInt32());
        var none = await a.GetFromJsonAsync<JsonElement>("/api/company-users?search=zz-no-match-" + tag);
        Assert.Equal(0, none.GetProperty("total").GetInt32()); Assert.Equal(0, none.GetProperty("totalPages").GetInt32());
    }

    [Fact] // TC-CU-024
    public async Task Parallel_primary_updates_leave_exactly_one_primary()
    {
        var a = await AdminClient(); var u = await NewUser(a); var maps = new List<MappingInfo>();
        for (var i = 0; i < 6; i++) maps.Add(await AssignOk(a, (await NewCompany(a)).CompanyId, u.Id));
        var tasks = maps.Select(m => a.PutAsJsonAsync($"/api/company-users/{m.CompanyUserId}", new { isActive = true, isPrimaryCompany = true })).ToArray();
        var results = await Task.WhenAll(tasks);
        Assert.All(results, r => Assert.True(r.StatusCode is HttpStatusCode.OK or HttpStatusCode.Conflict, $"unexpected {r.StatusCode}"));
        Assert.Contains(results, r => r.StatusCode == HttpStatusCode.OK);
        var companies = await a.GetFromJsonAsync<List<UserCompanyInfo>>($"/api/users/{u.Id}/companies");
        Assert.Equal(1, companies!.Count(x => x.IsPrimaryCompany && x.IsActive)); // the invariant, regardless of who won
    }

    [Fact] // TC-CU-025
    public async Task Parallel_duplicate_assignments_create_a_single_mapping()
    {
        var a = await AdminClient(); var co = await NewCompany(a); var u = await NewUser(a);
        var results = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => Assign(a, co.CompanyId, u.Id)));
        Assert.Equal(1, results.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.All(results, r => Assert.True(r.StatusCode is HttpStatusCode.Created or HttpStatusCode.Conflict));
        Assert.Equal(1, (await a.GetFromJsonAsync<Paged<MappingInfo>>($"/api/company-users?companyId={co.CompanyId}&userId={u.Id}"))!.Total);
    }

    [Fact] // TC-CU-026
    public async Task Company_master_basics_validate_and_reject_duplicate_codes()
    {
        var a = await AdminClient(); var co = await NewCompany(a);
        Assert.Equal(HttpStatusCode.Conflict, (await a.PostAsJsonAsync("/api/companies", new { companyCode = co.CompanyCode.ToLowerInvariant(), companyName = "dup" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync("/api/companies", new { companyCode = "", companyName = "x" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsJsonAsync("/api/companies", new { companyCode = new string('x', 31), companyName = "x" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await a.PutAsJsonAsync($"/api/companies/{co.CompanyId}", new { companyCode = co.CompanyCode, companyName = "Renamed", isActive = true })).StatusCode);
        Assert.Contains((await a.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={co.CompanyCode}"))!.Items, c => c.CompanyName == "Renamed");
    }

    [Fact] // TC-CU-027
    public async Task Existing_users_migrated_with_profile_fields_and_hash_is_never_returned()
    {
        var a = await AdminClient();
        var me = await a.GetStringAsync("/api/auth/me");
        Assert.Contains("username", me, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("passwordHash", me, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("passwordHash", await a.GetStringAsync("/api/company-users"), StringComparison.OrdinalIgnoreCase);
    }
}
