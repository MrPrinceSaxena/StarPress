-- Additive change. Review schema drift and backup before applying to production.
-- This is not a baseline migration for the existing database.
BEGIN;
CREATE TABLE "ProductConfigurationDraft" (
  "productId" TEXT PRIMARY KEY REFERENCES "Product"("id") ON DELETE CASCADE,
  "revision" INTEGER NOT NULL DEFAULT 1 CHECK ("revision" > 0),
  "configuration" JSONB NOT NULL,
  "published" JSONB,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT NOT NULL
);
ALTER TABLE "ProductConfigurationDraft" ENABLE ROW LEVEL SECURITY;
-- No public policies: only the privileged server database connection may access drafts.
COMMIT;
