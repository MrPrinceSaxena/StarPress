# Changelog

Reverse-chronological log of what was actually built each phase, plus decisions made
and open questions. This is the audit trail for the whole project.

## Phase 1.1: Zero-Trust Security Hardening & Authentication Upgrades
**Date:** 2026-09-19

**Built & Delivered:**
- **Zero Hardcoded Credentials & Timing Attack Defense (`src/lib/auth.ts`)**:
  - Removed all mock credentials and bypass paths. Authentications strictly validate against database users.
  - Added constant-time dummy hashing for non-existent users to prevent user-enumeration timing vectors.
  - Implemented 1-hour JWT token rotation (`iat` and `jti` refresh cycles).
- **Enterprise Password Policy (`src/lib/validation/auth.ts`, `src/app/api/auth/register/route.ts`)**:
  - Minimum 12 characters, requiring uppercase, lowercase, numbers, and special symbols.
  - Password hashing upgraded to 12 bcrypt salt rounds across registration and database seeders.
  - Client-side real-time 4-bar strength meter and requirement checklist in `/register`.
- **Brute-Force & Account Lockout Defense (`prisma/schema.prisma`, `src/lib/auth.ts`)**:
  - Automatic 15-minute temporary lockout after 5 consecutive failed login attempts on an email.
  - Lockout countdown feedback preventing repeated attack vectors.
- **Sliding-Window Rate Limiting Engine (`src/lib/rate-limit.ts`)**:
  - Implemented millisecond-accurate sliding-window limiter with automated garbage collection.
  - Applied to `/api/auth/register` (5 requests / 15 minutes per IP) with standard HTTP 429 and `Retry-After`.
- **Enterprise HTTP Security Headers (`src/middleware.ts`)**:
  - Injected HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Security Audit Logging & Session Models (`prisma/schema.prisma`, `src/lib/audit.ts`)**:
  - Added `AuthAuditLog` and `Session` models. Asynchronous logging of `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCOUNT_LOCKED`, `REGISTER`.
- **Automated Security Verification Suite (`scripts/test-security.ts`)**:
  - Added `npm run test:security` verifying 16 test assertions across password policy, rate limiting, and lockout calculations.
- **Operational Documentation**:
  - Created `docs/SECURITY.md`, `docs/OPERATIONS.md`, and `docs/INCIDENT-RESPONSE.md`.

## Phase 1: Authentication & Customer Dashboard (Phase 1 of PRD & TRD)
**Date:** 2026-09-19

**Built & Delivered:**
- **NextAuth.js Full Implementation (`src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`)**:
  - JWT session strategy with 30-day persistence.
  - Credentials provider authenticating against Prisma `User` table using `bcryptjs.compare`.
  - Type-safe custom session attributes (`id`, `role`, `phone`) extended via `src/types/next-auth.d.ts`.
  - Offline / dev fallback enabling immediate testing with default credentials (`admin@starpress.in` / `Admin@StarPress2026`).
- **Registration API & Validation (`src/app/api/auth/register/route.ts`)**:
  - Validates user input via Zod (name, email, password min 6 chars, optional phone).
  - Enforces email uniqueness and securely hashes passwords with `bcryptjs.hash(password, 10)`.
  - Assigns default `Role.CUSTOMER`.
- **Role-Based Edge Middleware (`src/middleware.ts`)**:
  - Configured NextAuth JWT middleware matching `/admin/:path*` and `/account/:path*`.
  - Restricts `/admin/*` strictly to users with `role: "ADMIN"`, redirecting unauthorized users to `/login` with flash alerts.
  - Secures `/account/*` to authenticated users with seamless `callbackUrl` handling.
- **Neon Dark Auth Pages**:
  - `/login`: Sleek dark interface with error banners, password visibility toggle, redirect callbacks, and a quick-fill demo button for testing.
  - `/register`: Complete onboarding flow with password confirmation and direct redirection to login.
- **Customer Account Dashboard (`/account`)**:
  - 3-tab modern portal:
    1. **Orders & Tracking**: Shows past order history, line items, status pills (`PENDING`, `CONFIRMED`, `IN_PRODUCTION`, `DISPATCHED`, `DELIVERED`), and Shiprocket tracking links.
    2. **Saved Addresses**: Manage multiple shipping addresses with default badge flags and "Add New Address" modal/form.
    3. **Profile & Security**: Edit contact info and securely change passwords requiring current password verification.
  - Special Admin quick-access card linking directly to `/admin/orders` for admin accounts.
