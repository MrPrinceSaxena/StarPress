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
- Home page (hero banner, category grid, best-selling products, why-choose-us, testimonials, newsletter signup) — matches uploaded neon design
- Shop / Category browsing with filters (category, price range)
- Product detail page with **dynamic pricing**: price recalculates based on selected size, quantity, and (where applicable) text/customization length
- Search
- Wishlist (nice-to-have, not blocking launch)

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
- About, Contact, FAQs, Shipping, Returns, Track Order (can reuse order status lookup)

## 6. Pricing Logic (Business Rule)

Each product has:
- **Base price** (per unit at default size/qty)
- **Size multiplier** (e.g., A5/A4/A3, standard sizes for cards/banners)
- **Quantity tiers** (bulk discount per slab, e.g., 100/250/500/1000)
- **Text/customization length factor** (for items like engraved gifts, longer text = higher cost) — only applies to relevant product types

Final price = `base_price × size_factor × qty_tier_rate + customization_fee`. Exact formula/table to be confirmed per product category during Phase 2.

## 7. Phased Rollout

| Phase | Scope |
|---|---|
| **Phase 0** (done) | Repo scaffold, stack setup, DB schema draft, docs |
| **Phase 1 — MVP** | Home, Shop, Product detail w/ dynamic pricing, Cart, Auth, Checkout, Razorpay, Order confirmation |
| **Phase 2** | Customer order history/tracking, Admin panel (products, orders, pricing rules) |
| **Phase 3** | Custom Printing & Bulk Orders inquiry forms, static pages, newsletter |
| **Phase 4 (future)** | Wishlist, reviews/ratings, coupons, analytics, design-upload tool, courier tracking API |

Each phase ships independently and is documented so another developer can pick up mid-way (per client's stated requirement).

## 8. Success Criteria (Launch)

- Customer can complete an order end-to-end (browse → customize price → pay → confirmation) without manual intervention
- Admin can add a new product and it appears correctly priced on storefront within minutes
- Site matches the approved neon dark visual theme
- Site is usable on mobile (majority of Indian traffic is mobile-first)

## 9. Open Questions / To Confirm with Client

- Exact pricing tables per category (need size/qty/price sheet)
- Delivery/shipping partner or manual dispatch for v1
- Whether admin edits homepage content (banner/testimonials) or these stay code-level for now
- GST/invoice requirements
