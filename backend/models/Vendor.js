const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a vendor name'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    trim: true,
  },
  gstNumber: {
    type: String,
    required: [true, 'Please provide GST number'],
    trim: true,
  },
  contactPerson: {
    type: String,
    required: [true, 'Please provide contact person name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' },
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Pending',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Vendor', vendorSchema);