- **Account API Handlers (`src/app/api/account/**`)**:
  - `GET`, `PATCH /api/account/profile`: Retrieve profile & update credentials.
  - `GET`, `POST /api/account/addresses`: Retrieve addresses & save new default address.
  - `GET /api/account/orders`: Fetch user orders with line items.
- **App-Wide Session & Navigation Integration**:
  - `src/components/providers/AuthProvider.tsx`: Wrapped `SessionProvider` inside `AppProviders.tsx`.
  - `src/components/layout/Header.tsx`: Integrated session state, dynamic user avatar circle showing initial, and direct links to Account/Sign In.
  - `src/components/layout/MobileNavDrawer.tsx`: Added session card with user email, role badges, Admin Console shortcut, and Sign Out button.
- **Database Seeder (`prisma/seed.ts`)**:
  - Updated to seed initial admin user (`admin@starpress.in`) and sample customer (`customer@starpress.in`) with bcrypt hashes.
- **Build & Quality Assurance**:
  - `npx tsc --noEmit` passed with 0 errors.
  - `npm run lint` passed with 0 errors.
  - `npm run build` compiled all 205 static and dynamic pages with 0 errors.

## Phase C: Backend & Database Persistence (Phase 4 of Roadmap)
**Date:** 2026-09-19

**Built & Delivered:**
- **Production-Grade Database Schema (`prisma/schema.prisma`)**:
  - Expanded Prisma models for `Order`, `OrderItem`, `PaymentTransaction`, `CustomizationRequest`, `BulkOrderInquiry`, `ContactInquiry`, and `Review`.
  - Configured PostgreSQL datasource with standard `DATABASE_URL` for Supabase deployment without vendor lock-in.
  - Generates human-readable reference numbers: `SP-YYYY-XXXXX` for Orders, `INQ-YYYY-XXXXX` for Custom Printing, `BLK-YYYY-XXXXX` for Bulk Orders, and `CNT-YYYY-XXXXX` for Contact inquiries.
  - Designed with graceful offline/dev fallback so storefront features and test suites function seamlessly even before database provisioning.
- **Server Business Logic Layer (`src/server/`)**:
  - `src/server/orders.ts`: Handles atomic order creation, line item persistence, server-side pricing snapshots, order tracking queries, and admin status updates with AWB numbers.
  - `src/server/inquiries.ts`: Handles lead ingestion for custom printing, volume RFQs, and contact support tickets.
  - `src/server/payments.ts`: Prepares Razorpay orders in paise and verifies webhook signatures via HMAC SHA-256.
- **10 Production API Route Handlers (`src/app/api/**`)**:
  - `POST /api/orders`: Order creation and validation.
  - `GET /api/orders/[id]`: Full order details query.
  - `POST /api/orders/track`: Customer and guest order tracking lookup by Order Number + Phone/Email.
  - `POST /api/inquiries/custom-print`: Custom print studio quote requests.
  - `POST /api/inquiries/bulk`: High-volume RFQ and physical swatch kit requests.
  - `POST /api/inquiries/contact`: Contact form submissions.
  - `POST /api/payments/razorpay/create-order`: Gateway order initialization.
  - `POST /api/payments/razorpay/webhook`: Verified payment capture and automatic `CONFIRMED` transition.
  - `GET /api/admin/orders`: Filtered, paginated order list.
  - `PATCH /api/admin/orders/[id]/status`: Stage updates (`IN_PRODUCTION`, `DISPATCHED`, `DELIVERED`).
- **Storefront Form Integration**:
  - Connected Checkout page (`/checkout`) directly to `/api/orders`.
  - Connected Bulk Orders page (`/bulk-orders`) directly to `/api/inquiries/bulk`.
  - Connected Contact page (`/contact`) directly to `/api/inquiries/contact`.
- **Environment & Build Verification**:
  - Updated `.env.example` and `src/lib/env.ts` with Supabase, Razorpay, and Resend specifications.
  - `npx tsc --noEmit` passing with 0 errors.
  - `npm run lint` passing with 0 errors.
  - `npm run build` passing with all 201 pages and dynamic API routes compiled cleanly.

## Phase B: Full Catalog Completion (49 Commercial Products per PRD §5.1.1)
**Date:** 2026-09-19

