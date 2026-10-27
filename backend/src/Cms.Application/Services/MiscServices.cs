using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Constants;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Ganss.Xss;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

public class HtmlSanitizerService : IHtmlSanitizerService
{
    private readonly HtmlSanitizer _s;
    public HtmlSanitizerService()
    {
        _s = new HtmlSanitizer();
        foreach (var t in new[] { "table", "thead", "tbody", "tr", "th", "td", "pre", "code", "u", "s", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "img", "figure", "figcaption" })
            _s.AllowedTags.Add(t);
        _s.AllowedAttributes.Add("class");
        _s.AllowedAttributes.Add("style");
        _s.AllowedCssProperties.Clear();
        _s.AllowedCssProperties.Add("text-align");
        _s.AllowedSchemes.Clear();
        foreach (var sc in new[] { "http", "https", "mailto" }) _s.AllowedSchemes.Add(sc);
    }
    public string Sanitize(string? html) => string.IsNullOrEmpty(html) ? "" : _s.Sanitize(html);
}

public class UserService(IAppDbContext db, IPasswordHasher<User> hasher, AuthService auth)
{
    public async Task<PagedResult<UserDto>> ListAsync(string? search, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) { var t = search.Trim().ToLower(); q = q.Where(u => u.Email.Contains(t) || u.DisplayName.ToLower().Contains(t)); }
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(u => u.Email).Skip((p - 1) * s).Take(s).ToListAsync(ct);
        return new(items.Select(AuthService.ToDto).ToList(), total, p, s);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest r, CancellationToken ct)
    {
        if (!Roles.All.Contains(r.Role)) throw new BadRequestException("Role must be Admin or Editor.");
        PasswordRules.Validate(r.Password);
        var email = r.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct)) throw new ConflictException("A user with this email already exists.");
        var u = new User { Email = email, DisplayName = r.DisplayName.Trim(), Role = r.Role };
        u.PasswordHash = hasher.HashPassword(u, r.Password);
        db.Users.Add(u); await db.SaveChangesAsync(ct);
        return AuthService.ToDto(u);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserRequest r, CancellationToken ct)
    {
        if (!Roles.All.Contains(r.Role)) throw new BadRequestException("Role must be Admin or Editor.");
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        var losesAdmin = u.Role == Roles.Admin && u.IsActive && (r.Role != Roles.Admin || !r.IsActive);
        if (losesAdmin) await EnsureAnotherAdmin(id, ct);
        u.DisplayName = r.DisplayName.Trim(); u.Role = r.Role; u.IsActive = r.IsActive;
        if (!string.IsNullOrEmpty(r.NewPassword)) { PasswordRules.Validate(r.NewPassword); u.PasswordHash = hasher.HashPassword(u, r.NewPassword); }
        await db.SaveChangesAsync(ct);
        if (!u.IsActive || !string.IsNullOrEmpty(r.NewPassword)) await auth.RevokeAllAsync(id, ct);
        return AuthService.ToDto(u);
    }

    public async Task DeleteAsync(int id, int? actingUserId, CancellationToken ct)
    {
        if (id == actingUserId) throw new BadRequestException("You cannot delete your own account.");
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("User not found.");
        if (u.Role == Roles.Admin && u.IsActive) await EnsureAnotherAdmin(id, ct);
        db.Users.Remove(u);
        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureAnotherAdmin(int excludingId, CancellationToken ct)
    {
        if (!await db.Users.AnyAsync(x => x.Id != excludingId && x.Role == Roles.Admin && x.IsActive, ct))
            throw new ConflictException("The last active Admin cannot be demoted, deactivated or deleted.");
    }
}

public class SettingsService(IAppDbContext db)
{
    public async Task<SettingsDto> GetAsync(CancellationToken ct)
    {
        var s = await db.Settings.AsNoTracking().FirstOrDefaultAsync(ct) ?? new WebsiteSettings();
        return ToDto(s);
    }

    public async Task<SettingsDto> UpdateAsync(SettingsDto r, CancellationToken ct)
    {
        foreach (var id in new[] { r.LogoId, r.FaviconId })
            if (id is int m && !await db.MediaFiles.AnyAsync(x => x.Id == m, ct)) throw new BadRequestException("Selected media does not exist.");
        var s = await db.Settings.FirstOrDefaultAsync(ct);
        if (s is null) { s = new WebsiteSettings(); db.Settings.Add(s); }
        s.WebsiteName = r.WebsiteName.Trim(); s.Description = r.Description; s.LogoId = r.LogoId; s.FaviconId = r.FaviconId;
        s.ContactEmail = r.ContactEmail; s.FooterText = r.FooterText; s.DefaultSeoTitle = r.DefaultSeoTitle; s.DefaultSeoDescription = r.DefaultSeoDescription;
        await db.SaveChangesAsync(ct);
        return ToDto(s);
    }

    private static SettingsDto ToDto(WebsiteSettings s) => new(s.WebsiteName, s.Description, s.LogoId, s.FaviconId,
        s.LogoId is int l ? ContentMapping.MediaUrl(l) : null, s.FaviconId is int f ? ContentMapping.MediaUrl(f) : null,
        s.ContactEmail, s.FooterText, s.DefaultSeoTitle, s.DefaultSeoDescription);
}

