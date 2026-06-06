const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateInvoicePDF = async (invoice, vendor) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, `invoice-${invoice.invoiceNumber}.pdf`);
      
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const writeStream = fs.createWriteStream(filePath);
      
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', (err) => reject(err));
      doc.on('error', (err) => reject(err));

      doc.pipe(writeStream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Company Info (mock)
      doc.fontSize(12).font('Helvetica');
      doc.text('VendorBridge Inc.', { align: 'left' });
      doc.text('123 Business Park');
      doc.text('Mumbai, MH 400001');
      doc.text('India');
      doc.text('GSTIN: 29ABCDE1234F1Z5');
      doc.moveDown();

      // Invoice Details
      doc.fontSize(14).font('Helvetica-Bold').text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.fontSize(12).font('Helvetica').text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
      doc.moveDown();

      // Vendor Info
      doc.fontSize(14).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(12).font('Helvetica').text(vendor.name);
      doc.text(vendor.address.street || '');
      doc.text(`${vendor.address.city || ''}, ${vendor.address.state || ''} ${vendor.address.zipCode || ''}`);
      doc.text(`GSTIN: ${vendor.gstNumber}`);
      doc.moveDown();

      // Items Table Header
      doc.fontSize(12).font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Item', 50, tableTop);
      doc.text('Quantity', 250, tableTop);
      doc.text('Price', 350, tableTop);
      doc.text('Total', 450, tableTop);
      
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.moveDown();

      // Items
      doc.fontSize(12).font('Helvetica');
      let y = doc.y;
      invoice.items.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        doc.text(item.name, 50, y);
        doc.text(item.quantity.toString(), 250, y);
        doc.text(`₹${item.price.toFixed(2)}`, 350, y);
        doc.text(`₹${itemTotal.toFixed(2)}`, 450, y);
        y += 25;
      });

      // Summary
      doc.moveDown();
      const summaryTop = doc.y;
      doc.moveTo(50, summaryTop).lineTo(550, summaryTop).stroke();
      doc.moveDown();

      doc.fontSize(12).font('Helvetica');
      doc.text(`Subtotal:`, 350, doc.y);
      doc.text(`₹${invoice.subtotal.toFixed(2)}`, 450, doc.y);
      doc.moveDown();

      doc.text(`Tax (${invoice.taxRate}%):`, 350, doc.y);
      doc.text(`₹${invoice.tax.toFixed(2)}`, 450, doc.y);
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`Total:`, 350, doc.y);
      doc.text(`₹${invoice.totalAmount.toFixed(2)}`, 450, doc.y);

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).font('Helvetica').text('Thank you for your business!', { align: 'center' });
      doc.text('This is a computer-generated invoice.', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
