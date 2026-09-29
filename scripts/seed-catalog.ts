/**
 * Star Press — Catalog Seed Script
 * 
 * Inserts all 8 categories and all catalog products into the Prisma database.
 * After running this, admin panel edits (title, description, images) will
 * persist in Postgres and show up on the storefront in real-time.
 *
 * Run: npx tsx scripts/seed-catalog.ts
 */

import { PrismaClient } from "@prisma/client";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Star Press Catalog Seed — Starting...\n");

  // 1. Upsert all 8 categories
  console.log("📁 Seeding categories...");
  const categoryIdMap: Record<string, string> = {};

  for (const cat of CATALOG_CATEGORIES) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: CATALOG_CATEGORIES.indexOf(cat),
      },
    });
    categoryIdMap[cat.slug] = upserted.id;
    console.log(`  ✅ ${cat.name} → ${upserted.id}`);
  }

  console.log(`\n📦 Seeding ${CATALOG_PRODUCTS.length} products...`);

  let created = 0;
  let skipped = 0;

  for (const prod of CATALOG_PRODUCTS) {
    const categoryId = categoryIdMap[prod.categorySlug];
    if (!categoryId) {
      console.warn(`  ⚠️ Skipping "${prod.name}" — no category mapping for "${prod.categorySlug}"`);
      skipped++;
      continue;
    }

    // Check if already exists (by slug, which is unique)
    const existing = await prisma.product.findUnique({
      where: { slug: prod.slug },
    });

    if (existing) {
      console.log(`  ⏭️  "${prod.name}" already exists (${existing.id}), skipping`);
      skipped++;
      continue;
    }

    // Generate a deterministic SKU
    const prefix = prod.categorySlug.substring(0, 3).toUpperCase();
    const namePart = prod.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    const sku = `SP-${prefix}-${namePart}-${String(CATALOG_PRODUCTS.indexOf(prod) + 1).padStart(4, "0")}`;

    const createdProduct = await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.slug,
        sku,
        description: prod.description,
        shortDescription: prod.shortDescription,
        categoryId,
        basePrice: prod.basePrice,
        compareAtPrice: Math.round(prod.basePrice * 1.25),
        costPerUnit: Math.round(prod.basePrice * 0.65),
        status: "published",
        isFeatured: prod.isFeatured ?? false,
        trackInventory: true,
        stockQuantity: 100,
        lowStockThreshold: 10,
        metaTitle: `${prod.name} | Custom Online Printing | Star Press`,
        metaDescription: prod.shortDescription,
        metaKeywords: prod.tags.join(", "),
        publishedAt: new Date(),
        images: {
          create: prod.images.map((url, idx) => ({
            url,
            altText: `${prod.name} Image ${idx + 1}`,
            isPrimary: idx === 0,
            position: idx,
            displayOrder: idx,
          })),
        },
      },
    });

    console.log(`  ✅ "${prod.name}" → ${createdProduct.id}`);
    created++;
  }

  console.log(`\n✨ Seed complete! Created: ${created}, Skipped: ${skipped}, Total: ${CATALOG_PRODUCTS.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
