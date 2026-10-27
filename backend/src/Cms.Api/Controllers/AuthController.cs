using Cms.Api.Extensions;
using Cms.Application.DTOs;
using Cms.Application.Services;
using Cms.Infrastructure.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Cms.Api.Controllers;

[ApiController, Route("api/auth")]
public class AuthController(AuthService auth, JwtOptions jwt, IWebHostEnvironment env) : ControllerBase
{
    private const string Cookie = "cms_refresh";

    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
    {
        var r = await auth.LoginAsync(req, ct);
        SetCookie(r.RefreshToken);
        return r;
    }

    [HttpPost("refresh"), AllowAnonymous, EnableRateLimiting("login")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest? req, CancellationToken ct)
    {
        var token = req?.RefreshToken ?? Request.Cookies[Cookie];
        var r = await auth.RefreshAsync(token, ct);
        SetCookie(r.RefreshToken);
        return r;
    }

    [HttpPost("logout"), AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? req, CancellationToken ct)
    {
        await auth.LogoutAsync(req?.RefreshToken ?? Request.Cookies[Cookie], ct);
        Response.Cookies.Delete(Cookie, new CookieOptions { Path = "/api/auth" });
        return NoContent();
    }

    [HttpGet("me"), Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct) => await auth.MeAsync(User.GetUserId()!.Value, ct);

    [HttpPost("change-password"), Authorize]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req, CancellationToken ct)
    {
        await auth.ChangePasswordAsync(User.GetUserId()!.Value, req, ct);
        return NoContent();
    }

    private void SetCookie(string token) => Response.Cookies.Append(Cookie, token, new CookieOptions
    {
        HttpOnly = true, Secure = !env.IsDevelopment(), SameSite = SameSiteMode.Strict, Path = "/api/auth",
        Expires = DateTimeOffset.UtcNow.AddDays(jwt.RefreshTokenDays),
    });
}
