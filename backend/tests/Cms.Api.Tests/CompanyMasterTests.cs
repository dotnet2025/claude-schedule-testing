using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Cms.Api.Tests;

/// <summary>Company Master (TC-CMP-*).</summary>
public class CompanyMasterTests(CmsFactory f) : ApiTestBase(f)
{
    private static string Code() => "C" + Guid.NewGuid().ToString("N")[..10];
    private static object Body(string? code = null, string name = "Acme Ltd", string? email = null, string? website = null, int? logo = null, bool? isActive = null)
        => new { companyCode = code ?? Code(), companyName = name, email, website, logoMediaId = logo, isActive };

    private static async Task<CompanyInfo> Make(HttpClient c, string? code = null, string name = "Acme Ltd", bool? isActive = null)
    {
        var r = await c.PostAsJsonAsync("/api/companies", Body(code, name, isActive: isActive));
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<CompanyInfo>())!;
    }

    [Fact] // TC-CMP-001
    public async Task Create_valid_company_returns_201_with_audit_fields_and_normalised_code()
    {
        var admin = await AdminClient();
        var me = (await admin.GetFromJsonAsync<UserInfo>("/api/auth/me"))!;
        var r = await admin.PostAsJsonAsync("/api/companies", new
        {
            companyCode = " ab-001 ", companyName = "  Acme Ltd ", email = "info@acme.test", phone = "+1 555 0100", website = "https://acme.test",
            addressLine1 = "1 Main St", city = "Springfield", country = "US", postalCode = "12345",
        });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        Assert.NotNull(r.Headers.Location);
        var c = (await r.Content.ReadFromJsonAsync<CompanyInfo>())!;
        Assert.Equal("AB-001", c.CompanyCode);
        Assert.Equal("Acme Ltd", c.CompanyName);
        Assert.True(c.IsActive);
        Assert.Equal(me.Id, c.CreatedById);
        Assert.Equal(me.DisplayName, c.CreatedByName);
        Assert.True((DateTime.UtcNow - c.CreatedAt).TotalMinutes < 5);
        Assert.Equal(0, c.UserCount);
    }

    [Theory] // TC-CMP-002
    [InlineData("companyCode")] [InlineData("companyName")]
    public async Task Create_rejects_missing_required_field(string missing)
    {
        var admin = await AdminClient();
        var body = new Dictionary<string, object?> { ["companyCode"] = Code(), ["companyName"] = "X" };
        body.Remove(missing);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", body)).StatusCode);
        body[missing] = "   ";
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", body)).StatusCode);
    }

    [Fact] // TC-CMP-003
    public async Task Create_rejects_duplicate_code_case_insensitively_with_409()
    {
        var admin = await AdminClient();
        var code = Code();
        await Make(admin, code);
        var dup = await admin.PostAsJsonAsync("/api/companies", Body(code.ToLowerInvariant()));
        Assert.Equal(HttpStatusCode.Conflict, dup.StatusCode);
        Assert.Contains("code", await dup.Content.ReadAsStringAsync(), StringComparison.OrdinalIgnoreCase);
    }

    [Theory] // TC-CMP-004
    [InlineData("not-an-email", null)]
    [InlineData(null, "ftp://acme.test")]
    [InlineData(null, "javascript:alert(1)")]
    [InlineData(null, "acme.test")]
    public async Task Create_rejects_invalid_email_or_website(string? email, string? website)
    {
        var admin = await AdminClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", Body(email: email, website: website))).StatusCode);
    }

    [Fact] // TC-CMP-005
    public async Task Field_length_boundaries()
    {
        var admin = await AdminClient();
        Assert.Equal(HttpStatusCode.Created, (await admin.PostAsJsonAsync("/api/companies", new
        {
            companyCode = new string('A', 30), companyName = new string('n', 200), phone = new string('1', 25), addressLine1 = new string('a', 250),
            city = new string('c', 100), postalCode = new string('9', 20),
        })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", new { companyCode = new string('A', 31), companyName = "x" })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", new { companyCode = Code(), companyName = new string('n', 201) })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", new { companyCode = Code(), companyName = "x", phone = new string('1', 26) })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", new { companyCode = Code(), companyName = "x", postalCode = new string('9', 21) })).StatusCode);
    }

    [Fact] // TC-CMP-006
    public async Task Get_by_id_and_unknown_id_is_404_problem_details()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        Assert.Equal(c.CompanyCode, (await admin.GetFromJsonAsync<CompanyInfo>($"/api/companies/{c.CompanyId}"))!.CompanyCode);
        var nf = await admin.GetAsync("/api/companies/999999");
        Assert.Equal(HttpStatusCode.NotFound, nf.StatusCode);
        Assert.Equal("application/problem+json", nf.Content.Headers.ContentType?.MediaType);
    }

    [Fact] // TC-CMP-007
    public async Task Update_changes_fields_and_audit_and_keeps_own_code()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        var r = await admin.PutAsJsonAsync($"/api/companies/{c.CompanyId}", new { companyCode = c.CompanyCode, companyName = "Renamed", city = "Metropolis", email = "a@b.test" });
        Assert.Equal(HttpStatusCode.OK, r.StatusCode);
        var u = (await r.Content.ReadFromJsonAsync<CompanyInfo>())!;
        Assert.Equal("Renamed", u.CompanyName);
        Assert.Equal("Metropolis", u.City);
        Assert.True(u.UpdatedAt >= c.UpdatedAt);
        Assert.Equal(c.CreatedAt, u.CreatedAt);
        Assert.NotNull(u.UpdatedById);
    }

    [Fact] // TC-CMP-008
    public async Task Update_rejects_code_of_another_company_and_unknown_id()
    {
        var admin = await AdminClient();
        var a = await Make(admin);
        var b = await Make(admin);
        Assert.Equal(HttpStatusCode.Conflict, (await admin.PutAsJsonAsync($"/api/companies/{b.CompanyId}", Body(a.CompanyCode))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PutAsJsonAsync("/api/companies/999999", Body())).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PutAsJsonAsync($"/api/companies/{b.CompanyId}", new { companyCode = b.CompanyCode, companyName = "" })).StatusCode);
    }

    [Fact] // TC-CMP-009
    public async Task Activate_and_deactivate_via_patch()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        var off = await admin.PatchJsonAsync($"/api/companies/{c.CompanyId}/status", new { isActive = false });
        Assert.Equal(HttpStatusCode.OK, off.StatusCode);
        Assert.False((await off.Content.ReadFromJsonAsync<CompanyInfo>())!.IsActive);
        var on = await admin.PatchJsonAsync($"/api/companies/{c.CompanyId}/status", new { isActive = true });
        Assert.True((await on.Content.ReadFromJsonAsync<CompanyInfo>())!.IsActive);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PatchJsonAsync("/api/companies/999999/status", new { isActive = true })).StatusCode);
    }

    [Fact] // TC-CMP-010
    public async Task List_search_filter_sort_and_paging()
    {
        var admin = await AdminClient();
        var tag = "ZZ" + Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        for (var i = 0; i < 5; i++) await Make(admin, $"{tag}-{i}", i % 2 == 0 ? $"Alpha {i}" : $"Beta {i}", isActive: i != 3);

        var all = (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&pageSize=50"))!;
        Assert.Equal(5, all.Total);
        Assert.Equal(1, all.TotalPages);
        Assert.Equal(1, (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&pageSize=50&isActive=false"))!.Total);
        Assert.Equal(4, (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&isActive=true"))!.Total);
        Assert.Equal(2, (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&pageSize=50"))!.Items.Count(x => x.CompanyName.StartsWith("Beta")));
        Assert.Equal(1, (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag.ToLowerInvariant()}-2"))!.Total); // search by code, case-insensitive

        var p2 = (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&pageSize=2&page=2&sortBy=code&sortDir=asc"))!;
        Assert.Equal(2, p2.Items.Count);
        Assert.Equal(3, p2.TotalPages);
        Assert.Equal($"{tag}-2", p2.Items[0].CompanyCode);
        var byNameDesc = (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&sortBy=name&sortDir=desc&pageSize=50"))!;
        Assert.StartsWith("Beta", byNameDesc.Items[0].CompanyName);
        var byCreated = (await admin.GetFromJsonAsync<Paged<CompanyInfo>>($"/api/companies?search={tag}&sortBy=created&sortDir=desc&pageSize=50"))!;
        Assert.Equal(5, byCreated.Items.Count);
        var empty = (await admin.GetFromJsonAsync<Paged<CompanyInfo>>("/api/companies?search=__no_such_company__"))!;
        Assert.Empty(empty.Items);
        Assert.Equal(0, empty.Total);
    }

    [Fact] // TC-CMP-011
    public async Task List_response_shape_and_page_size_clamp()
    {
        var admin = await AdminClient();
        var json = await admin.GetStringAsync("/api/companies?pageSize=1000&page=0");
        using var doc = JsonDocument.Parse(json);
        foreach (var k in new[] { "items", "total", "page", "pageSize", "totalPages" }) Assert.True(doc.RootElement.TryGetProperty(k, out _), k);
        Assert.Equal(100, doc.RootElement.GetProperty("pageSize").GetInt32());
        Assert.Equal(1, doc.RootElement.GetProperty("page").GetInt32());
    }

    [Fact] // TC-CMP-012
    public async Task Delete_unreferenced_company_succeeds()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/companies/{c.CompanyId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.GetAsync($"/api/companies/{c.CompanyId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.DeleteAsync($"/api/companies/{c.CompanyId}")).StatusCode);
    }

    [Fact] // TC-CMP-013
    public async Task Delete_company_referenced_by_a_user_is_refused_with_409_and_guidance()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        await CreateUserAsync(admin, companyId: c.CompanyId);
        var del = await admin.DeleteAsync($"/api/companies/{c.CompanyId}");
        Assert.Equal(HttpStatusCode.Conflict, del.StatusCode);
        Assert.Contains("Deactivate", await del.Content.ReadAsStringAsync());
        var still = (await admin.GetFromJsonAsync<CompanyInfo>($"/api/companies/{c.CompanyId}"))!;
        Assert.Equal(1, still.UserCount);
        Assert.Equal(HttpStatusCode.OK, (await admin.PatchJsonAsync($"/api/companies/{c.CompanyId}/status", new { isActive = false })).StatusCode); // the safe alternative
    }

    [Fact] // TC-CMP-014
    public async Task Logo_must_exist_in_media_library_and_deleting_the_media_clears_it()
    {
        var admin = await AdminClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await admin.PostAsJsonAsync("/api/companies", Body(logo: 999999))).StatusCode);

        var form = new MultipartFormDataContent();
        var part = new ByteArrayContent([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0]);
        part.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(part, "file", "logo.png");
        var media = await (await admin.PostAsync("/api/media", form)).Content.ReadFromJsonAsync<JsonElement>();
        var mediaId = media.GetProperty("id").GetInt32();

        var r = await admin.PostAsJsonAsync("/api/companies", Body(logo: mediaId));
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var c = (await r.Content.ReadFromJsonAsync<CompanyInfo>())!;
        Assert.Equal(mediaId, c.LogoMediaId);
        Assert.Equal($"/api/media/{mediaId}/file", c.LogoUrl);

        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/media/{mediaId}")).StatusCode);
        var after = (await admin.GetFromJsonAsync<CompanyInfo>($"/api/companies/{c.CompanyId}"))!;
        Assert.Null(after.LogoMediaId); // ON DELETE SET NULL
    }

    [Fact] // TC-CMP-015
    public async Task Editor_is_forbidden_and_anonymous_is_unauthorized_on_every_company_endpoint()
    {
        var admin = await AdminClient();
        var c = await Make(admin);
        var ed = await EditorClient();
        var anon = Anonymous();
        foreach (var client in new[] { ed, anon })
        {
            var expected = client == ed ? HttpStatusCode.Forbidden : HttpStatusCode.Unauthorized;
            Assert.Equal(expected, (await client.GetAsync("/api/companies")).StatusCode);
            Assert.Equal(expected, (await client.GetAsync($"/api/companies/{c.CompanyId}")).StatusCode);
            Assert.Equal(expected, (await client.PostAsJsonAsync("/api/companies", Body())).StatusCode);
            Assert.Equal(expected, (await client.PutAsJsonAsync($"/api/companies/{c.CompanyId}", Body())).StatusCode);
            Assert.Equal(expected, (await client.PatchJsonAsync($"/api/companies/{c.CompanyId}/status", new { isActive = false })).StatusCode);
            Assert.Equal(expected, (await client.DeleteAsync($"/api/companies/{c.CompanyId}")).StatusCode);
        }
        Assert.True((await admin.GetFromJsonAsync<CompanyInfo>($"/api/companies/{c.CompanyId}"))!.IsActive);
    }

    [Fact] // TC-CMP-016
    public async Task Concurrent_duplicate_creates_yield_one_success_and_conflicts_only()
    {
        var admin = await AdminClient();
        var code = Code();
        var results = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => admin.PostAsJsonAsync("/api/companies", Body(code))));
        Assert.Equal(1, results.Count(r => r.StatusCode == HttpStatusCode.Created));
        Assert.All(results.Where(r => r.StatusCode != HttpStatusCode.Created), r => Assert.Equal(HttpStatusCode.Conflict, r.StatusCode));
    }

    [Fact] // TC-CMP-017
    public async Task Errors_are_problem_details_without_stack_traces()
    {
        var admin = await AdminClient();
        var r = await admin.PostAsJsonAsync("/api/companies", new { companyCode = "", companyName = "" });
        Assert.Equal("application/problem+json", r.Content.Headers.ContentType?.MediaType);
        var body = await r.Content.ReadAsStringAsync();
        Assert.DoesNotContain("   at ", body);
    }
}
