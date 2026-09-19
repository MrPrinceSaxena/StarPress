# Database Schema

Source of truth is `prisma/schema.prisma`. This document outlines the models, relations, and operational rules governing Star Press in production.

---

## Auth & Users
- **User**: Customer accounts and administrators. Role is distinguished via `Role` enum (`CUSTOMER` / `ADMIN`). Password is safe-hashed using `bcryptjs`.
- **Address**: Saved shipping and billing destinations associated with a `User`.

---

## Catalog & Display
- **Category**: 8 canonical commercial categories per PRD §5.1.1 (`business-printing`, `marketing-materials`, `outdoor-advertising`, `stationery`, `wedding-events`, `packaging`, `labels-stickers`, `photo-custom-printing`).
- **Product**: 49 commercial products.
- **ProductImage**: Primary and gallery showcase photography.
- **PricingRule**: Database pricing slabs mapping sizes and volume quantity tiers.

---

## Orders & Transactions
- **Order**:
  - `orderNumber`: Unique customer-facing identifier (`SP-YYYY-XXXXX`).
  - `userId`: Nullable for guest checkouts.
  - `guestEmail`, `guestPhone`, `guestName`: Guest customer contact info.
  - `status`: Lifecycle enum: `PENDING → CONFIRMED → IN_PRODUCTION → DISPATCHED → DELIVERED (or CANCELLED)`.
  - `shippingAddress` & `billingAddress`: Immutable JSON snapshots captured at the exact moment of order placement.
  - `subtotal`, `shippingFee`, `discountAmount`, `totalAmount`.
  - `gstAmount`: Nullable decimal for optional B2B GST invoicing.
  - `paymentStatus`: `UNPAID → PAID (or FAILED / REFUNDED)`.
  - `trackingNumber` & `courierPartner`: AWB tracking details updated upon dispatch.
- **OrderItem**:
  - Line items frozen with historical unit rates, `specs` JSON, and optional customer print artwork files.
- **PaymentTransaction**:
  - Audit log of Razorpay payment IDs, signatures, payment methods (UPI/Cards/Netbanking), and captured amounts.

---

## Inquiries & Leads
- **CustomizationRequest**: High-spec bespoke jobs from the Custom Printing studio with uploaded artwork URLs. Reference format: `INQ-YYYY-XXXXX`.
- **BulkOrderInquiry**: High-volume corporate print RFQs with swatch kit delivery requests. Reference format: `BLK-YYYY-XXXXX`.
- **ContactInquiry**: Customer service and order tracking queries. Reference format: `CNT-YYYY-XXXXX`.

---

## Database Hosting: Supabase PostgreSQL
- Configured with connection pooling for high-concurrency serverless API calls.
- Connected via `DATABASE_URL` in Next.js environment.
