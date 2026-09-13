# Database Schema

Source of truth is `prisma/schema.prisma`. This doc explains *why* each model exists
and how they relate, in plain language, for anyone who doesn't want to reverse-engineer
the Prisma file. **Whenever the schema changes, update this file in the same phase.**

Status: **Phase 0 draft**. Marked "(placeholder)" models will be redesigned in the
phase noted — they exist now only so relations compile and the shape is visible early.

## Auth / Users
- **User** — a person who can log in. `role` (`CUSTOMER` / `ADMIN`) gates access to
  the admin panel. Password is hashed, never stored plain.
- **Address** — a saved shipping address, belongs to a User. A user can have several
  (home/office); `isDefault` marks the one used by default at checkout.

## Catalog
- **Category** — one of the 8 main categories from the client brief (Business
  Printing, Marketing Materials, etc.). Has a `slug` for clean URLs (`/categories/business-printing`).
- **Product** — an individual product (e.g. "Business Cards") under a Category.
  `basePrice` is a display/reference price ("starting at ₹X") — the *actual* price a
  customer pays depends on their chosen size/quantity/text, computed via `PricingRule`.
- **ProductImage** — one or more images per product, ordered for gallery display.
- **PricingRule** *(placeholder — real design in Phase 2)* — will hold the logic for
  "price changes by size, quantity, and text length." Phase 0 just stores flat
  label→price pairs (e.g. "A6 / 100 pcs" → ₹500) as a placeholder so the relation
  exists; Phase 2 replaces this with a proper rule engine (likely: base price + per-
  unit price + size multiplier + optional text-length surcharge).

## Cart / Orders
- **Cart** — one per logged-in user (`userId` unique) or, for guests, tied to a
  session (decision on guest-cart mechanics deferred to Phase 3).
- **CartItem** — a product + quantity + the specific size/text choices (`specs` JSON)
  a customer picked, with the price *at the time it was added* (`unitPrice`) so later
  price changes don't retroactively change someone's cart.
- **Order** / **OrderItem** — same shape as Cart/CartItem but immutable once placed.
  `shippingAddress` is a JSON *snapshot* (not a live FK to Address) so editing a saved
  address later doesn't rewrite historical orders. `paymentId`/`paymentStatus` track
  the Razorpay transaction.
- **OrderStatus** enum models the real-world fulfillment flow for a print shop:
  pending → confirmed → in production → dispatched → delivered (or cancelled).

## Reviews / Leads / Support
- **Review** — customer rating + comment on a product (homepage "Customer Reviews"
  section, and per-product reviews on Shop pages).
- **CustomizationRequest** — from the "Custom Printing" page: customer uploads a
  design/spec without necessarily buying a fixed catalog product. `fileUrl` points to
  the uploaded file in Cloudinary/S3. `status` lets admin triage new requests.
- **BulkOrderInquiry** — from the "Bulk Orders" lead-gen page. Not an order — a lead
  the client follows up with manually (per the brief: "corporate/bulk pricing... quote
  form").
- **ContactInquiry** — from the Contact page enquiry form.

## Deliberately deferred to later phases
- Coupons/discounts — not in the client brief; add only if requested.
- Multi-admin permission levels — brief implies one client/owner using the admin
  panel; revisit if they want staff accounts.
- Guest checkout persistence strategy — decided in Phase 3 (cart/checkout phase).
- Full pricing-rule engine — Phase 2.
