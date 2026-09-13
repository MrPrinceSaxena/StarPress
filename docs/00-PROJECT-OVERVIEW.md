# Star Press — Project Overview

## What this is
An e-commerce website for **Star Press** (also referred to as "Star Printing Press"), a
local printing business. Customers browse printing products (business cards, banners,
stickers, packaging, etc.), request customization (upload their own designs / specify
size, quantity, text), place orders, and pay online. The client (store owner) manages
products, pricing and orders through an admin panel.

This is being built for **local-area scale today**, with the architecture chosen so it
can scale up later (more products, more traffic, more locations) without a rewrite.

## Brand
| Item | Value |
|---|---|
| Brand name | Star Press |
| Tagline | "Turning Ideas Into Print" |
| Primary color | Navy Blue / Dark Blue |
| Accent color | Yellow / Gold |
| Background | White |
| Text color | Black / Dark Gray |
| Style | Modern, professional, clean, e-commerce focused |

## Product catalog (from client brief)
8 main categories, ~48 products total:

1. **Business Printing** — Business Cards, Letterheads, Envelopes, Bill Books, Invoice Books, Company Profiles
2. **Marketing Materials** — Flyers, Brochures, Leaflets, Posters, Pamphlets, Catalogues
3. **Outdoor Advertising** — Flex Printing, Vinyl Printing, Banners, Hoardings, Standees, Glow Sign Boards, Neon Boards, 3D Letter Board, Name Plate, Acrylic Board
4. **Stationery** — Notebooks, Diaries, Notepads, Files & Folders, Certificates, ID Cards
5. **Wedding & Events** — Wedding Cards, Invitation Cards, Thank You Cards, Event Tickets, Ceremony Programs
6. **Packaging** — Paper Bags, Product Boxes, Packaging Labels, Tags
7. **Labels & Stickers** — Product Labels, Bottle Labels, Barcode Labels, Logo Stickers, Transparent Stickers, Custom Shape Stickers
8. **Photo & Custom Printing** — Photo Prints, Canvas Prints, Photo Frames, T-Shirt Printing, Mug Printing, Keychain Printing

Full list with descriptions lives in `docs/02-DATABASE-SCHEMA.md` (seeded as data, not
hardcoded in code) — see `prisma/seed.ts` once we build it in Phase 2.

## Key business rule
**Pricing varies by size, quantity, and (for some products) length of text** — this is
not a flat per-product price. This drives the data model for `Product` /
`PricingRule` — see Database Schema doc. We design this properly in Phase 2; the
Phase 0 schema has a placeholder shape for it.

## Site pages (priority from client brief)
| Page | Priority |
|---|---|
| Home | High |
| Shop | High |
| Categories | High |
| Custom Printing | High |
| Bulk Orders | High |
| Contact | High |
| Cart | High |
| Checkout | High |
| About Us | Medium |
| FAQ | Medium |
| My Account | Medium |
| Privacy Policy | Medium |
| Terms & Conditions | Medium |

## Homepage sections (in order)
1. Header (nav: Home, Shop, Categories, Custom Printing, Bulk Orders, About, Contact, Cart)
2. Hero — "Bring Your Ideas to Life with Star Printing Press"
3. Popular Categories (8 cards)
4. Best Selling Products
5. Why Choose Us (quality, speed, price, custom designs, bulk discounts, support)
6. How It Works (Choose Product → Upload Design → Confirm Order → We Print → Delivery)
7. Bulk Order section (lead gen CTA)
8. Customer Reviews
9. CTA section (Get Started / WhatsApp Us)
10. Footer

## Constraints
- Budget-conscious — client is a small local business, keep hosting/infra costs low
- Must be maintainable by a future developer who wasn't on this project — see all
  `docs/*.md` files, which are updated every phase
- Built phase-by-phase, not all at once — see `docs/05-CHANGELOG.md` for what's
  actually been built vs. still planned

## Source of truth for requirements
Original client brief: `Star_Printing_Press_Website.xlsx` (provided by project owner).
Everything above is that brief restated for engineering use. If anything here looks
inconsistent with the client's intent, the xlsx wins — flag it and we correct this doc.
