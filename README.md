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

## Configuration
See `.env.example`. Required: `Jwt__SigningKey` (≥32 chars). Others: `ConnectionStrings__Default`, `Storage__RootPath`, `Media__MaxUploadBytes`, `Cors__Origins__N`, `RateLimit__LoginPermitPerMinute`, `Seed__*`.

## Security considerations
Dev credentials/key are development-only; allowlist HTML sanitization; upload extension + magic-byte + size checks with generated names; login rate limiting; security headers; ProblemDetails without stack traces outside Development; refresh tokens hashed at rest, rotated, reuse-detected. See `docs/deployment.md`.

## Docs
`docs/sdlc.md`, `docs/architecture.md`, `docs/api-documentation.md`, `docs/deployment.md`, `docs/known-issues.md`.

## Known limitations
Not compiled/tested (KI-001/002); migration not generated (KI-004); coverage unmeasured; client-side SEO only; local disk storage only; see `docs/known-issues.md`. Nothing here should be considered "implemented and verified".
