# Test execution summary

## Company–User module run (scheduled run, 2026-10-27/28)
Environment again had **no .NET SDK, no NuGet, no npm registry and no browser** (dot.net / NuGet / npm all unreachable). Result: **nothing was compiled or executed**; the backend, migration, frontend and every test below are *unverified*.

| Item | Written | Executed | Result |
|---|---|---|---|
| xUnit integration tests (`CompanyUserTests.cs`) | 21 test methods (TC-CU-001..027, incl. parallel/concurrency and rollback) | 0 | Not Run (Blocked: no .NET SDK) |
| Vitest/RTL/MSW (`companies/companyUsers.test.tsx`) | 9 tests (TC-CU-028 and UI parts of 001/002/015/016/022/023) | 0 | Not Run (Blocked: no npm) |
| Playwright (`tests/e2e/company-users.spec.ts`) | 1 journey | 0 | Not Run (Blocked: no browser/toolchain) |
| Existing regression suites (backend, frontend, e2e) | n/a | 0 | Not Run (Blocked) |
| Typecheck / lint / build | - | 0 | Not Run |
| EF migration `AddCompanyUserMapping` | hand-authored + hand-edited snapshot | not validated | Not Run |
| Manual: TC-CU-029, TC-CU-030 | - | 0 | Not Run |

The numbers in the older tables below predate this module and are unchanged (they exclude the 30 `TC-CU-*` cases).

---

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
