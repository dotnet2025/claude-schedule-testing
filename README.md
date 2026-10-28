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

## UI design system & branding

The admin UI and public site use a **single, centralised design system** built on **Material UI (MUI) v7** with a custom theme. No third-party admin template or paid/premium component is used.

| Item | Detail |
|---|---|
| Library | `@mui/material`, `@mui/icons-material` (MIT licence, free for commercial use) with `@emotion/*` (MIT). Layout, theme and components are original code in this repository. |
| Theme | `frontend/src/theme/theme.ts` (palette, typography, shape, shadows, button/input/table/dialog/chip overrides, 44px touch targets on coarse pointers, focus rings) |
| Tokens | `frontend/src/theme/tokens.ts` (radii, shadows, layout sizes, transitions) |
| Branding | **`frontend/src/theme/brand.ts`** is the only file to edit to re-brand: name, tagline, logo paths, colours, font. The public site reads the same colours through CSS variables set in `PublicLayout`. |
| Reusable UX | `PageHeader`, `DataTable` (loading skeleton, error, empty state, sortable headers, pagination, horizontal scroll), `FilterBar`, `StatusChip`, `ConfirmDialog`, `ErrorPage` (403/404/500), `ErrorBoundary`, toasts, `BrandLogo` in `frontend/src/components/` |
| Responsive | Permanent sidebar >= 900px, drawer below; tables scroll inside their card (never the page); forms and dashboard cards reflow; >= 44px touch targets on touch devices |
| Accessibility | WCAG AA contrast for the palette (asserted by `src/theme/brand.test.ts`), skip links, visible focus, labelled controls and landmarks. Existing accessible names used by tests/Playwright were kept. |

**Branding source and attribution.** Branding follows WeblineIndia (https://www.weblineindia.com/). The only colour taken from the official site is its published `theme-color` `#2196f3` (kept as the accent); primary/secondary/neutral shades are derived by us for AA contrast. **The official logo is NOT bundled**: it could not be downloaded from an authorised source in the build environment (see KI-013), so `frontend/public/brand/logo-placeholder*.svg` are clearly marked, replaceable placeholders (not an imitation of the real logo). To use the real logo, obtain it from WeblineIndia's brand assets, drop it in `frontend/public/brand/`, and change `logo.src` / `logo.srcLight` in `brand.ts`. WeblineIndia's logo and name remain their trademarks; confirm usage rights before publishing. The favicon (`public/favicon.svg`) is our own generic monogram.

Design decisions: sidebar navy (`#0b1f3a`) for strong brand presence and contrast; cards with 1px borders and soft shadows instead of heavy elevation; pill chips for status; two-column content editor (content + publish/organise/image panels) collapsing to one column on tablets and phones; a new **My profile** page (`/admin/profile`) with change-password using `POST /api/auth/change-password`.

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
