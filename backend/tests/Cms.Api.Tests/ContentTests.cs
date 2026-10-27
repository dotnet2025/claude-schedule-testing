using System.Net;
using System.Net.Http.Json;

namespace Cms.Api.Tests;

public class PageTests(CmsFactory f) : ApiTestBase(f)
{
    private static async Task<ContentInfo> Create(HttpClient c, string title, string? slug = null, string? content = null)
    {
        var r = await c.PostAsJsonAsync("/api/pages", new { title, slug, content });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<ContentInfo>())!;
    }

    [Fact] // TC-PAGE-001
    public async Task Create_generates_slug_and_starts_as_draft()
    {
        var c = await AdminClient();
        var title = "Hello Wörld " + Unique();
        var p = await Create(c, title);
        Assert.Equal("Draft", p.Status);
        Assert.StartsWith("hello-world-", p.Slug);
    }

    [Fact] // TC-PAGE-002
    public async Task Duplicate_explicit_slug_is_409_and_generated_duplicates_get_suffix()
    {
        var c = await AdminClient();
        var slug = Unique("dup");
        await Create(c, "A", slug);
        Assert.Equal(HttpStatusCode.Conflict, (await c.PostAsJsonAsync("/api/pages", new { title = "B", slug })).StatusCode);
        var t = "Same Title " + Unique();
        var p1 = await Create(c, t); var p2 = await Create(c, t);
        Assert.NotEqual(p1.Slug, p2.Slug);
    }

    [Theory] // TC-PAGE-003
    [InlineData("")] [InlineData("   ")]
    public async Task Empty_or_whitespace_title_is_rejected(string title)
        => Assert.Equal(HttpStatusCode.BadRequest, (await (await AdminClient()).PostAsJsonAsync("/api/pages", new { title })).StatusCode);

    [Fact] // TC-PAGE-004
    public async Task Too_long_title_is_rejected_and_boundary_200_accepted()
    {
        var c = await AdminClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/pages", new { title = new string('a', 201) })).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await c.PostAsJsonAsync("/api/pages", new { title = new string('b', 190) + Unique("x"), slug = Unique("long") })).StatusCode);
    }

    [Fact] // TC-PAGE-005
    public async Task Invalid_slug_format_is_rejected()
        => Assert.Equal(HttpStatusCode.BadRequest, (await (await AdminClient()).PostAsJsonAsync("/api/pages", new { title = "x", slug = "Bad Slug!" })).StatusCode);

    [Fact] // TC-PAGE-006
    public async Task Editing_title_keeps_slug_unless_changed()
    {
        var c = await AdminClient();
        var p = await Create(c, "Original " + Unique());
        var r = await c.PutAsJsonAsync($"/api/pages/{p.Id}", new { title = "Renamed", content = "<p>x</p>" });
        var u = (await r.Content.ReadFromJsonAsync<ContentInfo>())!;
        Assert.Equal("Renamed", u.Title);
        Assert.Equal(p.Slug, u.Slug);
        var newSlug = Unique("new");
        var u2 = (await (await c.PutAsJsonAsync($"/api/pages/{p.Id}", new { title = "Renamed", slug = newSlug })).Content.ReadFromJsonAsync<ContentInfo>())!;
        Assert.Equal(newSlug, u2.Slug);
    }

    [Fact] // TC-PAGE-007
    public async Task Publish_unpublish_controls_public_visibility()
    {
        var c = await AdminClient(); var anon = Anonymous();
        var p = await Create(c, "Vis " + Unique(), Unique("vis"), "<p>hello</p>");
        Assert.Equal(HttpStatusCode.NotFound, (await anon.GetAsync($"/api/public/pages/{p.Slug}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await c.PatchAsync($"/api/pages/{p.Id}/publish", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync($"/api/public/pages/{p.Slug}")).StatusCode);
        var list = await anon.GetFromJsonAsync<Paged<System.Text.Json.JsonElement>>("/api/public/pages?pageSize=100");
        Assert.Contains(list!.Items, i => i.GetProperty("slug").GetString() == p.Slug);
        Assert.Equal(HttpStatusCode.OK, (await c.PatchAsync($"/api/pages/{p.Id}/unpublish", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anon.GetAsync($"/api/public/pages/{p.Slug}")).StatusCode);
    }

    [Fact] // TC-PAGE-008
    public async Task Draft_is_previewable_by_authorized_users_only()
    {
        var c = await AdminClient();
        var p = await Create(c, "Draft " + Unique());
        Assert.Equal(HttpStatusCode.OK, (await c.GetAsync($"/api/pages/{p.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().GetAsync($"/api/pages/{p.Id}")).StatusCode);
    }

    [Fact] // TC-PAGE-009
    public async Task Delete_removes_page_and_missing_returns_404()
    {
        var c = await AdminClient();
        var p = await Create(c, "Del " + Unique());
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/pages/{p.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync($"/api/pages/{p.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.DeleteAsync($"/api/pages/{p.Id}")).StatusCode);
    }

    [Fact] // TC-PAGE-010
    public async Task Stale_concurrency_stamp_is_409()
    {
        var c = await AdminClient();
        var p = await Create(c, "Conc " + Unique());
        Assert.Equal(HttpStatusCode.OK, (await c.PutAsJsonAsync($"/api/pages/{p.Id}", new { title = "v2", concurrencyStamp = p.ConcurrencyStamp })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await c.PutAsJsonAsync($"/api/pages/{p.Id}", new { title = "v3", concurrencyStamp = p.ConcurrencyStamp })).StatusCode);
    }

    [Fact] // TC-PAGE-011 / TC-SEC-XSS
    public async Task Html_is_sanitized_on_save()
    {
        var c = await AdminClient();
        var evil = "<p onclick=\"x()\">hi</p><script>alert(1)</script><img src=x onerror=alert(1)><a href=\"javascript:alert(1)\">l</a><b>ok</b>";
        var p = await Create(c, "Xss " + Unique(), null, evil);
        var got = (await c.GetFromJsonAsync<ContentInfo>($"/api/pages/{p.Id}"))!;
        Assert.DoesNotContain("<script", got.Content, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onerror", got.Content, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", got.Content, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("javascript:", got.Content, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("<b>ok</b>", got.Content);
    }

    [Fact] // TC-PAGE-012
    public async Task Search_filter_sort_and_pagination_work()
    {
        var c = await AdminClient();
        var tag = Unique("srch");
        for (var i = 0; i < 3; i++) await Create(c, $"{tag} item {i}");
        var all = await c.GetFromJsonAsync<Paged<ContentInfo>>($"/api/pages?search={tag}&pageSize=2&page=1");
        Assert.Equal(3, all!.Total); Assert.Equal(2, all.Items.Count);
        var page2 = await c.GetFromJsonAsync<Paged<ContentInfo>>($"/api/pages?search={tag}&pageSize=2&page=2");
        Assert.Single(page2!.Items);
        var none = await c.GetFromJsonAsync<Paged<ContentInfo>>($"/api/pages?search={tag}&status=Published");
        Assert.Equal(0, none!.Total);
        var empty = await c.GetFromJsonAsync<Paged<ContentInfo>>($"/api/pages?search=zzz-no-match-{Guid.NewGuid():N}");
        Assert.Empty(empty!.Items);
    }

    [Fact] // TC-PAGE-013
    public async Task Malformed_json_is_400_and_unicode_is_preserved()
    {
        var c = await AdminClient();
        var bad = await c.PostAsync("/api/pages", new StringContent("{not json", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var p = await Create(c, "Emoji 🎉 日本語 " + Unique(), Unique("uni"), "<p>日本語 🎉</p>");
        var got = (await c.GetFromJsonAsync<ContentInfo>($"/api/pages/{p.Id}"))!;
        Assert.Contains("🎉", got.Title); Assert.Contains("日本語", got.Content);
    }
}

public class PostTests(CmsFactory f) : ApiTestBase(f)
{
    [Fact] // TC-POST-001..
    public async Task Post_crud_with_categories_tags_and_public_filtering()
    {
        var c = await AdminClient(); var anon = Anonymous();
        var cat = (await (await c.PostAsJsonAsync("/api/categories", new { name = "Cat " + Unique() })).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>());
        var tag = (await (await c.PostAsJsonAsync("/api/tags", new { name = "Tag " + Unique() })).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>());
        var catId = cat.GetProperty("id").GetInt32(); var catSlug = cat.GetProperty("slug").GetString();
        var tagId = tag.GetProperty("id").GetInt32();
        var slug = Unique("post");
        var r = await c.PostAsJsonAsync("/api/posts", new { title = "Post " + Unique(), slug, content = "<p>body</p>", excerpt = "ex", categoryIds = new[] { catId }, tagIds = new[] { tagId } });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var post = (await r.Content.ReadFromJsonAsync<ContentInfo>())!;

        Assert.Equal(HttpStatusCode.NotFound, (await anon.GetAsync($"/api/public/posts/{slug}")).StatusCode);
        var inCat = await anon.GetFromJsonAsync<Paged<System.Text.Json.JsonElement>>($"/api/public/categories/{catSlug}/posts");
        Assert.Equal(0, inCat!.Total);

        await c.PatchAsync($"/api/posts/{post.Id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, (await anon.GetAsync($"/api/public/posts/{slug}")).StatusCode);
        inCat = await anon.GetFromJsonAsync<Paged<System.Text.Json.JsonElement>>($"/api/public/categories/{catSlug}/posts");
        Assert.Equal(1, inCat!.Total);

        var upd = await c.PutAsJsonAsync($"/api/posts/{post.Id}", new { title = "Edited", categoryIds = Array.Empty<int>(), tagIds = Array.Empty<int>() });
        Assert.Equal(HttpStatusCode.OK, upd.StatusCode);
        inCat = await anon.GetFromJsonAsync<Paged<System.Text.Json.JsonElement>>($"/api/public/categories/{catSlug}/posts");
        Assert.Equal(0, inCat!.Total);

        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/posts/{post.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await anon.GetAsync($"/api/public/posts/{slug}")).StatusCode);
    }

    [Fact] // TC-POST-010
    public async Task Duplicate_slug_and_unknown_category_are_rejected()
    {
        var c = await AdminClient(); var slug = Unique("pdup");
        Assert.Equal(HttpStatusCode.Created, (await c.PostAsJsonAsync("/api/posts", new { title = "A", slug })).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await c.PostAsJsonAsync("/api/posts", new { title = "B", slug })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/posts", new { title = "C", categoryIds = new[] { 999999 } })).StatusCode);
    }

    [Fact] // TC-CAT-001..
    public async Task Categories_and_tags_enforce_unique_names_and_slugs_and_deletion_keeps_posts()
    {
        var c = await AdminClient(); var name = "Dup " + Unique();
        var r = await c.PostAsJsonAsync("/api/categories", new { name });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await c.PostAsJsonAsync("/api/categories", new { name = name.ToUpperInvariant() })).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/tags", new { name = "" })).StatusCode);
        var id = (await r.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("id").GetInt32();
        var post = (await (await c.PostAsJsonAsync("/api/posts", new { title = "Keep " + Unique(), categoryIds = new[] { id } })).Content.ReadFromJsonAsync<ContentInfo>())!;
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/categories/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await c.GetAsync($"/api/posts/{post.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.DeleteAsync($"/api/categories/{id}")).StatusCode);
    }

    [Fact] // TC-PUB-010
    public async Task Public_search_returns_only_published_content()
    {
        var c = await AdminClient(); var word = "zq" + Guid.NewGuid().ToString("N")[..10];
        var pub = (await (await c.PostAsJsonAsync("/api/posts", new { title = $"Pub {word}", slug = Unique("s1") })).Content.ReadFromJsonAsync<ContentInfo>())!;
        await c.PostAsJsonAsync("/api/posts", new { title = $"Draft {word}", slug = Unique("s2") });
        await c.PatchAsync($"/api/posts/{pub.Id}/publish", null);
        var res = await Anonymous().GetFromJsonAsync<List<System.Text.Json.JsonElement>>($"/api/public/search?q={word}");
        Assert.Single(res!);
        Assert.Empty((await Anonymous().GetFromJsonAsync<List<System.Text.Json.JsonElement>>("/api/public/search?q="))!);
    }
}
