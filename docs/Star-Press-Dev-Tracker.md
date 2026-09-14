# Star Press — Development Tracker

**Purpose:** Single source of truth for build progress, kept in sync with the PRD/TRD/UI-UX docs and the repo's own `docs/04-PAGES-AND-FEATURES.md` + `docs/05-CHANGELOG.md`.

**Phase numbers below match the repo's own numbering** (not a separate scheme) so the codebase's changelog and this tracker never drift apart.

**Rule:** A task only moves to ✅ Done after it (a) works end-to-end, (b) matches the UI/UX doc's Neon Dark tokens, and (c) has no known content/data mismatches. Audited on 14 Sept 2026 directly against `github.com/MrPrinceSaxena/StarPress`.

---

## Phase 0 — Scaffold ✅ Done
Repo structure, base configs, `.env.example`, draft Prisma schema, minimal booting shell.

## Phase 7 (Home) + Hardening — ✅ Built, 🔧 needs content fixes

| Task | Status | Notes |
|---|---|---|
| 10-section Home page (Header, Hero, TrustBadges, CategoryGrid, BestSellers, PromoBanner, WhyChooseUs, Testimonials, Newsletter, Footer) | ✅ Done | Pixel-accurate per changelog |
| ESLint/TSConfig hardening, security headers, SEO (JSON-LD, sitemap, robots.txt), CartContext/WishlistContext, error/404/loading pages, env validation | ✅ Done | Solid — no action needed |
| **`CategoryGrid.tsx` shows only 6 placeholder categories** | 🔧 **Fix needed** | Confirmed catalog has 8 categories (Business Printing, Marketing Materials, Outdoor Advertising, Stationery, Wedding & Events, Packaging, Labels & Stickers, Photo & Custom Printing) — component needs updating to the real 8 |
| **`BestSellers.tsx` shows only 4 products** | 🔧 **Fix needed** | Client's featured list has 6: Premium Business Cards, A4 Flyers, Tri-Fold Brochure, Vinyl Banner, Custom Stickers, Custom Paper Bags |
| How It Works section | 🔲 Missing | 5-step: Choose Product → Upload Design → Confirm Order → We Print → Delivery |
| Bulk Order banner section | 🔲 Missing | Separate from PromoBanner (Custom Printing) |
| Standalone CTA section | 🔲 Missing | "Ready to Print Your Ideas?" + Get Started / WhatsApp Us |

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

1. Fix `CategoryGrid.tsx` → real 8 categories
2. Fix `BestSellers.tsx` → real 6 featured products
3. Build missing Home sections: How It Works, Bulk Order banner, CTA section
4. Start Phase 1 — customer + admin auth

## Change Log

| Date | Change |
|---|---|
| 14 Sept 2026 | Tracker created; theme conflict resolved; WooCommerce reference dropped. |
| 14 Sept 2026 | **Repo audited directly.** Found Home + hardening far more complete than assumed. Found 2 real content mismatches (6 vs 8 categories, 4 vs 6 best-sellers). Re-numbered tracker to match repo's own phase scheme. Added 3 new pending items surfaced from repo's changelog (guest checkout, admin staff accounts, Razorpay credentials). |
