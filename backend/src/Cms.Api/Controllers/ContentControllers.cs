using Cms.Api.Extensions;
using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Services;
using Cms.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cms.Api.Controllers;

[ApiController, Route("api/pages"), Authorize(Policy = Policies.EditorOrAdmin)]
public class PagesController(PageService svc) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<ContentSummaryDto>> List(string? search, string? status, string? sortBy, bool desc = true, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => svc.ListAsync(new ContentQuery(search, status, sortBy, desc, page, pageSize), ct);

    [HttpGet("{id:int}")] public Task<ContentDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);

    [HttpPost]
    public async Task<ActionResult<ContentDto>> Create(ContentRequest r, CancellationToken ct)
    {
        var dto = await svc.CreateAsync(r, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")] public Task<ContentDto> Update(int id, ContentRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteAsync(id, ct); return NoContent(); }

    [HttpPatch("{id:int}/publish")] public Task<ContentDto> Publish(int id, CancellationToken ct) => svc.SetStatusAsync(id, true, User.GetUserId(), ct);
    [HttpPatch("{id:int}/unpublish")] public Task<ContentDto> Unpublish(int id, CancellationToken ct) => svc.SetStatusAsync(id, false, User.GetUserId(), ct);
}

[ApiController, Route("api/posts"), Authorize(Policy = Policies.EditorOrAdmin)]
public class PostsController(PostService svc) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<ContentSummaryDto>> List(string? search, string? status, string? sortBy, int? categoryId, int? tagId, bool desc = true, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => svc.ListAsync(new ContentQuery(search, status, sortBy, desc, page, pageSize, categoryId, tagId), ct);

    [HttpGet("{id:int}")] public Task<ContentDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);

    [HttpPost]
    public async Task<ActionResult<ContentDto>> Create(ContentRequest r, CancellationToken ct)
    {
        var dto = await svc.CreateAsync(r, User.GetUserId(), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpPut("{id:int}")] public Task<ContentDto> Update(int id, ContentRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteAsync(id, ct); return NoContent(); }

    [HttpPatch("{id:int}/publish")] public Task<ContentDto> Publish(int id, CancellationToken ct) => svc.SetStatusAsync(id, true, User.GetUserId(), ct);
    [HttpPatch("{id:int}/unpublish")] public Task<ContentDto> Unpublish(int id, CancellationToken ct) => svc.SetStatusAsync(id, false, User.GetUserId(), ct);
}

[ApiController, Route("api/categories"), Authorize(Policy = Policies.EditorOrAdmin)]
public class CategoriesController(TaxonomyService svc) : ControllerBase
{
    [HttpGet] public Task<List<TaxonomyDto>> List(CancellationToken ct) => svc.ListCategoriesAsync(ct);
    [HttpPost] public async Task<ActionResult<TaxonomyDto>> Create(TaxonomyRequest r, CancellationToken ct) => StatusCode(201, await svc.CreateCategoryAsync(r, ct));
    [HttpPut("{id:int}")] public Task<TaxonomyDto> Update(int id, TaxonomyRequest r, CancellationToken ct) => svc.UpdateCategoryAsync(id, r, ct);
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteCategoryAsync(id, ct); return NoContent(); }
}

[ApiController, Route("api/tags"), Authorize(Policy = Policies.EditorOrAdmin)]
public class TagsController(TaxonomyService svc) : ControllerBase
{
    [HttpGet] public Task<List<TaxonomyDto>> List(CancellationToken ct) => svc.ListTagsAsync(ct);
    [HttpPost] public async Task<ActionResult<TaxonomyDto>> Create(TaxonomyRequest r, CancellationToken ct) => StatusCode(201, await svc.CreateTagAsync(r, ct));
    [HttpPut("{id:int}")] public Task<TaxonomyDto> Update(int id, TaxonomyRequest r, CancellationToken ct) => svc.UpdateTagAsync(id, r, ct);
    [HttpDelete("{id:int}")] public async Task<IActionResult> Delete(int id, CancellationToken ct) { await svc.DeleteTagAsync(id, ct); return NoContent(); }
}
