require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth_routes');
const adminRoutes = require('./routes/admin_routes');
const ordersRoutes = require('./routes/orders_routes');

const app = express();

/* ------------------------------------------------------------------
   CORS — likely the SECOND cause behind "Failed to fetch" once
   gz-config.js points at the right port. Without this, the browser
   blocks the cross-origin request before Express ever sees it, and
   Chrome/Firefox report that as a generic network failure rather
   than a proper CORS error in the Network tab (only the Console
   shows the real reason).

   Set CORS_ORIGINS in .env to wherever the frontend is actually
   served from (e.g. a Live Server / VS Code preview port).
------------------------------------------------------------------- */
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5500,http://127.0.0.1:5500')
  .split(',')
  .map(function (origin) { return origin.trim(); })
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', ordersRoutes);

app.get('/api/health', function (_req, res) {
  res.json({ ok: true });
});

// Catch-all so a wrong URL returns a real JSON 404 instead of the
// frontend seeing another confusing network-level failure.
app.use('/api', function (_req, res) {
  res.status(404).json({ message: 'Unknown API route.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(function () {
  app.listen(PORT, function () {
    console.log('[server] Listening on port ' + PORT);
  });
});
