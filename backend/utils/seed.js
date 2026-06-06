const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const Approval = require('../models/Approval');
const ActivityLog = require('../models/ActivityLog');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

// Load environment variables from backend directory config
dotenv.config();

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/vendorbridge';
    await mongoose.connect(connStr);
    console.log('MongoDB connected for seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Vendor.deleteMany();
    await RFQ.deleteMany();
    await Quotation.deleteMany();
    await Approval.deleteMany();
    await ActivityLog.deleteMany();
    await PurchaseOrder.deleteMany();
    await Invoice.deleteMany();

    console.log('Cleared existing database records.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@vendorbridge.com',
      password: 'admin123',
      role: 'Admin'
    });

    const procurementUser = await User.create({
      name: 'Procurement Officer Alpha',
      email: 'procurement@vendorbridge.com',
      password: 'procurement123',
      role: 'Procurement Officer'
    });

    const vendorUser = await User.create({
      name: 'Global Tech Sales',
      email: 'vendor@vendorbridge.com',
      password: 'vendor123',
      role: 'Vendor'
    });

    const managerUser = await User.create({
      name: 'Senior Finance Manager',
      email: 'manager@vendorbridge.com',
      password: 'manager123',
      role: 'Manager'
    });

    console.log('Seeded Users:');
    console.log('- Admin: admin@vendorbridge.com / admin123');
    console.log('- Procurement: procurement@vendorbridge.com / procurement123');
    console.log('- Vendor: vendor@vendorbridge.com / vendor123');
    console.log('- Manager: manager@vendorbridge.com / manager123');

    // 2. Create Vendors
    const vendor1 = await Vendor.create({
      name: 'Global Tech Solutions',
      category: 'IT Equipment',
      gstNumber: 'GSTIN27AABCG1234E1Z5',
      contactPerson: 'John Sales Manager',
      email: 'vendor@vendorbridge.com',
      phone: '+919876543210',
      rating: 4.5,
      status: 'Approved'
    });

    const vendor2 = await Vendor.create({
      name: 'Office Depot Express',
      category: 'Office Supplies',
      gstNumber: 'GSTIN27AABCO6543A2Z9',
      contactPerson: 'Sarah Furniture Head',
      email: 'officesupplies@vendorbridge.com',
      phone: '+919876543211',
      rating: 4.1,
      status: 'Approved'
    });

    const vendor3 = await Vendor.create({
      name: 'Speedy Logistics LLC',
      category: 'Logistics',
      gstNumber: 'GSTIN27AABCL7891B3Z8',
      contactPerson: 'Arthur Delivery Director',
      email: 'logistics@vendorbridge.com',
      phone: '+919876543212',
      rating: 3.7,
      status: 'Pending'
    });

    console.log('Seeded Vendors.');

    // 3. Create RFQs
    const rfq1 = await RFQ.create({
      title: 'Procurement of High-End Developer Laptops',
      description: 'Requesting quotations for 5 units of high-end developer workstations for our engineering team. Must include warranty.',
      items: [
        {
          name: 'Developer Laptop 16-inch',
          quantity: 5,
          specifications: '16-inch screen, 32GB RAM, 1TB SSD, Dedicated GPU'
        }
      ],
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      assignedVendors: [vendor1._id],
      status: 'Open',
      createdBy: procurementUser._id
    });

    const rfq2 = await RFQ.create({
      title: 'Ergonomic Office Chairs Refit',
      description: 'Request for Quotation to supply and install ergonomic chairs in our main HQ office conference rooms.',
      items: [
        {
          name: 'Ergonomic Mesh Chair',
          quantity: 15,
          specifications: 'High back, lumbar support, fully adjustable armrests'
        }
      ],
      deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      assignedVendors: [vendor2._id],
      status: 'Open',
      createdBy: procurementUser._id
    });

    console.log('Seeded RFQs.');

    // 4. Create Quotation
    const quote1 = await Quotation.create({
      rfqId: rfq1._id,
      vendorId: vendor1._id,
      items: [
        {
          name: 'Developer Laptop 16-inch',
          quantity: 5,
          price: 2150.00,
          deliveryTimeline: '7'
        }
      ],
      totalAmount: 10750.00,
      notes: 'Includes 3-year onsite manufacturer warranty and complimentary laptop sleeves.',
      status: 'Pending'
    });

    console.log('Seeded Quotations.');

    // 5. Create Approval Request
    await Approval.create({
      quotationId: quote1._id,
      rfqId: rfq1._id,
      approverId: managerUser._id,
      status: 'Pending'
    });

    console.log('Seeded Approvals.');

    // 6. Create Activity Logs
    await ActivityLog.create({
      userId: adminUser._id,
      action: 'Registered',
      entity: 'Vendor',
      entityId: vendor1._id,
      details: { name: vendor1.name }
    });

    await ActivityLog.create({
      userId: procurementUser._id,
      action: 'Created',
      entity: 'RFQ',
      entityId: rfq1._id,
      details: { title: rfq1.title }
    });

    await ActivityLog.create({
      userId: vendorUser._id,
      action: 'Submitted',
      entity: 'Quotation',
      entityId: quote1._id,
      details: { rfqTitle: rfq1.title, totalAmount: quote1.totalAmount }
    });

    console.log('Seeded Activity Logs.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
};

seedData();
