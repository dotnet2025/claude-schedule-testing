using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

public record ContentQuery(string? Search, string? Status, string? SortBy, bool Desc = true, int Page = 1, int PageSize = 10, int? CategoryId = null, int? TagId = null);

public static class ContentMapping
{
    public static string MediaUrl(int id) => $"/api/media/{id}/file";

    public static ContentDto ToDto(Page p) => new(p.Id, p.Title, p.Slug, p.Content, p.ShortDescription, null,
        p.FeaturedImageId, p.FeaturedImageId is int i ? MediaUrl(i) : null, p.MetaTitle, p.MetaDescription, p.Status.ToString(),
        p.CreatedAt, p.UpdatedAt, p.PublishedAt, p.CreatedBy?.DisplayName, p.UpdatedBy?.DisplayName, [], [], p.ConcurrencyStamp);

    public static ContentDto ToDto(Post p) => new(p.Id, p.Title, p.Slug, p.Content, null, p.Excerpt,
        p.FeaturedImageId, p.FeaturedImageId is int i ? MediaUrl(i) : null, p.MetaTitle, p.MetaDescription, p.Status.ToString(),
        p.CreatedAt, p.UpdatedAt, p.PublishedAt, p.CreatedBy?.DisplayName, p.UpdatedBy?.DisplayName,
        p.Categories.Select(TaxonomyService.ToDto).ToList(), p.Tags.Select(TaxonomyService.ToDto).ToList(), p.ConcurrencyStamp);

    public static ContentSummaryDto ToSummary(ContentBase c) => new(c.Id, c.Title, c.Slug, c.Status.ToString(), c.CreatedAt, c.UpdatedAt, c.PublishedAt, c.CreatedBy?.DisplayName);

    public static IQueryable<T> Apply<T>(IQueryable<T> q, ContentQuery f) where T : ContentBase
    {
        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.Trim().ToLower();
            q = q.Where(x => x.Title.ToLower().Contains(s) || x.Slug.Contains(s));
        }
        if (Enum.TryParse<ContentStatus>(f.Status, true, out var st)) q = q.Where(x => x.Status == st);
        var byCreated = string.Equals(f.SortBy, "created", StringComparison.OrdinalIgnoreCase);
        q = (byCreated, f.Desc) switch
        {
            (true, true) => q.OrderByDescending(x => x.CreatedAt),
            (true, false) => q.OrderBy(x => x.CreatedAt),
            (false, true) => q.OrderByDescending(x => x.UpdatedAt),
            _ => q.OrderBy(x => x.UpdatedAt),
        };
        return q;
    }

    /// <summary>Resolves the slug for create/update following the rules in docs/architecture.md.</summary>
    public static string ResolveSlug(string title, string? requested, string? current)
    {
        if (!string.IsNullOrWhiteSpace(requested))
        {
            var r = requested.Trim().ToLowerInvariant();
            if (!SlugHelper.IsValid(r)) throw new BadRequestException("Slug may contain only lowercase letters, digits and single hyphens.");
            return r;
        }
        if (!string.IsNullOrEmpty(current)) return current; // editing a title never changes an existing slug
        var generated = SlugHelper.Slugify(title);
        if (generated.Length == 0) throw new BadRequestException("A slug could not be generated from the title; please provide one.");
        return generated;
    }
}

public class PageService(IAppDbContext db, IHtmlSanitizerService sanitizer)
{
    public async Task<PagedResult<ContentSummaryDto>> ListAsync(ContentQuery f, CancellationToken ct)
    {
        var (page, size) = Paging.Normalize(f.Page, f.PageSize);
        var q = ContentMapping.Apply(db.Pages.AsNoTracking().Include(p => p.CreatedBy), f);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new(items.Select(ContentMapping.ToSummary).ToList(), total, page, size);
    }

    public async Task<ContentDto> GetAsync(int id, CancellationToken ct)
        => ContentMapping.ToDto(await Load(id, ct));

