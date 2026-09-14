# Star Press — Development Tracker

**Purpose:** Single source of truth for build progress, kept in sync with the PRD/TRD/UI-UX docs and the repo's own `docs/04-PAGES-AND-FEATURES.md` + `docs/05-CHANGELOG.md`.

**Phase numbers below match the repo's own numbering** (not a separate scheme) so the codebase's changelog and this tracker never drift apart.

**Rule:** A task only moves to ✅ Done after it (a) works end-to-end, (b) matches the UI/UX doc's Neon Dark tokens, and (c) has no known content/data mismatches. Audited on 14 Sept 2026 directly against `github.com/MrPrinceSaxena/StarPress`.

---

## Phase 0 — Scaffold ✅ Done
Repo structure, base configs, `.env.example`, draft Prisma schema, minimal booting shell.

## Phase 7 (Home) + Hardening — ✅ Done (All Content Fixes & Sections Complete)

| Task | Status | Notes |
|---|---|---|
| Complete Home page flow (Header, Hero, TrustBadges, CategoryGrid, BestSellers, WhyChooseUs, HowItWorks, BulkOrderBanner, PromoBanner, Testimonials, CTASection, Newsletter, Footer) | ✅ Done | Exact PRD §5.1 sequence & Neon Dark tokens |
| ESLint/TSConfig hardening, security headers, SEO (JSON-LD, sitemap, robots.txt), CartContext/WishlistContext, error/404/loading pages, env validation | ✅ Done | Solid — production ready |
| **`CategoryGrid.tsx` 8 categories** | ✅ Done | Updated to confirmed 8 categories in PRD §5.1.1 (Business Printing, Marketing Materials, Outdoor Advertising, Stationery, Wedding & Events, Packaging, Labels & Stickers, Photo & Custom) |
| **`BestSellers.tsx` 6 featured products** | ✅ Done | Updated to confirmed 6 best-sellers in 3-column responsive grid |
| How It Works section (`HowItWorks.tsx`) | ✅ Done | 5-step interactive track: Choose Product → Upload Design → Confirm Order → We Print → Delivery |
| Bulk Order banner section (`BulkOrderBanner.tsx`) | ✅ Done | Lead gen CTA with 4 perks, volume discount slabs (15%, 28%, 40%), quote & WhatsApp actions |
| Standalone CTA section (`CTASection.tsx`) | ✅ Done | High-impact "Ready to Turn Your Ideas Into High-Impact Prints?" with dual shop/WhatsApp CTAs |

## Phase 1 — Auth (NEXT UP)

| Task | Status |
|---|---|
| Customer register/login (NextAuth credentials) | 🔲 Not started |
| Admin auth / role gating (`/admin/*` middleware) | 🔲 Not started |

## Phase 2 — Catalog & Pricing

| Task | Status | Notes |
|---|---|---|
| Seed 8 categories, ~50 products (placeholder base prices) | 🔲 Not started | Blocked on nothing — can seed with placeholders now |
| Pricing-rule engine v1 (size × qty × text-length) | 🔲 Not started | Blocked on client's pricing sheet — build with placeholder formula meanwhile |
| Shop / Category listing page | 🔲 Not started | |
| Product detail page + live price calc | 🔲 Not started | |

## Phase 3 — Cart & Checkout

| Task | Status |
|---|---|
| Cart (full — beyond current Context scaffold) | 🟡 Partially scaffolded (CartContext exists) |
| Checkout flow (address → summary) | 🔲 Not started |
| Guest checkout decision | ⏳ Pending decision |

## Phase 4 — Orders

| Task | Status |
|---|---|
| Order creation from checkout | 🔲 Not started |
| Order status tracking (customer + admin view) | 🔲 Not started |

## Phase 5 — Payments

| Task | Status |
|---|---|
| Razorpay order create + checkout widget | 🔲 Not started |
| Webhook signature verification | 🔲 Not started |
| **Blocking:** client's Razorpay business account credentials | ⏳ Pending client |

## Phase 6 — Admin Panel

| Task | Status |
|---|---|
| Dashboard | 🔲 Not started |
| Product/category management | 🔲 Not started |
| Order management | 🔲 Not started |

## Phase 7 (remainder) — Inquiries & Static Pages

| Task | Status |
|---|---|
| Custom Printing inquiry form | 🔲 Not started |
| Bulk Orders inquiry form | 🔲 Not started |
| About, Contact, FAQ, Track Order, My Account, Privacy Policy, Terms & Conditions | 🔲 Not started |
| Product reviews | 🔲 Not started |

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

1. **Phase 1 — Auth**: Customer register/login via NextAuth credentials provider + Admin auth/role-gating middleware (`/admin/*`).
2. **Phase 2 — Catalog & Pricing**: Seed 8 categories & ~50 products in Prisma, implement pricing-rule engine, build `/shop` and `/products/[slug]`.

## Change Log

| Date | Change |
|---|---|
| 14 Sept 2026 | Tracker created; theme conflict resolved; WooCommerce reference dropped. |
| 14 Sept 2026 | **Repo audited directly.** Found Home + hardening far more complete than assumed. Found 2 real content mismatches (6 vs 8 categories, 4 vs 6 best-sellers). Re-numbered tracker to match repo's own phase scheme. Added 3 new pending items surfaced from repo's changelog (guest checkout, admin staff accounts, Razorpay credentials). |
| 14 Sept 2026 | **Phase 7 Content Fixes & Missing Sections Shipped.** Built `HowItWorks.tsx` (5-step connected track), `BulkOrderBanner.tsx` (corporate lead-gen banner with volume discount slabs), and `CTASection.tsx` (high-impact standalone CTA). Updated `CategoryGrid.tsx` to all confirmed 8 categories from PRD §5.1.1 and `BestSellers.tsx` to all 6 featured products in a responsive 3-column layout. Clean build & linting verified. |
