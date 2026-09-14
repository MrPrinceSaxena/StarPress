# Star Press — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 14 Sept 2026
**Owner:** [Client Name] / Star Press
**Prepared by:** Development Team

---

## 1. Overview

Star Press is a custom printing e-commerce brand (based in Khatima, Uttarakhand) selling business cards, flyers, brochures, banners, stickers, and custom gift items. This document defines the product scope for **Star Press Online Store** — a Vistaprint-style website where customers browse products, customize price by size/quantity/text length, order online, and pay digitally. The client also gets an admin panel to run the store without developer help.

Scale target: **single small business, Pan-India delivery, low running cost.** Not designed for multi-vendor or enterprise scale — built to be upgraded later if the business grows.

---

## 2. Goals

| Goal | Why it matters |
|---|---|
| Let customers order prints online without calling/visiting the shop | Removes manual order-taking bottleneck |
| Transparent, instant pricing (size × quantity × text length) | Reduces back-and-forth quoting |
| Give the client full control (products, prices, orders) via admin panel | No developer dependency after launch |
| Accept online payments securely | Cash-free, fewer disputes |
| Keep hosting/running cost low | Small-town business budget |

## 3. Non-Goals (for now)

- No multi-vendor / marketplace features
- No native mobile app (responsive web only)
- No in-browser design editor (customers upload/describe design; deeper design tool is a future phase)
- No international shipping
- No multiple payment gateways (Razorpay only for now)

## 4. User Roles

| Role | Description |
|---|---|
| **Guest** | Browses catalog, can add to cart, must sign up/login to checkout |
| **Registered Customer** | Places orders, views order history, saves addresses |
| **Admin (Client)** | Manages products, categories, pricing rules, orders, and site content |

## 5. Core Features (Full Scope)

