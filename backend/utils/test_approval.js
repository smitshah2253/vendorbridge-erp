const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const Approval = require('../models/Approval');
const logActivity = require('./activityLogger');

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const quotations = await Quotation.find().populate('rfqId').populate('vendorId');
    console.log('Quotations in DB:', quotations.map(q => ({
      id: q._id,
      rfq: q.rfqId?.title,
      vendor: q.vendorId?.name,
      status: q.status,
      totalAmount: q.totalAmount
    })));

    for (const q of quotations) {
      console.log(`\nTesting status update on quotation ${q._id} (${q.rfqId?.title})...`);
      try {
        const quotation = await Quotation.findByIdAndUpdate(
          q._id,
          { status: 'Approved' },
          { new: true, runValidators: true }
        )
          .populate('rfqId')
          .populate('vendorId');

        if (!quotation) {
          console.log('Quotation not found!');
          continue;
        }

        // Update corresponding Approval status if exists
        await Approval.findOneAndUpdate(
          { quotationId: quotation._id, status: 'Pending' },
          { status: 'Approved', approvedAt: Date.now(), remarks: `Quotation updated to Approved via direct status handler` }
        );

        // Try calling logActivity
        await logActivity(managers?.[0]?._id || quotation.vendorId?._id || q._id, 'Approved', 'Quotation', quotation._id, {
          rfqTitle: quotation.rfqId?.title,
          vendorName: quotation.vendorId?.name
        });
        console.log('logActivity done.');

        console.log('Success for quotation:', q._id);
      } catch (err) {
        console.error('Failed for quotation:', q._id, err);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('Error in simulation:', error);
  }
};

const managers = [];
User.find({ role: 'Manager' }).then(res => {
  managers.push(...res);
  run();
});
