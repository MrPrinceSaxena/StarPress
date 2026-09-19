# Star Press — Development Tracker

**Purpose:** Single source of truth for build progress, kept in sync with the PRD/TRD/UI-UX docs and the repo's own `docs/04-PAGES-AND-FEATURES.md` + `docs/05-CHANGELOG.md`.

**Phase numbers below match the repo's own numbering** (not a separate scheme) so the codebase's changelog and this tracker never drift apart.

**Rule:** A task only moves to ✅ Done after it (a) works end-to-end, (b) matches the UI/UX doc's Neon Dark tokens, and (c) has no known content/data mismatches. Audited on 14 Sept 2026 directly against `github.com/MrPrinceSaxena/StarPress`.

---

## Phase 0 — Scaffold ✅ Done
Repo structure, base configs, `.env.example`, draft Prisma schema, minimal booting shell.

## Phase 7 (Home) + Hardening — ✅ Done

| Task | Status | Notes |
|---|---|---|
| 10-section Home page (Header, Hero, TrustBadges, CategoryGrid, BestSellers, PromoBanner, WhyChooseUs, Testimonials, Newsletter, Footer) | ✅ Done | Pixel-accurate per changelog |
| ESLint/TSConfig hardening, security headers, SEO (JSON-LD, sitemap, robots.txt), CartContext/WishlistContext, error/404/loading pages, env validation | ✅ Done | Solid — no action needed |
| `CategoryGrid.tsx` — real 8 categories | ✅ Done | Fixed; responsive 8/4/2-column grid |
| `BestSellers.tsx` — real 6 featured products | ✅ Done | Fixed; 3-column grid |
| How It Works section | ✅ Done | `HowItWorks.tsx` — 5-step, icon chips, neon borders |
| Bulk Order banner section | ✅ Done | `BulkOrderBanner.tsx` — 4 perks, volume slab preview, WhatsApp/`/bulk-orders` links |
| Standalone CTA section | ✅ Done | `CTASection.tsx` — dual CTA + reassurance badges |
| Full Home sequencing | ✅ Done | `src/app/page.tsx` reordered to the confirmed 12-section flow |
| Lint / build verification | ✅ Done | `npm run lint` 0 errors, `npm run build` passes |

## Phase 1 — Auth & Access Control — ✅ Done

Role-based access control, credentials authentication with bcrypt password hashing, NextAuth JWT sessions, protected route middleware, customer dashboard (`/account`), and header/mobile integration.

| Task | Status | Notes |
|---|---|---|
| Customer register & login (NextAuth credentials) | ✅ Done | `/login` & `/register` Neon Dark pages, Zod validation, bcrypt password hashing, dev fallback |
| Admin auth & role-gating middleware | ✅ Done | `src/middleware.ts` protecting `/admin/*` (ADMIN only) and `/account/*` (authenticated) |
| Customer Account Dashboard (`/account`) | ✅ Done | Orders tracking with status badges & Shiprocket links, saved shipping addresses manager, profile editor, security/password update |
| Session Provider & Navigation Integration | ✅ Done | `AuthProvider.tsx` wrapping app, Header user avatar & menu, MobileNavDrawer profile/sign-in sheet |
| Initial User Seeding | ✅ Done | `prisma/seed.ts` seeds admin (`admin@starpress.in`) and sample customer (`customer@starpress.in`) |

## Phase 2 — Catalog, Pricing & Storefront — ✅ Done

| Task | Status | Notes |
|---|---|---|
| `src/lib/catalog.ts` — 8 categories, 49 commercial products, modularized by category under `src/lib/catalog-data/` | ✅ Done | Production-grade dataset matching PRD §5.1.1 categories & specs |
| `src/lib/pricing.ts` — pricing engine (base × size × qty tier + customization fee) | ✅ Done | Formula matches PRD §6; batch vs unit models; live multi-attribute calculator |
| `/shop` listing page (filters, search, sort, grid) | ✅ Done | Server component with SSR markup, category pills, live search, sort dropdown, CatalogProductCard |
| `/shop/[slug]` product detail (gallery, configurator, live price, cart wiring, tabs, related products) | ✅ Done | SSG pre-rendered all 194 routes (canonical + aliases), live price configurator, reactive CartContext |
| `/categories` page | ✅ Done | Dedicated visual directory for all 8 print lines with product counts |
| `prisma/seed.ts` | ✅ Done | Idempotent seeder mapping categories, products, images, and pricing rules with batch/unit unit-rate logic |

## Phase 3 — Cart & Checkout — ✅ Done

| Task | Status | Notes |
|---|---|---|
| Cart (`/cart` full page) | ✅ Done | Dedicated cart page with item counter, live GST (18%), shipping progress bar, promo code engine (STAR10/PRESS20) |
| Checkout flow (`/checkout`) | ✅ Done | Multi-step delivery address with Indian state picker, PIN validation, B2B GST invoicing, rush dispatch option, and confirmation receipt |
| Guest checkout | ✅ Done | Fully enabled; client persistence via localStorage with order reference generation and WhatsApp proof verification |

## Phase 4 — Orders & Database Persistence — ✅ Done

