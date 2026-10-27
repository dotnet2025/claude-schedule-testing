using Cms.Application.Interfaces;

namespace Cms.Infrastructure.Storage;

public class StorageOptions
{
    public const string Section = "Storage";
    public string RootPath { get; set; } = "uploads";
}

/// <summary>Local disk storage. Only server-generated names are accepted; anything else is rejected (path traversal guard).</summary>
public class LocalFileStorage : IFileStorage
{
    private readonly string _root;
    public LocalFileStorage(StorageOptions options)
    {
        _root = Path.GetFullPath(options.RootPath);
        Directory.CreateDirectory(_root);
    }

    private string Resolve(string storedName)
    {
        if (string.IsNullOrWhiteSpace(storedName) || storedName != Path.GetFileName(storedName) || storedName.Contains(".."))
            throw new ArgumentException("Invalid stored file name.", nameof(storedName));
        var full = Path.GetFullPath(Path.Combine(_root, storedName));
        if (!full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new ArgumentException("Invalid stored file name.", nameof(storedName));
        return full;
    }

    public async Task SaveAsync(string storedName, Stream content, CancellationToken ct)
    {
        await using var fs = new FileStream(Resolve(storedName), FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fs, ct);
    }

    public Task<Stream?> OpenReadAsync(string storedName, CancellationToken ct)
    {
        var p = Resolve(storedName);
        Stream? s = File.Exists(p) ? new FileStream(p, FileMode.Open, FileAccess.Read, FileShare.Read) : null;
        return Task.FromResult(s);
    }

    public Task DeleteAsync(string storedName, CancellationToken ct)
    {
        var p = Resolve(storedName);
        if (File.Exists(p)) File.Delete(p);
        return Task.CompletedTask;
    }
}