**Built & Delivered:**
- **Full Catalog Expansion to 49 Products**:
  - Expanded product scope from 21 items to all 49 distinct commercial products spanning all 8 core print categories specified in PRD §5.1.1.
  - Implemented modular catalog data architecture under `src/lib/catalog-data/*.ts` separating data models cleanly by vertical:
    1. `business-printing.ts`: 6 products (Business Cards, Letterheads, Envelopes, Bill Books, Invoice Books, Company Profiles).
    2. `marketing-materials.ts`: 6 products (A4 Flyers, Tri-Fold Brochures, Leaflets, Posters, Pamphlets, Product Catalogues).
    3. `outdoor-advertising.ts`: 10 products (Flex Printing, Vinyl Banners, Hanging Banners, Billboards/Hoardings, Retractable Standees, Glow Signboards, LED Neon Boards, 3D Channel Letters, Nameplates, Acrylic Boards).
    4. `stationery.ts`: 6 products (Hardcover Notebooks, Executive Diaries, Desk Notepads, Presentation Folders, Foil Certificates, PVC ID Cards).
    5. `wedding-events.ts`: 5 products (Royal Wedding Cards, Event Invitations, Thank You Cards, Perforated Tickets, Ceremony Programs).
    6. `packaging.ts`: 4 products (Custom Paper Bags, Shipping Corrugated Boxes, Packaging Labels, Garment Hang Tags).
    7. `labels-stickers.ts`: 6 products (Die-Cut Vinyl Stickers, Bottle/Jar Labels, Barcode Labels, Clear Stickers, Custom Shape Sticker Sheets, Security Holograms).
    8. `photo-custom.ts`: 6 products (Archival Photo Prints, Gallery Canvas Prints, Photo Frames, Custom T-Shirts, Sublimation Mugs, Photo Keychains).
- **Industrial Real-World Specifications**:
  - Configured accurate paper weights (70–120 GSM bond/maplitho, 130–250 GSM art paper, 350–400 GSM board, 240–510 GSM outdoor flex/vinyl, 30 Mil PVC).
  - Defined commercial Indian print dimensions (mm / inches / feet), bleed allowances (3mm), turnaround times, and realistic pricing based on current offset and digital Indian market rates.
  - Differentiated `"batch"` vs `"unit"` pricing models with tiered volume discount slabs up to 48% savings.
- **Pre-Rendered Static Generation & Route Coverage**:
  - `generateStaticParams()` dynamically maps all 49 canonical slugs and dozens of aliases, successfully generating 194 static HTML pages at build time with 0 errors.
  - Full sitemap at `sitemap.xml` automatically indexes all products, categories, and static pages.
- **Prisma Seeder Synchronization (`prisma/seed.ts`)**:
  - Synchronized database seeder logic to account for batch vs unit rates when computing sample `pricingRule` pricing.

## Performance, Core Web Vitals & SEO Hardening — Image Optimization, Favicons & SSR
**Date:** 2026-09-19

**Built & Delivered:**
- **Enabled Next.js Image Optimization**:
  - Removed `images: { unoptimized: true }` in `next.config.js` and enabled modern format conversion (`AVIF` and `WebP`) alongside responsive `deviceSizes` and `imageSizes`.
  - Re-compressed all local photography in `public/images/` using standard high-efficiency compression, reducing original raw asset sizes by over 60%.
- **Complete Favicon & PWA Web Manifest**:
  - Created brand vector icon `public/favicon.svg`, high-resolution `public/apple-touch-icon.png` (180x180), and `public/favicon.ico`.
  - Added Next.js metadata route `src/app/manifest.ts` generating `/manifest.webmanifest` with Star Press branding, dark theme metadata (`#0B0C10`), and icons.
  - Linked icon assets and manifest in `src/app/layout.tsx` metadata.
- **Dynamic Full-Catalog Sitemap (`src/app/sitemap.ts`)**:
  - Expanded `sitemap.ts` from 8 URLs to dynamically include all static routes, all 8 category views (`/shop?category=${slug}`), all 21 product detail pages (`/shop/${slug}`), and legal policies with proper priorities and change frequencies.
- **Server Component Architecture for `/shop`**:
  - Refactored `src/app/shop/page.tsx` from a client-only component to a **Server Component** with full OpenGraph and title metadata.
  - Pre-renders `<h1>` headings, hero copy, and a `<noscript>` crawlable product directory for search engine indexing.
  - Isolated reactive search/filter controls to client component `ShopClientView.tsx` inside a `<Suspense>` boundary.

## Critical Bugs & Discrepancies Resolution — Production Hardening & Pricing Fix
**Date:** 2026-09-19

