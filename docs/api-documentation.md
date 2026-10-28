# API

OpenAPI JSON: `GET /openapi/v1.json` (Development only). All errors are `application/problem+json`. Lists return `{ items, total, page, pageSize, totalPages }`.

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/login`, `/refresh`, `/logout`; `GET /api/auth/me`; `POST /api/auth/change-password` | login/refresh/logout anonymous (rate-limited), others authenticated |
| Pages | `GET/POST /api/pages`, `GET/PUT/DELETE /api/pages/{id}`, `PATCH /{id}/publish`, `/{id}/unpublish` | Admin, Editor |
| Posts | same shape under `/api/posts` (+ `categoryId`, `tagId` filters) | Admin, Editor |
| Categories / Tags | `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`; same for `/api/tags` | Admin, Editor |
| Media | `GET /api/media?search&type`, `POST /api/media` (multipart `file`), `DELETE /api/media/{id}`, `GET /api/media/{id}/file` | list/upload/delete: Admin, Editor; file: public |
| Users | `GET/POST /api/users`, `PUT/DELETE /api/users/{id}` | Admin |
| Settings | `GET /api/settings` (public), `PUT /api/settings` | PUT: Admin |
| Dashboard | `GET /api/dashboard` | Admin, Editor (user count Admin only) |
| Public | `GET /api/public/pages[/{slug}]`, `/posts[/{slug}]`, `/posts/{slug}/related`, `/categories/{slug}/posts`, `/search?q=` | anonymous, published content only |

List query params: `search`, `status` (Draft/Published), `sortBy` (`created`/`updated`), `desc`, `page`, `pageSize` (max 100).

## Companies and Company–User mapping (Admin only; Editor 403, anonymous 401)
Details and rules: README "Company–User mapping".

| Method & path | Body / query | Success | Errors |
|---|---|---|---|
| `GET /api/companies` | `search, isActive, page, pageSize` | 200 paged `CompanyDto` | 401/403 |
| `GET /api/companies/{id}` | | 200 | 404 |
| `POST /api/companies` | `{companyCode(<=30), companyName(<=200), isActive}` | 201 | 400, 409 duplicate code |
| `PUT /api/companies/{id}` | same | 200 | 400, 404, 409 |
| `GET /api/company-users` | `search, companyId, userId, userIsActive, assignmentIsActive, sortBy, desc, page, pageSize` | 200 paged `CompanyUserDto` | |
| `GET /api/company-users/{id}` | | 200 | 404 |
| `POST /api/company-users` | `{companyId,userId,isActive=true,isPrimaryCompany=false}` | 201 (200 if an inactive mapping was reactivated) | 400 inactive company / inactive user+active / inactive primary / id < 1, 404 unknown ids, 409 duplicate active |
| `PUT /api/company-users/{id}` | `{isActive,isPrimaryCompany}` (nothing else is read) | 200 | 400, 404, 409 |
| `DELETE /api/company-users/{id}` | | 204 (soft: inactive, not primary) | 404 |
| `GET /api/companies/{companyId}/users` | `search, assignmentIsActive, page, pageSize` | 200 paged | 404 |
| `POST /api/companies/{companyId}/users` | `{firstName,lastName,username,email,phone?,role,password,isActive,isPrimaryCompany}` | 201 `{user, assignment}`; one transaction | 400 validation / inactive company, 404, 409 duplicate email or username (case-insensitive) or concurrent failure |
| `POST /api/companies/{companyId}/users/assign` | `{userId,isActive,isPrimaryCompany}` | 201 / 200 | as assign |
| `GET /api/users/{userId}/companies` | | 200 list `UserCompanyDto` (primary first) | 404 |

`CompanyUserDto`: `companyUserId, companyId, companyCode, companyName, companyIsActive, userId, userName, username, email, phone, systemRole, userIsActive, isActive, isPrimaryCompany, createdAt, updatedAt`. `UserDto` additionally exposes `firstName, lastName, username, phone`; password hashes are never returned.

