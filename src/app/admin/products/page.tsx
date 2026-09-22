'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, Download, Upload, MoreHorizontal,
  Copy, Archive, Trash2, Edit3, Eye, Package, IndianRupee,
  ShoppingCart, Users, Grid3X3, List, X, ChevronDown,
} from 'lucide-react';
import StatCard from '@/components/admin/ui/StatCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import EmptyState from '@/components/admin/ui/EmptyState';
import { showToast } from '@/components/admin/ui/Toast';
import { productService, categoryService } from '@/lib/admin/services';
import type { AdminProduct, AdminCategory, ProductStatus } from '@/lib/admin/types';

type StatusTab = 'all' | ProductStatus | 'out_of_stock';

export default function ProductsPage() {
  const router = useRouter();

  // Data state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'created' | 'name' | 'price' | 'stock'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[]; loading: boolean }>({ open: false, ids: [], loading: false });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Product stats
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => productService.getStats(), [products]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = statusTab === 'out_of_stock' ? 'all' : statusTab;
      const stockFilter = statusTab === 'out_of_stock' ? 'out_of_stock' : 'all';
      const result = await productService.getProducts({
        search,
        status: statusFilter as ProductStatus | 'all',
        category: selectedCategory,
        stockStatus: stockFilter as 'all' | 'out_of_stock',
        sortBy,
        sortOrder,
        page,
        pageSize: 10,
      });
      setProducts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [search, statusTab, selectedCategory, sortBy, sortOrder, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusTab, selectedCategory]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // Actions
  const handleDelete = async () => {
    setDeleteDialog((d) => ({ ...d, loading: true }));
    const count = await productService.bulkDelete(deleteDialog.ids);
    setDeleteDialog({ open: false, ids: [], loading: false });
    setSelectedIds(new Set());
    showToast(`${count} product${count !== 1 ? 's' : ''} deleted`);
    loadProducts();
  };

  const handleDuplicate = async (id: string) => {
    const dup = await productService.duplicateProduct(id);
    if (dup) {
      showToast(`"${dup.name}" created as draft`);
      loadProducts();
    }
  };

  const handleBulkStatusChange = async (status: ProductStatus) => {
    const count = await productService.bulkUpdateStatus([...selectedIds], status);
    setSelectedIds(new Set());
    showToast(`${count} product${count !== 1 ? 's' : ''} set to ${status}`);
    loadProducts();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN').format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'published', label: 'Active', count: stats.published },
    { key: 'draft', label: 'Drafts', count: stats.draft },
    { key: 'out_of_stock', label: 'Out of Stock', count: stats.outOfStock },
    { key: 'archived', label: 'Archived', count: stats.archived },
  ];

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage your products, inventory, pricing and availability across StarPress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors">
            <Download size={14} />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors">
            <Upload size={14} />
            Import
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} title="Total Products" value={stats.total.toLocaleString()} change={4.2} iconColor="text-brand-yellow" />
        <StatCard icon={IndianRupee} title="Total Revenue" value={`₹${formatPrice(2847500)}`} change={12.5} iconColor="text-emerald-400" />
        <StatCard icon={ShoppingCart} title="Total Orders" value="342" change={-1.4} iconColor="text-blue-400" />
        <StatCard icon={Users} title="Customers" value="1,890" change={8.7} iconColor="text-purple-400" />
      </div>

      {/* Toolbar: Search + Filters + View Toggle + Status Tabs */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        {/* Search + Filter Row */}
        <div className="flex items-center gap-3 p-3 border-b border-border-subtle">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by product name, SKU or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              showFilters
                ? 'border-brand-yellow/30 bg-brand-yellow/10 text-brand-yellow'
                : 'border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Filter size={14} />
            Filter
          </button>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-white/[0.03] border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-brand-yellow/30 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as typeof sortBy);
                setSortOrder(so as typeof sortOrder);
              }}
              className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-white/[0.03] border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-brand-yellow/30 transition-colors cursor-pointer"
            >
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock-asc">Stock: Low to High</option>
              <option value="stock-desc">Stock: High to Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-border-subtle rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white'}`}
              aria-label="Grid view"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-white'}`}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusTab === tab.key
                  ? 'bg-white/[0.08] text-white'
                  : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Product Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={search ? `No products match "${search}"` : 'Start by adding your first product'}
            action={
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
              >
                <Plus size={14} />
                Add Product
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border-strong bg-transparent accent-brand-yellow cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Product</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">ID &amp; Created</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Price</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Stock</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                      selectedIds.has(product.id) ? 'bg-brand-yellow/[0.03]' : ''
                    }`}
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-border-strong bg-transparent accent-brand-yellow cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-border-subtle flex items-center justify-center text-text-muted shrink-0 overflow-hidden">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate max-w-[240px]">{product.name}</div>
                          <div className="text-[11px] text-text-muted truncate">{product.categoryName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-mono text-text-secondary">{product.sku}</div>
                      <div className="text-[11px] text-text-muted">{formatDate(product.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-white">₹{formatPrice(product.basePrice)}</div>
                      {product.compareAtPrice && (
                        <div className="text-[11px] text-text-muted line-through">₹{formatPrice(product.compareAtPrice)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className={`text-sm font-medium ${
                        product.stockQuantity === 0 ? 'text-rose-400' :
                        product.stockQuantity <= product.lowStockThreshold ? 'text-amber-400' :
                        'text-white'
                      }`}>
                        {product.stockQuantity.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={product.stockQuantity === 0 ? 'out_of_stock' : product.status} />
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === product.id ? null : product.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                          aria-label="Actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {actionMenuId === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-bg-surface border border-border-subtle rounded-xl shadow-elevation-md py-1 z-20 animate-fadeIn">
                              <button
                                onClick={() => { router.push(`/admin/products/${product.id}`); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                              >
                                <Edit3 size={13} /> Edit Product
                              </button>
                              <button
                                onClick={() => { window.open(`/shop/${product.slug}`, '_blank'); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                              >
                                <Eye size={13} /> Preview Storefront
                              </button>
                              <button
                                onClick={() => { handleDuplicate(product.id); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                              >
                                <Copy size={13} /> Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  productService.bulkUpdateStatus([product.id], 'archived');
                                  showToast(`"${product.name}" archived`);
                                  loadProducts();
                                  setActionMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                              >
                                <Archive size={13} /> Archive
                              </button>
                              <div className="border-t border-border-subtle my-1" />
                              <button
                                onClick={() => { setDeleteDialog({ open: true, ids: [product.id], loading: false }); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-3 border-t border-border-subtle">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-bg-surface border border-border-subtle rounded-2xl shadow-elevation-md animate-fadeIn">
          <span className="text-sm font-medium text-white">
            {selectedIds.size} Selected
          </span>
          <div className="w-px h-5 bg-border-subtle" />
          <button
            onClick={() => showToast('Export started for selected products')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => handleBulkStatusChange('published')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Eye size={13} /> Publish
          </button>
          <button
            onClick={() => handleBulkStatusChange('draft')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Edit3 size={13} /> Draft
          </button>
          <button
            onClick={() => handleBulkStatusChange('archived')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Archive size={13} /> Archive
          </button>
          <button
            onClick={() => setDeleteDialog({ open: true, ids: [...selectedIds], loading: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={13} /> Delete
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Products"
        message={`Are you sure you want to delete ${deleteDialog.ids.length} product${deleteDialog.ids.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, ids: [], loading: false })}
        loading={deleteDialog.loading}
      />
    </div>
  );
}
