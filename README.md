# Coding Club, BITS Pilani — website

React (Create React App) front end with a 3D home page, plus a few Vercel serverless
functions (`api/`) that store the site's content in a GitHub repository.

## Run it locally

```bash
npm install
npm start          # site + admin at http://localhost:3000
```

Locally (no `GH_TOKEN` set), the admin saves to `content/site.json` and `uploads/` in this
folder instead of GitHub. Put `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env.local`.

```bash
npx vercel dev     # optional: run exactly like Vercel, with the GitHub variables below
```

## Admin portal — `/admin`

Everything that changes often is edited at **`/admin`**, no code needed:

| Tab      | What it controls                                                        |
| -------- | ----------------------------------------------------------------------- |
| Projects | Project cards, datasheets and cover images. Order with ↑ ↓.             |
| Team     | Members per vertical: name, batch, role, lead, photo.                   |
| Events   | Upcoming / running / past events (sorted automatically by date, IST).   |
| Updates  | Announcements on the home page.                                         |

How it works: log in with the admin username and password → edit → **Save**. The change is committed to
`content/site.json` (images go to `uploads/`) in the GitHub repo set by `GH_REPO`, and
appears on the website within about a minute. A login lasts 12 hours; changing the password logs everyone out.

The first time, the admin may offer to **Import** items that ship with the code
(`src/data/seed.js`) but aren't in the live content yet. One click copies them over.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name                          | What                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `ADMIN_USERNAME`              | Username for `/admin`.                                               |
| `ADMIN_PASSWORD`              | Password for `/admin` (8+ characters; use a long one).               |
| `GH_OWNER`, `GH_REPO`         | Repository that stores the content.                                  |
| `GH_BRANCH`                   | Branch to write to (default `main`).                                 |
| `GH_TOKEN`                    | Fine-grained token with **Contents: read & write** on that repo only. |

Admin saves are commits. `vercel.json` skips rebuilding when a commit only touches
`content/` or `uploads/`, so saving doesn't redeploy the whole site.

## Where things live

- `src/world/` — the 3D board (React Three Fiber)
- `src/pages/`, `src/home/` — inner pages and the home page sections
- `src/data/club.js` — fixed club text (recruitment steps, FAQ, verticals)
- `src/data/seed.js` — bundled content: offline fallback and admin import source
- `server/validate.js` — the content schema the API enforces

## Security

- **Admin login**: username + password checked on the server (constant-time). Sessions are signed
  (HMAC-SHA256) and stored in an `HttpOnly; SameSite=Strict; Secure` cookie for 12 hours, so page
  scripts can't read them. Failed logins are slowed down, and each IP gets 10 tries per 15 minutes.
  Changing `ADMIN_PASSWORD` (or setting/rotating `ADMIN_SESSION_SECRET`) logs everyone out.
- **API middleware** (`server/middleware.js`) wraps every `/api` route: method allow-list,
  same-origin check plus a required custom header on writes (CSRF), JSON-only bodies,
  per-IP rate limits, hardening headers, and server-side validation of everything saved
  (`server/validate.js`: links must be `https://` or site paths, so no `javascript:` links).
- **Uploads**: logged-in only, max 2 MB, file type checked from its bytes (PNG/JPG/WebP/GIF,
  no SVG), random file names, served with `nosniff` and a sandboxing CSP.
- **Site headers** (`vercel.json`): strict Content-Security-Policy (no inline or third-party
  scripts), HSTS, clickjacking protection, `nosniff`, Referrer-Policy, Permissions-Policy.
  `/admin` and `/api` are `noindex`.
- No source maps are published (`.env`).

Rate limits are per serverless instance. For stronger protection, add a Vercel Firewall rule
(Project → Firewall) limiting `POST /api/login`, e.g. 20 requests per 10 minutes per IP.
`GH_TOKEN` should be a fine-grained token scoped to the content repo only.
