const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide RFQ title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide description'],
  },
  items: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    specifications: {
      type: String,
    },
  }],
  deadline: {
    type: Date,
    required: [true, 'Please provide deadline'],
  },
  assignedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  }],
  attachments: [{
    filename: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  }],
  status: {
    type: String,
    enum: ['Draft', 'Open', 'Closed'],
    default: 'Open',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('RFQ', rfqSchema);
