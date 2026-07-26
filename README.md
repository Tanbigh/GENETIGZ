# GENETIGZ — project structure

Single project now, no `frontend`/`backend` split. Layout:

```
/
├── index.html
├── login.html
├── signup.html
├── css/
│   ├── login.css        (redesigned)
│   ├── order.css
│   ├── nav-auth.css
│   ├── admin.css
│   ├── style.css        ← move your existing file here
│   ├── responsive.css   ← move your existing file here
│   └── collections.css  ← move your existing file here
├── js/
│   ├── gz-config.js
│   ├── auth.js
│   ├── login.js
│   ├── signup.js
│   ├── order.js
│   ├── nav-auth.js
│   ├── admin.js
│   ├── script.js        ← move your existing file here
│   ├── modal.js          ← move your existing file here
│   └── collections.js    ← move your existing file here
├── images/                (unchanged, wherever it already is)
├── data/collections-index.js   (unchanged)
└── api/                    ← the whole backend lives here, one folder
    ├── server.js
    ├── db.js
    ├── package.json
    ├── .env.example
    ├── models/User.js
    ├── models/Order.js
    ├── middleware/auth.js
    ├── utils/jwt.js
    └── routes/auth.routes.js, admin.routes.js, orders.routes.js
```

I only had the content of a handful of your files (the ones you've
uploaded across this conversation). `index.html` above already has its
`<link>`/`<script>` tags updated to the `css/`/`js/` paths — you just
need to physically drop your existing `style.css`, `responsive.css`,
`collections.css`, `script.js`, `modal.js`, and `collections.js` into
those folders (their contents don't need to change, only their
location).

## Why "Failed to fetch" is still happening

`gz-config.js` and CORS being fixed only matters once the API is
actually **running**. Checklist:

1. `cd api && npm install`
2. `cp .env.example .env` and fill in `MONGO_URI` and `JWT_SECRET`
3. Make sure `CORS_ORIGINS` in `.env` matches the URL the browser bar
   actually shows when you open `login.html`/`signup.html` (e.g. if
   you're using VS Code's Live Server it's usually
   `http://127.0.0.1:5500`).
4. `npm start` — you should see `[server] Listening on port 5000`
   and `[db] MongoDB connected` in the terminal.
5. In `js/gz-config.js`, confirm `API_BASE` points at that same port
   (`http://localhost:5000/api` by default).
6. Open the browser DevTools **Console** tab (not just Network) when
   you click Create Account — a real CORS or connection-refused error
   will show there even when the Network tab just says "failed".

If the server terminal shows no incoming request at all when you
submit the form, the frontend still isn't reaching it (wrong port in
step 5, or the server isn't running). If the terminal *does* log the
request but the browser still fails, it's CORS (step 3).

## What's new in this pass

- **Phone number on signup**: required, with a country-code select
  (defaults to +91) plus a number field, combined client-side into
  `+<code><digits>` and validated both in `js/signup.js` and
  server-side in `api/routes/auth.routes.js`. Stored on the `User`
  document (`api/models/User.js`) alongside name/email.
- **Login/signup redesign v2** (`css/login.css`): rounded floating
  card with soft shadow and subtle glass blur, radial glow backdrop,
  pill-shaped buttons with hover lift, refined focus rings, staggered
  field animations, and a cleaner mobile layout (full-bleed blurred
  backdrop with the card centered on top, instead of stacked panels).
