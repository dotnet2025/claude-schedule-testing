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

## Addendum – Company Master & User Master (2026-10-27)
**Requirements:** complete CRUD for companies and users on the existing stack; no duplicate user module. **Design:** `Company` entity + `User` extensions (names, username, phone, LastLoginAt, audit, CompanyId); `CompanyService`/`UserService`; `CompaniesController`/`UsersController` (Admin-only); one hand-authored migration; "Masters" nav group and two screens under `features/masters`. **Decisions:** `DisplayName` stays as a stored column derived from first+last name (keeps `CreatedBy.DisplayName` queries and JWT name claim working); usernames and company codes are normalised (lower-case / upper-case) so uniqueness is case-insensitive on SQLite; `PUT /users` is profile-only (role/status/password have dedicated admin endpoints); referenced users/companies return 409 and must be deactivated; access tokens are re-validated against the DB so deactivation/demotion apply immediately. **Testing:** 40 xUnit + ~21 Vitest + 3 Playwright methods written, **none executed** (no .NET SDK, npm blocked – KI-013/014). **Delivery:** commits per milestone on `develop`; push status is recorded in the final run report.
