# Production implementation plan

Status: in progress. Existing checkout and catalog behavior must remain compatible until each replacement is tested. Production deployment is not implied by local implementation.

1. Product configuration: versioned, validated configuration with explicit piece/pack quantities, generic option groups, add-ons, customization fields, artwork requirements and integer-paise pricing. Additive database migration, admin editor, storefront renderer, quote validation and immutable order snapshot must ship together. Reject unknown selections and stale configuration versions.
2. Artwork: authenticated private uploads, ownership checks, bounded file size/type verification, upload progress/retry, retained order attachments and reference-aware deletion. Define proof approval/version history separately from payment status.
3. Commerce: unique durable idempotency keys, transactional stock/coupon allocation, webhook inbox and notification outbox, refund reconciliation. Validate concurrency in hosted PostgreSQL using isolated records.
4. Performance: reconcile legacy JSON records before retiring fallback reads; database pagination and counts, query indexes, explicit cache invalidation and bounded connection pools. Measure mobile LCP, INP and CLS before and after changes.
5. Operations: schema drift and backup review, RLS/storage policy audit, CI checks, error monitoring, sensitive-data redaction, health checks, preview verification, compatible migrations and rollback procedures.
6. Customer/admin acceptance: keyboard/mobile journey from configuration through upload, checkout, payment, proof approval, production, shipping and reorder; revoked-admin and cross-account access checks.

First increment: shared configuration schema and pure pricing engine. This is groundwork, not an enabled admin/storefront feature. Legacy pricing remains active until persistence and the complete UI/API integration are ready.

## Implemented draft persistence increment

- Added `ProductConfigurationDraft` Prisma model and an additive SQL change under `prisma/changes/20261115_product_configuration_drafts.sql`.
- Added authenticated admin GET/PUT `/api/admin/products/[id]/configuration`. PUT validates the full configuration, uses expectedRevision (zero on first save), locks the product row and commits the audit event atomically. Stale saves return 409; missing products return 404; unavailable storage returns 503.
- Draft storage is not published configuration. No storefront price changes are enabled by this increment. RLS is enabled without public policies; confirm the server database role can access the table during deployment verification.
- SQL has NOT been applied to Supabase. It is intentionally outside Prisma migrations because the existing production schema has no reviewed migration baseline. Do not run migrate deploy as a substitute for reconciling that baseline.
- Prisma client generation, TypeScript checks and local configuration tests pass. Tests use transaction doubles, including audit rollback; real PostgreSQL locking remains to verify.
- Next implementation: structured admin editor, publish validation and revision history, customer renderer, quote/order snapshots, private upload integration, then full journey verification. Do not expose publishing until the full price/quantity/inventory path supports configured products.

## Configuration integration and hosted rollout

The earlier draft-only status is superseded by this implementation:
- Structured admin editor supports quantities, unit/pack size, option choices and prices, add-on services, customer fields and artwork requirements. Save and publish are separate; unsaved edits cannot be published. The non-persistent legacy variants editor was removed.
- Published revisions render on product pages; products without a published configuration retain the original configurator/pricing. Publication invalidates product-page cache.
- Cart and checkout carry typed selections. Quantity changes recalculate one-time/per-unit charges. Server quotes reject stale revisions, missing required fields and invalid selections; order creation rechecks published revision under product lock. Inventory remains denominated in ordering units, and published unit/pack-size changes are prohibited.
- Orders retain the full configuration/selection snapshot and readable printing instructions. Reorders retain selections and artwork but are rejected at checkout if the published revision changed.
- Private customer artwork uploads accept signature-checked PDF/PNG/JPEG up to 4 MB. Uploads require sign-in and rate limiting. Retrieval requires owner/admin access and uses short-lived download links. Order creation verifies ownership and object existence. Larger direct-to-storage uploads and malware/prepress analysis are future enhancements, not claimed here.
- Supabase configuration table was created with RLS and the private `customer-artwork` bucket was provisioned. No existing product configuration was published and no existing order was changed.
- Configuration is enabled by default after rollout. `PRODUCT_CONFIGURATION_ENABLED=false` is an emergency disable switch; configured cart lines then fail closed rather than falling back to legacy pricing. Local checks explicitly disable hosted configuration reads.
- The cached Vercel login returned 403. The user confirmed Git-based auto-deploy is the deployment path. No separate Vercel connection is required to push this release.