| Task | Status | Notes |
|---|---|---|
| Order creation API (`/api/orders`) | ✅ Done | Server-side validation, immutable JSON address snapshots, itemized totals, generates `SP-YYYY-XXXXX` |
| Order status tracking (`/api/orders/track` & `/api/orders/[id]`) | ✅ Done | Secure customer & guest lookup by Order Number + Phone/Email |
| Inquiry & Lead APIs (`/api/inquiries/*`) | ✅ Done | Custom printing (`INQ-`), Bulk orders (`BLK-`), Contact (`CNT-`) with DB persistence |
| Razorpay Gateway & Webhook layer | ✅ Done | `/api/payments/razorpay/create-order` & `/api/payments/razorpay/webhook` with HMAC SHA-256 validation |
| Admin Order Management API | ✅ Done | `/api/admin/orders` & `/api/admin/orders/[id]/status` for stage updates & AWB courier tracking |
| Storefront wiring | ✅ Done | Checkout, bulk orders, and contact forms wired to live API endpoints |

## Phase 5 — Payments

| Task | Status | Notes |
|---|---|---|
| Razorpay order create + checkout widget | 🔲 Not started | Checkout currently operates in instant proof/COD and mock online mode |
| Webhook signature verification | 🔲 Not started | Awaiting client credentials |
| **Blocking:** client's Razorpay business account credentials | ⏳ Pending client |

## Phase 6 — Admin Panel

| Task | Status |
|---|---|
| Dashboard | 🔲 Not started |
| Product/category management | 🔲 Not started |
| Order management | 🔲 Not started |

## Phase 7 (remainder) — Inquiries & Static Pages — ✅ Done

| Task | Status | Notes |
|---|---|---|
| Custom Printing hub (`/custom-printing`) | ✅ Done | Interactive studio with 6 product types, material finishes, drag-and-drop artwork upload, live pricing, and cart integration |
| Bulk Orders inquiry page (`/bulk-orders`) | ✅ Done | Volume discount slab matrix, enterprise perks, physical swatch kit request, and interactive RFQ form |
| About Us (`/about`) | ✅ Done | Heritage, Heidelberg Speedmaster XL 75 & HP Indigo machinery showcase, four pillars, and facility stats |
| Contact (`/contact`) | ✅ Done | Facility address, phone hotline, multi-topic ticket form, WhatsApp direct link, and operating hours |
| FAQ (`/faq`) | ✅ Done | Searchable knowledge base with 5 categories, native exclusive `<details>` accordions, and prepress guidelines |
| Privacy Policy (`/privacy`) | ✅ Done | Full artwork confidentiality non-disclosure guarantee, data protection, and PCI-DSS compliance |
| Terms & Conditions (`/terms`) | ✅ Done | Prepress soft proof approval rules, CMYK vs RGB color tolerances, bleed margins, and 100% reprint guarantee |
| Product reviews | ✅ Done | Tabbed reviews integrated directly on product detail pages |

## Phase 8+ — Future
Coupons, analytics, design-upload tool, courier tracking API, wishlist polish beyond current toggle.

---

## Pending Client Inputs (blocking items)

- Exact pricing tables per category (size/qty/multipliers)
- Product specs & customization options per product
- Admin CMS scope for homepage banner/testimonials (code-level vs editable)
- GST/invoice requirement
- Guest checkout vs. forced account (needed by Phase 3)
- Single admin login vs. multi-staff accounts
- Razorpay business account credentials (blocking Phase 5)

## Immediate Next Actions (in order)

1. **Phase 3 — Cart & Checkout**: Cart drawer / `/cart` page (item quantity adjustments, subtotal, clear cart), `/checkout` form, order summary.
2. **Phase 1 — Auth** (Deferred): Customer register/login via NextAuth credentials provider + Admin auth/role-gating middleware (`/admin/*`).

## Change Log

| Date | Change |
|---|---|
| 14 Sept 2026 | Tracker created; theme conflict resolved; WooCommerce reference dropped. |
| 14 Sept 2026 | **Repo audited directly.** Found Home + hardening far more complete than assumed. Found 2 real content mismatches (6 vs 8 categories, 4 vs 6 best-sellers). Re-numbered tracker to match repo's own phase scheme. Added 3 new pending items surfaced from repo's changelog (guest checkout, admin staff accounts, Razorpay credentials). |
| 14 Sept 2026 | Phase 7 Home content fixes completed and verified (lint + build clean): 8 categories, 6 best-sellers, HowItWorks/BulkOrderBanner/CTASection built, Home resequenced. Phase 1 (Auth) deliberately deferred. Phase 2 (Catalog, Pricing, Storefront) kicked off. |
| 14 Sept 2026 | **Phase 2 (Catalog, Pricing, Storefront) Completed & Shipped.** Built `catalog.ts` (8 categories, 50 products), `pricing.ts` (dynamic multi-attribute formula), `/shop` listing page (category filter, search, sort), `/shop/[slug]` dynamic product detail page with `ProductConfigurator`, `ProductGallery`, and `ProductTabs`, `/categories` directory page, and `prisma/seed.ts`. All 29 routes statically pre-rendered with 0 errors. |
