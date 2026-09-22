// =============================================================================
// StarPress Admin — Service Abstraction Layer
// Replace mock implementations with Supabase/API calls later
// =============================================================================

import type {
  AdminProduct,
  AdminOrder,
  AdminCustomer,
  AdminCategory,
  AdminDiscount,
  PaginatedResult,
  ProductFilters,
  OrderFilters,
  DashboardStats,
  AnalyticsData,
  FinanceSummary,
  FinanceTransaction,
  MarketingCampaign,
  ContentPage,
  ProductStatus,
} from './types';

import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_CUSTOMERS,
  MOCK_CATEGORIES,
  MOCK_DISCOUNTS,
  MOCK_DASHBOARD_STATS,
  MOCK_ANALYTICS,
  MOCK_FINANCE_SUMMARY,
  MOCK_FINANCE_TRANSACTIONS,
  MOCK_CAMPAIGNS,
  MOCK_CONTENT,
} from './mock-data';

// --- In-memory mutable store (simulates a database) ---

let products = [...MOCK_PRODUCTS];
let orders = [...MOCK_ORDERS];
let customers = [...MOCK_CUSTOMERS];

// --- Helper: simulate async delay ---
const delay = (ms: number = 100) => new Promise((r) => setTimeout(r, ms));

// =============================================================================
// Product Service
// =============================================================================

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResult<AdminProduct>> {
    await delay();
    let data = [...products];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      data = data.filter((p) => p.status === filters.status);
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      data = data.filter((p) => p.categoryId === filters.category);
    }

    // Stock filter
    if (filters.stockStatus && filters.stockStatus !== 'all') {
      switch (filters.stockStatus) {
        case 'in_stock':
          data = data.filter((p) => p.stockQuantity > p.lowStockThreshold);
          break;
        case 'low_stock':
          data = data.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
          break;
        case 'out_of_stock':
          data = data.filter((p) => p.stockQuantity === 0);
          break;
      }
    }

    // Price range
    if (filters.priceMin !== undefined) data = data.filter((p) => p.basePrice >= filters.priceMin!);
    if (filters.priceMax !== undefined) data = data.filter((p) => p.basePrice <= filters.priceMax!);

    // Sort
    const sortBy = filters.sortBy || 'created';
    const sortOrder = filters.sortOrder || 'desc';
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'price': cmp = a.basePrice - b.basePrice; break;
        case 'stock': cmp = a.stockQuantity - b.stockQuantity; break;
        case 'created': cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
        case 'updated': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Paginate
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = data.slice(start, start + pageSize);

    return { data: paged, total, page, pageSize, totalPages };
  },

  async getProduct(id: string): Promise<AdminProduct | null> {
    await delay();
    return products.find((p) => p.id === id) || null;
  },

  async createProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
    await delay(200);
    const newProduct: AdminProduct = {
      id: `prod_${Date.now()}`,
      sku: data.sku || `SP-NEW-${Date.now().toString(36).toUpperCase()}`,
      name: data.name || 'Untitled Product',
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'untitled',
      shortDescription: data.shortDescription || '',
      description: data.description || '',
      categoryId: data.categoryId || 'cat-1',
      categoryName: data.categoryName || 'Business Printing',
      status: data.status || 'draft',
      basePrice: data.basePrice || 0,
      compareAtPrice: data.compareAtPrice ?? null,
      costPerItem: data.costPerItem ?? null,
      taxable: data.taxable ?? true,
      trackInventory: data.trackInventory ?? true,
      stockQuantity: data.stockQuantity || 0,
      lowStockThreshold: data.lowStockThreshold || 10,
      allowBackorders: data.allowBackorders ?? false,
      images: data.images || [],
      variantOptions: data.variantOptions || [],
      variants: data.variants || [],
      tags: data.tags || [],
      collections: data.collections || [],
      brand: data.brand || 'Star Press',
      weight: data.weight ?? null,
      weightUnit: data.weightUnit || 'g',
      dimensions: data.dimensions ?? null,
      requiresShipping: data.requiresShipping ?? true,
      fragile: data.fragile ?? false,
      shippingClass: data.shippingClass || 'standard',
      seo: data.seo || { title: '', description: '', slug: '' },
      visibility: data.visibility || { onlineStore: true, pos: false, shop: false },
      featured: data.featured ?? false,
      publishedAt: data.status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products = [newProduct, ...products];
    return newProduct;
  },

  async updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct | null> {
    await delay(200);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, updatedAt: new Date().toISOString() };
    return products[idx];
  },

  async deleteProduct(id: string): Promise<boolean> {
    await delay(200);
    const len = products.length;
    products = products.filter((p) => p.id !== id);
    return products.length < len;
  },

  async duplicateProduct(id: string): Promise<AdminProduct | null> {
    await delay(200);
    const original = products.find((p) => p.id === id);
    if (!original) return null;
    const dup: AdminProduct = {
      ...original,
      id: `prod_${Date.now()}`,
      sku: `${original.sku}-COPY`,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now().toString(36)}`,
      status: 'draft',
      publishedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products = [dup, ...products];
    return dup;
  },

  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<number> {
    await delay(200);
    let count = 0;
    products = products.map((p) => {
      if (ids.includes(p.id)) {
        count++;
        return { ...p, status, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    return count;
  },

  async bulkDelete(ids: string[]): Promise<number> {
    await delay(200);
    const before = products.length;
    products = products.filter((p) => !ids.includes(p.id));
    return before - products.length;
  },

  getStats() {
    const total = products.length;
    const published = products.filter((p) => p.status === 'published').length;
    const draft = products.filter((p) => p.status === 'draft').length;
    const archived = products.filter((p) => p.status === 'archived').length;
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length;
    const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length;
    return { total, published, draft, archived, outOfStock, lowStock };
  },
};

// =============================================================================
// Order Service
// =============================================================================

export const orderService = {
  async getOrders(filters: OrderFilters = {}): Promise<PaginatedResult<AdminOrder>> {
    await delay();
    let data = [...orders];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }

    if (filters.status && filters.status !== 'all') {
      data = data.filter((o) => o.status === filters.status);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      data = data.filter((o) => o.paymentStatus === filters.paymentStatus);
    }

    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const paged = data.slice((page - 1) * pageSize, page * pageSize);

    return { data: paged, total, page, pageSize, totalPages };
  },

  async getOrder(id: string): Promise<AdminOrder | null> {
    await delay();
    return orders.find((o) => o.id === id) || null;
  },

  getStats() {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processing = orders.filter((o) => o.status === 'processing').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const refunded = orders.filter((o) => o.status === 'refunded').length;
    return { total, pending, processing, shipped, delivered, cancelled, refunded };
  },
};

// =============================================================================
// Customer Service
// =============================================================================

export const customerService = {
  async getCustomers(search?: string, page = 1, pageSize = 10): Promise<PaginatedResult<AdminCustomer>> {
    await delay();
    let data = [...customers];

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    data.sort((a, b) => b.totalSpent - a.totalSpent);

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const paged = data.slice((page - 1) * pageSize, page * pageSize);

    return { data: paged, total, page, pageSize, totalPages };
  },
};

// =============================================================================
// Category Service
// =============================================================================

export const categoryService = {
  async getCategories(): Promise<AdminCategory[]> {
    await delay();
    return [...MOCK_CATEGORIES];
  },
};

// =============================================================================
// Discount Service
// =============================================================================

export const discountService = {
  async getDiscounts(): Promise<AdminDiscount[]> {
    await delay();
    return [...MOCK_DISCOUNTS];
  },
};

// =============================================================================
// Dashboard / Analytics / Finance / Marketing / Content Services
// =============================================================================

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay();
    return { ...MOCK_DASHBOARD_STATS };
  },
};

export const analyticsService = {
  async getData(): Promise<AnalyticsData> {
    await delay();
    return { ...MOCK_ANALYTICS };
  },
};

export const financeService = {
  async getSummary(): Promise<FinanceSummary> {
    await delay();
    return { ...MOCK_FINANCE_SUMMARY };
  },
  async getTransactions(): Promise<FinanceTransaction[]> {
    await delay();
    return [...MOCK_FINANCE_TRANSACTIONS];
  },
};

export const marketingService = {
  async getCampaigns(): Promise<MarketingCampaign[]> {
    await delay();
    return [...MOCK_CAMPAIGNS];
  },
};

export const contentService = {
  async getPages(): Promise<ContentPage[]> {
    await delay();
    return [...MOCK_CONTENT];
  },
};
