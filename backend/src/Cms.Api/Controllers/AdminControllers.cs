using Cms.Api.Extensions;
using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Services;
using Cms.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cms.Api.Controllers;

[ApiController, Route("api/media")]
public class MediaController(MediaService svc) : ControllerBase
{
    [HttpGet, Authorize(Policy = Policies.EditorOrAdmin)]
    public Task<PagedResult<MediaDto>> List(string? search, string? type, int page = 1, int pageSize = 24, CancellationToken ct = default)
        => svc.ListAsync(search, type, page, pageSize, ct);

    [HttpPost, Authorize(Policy = Policies.EditorOrAdmin), RequestSizeLimit(12 * 1024 * 1024)]
    public async Task<ActionResult<MediaDto>> Upload(IFormFile file, CancellationToken ct)
    {
        await using var s = file.OpenReadStream();
        var dto = await svc.UploadAsync(file.FileName, file.Length, s, User.GetUserId(), ct);
        return StatusCode(201, dto);
    }

    /// <summary>Public: published content references media by URL. Served with nosniff and a fixed content type.</summary>
    [HttpGet("{id:int}/file"), AllowAnonymous]
    public async Task<IActionResult> File(int id, CancellationToken ct)
    {
        var (stream, type, name) = await svc.OpenAsync(id, ct);
        Response.Headers.ContentSecurityPolicy = "default-src 'none'; sandbox";
        return File(stream, type, type == "application/pdf" ? name : null, enableRangeProcessing: false);
    }

    [HttpDelete("{id:int}"), Authorize(Policy = Policies.EditorOrAdmin)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/users"), Authorize(Policy = Policies.AdminOnly)]
public class UsersController(UserService svc) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<UserDto>> List(string? search, string? role, bool? isActive, int? companyId, string? sortBy, string? sortDir,
        int page = 1, int pageSize = 10, CancellationToken ct = default) => svc.ListAsync(search, role, isActive, companyId, sortBy, sortDir, page, pageSize, ct);
    [HttpGet("{id:int}")] public Task<UserDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);
    [HttpPost] public async Task<ActionResult<UserDto>> Create(CreateUserRequest r, CancellationToken ct)
    {
        var dto = await svc.CreateAsync(r, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }
    [HttpPut("{id:int}")] public Task<UserDto> Update(int id, UpdateUserRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);
    [HttpPatch("{id:int}/status")] public Task<UserDto> SetStatus(int id, SetStatusRequest r, CancellationToken ct) => svc.SetStatusAsync(id, r.IsActive, User.GetUserId(), ct);
    [HttpPatch("{id:int}/role")] public Task<UserDto> SetRole(int id, SetRoleRequest r, CancellationToken ct) => svc.SetRoleAsync(id, r.Role, User.GetUserId(), ct);
    [HttpPost("{id:int}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, ResetPasswordRequest r, CancellationToken ct) { await svc.ResetPasswordAsync(id, r.NewPassword, User.GetUserId(), ct); return NoContent(); }
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteAsync(id, User.GetUserId(), ct); return NoContent(); }
}

[ApiController, Route("api/companies"), Authorize(Policy = Policies.AdminOnly)]
public class CompaniesController(CompanyService svc) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<CompanyDto>> List(string? search, bool? isActive, string? sortBy, string? sortDir, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => svc.ListAsync(search, isActive, sortBy, sortDir, page, pageSize, ct);
    [HttpGet("{id:int}")] public Task<CompanyDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);
    [HttpPost] public async Task<ActionResult<CompanyDto>> Create(CompanyRequest r, CancellationToken ct)
    {
        var dto = await svc.CreateAsync(r, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.CompanyId }, dto);
    }
    [HttpPut("{id:int}")] public Task<CompanyDto> Update(int id, CompanyRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);
    [HttpPatch("{id:int}/status")] public Task<CompanyDto> SetStatus(int id, SetStatusRequest r, CancellationToken ct) => svc.SetStatusAsync(id, r.IsActive, User.GetUserId(), ct);
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/settings")]
public class SettingsController(SettingsService svc) : ControllerBase
{
    [HttpGet, AllowAnonymous] public Task<SettingsDto> Get(CancellationToken ct) => svc.GetAsync(ct);
    [HttpPut, Authorize(Policy = Policies.AdminOnly)] public Task<SettingsDto> Update(SettingsDto r, CancellationToken ct) => svc.UpdateAsync(r, ct);
}

[ApiController, Route("api/dashboard"), Authorize(Policy = Policies.EditorOrAdmin)]
public class DashboardController(DashboardService svc) : ControllerBase
{
    [HttpGet] public Task<DashboardDto> Get(CancellationToken ct) => svc.GetAsync(User.IsInRole(Roles.Admin), ct);
}

[ApiController, Route("api/public"), AllowAnonymous]
public class PublicController(PublicService svc) : ControllerBase
{
    [HttpGet("pages")] public Task<PagedResult<PublicSummaryDto>> Pages(int page = 1, int pageSize = 20, CancellationToken ct = default) => svc.PagesAsync(page, pageSize, ct);
    [HttpGet("pages/{slug}")] public Task<PublicContentDto> Page(string slug, CancellationToken ct) => svc.PageAsync(slug, ct);
    [HttpGet("posts")]
    public Task<PagedResult<PublicSummaryDto>> Posts(string? category, string? tag, string? search, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => svc.PostsAsync(category, tag, search, page, pageSize, ct);
    [HttpGet("posts/{slug}")] public Task<PublicContentDto> Post(string slug, CancellationToken ct) => svc.PostAsync(slug, ct);
    [HttpGet("posts/{slug}/related")] public Task<List<PublicSummaryDto>> Related(string slug, CancellationToken ct) => svc.RelatedAsync(slug, 3, ct);
    [HttpGet("categories/{slug}/posts")]
    public Task<PagedResult<PublicSummaryDto>> CategoryPosts(string slug, int page = 1, int pageSize = 10, CancellationToken ct = default) => svc.PostsAsync(slug, null, null, page, pageSize, ct);
    [HttpGet("search")] public Task<List<PublicSummaryDto>> Search(string? q, CancellationToken ct) => svc.SearchAsync(q, ct);
}
