'use client';

// =============================================================================
// /admin/categories — Full Category Management for StarPress
// Features: List, Create, Edit, Delete (safe reassignment), Reorder, Image upload
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/products"
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              Products
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-[#F5A623] font-semibold">Categories</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight mt-1">Categories</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Organize products into customer-facing catalog categories and navigation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadCategories()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 bg-white border border-[#E5E7EB] shadow-xs transition-colors disabled:opacity-50"
            title="Refresh categories"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#F5A623]' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-colors shadow-sm"
          >
            <FolderPlus size={15} />
            Add Category
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Categories</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{categories.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F5A623]">
            <Layers size={20} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Products Cataloged</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{totalProductsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Package size={20} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">With Banner Images</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{categoriesWithImage}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ImageIcon size={20} />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-sm">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F5A623] transition-colors"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-[#F5A623]" />
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-colors shadow-sm"
              >
                {search ? 'Clear Search' : 'Add Category'}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">Order</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Products</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {filteredCategories.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Reorder Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move up"
                        >
                          <MoveUp size={12} />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === filteredCategories.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent"
                          title="Move down"
                        >
                          <MoveDown size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Category Name & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                          {cat.imageUrl ? (
                            <Image
                              src={cat.imageUrl}
                              alt={cat.name}
                              width={44}
                              height={44}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-[#F5A623] transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Order: #{cat.displayOrder ?? idx + 1}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-[#E5E7EB]">
                        {cat.slug}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-slate-500 truncate">
                        {cat.description || <span className="italic opacity-50">No description</span>}
                      </p>
                    </td>

                    {/* Products Count */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/products?category=${encodeURIComponent(cat.name)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 border border-[#E5E7EB] transition-colors"
                      >
                        <Package size={12} className="text-slate-500" />
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="View on store"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#F5A623] hover:bg-slate-100 transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#F5A623]">
                  {editingCategory ? <Edit3 size={16} /> : <FolderPlus size={16} />}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingCategory ? `Edit "${editingCategory.name}"` : 'Create New Category'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Invitation Cards"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F5A623] transition-colors"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    URL Slug <span className="text-rose-500">*</span>
                  </label>
                  {!editingCategory && (
                    <button
                      type="button"
                      onClick={() => setAutoSlug(!autoSlug)}
                      className={`text-[11px] font-semibold transition-colors ${
                        autoSlug ? 'text-[#F5A623]' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {autoSlug ? '✓ Auto-generated' : 'Custom'}
                    </button>
                  )}
                </div>
                <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:border-[#F5A623] focus-within:bg-white transition-colors">
                  <span className="px-3 py-2 text-xs text-slate-400 border-r border-[#E5E7EB] select-none font-mono">
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
                    className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this category for your shoppers and search engines..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F5A623] transition-colors resize-none"
                />
              </div>

              {/* Category Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category Banner Image
                </label>
                <p className="text-xs text-slate-500 mb-2.5">
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
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-colors disabled:opacity-50 shadow-sm"
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
