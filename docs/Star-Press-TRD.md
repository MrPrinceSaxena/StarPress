# Star Press — Technical Requirements Document (TRD)

**Version:** 1.0
**Date:** 14 Sept 2026
**Scope reference:** Star-Press-PRD.md (full scope — auth, cart, orders, admin, Razorpay)

---

## 1. Tech Stack (Confirmed)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SSR/ISR for SEO on product pages |
| Styling | Tailwind CSS | Matches neon design tokens (see UI/UX doc) |
| Database | PostgreSQL | Hosted on a managed provider (e.g., Neon/Supabase/Railway) |
| ORM | Prisma | Schema-first, migrations |
| Auth | NextAuth.js | Credentials provider (email+password); Google optional later |
| Payments | Razorpay | Orders API + Webhooks for payment verification |
| Hosting | Vercel | Frontend + API routes; DB hosted separately |
| Image handling | Next.js Image + a storage bucket (e.g., Cloudinary or S3-compatible) | For product images & custom-order file uploads |
| Email | Resend / Nodemailer + SMTP | Order confirmation, inquiry notifications |

Kept intentionally simple/low-cost for small-scale launch; each piece can be swapped/scaled later (e.g., move DB to a bigger instance, add CDN, add search service).

## 2. Architecture Overview

```
[Browser] 
   │
   ▼
[Next.js App (Vercel)]
   ├── Pages/Routes (SSR/ISR): Home, Shop, Product, Cart, Checkout, Account, Admin
   ├── API Routes: /api/products, /api/orders, /api/cart, /api/auth/*, /api/razorpay/*, /api/admin/*
   ├── NextAuth (session/JWT)
   └── Prisma Client
          │
          ▼
   [PostgreSQL Database]

External:
   [Razorpay API]  ⇄  /api/razorpay/create-order, /api/razorpay/webhook
   [Email Service] ⇄  triggered from order/inquiry API routes
   [Image Storage] ⇄  admin product upload flow
```

- Single Next.js monorepo — no separate backend service needed at this scale.
- Admin panel is a route group (`/admin/*`) inside the same app, protected by role-based middleware.

## 3. Data Model (Core Entities)

```
User
 - id, name, email, passwordHash, role (CUSTOMER | ADMIN), createdAt

Address
 - id, userId → User, line1, line2, city, state, pincode, phone, isDefault

Category
 - id, name, slug, imageUrl

Product
 - id, categoryId → Category, name, slug, description, basePrice, images[], isActive

ProductVariantOption   // size / material / etc.
 - id, productId → Product, type (SIZE | MATERIAL | OTHER), label, priceMultiplier

PricingTier            // quantity-based slabs
 - id, productId → Product, minQty, maxQty, unitRate

CustomizationRule       // optional text-length based pricing
 - id, productId → Product, perCharacterFee, freeCharacterLimit

Cart / CartItem
 - Cart: id, userId (nullable for guest, session-based)
 - CartItem: id, cartId, productId, variantSelections(json), quantity, computedPrice

Order
 - id, userId → User, addressId → Address, status (PLACED|CONFIRMED|IN_PRODUCTION|SHIPPED|DELIVERED|CANCELLED),
   totalAmount, razorpayOrderId, razorpayPaymentId, paymentStatus, createdAt

OrderItem
 - id, orderId → Order, productId → Product, variantSelections(json), quantity, unitPrice, lineTotal

Inquiry                 // Custom Printing / Bulk Orders leads
 - id, type (CUSTOM | BULK), name, phone, email, details, fileUrl, status (NEW|CONTACTED|CLOSED), createdAt

NewsletterSubscriber
 - id, email, subscribedAt
```

*(This is the Phase 0 draft schema — refine field names/constraints in Prisma during implementation.)*

## 4. Key API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/*` | — | NextAuth handlers (login, session, signout) |
| `/api/products` | GET | List/filter products |
| `/api/products/[slug]` | GET | Product detail + pricing rules |
| `/api/pricing/calc` | POST | Server-side price calculation (size, qty, text length) |
| `/api/cart` | GET/POST/PATCH/DELETE | Cart CRUD |
| `/api/orders` | POST | Create order (pre-payment) |
| `/api/razorpay/create-order` | POST | Create Razorpay order object |
| `/api/razorpay/webhook` | POST | Verify payment signature, update order status |
| `/api/orders/[id]` | GET | Order detail / status (customer + admin) |
| `/api/inquiries` | POST | Submit custom/bulk inquiry |
| `/api/admin/products` | GET/POST/PATCH/DELETE | Admin product management (role-protected) |
| `/api/admin/orders` | GET/PATCH | Admin order list + status update |
| `/api/admin/inquiries` | GET/PATCH | Admin inquiry management |

## 5. Auth & Access Control

- NextAuth Credentials provider; passwords hashed with bcrypt.
- JWT session includes `role`.
- `/admin/*` routes and `/api/admin/*` protected by middleware checking `role === 'ADMIN'`.
- Guest checkout: cart tied to a session cookie until login/signup at checkout step, then merged into the user's account cart.

## 6. Payment Flow (Razorpay)

1. Customer confirms checkout → API creates local `Order` (status `PLACED`, `paymentStatus: PENDING`) and a Razorpay order via `/api/razorpay/create-order`.
2. Razorpay Checkout widget opens client-side.
3. On success, Razorpay sends payment details to client → client calls backend to verify signature.
4. Webhook (`/api/razorpay/webhook`) is the source of truth: verifies signature, updates `Order.paymentStatus` and `status → CONFIRMED`.
5. Order confirmation email sent on webhook success.

**Security note:** never trust client-side payment confirmation alone — always verify via webhook signature.

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Product images optimized/lazy-loaded; target Lighthouse Performance ≥ 85 on mobile |
| Security | Input validation (Zod) on all API routes; rate-limit auth & inquiry endpoints; sanitize file uploads |
| Reliability | Payment status always confirmed via webhook, not client callback alone |
| Scalability | Stateless API routes (Vercel serverless) scale automatically; DB indexed on `productId`, `userId`, `orderId` |
| Maintainability | Every phase/feature documented in-repo (`/docs`) per client's requirement so another dev can continue |
| Cost | Free/low tiers for hosting, DB, and image storage suitable for small-scale traffic |

## 8. Environment Variables (indicative)

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
EMAIL_SMTP_HOST / PORT / USER / PASS  (or RESEND_API_KEY)
IMAGE_STORAGE_URL / KEY
```

## 9. Deployment

- **Frontend + API:** Vercel (auto-deploy from `main` branch)
- **Database:** managed Postgres (separate provider)
- **Domain:** custom domain pointed to Vercel
- Staging via Vercel preview deployments per PR

## 10. Phase Mapping (Dev Order)

Matches PRD phases:
1. Phase 1 — schema + Home/Shop/Product/Cart/Auth/Checkout/Razorpay
2. Phase 2 — Order history/tracking + Admin panel (products, orders, pricing)
3. Phase 3 — Inquiry forms (Custom/Bulk) + static pages + newsletter
4. Phase 4 — Future: reviews, coupons, analytics, design-upload tool
