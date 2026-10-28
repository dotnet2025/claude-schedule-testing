using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyUser> CompanyUsers => Set<CompanyUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<MediaFile> MediaFiles => Set<MediaFile>();
    public DbSet<WebsiteSettings> Settings => Set<WebsiteSettings>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.Property(x => x.DisplayName).HasMaxLength(100).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
            e.Property(x => x.LastName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(25);
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.Role).HasMaxLength(20).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
        });
        b.Entity<Company>(e =>
        {
            e.HasKey(x => x.CompanyId);
            e.HasIndex(x => x.CompanyCode).IsUnique();
            e.Property(x => x.CompanyCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.CompanyName).HasMaxLength(200).IsRequired();
            e.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.SetNull);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });
        b.Entity<CompanyUser>(e =>
        {
            e.HasKey(x => x.CompanyUserId);
            e.HasIndex(x => new { x.CompanyId, x.UserId }).IsUnique();
            // DB-level business rule: at most ONE active primary mapping per user.
            e.HasIndex(x => x.UserId).IsUnique().HasDatabaseName("UX_CompanyUsers_OnePrimaryPerUser")
                .HasFilter("\"IsPrimaryCompany\" = 1 AND \"IsActive\" = 1");
            e.HasOne(x => x.Company).WithMany(c => c.CompanyUsers).HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.SetNull);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });
        b.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Ignore(x => x.IsActive);
        });
        b.Entity<MediaFile>(e =>
        {
            e.HasIndex(x => x.StoredName).IsUnique();
            e.Property(x => x.OriginalName).HasMaxLength(255).IsRequired();
            e.Property(x => x.StoredName).HasMaxLength(100).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.UploadedBy).WithMany().HasForeignKey(x => x.UploadedById).OnDelete(DeleteBehavior.SetNull);
        });
        ConfigureContent<Page>(b);
        ConfigureContent<Post>(b);
        b.Entity<Page>().Property(x => x.ShortDescription).HasMaxLength(1000);
        b.Entity<Post>(e =>
        {
            e.Property(x => x.Excerpt).HasMaxLength(1000);
            e.HasMany(x => x.Categories).WithMany(c => c.Posts).UsingEntity("PostCategories");
            e.HasMany(x => x.Tags).WithMany(t => t.Posts).UsingEntity("PostTags");
        });
        b.Entity<Category>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(100).IsRequired();
            e.Property(x => x.Description).HasMaxLength(500);
        });
        b.Entity<Tag>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        });
        b.Entity<WebsiteSettings>(e =>
        {
            e.Property(x => x.WebsiteName).HasMaxLength(100).IsRequired();
            e.HasOne<MediaFile>().WithMany().HasForeignKey(x => x.LogoId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne<MediaFile>().WithMany().HasForeignKey(x => x.FaviconId).OnDelete(DeleteBehavior.SetNull);
            e.HasData(new WebsiteSettings { Id = 1, WebsiteName = "My CMS", FooterText = "© My CMS" });
        });
    }

    private static void ConfigureContent<T>(ModelBuilder b) where T : ContentBase
    {
        b.Entity<T>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => x.Status);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(200).IsRequired();
            e.Property(x => x.MetaTitle).HasMaxLength(200);
            e.Property(x => x.MetaDescription).HasMaxLength(400);
            e.HasOne(x => x.FeaturedImage).WithMany().HasForeignKey(x => x.FeaturedImageId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.UpdatedBy).WithMany().HasForeignKey(x => x.UpdatedById).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
