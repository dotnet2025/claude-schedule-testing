using Cms.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Cms.Api.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> log, IHostEnvironment env)
{
    public async Task Invoke(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (OperationCanceledException) when (ctx.RequestAborted.IsCancellationRequested) { ctx.Response.StatusCode = 499; }
        catch (Exception ex)
        {
            var (status, title) = ex switch
            {
                NotFoundException => (404, "Not Found"),
                ConflictException => (409, "Conflict"),
                BadRequestException => (400, "Bad Request"),
                UnauthorizedException => (401, "Unauthorized"),
                ForbiddenException => (403, "Forbidden"),
                DbUpdateConcurrencyException => (409, "Conflict"),
                DbUpdateException => (409, "Conflict"),
                BadHttpRequestException b => (b.StatusCode, "Bad Request"),
                _ => (500, "Internal Server Error"),
            };
            if (status >= 500) log.LogError(ex, "Unhandled exception for {Path}", ctx.Request.Path);
            if (ctx.Response.HasStarted) throw;
            ctx.Response.Clear();
            ctx.Response.StatusCode = status;
            var detail = status >= 500 ? (env.IsDevelopment() ? ex.ToString() : "An unexpected error occurred.")
                : ex is DbUpdateException ? "The change conflicts with existing data." : ex.Message;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title, Detail = detail, Instance = ctx.Request.Path },
                options: null, contentType: "application/problem+json");
        }
    }
}

public class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task Invoke(HttpContext ctx)
    {
        var h = ctx.Response.Headers;
        h["X-Content-Type-Options"] = "nosniff";
        h["X-Frame-Options"] = "DENY";
        h["Referrer-Policy"] = "strict-origin-when-cross-origin";
        h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        return next(ctx);
    }
}
