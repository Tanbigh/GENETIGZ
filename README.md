# GENETIGZ — Setup Guide

This covers the whole thing end to end: the static site (unchanged),
the new login-gated WhatsApp ordering, the backend API, and the admin
dashboard. Follow it in order — nothing here assumes steps you haven't
done yet.

## What's in this project

```
/                       ← your existing site (untouched design)
  index.html            ← ONLY new <link>/<script> tags added (2 spots);
                           every existing line is untouched — see the
                           "Exactly what changed in index.html" section below
  style.css               (unchanged)
  responsive.css          (unchanged)
  script.js               (unchanged)
  modal.js / collections.js / collections.css / data/  (unchanged, your files)

  gz-config.js           ← ONE line to point at your API
  auth.js                ← shared JWT session helper (all pages use this)
  nav-auth.js            ← injects the Login button / account dropdown
                            into the navbar on every page that loads it
  nav-auth.css           ← styles for that dropdown
  order.css / order.js   ← size/color/qty pickers + login-gated WhatsApp
                            ordering inside the existing product modal

  login.html / login.css / login.js     ← login page
  signup.html / signup.js               ← signup page (reuses login.css)
  profile.html / profile.css / profile.js  ← "My Profile" page (account
                                              info + personal order history)

  admin/
    index.html / admin.css / admin.js   ← admin dashboard

backend/                ← Node + Express + MongoDB + JWT API (separate app)
  server.js, config/, models/, middleware/, routes/
  package.json, .env.example, README.md (backend-specific details)
```

### Exactly what changed in `index.html`

Two spots only, both purely additive (diffed against your original):

1. Inside `<head>`, two new `<link>` tags after your existing stylesheets:
   ```html
   <link rel="stylesheet" href="order.css">
   <link rel="stylesheet" href="nav-auth.css">
   ```
2. Right before `</body>`, four new `<script>` tags after your existing `script.js`:
   ```html
   <script src="gz-config.js"></script>
   <script src="auth.js"></script>
   <script src="nav-auth.js"></script>
   <script src="order.js"></script>
   ```

Nothing else — no markup moved, no class renamed, no existing script
touched. `nav-auth.js` finds your existing `.topbar-inner` at runtime
and appends the Login button / account dropdown into it; it does not
require the navbar HTML itself to be edited.

### ⚠️ You must add the same tags to every other page

I only received `index.html` from you — I don't have `collection.html`
(or any other page that has the navbar/product modal). **Copy the
exact two `<link>` lines and four `<script>` lines above into every
other HTML page on your site**, in the same two spots (`</head>` and
before `</body>`). Until you do, the Login button and order-gating
will only appear on `index.html` — that's not a bug, it's just a page
that hasn't received the same two edits yet.

### If you tested this before and saw no change at all

