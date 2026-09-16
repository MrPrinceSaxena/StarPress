# Changelog

Reverse-chronological log of what was actually built each phase, plus decisions made
and open questions. This is the audit trail for the whole project.

## Core Pages Build — Phase 3 (Cart & Checkout) & Phase 7 (Custom Printing, Bulk Orders & Institutional Hubs)
**Date:** 2026-09-15

**Built & Delivered:**
- **Dedicated Cart Page (`src/app/cart/page.tsx`)**:
  - Full-page shopping cart with dynamic item listings, thumbnail previews, and quantity increment/decrement/removal controls.
  - Indian commercial print GST (18%) auto-calculation with B2B input tax credit notice.
  - Interactive free shipping unlock progress bar (threshold at ₹999).
  - Promo code / coupon engine supporting `STAR10` (10% off) and `PRESS20` (20% off on ₹1,500+).
  - Empty cart state with quick catalog recommendations and reassurance badges.
- **Multi-Step Checkout Page (`src/app/checkout/page.tsx`)**:
  - Contact details (Name, Email, WhatsApp phone for delivery proofing).
  - Pan-India shipping address form with 24 Indian states & UTs picker and 6-digit PIN code validation.
  - Optional B2B Tax Invoicing section capturing Legal Entity Name and 15-character GSTIN.
  - Production & dispatch priority selector (Standard Production vs Priority 24h Rush for +₹249).
  - Payment preferences (Instant online payment preview vs Pay After Pre-Press Proof Approval).
  - Order submission creating reference IDs (e.g. `SP-84920`), localStorage client persistence, and celebratory confirmation receipt with direct WhatsApp proofing integration.
- **Custom Printing Studio (`src/app/custom-printing/page.tsx`)**:
  - Bespoke custom printing hub supporting 6 product categories (Apparel, Mugs & Drinkware, Large Format Banners, Packaging Boxes, Die-Cut Stickers, Canvas Art).
  - Interactive dimension and material finish options with live unit-rate and tiered volume calculation.
  - Drag-and-drop artwork dropzone supporting PDF, AI, PSD, CDR, SVG, and PNG with pre-flight checklist (300 DPI, CMYK, 3mm bleed).
  - Pre-press design proofing add-on (+₹299) and direct cart integration (`addItem`).
- **Bulk Orders & Corporate Printing (`src/app/bulk-orders/page.tsx`)**:
  - Corporate volume discount slabs (15% to 45% wholesale).
  - 4 Enterprise Perks (Dedicated Print Director, Free Swatch Kit, Net Terms, Multi-hub split shipping).
  - Interactive Request for Quote (RFQ) form with category picker, volume slabs, GSTIN, and physical sample kit checkbox.
- **About Us Page (`src/app/about/page.tsx`)**:
  - 15-year heritage story, milestone statistics (10M+ prints, 5,000+ corporate clients, 99.8% on-time dispatch).
  - Industrial press fleet breakdown (Heidelberg Speedmaster XL 75, HP Indigo 7K, Scodix 3D UV/Foil, Kongsberg die-cutter).
  - 4 Pillars of quality (FogRA 39 color standard, FSC eco papers, 24h rush capability, human prepress audits).
- **Contact & Support Hub (`src/app/contact/page.tsx`)**:
  - 4 contact channel cards (Facility address in Okhla, New Delhi, phone hotline, support email, operating hours).
  - Multi-topic ticket submission form with automated reference numbers.
  - Direct WhatsApp chat integration and corporate tax compliance info.
- **Interactive Knowledge Base / FAQ (`src/app/faq/page.tsx`)**:
  - Searchable FAQ with instant keyword filtering and 5 topic categories.
  - Accessible native `<details name="starpress-faq">` exclusive accordions.
- **Legal Policies (`src/app/privacy/page.tsx` & `src/app/terms/page.tsx`)**:
  - Privacy policy featuring strict Non-Disclosure Guarantee for client proprietary artwork, secure PCI-DSS payment handling, and data officer contact.
  - Terms of service detailing soft proof approval obligations, CMYK vs RGB color variation tolerance (3ΔE), ±1.5mm mechanical cutting margins, and 100% free reprint guarantee for defects.
- **Verification**: Zero ESLint warnings or errors (`npm run lint`), all 38 routes compiling cleanly in production Next.js build (`npm run build`).

---

## Phase 2 — Catalog, Dynamic Pricing Engine & Storefront Browsing
**Date:** 2026-09-14

**Built & Delivered:**
- **Product Catalog Dataset (`src/lib/catalog.ts`)**:
  - Full data model representing all 8 confirmed categories and ~50 products from PRD §5.1.1 with starting prices, specifications, features, size options, materials, and quantity tiers.
