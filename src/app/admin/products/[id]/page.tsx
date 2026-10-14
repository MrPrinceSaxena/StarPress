'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, Eye, Trash2, Copy, Archive, MoreHorizontal,
  Package, ImageIcon, IndianRupee, BoxSelect, Layers, Truck,
  Search as SearchIcon, Globe, Upload, X, Plus, GripVertical,
  Bold, Italic, Underline, ListOrdered, List, Link2, AlignLeft, ExternalLink,
} from 'lucide-react';
import { showToast } from '@/components/admin/ui/Toast';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import ImageUploader from '@/components/admin/ui/ImageUploader';
import InputGroup from '@/components/admin/ui/InputGroup';
import type { UploadedImage } from '@/components/admin/ui/ImageUploader';
import { productService, categoryService } from '@/lib/admin/services';
import type { AdminProduct, AdminCategory, AdminProductImage, AdminVariantOption } from '@/lib/admin/types';

const TABS = [
  { key: 'basic', label: 'Basic Info', icon: Package },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'pricing', label: 'Pricing', icon: IndianRupee },
  { key: 'inventory', label: 'Inventory', icon: BoxSelect },
  { key: 'variants', label: 'Variants', icon: Layers },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'seo', label: 'SEO', icon: SearchIcon },
  { key: 'publishing', label: 'Publishing', icon: Globe },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function ProductDetailPage({ params }: { params?: { id?: string } }) {
  const routeParams = useParams();
  const id = params?.id || (routeParams?.id as string) || '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Editable state (mirrors product fields)
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [brand, setBrand] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [taxable, setTaxable] = useState(true);
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [allowBackorders, setAllowBackorders] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [variantOptions, setVariantOptions] = useState<AdminVariantOption[]>([]);
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [fragile, setFragile] = useState(false);
  const [shippingClass, setShippingClass] = useState('standard');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState({ onlineStore: true, pos: false, shop: false });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [p, cats] = await Promise.all([productService.getProduct(id), categoryService.getCategories()]);
      setCategories(cats);
      if (p) {
        setProduct(p);
        setName(p.name);
        setShortDescription(p.shortDescription);
        setDescription(p.description);
        setSku(p.sku);
        setCategoryId(p.categoryId);
        setTags([...p.tags]);
        setBrand(p.brand);
        setBasePrice(p.basePrice.toString());
        setCompareAtPrice(p.compareAtPrice?.toString() || '');
        setCostPerItem(p.costPerItem?.toString() || '');
        setTaxable(p.taxable);
        setTrackInventory(p.trackInventory);
        setStockQuantity(p.stockQuantity.toString());
        setLowStockThreshold(p.lowStockThreshold.toString());
        setAllowBackorders(p.allowBackorders);
        setImages((p.images || []).map((img: any, i: number) => ({
          id: img.id || `img_${i}`,
          url: img.url || '',
          altText: img.altText || p.name,
          isPrimary: img.isPrimary ?? i === 0,
          position: img.position ?? i,
          storagePath: undefined,
        })));
        setVariantOptions([...p.variantOptions]);
        setWeight(p.weight?.toString() || '');
        setDimensions({
          length: p.dimensions?.length.toString() || '',
          width: p.dimensions?.width.toString() || '',
          height: p.dimensions?.height.toString() || '',
        });
        setRequiresShipping(p.requiresShipping);
        setFragile(p.fragile);
        setShippingClass(p.shippingClass);
        setSeoTitle(p.seo.title);
        setSeoDescription(p.seo.description);
        setSeoSlug(p.seo.slug);
        setStatus(p.status);
        setFeatured(p.featured);
        setVisibility({ ...p.visibility });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const updated = await productService.updateProduct(id, {
        name, shortDescription, description, sku, categoryId,
        categoryName: cat?.name || '', status, basePrice: parseFloat(basePrice) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPerItem: costPerItem ? parseFloat(costPerItem) : null,
        taxable, trackInventory, stockQuantity: parseInt(stockQuantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10, allowBackorders,
        images, variantOptions, tags, brand,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions.length ? {
          length: parseFloat(dimensions.length) || 0,
          width: parseFloat(dimensions.width) || 0,
          height: parseFloat(dimensions.height) || 0,
        } : null,
        requiresShipping, fragile, shippingClass,
        seo: { title: seoTitle, description: seoDescription, slug: seoSlug },
        visibility, featured,
      });
      if (updated) {
        setProduct(updated);
        showToast('Product saved successfully');
      } else {
        showToast('Failed to save product', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await productService.deleteProduct(id);
    showToast('Product deleted');
    router.push('/admin/products');
  };

  const handleDuplicate = async () => {
    const dup = await productService.duplicateProduct(id);
    if (dup) {
      showToast(`"${dup.name}" created as draft`);
      router.push(`/admin/products/${dup.id}`);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const inputClass = "w-full h-10 px-3.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all shadow-2xs";
  const textareaClass = "w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all shadow-2xs resize-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-3 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32 bg-white border border-[#E5E7EB] rounded-xl shadow-sm max-w-lg mx-auto">
        <Package size={44} className="mx-auto text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-900">Product Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested product could not be found or has been deleted.</p>
        <button
          onClick={() => router.push('/admin/products')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors cursor-pointer"
        >
          Return to Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/products')}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-[#E5E7EB] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{name || product.name}</h1>
              <StatusBadge status={status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {sku || '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/shop/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs cursor-pointer"
          >
            <ExternalLink size={14} /> Preview Store
          </a>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5 z-20 animate-fadeIn">
                  <button
                    onClick={() => { handleDuplicate(); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Copy size={13} className="text-slate-400" /> Duplicate Item
                  </button>
                  <button
                    onClick={() => {
                      productService.bulkUpdateStatus([id], 'archived');
                      setStatus('archived');
                      showToast('Product archived');
                      setShowActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Archive size={13} className="text-slate-400" /> Archive Item
                  </button>
                  <div className="border-t border-[#E5E7EB] my-1" />
                  <button
                    onClick={() => { setDeleteDialog(true); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 size={13} /> Delete Product
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Vertical Tabs */}
        <div className="w-full md:w-52 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 border border-[#E5E7EB] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#F5A623]' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-sm">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Basic Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Title, description, category, and identifiers.</p>
              </div>

              <InputGroup label="Product Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </InputGroup>

              <InputGroup label="Short Description" hint="Shown on product listing cards. Max 200 characters.">
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  rows={2}
                  maxLength={200}
                  className={textareaClass}
                />
              </InputGroup>

              <InputGroup label="Product Description">
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:border-[#F5A623] focus-within:ring-1 focus-within:ring-[#F5A623] transition-all">
                  <div className="flex items-center gap-0.5 px-2.5 py-1.5 bg-slate-50 border-b border-[#E5E7EB]">
                    {[Bold, Italic, Underline, ListOrdered, List, Link2, AlignLeft].map((Icon, i) => (
                      <button
                        key={i}
                        type="button"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                      >
                        <Icon size={14} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-3.5 py-2.5 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none"
                  />
                </div>
              </InputGroup>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="Category">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputClass + ' cursor-pointer'}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </InputGroup>
                <InputGroup label="SKU">
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className={inputClass}
                  />
                </InputGroup>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="Brand">
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className={inputClass}
                  />
                </InputGroup>
                <InputGroup label="Tags">
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 border border-[#E5E7EB] min-h-[40px] items-center">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-xs font-semibold text-slate-700 shadow-2xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder={tags.length === 0 ? 'Add tags…' : ''}
                      className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-1"
                    />
                  </div>
                </InputGroup>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Media</h2>
                <p className="text-xs text-slate-500 mt-0.5">Upload, delete, and re-order product photography.</p>
              </div>
              <ImageUploader
                images={images}
                onChange={setImages}
                bucket="product-images"
                folder="products"
                entityId={id}
                maxImages={10}
                maxSizeMB={5}
              />
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pricing & Margins</h2>
                <p className="text-xs text-slate-500 mt-0.5">Set selling prices, strike-through rates, and view gross profit margins.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputGroup label="Selling Price (₹)">
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className={inputClass}
                  />
                </InputGroup>
                <InputGroup label="Compare-at Price (₹)">
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className={inputClass}
                  />
                </InputGroup>
                <InputGroup label="Cost per Item (₹)">
                  <input
                    type="number"
                    value={costPerItem}
                    onChange={(e) => setCostPerItem(e.target.value)}
                    className={inputClass}
                  />
                </InputGroup>
              </div>
              {basePrice && costPerItem && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold">
                    Gross Margin: ₹{(parseFloat(basePrice) - parseFloat(costPerItem)).toFixed(0)} ({(((parseFloat(basePrice) - parseFloat(costPerItem)) / parseFloat(basePrice)) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxable}
                    onChange={(e) => setTaxable(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#F5A623]"
                  />
                  <span className="text-xs font-medium text-slate-700">Charge GST / Taxes on this product</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Stock & Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage stock count and low inventory alert triggers.</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F5A623]"
                />
                <span className="text-sm font-semibold text-slate-800">Track inventory for this product</span>
              </label>
              {trackInventory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup label="Stock Quantity">
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className={inputClass}
                    />
                  </InputGroup>
                  <InputGroup label="Low Stock Alert Threshold">
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className={inputClass}
                    />
                  </InputGroup>
                </div>
              )}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBackorders}
                  onChange={(e) => setAllowBackorders(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F5A623]"
                />
                <span className="text-sm font-medium text-slate-700">Allow backorders when stock runs out</span>
              </label>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Variants</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure attributes such as sizes, finishes, paper weights, or colors.</p>
              </div>
              {variantOptions.map((opt, idx) => (
                <div key={idx} className="p-4.5 rounded-xl bg-slate-50/70 border border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <InputGroup label={`Option ${idx + 1}`}>
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const u = [...variantOptions];
                          u[idx] = { ...u[idx], name: e.target.value };
                          setVariantOptions(u);
                        }}
                        placeholder="e.g. Size, Color"
                        className={inputClass + ' max-w-xs'}
                      />
                    </InputGroup>
                    <button
                      type="button"
                      onClick={() => setVariantOptions(variantOptions.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white border border-[#E5E7EB] min-h-[40px] items-center">
                    {opt.values.map((val) => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => {
                            const u = [...variantOptions];
                            u[idx] = { ...u[idx], values: u[idx].values.filter((v) => v !== val) };
                            setVariantOptions(u);
                          }}
                          className="hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add value…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !opt.values.includes(val)) {
                            const u = [...variantOptions];
                            u[idx] = { ...u[idx], values: [...u[idx].values, val] };
                            setVariantOptions(u);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-1"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVariantOptions([...variantOptions, { name: '', values: [] }])}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:text-black bg-slate-100 hover:bg-slate-200 border border-[#E5E7EB] transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Option
              </button>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Shipping & Dimensions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Package specs used for automated shipping calculators.</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresShipping}
                  onChange={(e) => setRequiresShipping(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F5A623]"
                />
                <span className="text-sm font-semibold text-slate-800">Requires physical shipping</span>
              </label>
              {requiresShipping && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup label="Weight (grams)">
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className={inputClass}
                      />
                    </InputGroup>
                    <InputGroup label="Shipping Class">
                      <select
                        value={shippingClass}
                        onChange={(e) => setShippingClass(e.target.value)}
                        className={inputClass + ' cursor-pointer'}
                      >
                        <option value="standard">Standard Delivery</option>
                        <option value="oversized">Oversized / Bulk Parcel</option>
                        <option value="fragile">Fragile Goods</option>
                        <option value="express">Same-Day Express</option>
                      </select>
                    </InputGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <InputGroup label="Length (cm)">
                      <input
                        type="number"
                        value={dimensions.length}
                        onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                        className={inputClass}
                      />
                    </InputGroup>
                    <InputGroup label="Width (cm)">
                      <input
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                        className={inputClass}
                      />
                    </InputGroup>
                    <InputGroup label="Height (cm)">
                      <input
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                        className={inputClass}
                      />
                    </InputGroup>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fragile}
                      onChange={(e) => setFragile(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#F5A623]"
                    />
                    <span className="text-sm font-medium text-slate-700">Mark as fragile / handle with care</span>
                  </label>
                </>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Search Engine Optimization (SEO)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control how this product looks in Google search results.</p>
              </div>
              <InputGroup label="SEO Title" hint={`${(seoTitle || name).length}/60 characters`}>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={name}
                  maxLength={60}
                  className={inputClass}
                />
              </InputGroup>
              <InputGroup label="Meta Description" hint={`${seoDescription.length}/160 characters`}>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  maxLength={160}
                  className={textareaClass}
                />
              </InputGroup>
              <InputGroup label="URL Slug">
                <div className="flex">
                  <span className="h-10 px-3.5 flex items-center rounded-l-xl bg-slate-50 border border-r-0 border-[#E5E7EB] text-xs font-mono text-slate-500">
                    starpress.in/shop/
                  </span>
                  <input
                    type="text"
                    value={seoSlug}
                    onChange={(e) => setSeoSlug(e.target.value)}
                    className={inputClass + ' rounded-l-none'}
                  />
                </div>
              </InputGroup>
              <div className="p-4.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search Engine Snippet Preview</p>
                <p className="text-sm font-bold text-blue-700 hover:underline cursor-pointer truncate">
                  {seoTitle || name} | Star Press India
                </p>
                <p className="text-xs text-emerald-700 font-mono">starpress.in/shop/{seoSlug}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {seoDescription || shortDescription || 'High quality printing delivered nationwide from Star Press.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'publishing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Publishing & Sales Channels</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control live storefront availability and featured product placement.</p>
              </div>
              <InputGroup label="Product Status">
                <div className="flex items-center gap-4 pt-1">
                  {(['draft', 'published', 'archived'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        checked={status === s}
                        onChange={() => setStatus(s)}
                        className="accent-[#F5A623]"
                      />
                      <StatusBadge status={s} size="md" />
                    </label>
                  ))}
                </div>
              </InputGroup>
              <InputGroup label="Sales Channels">
                <div className="space-y-2.5 pt-1">
                  {([
                    { key: 'onlineStore', label: 'Online Storefront (Web & Mobile)' },
                    { key: 'pos', label: 'Counter Point of Sale (POS)' },
                    { key: 'shop', label: 'WhatsApp Catalog & Direct Shop' },
                  ] as const).map((ch) => (
                    <label key={ch.key} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibility[ch.key]}
                        onChange={(e) => setVisibility({ ...visibility, [ch.key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-[#F5A623]"
                      />
                      <span className="text-xs font-medium text-slate-700">{ch.label}</span>
                    </label>
                  ))}
                </div>
              </InputGroup>
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#F5A623]"
                  />
                  <span className="text-sm font-semibold text-slate-800">Featured product on home page</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialog}
        title="Delete Product"
        message={`Delete "${name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  );
}
