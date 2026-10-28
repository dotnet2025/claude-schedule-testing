# Test execution summary

> **Nothing has been executed (run of 2026-10-27, Company Master / User Master).** This environment had no .NET SDK (`dot.net`, `builds.dotnet.microsoft.com`, NuGet and apt mirrors all return 403 / DNS failure) and the npm registry is blocked (`registry.npmjs.org` → 403 through the egress proxy; `npm ci` fails with ENOTFOUND/ENOTCACHED, leaving `node_modules` incomplete). The backend could not be compiled, the migration could not be generated or applied, and `typecheck`, `lint`, `build`, `vitest` and Playwright could not run. **Every figure below is Not Run/Blocked – there are no passes.**
>
> The only check that was executed: a TypeScript *syntax-only* parse (`ts.transpileModule`, no type information) of all new/changed frontend and e2e files – 0 syntax errors. That is not a type-check and is not counted as a test result.

| Metric | Value |
|---|---|
| Total test cases documented (`tests/test-cases`) | 97 earlier + 27 Company Master + 38 User Master (the 6 old TC-USR cases were superseded) = 156 |
| Automated test methods written (this run) | backend 40 xUnit methods/theories (UserMasterTests 23, CompanyMasterTests 17) + 21 frontend Vitest `it` blocks in 3 new files (CompaniesPage, UsersPage, AdminLayout) + 1 LoginPage + 3 Playwright |
| Automated test methods in repo (approx.) | backend 61 methods, frontend ~57 `it`, Playwright 16 |
| Executed | 0 |
| Passed | 0 |
| Failed | 0 |
| Blocked | all automated methods (no .NET SDK / npm registry) |
| Not run | all cases |
| Backend coverage / frontend coverage | Not measured |
| Defects identified by tests | None found, because nothing ran |
| Defects found by self-review while authoring | existing tests used the removed `displayName`/PUT-role API and were updated; JWT lifetime gap (deactivated/demoted users kept valid access tokens) fixed with an `OnTokenValidated` DB check |
| Unresolved issues | `docs/known-issues.md` (KI-001, KI-002, KI-013 migration hand-authored, KI-014) |

## Module breakdown (new/changed this run)

| Module | Designed | Automated | Executed | Result |
|---|---|---|---|---|
| Company Master | 27 | 25 (17 API, 7 UI, 1 e2e) | 0 | Not Run |
| User Master | 38 | 36 (23 API, 11 UI, 3 e2e) | 0 | Not Run |
| Manual only | TC-CMP-018/UI-008, TC-USR-024 (migration, responsive) | – | 0 | Not Run |

Earlier modules (authentication, authorization, dashboard, pages, posts, media, categories/tags, settings, public site, security) are unchanged and remain **Not Run**; some of their tests were edited only to use the new user-create payload (`firstName/lastName/username`) and the PATCH status/role endpoints – assertions were not weakened.

## How to produce real results
1. `dotnet ef database update` on a clean DB and on a DB created from `InitialCreate` (see README → Database changes).
2. `dotnet test backend/Cms.slnx --collect:"XPlat Code Coverage"`
3. `cd frontend && npm ci && npm run typecheck && npm run lint && npm run build && npm run test -- --run`
4. `cd tests/e2e && npm install && npx playwright install chromium && npx playwright test`
Then replace this file with the runner output and update the `Status` fields in `tests/test-cases/*.md`.
