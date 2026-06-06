const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const protect = require('../middleware/authMiddleware');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailService');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const path = require('path');

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoice)
  .put(protect, updateInvoice)
  .delete(protect, deleteInvoice);

router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfPath = await generateInvoicePDF(invoice, invoice.vendorId);
    res.download(pdfPath, `invoice-${invoice.invoiceNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/email', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('vendorId');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfPath = await generateInvoicePDF(invoice, invoice.vendorId);
    const result = await sendInvoiceEmail(invoice.vendorId.email, invoice.invoiceNumber, pdfPath);

    if (result.success) {
      await Invoice.findByIdAndUpdate(req.params.id, { status: 'Sent' });
      res.json({ success: true, message: 'Invoice sent successfully' });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
