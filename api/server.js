require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const ordersRoutes = require('./routes/orders.routes');

const app = express();

/* ------------------------------------------------------------------
   CORS — a common second cause of "Failed to fetch" once the API URL
   itself is correct: without this, the browser blocks the
   cross-origin request before Express ever sees it, and reports it
   as a generic network failure (check the browser Console, not just
   the Network tab, for the real CORS error text).

   Set CORS_ORIGINS in .env to wherever the frontend HTML is actually
   served from (Live Server, VS Code preview, your real domain, etc).
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

// Catch-all so a wrong URL returns a real JSON 404 instead of another
// confusing network-level failure on the frontend.
app.use('/api', function (_req, res) {
  res.status(404).json({ message: 'Unknown API route.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(function () {
  app.listen(PORT, function () {
    console.log('[server] Listening on port ' + PORT);
  });
});
