# Architecture & Production Deployment Plan: Phase C (Backend & Database Persistence)

## Executive Summary
This document outlines the **end-to-end backend architecture, data model, API layer, and real-world production deployment strategy** for **Star Press** before initiating backend code implementation. It provides a complete inventory of required cloud services, cost analysis, architectural diagrams, API route specifications, and a zero-downtime launch runbook.

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Client Layer
        Browser["User Browser / Mobile PWA"]
        AdminUI["Store Admin & Staff"]
    end

    subgraph Edge & CDN
        Cloudflare["Cloudflare (DNS, SSL, WAF, Edge Caching)"]
    end

    subgraph Application Hosting
        Vercel["Next.js 14 App Router (Vercel Serverless / Node Runtime)"]
        Routes["API Route Handlers (/api/*)"]
        Auth["NextAuth.js (Session & JWT)"]
        Services["Business Logic / Server Layer (src/server/*)"]
    end

    subgraph Data & Storage Layer
        Prisma["Prisma ORM (Connection Pooled)"]
        Postgres["Neon / Supabase PostgreSQL (Managed DB)"]
        Storage["Cloudinary / Cloudflare R2 (Print Files & Artwork Uploads)"]
    end

    subgraph External Commercial Services
        Razorpay["Razorpay Gateway (UPI, Cards, NetBanking, Webhooks)"]
        Email["Resend / AWS SES (Order Receipts & Admin Alerts)"]
        WhatsApp["WhatsApp Business Direct / Webhook Notifications"]
    end

    Browser --> Cloudflare
    AdminUI --> Cloudflare
    Cloudflare --> Vercel
    Vercel --> Routes
    Routes --> Auth
    Routes --> Services
    Services --> Prisma
    Prisma --> Postgres
    Services --> Storage
    Services --> Razorpay
    Services --> Email
    Services --> WhatsApp
```

---

## 2. Real-World Database Persistence Model

The current draft schema in `prisma/schema.prisma` will be upgraded to support complete commercial print shop operations:

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--o{ CUSTOMIZATION_REQUEST : submits

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--o{ PAYMENT_TRANSACTION : records
    
    CATEGORY ||--|{ PRODUCT : categorizes
    PRODUCT ||--|{ PRODUCT_IMAGE : displays
    PRODUCT ||--o{ ORDER_ITEM : ordered_as
    PRODUCT ||--o{ REVIEW : receives

    ORDER {
        string id PK
        string orderNumber UK "SP-YYYY-XXXXX"
        string userId FK "nullable for guest orders"
        string guestEmail
        string guestPhone
        string guestName
        json shippingAddress "Immutable address snapshot"
        json billingAddress "Optional B2B GST snapshot"
        enum status "PENDING, CONFIRMED, IN_PRODUCTION, DISPATCHED, DELIVERED, CANCELLED"
        decimal subtotal
        decimal gstAmount "18% GST itemized"
        decimal shippingFee
        decimal discountAmount
        decimal totalAmount
        string razorpayOrderId
        string razorpayPaymentId
        string paymentStatus "UNPAID, PAID, FAILED, REFUNDED"
        string trackingNumber "Courier AWB"
        string courierPartner "e.g. Shiprocket, BlueDart, DTDC"
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        string productName
        string productSlug
        int quantity
        decimal unitPrice
        decimal lineTotal
        json specs "sizeId, materialId, dimensions, finish"
        string customText
        string artworkUrl "Cloudinary / S3 URL"
        string previewUrl "Customer thumbnail proof"
    }

    PAYMENT_TRANSACTION {
        string id PK
        string orderId FK
        string gateway "RAZORPAY"
        string gatewayOrderId
        string gatewayPaymentId
        string gatewaySignature
        string method "UPI, CARD, NETBANKING, WALLET"
        decimal amount
        string currency "INR"
        string status "AUTHORIZED, CAPTURED, FAILED"
        json rawPayload
        datetime createdAt
    }

    CUSTOMIZATION_REQUEST {
        string id PK
        string inquiryNumber "INQ-XXXXX"
        string name
        string email
        string phone
        string productType
        string quantity
        string finishDetails
        string artworkUrl
        string status "NEW, REVIEWED, QUOTED, CONVERTED, CLOSED"
        datetime createdAt
    }

    BULK_ORDER_INQUIRY {
        string id PK
        string inquiryNumber "BLK-XXXXX"
        string name
        string email
        string phone
        string company
        string productType
        string targetQuantity
        string notes
        boolean swatchKitRequested
        string status "NEW, CONTACTED, QUOTED, WON, LOST"
        datetime createdAt
    }

    CONTACT_INQUIRY {
        string id PK
        string name
        string email
        string phone
        string subject
        string message
        string status "NEW, REPLIED, ARCHIVED"
        datetime createdAt
    }
```

