using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Cms.Application.Common;

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
}

public class NotFoundException(string message) : Exception(message);
public class ConflictException(string message) : Exception(message);
public class ForbiddenException(string message) : Exception(message);
public class UnauthorizedException(string message) : Exception(message);
public class BadRequestException(string message) : Exception(message);

public static class Paging
{
    public static (int page, int size) Normalize(int page, int size)
        => (Math.Max(1, page), Math.Clamp(size <= 0 ? 10 : size, 1, 100));
}

public static partial class SlugHelper
{
    public static string Slugify(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "";
        var normalized = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
        var s = NonSlug().Replace(sb.ToString(), "-");
        s = Dashes().Replace(s, "-").Trim('-');
        return s.Length > 200 ? s[..200].Trim('-') : s;
    }

    public static bool IsValid(string? slug) => !string.IsNullOrEmpty(slug) && slug.Length <= 200 && ValidSlug().IsMatch(slug);

    [GeneratedRegex("[^a-z0-9]+")] private static partial Regex NonSlug();
    [GeneratedRegex("-{2,}")] private static partial Regex Dashes();
    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")] private static partial Regex ValidSlug();
}
