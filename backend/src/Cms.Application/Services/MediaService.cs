using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Interfaces;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Cms.Application.Services;

public class MediaOptions
{
    public long MaxUploadBytes { get; set; } = 10 * 1024 * 1024;
}

public static class FileValidator
{
    public static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".png"] = "image/png",
        [".gif"] = "image/gif", [".webp"] = "image/webp", [".pdf"] = "application/pdf",
    };

    /// <summary>True when the leading bytes match the signature for the extension.</summary>
    public static bool SignatureMatches(string extension, ReadOnlySpan<byte> h)
    {
        return extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => h.Length >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF,
            ".png" => h.Length >= 8 && h[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            ".gif" => h.Length >= 6 && (h[..6].SequenceEqual("GIF87a"u8) || h[..6].SequenceEqual("GIF89a"u8)),
            ".webp" => h.Length >= 12 && h[..4].SequenceEqual("RIFF"u8) && h[8..12].SequenceEqual("WEBP"u8),
            ".pdf" => h.Length >= 5 && h[..5].SequenceEqual("%PDF-"u8),
            _ => false,
        };
    }

    public static string SafeDisplayName(string name)
    {
        var n = Path.GetFileName(name.Replace('\\', '/'));
        foreach (var c in Path.GetInvalidFileNameChars()) n = n.Replace(c, '_');
        n = n.Replace("..", "_").Trim();
        return n.Length > 200 ? n[^200..] : n;
    }
}

public class MediaService(IAppDbContext db, IFileStorage storage, MediaOptions options)
{
    public static MediaDto ToDto(MediaFile m) => new(m.Id, m.OriginalName, m.ContentType, m.Size, ContentMapping.MediaUrl(m.Id), m.CreatedAt);

    public async Task<PagedResult<MediaDto>> ListAsync(string? search, string? type, int page, int pageSize, CancellationToken ct)
    {
        var (p, s) = Paging.Normalize(page, pageSize);
        var q = db.MediaFiles.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) { var t = search.Trim().ToLower(); q = q.Where(m => m.OriginalName.ToLower().Contains(t)); }
        if (type == "image") q = q.Where(m => m.ContentType.StartsWith("image/"));
        else if (type == "document") q = q.Where(m => m.ContentType == "application/pdf");
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id).Skip((p - 1) * s).Take(s).ToListAsync(ct);
        return new(items.Select(ToDto).ToList(), total, p, s);
    }

    public async Task<MediaDto> UploadAsync(string fileName, long length, Stream content, int? userId, CancellationToken ct)
    {
        if (length <= 0) throw new BadRequestException("The file is empty.");
        if (length > options.MaxUploadBytes) throw new BadRequestException($"File exceeds the maximum size of {options.MaxUploadBytes / (1024 * 1024)} MB.");
        var display = FileValidator.SafeDisplayName(fileName);
        var ext = Path.GetExtension(display);
        if (!FileValidator.AllowedExtensions.TryGetValue(ext, out var contentType))
            throw new BadRequestException("Unsupported file type. Allowed: JPG, PNG, GIF, WebP, PDF.");

        using var ms = new MemoryStream();
        var limited = new byte[81920]; int read; long total = 0;
        while ((read = await content.ReadAsync(limited, ct)) > 0)
        {
            total += read;
            if (total > options.MaxUploadBytes) throw new BadRequestException("File exceeds the maximum upload size.");
            ms.Write(limited, 0, read);
        }
        if (!FileValidator.SignatureMatches(ext, ms.GetBuffer().AsSpan(0, (int)Math.Min(ms.Length, 16))))
            throw new BadRequestException("File content does not match its extension.");

        var stored = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        ms.Position = 0;
        await storage.SaveAsync(stored, ms, ct);
        var m = new MediaFile { OriginalName = display, StoredName = stored, ContentType = contentType, Size = ms.Length, UploadedById = userId };
        db.MediaFiles.Add(m);
        try { await db.SaveChangesAsync(ct); }
        catch { await storage.DeleteAsync(stored, CancellationToken.None); throw; }
        return ToDto(m);
    }

    public async Task<(Stream stream, string contentType, string name)> OpenAsync(int id, CancellationToken ct)
    {
        var m = await db.MediaFiles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Media not found.");
        var s = await storage.OpenReadAsync(m.StoredName, ct) ?? throw new NotFoundException("The file is missing from storage.");
        return (s, m.ContentType, m.OriginalName);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var m = await db.MediaFiles.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Media not found.");
        // Content that referenced this file keeps working: FeaturedImageId is cleared (SetNull) by the database.
        db.MediaFiles.Remove(m);
        await db.SaveChangesAsync(ct);
        try { await storage.DeleteAsync(m.StoredName, ct); }
        catch (IOException) { /* metadata removed; orphaned blob is logged/cleaned up by ops */ }
    }
}
