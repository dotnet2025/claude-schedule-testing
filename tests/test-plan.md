# Test plan

**Scope:** every CMS module (auth, roles, dashboard, pages, posts, rich text, media, categories/tags, users, settings, public site, SEO, API, DB, security, responsive UI).

| Layer | Tooling | Location | Command |
|---|---|---|---|
| Backend unit + integration | xUnit, `WebApplicationFactory`, isolated SQLite file per test class | `backend/tests/Cms.Api.Tests` | `dotnet test backend/Cms.slnx` |
| Frontend unit/component | Vitest, React Testing Library, MSW | `frontend/src/**/*.test.ts(x)` | `cd frontend && npm run test -- --run` |
| End-to-end | Playwright (Chromium), dedicated `e2e.db` | `tests/e2e` | `cd tests/e2e && npm install && npx playwright install chromium && npx playwright test` |
| Static checks | `tsc`, ESLint | `frontend` | `npm run typecheck && npm run lint` |

Scenario classes covered: positive, negative, boundary, security, validation, integration, UI, end-to-end, regression (the whole suite re-run in CI on every push). Case-level documentation is in `tests/test-cases/`.

**Known gaps (honest):** no automated viewport/responsive tests, TipTap toolbar behaviour is mocked in jsdom form tests, rate limiting is not asserted (limit raised in tests), concurrency is tested via the optimistic stamp only (no parallel-request race test), no coverage numbers have been measured. See `docs/known-issues.md`.

**Coverage target:** ≥80% line coverage of critical logic (auth, authorization, publishing, validation, file handling). Not yet measured. Measure with `dotnet test --collect:"XPlat Code Coverage"` and `npm run test:coverage`.

**Deterministic by design:** tests use their own temp databases/upload dirs, no external services, and a fixed test signing key.
