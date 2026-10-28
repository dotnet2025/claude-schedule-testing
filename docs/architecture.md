# Architecture

```
backend/src
  Cms.Domain          entities, enums, role/policy constants (no dependencies)
  Cms.Application     DTOs (DataAnnotations validation), services, interfaces, HTML sanitizer, slug/paging helpers
  Cms.Infrastructure  EF Core DbContext (SQLite), JWT token service, local file storage, seeder, DI wiring
  Cms.Api             controllers, exception/security-header middleware, auth/CORS/rate-limit setup, Program.cs
frontend/src          api/ (fetch client + endpoints), app/ (auth, toast, router), features/*, layouts/, components/, hooks/
tests/                plans, case docs, results, Playwright e2e
```

**Decisions**
- `Cms.Application` references EF Core and exposes `IAppDbContext` (implemented by `AppDbContext`). A separate repository layer was deliberately skipped (`Repositories/` stays empty) to avoid needless abstraction over EF.
- Authorization is enforced by policies `AdminOnly` and `EditorOrAdmin` on controllers; the UI hides menus as a convenience only.
- Slug rules: explicit slug → validated, 409 on duplicate; no slug on create → generated from title, numeric suffix on collision; on edit the existing slug is kept unless a different one is sent.
- Optimistic concurrency uses a `ConcurrencyStamp` GUID compared in the service (409 on mismatch).
- HTML is sanitized (allowlist, Ganss.Xss) before storage; the public site still renders it with `dangerouslySetInnerHTML`, relying on that.
- Tokens: 15-min JWT in memory; refresh token (SHA-256 hashed in DB) rotated on each use, reuse revokes all of the user's tokens; delivered as HttpOnly cookie and in the body.
- Media: extension allowlist + magic-byte check + size cap, server-generated GUID names, `IFileStorage` abstraction.

**Data model:** User, RefreshToken, Page, Post, Category, Tag, join tables `PostCategories`/`PostTags`, MediaFile, WebsiteSettings (single row, Id=1). Unique indexes: user email, page slug, post slug, category/tag name+slug, media stored name, refresh token hash. Media FKs from content/settings use `SET NULL`.

**SEO:** pages set `<title>`, description and canonical client-side. Limitation: crawlers not executing JavaScript will not see per-page metadata. Remedies: prerender at publish time, Vite SSG, or SSR with a Node host.

## Frontend design system (UI redesign)

```
frontend/src/theme/     brand.ts (single branding config) · tokens.ts · theme.ts (MUI theme + component overrides) · index.ts
frontend/src/components PageHeader, DataTable, FilterBar, StatusChip, StateViews (Loading/Empty/ErrorView/TableSkeleton),
                        ConfirmDialog, ErrorPage, ErrorBoundary, BrandLogo, RichTextEditor (themed toolbar + surface)
frontend/src/layouts    AdminLayout (navy sidebar, permanent >= md / temporary drawer below, top bar with profile + sign out), PublicLayout (+ styles/public.css)
frontend/src/features   dashboard, pages (list/edit), media, categories (taxonomy), users, settings, profile (new), auth, public
```

* `main.tsx` mounts `ThemeProvider(theme)`, `CssBaseline`, `ErrorBoundary` (500 screen), toasts and auth.
* Screens never hard-code colours: they use theme palette keys (`primary.main`, `text.secondary`, ...) or `brand.colors` where a raw value is unavoidable (public CSS variables, gradients).
* Listings share `DataTable`; headers share `PageHeader` (title is the page's only `<h1>`, breadcrumbs, actions).
* Routing: new `/admin/profile`; admin unknown paths render an admin 404; unauthorised role renders a 403 `ErrorPage`; public unknown paths render the public 404.
* Behaviour, API calls, validation and accessible names used by unit/e2e tests are unchanged.
