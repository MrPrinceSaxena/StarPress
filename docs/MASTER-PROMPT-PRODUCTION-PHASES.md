# Star Press — Master Prompt (Production Phases)

**How to use:** Paste **Section 0 (standing rules)** plus **exactly one phase** (A, B, C, or D) into a new Cursor Agent chat. Do not ask the model to implement all phases in one session. After a phase, update `docs/05-CHANGELOG.md` and mark that phase done here.

**Scale:** Single print shop, Pan-India, low cost. Not multi-vendor, not enterprise admin (ignore `docs/ADMIN_PANEL_SPEC.md` inventory/RBAC/CSV/scheduling unless a later phase explicitly asks).

**Already built (do not rebuild):** Neon Dark storefront, catalog/pricing engine, cart/checkout UI, NextAuth, admin shell (dashboard, products, categories, orders, settings), inquiry APIs, Razorpay *stubs* in `src/server/payments.ts`. This prompt **hardens and wires** what exists.

---

## Section 0 — Standing rules (always include)

You are an expert full-stack engineer on **Star Press**, a production Next.js e-commerce print store.

### Stack (do not replace)
- Next.js App Router, TypeScript (strict, avoid `any`), Tailwind, `lucide-react`
- Prisma → Supabase PostgreSQL
- Supabase Storage via existing `ImageUploader` + `/api/admin/upload` (never a second upload pipeline)
- NextAuth credentials; admin APIs: `verifyAdminAccess` from `src/lib/admin/auth-check.ts`
- Razorpay only (no other gateways)
- Business logic in `src/server/`; route handlers stay thin
- UI: neon dark, `brand-yellow` CTAs, glassmorphism, mobile-first, skeletons + `Loader2` on saves
- Admin pages follow tabbed layout of `src/app/admin/settings/page.tsx`
- Reuse `showToast()` / existing helpers; do not delete unrelated comments or code

### Production money rules (non-negotiable)
1. **Never trust client prices.** Recalculate on the server from product config + qty + size + material + text + GST + shipping + coupon.
2. **Webhook is source of truth** for `PAID`. Client verify is UX only, or verify + Razorpay GET payment — never mark paid from an unsigned browser payload.
3. **Fail closed in production:** if `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` are missing, do **not** mock orders and do **not** return `true` from HMAC helpers.
4. **No phantom orders:** if DB or payment init fails, return 4xx/5xx. Do not write JSON-file order fallbacks. Do not show a fake `SP-xxxxxx` success on checkout error.
5. **Do not `clearCart()`** until the order is persisted and (for online) payment is `PAID` **or** user is on a dedicated “confirming payment” screen with a real `orderNumber`.
6. **Secrets stay in env** (`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`). Never persist Razorpay secrets in `StoreSetting` or admin form state.
7. Amounts: integer **paise** at the Razorpay boundary; `Math.round(rupees * 100)`. Compare captured paise to DB total paise.
8. HMAC: `crypto.timingSafeEqual` on equal-length buffers. Verify webhook HMAC on the **raw body string**, never re-serialized JSON.
9. Idempotency: unique `PaymentTransaction.gatewayPaymentId`; duplicate webhooks return 200 and do nothing.
10. Guest vs login: keep **one** policy and implement it consistently (today `/api/orders` requires a session). If you keep login-required, checkout must block unauthenticated users before submit. If you restore guest checkout, document it and allow `userId` null.

### Out of scope unless the current phase names it
Shiprocket live API, in-browser design editor, Redis, multi-staff RBAC, CSV import, warehouse inventory, extra payment gateways.

---

## Phase A — Money path (blocking launch)

**Goal:** Browse → configure → checkout → Razorpay (or pay-after-proof) → real confirmation. Admin sees `PAID` only after capture.

### A1 — Server quote (single source of price)
- Add `src/server/quote.ts` (name may match repo style) exporting `quoteOrder(input)` used by checkout preview API **and** `createOrder`.
- Input: line items `{ productId or slug, quantity, sizeId, materialId, customText?, artworkUrl? }`, coupon code, shipping method (`standard` | `rush`).
- Use existing `calculateProductPrice` in `src/lib/pricing.ts` + live product config from DB if available, else catalog until Phase B.
- Apply 18% GST on taxable print subtotal (match business rule already shown on `/cart`). Rush fee as today (+₹249 or current constant). Shipping threshold if already in cart.
- Coupon: reuse logic from `src/app/api/discounts/validate/route.ts`. Do not increment `usedCount` until payment is `PAID` (online) or order is created (proof).
- Return breakdown: subtotal, gst, shipping, discount, **grandTotal**, line snapshots.
- Add unit tests for batch vs unit pricing, coupon min amount, rush fee, qty ≤ 0 rejection.