---

## 3. Backend API Route Specification

All endpoints will be built inside Next.js Route Handlers (`src/app/api/**`) backed by modular business services in `src/server/`:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/orders` | Public / Auth | Creates an immutable order record from checkout (guest or authenticated), validates pricing server-side, and generates `orderNumber`. |
| `GET` | `/api/orders/[id]` | Public / Auth | Retrieves order status and tracking details by Order ID or Order Reference + Phone/Email (for guest tracking). |
| `POST` | `/api/orders/track` | Public | Lookup order status by Order Number (`SP-XXXXX`) + Phone Number. |
| `POST` | `/api/inquiries/custom-print` | Public | Stores custom printing quote requests with uploaded file URLs. |
| `POST` | `/api/inquiries/bulk` | Public | Stores high-volume commercial RFQ inquiries with optional swatch kit flags. |
| `POST` | `/api/inquiries/contact` | Public | Stores contact form submissions and triggers email notification. |
| `POST` | `/api/uploads/presign` | Public | Generates secure pre-signed upload URLs for Cloudinary / S3 so massive files (PDF/AI up to 50MB) upload directly from browser to bucket without saturating the Next.js server. |
| `POST` | `/api/payments/razorpay/create-order` | Public / Auth | Generates a Razorpay `order_id` verified against DB order total in paise. |
| `POST` | `/api/payments/razorpay/webhook` | Webhook | Signature-verified webhook that transitions Order status to `CONFIRMED` upon payment success. |
| `GET` | `/api/admin/orders` | Admin Only | Filter, sort, and paginate all customer orders. |
| `PATCH` | `/api/admin/orders/[id]/status` | Admin Only | Updates production stage (`CONFIRMED` → `IN_PRODUCTION` → `DISPATCHED`) and sets AWB courier tracking. |

---

## 4. Required Cloud Services for Real-World Production

To launch Star Press commercially in production, the following services are required:

| Component | Recommended Service | Free Tier / Starting Cost | Why This Service? |
|---|---|---|---|
| **Frontend & API Hosting** | **Vercel** | Free (Hobby) / $20/mo (Pro) | Native Next.js 14 optimizations, automatic global edge CDN, zero-config SSR/SSG pre-rendering, seamless SSL certificates. |
| **Production Database** | **Neon PostgreSQL** (or Supabase) | Free (0.5 GB, 1 compute) → $19/mo | Serverless PostgreSQL with built-in connection pooling (`pgbouncer`), branching for staging/production, and instant backups. |
| **High-Res File Storage** | **Cloudinary** (or Cloudflare R2 / AWS S3) | Free (25 GB storage / credits) | Direct browser-to-cloud signed uploads for 50MB+ customer artwork files (PDF, TIFF, AI, PSD), automatic image resizing, and CDN delivery. |
| **Payment Gateway** | **Razorpay** | 2% per transaction (No monthly fee) | India's #1 gateway for UPI (GPay, PhonePe, Paytm), RuPay, Netbanking, Credit Cards, instant webhooks, and GST invoicing. |
| **Transactional Email** | **Resend** (or AWS SES) | Free (3,000 emails/mo, 100/day) | Clean developer API for order confirmation receipts, tracking updates, and new lead alerts to owner's inbox. |
| **DNS, WAF & Domain** | **Cloudflare** | Free | Super-fast DNS propagation, free DDoS protection, SSL termination, and caching. |
| **Domain Name** | **Namecheap / GoDaddy / Cloudflare** | ~$10–12 / year (`starpress.in`) | Professional brand credibility. |

> [!NOTE]
> **Zero Monthly Cost Option**: Star Press can launch and run its initial pilot completely on the **Free Tiers** of Vercel, Neon DB, Cloudinary, Resend, and Cloudflare. The only upfront cost is the domain name (~₹800/yr), and Razorpay charges only when an order is paid (2%).

---

## 5. Production Environment Configuration Matrix (`.env.production`)

```bash
# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://starpress.in"

# Database (Neon Connection Pooled URL for Prisma)
DATABASE_URL="postgresql://starpress_owner:PASSWORD@ep-sample-pooler.ap-southeast-1.aws.neon.tech/starpress?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://starpress_owner:PASSWORD@ep-sample.ap-southeast-1.aws.neon.tech/starpress?sslmode=require"