    public async Task<ContentDto> CreateAsync(ContentRequest r, int? userId, CancellationToken ct)
    {
        var slug = ContentMapping.ResolveSlug(r.Title, r.Slug, null);
        var explicitSlug = !string.IsNullOrWhiteSpace(r.Slug);
        slug = await UniqueSlug(slug, null, explicitSlug, ct);
        await EnsureMedia(r.FeaturedImageId, ct);
        var p = new Page
        {
            Title = r.Title.Trim(), Slug = slug, Content = sanitizer.Sanitize(r.Content), ShortDescription = r.ShortDescription,
            FeaturedImageId = r.FeaturedImageId, MetaTitle = r.MetaTitle, MetaDescription = r.MetaDescription,
            CreatedById = userId, UpdatedById = userId,
        };
        db.Pages.Add(p);
        await db.SaveChangesAsync(ct);
        return await GetAsync(p.Id, ct);
    }

    public async Task<ContentDto> UpdateAsync(int id, ContentRequest r, int? userId, CancellationToken ct)
    {
        var p = await Load(id, ct, track: true);
        if (r.ConcurrencyStamp is Guid stamp && stamp != p.ConcurrencyStamp)
            throw new ConflictException("This page was modified by someone else. Reload and try again.");
        var slug = ContentMapping.ResolveSlug(r.Title, r.Slug, p.Slug);
        if (slug != p.Slug) slug = await UniqueSlug(slug, id, true, ct);
        await EnsureMedia(r.FeaturedImageId, ct);
        p.Title = r.Title.Trim(); p.Slug = slug; p.Content = sanitizer.Sanitize(r.Content);
        p.ShortDescription = r.ShortDescription; p.FeaturedImageId = r.FeaturedImageId;
        p.MetaTitle = r.MetaTitle; p.MetaDescription = r.MetaDescription;
        p.UpdatedAt = DateTime.UtcNow; p.UpdatedById = userId; p.ConcurrencyStamp = Guid.NewGuid();
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<ContentDto> SetStatusAsync(int id, bool publish, int? userId, CancellationToken ct)
    {
        var p = await Load(id, ct, track: true);
        p.Status = publish ? ContentStatus.Published : ContentStatus.Draft;
        if (publish) p.PublishedAt ??= DateTime.UtcNow;
        p.UpdatedAt = DateTime.UtcNow; p.UpdatedById = userId; p.ConcurrencyStamp = Guid.NewGuid();
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var p = await Load(id, ct, track: true);
        db.Pages.Remove(p);
        await db.SaveChangesAsync(ct);
    }

    private async Task<Page> Load(int id, CancellationToken ct, bool track = false)
    {
        var q = db.Pages.Include(p => p.CreatedBy).Include(p => p.UpdatedBy).AsQueryable();
        if (!track) q = q.AsNoTracking();
        return await q.FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Page not found.");
    }

    private async Task<string> UniqueSlug(string slug, int? selfId, bool throwOnConflict, CancellationToken ct)
    {
        var candidate = slug; var n = 2;
        while (await db.Pages.AnyAsync(p => p.Slug == candidate && p.Id != selfId, ct))
        {
            if (throwOnConflict) throw new ConflictException($"Slug '{candidate}' is already in use.");
            candidate = $"{slug}-{n++}";
        }
        return candidate;
    }

    private async Task EnsureMedia(int? id, CancellationToken ct)
    {
        if (id is int m && !await db.MediaFiles.AnyAsync(x => x.Id == m, ct)) throw new BadRequestException("Featured image does not exist.");
    }
}

public class PostService(IAppDbContext db, IHtmlSanitizerService sanitizer)
{
    private IQueryable<Post> Full() => db.Posts.Include(p => p.CreatedBy).Include(p => p.UpdatedBy).Include(p => p.Categories).Include(p => p.Tags);

    public async Task<PagedResult<ContentSummaryDto>> ListAsync(ContentQuery f, CancellationToken ct)
    {
        var (page, size) = Paging.Normalize(f.Page, f.PageSize);
        var q = db.Posts.AsNoTracking().Include(p => p.CreatedBy).AsQueryable();
        if (f.CategoryId is int c) q = q.Where(p => p.Categories.Any(x => x.Id == c));
        if (f.TagId is int t) q = q.Where(p => p.Tags.Any(x => x.Id == t));
        q = ContentMapping.Apply(q, f);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * size).Take(size).ToListAsync(ct);
        return new(items.Select(ContentMapping.ToSummary).ToList(), total, page, size);
    }