### A2 — Harden `createOrder`
- Files: `src/server/orders.ts`, `src/app/api/orders/route.ts`.
- Ignore client `unitPrice` / `lineTotal` / `totalAmount`. Persist quote snapshots on `OrderItem.specs`.
- `paymentMethod`: `ONLINE` | `PAY_AFTER_PROOF` only.
- Status: `PENDING`, `paymentStatus: UNPAID`.
- **Production:** remove JSON `persistentStore` success path for new orders. On Prisma failure → 503.
- Idempotency-Key header: same key + same user within 24h returns the existing unpaid order.
- Unpublished / missing product → 400.
- Required artwork products without `artworkUrl` → 400 or force `PAY_AFTER_PROOF` (pick one, document in changelog).

### A3 — Razorpay create (no mock in prod)
- Files: `src/server/payments.ts`, `src/app/api/payments/razorpay/create-order/route.ts`.
- Only for `ONLINE` + `UNPAID` orders owned by the session (or guest token if Phase A includes guest).
- Amount from **DB** `totalAmount`, not request body.
- Razorpay `receipt` = `orderNumber` (≤40 chars). `notes.starpressOrderId` = Prisma `id`, `notes.orderNumber` = human number.
- If `razorpayOrderId` already exists and order still UNPAID, **reuse** it (GET Razorpay order or skip recreate).
- `NODE_ENV === production` or `VERCEL_ENV === production`: missing keys → 503, never `order_mock_*`.
- Dev-only mock allowed when `NODE_ENV !== production` **and** keys absent; label `isMock: true` and never call it from production checkout.

### A4 — Client Checkout.js + verify endpoint
- Checkout page: `src/app/checkout/page.tsx`.
- Flow: `POST /api/orders` → if ONLINE, `POST /api/payments/razorpay/create-order` → load Razorpay checkout.js → `handler` posts to **new** `POST /api/payments/razorpay/verify`.
- Verify body: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. HMAC with `RAZORPAY_KEY_SECRET` (`order_id|payment_id`).
- Prefer: after HMAC, `GET https://api.razorpay.com/v1/payments/:id` and require `status` captured/authorized as designed, **amount === db paise**, `order_id` match.
- UX: loaders on pay button; `payment.failed` / dismiss → stay UNPAID, allow retry, **keep cart** until success.
- Success UI only with real `orderNumber`. Poll `GET /api/orders/[id]` until `PAID` or 60s timeout message: “Payment received; confirmation may take a minute. Track with {orderNumber}.”
- Remove offline fallback that fabricates order IDs and still `clearCart()`.

### A5 — Webhook (idempotent, fail closed)
- File: `src/app/api/payments/razorpay/webhook/route.ts`.
- Require `RAZORPAY_WEBHOOK_SECRET` in production.
- Events: `payment.captured`, `order.paid`, `payment.failed`, optionally `refund.created`.
- Resolve order: `notes.starpressOrderId` → `razorpayOrderId` → `receipt` as `orderNumber`.
- Amount mismatch → log, do not mark PAID, return 200 after logging (avoid infinite retry storms) **or** 400 if you are sure Razorpay will not retry forever — prefer 200 + admin-visible `paymentStatus: DISPUTED`.
- `recordPaymentSuccess`: upsert by `gatewayPaymentId`; set `paymentStatus: PAID`, `status: CONFIRMED`.
- `payment.failed`: leave UNPAID; optional `LAST_PAYMENT_FAILED` note.
- After successful DB write, always HTTP 200.

### A6 — Email
- Resend if `RESEND_API_KEY` set; otherwise log and continue (don’t fail the payment).
- Templates: order placed (proof), payment received, payment failed (retry link).
- Notify owner email from env `ORDER_NOTIFY_EMAIL` on PAID.

### A7 — Admin (minimal)
- Orders list: filter UNPAID / PAID / PAY_AFTER_PROOF.
- Manual “Mark paid” **only** for proof/COD, write `AdminAuditLog`.
- Settings: show “Razorpay configured: yes/no” from env; remove editable secret fields.

### Phase A done when
- [x] Tampering with checkout JSON cannot lower the charged amount.
- [x] Razorpay test payment creates `PaymentTransaction` and `PAID`.
- [x] Replayed webhook does not duplicate transactions.
- [x] Missing webhook secret in production rejects unsigned events.
- [x] Checkout never shows success without a DB order number.
- [x] `docs/05-CHANGELOG.md` updated; `.env.example` lists all Razorpay + Resend vars.