### 5.1 Storefront
- Home page sections (per client's requirement sheet): Header nav → Hero → Popular Categories (8 category cards) → Best Selling Products → Why Choose Us → **How It Works** (Choose Product → Upload Design → Confirm Order → We Print → Delivery) → Bulk Order banner → Customer Reviews → CTA section → Footer — matches the approved Neon Dark design
- Shop / Category browsing with filters (category, price range)
- Product detail page with **dynamic pricing**: price recalculates based on selected size, quantity, and (where applicable) text/customization length
- Search
- Wishlist (nice-to-have, not blocking launch)

### 5.1.1 Product Catalog Scope (per client requirement sheet)

8 main categories, ~50 products total at launch. Exact per-product specs, size/customization options, and pricing to be finalized later (client confirmed this is a later pass) — catalog structure below is enough to build category/product data model and seed the admin panel.

| Category | Example Products |
|---|---|
| Business Printing | Business Cards, Letterheads, Envelopes, Bill Books, Invoice Books, Company Profiles |
| Marketing Materials | Flyers, Brochures, Leaflets, Posters, Pamphlets, Catalogues |
| Outdoor Advertising | Flex Printing, Vinyl Printing, Banners, Hoardings, Standees, Glow Sign Boards, Neon Boards, 3D Letter Board, Name Plate, Acrylic Board |
| Stationery | Notebooks, Diaries, Notepads, Files & Folders, Certificates, ID Cards |
| Wedding & Events | Wedding Cards, Invitation Cards, Thank You Cards, Event Tickets, Ceremony Programs |
| Packaging | Paper Bags, Product Boxes, Packaging Labels, Tags |
| Labels & Stickers | Product Labels, Bottle Labels, Barcode Labels, Logo Stickers, Transparent Stickers, Custom Shape Stickers |
| Photo & Custom Printing | Photo Prints, Canvas Prints, Photo Frames, T-Shirt Printing, Mug Printing, Keychain Printing |

**Featured products for homepage "Best Selling Products":** Premium Business Cards, A4 Flyers, Tri-Fold Brochure, Vinyl Banner, Custom Stickers, Custom Paper Bags.

*Note:* the client's requirement sheet's Brand Setup tab (Navy Blue/Gold/White, "modern professional") is an early/outdated draft — the **Neon Dark theme from the approved screenshots is the current, correct theme** and is what's documented in the UI/UX doc. The sheet also references "WooCommerce cart/checkout" — that's leftover from an earlier WordPress-based concept and does not apply; the custom Next.js cart/checkout (per TRD) stands.

### 5.2 Customer Account
- Sign up / Login (email + password; NextAuth)
- Profile: saved addresses, order history, order tracking status
- Password reset

### 5.3 Cart & Checkout
- Cart with quantity edit, price recalculation
- Guest cart persists through login
- Checkout: address entry → order summary → payment
- Razorpay payment integration (UPI, cards, netbanking)
- Order confirmation (on-screen + email)

### 5.4 Orders
- Order status lifecycle: `Placed → Confirmed → In Production → Shipped → Delivered` (+ `Cancelled`)
- Customer can view status; Admin updates status
- Basic order tracking (status only — no live courier API for now)

### 5.5 Custom Printing / Bulk Orders (Inquiry-based)
- "Custom Printing" page — form to describe custom job (product type, quantity, notes, file upload optional)
- "Bulk Orders" page — quote request form (no instant price; client follows up manually)
- Both submit as leads to admin panel + notify client (email)

### 5.6 Admin Panel
- Login (admin-only, role-protected)
- Dashboard: order count, revenue summary (basic)
- Product management: add/edit/delete products, categories, images, pricing rules (base price + per-size/qty/text multipliers)
- Order management: view orders, update status, view customer details
- Custom/Bulk inquiry management: view and respond/mark as handled
- Basic content: hero banner text/image, testimonials (edit or fixed for now — confirm in dev)

### 5.7 Static / Support Pages
- About Us, Contact (phone/WhatsApp/email/address/enquiry form), FAQ, Track Order (reuses order status lookup)
- My Account (order history + account details — same as 5.2)
- Privacy Policy, Terms & Conditions (legal pages, medium priority)

## 6. Pricing Logic (Business Rule)

Each product has:
- **Base price** (per unit at default size/qty)
- **Size multiplier** (e.g., A5/A4/A3, standard sizes for cards/banners)
- **Quantity tiers** (bulk discount per slab, e.g., 100/250/500/1000)
- **Text/customization length factor** (for items like engraved gifts, longer text = higher cost) — only applies to relevant product types

Final price = `base_price × size_factor × qty_tier_rate + customization_fee`. Exact formula/table to be confirmed per product category during Phase 2.

## 7. Phased Rollout

*(Aligned to the repo's own phase numbering in `docs/04-PAGES-AND-FEATURES.md` / `docs/05-CHANGELOG.md`, so the PRD and the codebase's dev log don't drift into two different phase schemes.)*

| Phase | Scope | Status |
|---|---|---|
| **Phase 0** | Repo scaffold, stack setup, DB schema draft, docs | ✅ Done |
| **Phase 7 (Home)** + Hardening | Pixel-accurate Home page (10 sections) + security headers, SEO, cart/wishlist context, error pages | ✅ Done — content gaps found, see Dev Tracker |
| **Phase 1** | Customer auth (register/login), Admin auth/role gating | 🔲 Next up |
| **Phase 2** | Catalog (8 categories, ~50 products), pricing-rule engine, Shop/Category/Product-detail pages | 🔲 Not started |
| **Phase 3** | Cart (full), Checkout, guest-checkout decision | 🔲 Not started |
| **Phase 4** | Order creation + status tracking | 🔲 Not started |
| **Phase 5** | Razorpay payment integration | 🔲 Not started — blocked on client's Razorpay account credentials |
| **Phase 6** | Admin panel — products/categories, orders | 🔲 Not started |
| **Phase 7 (remainder)** | Custom Printing & Bulk Orders forms, About/Contact/FAQ, legal pages, reviews | 🔲 Not started |
| **Phase 8+ (future)** | Wishlist polish, coupons, analytics, design-upload tool, courier tracking API | 🔲 Future |

Each phase ships independently and is documented (`docs/05-CHANGELOG.md` in-repo + this PRD) so another developer can pick up mid-way.

## 8. Success Criteria (Launch)

- Customer can complete an order end-to-end (browse → customize price → pay → confirmation) without manual intervention
- Admin can add a new product and it appears correctly priced on storefront within minutes
- Site matches the approved neon dark visual theme
- Site is usable on mobile (majority of Indian traffic is mobile-first)

## 9. Open Questions / Status

| Item | Status |
|---|---|
| Delivery/shipping for v1 | ✅ **Confirmed** — manual dispatch for Phase 1; courier API (e.g., Shiprocket) integrated later |
| Theme | ✅ **Confirmed** — Neon Dark (screenshots), not the Navy/Gold brand-sheet draft |
| Cart/checkout platform | ✅ **Confirmed** — custom Next.js build, not WooCommerce |
| Exact pricing tables per category (size/qty/price) | ⏳ Pending — client will provide in a later, deeper pass along with product specs and order-customization options |
| Product specifications & customization options per product | ⏳ Pending — same later pass as above |
| Whether admin edits homepage content (banner/testimonials) or these stay code-level | ⏳ Pending |
| GST/invoice requirements | ⏳ Pending |
| Guest checkout vs. forced account creation | ⏳ Pending — decide by Phase 3 |
| Single admin (owner) login vs. multiple staff accounts | ⏳ Pending — assumed single owner login unless client asks otherwise |
| Razorpay business account credentials | ⏳ **Blocking Phase 5** — client must provide their own Razorpay account before payment integration can start |
