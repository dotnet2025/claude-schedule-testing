using Cms.Application.Interfaces;
using Cms.Application.Services;
using Cms.Domain.Entities;
using Cms.Infrastructure.Authentication;
using Cms.Infrastructure.Data;
using Cms.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Cms.Infrastructure;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddCmsInfrastructure(this IServiceCollection s, IConfiguration cfg)
    {
        var jwt = cfg.GetSection(JwtOptions.Section).Get<JwtOptions>() ?? new JwtOptions();
        if (jwt.SigningKey.Length < 32)
            throw new InvalidOperationException("Jwt:SigningKey must be configured with at least 32 characters (use user-secrets or the Jwt__SigningKey environment variable).");
        s.AddSingleton(jwt);
        s.AddSingleton(cfg.GetSection(StorageOptions.Section).Get<StorageOptions>() ?? new StorageOptions());
        s.AddSingleton(cfg.GetSection(SeedOptions.Section).Get<SeedOptions>() ?? new SeedOptions());
        s.AddSingleton(cfg.GetSection("Media").Get<MediaOptions>() ?? new MediaOptions());
        s.AddDbContext<AppDbContext>(o => o.UseSqlite(cfg.GetConnectionString("Default") ?? "Data Source=cms.db"));
        s.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        s.AddSingleton<IFileStorage, LocalFileStorage>();
        s.AddSingleton<ITokenService, TokenService>();
        s.AddSingleton<IHtmlSanitizerService, HtmlSanitizerService>();
        s.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
        s.AddScoped<AuthService>();
        s.AddScoped<PageService>();
        s.AddScoped<PostService>();
        s.AddScoped<TaxonomyService>();
        s.AddScoped<MediaService>();
        s.AddScoped<UserService>();
        s.AddScoped<CompanyService>();
        s.AddScoped<SettingsService>();
        s.AddScoped<DashboardService>();
        s.AddScoped<PublicService>();
        return s;
    }
}
