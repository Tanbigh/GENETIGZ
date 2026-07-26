const { verifyToken } = require('../utils/jwt');

// Reads "Authorization: Bearer <token>", verifies it, and attaches the
// decoded payload to req.user. Blocks the request with 401 if missing
// or invalid — this is what makes an endpoint "must be logged in".
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
  }
}

// Use after requireAuth. Blocks the request with 403 unless the
// token's payload says isAdmin: true.
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
