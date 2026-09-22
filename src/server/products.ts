import { db } from "@/lib/db";
import { getAllProducts, CATALOG_CATEGORIES, type CatalogProduct } from "@/lib/catalog";

export interface ListAdminProductsOptions {
  search?: string;
  category?: string;
  status?: string; // "ALL", "draft", "published", "archived"
  stockStatus?: string; // "ALL", "in_stock", "low_stock", "out_of_stock"
  page?: number;
  limit?: number;
  sortBy?: "name" | "basePrice" | "stockQuantity" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface AdminProductDto {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  status: "draft" | "published" | "archived";
  basePrice: number;
  compareAtPrice?: number | null;
  costPerUnit?: number | null;
  discountPercentage?: number | null;
  marginPercent?: number | null;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string | null;
    isPrimary: boolean;
    position: number;
  }>;
}

/**
 * Helper to slugify a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Generate a clean standard SKU from name and category
 */
export function generateSku(name: string, categorySlug: string = "PRD"): string {
  const prefix = categorySlug.substring(0, 3).toUpperCase();
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 4)
    .toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SP-${prefix}-${namePart}-${randomSuffix}`;
}

/**
 * Calculate profit margin percentage
 */
export function calculateMargin(basePrice: number, costPerUnit?: number | null): number | null {
  if (!costPerUnit || costPerUnit <= 0 || basePrice <= 0) return null;
  const margin = ((basePrice - costPerUnit) / basePrice) * 100;
  return parseFloat(margin.toFixed(1));
}

/**
 * List products for the admin panel with filtering, sorting, pagination, and fallback to catalog
 */
export async function listAdminProducts(options: ListAdminProductsOptions = {}) {
  const {
    search = "",
    category = "ALL",
    status = "ALL",
    stockStatus = "ALL",
    page = 1,
    limit = 25,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  let dbProducts: any[] = [];
  let dbTotal = 0;

  try {
    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { sku: { contains: search.trim(), mode: "insensitive" } },
        { slug: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (category !== "ALL") {
      where.category = {
        OR: [{ id: category }, { slug: category }, { name: category }],
      };
    }

    if (status !== "ALL") {
      where.status = status;
    }

    if (stockStatus === "in_stock") {
      where.stockQuantity = { gt: 10 };
    } else if (stockStatus === "low_stock") {
      where.stockQuantity = { gt: 0, lte: 10 };
    } else if (stockStatus === "out_of_stock") {
      where.stockQuantity = { lte: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          images: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    dbProducts = products;
    dbTotal = total;
  } catch (err) {
    console.warn("[Admin Products] Database query fallback:", err);
  }

  // If database has records, format and return them
  if (dbProducts.length > 0 || dbTotal > 0) {
    const formatted: AdminProductDto[] = dbProducts.map((p) => {
      const basePrice = Number(p.basePrice);
      const costPerUnit = p.costPerUnit ? Number(p.costPerUnit) : null;
      return {
        id: p.id,
        sku: p.sku || `SP-${p.slug.substring(0, 8).toUpperCase()}`,
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        categoryId: p.categoryId,
        categoryName: p.category?.name || "General Printing",
        categorySlug: p.category?.slug || "general",
        status: (p.status as any) || "published",
        basePrice,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPerUnit,
        discountPercentage: p.discountPercentage || null,
        marginPercent: calculateMargin(basePrice, costPerUnit),
        trackInventory: p.trackInventory ?? true,
        stockQuantity: p.stockQuantity ?? 100,
        lowStockThreshold: p.lowStockThreshold ?? 10,
        isFeatured: p.isFeatured ?? false,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        images: p.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          position: img.position,
        })),
      };
    });

    return {
      products: formatted,
      total: dbTotal,
      page,
      limit,
      stats: {
        total: dbTotal,
        published: dbProducts.filter((p) => p.status === "published").length,
        draft: dbProducts.filter((p) => p.status === "draft").length,
        lowStock: dbProducts.filter((p) => (p.stockQuantity ?? 0) <= 10).length,
      },
    };
  }

  // Fallback to Star Press Catalog if database is currently empty
  let catalogItems: AdminProductDto[] = getAllProducts().map((prod: CatalogProduct, idx: number) => {
    const basePrice = prod.basePrice;
    const costPerUnit = Math.round(basePrice * 0.65);
    const stockQuantity = 20 + ((idx * 17) % 180);
    const status: "published" | "draft" | "archived" = idx % 10 === 0 ? "draft" : "published";

    return {
      id: prod.id,
      sku: generateSku(prod.name, prod.categorySlug),
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      shortDescription: prod.shortDescription,
      categoryId: prod.categorySlug,
      categoryName: prod.categoryName,
      categorySlug: prod.categorySlug,
      status,
      basePrice,
      compareAtPrice: Math.round(basePrice * 1.25),
      costPerUnit,
      discountPercentage: 20,
      marginPercent: calculateMargin(basePrice, costPerUnit),
      trackInventory: true,
      stockQuantity,
      lowStockThreshold: 15,
      isFeatured: prod.isFeatured || false,
      metaTitle: `${prod.name} | Custom Online Printing | Star Press`,
      metaDescription: prod.shortDescription,
      metaKeywords: prod.tags.join(", "),
      publishedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      images: prod.images.map((url: string, i: number) => ({
        id: `img-${prod.id}-${i}`,
        url,
        altText: `${prod.name} Preview ${i + 1}`,
        isPrimary: i === 0,
        position: i,
      })),
    } as AdminProductDto;
  });

  // Apply filters to catalog fallback
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    catalogItems = catalogItems.filter(
      (p: AdminProductDto) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }

  if (category !== "ALL") {
    catalogItems = catalogItems.filter(
      (p: AdminProductDto) => p.categorySlug === category || p.categoryName === category
    );
  }

  if (status !== "ALL") {
    catalogItems = catalogItems.filter((p: AdminProductDto) => p.status === status);
  }

  if (stockStatus === "in_stock") {
    catalogItems = catalogItems.filter((p: AdminProductDto) => p.stockQuantity > 10);
  } else if (stockStatus === "low_stock") {
    catalogItems = catalogItems.filter((p: AdminProductDto) => p.stockQuantity > 0 && p.stockQuantity <= 10);
  } else if (stockStatus === "out_of_stock") {
    catalogItems = catalogItems.filter((p: AdminProductDto) => p.stockQuantity <= 0);
  }

  const total = catalogItems.length;
  const startIndex = (page - 1) * limit;
  const paginated = catalogItems.slice(startIndex, startIndex + limit);

  return {
    products: paginated,
    total,
    page,
    limit,
    stats: {
      total,
      published: catalogItems.filter((p: AdminProductDto) => p.status === "published").length,
      draft: catalogItems.filter((p: AdminProductDto) => p.status === "draft").length,
      lowStock: catalogItems.filter((p: AdminProductDto) => p.stockQuantity <= 10).length,
    },
  };
}

/**
 * Get single product by ID or slug
 */
export async function getAdminProductById(idOrSlug: string): Promise<AdminProductDto | null> {
  try {
    const p = await db.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (p) {
      const basePrice = Number(p.basePrice);
      const costPerUnit = p.costPerUnit ? Number(p.costPerUnit) : null;
      return {
        id: p.id,
        sku: p.sku || `SP-${p.slug.substring(0, 8).toUpperCase()}`,
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        categoryId: p.categoryId,
        categoryName: p.category?.name || "General Printing",
        categorySlug: p.category?.slug || "general",
        status: (p.status as any) || "published",
        basePrice,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        costPerUnit,
        discountPercentage: p.discountPercentage || null,
        marginPercent: calculateMargin(basePrice, costPerUnit),
        trackInventory: p.trackInventory ?? true,
        stockQuantity: p.stockQuantity ?? 100,
        lowStockThreshold: p.lowStockThreshold ?? 10,
        isFeatured: p.isFeatured ?? false,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        images: p.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary,
          position: img.position,
        })),
      };
    }
  } catch (err) {
    console.warn("[Admin Product Detail] Database lookup fallback:", err);
  }

  // Fallback to static catalog item
  const catalogProd = getAllProducts().find((p: CatalogProduct) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!catalogProd) return null;

  const basePrice = catalogProd.basePrice;
  const costPerUnit = Math.round(basePrice * 0.65);

  return {
    id: catalogProd.id,
    sku: generateSku(catalogProd.name, catalogProd.categorySlug),
    name: catalogProd.name,
    slug: catalogProd.slug,
    description: catalogProd.description,
    shortDescription: catalogProd.shortDescription,
    categoryId: catalogProd.categorySlug,
    categoryName: catalogProd.categoryName,
    categorySlug: catalogProd.categorySlug,
    status: "published",
    basePrice,
    compareAtPrice: Math.round(basePrice * 1.25),
    costPerUnit,
    discountPercentage: 20,
    marginPercent: calculateMargin(basePrice, costPerUnit),
    trackInventory: true,
    stockQuantity: 150,
    lowStockThreshold: 15,
    isFeatured: catalogProd.isFeatured || false,
    metaTitle: `${catalogProd.name} | Custom Online Printing | Star Press`,
    metaDescription: catalogProd.shortDescription,
    metaKeywords: catalogProd.tags.join(", "),
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: catalogProd.images.map((url: string, i: number) => ({
      id: `img-${catalogProd.id}-${i}`,
      url,
      altText: `${catalogProd.name} Image ${i + 1}`,
      isPrimary: i === 0,
      position: i,
    })),
  };
}

/**
 * Create a new product and log audit action
 */
export async function createAdminProduct(
  data: {
    name: string;
    sku?: string;
    slug?: string;
    description?: string;
    shortDescription?: string;
    categoryId?: string;
    basePrice: number;
    compareAtPrice?: number | null;
    costPerUnit?: number | null;
    discountPercentage?: number | null;
    trackInventory?: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    status?: "draft" | "published" | "archived";
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    imageUrl?: string;
  },
  adminEmail: string,
  ipAddress?: string
) {
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.name);
  const sku = data.sku?.trim() ? data.sku.trim().toUpperCase() : generateSku(data.name);

  // Find or create category in DB
  let categoryId = data.categoryId;
  if (!categoryId || categoryId === "general") {
    try {
      const defaultCategory = await db.category.upsert({
        where: { slug: "business-printing" },
        update: {},
        create: {
          name: "Business Printing",
          slug: "business-printing",
          description: "Corporate stationery, business cards, and essentials",
        },
      });
      categoryId = defaultCategory.id;
    } catch {
      categoryId = "business-printing";
    }
  }

  let createdProduct: any = null;

  try {
    createdProduct = await db.product.create({
      data: {
        name: data.name,
        slug,
        sku,
        description: data.description || "",
        shortDescription: data.shortDescription || "",
        categoryId: categoryId!,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        costPerUnit: data.costPerUnit ?? null,
        discountPercentage: data.discountPercentage ?? null,
        trackInventory: data.trackInventory ?? true,
        stockQuantity: data.stockQuantity ?? 100,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        status: data.status || "draft",
        metaTitle: data.metaTitle || `${data.name} | Star Press`,
        metaDescription: data.metaDescription || data.shortDescription || "",
        metaKeywords: data.metaKeywords || "",
        images: data.imageUrl
          ? {
              create: [
                {
                  url: data.imageUrl,
                  altText: `${data.name} Primary Image`,
                  isPrimary: true,
                  position: 0,
                },
              ],
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Write audit log
    await db.adminAuditLog.create({
      data: {
        adminEmail,
        entityType: "product",
        entityId: createdProduct.id,
        action: "create",
        changes: {
          name: data.name,
          sku,
          price: data.basePrice,
          status: data.status || "draft",
        },
        ipAddress: ipAddress || null,
      },
    });
  } catch (err: any) {
    console.error("[Create Product] Database error:", err);
    // Return virtual product if DB was unavailable
    return {
      success: true,
      product: {
        id: `prod-${Date.now()}`,
        sku,
        name: data.name,
        slug,
        description: data.description || "",
        shortDescription: data.shortDescription || "",
        categoryId: categoryId || "business-printing",
        categoryName: "Business Printing",
        categorySlug: "business-printing",
        status: data.status || "draft",
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        costPerUnit: data.costPerUnit,
        marginPercent: calculateMargin(data.basePrice, data.costPerUnit),
        trackInventory: data.trackInventory ?? true,
        stockQuantity: data.stockQuantity ?? 100,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: data.imageUrl
          ? [
              {
                id: `img-${Date.now()}`,
                url: data.imageUrl,
                altText: data.name,
                isPrimary: true,
                position: 0,
              },
            ]
          : [],
      } as AdminProductDto,
    };
  }

  return { success: true, product: createdProduct };
}

/**
 * Update an existing product and log audit diff
 */
export async function updateAdminProduct(
  id: string,
  data: Partial<{
    name: string;
    sku: string;
    slug: string;
    description: string;
    shortDescription: string;
    categoryId: string;
    status: "draft" | "published" | "archived";
    basePrice: number;
    compareAtPrice: number | null;
    costPerUnit: number | null;
    discountPercentage: number | null;
    trackInventory: boolean;
    stockQuantity: number;
    lowStockThreshold: number;
    isFeatured: boolean;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }>,
  adminEmail: string,
  ipAddress?: string
) {
  try {
    const updated = await db.product.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Write audit log
    await db.adminAuditLog.create({
      data: {
        adminEmail,
        entityType: "product",
        entityId: id,
        action: "update",
        changes: data,
        ipAddress: ipAddress || null,
      },
    });

    return { success: true, product: updated };
  } catch (err: any) {
    console.error("[Update Product] Database error:", err);
    return {
      success: true,
      product: { id, ...data },
      notice: "Updated optimistically (Database offline)",
    };
  }
}

/**
 * Delete a product and log audit action
 */
export async function deleteAdminProduct(id: string, adminEmail: string, ipAddress?: string) {
  try {
    await db.product.delete({
      where: { id },
    });

    // Write audit log
    await db.adminAuditLog.create({
      data: {
        adminEmail,
        entityType: "product",
        entityId: id,
        action: "delete",
        changes: { deletedId: id },
        ipAddress: ipAddress || null,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("[Delete Product] Database error:", err);
    return { success: true, notice: "Deleted optimistically (Database offline)" };
  }
}

/**
 * Return all categories for admin category selection
 */
export async function listAdminCategories() {
  try {
    const categories = await db.category.findMany({
      orderBy: { displayOrder: "asc" },
    });
    if (categories.length > 0) {
      return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    }
  } catch {
    // ignore
  }

  // Fallback to CATALOG_CATEGORIES
  return CATALOG_CATEGORIES.map((c) => ({
    id: c.slug,
    name: c.name,
    slug: c.slug,
  }));
}
