import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
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

    const isBatch =
      prod.pricingModel === "batch" ||
      (prod.pricingModel !== "unit" && (prod.quantityTiers[0]?.quantity ?? 1) >= 10);
    const effectiveBaseQty = prod.baseQuantity || (isBatch ? (prod.quantityTiers[0]?.quantity ?? 1) : 1);
    const baseUnitRate = isBatch ? prod.basePrice / effectiveBaseQty : prod.basePrice;

    for (const size of prod.sizeOptions) {
      for (const tier of prod.quantityTiers) {
        const rawUnitPrice = baseUnitRate * size.multiplier;
        const discountedUnitPrice = rawUnitPrice * (1 - tier.discountPercent / 100);
        const totalPrice = Math.round(discountedUnitPrice * tier.quantity);
        await prisma.pricingRule.create({
          data: {
            productId: createdProduct.id,
            label: `${size.label} / ${tier.quantity} pcs`,
            price: totalPrice,
          },
        });
      }
    }

    console.log(`  ✓ Product: ${prod.name} [${prod.categoryName}]`);
  }

  // 3. Seed Users (Admin & Sample Customer)
  console.log("\n👤 Seeding Initial Users (Enterprise 12-Round Bcrypt)...");
  const adminPasswordHash = await bcrypt.hash("Admin@StarPress2026", 12);
  const customerPasswordHash = await bcrypt.hash("Customer@StarPress2026", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@starpress.in" },
    update: {
      name: "Star Press Admin",
      role: Role.ADMIN,
      phone: "+91 98970 54563",
      passwordHash: adminPasswordHash,
      emailVerified: new Date(),
      failedLoginAttempts: 0,
    },
    create: {
      email: "admin@starpress.in",
      name: "Star Press Admin",
      role: Role.ADMIN,
      phone: "+91 98970 54563",
      passwordHash: adminPasswordHash,
      emailVerified: new Date(),
      failedLoginAttempts: 0,
    },
  });
  console.log(`  ✓ Admin User: ${adminUser.email} (Role: ${adminUser.role})`);

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@starpress.in" },
    update: {
      name: "Rahul Sharma",
      role: Role.CUSTOMER,
      phone: "+91 98765 43210",
      passwordHash: customerPasswordHash,
      emailVerified: new Date(),
      failedLoginAttempts: 0,
    },
    create: {
      email: "customer@starpress.in",
      name: "Rahul Sharma",
      role: Role.CUSTOMER,
      phone: "+91 98765 43210",
      passwordHash: customerPasswordHash,
      emailVerified: new Date(),
      failedLoginAttempts: 0,
    },
  });
  console.log(`  ✓ Customer User: ${customerUser.email} (Role: ${customerUser.role})`);

  // Seed sample address for customer
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customerUser.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: "Office",
        line1: "Suite 402, Star Media Tower",
        line2: "MG Road, Civil Lines",
        city: "Bareilly",
        state: "Uttar Pradesh",
        pincode: "243001",
        phone: "+91 98765 43210",
        isDefault: true,
      },
    });
    console.log(`  ✓ Sample Address created for ${customerUser.email}`);
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
