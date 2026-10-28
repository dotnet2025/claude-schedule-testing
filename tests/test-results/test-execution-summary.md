# Test execution summary

> **Update 2026-10-27 (scheduled run):** the baseline was re-attempted. `npm install`/`npm ci` fail (registry host does not resolve, HTTP proxy blocks it), `dot.net` returns 403, and so backend build/test, frontend typecheck/lint/build/vitest and Playwright (including the UI redesign screenshots at 1920 to 320 px) are all **Not Run / Blocked**. New unit tests written for the redesign (ProfilePage, DataTable, brand contrast) are also unexecuted; automated frontend methods are now 28 + 6 = 34 written, 0 run.
>
> **Nothing has been executed.** The authoring environment had no .NET SDK, and `dot.net`, NuGet and the npm registry were unreachable (HTTP 403 / DNS failure), so the backend could not be compiled, the frontend dependencies could not be installed, and no test, build, lint, or migration command could run. All figures below are therefore *Not Run*. These are not passes.

| Metric | Value |
|---|---|
| Total test cases designed (documented in `tests/test-cases`) | 97 |
| Automated cases | 78 |
| Manual cases | 19 |
| Automated test methods written | 86 (backend 44 xUnit methods, frontend 28, Playwright 14) |
| Executed | 0 |
| Passed | 0 |
| Failed | 0 |
| Blocked | 86 automated methods (no toolchain) |
| Not run | 97 cases |
| Backend coverage | Not measured |
| Frontend coverage | Not measured |
| Defects identified by tests | None found, because nothing ran. Code review of own output found/fixed: dynamic anonymous-type uniqueness check, JWT claim mapping |
| Defects fixed | 2 (see above) |
| Unresolved issues | See `docs/known-issues.md` |

## Module breakdown

| Module | Designed | Automated | Executed | Result |
|---|---|---|---|---|
| Authentication | 18 | 17 | 0 | Not Run |
| Roles & permissions | 7 | 7 | 0 | Not Run |
| Dashboard | 5 | 3 | 0 | Not Run |
| Pages | 17 | 16 | 0 | Not Run |
| Posts | 6 | 5 | 0 | Not Run |
| Media | 13 | 10 | 0 | Not Run |
| Categories & tags | 4 | 3 | 0 | Not Run |
| Users | 6 | 4 | 0 | Not Run |
| Settings | 4 | 2 | 0 | Not Run |
| Public website / SEO / responsive | 9 | 7 | 0 | Not Run |
| Security | 8 | 4 | 0 | Not Run |

Counts are derived from the case files; "automated" counts cases that map to at least one written test.

## How to produce real results
1. `dotnet test backend/Cms.slnx --collect:"XPlat Code Coverage"` 2. `cd frontend && npm install && npm run test:coverage` 3. start the e2e suite (see `tests/test-plan.md`). Then replace this file with the runner output and update the `Status` fields in `tests/test-cases/*.md`.
