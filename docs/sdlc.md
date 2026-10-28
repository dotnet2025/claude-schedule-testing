# SDLC record

## 1. Requirements analysis
**Scope:** full CMS: auth (JWT + rotating refresh tokens), Admin/Editor RBAC, dashboard, pages, posts, TipTap editor, media library, categories/tags, users, settings, public site, tests, CI, docs.
**Assumptions:** SQLite for dev; integer keys; refresh token delivered both in an HttpOnly cookie and the JSON body (body supports API clients/tests); Swagger UI replaced by the built-in OpenAPI JSON document (`/openapi/v1.json`, Development only) to avoid an extra dependency; demo data only when `Seed:DemoContent=true`.
**Acceptance criteria:** the "Definition of Done" list in the task. Status of each is in `README.md` → *Known limitations* and `docs/known-issues.md`.

## 2. Design
See `docs/architecture.md` (layers, data model, API contracts, UI structure) and `docs/api-documentation.md`.

## 3. Implementation
Order followed: domain → application services → infrastructure → API → backend tests → frontend core/API client → admin features → public site → frontend tests → e2e → CI → docs. Commits: `feat(backend)`, `feat(frontend)`, `test/docs/ci`.
**Important:** all code was written without being able to compile or run it (no .NET SDK, no package registry). Compile errors are likely and have not been looked for by a compiler.

## 4. Testing
Written: 44 xUnit methods, 28 Vitest tests, 14 Playwright tests, 97 documented cases. Executed: **none**. Blocker recorded in `docs/known-issues.md` (KI-001, KI-002).

## 5. Delivery
CI workflow `.github/workflows/ci.yml` (backend, frontend, e2e). Commits are on local branch `develop`. **Push to `origin/develop` failed**: the git proxy returned 403 because `dotnet2025/claude-schedule-testing` is not in this session's authorized repositories (KI-003). No workaround attempted, per policy. The `add_repo` tool was not available in this session.

## 6. Maintenance
Known issues, limitations and next steps: `docs/known-issues.md`.

## 7. UI/UX redesign (Part B, 2026-10-27 scheduled run)
Scope: centralised MUI design system, WeblineIndia branding via `src/theme/brand.ts`, redesign of every screen, new profile/change-password page, 403/404/500 pages, responsive layouts. Analysis found: default MUI theme with an inline `createTheme`, basic AppBar/Drawer layout, hand-rolled tables per page, minimal public CSS. Implementation reused the existing structure and kept APIs, validation and accessible names. **Verification status:** build, typecheck, lint, unit and e2e tests and screenshots were *Not Run* (npm registry and .NET SDK unreachable; KI-001, KI-002, KI-014, KI-015). Palette contrast was verified numerically (>= 5.1:1 for all text/background pairs used).