- **Dynamic Pricing Engine (`src/lib/pricing.ts`)**:
  - Implemented PRD §6 dynamic pricing algorithm combining base price, size multiplier, material surcharge, bulk quantity slab discounts, and text customization fees.
- **Shop Catalog Listing (`src/app/shop/page.tsx` & `src/components/shop/`)**:
  - Filter bar (`ShopFilterBar.tsx`) supporting live search, category pill toggles, and sorting (Featured, Price Low/High, Rating).
  - Rich product cards (`CatalogProductCard.tsx`) with category tags, discount banners, wishlist toggle, and quick add-to-cart.
- **Interactive Product Detail Page (`src/app/shop/[slug]/page.tsx`)**:
  - Pre-rendered statically with `generateStaticParams()` across all 29 routes with dynamic OpenGraph SEO metadata.
  - Interactive multi-image gallery (`ProductGallery.tsx`).
  - Real-time product configurator (`ProductConfigurator.tsx`) calculating unit rate, bulk savings, and total price with live reactive `CartContext` updates.
  - Comprehensive specification tabs (`ProductTabs.tsx`) covering paper details, artwork guidelines, and shipping times.
  - Related product recommendations row.
- **Directory Page (`src/app/categories/page.tsx`)**:
  - Dedicated visual directory for all 8 print lines with item counts and quick-browse links.
- **Database Seeder (`prisma/seed.ts`)**:
  - Idempotent Prisma seeder populating categories, products, images, and pricing rules directly from the finalized catalog dataset.
- **Validation**: Strict TypeScript and ESLint passing with 0 errors/warnings; production `next build` static page generation verified for all 29 routes.

---

## Phase 7 (Home) Content Completion & Section Parity
**Date:** 2026-09-14

**Built & Delivered:**
- **Missing PRD §5.1 Sections Added to Storefront**:
  - `HowItWorks.tsx`: 5-step process section (*Choose Product → Upload Design → Confirm Order → Precision Print → Pan-India Delivery*) with numbered pill badges, icon chips, glowing ambient radial lighting, and desktop progress cues.
  - `BulkOrderBanner.tsx`: High-impact corporate & wholesale banner featuring 4 benefit badges, automated volume discount slabs (15%, 28%, up to 40% off), priority press queue indicator, direct quote request link, and WhatsApp action.
  - `CTASection.tsx`: High-converting standalone CTA section (*"Ready to Turn Your Ideas Into High-Impact Prints?"*) featuring dual primary/WhatsApp CTAs and reassurance micro-badges (Fast Turnaround, Commercial 2400 DPI, 100% Quality Checked, Insured Transit).
- **Catalog & Featured Content Corrections**:
  - `CategoryGrid.tsx` + `data.ts`: Updated from 6 placeholder categories to the confirmed 8 categories from PRD §5.1.1 (*Business Printing, Marketing Materials, Outdoor Advertising, Stationery, Wedding & Events, Packaging, Labels & Stickers, Photo & Custom*) in a responsive grid.
  - `BestSellers.tsx` + `data.ts`: Expanded from 4 to the full 6 confirmed client best-sellers (*Premium Business Cards, A4 Flyers, Tri-Fold Brochure, Vinyl Banner, Custom Stickers, Custom Paper Bags*) across a responsive 3-column layout.
- **Storefront Integration**: Assembled all sections in `src/app/page.tsx` adhering strictly to the PRD §5.1 sequence.
- **Validation**: Strict TypeScript and ESLint passing with 0 errors/warnings; production `next build` static page generation verified.

---

## Architecture & Hardening — Enterprise Foundation & Production SEO
**Date:** 2026-09-13

**Built & Hardened:**
- **Developer Tooling & Linting**: Created `.eslintrc.json` extending `next/core-web-vitals` with proper browser/node environments; hardened `tsconfig.json` with strict casing and type checks. Clean `npm run lint` passing with 0 warnings/errors.
- **Security & Headers**: Configured HTTP security headers in `next.config.js` (`X-DNS-Prefetch-Control`, `X-XSS-Protection`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) and disabled `poweredByHeader`.
- **Global Reactive State (Cart & Wishlist)**:
  - Created typed `CartContext` (`src/context/CartContext.tsx`) with quantity adjustments, item removal, subtotal calculation, and SSR-safe `localStorage` persistence.
  - Created typed `WishlistContext` (`src/context/WishlistContext.tsx`) with toggle operations and persistent storage.
  - Integrated `AppProviders` into root `layout.tsx`, connecting `Header.tsx`'s live cart count badge and `ProductCard.tsx`'s interactive wishlist and cart actions.
