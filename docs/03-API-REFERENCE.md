# API Reference

Complete documentation of all Next.js App Router Route Handlers (`src/app/api/**`).

---

## Orders & Tracking (`src/server/orders.ts`)

### POST /api/orders
- **Auth:** None (Supports guest & authenticated users)
- **Purpose:** Creates an immutable order record in the database with line items and shipping address snapshot.
- **Request Body:**
  ```json
  {
    "guestEmail": "customer@example.com",
    "guestPhone": "9876543210",
    "guestName": "Rohan Sharma",
    "shippingAddress": {
      "fullName": "Rohan Sharma",
      "phone": "9876543210",
      "email": "customer@example.com",
      "companyName": "Sharma Traders",
      "addressLine1": "Plot 42, Okhla Phase 3",
      "city": "New Delhi",
      "state": "Delhi NCR",
      "pincode": "110020"
    },
    "billingAddress": {
      "companyName": "Sharma Traders",
      "gstin": "07AAAAA0000A1Z5"
    },
    "subtotal": 1299,
    "gstAmount": 0,
    "shippingFee": 0,
    "totalAmount": 1299,
    "paymentMethod": "online",
    "notes": "Urgent dispatch requested",
    "items": [
      {
        "productId": "prod-business-cards",
        "productName": "Premium Business Cards",
        "productSlug": "business-cards",
        "quantity": 100,
        "unitPrice": 299,
        "lineTotal": 299
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "order": {
      "id": "cuid...",
      "orderNumber": "SP-2026-83921",
      "status": "PENDING",
      "totalAmount": 1299,
      "paymentStatus": "UNPAID"
    }
  }
  ```

### GET /api/orders/[id]
- **Auth:** None / Customer / Admin
- **Purpose:** Retrieves full order details, line items, and transaction logs by Order ID or Order Number (`SP-XXXX-XXXXX`).
- **Response:** `{ "success": true, "order": { ... } }`
- **Errors:** `404 Not Found` if order does not exist.

### POST /api/orders/track
- **Auth:** None
- **Purpose:** Secure lookup for customers and guests without requiring full authentication.
- **Request Body:** `{ "orderNumber": "SP-2026-83921", "phoneOrEmail": "9876543210" }`
- **Response:**
  ```json
  {
    "success": true,
    "order": {
      "orderNumber": "SP-2026-83921",
      "status": "CONFIRMED",
      "totalAmount": 1299,
      "trackingNumber": "AWB984920492",
      "courierPartner": "BlueDart"
    }
  }
  ```

---

## Leads & Inquiries (`src/server/inquiries.ts`)

### POST /api/inquiries/custom-print
- **Auth:** None
- **Purpose:** Stores custom print inquiries and generates inquiry reference (`INQ-YYYY-XXXX`).
- **Request Body:** `{ "name": "...", "phone": "...", "email": "...", "productType": "...", "details": "..." }`
- **Response:** `{ "success": true, "inquiryNumber": "INQ-2026-4029" }`

### POST /api/inquiries/bulk
- **Auth:** None
- **Purpose:** Stores enterprise volume RFQs and sample swatch kit requests (`BLK-YYYY-XXXX`).
- **Request Body:** `{ "name": "...", "phone": "...", "email": "...", "company": "...", "productType": "...", "swatchKitRequested": true }`
- **Response:** `{ "success": true, "inquiryNumber": "BLK-2026-9204" }`

### POST /api/inquiries/contact
- **Auth:** None
- **Purpose:** Stores contact form queries with ticket number (`CNT-YYYY-XXXX`).
- **Request Body:** `{ "name": "...", "email": "...", "phone": "...", "subject": "...", "message": "..." }`
- **Response:** `{ "success": true, "inquiryNumber": "CNT-2026-5912" }`

---

## Payments & Webhooks (`src/server/payments.ts`)

### POST /api/payments/razorpay/create-order
- **Auth:** None / Customer
- **Purpose:** Initializes an order with Razorpay in paise.
- **Request Body:** `{ "orderId": "cuid..." }`
- **Response:**
  ```json
  {
    "success": true,
    "razorpayOrderId": "order_xxxx",
    "amount": 129900,
    "currency": "INR",
    "keyId": "rzp_live_xxx"
  }
  ```

### POST /api/payments/razorpay/webhook
- **Auth:** Webhook Signature Header (`x-razorpay-signature`)
- **Purpose:** Validates HMAC SHA-256 signature and automatically marks order `CONFIRMED` and payment `PAID`.
- **Response:** `{ "status": "ok" }`

---

## Admin Order Management

### GET /api/admin/orders
- **Auth:** Admin
- **Query Params:** `?status=PENDING&page=1&limit=50`
- **Response:** `{ "success": true, "orders": [...], "total": 120, "page": 1, "limit": 50 }`

### PATCH /api/admin/orders/[id]/status
- **Auth:** Admin
- **Request Body:** `{ "status": "DISPATCHED", "trackingNumber": "AWB123456", "courierPartner": "Shiprocket" }`
- **Response:** `{ "success": true, "order": { ... } }`
