const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true,
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Completed'],
    default: 'Draft',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate PO number before saving
purchaseOrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
