# VendorBridge ERP - Business Logic & Testing Guide

This guide explains the business logic behind the core ERP modules in **VendorBridge** and provides step-by-step test scenarios to verify every feature.

---

## 1. Business Logic and Concepts

### 1.1 Vendor Management
*   **Concept**: A Vendor represents an external supplier registering to provide goods or services.
*   **Business Rules**:
    *   To prevent tax fraud, every registered Vendor must provide a valid **GST Number**.
    *   New registrations start in a `Pending` state.
    *   **Admins** and **Procurement Officers** evaluate vendors based on catalog fit and assign them a rating (0.0 to 5.0 stars) and change status to `Approved` or `Rejected`. Only `Approved` vendors can be assigned to new RFQs.
    *   Every vendor profile is bound to a user account email for authentication.

### 1.2 Request for Quotations (RFQs)
*   **Concept**: An RFQ is a procurement solicitation sent by the organization requesting prices and delivery timelines for a list of items.
*   **Business Rules**:
    *   Only **Procurement Officers** can create RFQs.
    *   RFQs must list at least one item (with quantities and units) and have a **Deadline Date**.
    *   Procurement Officers explicitly assign target vendors who are qualified to bid.
    *   Optional file attachments (like specifications sheets, blueprints) can be uploaded to help vendors submit accurate quotes.

### 1.3 Quotations
*   **Concept**: A Quotation is a vendor's binding bid containing unit prices and delivery timelines for the requested items in an RFQ.
*   **Business Rules**:
    *   Only assigned **Vendors** can submit quotations for an RFQ.
    *   **Vendor Verification**: Submitting a quotation enforces that the `vendorId` matches the authenticated user's vendor profile.
    *   **Unit Price** must be positive ($ > 0.00). **Total Amount** is auto-calculated: `Sum(Quantity * Unit Price)`.
    *   Vendors provide itemized **Delivery Timelines** (in days) and terms/notes.
    *   **Editable Quotations**: Vendors can edit their bids while the RFQ is open, which automatically resets the quotation status to `Pending` and alerts the Manager to re-evaluate.
    *   **Cascade Deletion**: Deleting a quotation automatically cleans up any associated `Approval` request from the system.

### 1.4 Quotation Comparison Matrix
*   **Concept**: Before choosing a supplier, Procurement Officers need to compare bids to find the best deal.
*   **Business Rules**:
    *   Only **Procurement Officers** can compare quotations.
    *   Bids must belong to the **same RFQ** to make a valid comparison.
    *   The matrix compares total costs, item unit prices, individual item delivery timelines, overall vendor ratings, and remarks side-by-side.
    *   The system highlights the **Lowest Cost** (cheapest overall amount) and the **Fastest Delivery** (lowest maximum delivery days for all items) to optimize decision making.

### 1.5 Approval Workflow
*   **Concept**: Controls expenditures by requiring manager approval before issuing Purchase Orders.
*   **Business Rules**:
    *   Only **Managers** can approve or reject pending quotations.
    *   Submitting a quotation automatically creates a pending `Approval` record assigned to the Senior Manager.
    *   Approving a quotation updates its status to `Approved` and updates the approval timeline remarks. This unlocks the quotation for Purchase Order generation.
    *   **Deleted Quotations Guard**: Safe checks prevent null pointer exceptions if the manager tries to approve or reject a quotation that has been deleted.

### 1.6 Purchase Orders (PO) & Invoices
*   **Concept**: A PO is a binding contract sent to a vendor. An Invoice is a request for payment generated once work is delivered.
*   **Business Rules**:
    *   Only **Procurement Officers** can generate POs from approved quotations.
    *   **Duplicate PO Guard**: Only one Purchase Order can be generated from an approved Quotation to prevent duplicate ordering.
    *   POs are auto-numbered sequentially starting with `PO-XXXX`. Standard tax is calculated at **18% GST**.
    *   Once a PO is generated, the Procurement Officer can generate an Invoice mapped to that PO.
    *   **Duplicate Invoice Guard**: Only one Invoice can be generated from a Purchase Order.
    *   Invoices are auto-numbered (`INV-XXXX`) and default to a `Draft` status.
    *   Invoices can be **printed** using standard browser print, downloaded as **PDFs**, and **emailed** directly to the vendor's email address via Nodemailer, which automatically flips the status to `Sent`.

### 1.7 Audit Logs & Notifications
*   **Concept**: Regulatory compliance requires tracking who did what and when.
*   **Business Rules**:
    *   All write/update actions (RFQ created, Vendor approved, Quotation updated, PO generated, Invoice emailed) write an immutable record to the `ActivityLog` collection.
    *   Recent alerts are polled and displayed in a **Notification Bell dropdown** in the header.
    *   All users have access to the **Activity Logs audit trail screen** to track operations.

### 1.8 Reports & Analytics
*   **Concept**: Business intelligence visualizing spending behaviors.
*   **Business Rules**:
    *   Charts load dynamic aggregated metrics:
        *   **Spending Trends**: Line chart grouping cumulative invoice totals by month.
        *   **Spend by Category**: Doughnut chart grouping cumulative spend by vendor category (e.g. IT, Supplies).
    *   Users can export a **CSV spreadsheet** containing detailed invoice rows.

