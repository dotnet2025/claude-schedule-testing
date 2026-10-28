# claude-schedule-testing

Testing Repo for Claude schedule testing. *(Original README content preserved.)*

The `develop` branch additionally contains a full-stack **Content Management System** (ASP.NET Core + React).

> ## ⚠️ Status: written, not verified
> This code was generated in an environment with **no .NET SDK and no access to NuGet/npm**, so it has **never been compiled, installed, run or tested**. Treat every "works" below as *intended behaviour*. Read `docs/known-issues.md` first and `tests/test-results/test-execution-summary.md` for (non-)results.

## Overview
Pages and posts with a TipTap rich-text editor, media library, categories/tags, user management (Admin/Editor), website settings, dashboard, and a public React website (home, blog, post, CMS pages, category, search, 404).

## Technology stack
.NET 10 / ASP.NET Core Web API, EF Core 10 + SQLite, JWT + rotating refresh tokens, built-in OpenAPI; React 19 + TypeScript + Vite, Material UI, TipTap 2; xUnit + WebApplicationFactory, Vitest + RTL + MSW, Playwright.

## Prerequisites
.NET SDK 10, Node 22+, `dotnet-ef` (`dotnet tool install --global dotnet-ef`).

## Installation & database
```bash
cd backend && dotnet restore Cms.slnx
# one-time: create the initial migration (not yet committed, see KI-004)
dotnet ef migrations add InitialCreate --project src/Cms.Infrastructure --startup-project src/Cms.Api --output-dir Migrations
# the API applies migrations on startup (Database:MigrateOnStartup); or manually:
dotnet ef database update --project src/Cms.Infrastructure --startup-project src/Cms.Api
cd ../frontend && npm install
```

## Development admin login
In `Development` only (`backend/src/Cms.Api/appsettings.Development.json`): **admin@example.com / Admin123!dev**, plus demo content. Override with `Seed__AdminEmail`, `Seed__AdminPassword`; disable with `Seed__Enabled=false` (default outside Development).

## Running
```bash
cd backend/src/Cms.Api && dotnet run          # http://localhost:5080  (OpenAPI: /openapi/v1.json)
cd frontend && npm run dev                    # http://localhost:5173  (proxies /api)
```
Public site `/`, admin `/admin`, login `/login`.

## Authorization matrix
| Capability | Admin | Editor |
|---|---|---|
| Pages, posts, media, categories, tags (CRUD, publish) | ✔ | ✔ |
| Dashboard | ✔ (incl. user count) | ✔ |
| Users, roles, password reset | ✔ | ✘ |
| Website settings (write) | ✔ | ✘ |

Enforced by backend policies `AdminOnly` / `EditorOrAdmin`.

## Testing
```bash
dotnet test backend/Cms.slnx
cd frontend && npm run typecheck && npm run lint && npm run build && npm run test -- --run
cd tests/e2e && npm install && npx playwright install chromium && npx playwright test
```
See `tests/test-plan.md`, `tests/test-cases/`, `tests/test-results/`.

## Company–User mapping (Masters → Company Users)
> Written in a run with no .NET SDK / npm / browser: **uncompiled and unexecuted** (KI-020..KI-025).

**Design.** Many-to-many between `Company` and `User` through `CompanyUser` (`CompanyUserId` PK; `CompanyId`, `UserId` FKs with `Restrict`; `IsActive` default true; `IsPrimaryCompany` default false; `CreatedAt/UpdatedAt` UTC; `CreatedById/UpdatedById` → User, `SetNull`). Company and User are not duplicated; `User` gained `FirstName`, `LastName`, `Username` (unique, lower-case), `Phone`, `UpdatedAt` and `Company` was added as a minimal master (KI-020). `DisplayName` stays and is derived as first + last.

