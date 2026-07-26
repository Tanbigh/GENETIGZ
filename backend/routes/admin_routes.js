const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a valid token AND isAdmin:true.
router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/users', async function (_req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err) {
    console.error('[admin/users]', err);
    return res.status(500).json({ message: 'Could not load users.' });
  }
});

// GET /api/admin/orders?search=&status=&from=&to=&page=&limit=
router.get('/orders', async function (req, res) {
  try {
    const { search, status, from, to } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 200);

    const query = {};

    if (search && String(search).trim()) {
      const re = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { userName: re },
        { userEmail: re },
        { productName: re },
        { productId: re },
      ];
    }

    if (status && ['opened', 'pending', 'failed'].includes(status)) {
      query.whatsappStatus = status;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.json({ orders, total, page, limit });
  } catch (err) {
    console.error('[admin/orders]', err);
    return res.status(500).json({ message: 'Could not load orders.' });
  }
});

// GET /api/admin/stats — small summary row for the dashboard header
router.get('/stats', async function (_req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalUsers, totalOrders, ordersToday] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    return res.json({ totalUsers, totalOrders, ordersToday });
  } catch (err) {
    console.error('[admin/stats]', err);
    return res.status(500).json({ message: 'Could not load stats.' });
  }
});

module.exports = router;
