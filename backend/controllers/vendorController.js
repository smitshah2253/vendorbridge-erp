const Vendor = require('../models/Vendor');
const logActivity = require('../utils/activityLogger');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res) => {
  try {
    const { search, status, category } = req.query;

    let query = {};

    if (req.user && req.user.role === 'Vendor') {
      query.email = req.user.email;
    } else {
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { gstNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = { $regex: category, $options: 'i' };
      }
    }

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vendors.length,
      data: vendors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
const getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    if (req.user && req.user.role === 'Vendor' && vendor.email !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to view this vendor profile' });
    }

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);

    await logActivity(req.user.id, 'Registered', 'Vendor', vendor._id, { name: vendor.name });

    res.status(201).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await logActivity(req.user.id, 'Updated', 'Vendor', vendor._id, { name: vendor.name });

    res.json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await logActivity(req.user.id, 'Deleted', 'Vendor', vendor._id, { name: vendor.name });

    res.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getVendors, getVendor, createVendor, updateVendor, deleteVendor };
