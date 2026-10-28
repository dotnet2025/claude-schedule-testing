# claude-schedule-testing

Testing Repo for Claude schedule testing. *(Original README content preserved.)*

The `develop` branch additionally contains a full-stack **Content Management System** (ASP.NET Core + React).

> ## ⚠️ Status: written, not verified (Company Master / User Master added 2026-10-27, also unverified)
> This code was generated in an environment with **no .NET SDK and no access to NuGet/npm**, so it has **never been compiled, installed, run or tested**. Treat every "works" below as *intended behaviour*. Read `docs/known-issues.md` first and `tests/test-results/test-execution-summary.md` for (non-)results.

## Overview
Pages and posts with a TipTap rich-text editor, media library, categories/tags, **Company Master and User Master** (Admin only, under *Masters* in the admin menu), website settings, dashboard, and a public React website (home, blog, post, CMS pages, category, search, 404).

## Technology stack
.NET 10 / ASP.NET Core Web API, EF Core 10 + SQLite, JWT + rotating refresh tokens, built-in OpenAPI; React 19 + TypeScript + Vite, Material UI, TipTap 2; xUnit + WebApplicationFactory, Vitest + RTL + MSW, Playwright.

## Prerequisites
.NET SDK 10, Node 22+, `dotnet-ef` (`dotnet tool install --global dotnet-ef`).

## Installation & database
```bash
cd backend && dotnet restore Cms.slnx
# migrations are committed (InitialCreate, AddCompanyAndUserMaster)
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
| Company Master (`/api/companies`), User Master (`/api/users`): CRUD, status, role, password reset | ✔ | ✘ (403; anonymous 401) |
| Website settings (write) | ✔ | ✘ |

Enforced by backend policies `AdminOnly` / `EditorOrAdmin`.

## Company Master
Fields: `CompanyCode` (required, unique, ≤30, stored upper-case), `CompanyName` (≤200), `Email`, `Phone` (≤25), `Website` (http/https), `AddressLine1/2` (≤250), `City/State/Country` (≤100), `PostalCode` (≤20), `LogoMediaId` (media library, `SET NULL`), `IsActive`, UTC `CreatedAt/UpdatedAt`, `CreatedBy/UpdatedBy`. Screen: `/admin/masters/companies` – search by code/name, status filter, sort by code/name/created, server-side paging, add/view/edit, activate/deactivate switch, delete confirmation, logo via MediaPicker. A company that still has users cannot be deleted (409 – deactivate it instead).

## User Master
Extends the existing user module (no second user entity): `FirstName`, `LastName`, `Username` (unique, case-insensitive), `Email` (unique), `Phone`, `Role` (Admin/Editor), `IsActive`, `LastLoginAt`, `CompanyId`, audit fields; `DisplayName` is derived from first+last name. Screen: `/admin/masters/users` (`/admin/users` redirects) – search by name/e-mail/username, role/status/company filters, sorting, paging, add/view/edit, assign role, activate/deactivate, reset-password dialog, delete. Rules: Admin only; last active Admin cannot be demoted/deactivated/deleted; inactive users cannot sign in or refresh and their existing access tokens are rejected; users referenced by content/audit rows cannot be deleted (deactivate); role is changed only through `PATCH /api/users/{id}/role`; password reset revokes refresh tokens; hashes/tokens are never returned. Sign-in accepts e-mail **or** username.

## Database changes & migration
New migration `AddCompanyAndUserMaster`: table `Companies` (unique `CompanyCode`), new `Users` columns (`FirstName, LastName, Username` unique, `Phone, UpdatedAt, LastLoginAt, CompanyId, CreatedById, UpdatedById`), back-fill of existing users (DisplayName split into first/last, username = e-mail local part, later duplicates get `-{Id}`, `UpdatedAt = CreatedAt`). **The migration files were hand-authored without a .NET SDK and have never been compiled or applied (KI-013).** Verify with:
```bash
cd backend
dotnet ef migrations has-pending-model-changes --project src/Cms.Infrastructure --startup-project src/Cms.Api   # must report none
dotnet ef database update --project src/Cms.Infrastructure --startup-project src/Cms.Api                      # clean DB
# existing DB: dotnet ef database update InitialCreate ..., insert users, then update to latest
```
Rollback: `dotnet ef database update InitialCreate`. The Testing-only `EnsureCreated` fallback was removed.

## API summary (Company / User Master)
`GET/POST /api/companies`, `GET/PUT/DELETE /api/companies/{id}`, `PATCH /api/companies/{id}/status`; `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}`, `PATCH /api/users/{id}/status`, `PATCH /api/users/{id}/role`, `POST /api/users/{id}/reset-password`. Details in `docs/api-documentation.md`.

## Testing
```bash
dotnet test backend/Cms.slnx
cd frontend && npm run typecheck && npm run lint && npm run build && npm run test -- --run
cd tests/e2e && npm install && npx playwright install chromium && npx playwright test
```
See `tests/test-plan.md`, `tests/test-cases/` (`companies.md`, `users.md` …), `tests/test-results/`.

**Actual results for the Company/User Master work:** *Not run.* In the authoring environment `dotnet` is not installed and NuGet/npm/dot.net are blocked (403), so `dotnet build/test`, `npm run typecheck/lint/build/test` and Playwright could not execute (0 passed, 0 failed, all Blocked). Only a syntax-only parse of the new TypeScript was done (0 errors). Written: 40 xUnit tests (`CompanyMasterTests`, `UserMasterTests`), ~21 Vitest tests, 3 Playwright tests. Run the commands above to obtain real results.

## Configuration
See `.env.example`. Required: `Jwt__SigningKey` (≥32 chars). Others: `ConnectionStrings__Default`, `Storage__RootPath`, `Media__MaxUploadBytes`, `Cors__Origins__N`, `RateLimit__LoginPermitPerMinute`, `Seed__*`.

## Security considerations
Dev credentials/key are development-only; allowlist HTML sanitization; upload extension + magic-byte + size checks with generated names; login rate limiting; security headers; ProblemDetails without stack traces outside Development; refresh tokens hashed at rest, rotated, reuse-detected. See `docs/deployment.md`.

## Docs
`docs/sdlc.md`, `docs/architecture.md`, `docs/api-documentation.md`, `docs/deployment.md`, `docs/known-issues.md`.

## Known limitations
Not compiled/tested (KI-001/002); hand-authored migration unverified (KI-013); coverage unmeasured; client-side SEO only; local disk storage only; see `docs/known-issues.md`. Nothing here should be considered "implemented and verified".
