using System.Security.Claims;

namespace Cms.Api.Extensions;

public static class CurrentUserExtensions
{
    public static int? GetUserId(this ClaimsPrincipal p)
        => int.TryParse(p.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
}
