const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders
// Called by order.js right before opening WhatsApp. req.user comes from
// the verified JWT, so name/email are trusted server-side, not sent by
// the client — the client only sends what it's choosing to order.
router.post('/', requireAuth, async function (req, res) {
  try {
    const { productId, productName, size, color, quantity } = req.body || {};

    if (!productId || !productName) {
      return res.status(400).json({ message: 'Product information is missing.' });
    }
    if (!size || !color) {
      return res.status(400).json({ message: 'Size and color are required.' });
    }

    const qty = Number(quantity) || 1;

    const order = await Order.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      productId: String(productId),
      productName: String(productName),
      size: String(size),
      color: String(color),
      quantity: qty > 0 ? qty : 1,
      whatsappStatus: 'pending',
    });

    return res.status(201).json({ order });
  } catch (err) {
    console.error('[orders/create]', err);
    return res.status(500).json({ message: 'Could not save order.' });
  }
});

// PATCH /api/orders/:id/status — order.js calls this right after
// window.open() succeeds, so the admin dashboard can tell "saved" apart
// from "saved AND WhatsApp actually opened".
router.patch('/:id/status', requireAuth, async function (req, res) {
  try {
    const { status } = req.body || {};
    if (!['opened', 'pending', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { whatsappStatus: status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ order });
  } catch (err) {
    console.error('[orders/status]', err);
    return res.status(500).json({ message: 'Could not update order status.' });
  }
});

// GET /api/orders/mine — used by profile.html to show "your orders".
router.get('/mine', requireAuth, async function (req, res) {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    console.error('[orders/mine]', err);
    return res.status(500).json({ message: 'Could not load your orders.' });
  }
});

module.exports = router;
