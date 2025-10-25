# Database Setup (MySQL)

Do not commit secrets. Configure environment variables locally or in your hosting provider’s UI.

Required env vars (see `web/.env.local.example`):

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE` (optional for simple ping)
- `MYSQL_SSL` (optional; set to `true` for hosted MySQL with SSL)

## Local dev

1. Copy `web/.env.local.example` to `web/.env.local` and set real values.
2. Start dev: from repo root run `npm run dev` (which proxies to `web`).
3. Verify: GET `http://localhost:3000/api/db/ping` should return `{ ok: true, rows: [...] }`.

## Netlify

- Set the same env vars in Netlify Site settings → Build & deploy → Environment.
- Redeploy; then test `/api/db/ping` on the deployed URL.

## Notes

- The connection pool is created lazily and reused across requests (`web/src/lib/db.ts`).
- Increase `connectionLimit` only if you expect high concurrency.
- If your MySQL host requires SSL, set `MYSQL_SSL=true` (we disable CA verification for simplicity; tighten as needed).

