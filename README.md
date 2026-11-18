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
`content/site.json` (images go to `uploads/`) on the **`content` branch** of this repo, which is
the site's database: no code, never deployed. The change
appears on the website within about a minute. A login lasts 12 hours; changing the password logs everyone out.

The first time, the admin may offer to **Import** items that ship with the code
(`src/data/seed.js`) but aren't in the live content yet. One click copies them over.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Name                          | What                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `ADMIN_USERNAME`              | Username for `/admin`.                                               |
| `ADMIN_PASSWORD`              | Password for `/admin` (8+ characters; use a long one).               |
| `GH_TOKEN`                    | GitHub token that can write to **Anamay-Kapoor/CCWebsite** (see below). |

The database location is fixed in `server/github.js` (`content` branch of this repo); any
`GH_OWNER` / `GH_REPO` / `GH_BRANCH` variables are ignored.

**Token:** if you own the repo, create a fine-grained token for it with *Contents: Read and write*.
Collaborators can't make fine-grained tokens for someone else's personal repo; use a classic
token with the `repo` scope instead.

Admin saves are commits to the `content` branch, so they don't redeploy the site or show up
in anyone's `git pull` of `main`. Existing images for projects and the team are bundled with the
code in `public/` and referenced by path; new ones uploaded in the admin go to `uploads/`.

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
- No source maps are published, and the webpack runtime isn't inlined (both set in the `build` script).

Rate limits are per serverless instance. For stronger protection, add a Vercel Firewall rule
(Project → Firewall) limiting `POST /api/login`, e.g. 20 requests per 10 minutes per IP.
`GH_TOKEN` should be a fine-grained token scoped to this repo only, where possible.
