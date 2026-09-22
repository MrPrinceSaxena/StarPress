"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Loader2,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  IndianRupee,
  ShieldAlert,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuthSession } from "@/hooks/useAuthSession";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryName: string;
  categorySlug: string;
  status: "draft" | "published" | "archived";
  basePrice: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  marginPercent?: number | null;
  images: Array<{ url: string; altText?: string | null; isPrimary: boolean }>;
  createdAt: string;
}

function ProductsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, status, isHydrated, isAdmin } = useAuthSession();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, lowStock: 0 });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedStock, setSelectedStock] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch {
        // ignore
      }
    }
    loadCategories();
  }, []);

  // Fetch Products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: search.trim(),
        category: selectedCategory,
        status: selectedStatus,
        stockStatus: selectedStock,
      });

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalCount(data.total || data.products.length);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load admin products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedStatus, selectedStock, currentPage]);

  // Handle Search on Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Quick Status Toggle
  const handleToggleStatus = async (product: ProductItem) => {
    const nextStatus = product.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
        );
        showToast(`Status updated to ${nextStatus.toUpperCase()}`);
      }
    } catch {
      showToast("Failed to update status.");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setTotalCount((c) => Math.max(0, c - 1));
        showToast(`Deleted "${name}"`);
      }
    } catch {
      showToast("Failed to delete product.");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (!isHydrated || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
        <Loader2 size={32} className="animate-spin text-brand-yellow" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07090E] text-white">
        <AdminHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-4">
            <ShieldAlert size={28} className="text-rose-400 mx-auto" />
            <h1 className="font-display font-black text-xl text-white">Administrator Access Required</h1>
            <p className="text-xs text-slate-300">
              This console is restricted to Star Press administrative personnel.
            </p>
            <Link
              href="/admin/login"
              className="px-5 py-2.5 rounded-full bg-brand-yellow text-black text-xs font-bold inline-block"
            >
              Sign In to Admin Portal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07090E] text-white selection:bg-brand-yellow selection:text-black">
      <AdminHeader activeSection="products" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0F1422] border border-brand-cyan/40 text-brand-cyan text-xs font-semibold shadow-2xl backdrop-blur-xl">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Admin Operations</span>
              <span>/</span>
              <span className="text-brand-yellow font-semibold">Product Catalog</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
              Product Management System
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage printing specifications, dynamic pricing, inventory, and visibility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchProducts()}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Refresh Catalog Data"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/admin/products/new"
              className="px-4 py-2.5 rounded-xl bg-brand-yellow hover:bg-[#FFE04D] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(255,224,77,0.2)] hover:shadow-[0_4px_24px_rgba(255,224,77,0.35)]"
            >
              <Plus size={16} />
              <span>Create Product</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-xl p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Total Products
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display font-black text-2xl text-white">{stats.total}</span>
              <span className="text-[10px] text-brand-yellow font-mono font-medium">Catalog live</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-xl p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Published Active
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display font-black text-2xl text-emerald-400">{stats.published}</span>
              <span className="text-[10px] text-emerald-400/80 font-mono font-medium">Visible to users</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-xl p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Draft / Hidden
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display font-black text-2xl text-amber-300">{stats.draft}</span>
              <span className="text-[10px] text-amber-400/80 font-mono font-medium">In preparation</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-xl p-4 sm:p-5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Low Stock Alerts
            </span>
            <div className="flex items-baseline justify-between">
              <span className={`font-display font-black text-2xl ${stats.lowStock > 0 ? "text-rose-400" : "text-slate-300"}`}>
                {stats.lowStock}
              </span>
              <span className="text-[10px] text-rose-400/80 font-mono font-medium">&le; 10 units</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by SKU, name, or keywords…"
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 outline-none transition-all"
              />
            </form>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-yellow"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-yellow"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStock}
              onChange={(e) => {
                setSelectedStock(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-yellow"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low_stock">Low Stock (&le;10)</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase font-mono tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">SKU & Product</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Price</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Stock</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="animate-spin text-brand-yellow" />
                        <span>Loading product inventory…</span>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Package size={32} className="mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold text-sm text-white">No products found</p>
                      <p className="text-xs text-slate-500 mt-1">Try resetting your search or filters.</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLowStock = p.stockQuantity <= 10 && p.stockQuantity > 0;
                    const isOutStock = p.stockQuantity <= 0;
                    const primaryImg = p.images?.[0]?.url || "/images/placeholder-product.png";

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                        onClick={() => router.push(`/admin/products/${p.id}`)}
                      >
                        {/* Name & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/10 overflow-hidden relative shrink-0">
                              <Image
                                src={primaryImg}
                                alt={p.name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col max-w-[260px] sm:max-w-xs">
                              <span className="font-semibold text-white group-hover:text-brand-yellow transition-colors truncate">
                                {p.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 tracking-wider">
                                {p.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
                            {p.categoryName}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-white">
                              ₹{p.basePrice.toLocaleString("en-IN")}
                            </span>
                            {p.compareAtPrice && (
                              <span className="text-[10px] text-slate-500 line-through">
                                ₹{p.compareAtPrice.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isOutStock
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : isLowStock
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {p.stockQuantity} in stock
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td
                          className="py-3.5 px-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all ${
                              p.status === "published"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                : "bg-slate-500/15 text-slate-400 border border-slate-500/30 hover:bg-slate-500/25"
                            }`}
                            title="Click to toggle Draft / Published"
                          >
                            {p.status}
                          </button>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View on Public Store */}
                            <a
                              href={`/shop/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-yellow hover:bg-white/5 transition-colors"
                              title="View on Public Storefront"
                            >
                              <ExternalLink size={14} />
                            </a>

                            {/* Edit */}
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                              title="Edit Product Details"
                            >
                              <Edit3 size={14} />
                            </Link>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              disabled={isDeletingId === p.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                              title="Delete Product"
                            >
                              {isDeletingId === p.id ? (
                                <Loader2 size={14} className="animate-spin text-rose-400" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-white">{products.length}</span> of{" "}
              <span className="font-semibold text-white">{totalCount}</span> products
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || isLoading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-medium flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <span className="font-mono text-xs px-2 text-white">Page {currentPage}</span>
              <button
                disabled={products.length < 20 || isLoading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-medium flex items-center gap-1 transition-all"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
          <Loader2 size={32} className="animate-spin text-brand-yellow" />
        </div>
      }
    >
      <ProductsListContent />
    </Suspense>
  );
}
