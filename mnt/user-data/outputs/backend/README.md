# GENETIGZ Backend (Auth + Orders API)

Node + Express + MongoDB (Mongoose) + JWT. This is what makes login,
"order gating," and the admin dashboard actually work.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — a MongoDB Atlas connection string (free tier is fine) or
  a local `mongodb://127.0.0.1:27017/genetigz`.
- `JWT_SECRET` — generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `CORS_ORIGINS` — the origin(s) your frontend is served from, e.g.
  `http://127.0.0.1:5500` while developing, plus your real domain later.

## 3. Run

```bash
npm run dev     # nodemon, restarts on file changes
# or
npm start
```

You should see `[db] MongoDB connected` and `[server] GENETIGZ API
running on port 5000`.

## 4. Point the frontend at it

Open `gz-config.js` in the site root and set:

```js
window.GZ_CONFIG = { API_BASE: 'http://localhost:5000/api' };
```

Change this to your deployed API URL once you host the backend
(Render, Railway, a VPS, etc.).

## 5. Create your first (admin) account

Only needed once. Temporarily set `ALLOW_ADMIN_SELF_SIGNUP=true` in
`.env`, restart the server, then either use `signup.html` and send
`isAdmin: true` some other way, or simplest — call the API directly:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@genetigz.com","password":"changeme123","isAdmin":true}'
```

Then set `ALLOW_ADMIN_SELF_SIGNUP` back to `false` (or delete the line)
and restart. Every account created after that is a normal (non-admin)
customer account.

## API reference

| Method | Path                     | Auth        | Purpose                                   |
|--------|--------------------------|-------------|--------------------------------------------|
| POST   | `/api/auth/register`     | —           | Create account, returns `{ token, user }`   |
| POST   | `/api/auth/login`        | —           | Login, returns `{ token, user }`            |
| GET    | `/api/auth/me`           | Bearer JWT  | Validate session, get current user          |
| POST   | `/api/orders`            | Bearer JWT  | Save an order before opening WhatsApp       |
| PATCH  | `/api/orders/:id/status` | Bearer JWT  | Mark an order `opened`/`failed`             |
| GET    | `/api/admin/users`       | Admin JWT   | List all registered users                   |
| GET    | `/api/admin/orders`      | Admin JWT   | List/search/filter orders (see query params)|
| GET    | `/api/admin/stats`       | Admin JWT   | Total users / orders / orders today         |

`GET /api/admin/orders` query params: `search`, `status`
(`opened`/`pending`/`failed`), `from`, `to` (ISO dates), `page`, `limit`.

## Already built in

- **Password hashing** — bcrypt, 10 salt rounds, never stored or
  returned in plain text (`toJSON` on the User model also strips
  `passwordHash` from every API response).
- **JWT auth** — signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN`,
  verified on every protected route via `middleware/auth.js`.
- **Input validation** on every route (missing/invalid email, short
  passwords, missing product fields, invalid status values, etc.) with
  clear 400/401/403/409 responses — no silent failures.
- **Security headers** via `helmet()`.
- **Rate limiting** — 300 req/15min sitewide on `/api`, a stricter
  20 req/15min limiter specifically on `/api/auth/login` and
  `/api/auth/register` to slow down brute-force/enumeration attempts.
- **NoSQL-injection sanitization** via `express-mongo-sanitize` on
  body/query/params.
- **CORS allowlist** — only origins in `CORS_ORIGINS` can call the API
  from a browser.
- **Centralized error handling** + a JSON 404 for unmatched `/api/*`
  routes, so nothing leaks a stack trace or an HTML error page.

## Worth adding as the project grows

- A `POST /api/auth/logout` + refresh-token rotation if you want
  server-side session revocation; right now logout is purely
  client-side (the JWT is deleted from the browser and simply expires
  unused, per `JWT_EXPIRES_IN`, if ever reused).
- Email verification before allowing orders.
- Structured logging (e.g. `pino`) once you need to debug production
  traffic instead of relying on `console.log`.
