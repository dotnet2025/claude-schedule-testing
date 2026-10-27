# Known issues, blockers and next steps

| ID | Severity | Issue | Impact / next step |
|---|---|---|---|
| KI-001 | Blocker | No .NET SDK in the authoring environment; `dot.net`, `builds.dotnet.microsoft.com`, NuGet unreachable (403). | Backend was never compiled. Expect compile errors / package version mismatches (e.g. `HtmlSanitizer`, `System.IdentityModel.Tokens.Jwt` versions). Run `dotnet build backend/Cms.slnx` and fix. |
| KI-002 | Blocker | npm registry unreachable (DNS), so `npm install` was impossible. | Frontend never type-checked, linted, built or tested; no `package-lock.json`. Run `npm install` then `npm run typecheck`. Version ranges in `package.json` are unverified (TipTap 2.x, MUI 7, Vite 7, Vitest 3, Playwright 1.50+). |
| KI-003 | Blocker | `git push origin develop` rejected: *repository not in this session's authorized set* (403 from git proxy). | Work is committed locally on branch `develop` on top of `72df441`. Authorize the repo for the session (or push from a machine with access). Not retried via workarounds. |
| KI-004 | High | EF Core migration not generated (needs `dotnet ef`). `Program.cs` calls `Database.MigrateAsync()`; in the `Testing` environment it falls back to `EnsureCreated` when no migration exists. CI generates `InitialCreate` if missing. | Run `dotnet ef migrations add InitialCreate --project backend/src/Cms.Infrastructure --startup-project backend/src/Cms.Api --output-dir Migrations` and commit the result; then remove the Testing fallback. In Development/Production startup will not create tables until a migration exists. |
| KI-005 | Medium | No coverage measured; 80% target unverified. | Run coverage commands in `tests/test-plan.md`. |
| KI-006 | Medium | `PasswordHasher<User>` is registered as a singleton and `AppDbContext` uses a file-based SQLite DB; concurrent writers may see `database is locked` under load. | Fine for dev; use a server DB for production. |
| KI-007 | Medium | Refresh cookie `Path=/api/auth` + `SameSite=Strict`; CSRF protection beyond SameSite is not implemented. Access token is kept in memory so a page reload relies on the cookie. | Review in `docs/deployment.md` before production. |
| KI-008 | Low | Related posts endpoint exists, shown on post page; no automated test. Canonical tag only set client-side (client-rendered SEO limitation: crawlers that do not run JS see no per-page meta). | Add SSR/prerender (e.g. Vite SSG or a Node prerender service). |
| KI-009 | Low | Media delete does not block deleting files embedded inline in HTML content (only featured image/logo/favicon references are cleared by FK). Inline `<img>` will 404. | Add usage scan before delete. |
| KI-010 | Low | No Playwright viewport tests; responsive behaviour unverified. TipTap toolbar is mocked in jsdom tests. | Add e2e tests at 375/768/1280 px. |
| KI-011 | Low | Azure Blob / S3 storage not implemented; only the `IFileStorage` abstraction + local disk. | Future work. |
| KI-012 | Low | Public site "dynamic navigation" lists the first 50 published pages; no menu editor. | Future work. |