---

## 2. Test Scenarios

Verify the entire system using the seeded credentials:
*   **Admin**: `admin@vendorbridge.com` / `admin123`
*   **Procurement Officer**: `procurement@vendorbridge.com` / `procurement123`
*   **Vendor**: `vendor@vendorbridge.com` / `vendor123`
*   **Manager / Approver**: `manager@vendorbridge.com` / `manager123`

---

### Scenario 1: Authentication & Forgot Password
1.  Navigate to the login page.
2.  Click **Forgot Password?**.
3.  Enter `admin@vendorbridge.com` and input a new password: `adminnew123`. Click **Reset Password**.
4.  Confirm the success alert appears.
5.  Attempt to log in with the old password (`admin123`) -> confirm it fails.
6.  Log in with the new password (`adminnew123`) -> confirm successful login.
7.  Reset it back to `admin123` for convenience.

### Scenario 2: Vendor Management & Edit (Admin)
1.  Log in as **Admin** (`admin@vendorbridge.com` / `admin123`).
2.  Go to the **Vendors** page.
3.  Type `Speedy` in the search bar -> confirm *Speedy Logistics LLC* is filtered.
4.  Clear the search. Click the **Edit** icon (pencil) next to *Speedy Logistics LLC*.
5.  Change the status to `Approved` and slide the rating to `4.0 stars`. Click **Update Vendor**.
6.  Confirm the vendor list updates with the new status and rating.

### Scenario 3: Create RFQ with File Attachment (Procurement Officer)
1.  Log in as **Procurement Officer** (`procurement@vendorbridge.com` / `procurement123`).
2.  Go to the **RFQs** page.
3.  Click **Create RFQ**.
4.  Enter title: `Office Stationary Procurement`.
5.  Enter description: `Standard notebooks and pens for corporate offices. See attached spec list.`
6.  Click **Choose File** under Attachments. Select any sample document. Confirm the file name is listed.
7.  Add items:
    *   `A4 Notebooks` (Qty: 100, Unit: pcs)
    *   `Blue Ballpoint Pens` (Qty: 500, Unit: pcs)
8.  Select a deadline date.
9.  Under assigned vendors, select *Office Depot Express*.
10. Click **Create RFQ**. Confirm the RFQ appears in the list.

### Scenario 4: Quotation Submission & Edit (Vendor)
1.  Log in as **Vendor** (`vendor@vendorbridge.com` / `vendor123`).
2.  Go to the **RFQs** page.
3.  Locate *Procurement of High-End Developer Laptops*. Click **View**.
4.  Observe the attachment link `Developer_Specs.pdf` (or similar) is listed.
5.  Note that a quotation is already pre-filled because one was seeded. Change the laptop price to `$2100.00` and timeline to `5` days.
6.  Click **Update Quotation**. Confirm the success alert appears.
7.  Locate the newly created RFQ *Office Stationary Procurement* (log in as a user mapped to *Office Depot Express* if needed). View it, fill in prices, and click **Submit Quotation**.

### Scenario 5: Quotation Comparison & Approval (Manager)
1.  Log in as **Manager** (`manager@vendorbridge.com` / `manager123`).
2.  Go to the **Quotations** page.
3.  Locate the quotations. Observe that you can see details.
4.  Go to the **Approvals** page.
5.  Identify the pending Quotation for *Procurement of High-End Developer Laptops* in the queue.
6.  Enter remarks: `Approved after price reduction.`
7.  Click **Approve**.
8.  Observe that the item moves from Pending Approvals to the **Approvals History Timeline** showing the remarks, date, and user.

### Scenario 6: Purchase Order & Invoice Generation (Procurement Officer)
1.  Log in as **Procurement Officer** (`procurement@vendorbridge.com` / `procurement123`).
2.  Go to the **Quotations** page.
3.  Observe that the quotation for *Procurement of High-End Developer Laptops* now displays the action button **Generate PO**.
4.  Click **Generate PO**.
5.  Go to the **Purchase Orders** page.
6.  Verify the new PO (e.g. `PO-0002`) is listed showing the correct RFQ title, vendor, subtotal, and 18% tax.
7.  Click **Generate Invoice**. Select a due date and click **Save**.
8.  Go to the **Invoices** page. Verify the invoice is created in `Draft` status.

### Scenario 7: Invoice PDF Download & Emailing
1.  In the **Invoices** page, click **View** on the invoice.
2.  Click **Print** -> verify the print dialog matches the premium printable design layout. Close print.
3.  Click **Download PDF** -> verify a PDF downloads with correct line items and calculations.
4.  Click **Send Email** -> verify the status changes from `Draft` to `Sent` (Nodemailer logs are printed in the backend console).

### Scenario 8: Audit Logs & Reports Export
1.  Go to the **Activity Logs** page.
2.  Observe the audit trail logs (e.g., "Procurement Officer Alpha generated purchase order PO-0002", "Senior Finance Manager approved quotation").
3.  Go to the **Reports** page.
4.  Observe that the **Spending Trends** chart and **Spend by Category** chart reflect the actual cumulative totals from the invoices.
5.  Click **Export CSV Report** -> verify a CSV downloads containing correct columns and invoice data rows.