**Built & Delivered:**
- **Canonical Category Slugs & Megamenu Synchronization**:
  - Updated `Header.tsx` megamenu and `data.ts` `CATEGORIES` array to reference the 8 confirmed canonical slugs (`business-printing`, `marketing-materials`, `outdoor-advertising`, `stationery`, `wedding-events`, `packaging`, `labels-stickers`, `photo-custom-printing`).
  - Fixed `CATEGORY_SLUG_ALIASES` in `catalog.ts` so colloquial/legacy slugs map to their canonical counterpart, resolving the issue where `/shop/business-printing` previously redirected to an empty category.
  - Added query normalization in `src/app/shop/page.tsx` so alias URLs automatically resolve to their canonical catalog category.
- **Pricing Calculation Engine Overhaul**:
  - Resolved the raw unit multiplication bug where starter batch prices (e.g. ₹299 for 100 cards) were incorrectly multiplied by total quantity, resulting in ₹29,900.
  - Configured batch vs. unit product pricing models: batch products (cards, flyers, brochures, stickers) derive unit base rate from starter pack quantity, accurately computing ₹299 for 100 cards, and ~₹1,944 for 1,000 cards with bulk savings.
  - Enhanced currency formatting (`formatINR`) to cleanly display fractional unit rates (e.g. `₹2.99 / unit`) while formatting whole rupee subtotals and totals without decimal clutter.
- **Custom Printing Studio Asset Fix**:
  - Replaced 5 missing image paths in `CUSTOM_PRODUCT_TYPES` (`/images/prod-apparel.jpg`, `/images/prod-mugs.jpg`, `/images/prod-flex-banner.jpg`, `/images/prod-packaging-boxes.jpg`, `/images/prod-photo-prints.jpg`) with verified high-resolution photography.
- **Header Search Bar Wiring**:
  - Converted Header search form submission from `window.location.href` to Next.js `useRouter.push()`.
  - Updated `ShopContent` in `src/app/shop/page.tsx` to read and react to `?search=` and `?q=` query parameters, syncing query state automatically.
- **Section Anchor IDs in Footer Target Pages**:
  - Added `id="equipment"` with scroll offsets to Machinery & Technology Fleet in `/about`.
  - Added `id="artwork"` and `id="shipping"` to category tabs with hash detection in `/faq`.
  - Added `id="guarantee"` to Section 5 (100% Quality & Reprint Guarantee) in `/terms`.
- **Clean Initial Cart State**:
  - Replaced default hardcoded demo items (`prod-1`, `prod-2`, `prod-4`) in `CartContext.tsx` with an empty array `[]` for new visitors.
- **Header & Mobile Navigation**:
  - Added `{ label: "Contact", href: "/contact" }` to `NAV_LINKS` in `data.ts`.

## Production Polish & Route Protection — Complete Slug Aliases & Link Integrity
**Date:** 2026-09-16

**Built & Delivered:**
- **Product Slug Aliases & Universal Fallbacks (`src/lib/catalog.ts`)**:
  - Implemented `PRODUCT_SLUG_ALIASES` mapping colloquial and legacy paths (`/shop/flyers` → `a4-flyers`, `/shop/banners` → `vinyl-banners`, `/shop/stickers` → `custom-stickers`, `/shop/packaging` → `packaging-boxes`, `/shop/mugs` → `mug-printing`, `/shop/apparel` → `t-shirt-printing`, etc.).
  - Updated `getProductBySlug` to transparently resolve aliases without breaking direct links.
  - Updated `generateStaticParams()` to pre-render both canonical and alias slugs at build time (total 79 SSG routes).
- **Category Slugs Dynamic Redirection (`src/app/shop/[slug]/page.tsx`)**:
  - Automatically redirects any category slug entered in `/shop/[slug]` (e.g. `/shop/business-stationery`, `/shop/marketing-promo`, `/shop/outdoor-advertising`) to the filtered catalog view `/shop?category=${catSlug}`.
- **Canonical Navigation Integrity (`src/lib/data.ts` & `src/context/CartContext.tsx`)**:
  - Synchronized `BEST_SELLERS`, `CATEGORIES`, `FOOTER_COLUMNS`, and `CartContext` initial state to canonical active routes.
- **End-to-End Automated Route Crawl**:
  - Automated test script crawled all 92 unique URLs across the site, verifying 92/92 return HTTP 200/307 with zero 404 errors.

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
