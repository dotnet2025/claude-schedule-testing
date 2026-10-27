using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

public class TaxonomyService(IAppDbContext db)
{
    public static TaxonomyDto ToDto(Category c) => new(c.Id, c.Name, c.Slug, c.Description, 0);
    public static TaxonomyDto ToDto(Tag t) => new(t.Id, t.Name, t.Slug, null, 0);

    // ---- categories
    public async Task<List<TaxonomyDto>> ListCategoriesAsync(CancellationToken ct)
        => await db.Categories.AsNoTracking().OrderBy(c => c.Name)
            .Select(c => new TaxonomyDto(c.Id, c.Name, c.Slug, c.Description, c.Posts.Count)).ToListAsync(ct);

    public async Task<TaxonomyDto> CreateCategoryAsync(TaxonomyRequest r, CancellationToken ct)
    {
        var (name, slug) = Normalize(r);
        await EnsureUnique(db.Categories.Select(c => new TaxRow(c.Id, c.Name, c.Slug)), null, name, slug, ct);
        var c = new Category { Name = name, Slug = slug, Description = r.Description };
        db.Categories.Add(c); await db.SaveChangesAsync(ct);
        return ToDto(c);
    }

    public async Task<TaxonomyDto> UpdateCategoryAsync(int id, TaxonomyRequest r, CancellationToken ct)
    {
        var c = await db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Category not found.");
        var (name, slug) = Normalize(r);
        await EnsureUnique(db.Categories.Select(x => new TaxRow(x.Id, x.Name, x.Slug)), id, name, slug, ct);
        c.Name = name; c.Slug = slug; c.Description = r.Description;
        await db.SaveChangesAsync(ct);
        return ToDto(c);
    }

    public async Task DeleteCategoryAsync(int id, CancellationToken ct)
    {
        var c = await db.Categories.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Category not found.");
        db.Categories.Remove(c); // join rows cascade; posts are kept
        await db.SaveChangesAsync(ct);
    }

    // ---- tags
    public async Task<List<TaxonomyDto>> ListTagsAsync(CancellationToken ct)
        => await db.Tags.AsNoTracking().OrderBy(t => t.Name)
            .Select(t => new TaxonomyDto(t.Id, t.Name, t.Slug, null, t.Posts.Count)).ToListAsync(ct);

    public async Task<TaxonomyDto> CreateTagAsync(TaxonomyRequest r, CancellationToken ct)
    {
        var (name, slug) = Normalize(r);
        await EnsureUnique(db.Tags.Select(t => new TaxRow(t.Id, t.Name, t.Slug)), null, name, slug, ct);
        var t = new Tag { Name = name, Slug = slug };
        db.Tags.Add(t); await db.SaveChangesAsync(ct);
        return ToDto(t);
    }

    public async Task<TaxonomyDto> UpdateTagAsync(int id, TaxonomyRequest r, CancellationToken ct)
    {
        var t = await db.Tags.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Tag not found.");
        var (name, slug) = Normalize(r);
        await EnsureUnique(db.Tags.Select(x => new TaxRow(x.Id, x.Name, x.Slug)), id, name, slug, ct);
        t.Name = name; t.Slug = slug;
        await db.SaveChangesAsync(ct);
        return ToDto(t);
    }

    public async Task DeleteTagAsync(int id, CancellationToken ct)
    {
        var t = await db.Tags.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Tag not found.");
        db.Tags.Remove(t);
        await db.SaveChangesAsync(ct);
    }

    private static (string name, string slug) Normalize(TaxonomyRequest r)
    {
        var name = r.Name.Trim();
        if (name.Length == 0) throw new BadRequestException("Name is required.");
        var slug = string.IsNullOrWhiteSpace(r.Slug) ? SlugHelper.Slugify(name) : r.Slug.Trim().ToLowerInvariant();
        if (!SlugHelper.IsValid(slug)) throw new BadRequestException("A valid slug is required.");
        return (name, slug);
    }

    private record TaxRow(int Id, string Name, string Slug);

    private static async Task EnsureUnique(IQueryable<TaxRow> q, int? selfId, string name, string slug, CancellationToken ct)
    {
        var all = await q.ToListAsync(ct); // small sets; avoids provider-specific case-insensitive translation
        foreach (var x in all)
        {
            if (selfId != null && x.Id == selfId) continue;
            if (string.Equals(x.Name, name, StringComparison.OrdinalIgnoreCase)) throw new ConflictException($"'{name}' already exists.");
            if (x.Slug == slug) throw new ConflictException($"Slug '{slug}' is already in use.");
        }
    }
}
