using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.IdentityModel.Tokens;

namespace Cms.Infrastructure.Authentication;

public class JwtOptions
{
    public const string Section = "Jwt";
    public string Issuer { get; set; } = "cms-api";
    public string Audience { get; set; } = "cms-clients";
    /// <summary>Must be supplied via configuration/environment (min 32 chars). Never committed for production.</summary>
    public string SigningKey { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}

public class TokenService(JwtOptions opt) : ITokenService
{
    public TimeSpan RefreshLifetime => TimeSpan.FromDays(opt.RefreshTokenDays);

    public (string token, DateTime expiresAt) CreateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(opt.SigningKey));
        var expires = DateTime.UtcNow.AddMinutes(opt.AccessTokenMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role),
        };
        var jwt = new JwtSecurityToken(opt.Issuer, opt.Audience, claims, DateTime.UtcNow.AddSeconds(-5), expires,
            new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
    }

    public string GenerateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
