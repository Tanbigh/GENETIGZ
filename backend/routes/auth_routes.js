const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
// Creates a normal (non-admin) account, unless ALLOW_ADMIN_SELF_SIGNUP=true
// and { isAdmin: true } is explicitly sent — used once to bootstrap your
// first admin account, then turn that env flag back off.
router.post('/register', async function (req, res) {
  try {
    const { name, email, password, isAdmin } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ message: 'A valid email is required.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const grantAdmin = isAdmin === true && process.env.ALLOW_ADMIN_SELF_SIGNUP === 'true';

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      isAdmin: grantAdmin,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ message: 'Could not create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async function (req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me — lets the frontend confirm a stored token is still
// valid and re-fetch current user info (e.g. after a token refresh).
router.get('/me', requireAuth, async function (req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  } catch (err) {
    console.error('[auth/me]', err);
    return res.status(500).json({ message: 'Could not load profile.' });
  }
});

module.exports = router;
