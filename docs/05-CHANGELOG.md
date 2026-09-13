# Changelog

Reverse-chronological log of what was actually built each phase, plus decisions made
and open questions. This is the audit trail for the whole project.

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
