Deployment (Netlify)
====================

Overview
--------
- Single Next.js app with API routes hosted on Netlify using `@netlify/plugin-nextjs`.
- Feedback is persisted using Netlify Blobs (no external DB required).

Build Settings
--------------
- Base directory: `web` (configured via `netlify.toml` at repo root)
- Build command: `npm ci && npm run build`
- Publish directory: `.next`

Environment Variables
---------------------
- Optional: `NEXT_PUBLIC_API_URL` — leave empty to use same-origin routes.
- Optional: `FEEDBACK_ADMIN_KEY` — required to access the admin feedback viewer.

Local Development
-----------------
- From `web/`: `npm install` then `npm run dev`.
- App runs at http://localhost:3000 and uses same-origin `/api/*`.

Feedback Admin
--------------
- Admin page at `/admin/feedback` lists submissions via Netlify Blobs.
- Set `FEEDBACK_ADMIN_KEY` in Netlify env; the page requires this key via an input.
