const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Verifies the Bearer token and attaches { id, name, email, isAdmin } to
// req.user. This is the real security boundary — the admin dashboard's
// client-side GZAuth.isAdmin() check is UX only, this is what's enforced.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const parts = header.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: !!user.isAdmin,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
}

// Must run after requireAuth.
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