# NextAuth Security
NEXTAUTH_URL="https://starpress.in"
NEXTAUTH_SECRET="super-secret-hex-string-min-64-characters"

# Cloudinary / S3 Media & Artwork Uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="starpress"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_UPLOAD_PRESET="starpress_artwork"

# Razorpay Production Keys
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-live-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"

# Transactional Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxx"
NOTIFICATION_EMAIL="orders@starpress.in"
OWNER_ALERT_EMAIL="owner@starpress.in"
```

---

## 6. Step-by-Step Production Launch Runbook

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer / GitHub
    participant Neon as Neon PostgreSQL
    participant Vercel as Vercel Deployment
    participant Razorpay as Razorpay Dashboard
    participant Cloudflare as Cloudflare / DNS

    Dev->>Neon: 1. Provision serverless PostgreSQL instance
    Dev->>Dev: 2. Run 'npx prisma migrate deploy' + 'npm run prisma:seed'
    Dev->>Razorpay: 3. Complete KYC & generate Live API Keys + Webhook Secret
    Dev->>Vercel: 4. Import GitHub repository
    Dev->>Vercel: 5. Configure production environment variables (.env)
    Vercel->>Vercel: 6. Build & generate 194 static pages + SSR lambdas
    Dev->>Cloudflare: 7. Point CNAME / A records to Vercel (cname.vercel-dns.com)
    Vercel->>Cloudflare: 8. SSL certificate verified & activated
    Razorpay->>Vercel: 9. Register webhook endpoint (https://starpress.in/api/payments/razorpay/webhook)
    Dev->>Vercel: 10. Run live end-to-end transaction test (₹1 verification)
```

### Runbook Execution Steps:
1. **Provision Neon DB**: Create a database in AWS `ap-southeast-1` (Singapore) or `ap-south-1` (Mumbai) for minimum latency to India.
2. **Execute Schema Migration**:
   ```bash
   npx prisma migrate dev --name init_production
   npx prisma db seed
   ```
3. **Connect to Vercel**: Push repo to GitHub (`MrPrinceSaxena/StarPress`), import into Vercel, and paste the environment variables.
4. **Configure DNS**: Add an `A` record pointing `@` to `76.76.21.21` (or `CNAME` to `cname.vercel-dns.com`).
5. **Set Razorpay Webhook**: Configure webhook URL `https://starpress.in/api/payments/razorpay/webhook` with event `order.paid`.

---

## 7. Implementation Plan for Phase C

We will implement Phase C in structured milestones:

1. **Schema & Client Setup**:
   - Refine `prisma/schema.prisma` with `Order`, `OrderItem`, `PaymentTransaction`, `CustomizationRequest`, `BulkOrderInquiry`, `ContactInquiry`.
   - Configure Prisma Client with global pooling in `src/lib/db.ts`.
2. **Business Services Layer (`src/server/`)**:
   - `src/server/orders.ts`: Server-side price recalculation, order creation, order lookup by ID/number.
   - `src/server/inquiries.ts`: Handlers for Custom Printing, Bulk Orders, Contact messages.
   - `src/server/payments.ts`: Razorpay order creation and webhook signature validation.
3. **API Route Handlers (`src/app/api/`)**:
   - Create `/api/orders`, `/api/orders/[id]`, `/api/orders/track`.
   - Create `/api/inquiries/custom-print`, `/api/inquiries/bulk`, `/api/inquiries/contact`.
   - Create `/api/payments/razorpay/create-order`, `/api/payments/razorpay/webhook`.
4. **Storefront Frontend Wiring**:
   - Wire checkout page (`src/app/checkout/page.tsx`) to submit to `/api/orders`.
   - Wire Custom Printing form (`src/app/custom-printing/page.tsx`) to submit to `/api/inquiries/custom-print`.
   - Wire Bulk Orders form (`src/app/bulk-orders/page.tsx`) to submit to `/api/inquiries/bulk`.
   - Wire Contact form (`src/app/contact/page.tsx`) to submit to `/api/inquiries/contact`.
5. **Verification**:
   - End-to-end API test with synthetic payloads.
   - Run `npm run lint` and `npm run build` to ensure type safety and flawless compilation.

---

## Verification Plan
- **Unit & Integration Validation**: Execute API tests against the endpoints using mock data.
- **Form Submissions**: Submit real forms from `/checkout`, `/custom-printing`, `/bulk-orders`, and `/contact` and check database records.
- **Build & Types**: Ensure `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with 0 errors.
