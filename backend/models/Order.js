const mongoose = require('mongoose');

// Field names below match what admin.js already renders and
// admin_routes.js already queries (userName, userEmail, productName,
// productId, size, color, quantity, whatsappStatus, createdAt) — this
// model was the missing piece those two files were written against.
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    productId: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    size: { type: String, default: '', trim: true },
    color: { type: String, default: '', trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    whatsappStatus: {
      type: String,
      enum: ['opened', 'pending', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

module.exports = mongoose.model('Order', orderSchema);
