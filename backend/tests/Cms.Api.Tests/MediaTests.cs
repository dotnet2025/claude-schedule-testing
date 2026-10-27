using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Cms.Application.Services;

namespace Cms.Api.Tests;

public class MediaTests(CmsFactory f) : ApiTestBase(f)
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];

    private static MultipartFormDataContent Form(string name, byte[] bytes, string type = "image/png")
    {
        var f = new MultipartFormDataContent();
        var part = new ByteArrayContent(bytes);
        part.Headers.ContentType = new MediaTypeHeaderValue(type);
        f.Add(part, "file", name);
        return f;
    }

    [Fact] // TC-MEDIA-001
    public async Task Valid_png_uploads_is_served_and_deleted()
    {
        var c = await AdminClient();
        var r = await c.PostAsync("/api/media", Form("pic.png", Png));
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        var m = (await r.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>());
        var id = m.GetProperty("id").GetInt32();
        var file = await Anonymous().GetAsync($"/api/media/{id}/file");
        Assert.Equal(HttpStatusCode.OK, file.StatusCode);
        Assert.Equal("image/png", file.Content.Headers.ContentType!.MediaType);
        Assert.Equal(Png, await file.Content.ReadAsByteArrayAsync());
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/media/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Anonymous().GetAsync($"/api/media/{id}/file")).StatusCode);
    }

    [Theory] // TC-MEDIA-002/003
    [InlineData("evil.exe")] [InlineData("page.html")] [InlineData("x.svg")] [InlineData("noext")] [InlineData("shell.php.png.exe")]
    public async Task Disallowed_extensions_are_rejected(string name)
        => Assert.Equal(HttpStatusCode.BadRequest, (await (await AdminClient()).PostAsync("/api/media", Form(name, Png))).StatusCode);

    [Fact] // TC-MEDIA-004
    public async Task Spoofed_content_is_rejected_by_signature_check()
    {
        var c = await AdminClient();
        var exe = "MZ\u0090\u0000\u0003"u8.ToArray();
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsync("/api/media", Form("fake.png", exe, "image/png"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsync("/api/media", Form("fake.pdf", Png, "application/pdf"))).StatusCode);
    }

    [Fact] // TC-MEDIA-005
    public async Task Empty_and_oversized_files_are_rejected()
    {
        var c = await AdminClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsync("/api/media", Form("empty.png", []))).StatusCode);
        var big = new byte[10 * 1024 * 1024 + 1]; Array.Copy(Png, big, Png.Length);
        var r = await c.PostAsync("/api/media", Form("big.png", big));
        Assert.True(r.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.RequestEntityTooLarge);
    }

    [Fact] // TC-MEDIA-006
    public async Task Duplicate_filenames_get_unique_storage_and_traversal_names_are_sanitised()
    {
        var c = await AdminClient();
        var a = await (await c.PostAsync("/api/media", Form("same.png", Png))).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var b = await (await c.PostAsync("/api/media", Form("same.png", Png))).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        Assert.NotEqual(a.GetProperty("id").GetInt32(), b.GetProperty("id").GetInt32());
        var t = await c.PostAsync("/api/media", Form("../../etc/passwd.png", Png));
        Assert.Equal(HttpStatusCode.Created, t.StatusCode);
        var name = (await t.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("originalName").GetString()!;
        Assert.DoesNotContain("/", name); Assert.DoesNotContain("..", name);
    }

    [Fact] // TC-MEDIA-007
    public async Task Upload_requires_authentication()
        => Assert.Equal(HttpStatusCode.Unauthorized, (await Anonymous().PostAsync("/api/media", Form("a.png", Png))).StatusCode);

    [Fact] // TC-MEDIA-008
    public async Task Deleting_media_used_as_featured_image_keeps_content()
    {
        var c = await AdminClient();
        var id = (await (await c.PostAsync("/api/media", Form("feat.png", Png))).Content.ReadFromJsonAsync<System.Text.Json.JsonElement>()).GetProperty("id").GetInt32();
        var page = (await (await c.PostAsJsonAsync("/api/pages", new { title = "Img " + Unique(), featuredImageId = id })).Content.ReadFromJsonAsync<ContentInfo>())!;
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/api/media/{id}")).StatusCode);
        var got = await c.GetFromJsonAsync<System.Text.Json.JsonElement>($"/api/pages/{page.Id}");
        Assert.Equal(System.Text.Json.JsonValueKind.Null, got.GetProperty("featuredImageId").ValueKind);
        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/api/pages", new { title = "Bad " + Unique(), featuredImageId = 999999 })).StatusCode);
    }
}

public class UnitTests
{
    [Theory]
    [InlineData("Hello World", "hello-world")]
    [InlineData("  Café Münster!! ", "cafe-munster")]
    [InlineData("a---b", "a-b")]
    [InlineData("!!!", "")]
    public void Slugify(string input, string expected) => Assert.Equal(expected, Cms.Application.Common.SlugHelper.Slugify(input));

    [Theory]
    [InlineData("a-b", true)] [InlineData("-a", false)] [InlineData("A", false)] [InlineData("a b", false)] [InlineData("", false)]
    public void SlugIsValid(string slug, bool ok) => Assert.Equal(ok, Cms.Application.Common.SlugHelper.IsValid(slug));

    [Fact]
    public void Sanitizer_strips_scripts_and_keeps_tables()
    {
        var s = new HtmlSanitizerService().Sanitize("<table><tr><td style=\"text-align:center;position:fixed\">x</td></tr></table><script>1</script><iframe src=//x></iframe>");
        Assert.Contains("<table>", s); Assert.DoesNotContain("script", s); Assert.DoesNotContain("iframe", s); Assert.DoesNotContain("position", s);
    }

    [Theory]
    [InlineData(".gif", new byte[] { 0x47, 0x49, 0x46, 0x38, 0x39, 0x61 }, true)]
    [InlineData(".jpg", new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }, true)]
    [InlineData(".jpg", new byte[] { 0x00, 0x01, 0x02 }, false)]
    [InlineData(".webp", new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50 }, true)]
    [InlineData(".pdf", new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D }, true)]
    public void SignatureMatches(string ext, byte[] head, bool expected) => Assert.Equal(expected, FileValidator.SignatureMatches(ext, head));
}
