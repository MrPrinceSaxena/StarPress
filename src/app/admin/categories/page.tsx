'use client';

// =============================================================================
// /admin/categories — Full Category Management for StarPress
// Features: List, Create, Edit, Delete (safe reassignment), Reorder, Image upload
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderPlus, Search, Edit3, Trash2, ExternalLink,
  Layers, Package, X, Check, Loader2, ArrowUpDown,
  MoveUp, MoveDown, Image as ImageIcon, Sparkles, RefreshCw
} from 'lucide-react';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import EmptyState from '@/components/admin/ui/EmptyState';
import ImageUploader, { UploadedImage } from '@/components/admin/ui/ImageUploader';
import { showToast } from '@/components/admin/ui/Toast';
import { categoryService } from '@/lib/admin/services';
import type { AdminCategory } from '@/lib/admin/types';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

const INITIAL_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(INITIAL_FORM);
  const [formSaving, setFormSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, search]);

  // Overall stats
  const totalProductsCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  }, [categories]);

  const categoriesWithImage = useMemo(() => {
    return categories.filter((c) => Boolean(c.imageUrl)).length;
  }, [categories]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      ...INITIAL_FORM,
      displayOrder: categories.length + 1,
    });
    setAutoSlug(true);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      displayOrder: cat.displayOrder ?? 0,
    });
    setAutoSlug(false);
    setIsModalOpen(true);
  };

  // Handle Name Change with auto-slug
  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug
        ? val
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        : prev.slug,
    }));
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setFormSaving(true);
    try {
      if (editingCategory) {
        // Update
        const updated = await categoryService.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl.trim() || null,
        });

        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
        showToast(`Category "${updated.name}" updated successfully`, 'success');
      } else {
        // Create
        const created = await categoryService.createCategory({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl.trim() || undefined,
        });

        setCategories((prev) => [...prev, created]);
        showToast(`Category "${created.name}" created successfully`, 'success');
      }

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData(INITIAL_FORM);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save category', 'error');
    } finally {
      setFormSaving(false);
    }
  };

  // Delete Category
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const ok = await categoryService.deleteCategory(deleteTarget.id);
      if (ok) {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        showToast(
          `Category "${deleteTarget.name}" deleted. Any assigned products were moved to Uncategorized.`,
          'success'
        );
      } else {
        showToast('Failed to delete category', 'error');
      }
    } catch {
      showToast('Error deleting category', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // Reorder Category (move up or down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update display orders
    const payload = reordered.map((cat, i) => ({
      id: cat.id,
      displayOrder: i + 1,
    }));

    // Optimistic UI update
    setCategories(
      reordered.map((cat, i) => ({
        ...cat,
        displayOrder: i + 1,
      }))
    );

    try {
      await categoryService.reorderCategories(payload);
      showToast('Category order updated', 'success');
    } catch {
      showToast('Failed to save category order', 'error');
      loadCategories(); // revert
    }
  };

  // Convert single imageUrl into UploadedImage array for ImageUploader
  const uploaderImages: UploadedImage[] = useMemo(() => {
    if (!formData.imageUrl) return [];
    return [
      {
        id: 'cat-img',
        url: formData.imageUrl,
        altText: formData.name || 'Category Image',
        isPrimary: true,
        position: 0,
      },
    ];
  }, [formData.imageUrl, formData.name]);

  const handleImageChange = (imgs: UploadedImage[]) => {
    if (imgs.length > 0) {
      setFormData((prev) => ({ ...prev, imageUrl: imgs[0].url }));
    } else {
      setFormData((prev) => ({ ...prev, imageUrl: '' }));
    }
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="text-xs text-text-muted hover:text-white transition-colors"
            >
              Products
            </Link>
            <span className="text-xs text-text-muted">/</span>
            <span className="text-xs text-brand-yellow font-medium">Categories</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Categories</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Organize products into customer-facing catalog categories and navigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCategories()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors disabled:opacity-50"
            title="Refresh categories"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm"
          >
            <FolderPlus size={15} />
            Add Category
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">Total Categories</p>
            <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
            <Layers size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">Total Products Cataloged</p>
            <p className="text-2xl font-bold text-white mt-1">{totalProductsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Package size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">With Banner Images</p>
            <p className="text-2xl font-bold text-white mt-1">{categoriesWithImage}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ImageIcon size={20} />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border-subtle rounded-xl p-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search categories by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-text-muted hover:text-white px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-text-muted gap-3">
            <Loader2 size={32} className="animate-spin text-brand-yellow" />
            <p className="text-sm">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            title={search ? 'No matching categories' : 'No categories yet'}
            description={
              search
                ? `No category found matching "${search}".`
                : 'Create your first product category to organize your StarPress store catalog.'
            }
            action={
              <button
                onClick={search ? () => setSearch('') : handleOpenCreate}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
              >
                {search ? 'Clear Search' : 'Add Category'}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-white/[0.02] text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">Order</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {filteredCategories.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Reorder Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-text-muted hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move up"
                        >
                          <MoveUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === filteredCategories.length - 1}
                          className="p-1 rounded text-text-muted hover:text-white hover:bg-white/[0.08] disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move down"
                        >
                          <MoveDown size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Category Name & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center">
                          {cat.imageUrl ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-text-muted/40" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-brand-yellow transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            Order: #{cat.displayOrder ?? idx + 1}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-text-secondary bg-white/[0.04] px-2 py-1 rounded border border-white/[0.06]">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-text-muted truncate">
                        {cat.description || <span className="italic opacity-50">No description</span>}
                      </p>
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/products?category=${encodeURIComponent(cat.name)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-text-secondary hover:text-white hover:bg-white/[0.08] border border-border-subtle transition-colors"
                      >
                        <Package size={12} />
                        <span>{cat.productCount ?? 0}</span>
                      </Link>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/category/${cat.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="View on store"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-yellow hover:bg-white/[0.06] transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F1420] border border-border-subtle rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                  {editingCategory ? <Edit3 size={16} /> : <FolderPlus size={16} />}
                </div>
                <h2 className="text-base font-semibold text-white">
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'Create New Category'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Invitation Cards"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    URL Slug <span className="text-red-400">*</span>
                  </label>
                  {!editingCategory && (
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className={`text-[11px] font-medium transition-colors ${
                        autoSlug ? 'text-brand-yellow' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {autoSlug ? '✓ Auto-generated' : 'Custom'}
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-white/[0.04] border border-border-subtle rounded-lg overflow-hidden focus-within:border-brand-yellow/50 transition-colors">
                  <span className="px-3 py-2 text-xs text-text-muted border-r border-border-subtle select-none font-mono">
                    /category/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="wedding-cards"
                    value={formData.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setFormData((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this category for your shoppers and search engines..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 transition-colors resize-none"
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Category Banner Image
                </label>
                <p className="text-xs text-text-muted mb-2.5">
                  Upload an image from your computer to automatically store it in Supabase Storage.
                </p>
                <ImageUploader
                  images={uploaderImages}
                  onChange={handleImageChange}
                  bucket="product-images"
                  folder="categories"
                  entityId={editingCategory?.id || 'new-category'}
                  maxImages={1}
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSaving}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {formSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    'Save Changes'
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete Category "${deleteTarget?.name}"?`}
        message={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `This category contains ${deleteTarget.productCount} product(s). Deleting it will reassign all these products to the "Uncategorized" category so they are never lost.`
            : 'Are you sure you want to delete this category? This action cannot be undone.'
        }
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete Category'}
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