### Phase A edge-case checklist (implement or explicitly ticket)
User closes tab after pay → webhook still PAID. Double-click / two Razorpay orders → reuse or refund flag. Test key on production host → refuse. Coupon race → increment uses in same transaction as PAID. Price change after cart → charge quote-at-order-time, show breakdown before widget. Product unpublished → 400. DB down → 503, no fake success.

---

## Phase B — Live catalog CMS + inquiries (owner independence)

**Goal:** Admin add/edit product, prices, images → storefront updates without deploy. Leads visible in admin.

### B1 — Storefront reads DB
- Prefer `getLiveCatalogProducts` / Prisma; seed from `src/lib/catalog-data/` is **bootstrap only**.
- Fall back to hardcoded catalog only when DB empty **and** not production (or show empty state in production).

### B2 — Admin products / categories / pricing
- Existing pages under `src/app/admin/products/**`, `categories/**`, APIs under `src/app/api/admin/products/**`.
- Wire size/qty/material multipliers to `PricingRule` (or current schema) so PDP configurator uses DB.
- Images: **only** `ImageUploader` → `/api/admin/upload`.
- All `/api/admin/*` start with `verifyAdminAccess`.

### B3 — Inquiries inbox
- Admin UI for `CustomizationRequest`, `BulkOrderInquiry`, `ContactInquiry`.
- Status: `NEW` | `CONTACTED` | `CLOSED`. Audit log on status change.

### B4 — Orders ops
- Status pipeline: `PENDING → CONFIRMED → IN_PRODUCTION → DISPATCHED → DELIVERED` (+ `CANCELLED`).
- AWB + courier fields already on `Order`; manual entry only (no Shiprocket API).

### Phase B done when
- [ ] New product in admin appears on `/shop` with correct live price.
- [ ] Inquiry forms still persist; admin can close a lead.
- [ ] Changelog + `docs/04-PAGES-AND-FEATURES.md` admin rows set to done.

---

## Phase C — Small-scale production ops & hygiene

**Goal:** Safe Vercel + Supabase launch; honest legal/ops; no demo backdoors.

### C1 — Env & fail-closed
- Validate required prod env in `src/lib/env.ts`: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Razorpay trio, `RESEND_API_KEY` (warn if missing).
- Strip demo/quick-fill credentials from `/login` when production.

### C2 — Rate limits
- Apply existing `src/lib/rate-limit.ts` to `POST /api/orders`, payment create/verify, inquiry posts.
- Document in-memory limiter is per-instance (OK for small traffic).

### C3 — Customer artwork upload
- Customer-facing upload route that **reuses the same storage helper** as `/api/admin/upload` (shared lib, not a new vendor).
- MIME allowlist (PDF, PNG, JPEG, AI/PSD if you already accept them), max size ~25MB, auth or signed checkout session.

### C4 — Auth completeness
- Password reset email if PRD requires it and it is still missing.
- Guest policy documented and matching code.

### C5 — Copy & legal
- Single real business address/phone/GST (no Khatima vs Okhla mismatch).
- Privacy: do not claim PCI-DSS unless true; say payments processed by Razorpay.

### C6 — Ops
- Follow `docs/OPERATIONS.md` backup before `prisma migrate deploy`.
- Webhook URL in Razorpay dashboard: `https://<prod-domain>/api/payments/razorpay/webhook`.

### Phase C done when
- [ ] Production build refuses mock payments.
- [ ] `npm run lint` and `npx tsc --noEmit` clean.
- [ ] Setup guide lists webhook events: `payment.captured`, `order.paid`, `payment.failed`.

---

## Phase D — After first real orders (do not start before A–C)

Implement only items the owner actually needs:

1. Shiprocket: create shipment on `DISPATCHED`, store AWB, link on `/account`.
2. Razorpay refunds from admin (full refund, audit log).
3. GST tax invoice PDF (if client confirms).
4. Redis rate limiting if Vercel concurrency makes in-memory limits useless.
5. Analytics (privacy-friendly).
6. Wishlist account sync (localStorage already exists).

**Phase D done when** the specific item above is live and changelog-updated — not when the whole list is done.

---

## Suggested chat sequence

| Chat | Paste |
|---|---|
| 1 | Section 0 + Phase A |
| 2 | Section 0 + Phase B |
| 3 | Section 0 + Phase C |
| 4 | Section 0 + one Phase D bullet |

If a chat tries to skip A and build Shiprocket or a new upload vendor, stop and finish Phase A.

---

## Copy-paste block (Phase A)

```
Read docs/MASTER-PROMPT-PRODUCTION-PHASES.md. Follow Section 0 standing rules and implement ONLY Phase A (A1–A7). Do not start Phase B–D. Match existing Star Press patterns in .cursorrules. Harden payments for production (no mock HMAC, no client totals, no fake order success). Update docs/05-CHANGELOG.md when done.
```
