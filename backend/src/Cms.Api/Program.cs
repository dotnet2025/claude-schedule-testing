using System.Text;
using System.Threading.RateLimiting;
using Cms.Api.Middleware;
using Cms.Domain.Constants;
using Cms.Domain.Entities;
using Cms.Infrastructure;
using Cms.Infrastructure.Authentication;
using Cms.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCmsInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.Configure<ApiBehaviorOptions>(o => o.InvalidModelStateResponseFactory = ctx =>
{
    var pd = new ValidationProblemDetails(ctx.ModelState) { Status = 400, Title = "Validation failed", Instance = ctx.HttpContext.Request.Path };
    return new BadRequestObjectResult(pd) { ContentTypes = { "application/problem+json" } };
});

var jwt = builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = jwt.Issuer,
        ValidateAudience = true, ValidAudience = jwt.Audience,
        ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(10),
        RoleClaimType = System.Security.Claims.ClaimTypes.Role, NameClaimType = System.Security.Claims.ClaimTypes.Name,
    };
    // Reject access tokens of users that were deactivated, deleted or whose role changed after the token was issued.
    o.Events = new JwtBearerEvents
    {
        OnTokenValidated = async ctx =>
        {
            var idClaim = ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var role = ctx.Principal?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var ok = int.TryParse(idClaim, out var uid)
                && await db.Users.AsNoTracking().AnyAsync(u => u.Id == uid && u.IsActive && u.Role == role, ctx.HttpContext.RequestAborted);
            if (!ok) ctx.Fail("User is inactive, deleted or has a different role.");
        },
    };
});
builder.Services.AddAuthorizationBuilder()
    .AddPolicy(Policies.AdminOnly, p => p.RequireRole(Roles.Admin))
    .AddPolicy(Policies.EditorOrAdmin, p => p.RequireRole(Roles.Admin, Roles.Editor));

var permit = builder.Configuration.GetValue("RateLimit:LoginPermitPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = permit, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (origins.Length > 0) p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
}));

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing")) { app.UseHsts(); app.UseHttpsRedirection(); }
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
if (app.Environment.IsDevelopment()) app.MapOpenApi(); // OpenAPI JSON at /openapi/v1.json
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Configuration.GetValue("Database:MigrateOnStartup", true))
    {
        await db.Database.MigrateAsync();
    }
    await DbSeeder.SeedAsync(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>(),
        scope.ServiceProvider.GetRequiredService<SeedOptions>());
}

app.Run();

public partial class Program;
