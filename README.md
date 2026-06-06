# VendorBridge - Procurement & Vendor Management ERP

A comprehensive ERP system for managing procurement operations, including vendor management, RFQ creation, quotation comparison, approval workflows, purchase orders, and invoice generation.

## 🚀 Features

- **User Authentication**: Role-based login/signup (Admin, Procurement Officer, Vendor, Manager)
- **Vendor Management**: Register, track, and manage vendor profiles with GST details
- **RFQ Management**: Create and manage Request for Quotations with item specifications
- **Quotation System**: Submit and compare vendor quotations side-by-side
- **Approval Workflow**: Structured approval process for procurement requests
- **Purchase Orders**: Auto-generated PO numbers from approved quotations
- **Invoice Generation**: Create invoices with tax calculations, PDF export, and email functionality
- **Activity Tracking**: Comprehensive audit logs and activity timeline
- **Analytics Dashboard**: Procurement insights and spending analytics

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **PDFKit** for PDF generation
- **Nodemailer** for email services
- **Multer** for file uploads

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls




## 📁 Project Structure

```
vendorbridge-erp/
├── backend/
│   ├── config/          # Database and JWT configuration
│   ├── controllers/     # Business logic for each module
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, role, and error middleware
│   ├── utils/           # PDF generator and email service
│   ├── uploads/         # File storage
│   └── server.js        # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   ├── services/    # API service
│   │   └── utils/       # Helper functions
│   └── public/          # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hackathon
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/vendorbridge
   JWT_SECRET=your_jwt_secret_key_change_in_production
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

5. **Start MongoDB**
   ```bash
   # Using local MongoDB
   mongod

   # Or use MongoDB Atlas connection string in .env
   ```

### Running the Application

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:5000`

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## 📊 Database Schema

### User
- `name`, `email`, `password`, `role` (admin/procurement-officer/vendor/manager)

### Vendor
- `name`, `category`, `gstNumber`, `contactPerson`, `email`, `phone`, `address`, `status`, `rating`

### RFQ
- `title`, `description`, `items` [], `deadline`, `assignedVendors` [], `status`, `createdBy`

### Quotation
- `rfqId`, `vendorId`, `items` [], `totalAmount`, `notes`, `status`, `submittedAt`

### Approval
- `quotationId`, `rfqId`, `approverId`, `status`, `remarks`, `approvedAt`

### PurchaseOrder
- `poNumber` (auto-generated), `quotationId`, `vendorId`, `items` [], `subtotal`, `tax`, `totalAmount`, `status`

### Invoice
- `invoiceNumber` (auto-generated), `poId`, `vendorId`, `items` [], `subtotal`, `tax`, `totalAmount`, `status`, `dueDate`

### ActivityLog
- `userId`, `action`, `entity`, `entityId`, `details`, `timestamp`

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Vendors
- `GET /api/vendors` - Get all vendors (with search/filter)
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get single vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor

### RFQs
- `GET /api/rfqs` - Get all RFQs
- `POST /api/rfqs` - Create RFQ
- `GET /api/rfqs/:id` - Get single RFQ
- `PUT /api/rfqs/:id` - Update RFQ
- `DELETE /api/rfqs/:id` - Delete RFQ

### Quotations
- `GET /api/quotations` - Get all quotations
- `POST /api/quotations` - Submit quotation
- `GET /api/quotations/:id` - Get single quotation
- `PUT /api/quotations/:id` - Update quotation
- `DELETE /api/quotations/:id` - Delete quotation
- `GET /api/quotations/compare/:rfqId` - Compare quotations for RFQ

### Approvals
- `GET /api/approvals` - Get all approvals
- `POST /api/approvals` - Create approval request
- `POST /api/approvals/:id/approve` - Approve quotation
- `POST /api/approvals/:id/reject` - Reject quotation

### Purchase Orders
- `GET /api/purchase-orders` - Get all POs
- `POST /api/purchase-orders` - Create PO from quotation
- `GET /api/purchase-orders/:id` - Get single PO
- `PUT /api/purchase-orders/:id` - Update PO
- `DELETE /api/purchase-orders/:id` - Delete PO

### Invoices
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice from PO
- `GET /api/invoices/:id` - Get single invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `POST /api/invoices/:id/email` - Send invoice via email

### Activity & Analytics
- `GET /api/activity` - Get activity logs
- `POST /api/activity` - Create activity log
- `GET /api/analytics` - Get analytics data

## 👥 User Roles

### Procurement Officer
- Create RFQs
- Compare quotations
- Generate purchase orders
- Generate invoices

### Vendor
- Submit quotations
- Track RFQ status
- View purchase orders

### Manager / Approver
- Approve or reject procurement requests
- Monitor procurement workflows

### Admin
- Manage users
- Manage vendors
- View procurement analytics

## 🔄 Basic Workflow

1. **Procurement Officer** creates an RFQ with item specifications
2. **Vendors** receive invitations and submit quotations
3. **Procurement team** compares quotations side-by-side
4. **Approval workflow** is initiated for selected quotation
5. **Manager** approves or rejects the quotation
6. **Approved quotations** generate Purchase Orders
7. **Invoice** is generated from the Purchase Order
8. **Invoice** can be printed (PDF) or emailed directly
9. **Procurement activities** are tracked through logs and analytics

## 📧 Email Configuration

To enable email functionality (for sending invoices and RFQ notifications):

1. For Gmail:
   - Enable 2-factor authentication
   - Generate an App Password
   - Use the App Password in `EMAIL_PASS`

2. For other email providers:
   - Update `EMAIL_HOST` and `EMAIL_PORT` accordingly
   - Provide appropriate credentials

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Verify MongoDB is accessible on the specified port

### Email Sending Issues
- Verify email credentials in `.env`
- Check if 2FA is enabled and App Password is used (for Gmail)
- Ensure email provider allows SMTP access

### PDF Generation Issues
- Ensure `uploads` directory exists and has write permissions
- Check PDFKit installation

## 📝 Development Notes

- Backend runs on port 5000 (configurable via `.env`)
- Frontend runs on port 5173 (Vite default)
- All API routes are prefixed with `/api`
- JWT tokens expire in 7 days (configurable)
- PDF invoices are stored in `backend/uploads` directory

## 🤝 Contributing

This project was developed for a hackathon. Feel free to extend it with additional features such as:
- Advanced reporting and export options
- Real-time notifications using WebSockets
- Multi-language support
- Advanced vendor rating system
- Integration with payment gateways

## 📄 License

ISC

## 👨‍💻 Authors

Developed for VendorBridge Hackathon
