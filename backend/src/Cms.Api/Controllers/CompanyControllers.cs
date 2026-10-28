using Cms.Api.Extensions;
using Cms.Application.Common;
using Cms.Application.DTOs;
using Cms.Application.Services;
using Cms.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cms.Api.Controllers;

/// <summary>Minimal Company master (prerequisite). Admin only.</summary>
[ApiController, Route("api/companies"), Authorize(Policy = Policies.AdminOnly)]
public class CompaniesController(CompanyService svc, CompanyUserService mappings) : ControllerBase
{
    [HttpGet] public Task<PagedResult<CompanyDto>> List(string? search, bool? isActive, int page = 1, int pageSize = 10, CancellationToken ct = default) => svc.ListAsync(search, isActive, page, pageSize, ct);
    [HttpGet("{id:int}")] public Task<CompanyDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);
    [HttpPost] public async Task<ActionResult<CompanyDto>> Create(CompanyRequest r, CancellationToken ct) => StatusCode(201, await svc.CreateAsync(r, User.GetUserId(), ct));
    [HttpPut("{id:int}")] public Task<CompanyDto> Update(int id, CompanyRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);

    // ---- Company -> users ----
    /// <summary>Users assigned to a company (active and inactive assignments unless filtered).</summary>
    [HttpGet("{companyId:int}/users")]
    public Task<PagedResult<CompanyUserDto>> Users(int companyId, string? search, bool? assignmentIsActive, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => mappings.ListForCompanyAsync(companyId, search, assignmentIsActive, page, pageSize, ct);

    /// <summary>Create a NEW user and assign it to this company in one transaction.</summary>
    [HttpPost("{companyId:int}/users")]
    public async Task<ActionResult<CreatedCompanyUserResultDto>> CreateUser(int companyId, CreateCompanyUserRequest r, CancellationToken ct)
        => StatusCode(201, await mappings.CreateUserAndAssignAsync(companyId, r, User.GetUserId(), ct));

    /// <summary>Assign an EXISTING user to this company (201 new, 200 when an inactive mapping was reactivated).</summary>
    [HttpPost("{companyId:int}/users/assign")]
    public async Task<ActionResult<CompanyUserDto>> AssignExisting(int companyId, AssignExistingUserRequest r, CancellationToken ct)
    {
        var (dto, created) = await mappings.AssignAsync(companyId, r.UserId, r.IsActive, r.IsPrimaryCompany, User.GetUserId(), ct);
        return created ? StatusCode(201, dto) : Ok(dto);
    }
}

[ApiController, Route("api/company-users"), Authorize(Policy = Policies.AdminOnly)]
public class CompanyUsersController(CompanyUserService svc) : ControllerBase
{
    [HttpGet]
    public Task<PagedResult<CompanyUserDto>> List(string? search, int? companyId, int? userId, bool? userIsActive, bool? assignmentIsActive,
        string? sortBy, bool desc = false, int page = 1, int pageSize = 10, CancellationToken ct = default)
        => svc.ListAsync(search, companyId, userId, userIsActive, assignmentIsActive, sortBy, desc, page, pageSize, ct);

    [HttpGet("{id:int}")] public Task<CompanyUserDto> Get(int id, CancellationToken ct) => svc.GetAsync(id, ct);

    [HttpPost]
    public async Task<ActionResult<CompanyUserDto>> Assign(AssignCompanyUserRequest r, CancellationToken ct)
    {
        var (dto, created) = await svc.AssignAsync(r.CompanyId, r.UserId, r.IsActive, r.IsPrimaryCompany, User.GetUserId(), ct);
        return created ? StatusCode(201, dto) : Ok(dto);
    }

    [HttpPut("{id:int}")] public Task<CompanyUserDto> Update(int id, UpdateCompanyUserRequest r, CancellationToken ct) => svc.UpdateAsync(id, r, User.GetUserId(), ct);
    [HttpDelete("{id:int}")] public async Task<IActionResult> Unassign(int id, CancellationToken ct) { await svc.UnassignAsync(id, User.GetUserId(), ct); return NoContent(); }
}

[ApiController, Route("api/users/{userId:int}/companies"), Authorize(Policy = Policies.AdminOnly)]
public class UserCompaniesController(CompanyUserService svc) : ControllerBase
{
    [HttpGet] public Task<List<UserCompanyDto>> List(int userId, CancellationToken ct) => svc.ListForUserAsync(userId, ct);
}