- **Resilience & Error Boundaries**:
  - Branded 404 page (`src/app/not-found.tsx`) with Star Press neon styling and recovery paths.
  - Client runtime error boundary (`src/app/error.tsx`) with incident logging and retry capabilities.
  - Route suspense skeleton (`src/app/loading.tsx`).
- **Production SEO & Structured Data**:
  - Schema.org JSON-LD graph (`src/components/seo/JsonLd.tsx`) covering `WebSite`, `Organization`, and `LocalBusiness` for Google rich snippet indexing.
  - Dynamic `robots.txt` generator (`src/app/robots.ts`).
  - Dynamic `sitemap.xml` generator (`src/app/sitemap.ts`).
  - Enhanced OpenGraph, Twitter card, viewport, and canonical metadata in `src/app/layout.tsx`.
- **Environment Schema Validation**: Type-safe Zod schema validation in `src/lib/env.ts`.

---

## Phase 7 (Landing Page) — Pixel-Accurate Star Press Homepage
**Date:** 2026-09-13

**Built:**
- Full pixel-accurate e-commerce landing page adhering to Master Prompt specs and design reference:
  - Exact 10 sections implemented in prescribed order:
    1. `Header.tsx` (sticky, star logo, nav with dropdown chevron, search popover, cart with badge, "Get a Quote" yellow button, mobile drawer)
    2. `Hero.tsx` (pill badge, multi-color headline "PRINT YOUR IDEAS TO LIFE", subcopy, CTA buttons, and high-fidelity layered product composition)
    3. `TrustBadges.tsx` (4 items: Premium Quality, Fast Delivery, Secure Payments, Design Support with magenta outline badges)
    4. `CategoryGrid.tsx` (6 saturated category tiles: Business Cards, Flyers & Leaflets, Brochures, Banners, Stickers, Custom Gifts + View All link)
    5. `BestSellers.tsx` (4 product cards with wishlist heart toggle, prices in brand-yellow, star ratings, and Add to Cart action)
    6. `PromoBanner.tsx` (rounded-28px banner with gradient text "CUSTOM PRINTING FOR A BOLDER TOMORROW", subcopy, CTA, and product collage)
    7. `WhyChooseUs.tsx` (4 benefit items with filled circular icon badges)
    8. `Testimonials.tsx` (3 customer cards: Rohit Mehta, Sneha Iyer, Aman Verma with 5-star ratings and avatars)
    9. `Newsletter.tsx` (controlled email input + "Subscribe" CTA + hand-drawn curved arrow SVG pointing to rotated script doodle "GOOD IDEAS PRINT WELL")
    10. `Footer.tsx` (brand info, social icons, 3 link columns: Shop, Company, Help, and copyright/legal links)
- Modular component structure in `src/components/layout/`, `src/components/sections/`, `src/components/ui/`.
- Centralized typed static content in `src/lib/data.ts`.
- Tailwind design tokens for dark theme, neon accents, fonts (`Poppins`, `Inter`, `Permanent_Marker`), and responsive layouts.
- Asset pipeline in `public/images/` with optimized product and mockup photography.

---

## Phase 0 — Project Scaffold, Docs & DB Schema Draft
**Date:** 2026-09-13

**Built:**
- Repo folder structure (`src/app`, `src/components`, `src/lib`, `src/server`, `prisma`, `docs`)
- Documentation skeleton: this file plus `00` through `06`
- Draft Prisma schema covering Users/Auth, Catalog, Cart/Orders, Reviews, and lead
  forms (Bulk Order & Contact inquiries) — see `docs/02-DATABASE-SCHEMA.md`
- `package.json`, base configs (`tsconfig`, `next.config`, `tailwind.config`,
  `postcss.config`), `.env.example`, `.gitignore`
- Minimal running Next.js shell (root layout + placeholder home page) so the repo
  boots before any real feature is built

**Decisions made:**
- Stack confirmed: Next.js + TypeScript + Tailwind + Prisma/PostgreSQL + NextAuth +
  Razorpay + Vercel — see `docs/01-ARCHITECTURE.md` for reasoning
- Business logic will live in `src/server/`, separate from route handlers, to keep a
  future decoupling option open
- `PricingRule` model is a deliberate placeholder — real size/quantity/text pricing
  logic is designed in Phase 2, not now

**Open questions / deferred:**
- Guest checkout vs. forced account creation — decide in Phase 3
- Whether admin panel needs multiple staff accounts or just one owner login — revisit
  if the client asks for it
- Exact Razorpay account setup (client needs to provide their own Razorpay
  business account credentials before Phase 5)

**Not yet built:** everything under "🔲 Planned" in `docs/04-PAGES-AND-FEATURES.md`

---
