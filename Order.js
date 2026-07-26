const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Reference to the account that placed the order...
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ...plus a denormalized snapshot of name/email at order time, so
    // the admin dashboard can display/search orders in one query
    // without joining User on every request, and so the record stays
    // meaningful even if the user later edits their profile.
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },

    productId: { type: String, required: true },
    productName: { type: String, required: true },

    size: { type: String, required: true },
    color: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },

    // "opened" = the WhatsApp chat was successfully launched after this
    // record was saved. Kept as a field (rather than assuming) so a
    // future retry/failure path has somewhere to report to.
    whatsappStatus: {
      type: String,
      enum: ['opened', 'pending', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true } // createdAt doubles as "Order Date & Time"
);

orderSchema.index({ userName: 'text', userEmail: 'text', productName: 'text', productId: 'text' });

module.exports = mongoose.model('Order', orderSchema);
