// =============================================================================
// StarPress Admin Panel — TypeScript Type Definitions
// =============================================================================

// --- Enums / Union Types ---

export type ProductStatus = 'draft' | 'published' | 'archived';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned';
export type DiscountType = 'percentage' | 'fixed';
export type CustomerStatus = 'active' | 'inactive';

// --- Product Types ---

export interface AdminProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  position: number;
}

export interface AdminVariantOption {
  name: string;
  values: string[];
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  options: Record<string, string>;
  status: 'active' | 'inactive';
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: ProductStatus;
  basePrice: number;
  compareAtPrice: number | null;
  costPerItem: number | null;
  taxable: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  allowBackorders: boolean;
  images: AdminProductImage[];
  variantOptions: AdminVariantOption[];
  variants: AdminProductVariant[];
  tags: string[];
  collections: string[];
  brand: string;
  weight: number | null;
  weightUnit: 'g' | 'kg';
  dimensions: { length: number; width: number; height: number } | null;
  requiresShipping: boolean;
  fragile: boolean;
  shippingClass: string;
  seo: { title: string; description: string; slug: string };
  visibility: { onlineStore: boolean; pos: boolean; shop: boolean };
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Category ---

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  parentId: string | null;
}

// --- Order Types ---

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  items: AdminOrderItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  status: OrderStatus;
  shippingAddress: string;
  notes: string;
}

// --- Customer ---

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  status: CustomerStatus;
  createdAt: string;
  address: string;
  avatar: string | null;
}

// --- Discount ---

export interface AdminDiscount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  usageCount: number;
  usageLimit: number | null;
  minOrderAmount: number | null;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'expired' | 'disabled';
  applicableTo: 'all' | 'specific';
}

// --- Dashboard / Analytics ---

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalProducts: number;
  productsChange: number;
  totalCustomers: number;
  customersChange: number;
  averageOrderValue: number;
  aovChange: number;
  conversionRate: number;
  conversionChange: number;
}

export interface AnalyticsData {
  revenueByMonth: { month: string; revenue: number; orders: number }[];
  topProducts: { name: string; revenue: number; orders: number }[];
  topCategories: { name: string; revenue: number; percentage: number }[];
  customerGrowth: { month: string; newCustomers: number; returning: number }[];
}

// --- Finance ---

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'sale' | 'refund' | 'payout' | 'adjustment';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  netSales: number;
  totalRefunds: number;
  totalTax: number;
  totalPayouts: number;
  pendingPayouts: number;
}

// --- Marketing ---

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'promotion';
  status: 'active' | 'paused' | 'completed' | 'draft';
  startDate: string;
  endDate: string | null;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
  budget: number;
}

// --- Content ---

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  type: 'page' | 'blog' | 'banner' | 'collection' | 'navigation';
  status: 'published' | 'draft';
  updatedAt: string;
  author: string;
  views: number;
}

// --- Service Layer Interfaces ---

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | 'all';
  category?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'name' | 'price' | 'stock' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