**Schema / rules.** Unique `(CompanyId, UserId)`; partial unique index `UX_CompanyUsers_OnePrimaryPerUser` on `UserId WHERE IsPrimaryCompany = 1 AND IsActive = 1`. The primary rule is enforced twice: by that index (last line of defence, tested with raw SQL) and by `CompanyUserService`, which inside one transaction demotes the user's other primary before promoting the new one. SQLite has a single writer, so concurrent calls are serialised; lock/unique-index failures are retried up to 6 times and then reported as 409. Unassign = soft delete (`IsActive=false`, `IsPrimaryCompany=false` – a user may end up with no primary); users and companies are never deleted. Assigning again to an *inactive* mapping **reactivates** it (200 instead of 201). Inactive companies cannot receive assignments (400); inactive users cannot receive active assignments (400); an inactive mapping cannot be primary (400); duplicates of an active mapping are 409. Only status and primary flag are editable. Membership never changes the system role (Admin/Editor). No legacy `User.CompanyId` exists in this branch, so none was migrated.

**API (all Admin-only; Editor 403, anonymous 401; errors are ProblemDetails; lists `{items,total,page,pageSize,totalPages}`).**

| Endpoint | Purpose |
|---|---|
| `GET /api/company-users?search&companyId&userId&userIsActive&assignmentIsActive&sortBy&desc&page&pageSize` | list (sortBy: company, code, user, username, email, role, status, primary, created) |
| `GET /api/company-users/{id}` | details |
| `POST /api/company-users` `{companyId,userId,isActive,isPrimaryCompany}` | assign existing user (201, or 200 when reactivated) |
| `PUT /api/company-users/{id}` `{isActive,isPrimaryCompany}` | edit assignment |
| `DELETE /api/company-users/{id}` | unassign (204, soft) |
| `GET /api/companies/{companyId}/users` | users of a company |
| `POST /api/companies/{companyId}/users` | create NEW user (via `UserService.CreateEntityAsync`, same password hashing) + assignment in ONE transaction; returns `{user, assignment}` |
| `POST /api/companies/{companyId}/users/assign` | assign existing user to that company |
| `GET /api/users/{userId}/companies` | companies of a user |
| `GET/POST/PUT /api/companies`, `GET /api/companies/{id}` | minimal Company master (KI-020) |

**UI.** Sidebar *Masters*: Company Master (`/admin/masters/companies`, details with *General Information* / *Users* tabs at `/admin/masters/companies/:id`), User Master (`/admin/masters/users`, the existing Users page; `/admin/users` still works), Company Users (`/admin/masters/company-users`). Components in `frontend/src/features/companies/`: `CompanyUserList` (server-side search, filters, sorting, paging, view/edit/remove), `CompanyUsersTab`, `AssignUserDialog`, `CreateCompanyUserDialog`, `EditCompanyUserDialog`, `RemoteAutocomplete` (server-side searchable dropdown).

**Tests.** `backend/tests/Cms.Api.Tests/CompanyUserTests.cs` (xUnit, incl. parallel primary updates and transaction rollback via an SQLite trigger), `frontend/src/features/companies/companyUsers.test.tsx` (Vitest/RTL/MSW), `tests/e2e/company-users.spec.ts` (Playwright), cases in `tests/test-cases/company-users.md`. **Results: Not Run (no toolchain).** Commands: see *Testing* above.

**Assumptions / limitations.** Hand-authored migration + snapshot (regenerate, KI-021); SQLite concurrency (KI-023); initial password is set by the admin, no invite flow (KI-025); the old Users page does not edit Username/Phone (KI-024); no company-level content restrictions.

## Configuration
See `.env.example`. Required: `Jwt__SigningKey` (≥32 chars). Others: `ConnectionStrings__Default`, `Storage__RootPath`, `Media__MaxUploadBytes`, `Cors__Origins__N`, `RateLimit__LoginPermitPerMinute`, `Seed__*`.

## Security considerations
Dev credentials/key are development-only; allowlist HTML sanitization; upload extension + magic-byte + size checks with generated names; login rate limiting; security headers; ProblemDetails without stack traces outside Development; refresh tokens hashed at rest, rotated, reuse-detected. See `docs/deployment.md`.

## Docs
`docs/sdlc.md`, `docs/architecture.md`, `docs/api-documentation.md`, `docs/deployment.md`, `docs/known-issues.md`.

## Known limitations
Not compiled/tested (KI-001/002); migration not generated (KI-004); coverage unmeasured; client-side SEO only; local disk storage only; see `docs/known-issues.md`. Nothing here should be considered "implemented and verified".