    public async Task<ContentDto> GetAsync(int id, CancellationToken ct)
        => ContentMapping.ToDto(await Full().AsNoTracking().AsSplitQuery().FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("Post not found."));

    public async Task<ContentDto> CreateAsync(ContentRequest r, int? userId, CancellationToken ct)
    {
        var slug = ContentMapping.ResolveSlug(r.Title, r.Slug, null);
        slug = await UniqueSlug(slug, null, !string.IsNullOrWhiteSpace(r.Slug), ct);
        await EnsureMedia(r.FeaturedImageId, ct);
        var p = new Post
        {
            Title = r.Title.Trim(), Slug = slug, Content = sanitizer.Sanitize(r.Content), Excerpt = r.Excerpt,
            FeaturedImageId = r.FeaturedImageId, MetaTitle = r.MetaTitle, MetaDescription = r.MetaDescription,
            CreatedById = userId, UpdatedById = userId,
        };
        await Assign(p, r, ct);
        db.Posts.Add(p);
        await db.SaveChangesAsync(ct);
        return await GetAsync(p.Id, ct);
    }

    public async Task<ContentDto> UpdateAsync(int id, ContentRequest r, int? userId, CancellationToken ct)
    {
        var p = await Full().AsSplitQuery().FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Post not found.");
        if (r.ConcurrencyStamp is Guid stamp && stamp != p.ConcurrencyStamp)
            throw new ConflictException("This post was modified by someone else. Reload and try again.");
        var slug = ContentMapping.ResolveSlug(r.Title, r.Slug, p.Slug);
        if (slug != p.Slug) slug = await UniqueSlug(slug, id, true, ct);
        await EnsureMedia(r.FeaturedImageId, ct);
        p.Title = r.Title.Trim(); p.Slug = slug; p.Content = sanitizer.Sanitize(r.Content); p.Excerpt = r.Excerpt;
        p.FeaturedImageId = r.FeaturedImageId; p.MetaTitle = r.MetaTitle; p.MetaDescription = r.MetaDescription;
        p.UpdatedAt = DateTime.UtcNow; p.UpdatedById = userId; p.ConcurrencyStamp = Guid.NewGuid();
        await Assign(p, r, ct);
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task<ContentDto> SetStatusAsync(int id, bool publish, int? userId, CancellationToken ct)
    {
        var p = await db.Posts.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Post not found.");
        p.Status = publish ? ContentStatus.Published : ContentStatus.Draft;
        if (publish) p.PublishedAt ??= DateTime.UtcNow;
        p.UpdatedAt = DateTime.UtcNow; p.UpdatedById = userId; p.ConcurrencyStamp = Guid.NewGuid();
        await db.SaveChangesAsync(ct);
        return await GetAsync(id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var p = await db.Posts.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Post not found.");
        db.Posts.Remove(p);
        await db.SaveChangesAsync(ct);
    }

    private async Task Assign(Post p, ContentRequest r, CancellationToken ct)
    {
        var cids = (r.CategoryIds ?? []).Distinct().ToList();
        var tids = (r.TagIds ?? []).Distinct().ToList();
        var cats = await db.Categories.Where(c => cids.Contains(c.Id)).ToListAsync(ct);
        var tags = await db.Tags.Where(t => tids.Contains(t.Id)).ToListAsync(ct);
        if (cats.Count != cids.Count) throw new BadRequestException("One or more categories do not exist.");
        if (tags.Count != tids.Count) throw new BadRequestException("One or more tags do not exist.");
        p.Categories.Clear(); p.Categories.AddRange(cats);
        p.Tags.Clear(); p.Tags.AddRange(tags);
    }

    private async Task<string> UniqueSlug(string slug, int? selfId, bool throwOnConflict, CancellationToken ct)
    {
        var candidate = slug; var n = 2;
        while (await db.Posts.AnyAsync(p => p.Slug == candidate && p.Id != selfId, ct))
        {
            if (throwOnConflict) throw new ConflictException($"Slug '{candidate}' is already in use.");
            candidate = $"{slug}-{n++}";
        }
        return candidate;
    }

    private async Task EnsureMedia(int? id, CancellationToken ct)
    {
        if (id is int m && !await db.MediaFiles.AnyAsync(x => x.Id == m, ct)) throw new BadRequestException("Featured image does not exist.");
    }
}
