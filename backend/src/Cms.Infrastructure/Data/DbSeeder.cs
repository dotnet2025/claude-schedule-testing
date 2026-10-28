using Cms.Domain.Constants;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cms.Infrastructure.Data;

public class SeedOptions
{
    public const string Section = "Seed";
    /// <summary>Development convenience only. Set false (or leave unset outside Development) to disable.</summary>
    public bool Enabled { get; set; }
    public string AdminEmail { get; set; } = "admin@example.com";
    public string AdminPassword { get; set; } = "";
    public bool DemoContent { get; set; }
}

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher<User> hasher, SeedOptions opt, CancellationToken ct = default)
    {
        if (!opt.Enabled || string.IsNullOrWhiteSpace(opt.AdminPassword)) return;
        var email = opt.AdminEmail.Trim().ToLowerInvariant();
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (admin is null)
        {
            admin = new User { Email = email, DisplayName = "Administrator", FirstName = "System", LastName = "Administrator", Username = email, Role = Roles.Admin };
            admin.PasswordHash = hasher.HashPassword(admin, opt.AdminPassword);
            db.Users.Add(admin);
            await db.SaveChangesAsync(ct);
        }
        if (opt.DemoContent && !await db.Posts.AnyAsync(ct))
        {
            var cat = new Category { Name = "News", Slug = "news", Description = "Demo category" };
            db.Categories.Add(cat);
            db.Posts.Add(new Post { Title = "Welcome to the CMS", Slug = "welcome", Content = "<p>This is <strong>demo</strong> content.</p>",
                Excerpt = "Demo post", Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, CreatedById = admin.Id, UpdatedById = admin.Id, Categories = [cat] });
            db.Pages.Add(new Page { Title = "About", Slug = "about", Content = "<p>About this site.</p>", ShortDescription = "About us",
                Status = ContentStatus.Published, PublishedAt = DateTime.UtcNow, CreatedById = admin.Id, UpdatedById = admin.Id });
            await db.SaveChangesAsync(ct);
        }
    }
}
