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

**Data model:** User, Company, RefreshToken, Page, Post, Category, Tag, join tables `PostCategories`/`PostTags`, MediaFile, WebsiteSettings (single row, Id=1). Unique indexes: user email, user username, company code, page slug, post slug, category/tag name+slug, media stored name, refresh token hash. Media FKs from content/settings use `SET NULL`.

**SEO:** pages set `<title>`, description and canonical client-side. Limitation: crawlers not executing JavaScript will not see per-page metadata. Remedies: prerender at publish time, Vite SSG, or SSR with a Node host.

## Company Master & User Master
- **Entities:** `Company` (PK `CompanyId`, unique `CompanyCode`, address/contact fields, `LogoMediaId` → `MediaFile` `SET NULL`, `IsActive`, UTC `CreatedAt/UpdatedAt`, `CreatedById/UpdatedById` → `User` `SET NULL`). `User` gained `FirstName`, `LastName`, `Username` (unique, lower-case), `Phone`, `UpdatedAt`, `LastLoginAt`, `CompanyId` → `Company` `SET NULL`, `CreatedById/UpdatedById` (self FKs, `SET NULL`). `DisplayName` is kept as a stored column that the service derives from first+last name, so content author queries and the JWT name claim are unchanged. Credentials (`PasswordHash`, refresh tokens) live on `User`/`RefreshToken` but never appear in a DTO.
- **Services/controllers:** `CompanyService` + `CompaniesController`, `UserService` (refactored) + `UsersController`, both `[Authorize(Policy = AdminOnly)]`; Editors get 403, anonymous 401. Acting user id is passed from the controller for audit fields. `AuthService.LoginAsync` accepts e-mail or username and sets `LastLoginAt`.
- **Rules enforced server-side:** unique e-mail/username/company code (case-insensitive via normalisation + unique indexes; `DbUpdateException` → 409); last-active-Admin protection for demote/deactivate/delete; no self-delete/self-deactivate; role changes only through `PATCH /users/{id}/role` (PUT ignores role); safe delete (company with users → 409; user referenced by content, media or audit rows → 409 "deactivate instead"); password reset and role/status change revoke refresh tokens; JWT `OnTokenValidated` re-checks that the user is still active with the same role.
- **Database:** one migration, `AddCompanyAndUserMaster`: creates `Companies`, adds the new `Users` columns (FK columns via `ALTER TABLE … ADD COLUMN … REFERENCES`, because SQLite cannot add FKs to existing tables), back-fills existing rows (DisplayName split, username from the e-mail local part, de-duplicated) and creates the unique indexes. The Testing-only `EnsureCreated` fallback was removed; migrations are always used.
- **Frontend:** `features/masters/` (`CompaniesPage`, `CompanyFormDialog`, `UsersPage`, `UserFormDialog`, `ResetPasswordDialog`), routes `/admin/masters/companies` and `/admin/masters/users` under the Admin-only route guard (`/admin/users` redirects), a "Masters" group in `AdminLayout` shown only to Admins, logo selection through the existing `MediaPicker`, notifications through the existing toast, deletes through `ConfirmDialog`.
