# Deployment notes

- Serve over HTTPS only; the app enables HSTS and HTTPS redirect outside Development/Testing, and marks the refresh cookie `Secure`.
- Secrets: set `Jwt__SigningKey` (≥32 random chars) via environment/secret store. The app refuses to start without it. `appsettings.Development.json` holds a development-only key and seeded admin; never use it elsewhere. Leave `Seed__Enabled=false` in production.
- CORS: set `Cors__Origins__0=https://your-site`. Cookie is `SameSite=Strict`; if the SPA and API are on different sites you must revisit this and add CSRF tokens.
- Database: SQLite is for development; switch the provider/connection string for production and apply migrations in the release pipeline.
- Uploads: mount persistent storage at `Storage__RootPath` or implement `IFileStorage` for Azure Blob / S3. Put a reverse proxy request-size limit in front (default app limit 10 MB + overhead).
- Frontend: `npm run build` → static files from `frontend/dist`; route all non-`/api` paths to `index.html` (SPA fallback) so refresh on `/admin/...` and `/blog/...` works.
- CI (`.github/workflows/ci.yml`) never deploys.
