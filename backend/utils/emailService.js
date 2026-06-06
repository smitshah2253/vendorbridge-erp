const nodemailer = require('nodemailer');

// Helper to determine the sender email address
const getFromEmail = () => {
  return process.env.SENDGRID_SENDER_EMAIL || process.env.EMAIL_USER || 'no-reply@vendorbridge.com';
};

// Create transporter dynamically (SendGrid if SENDGRID_API_KEY is defined, otherwise standard SMTP)
const createTransporter = () => {
  if (process.env.SENDGRID_API_KEY) {
    console.log('Using SendGrid SMTP transporter...');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  console.log('Using fallback standard SMTP transporter...');
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send invoice email (with PDF attachment)
const sendInvoiceEmail = async (to, invoiceNumber, pdfPath) => {
  try {
    const transporter = createTransporter();
    const fromEmail = getFromEmail();

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: `Invoice ${invoiceNumber} from VendorBridge`,
      text: `Dear Vendor,\n\nPlease find attached the invoice ${invoiceNumber} for your reference.\n\nPayment is due by the specified date.\n\nIf you have any questions, please contact us.\n\nBest regards,\nVendorBridge Team`,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

// Send RFQ notification
const sendRFQNotification = async (to, rfqTitle, deadline) => {
  try {
    const transporter = createTransporter();
    const fromEmail = getFromEmail();

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: `New RFQ: ${rfqTitle}`,
      text: `Dear Vendor,\n\nYou have been invited to submit a quotation for: ${rfqTitle}\n\nDeadline: ${new Date(deadline).toLocaleDateString()}\n\nPlease log in to your portal to submit your quotation.\n\nBest regards,\nVendorBridge Team`,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

// Send PO notification
const sendPONotification = async (to, poNumber, totalAmount) => {
  try {
    const transporter = createTransporter();
    const fromEmail = getFromEmail();

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: `New Purchase Order: ${poNumber}`,
      text: `Dear Vendor,\n\nA new Purchase Order ${poNumber} has been generated for you.\n\nTotal Amount: $${totalAmount.toFixed(2)}\n\nPlease log in to your portal to view and process this order.\n\nBest regards,\nVendorBridge Team`,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

// Send Quotation status notification
const sendQuotationStatusNotification = async (to, rfqTitle, status) => {
  try {
    const transporter = createTransporter();
    const fromEmail = getFromEmail();

    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: `Quotation Status Update: ${status}`,
      text: `Dear Vendor,\n\nYour quotation for RFQ "${rfqTitle}" has been ${status}.\n\nPlease log in to your portal to check details.\n\nBest regards,\nVendorBridge Team`,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

module.exports = { 
  sendInvoiceEmail, 
  sendRFQNotification, 
  sendPONotification, 
  sendQuotationStatusNotification 
};
