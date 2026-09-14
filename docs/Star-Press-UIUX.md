# Star Press — UI/UX Design Document

**Version:** 1.0
**Date:** 14 Sept 2026
**Based on:** Client-approved homepage screenshots (Neon Dark theme, current build)

---

## 1. Design Theme — "Neon Dark"

*(Confirmed as the authoritative theme — an earlier client requirement sheet listed Navy Blue/Gold/White as a draft brand direction; that has been superseded by this Neon Dark theme, which is what's actually built and approved.)*

Bold, near-black storefront with neon pink/magenta + cyan accents and a solid yellow CTA color. Playful, energetic, print-shop-meets-nightlife feel — matches "Print Your Ideas to Life" positioning.

### 1.1 Color Palette

| Token | Approx. Hex | Usage |
|---|---|---|
| `bg-base` | `#0A0A0C` | Page background |
| `bg-surface` | `#131316` | Cards, nav, footer background |
| `bg-surface-alt` | `#1C1720` (dark plum) | Promo/banner section backgrounds |
| `accent-yellow` | `#FFC61A` | Primary CTA buttons ("Get a Quote", "Shop Now", "Add to Cart") |
| `accent-pink` | `#EC1E8C` | Highlights, active nav item glow, card border glow, headline accent word |
| `accent-cyan` | `#29C7F5` | Secondary highlight, icon accents, arrows |
| `text-primary` | `#FFFFFF` | Headings |
| `text-secondary` | `#9A9AA5` | Body copy, sub-text |
| `border-subtle` | `#242428` | Card/section dividers |
| `star-rating` | `#FFC61A` | Star icons |

**Contrast check:** yellow-on-black and white-on-black pass AA; pink text on dark background is borderline for small body text — reserve pink for large headline words, buttons/icons, and borders, not for paragraph text. Keep body copy in `text-secondary`/white.

### 1.2 Typography

- **Headings:** Extra-bold, tight-tracking geometric sans (current build reads like **Poppins ExtraBold** or **Archivo Black**). All-caps for hero headlines.
- **Body/nav:** Regular-weight geometric sans (Poppins/Inter Regular), `text-secondary` color.
- **Scale (suggested):** H1 48–64px / H2 32px / H3 22px / Body 16px / Small 14px.

### 1.3 Shape & Effects

- Corner radius: ~12–16px on cards and inputs, full-pill on badges/CTAs where used.
- Glow effect: soft box-shadow in accent-pink or accent-cyan around featured/active cards (e.g., selected category, highlighted product card).
- Section banners (custom printing, newsletter) use a subtle radial pink/purple gradient glow inside a bordered rounded panel.
- Icons: line icons inside a pink circular outline chip (feature list: Premium Quality, Fast Delivery, Secure Payments, Design Support).

### 1.4 Core Components

| Component | Style |
|---|---|
| Primary button | Solid `accent-yellow`, black bold text, rounded-lg, arrow icon on hover-shift |
| Secondary button | Transparent, white 1px border, white text, rounded-lg |
| Product card | `bg-surface`, rounded-xl, image top, name/price/star-rating, yellow "Add to Cart" button; pink glow border when featured/hovered |
| Category card | Image tile, rounded-xl, label below; pink glow ring when active/hovered |
| Testimonial card | `bg-surface`, rounded-xl, avatar + name + role + 5-star row + quote; middle card gets pink border accent |
| Nav bar | Fixed top, `bg-base`/blur, logo left (star icon + wordmark), links center, search/cart/CTA right |
| Badge/pill | Rounded-full, 1px pink border, icon + label (e.g., "Premium Printing for Every Idea") |
| Footer | Dark, 4-column (brand, Shop, Company, Help), newsletter panel above it |

---

## 2. Screens (Full Scope)

### 2.1 Existing / Approved
- **Home** — hero, feature strip, shop-by-category, best-selling products, why-choose-us, testimonials, newsletter CTA, footer *(already built — see screenshots)*

### 2.2 To Design/Build (same theme)
| Screen | Key elements |
|---|---|
| Shop / Category listing | Filter sidebar (category, price), product grid, sort dropdown |
| Product detail | Image gallery, size/qty/text-customization selectors, live price display, Add to Cart, description tabs |
| Cart | Line items with thumbnail, editable qty, price breakdown, "Proceed to Checkout" |
| Checkout | Address form → order summary → Razorpay payment step |
| Login / Sign up | Centered card on dark background, yellow primary CTA, pink accent link |
| Account / Order history | List of past orders with status pill (color-coded: yellow=in production, cyan=shipped, green=delivered) |
| Custom Printing / Bulk Orders | Form (product type, qty, notes, file upload), same panel style as newsletter banner |
| Admin dashboard | Simpler, functional dark theme — sidebar nav (Products, Orders, Inquiries), data tables, same yellow/pink accents used sparingly for status/actions |

---

## 3. Responsive Behavior

- **Desktop (≥1024px):** as shown in screenshots — multi-column grids, side-by-side hero.
- **Tablet (768–1023px):** hero stacks to 1 column (text over image), category grid drops to 3 columns, product grid to 2.
- **Mobile (<768px):** hamburger nav, single-column everywhere, sticky bottom "Add to Cart"/CTA bar on product detail, cards full-width.

---

## 4. Requested Optimization — "Advanced, Smoother, More Attractive" Pass

Since the base theme is already approved, these are refinements to elevate the existing build without changing the identity:

1. **Micro-interactions**
   - Buttons: slight scale (1.02–1.04) + brighter glow on hover, quick 150ms ease-out.
   - Product/category cards: image zoom (scale 1.05) on hover inside a clipped container.
   - Arrow icons in CTAs animate a small right-shift on hover.

2. **Motion library**
   - Use **Framer Motion** for scroll-in reveals (fade + slight translate-y) on section headings, product cards, and testimonials — staggered by ~80ms per item.
   - Page transitions: simple fade between routes (avoid heavy transitions that hurt perceived speed).

3. **Loading states**
   - Skeleton loaders (dark shimmer blocks) for product grids and cart while data loads — keeps the dark theme consistent instead of a plain spinner.

4. **Glow performance**
   - Use CSS `box-shadow`/`filter: drop-shadow` sparingly (already GPU-friendly); avoid large blurred SVG filters on many simultaneous elements — cap glow effects to 1 featured card per row, not all cards, to keep it "accent" rather than noisy.

5. **Consistency pass**
   - Standardize spacing scale (4/8/16/24/32/48/64px) across all new pages to match hero/section rhythm already set on Home.
   - Standardize the pink-glow usage rule: only for (a) one featured item per section, (b) active/selected state, (c) primary section banners — never as default state for every card (keeps it premium, not overwhelming).

6. **Accessibility**
   - Ensure yellow CTA text (black) meets contrast — already good.
   - Add visible focus states (pink outline ring) for keyboard navigation on buttons/inputs — currently not visible in screenshots.
   - Avoid conveying order status by color alone (pair color pill with text label, already planned above).

7. **Performance**
   - Serve product images via `next/image` with responsive sizes + WebP.
   - Lazy-load below-the-fold sections (testimonials, newsletter banner).

8. **Small polish ideas**
   - Animated count-up for star ratings/review counts on scroll into view.
   - Subtle parallax on the hero product image (very light, <10px shift) for depth without hurting performance.
   - Toast notifications (dark card, pink/cyan accent border) for "Added to Cart" instead of default browser alerts.

These are additive — none require changing the color system, typography, or layout already approved in the screenshots.