That was a real gap, not a caching issue: the previous delivery added
the scripts but never actually put anything new into the navbar, so
`index.html` looked identical even though the files were connected.
That's fixed now — `nav-auth.js` puts a visible **Login** button in
the navbar, which becomes your name + a dropdown (**My Profile**,
**Logout**) after signing in. If it still looks unchanged after
replacing your files:
- Hard-refresh (Ctrl/Cmd+Shift+R) — browsers cache CSS/JS aggressively.
- Open DevTools → Network tab and confirm `nav-auth.js`, `order.js`,
  `auth.js`, `gz-config.js` all return 200, not 404 (a 404 means the
  file isn't sitting next to `index.html` on your server).
- Open DevTools → Console and check for red errors — a JS error in one
  script can stop the next one from running.

---

## 1. Install backend dependencies

```bash
cd backend
npm install
```

This installs Express, Mongoose, JWT, bcrypt, Helmet, rate-limiting,
and CORS — everything the API needs.

## 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in each value:

```ini
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/genetigz
JWT_SECRET=<a long random string — see below>
JWT_EXPIRES_IN=30d
PORT=5000
CORS_ORIGINS=http://127.0.0.1:5500
ALLOW_ADMIN_SELF_SIGNUP=false
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the output in as `JWT_SECRET`. This is what signs and verifies
every login session — keep it secret and never commit `.env`.

## 3. Connect MongoDB

**Option A — MongoDB Atlas (recommended, free tier available):**
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → add a database user + password
3. Network Access → add your IP (or `0.0.0.0/0` while developing)
4. Clusters → Connect → "Drivers" → copy the connection string
5. Paste it into `MONGO_URI` in `.env`, replacing `<user>`, `<password>`
   and adding `/genetigz` as the database name before the `?`

**Option B — local MongoDB:**
```ini
MONGO_URI=mongodb://127.0.0.1:27017/genetigz
```
(Requires `mongod` installed and running locally.)

## 4. Run the backend

```bash
npm run dev     # auto-restarts on file changes (nodemon)
# or
npm start
```

You should see:
```
[db] MongoDB connected
[server] GENETIGZ API running on port 5000
```

Confirm it's alive: open `http://localhost:5000/api/health` in a
browser — you should see `{"ok":true}`.

## 5. Connect the frontend to the backend

Open `gz-config.js` in the site root (same folder as `index.html`) and
set it to wherever your backend is running:

```js
window.GZ_CONFIG = { API_BASE: 'http://localhost:5000/api' };
```

That's the only place the API URL lives — every other frontend file
reads it from here. While developing, serve the frontend from a local
static server (not `file://`) so `fetch()` calls work correctly, e.g.:

```bash
# from the project root, in a second terminal
npx serve .
# or the VS Code "Live Server" extension
```

Make sure whatever origin that serves on (e.g. `http://127.0.0.1:5500`)
is listed in the backend's `CORS_ORIGINS`.

## 6. Create your first admin account

1. In `backend/.env`, temporarily set:
   ```ini
   ALLOW_ADMIN_SELF_SIGNUP=true
   ```
   and restart the backend (`npm run dev`).
2. Create the admin account by calling the register endpoint directly
   with `isAdmin: true`:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Admin","email":"admin@genetigz.com","password":"ChangeMe123!","isAdmin":true}'
   ```
3. Set `ALLOW_ADMIN_SELF_SIGNUP` back to `false` (or delete the line)
   and restart the backend again. This closes the door so nobody else
   can grant themselves admin through signup.html.
4. Log in at `login.html` with that email/password, then visit
   `admin/index.html` — you'll see the dashboard instead of the access
   gate.

Every account created afterwards through `signup.html` is a normal
(non-admin) customer account.

## 7. Deploy

**Backend** (pick one — any Node host works):
- **Render** or **Railway**: connect your repo, set the root directory
  to `backend/`, set the build command to `npm install`, start command
  `npm start`, and add all the same environment variables from your
  `.env` file in their dashboard's "Environment" settings.
- Whichever host you use, once deployed you'll get a live URL like
  `https://genetigz-api.onrender.com`.
- Update that host's `CORS_ORIGINS` to include your real frontend
  domain (e.g. `https://genetigz.com`).

**Frontend** (static hosting — Netlify, Vercel, GitHub Pages, or any
web server):
- Deploy the project root as-is (it's still a static site).
- Update `gz-config.js` to point at your deployed backend URL:
  ```js
  window.GZ_CONFIG = { API_BASE: 'https://genetigz-api.onrender.com/api' };
  ```
- Re-deploy the frontend after that change.

**Checklist after deploying both:**
- [ ] `https://<your-api>/api/health` returns `{"ok":true}`
- [ ] `CORS_ORIGINS` on the backend includes your live frontend domain
- [ ] `gz-config.js` on the frontend points at the live backend
- [ ] Signup → login → order flow works end-to-end on the live site
- [ ] `admin/index.html` loads real data for your admin account

---

## How the navbar auth widget works (for reference)

- `nav-auth.js` runs on every page that loads it, finds `.topbar-inner`,
  and appends a **Login** link (styled identically to your existing
  "Customize" button) when logged out.
- After login/signup, it's replaced with the person's first name and a
  dropdown: **My Profile** (`profile.html` — account info + their own
  order history) and **Logout**.
- It skips itself on `login.html`/`signup.html` (they're the auth flow
  already) and `admin/index.html` (which has its own logout button).
- Session validity is re-checked against `GET /api/auth/me` on every
  page load — an expired/invalid token falls back to the Login button
  automatically.

## How the order-gating flow works (for reference)

1. Customer opens a product, picks Size/Color/Qty, clicks **Order on
   WhatsApp**.
2. If not logged in: their selection is stashed locally, and they're
   sent to `login.html?redirect=<this page>`.
3. After login/signup, they're sent back to that exact page. Their
   selection is restored the next time that product's modal is open
   (auto-attempted immediately; otherwise a small "Continue your
   order" prompt appears).
4. Clicking **Order on WhatsApp** again (now logged in): the order is
   saved to MongoDB via `POST /api/orders`, then WhatsApp opens with
   the pre-filled message.
5. Already logged in the whole time? Step 2–3 never happen — WhatsApp
   opens immediately after validation.

See `backend/README.md` for the full API reference and production
hardening notes (rate limiting, sanitization, etc. — already wired in,
but worth reading).
