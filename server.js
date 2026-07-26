require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Needed on Render/Railway/Heroku-style platforms sitting behind a
// reverse proxy, so express-rate-limit sees the real client IP.
app.set('trust proxy', 1);

// ---- Security headers ----
app.use(helmet());

// ---- CORS ----
// Only origins listed in CORS_ORIGINS (comma-separated in .env) may call
// this API from a browser. Add your live domain there once deployed.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(function (s) { return s.trim(); })
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow non-browser tools (no origin header, e.g. curl/Postman)
      // and any explicitly listed origin.
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
  })
);

app.use(express.json({ limit: '20kb' })); // small limit — this API only ever receives short JSON bodies
app.use(mongoSanitize()); // strips any $/. keys from req.body/query/params to block NoSQL injection

// ---- Rate limiting ----
// General safety net across the whole API.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Tighter limit specifically on login/register to slow down brute-force
// or account-enumeration attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', function (_req, res) {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// 404 for anything under /api that didn't match a route above.
app.use('/api', function (_req, res) {
  res.status(404).json({ message: 'Not found.' });
});

// Centralized error handler — catches CORS rejections, JSON parse
// errors, and anything thrown/next(err)'d from a route.
app.use(function (err, _req, res, _next) {
  console.error('[unhandled]', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(function () {
  app.listen(PORT, function () {
    console.log('[server] GENETIGZ API running on port ' + PORT);
  });
});

// Surface unexpected crashes clearly instead of failing silently.
process.on('unhandledRejection', function (reason) {
  console.error('[unhandledRejection]', reason);
});
