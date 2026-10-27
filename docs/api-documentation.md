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