public class DashboardService(IAppDbContext db)
{
    public async Task<DashboardDto> GetAsync(bool isAdmin, CancellationToken ct)
    {
        var pages = await db.Pages.CountAsync(ct);
        var posts = await db.Posts.CountAsync(ct);
        var published = await db.Posts.CountAsync(p => p.Status == ContentStatus.Published, ct);
        var media = await db.MediaFiles.CountAsync(ct);
        int? users = isAdmin ? await db.Users.CountAsync(ct) : null;
        var rp = await db.Pages.AsNoTracking().OrderByDescending(p => p.UpdatedAt).Take(5)
            .Select(p => new RecentContentDto(p.Id, "page", p.Title, p.Status.ToString(), p.UpdatedAt)).ToListAsync(ct);
        var rq = await db.Posts.AsNoTracking().OrderByDescending(p => p.UpdatedAt).Take(5)
            .Select(p => new RecentContentDto(p.Id, "post", p.Title, p.Status.ToString(), p.UpdatedAt)).ToListAsync(ct);
        var recent = rp.Concat(rq).OrderByDescending(x => x.UpdatedAt).Take(8).ToList();
        return new(pages, posts, published, posts - published, media, users, recent);
    }
}

public class PublicService(IAppDbContext db)
{
    private static string? Url(int? id) => id is int i ? ContentMapping.MediaUrl(i) : null;

    public async Task<PagedResult<PublicSummaryDto>> PagesAsync(int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Pages.AsNoTracking().Where(x => x.Status == ContentStatus.Published);
        var total = await q.CountAsync(ct);
        var items = await q.OrderBy(x => x.Title).Skip((p - 1) * s).Take(s)
            .Select(x => new PublicSummaryDto(x.Id, x.Title, x.Slug, x.ShortDescription, Url(x.FeaturedImageId), x.PublishedAt, null)).ToListAsync(ct);
        return new(items, total, p, s);
    }

    public async Task<PublicContentDto> PageAsync(string slug, CancellationToken ct)
    {
        var x = await db.Pages.AsNoTracking().Include(p => p.CreatedBy)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.Status == ContentStatus.Published, ct) ?? throw new NotFoundException("Page not found.");
        return new(x.Id, x.Title, x.Slug, x.Content, x.ShortDescription, Url(x.FeaturedImageId), x.MetaTitle, x.MetaDescription, x.PublishedAt, null, [], []);
    }

    public async Task<PagedResult<PublicSummaryDto>> PostsAsync(string? categorySlug, string? tagSlug, string? search, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.Posts.AsNoTracking().Where(x => x.Status == ContentStatus.Published);
        if (!string.IsNullOrWhiteSpace(categorySlug)) q = q.Where(x => x.Categories.Any(c => c.Slug == categorySlug));
        if (!string.IsNullOrWhiteSpace(tagSlug)) q = q.Where(x => x.Tags.Any(c => c.Slug == tagSlug));
        if (!string.IsNullOrWhiteSpace(search)) { var t = search.Trim().ToLower(); q = q.Where(x => x.Title.ToLower().Contains(t) || (x.Excerpt != null && x.Excerpt.ToLower().Contains(t))); }
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.PublishedAt).ThenByDescending(x => x.Id).Skip((p - 1) * s).Take(s)
            .Select(x => new PublicSummaryDto(x.Id, x.Title, x.Slug, x.Excerpt, Url(x.FeaturedImageId), x.PublishedAt, x.CreatedBy != null ? x.CreatedBy.DisplayName : null)).ToListAsync(ct);
        return new(items, total, p, s);
    }

    public async Task<PublicContentDto> PostAsync(string slug, CancellationToken ct)
    {
        var x = await db.Posts.AsNoTracking().Include(p => p.CreatedBy).Include(p => p.Categories).Include(p => p.Tags).AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Slug == slug && p.Status == ContentStatus.Published, ct) ?? throw new NotFoundException("Post not found.");
        return new(x.Id, x.Title, x.Slug, x.Content, x.Excerpt, Url(x.FeaturedImageId), x.MetaTitle, x.MetaDescription, x.PublishedAt,
            x.CreatedBy?.DisplayName, x.Categories.Select(TaxonomyService.ToDto).ToList(), x.Tags.Select(TaxonomyService.ToDto).ToList());
    }

    public async Task<List<PublicSummaryDto>> RelatedAsync(string slug, int take, CancellationToken ct)
    {
        var cur = await db.Posts.AsNoTracking().Include(p => p.Categories).FirstOrDefaultAsync(p => p.Slug == slug && p.Status == ContentStatus.Published, ct)
            ?? throw new NotFoundException("Post not found.");
        var cids = cur.Categories.Select(c => c.Id).ToList();
        return await db.Posts.AsNoTracking().Where(x => x.Status == ContentStatus.Published && x.Id != cur.Id && x.Categories.Any(c => cids.Contains(c.Id)))
            .OrderByDescending(x => x.PublishedAt).Take(Math.Clamp(take, 1, 10))
            .Select(x => new PublicSummaryDto(x.Id, x.Title, x.Slug, x.Excerpt, Url(x.FeaturedImageId), x.PublishedAt, null)).ToListAsync(ct);
    }

    public async Task<List<PublicSummaryDto>> SearchAsync(string? term, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(term)) return [];
        var t = term.Trim().ToLower();
        var posts = await db.Posts.AsNoTracking().Where(x => x.Status == ContentStatus.Published && (x.Title.ToLower().Contains(t) || x.Content.ToLower().Contains(t)))
            .OrderByDescending(x => x.PublishedAt).Take(20)
            .Select(x => new PublicSummaryDto(x.Id, x.Title, "post:" + x.Slug, x.Excerpt, Url(x.FeaturedImageId), x.PublishedAt, null)).ToListAsync(ct);
        var pages = await db.Pages.AsNoTracking().Where(x => x.Status == ContentStatus.Published && (x.Title.ToLower().Contains(t) || x.Content.ToLower().Contains(t)))
            .Take(20).Select(x => new PublicSummaryDto(x.Id, x.Title, "page:" + x.Slug, x.ShortDescription, Url(x.FeaturedImageId), x.PublishedAt, null)).ToListAsync(ct);
        return posts.Concat(pages).ToList();
    }
}
