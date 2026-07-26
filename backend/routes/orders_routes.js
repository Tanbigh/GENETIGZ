const express = require('express');
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a logged-in user (see order.js on the frontend,
// which calls this right before opening WhatsApp).
router.use(requireAuth);

// POST /api/orders — save the order BEFORE opening WhatsApp
router.post('/', async function (req, res) {
  try {
    const { productId, productName, size, color, quantity } = req.body || {};

    if (!productId || !String(productId).trim()) {
      return res.status(400).json({ message: 'productId is required.' });
    }
    if (!productName || !String(productName).trim()) {
      return res.status(400).json({ message: 'productName is required.' });
    }

    const order = await Order.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      productId: String(productId).trim(),
      productName: String(productName).trim(),
      size: size ? String(size).trim() : '',
      color: color ? String(color).trim() : '',
      quantity: Math.max(parseInt(quantity, 10) || 1, 1),
      whatsappStatus: 'pending',
    });

    return res.status(201).json({ order });
  } catch (err) {
    console.error('[orders/create]', err);
    return res.status(500).json({ message: 'Could not save order.' });
  }
});

// PATCH /api/orders/:id/status — order.js calls this right after WhatsApp
// actually opens (or if the popup was blocked / the tab failed to open).
router.patch('/:id/status', async function (req, res) {
  try {
    const { status } = req.body || {};
    if (!['opened', 'pending', 'failed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { whatsappStatus: status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ order });
  } catch (err) {
    console.error('[orders/status]', err);
    return res.status(500).json({ message: 'Could not update order.' });
  }
});

module.exports = router;
