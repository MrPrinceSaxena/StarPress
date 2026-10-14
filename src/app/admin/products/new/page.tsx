'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Eye, Package, ImageIcon, IndianRupee,
  BoxSelect, Layers, Truck, Search as SearchIcon, Globe, Upload, X,
  Plus, Trash2, GripVertical, Bold, Italic, Underline, ListOrdered,
  List, Link2, AlignLeft,
} from 'lucide-react';
import { showToast } from '@/components/admin/ui/Toast';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import ImageUploader from '@/components/admin/ui/ImageUploader';
import type { UploadedImage } from '@/components/admin/ui/ImageUploader';
import { productService, categoryService } from '@/lib/admin/services';
import type { AdminProduct, AdminCategory, AdminProductImage, AdminVariantOption, AdminProductVariant } from '@/lib/admin/types';

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

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [brand, setBrand] = useState('Star Press');

  // Media
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Pricing
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [taxable, setTaxable] = useState(true);

  // Inventory
  const [trackInventory, setTrackInventory] = useState(true);
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [allowBackorders, setAllowBackorders] = useState(false);

  // Variants
  const [variantOptions, setVariantOptions] = useState<AdminVariantOption[]>([]);
  const [variants, setVariants] = useState<AdminProductVariant[]>([]);

  // Shipping
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [requiresShipping, setRequiresShipping] = useState(true);
  const [fragile, setFragile] = useState(false);
  const [shippingClass, setShippingClass] = useState('standard');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoSlug, setSeoSlug] = useState('');

  // Publishing
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState({ onlineStore: true, pos: false, shop: false });

  // Load categories
  React.useEffect(() => {
    categoryService.getCategories().then(setCategories);
  }, []);

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!seoSlug || seoSlug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
      setSeoSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (publishStatus: 'draft' | 'published' = status) => {
    if (!name.trim()) {
      showToast('Product name is required', 'error');
      setActiveTab('basic');
      return;
    }
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      const product = await productService.createProduct({
        name, sku, slug: seoSlug || name.toLowerCase().replace(/\s+/g, '-'),
        shortDescription, description, categoryId,
        categoryName: cat?.name || 'Business Printing',
        status: publishStatus,
        basePrice: parseFloat(basePrice) || 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPerItem: costPerItem ? parseFloat(costPerItem) : null,
        taxable, trackInventory,
        stockQuantity: parseInt(stockQuantity) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        allowBackorders, images, variantOptions, variants,
        tags, brand,
        weight: weight ? parseFloat(weight) : null, weightUnit: 'g',
        dimensions: dimensions.length ? {
          length: parseFloat(dimensions.length) || 0,
          width: parseFloat(dimensions.width) || 0,
          height: parseFloat(dimensions.height) || 0,
        } : null,
        requiresShipping, fragile, shippingClass,
        seo: { title: seoTitle || name, description: seoDescription, slug: seoSlug },
        visibility, featured,
      });
      showToast(`"${product.name}" ${publishStatus === 'published' ? 'published' : 'saved as draft'}`);
      router.push('/admin/products');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const addVariantOption = () => {
    setVariantOptions([...variantOptions, { name: '', values: [] }]);
  };

  // Product ID for organizing uploads — use a temp ID for new products
  const [tempEntityId] = useState(() => `new-${Date.now().toString(36)}`);

  const InputGroup = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );

  const inputClass = "w-full h-10 px-3.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all shadow-2xs";
  const textareaClass = "w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all shadow-2xs resize-none";

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Product</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create a new product for your printing catalog</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <Save size={14} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Eye size={14} />
            {saving ? 'Saving…' : 'Publish Product'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation (Vertical) */}
        <div className="w-full md:w-52 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
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
          {/* BASIC INFO */}
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
                  placeholder="e.g. Premium Matte Business Cards"
                  className={inputClass}
                />
              </InputGroup>

              <InputGroup label="Short Description" hint="Shown on product listing cards. Max 200 characters.">
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief summary for catalog previews…"
                  rows={2}
                  maxLength={200}
                  className={textareaClass}
                />
              </InputGroup>

              <InputGroup label="Product Description">
                {/* Simple rich text toolbar */}
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
                    placeholder="Full product description, specs, finish details, and paper grammage…"
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
                    placeholder="SP-BC-001"
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
                      placeholder={tags.length === 0 ? 'Add tags (press Enter)…' : ''}
                      className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-1"
                    />
                  </div>
                </InputGroup>
              </div>
            </div>
          )}

          {/* MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Media</h2>
                <p className="text-xs text-slate-500 mt-0.5">Upload photos, mockups, or print guides for this item.</p>
              </div>
              <ImageUploader
                images={images}
                onChange={setImages}
                bucket="product-images"
                folder="products"
                entityId={tempEntityId}
                maxImages={10}
                maxSizeMB={5}
              />
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pricing & Margins</h2>
                <p className="text-xs text-slate-500 mt-0.5">Set selling prices, strike-through rates, and track gross margin.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputGroup label="Selling Price (₹)">
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="499"
                    className={inputClass}
                  />
                </InputGroup>
                <InputGroup label="Compare-at Price (₹)" hint="Strike-through regular MRP">
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="799"
                    className={inputClass}
                  />
                </InputGroup>
                <InputGroup label="Cost per Item (₹)" hint="For profit margin tracking">
                  <input
                    type="number"
                    value={costPerItem}
                    onChange={(e) => setCostPerItem(e.target.value)}
                    placeholder="180"
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

          {/* INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Stock & Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure tracking thresholds, warehouse quantities, and backorders.</p>
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
                <span className="text-sm font-medium text-slate-700">Allow customer backorders when out of stock</span>
              </label>
            </div>
          )}

          {/* VARIANTS */}
          {activeTab === 'variants' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Product Variants</h2>
                <p className="text-xs text-slate-500 mt-0.5">Add options like paper GSM, lamination finish, or card corner styles.</p>
              </div>
              {variantOptions.map((opt, idx) => (
                <div key={idx} className="p-4.5 rounded-xl bg-slate-50/70 border border-[#E5E7EB] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <InputGroup label={`Option ${idx + 1}`}>
                      <input
                        type="text"
                        value={opt.name}
                        onChange={(e) => {
                          const updated = [...variantOptions];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setVariantOptions(updated);
                        }}
                        placeholder="e.g. Paper Finish, Size, Quantity Pack"
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
                  <InputGroup label="Values" hint="Type a value and press Enter">
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
                              const updated = [...variantOptions];
                              updated[idx] = { ...updated[idx], values: updated[idx].values.filter((v) => v !== val) };
                              setVariantOptions(updated);
                            }}
                            className="hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="Add value (e.g. Matte, Glossy)…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !opt.values.includes(val)) {
                              const updated = [...variantOptions];
                              updated[idx] = { ...updated[idx], values: [...updated[idx].values, val] };
                              setVariantOptions(updated);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="flex-1 min-w-[100px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none px-1"
                      />
                    </div>
                  </InputGroup>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariantOption}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-800 hover:text-black bg-slate-100 hover:bg-slate-200 border border-[#E5E7EB] transition-colors cursor-pointer"
              >
                <Plus size={14} /> Add Option
              </button>
            </div>
          )}

          {/* SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Shipping & Dimensions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Specify package weight and dimensions for automated courier rates.</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresShipping}
                  onChange={(e) => setRequiresShipping(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F5A623]"
                />
                <span className="text-sm font-semibold text-slate-800">This product requires physical shipping</span>
              </label>
              {requiresShipping && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup label="Weight (grams)">
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="250"
                        className={inputClass}
                      />
                    </InputGroup>
                    <InputGroup label="Shipping Class">
                      <select
                        value={shippingClass}
                        onChange={(e) => setShippingClass(e.target.value)}
                        className={inputClass + ' cursor-pointer'}
                      >
                        <option value="standard">Standard Courier</option>
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

          {/* SEO */}
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
                  placeholder={name || 'Product title for search engines'}
                  maxLength={60}
                  className={inputClass}
                />
              </InputGroup>
              <InputGroup label="Meta Description" hint={`${seoDescription.length}/160 characters`}>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Brief description for search engine results snippet…"
                  rows={3}
                  maxLength={160}
                  className={textareaClass}
                />
              </InputGroup>
              <InputGroup label="URL Slug">
                <div className="flex items-center gap-0">
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
              {/* Search Preview */}
              <div className="p-4.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Search Engine Snippet Preview</p>
                <p className="text-sm font-bold text-blue-700 hover:underline cursor-pointer truncate">
                  {seoTitle || name || 'Product Title'} | Star Press India
                </p>
                <p className="text-xs text-emerald-700 font-mono">starpress.in/shop/{seoSlug || 'product-slug'}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {seoDescription || shortDescription || 'High quality printing delivered nationwide from Star Press.'}
                </p>
              </div>
            </div>
          )}

          {/* PUBLISHING */}
          {activeTab === 'publishing' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Publishing & Sales Channels</h2>
                <p className="text-xs text-slate-500 mt-0.5">Control live storefront availability and featured product placement.</p>
              </div>
              <InputGroup label="Product Status">
                <div className="flex items-center gap-4 pt-1">
                  {(['draft', 'published'] as const).map((s) => (
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
    </div>
  );
}
