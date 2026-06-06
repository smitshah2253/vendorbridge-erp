const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFQ',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  items: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    deliveryTimeline: {
      type: String,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Pending', 'Rejected', 'Approved'],
    default: 'Pending',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Quotation', quotationSchema);
