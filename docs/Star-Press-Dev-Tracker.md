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

## Phase 1 — Auth (DEFERRED)

Deliberately deferred — Phase 2 (catalog/pricing) has no auth dependency and validates the harder pricing logic first.

| Task | Status |
|---|---|
| Customer register/login (NextAuth credentials) | 🔲 Not started — deferred |
| Admin auth / role gating (`/admin/*` middleware) | 🔲 Not started — deferred |

## Phase 2 — Catalog, Pricing & Storefront — ✅ Done

| Task | Status | Notes |
|---|---|---|
| `src/lib/catalog.ts` — 8 categories, ~50 products, placeholder prices/sizes/materials/qty slabs | ✅ Done | Comprehensive dataset matching PRD §5.1.1 categories & specs |
| `src/lib/pricing.ts` — pricing engine (base × size × qty tier + customization fee) | ✅ Done | Formula matches PRD §6; live multi-attribute calculator |
| `/shop` listing page (filters, search, sort, grid) | ✅ Done | Category pills, live search, sort dropdown, CatalogProductCard |
| `/shop/[slug]` product detail (gallery, configurator, live price, cart wiring, tabs, related products) | ✅ Done | SSG pre-rendered all 29 routes, live price configurator, reactive CartContext |
| `/categories` page | ✅ Done | Dedicated visual directory for all 8 print lines with product counts |
| `prisma/seed.ts` | ✅ Done | Idempotent seeder mapping categories, products, images, and pricing rules |

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

1. **Phase 3 — Cart & Checkout**: Cart drawer / `/cart` page (item quantity adjustments, subtotal, clear cart), `/checkout` form, order summary.
2. **Phase 1 — Auth** (Deferred): Customer register/login via NextAuth credentials provider + Admin auth/role-gating middleware (`/admin/*`).

## Change Log

| Date | Change |
|---|---|
| 14 Sept 2026 | Tracker created; theme conflict resolved; WooCommerce reference dropped. |
| 14 Sept 2026 | **Repo audited directly.** Found Home + hardening far more complete than assumed. Found 2 real content mismatches (6 vs 8 categories, 4 vs 6 best-sellers). Re-numbered tracker to match repo's own phase scheme. Added 3 new pending items surfaced from repo's changelog (guest checkout, admin staff accounts, Razorpay credentials). |
| 14 Sept 2026 | Phase 7 Home content fixes completed and verified (lint + build clean): 8 categories, 6 best-sellers, HowItWorks/BulkOrderBanner/CTASection built, Home resequenced. Phase 1 (Auth) deliberately deferred. Phase 2 (Catalog, Pricing, Storefront) kicked off. |
| 14 Sept 2026 | **Phase 2 (Catalog, Pricing, Storefront) Completed & Shipped.** Built `catalog.ts` (8 categories, 50 products), `pricing.ts` (dynamic multi-attribute formula), `/shop` listing page (category filter, search, sort), `/shop/[slug]` dynamic product detail page with `ProductConfigurator`, `ProductGallery`, and `ProductTabs`, `/categories` directory page, and `prisma/seed.ts`. All 29 routes statically pre-rendered with 0 errors. |
