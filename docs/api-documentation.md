# API

OpenAPI JSON: `GET /openapi/v1.json` (Development only). All errors are `application/problem+json`. Lists return `{ items, total, page, pageSize, totalPages }`.

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /api/auth/login` (body `email` **or** `username`, `password`), `/refresh`, `/logout`; `GET /api/auth/me`; `POST /api/auth/change-password` | login/refresh/logout anonymous (rate-limited), others authenticated |
| Pages | `GET/POST /api/pages`, `GET/PUT/DELETE /api/pages/{id}`, `PATCH /{id}/publish`, `/{id}/unpublish` | Admin, Editor |
| Posts | same shape under `/api/posts` (+ `categoryId`, `tagId` filters) | Admin, Editor |
| Categories / Tags | `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`; same for `/api/tags` | Admin, Editor |
| Media | `GET /api/media?search&type`, `POST /api/media` (multipart `file`), `DELETE /api/media/{id}`, `GET /api/media/{id}/file` | list/upload/delete: Admin, Editor; file: public |
| Users (User Master) | see below | Admin only (Editor 403, anonymous 401) |
| Companies (Company Master) | see below | Admin only (Editor 403, anonymous 401) |
| Settings | `GET /api/settings` (public), `PUT /api/settings` | PUT: Admin |
| Dashboard | `GET /api/dashboard` | Admin, Editor (user count Admin only) |
| Public | `GET /api/public/pages[/{slug}]`, `/posts[/{slug}]`, `/posts/{slug}/related`, `/categories/{slug}/posts`, `/search?q=` | anonymous, published content only |

List query params: `search`, `status` (Draft/Published), `sortBy` (`created`/`updated`), `desc`, `page`, `pageSize` (max 100).

## User Master – `/api/users` (Admin only)

| Method & path | Purpose | Success | Errors |
|---|---|---|---|
| `GET /api/users?search&role&isActive&companyId&sortBy&sortDir&page&pageSize` | List. `search` matches name, e-mail, username. `sortBy`: `name` `email` `username` `role` `created` `lastLogin`; `sortDir`: `asc`/`desc` | 200 paged | 401/403 |
| `GET /api/users/{id}` | Details | 200 | 404 |
| `POST /api/users` | Create: `firstName`, `lastName`, `username` (3-100, `[A-Za-z0-9._-]`, stored lower-case), `email`, `phone?`, `password` (≥8, letter+digit), `role` (Admin/Editor), `isActive?` (default true), `companyId?` | 201 + `Location` | 400 validation/inactive or unknown company, 409 duplicate e-mail/username |
| `PUT /api/users/{id}` | Profile only: `firstName,lastName,username,email,phone,companyId`. `role`, `isActive`, `password` in the body are ignored | 200 | 400, 404, 409 |
| `PATCH /api/users/{id}/status` | `{ "isActive": bool }`; deactivation revokes refresh tokens | 200 | 400 (own account), 404, 409 last active Admin |
| `PATCH /api/users/{id}/role` | `{ "role": "Admin"|"Editor" }`; revokes refresh tokens | 200 | 400, 404, 409 last active Admin |
| `POST /api/users/{id}/reset-password` | `{ "newPassword": "…" }` (body only); revokes all refresh tokens | 204 | 400 weak password, 404 |
| `DELETE /api/users/{id}` | Safe delete | 204 | 400 own account, 404, 409 last Admin **or** user referenced by content/media/audit rows ("deactivate instead") |

`UserDto`: `id, email, username, firstName, lastName, displayName, phone, role, isActive, companyId, companyName, lastLoginAt, createdAt, updatedAt, createdById, updatedById`. Password hashes, tokens and secrets are never returned. `displayName` = `firstName lastName` (server-derived). `lastLoginAt` is set on successful `POST /api/auth/login`. Access tokens of users that were deactivated, deleted or whose role changed are rejected (401) immediately.

## Company Master – `/api/companies` (Admin only)

| Method & path | Purpose | Success | Errors |
|---|---|---|---|
| `GET /api/companies?search&isActive&sortBy&sortDir&page&pageSize` | List. `search` matches code/name (case-insensitive). `sortBy`: `code` (default) `name` `created` | 200 `{items,total,page,pageSize,totalPages}` | 401/403 |
| `GET /api/companies/{id}` | Details incl. `userCount` | 200 | 404 |
| `POST /api/companies` | Create `CompanyRequest` (`companyCode` ≤30 required, stored upper-case & unique; `companyName` ≤200 required; `email?`; `phone?` ≤25; `website?` http/https; `addressLine1/2` ≤250; `city/state/country` ≤100; `postalCode` ≤20; `logoMediaId?` must exist in the media library; `isActive?` default true) | 201 + `Location` | 400, 409 duplicate code |
| `PUT /api/companies/{id}` | Full update, same body | 200 | 400, 404, 409 |
| `PATCH /api/companies/{id}/status` | `{ "isActive": bool }` | 200 | 404 |
| `DELETE /api/companies/{id}` | Delete only if no user references it | 204 | 404, 409 ("deactivate the company instead, or reassign its users") |

`CompanyDto`: all request fields plus `companyId, logoUrl, createdAt, updatedAt, createdById, createdByName, updatedById, updatedByName, userCount`. Deleting a logo from the media library sets `logoMediaId` to null (FK `SET NULL`).
