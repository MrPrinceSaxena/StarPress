import { PrismaClient } from "@prisma/client";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Star Press Database Seeder...");

  // 1. Seed Categories
  console.log(`\n📦 Seeding ${CATALOG_CATEGORIES.length} Categories...`);
  const categoryMap = new Map<string, string>();

  for (let i = 0; i < CATALOG_CATEGORIES.length; i++) {
    const cat = CATALOG_CATEGORIES[i];
    const createdCategory = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: i + 1,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: i + 1,
      },
    });

    categoryMap.set(cat.slug, createdCategory.id);
    console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
  }

  // 2. Seed Products
  console.log(`\n📄 Seeding ${CATALOG_PRODUCTS.length} Catalog Products...`);

  for (const prod of CATALOG_PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) {
      console.warn(`  ⚠️ Category not found for product: ${prod.name} (${prod.categorySlug})`);
      continue;
    }

    const createdProduct = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        categoryId: categoryId,
        description: prod.description,
        basePrice: prod.basePrice,
        isFeatured: prod.isFeatured ?? false,
        isActive: true,
      },
      create: {
        name: prod.name,
        slug: prod.slug,
        categoryId: categoryId,
        description: prod.description,
        basePrice: prod.basePrice,
        isFeatured: prod.isFeatured ?? false,
        isActive: true,
      },
    });

    // Seed primary product images
    if (prod.images && prod.images.length > 0) {
      // Clear existing images for clean idempotency
      await prisma.productImage.deleteMany({
        where: { productId: createdProduct.id },
      });

      for (let imgIdx = 0; imgIdx < prod.images.length; imgIdx++) {
        await prisma.productImage.create({
          data: {
            productId: createdProduct.id,
            url: prod.images[imgIdx],
            altText: `${prod.name} image ${imgIdx + 1}`,
            displayOrder: imgIdx,
          },
        });
      }
    }

    // Seed sample pricing rules based on size options and quantity tiers
    await prisma.pricingRule.deleteMany({
      where: { productId: createdProduct.id },
    });

    for (const size of prod.sizeOptions) {
      for (const tier of prod.quantityTiers) {
        const discountedRate = prod.basePrice * size.multiplier * (1 - tier.discountPercent / 100);
        await prisma.pricingRule.create({
          data: {
            productId: createdProduct.id,
            label: `${size.label} / ${tier.quantity} pcs`,
            price: Math.round(discountedRate * tier.quantity),
          },
        });
      }
    }

    console.log(`  ✓ Product: ${prod.name} [${prod.categoryName}]`);
  }

  console.log("\n🎉 Database Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
