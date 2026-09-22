'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Eye, Trash2, Copy, Archive, MoreHorizontal,
  Package, ImageIcon, IndianRupee, BoxSelect, Layers, Truck,
  Search as SearchIcon, Globe, Upload, X, Plus, GripVertical,
  Bold, Italic, Underline, ListOrdered, List, Link2, AlignLeft, ExternalLink,
} from 'lucide-react';
import { showToast } from '@/components/admin/ui/Toast';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
  const [images, setImages] = useState<AdminProductImage[]>([]);
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
        setName(p.name); setShortDescription(p.shortDescription); setDescription(p.description);
        setSku(p.sku); setCategoryId(p.categoryId); setTags([...p.tags]); setBrand(p.brand);
        setBasePrice(p.basePrice.toString()); setCompareAtPrice(p.compareAtPrice?.toString() || '');
        setCostPerItem(p.costPerItem?.toString() || ''); setTaxable(p.taxable);
        setTrackInventory(p.trackInventory); setStockQuantity(p.stockQuantity.toString());
        setLowStockThreshold(p.lowStockThreshold.toString()); setAllowBackorders(p.allowBackorders);
        setImages([...p.images]); setVariantOptions([...p.variantOptions]);
        setWeight(p.weight?.toString() || '');
        setDimensions({
          length: p.dimensions?.length.toString() || '',
          width: p.dimensions?.width.toString() || '',
          height: p.dimensions?.height.toString() || '',
        });
        setRequiresShipping(p.requiresShipping); setFragile(p.fragile); setShippingClass(p.shippingClass);
        setSeoTitle(p.seo.title); setSeoDescription(p.seo.description); setSeoSlug(p.seo.slug);
        setStatus(p.status); setFeatured(p.featured); setVisibility({ ...p.visibility });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === categoryId);
      await productService.updateProduct(id, {
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
      showToast('Product saved successfully');
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
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-32">
        <Package size={40} className="mx-auto text-text-muted mb-3" />
        <p className="text-sm text-text-muted">Product not found</p>
        <button onClick={() => router.push('/admin/products')} className="mt-3 text-xs text-brand-yellow hover:underline">← Back to Products</button>
      </div>
    );
  }

  const inputClass = "w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow/30 transition-colors";
  const textareaClass = "w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow/30 transition-colors resize-none";

  const InputGroup = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/products')} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{name || product.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-xs text-text-muted font-mono">{sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors">
            <ExternalLink size={14} /> Preview
          </a>
          <div className="relative">
            <button onClick={() => setShowActions(!showActions)} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] border border-border-subtle transition-colors">
              <MoreHorizontal size={16} />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-bg-surface border border-border-subtle rounded-xl shadow-elevation-md py-1 z-20 animate-fadeIn">
                  <button onClick={() => { handleDuplicate(); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04]">
                    <Copy size={13} /> Duplicate
                  </button>
                  <button onClick={() => { productService.bulkUpdateStatus([id], 'archived'); setStatus('archived'); showToast('Product archived'); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/[0.04]">
                    <Archive size={13} /> Archive
                  </button>
                  <div className="border-t border-border-subtle my-1" />
                  <button onClick={() => { setDeleteDialog(true); setShowActions(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50 shadow-sm">
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Vertical Tabs */}
        <div className="w-48 shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content — Same structure as New Product */}
        <div className="flex-1 bg-bg-surface border border-border-subtle rounded-xl p-6">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Basic Information</h2>
              <InputGroup label="Product Name">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </InputGroup>
              <InputGroup label="Short Description" hint="Max 200 characters">
                <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} maxLength={200} className={textareaClass} />
              </InputGroup>
              <InputGroup label="Product Description">
                <div className="border border-border-subtle rounded-lg overflow-hidden">
                  <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white/[0.02] border-b border-border-subtle">
                    {[Bold, Italic, Underline, ListOrdered, List, Link2, AlignLeft].map((Icon, i) => (
                      <button key={i} className="p-1.5 rounded text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors" type="button"><Icon size={14} /></button>
                    ))}
                  </div>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="w-full px-3 py-2.5 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none resize-none" />
                </div>
              </InputGroup>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Category">
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass + ' cursor-pointer'}>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </InputGroup>
                <InputGroup label="SKU">
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
                </InputGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Brand">
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
                </InputGroup>
                <InputGroup label="Tags">
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-border-subtle min-h-[36px]">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-text-secondary">
                        {tag}<button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-white"><X size={12} /></button>
                      </span>
                    ))}
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={tags.length === 0 ? 'Add tags…' : ''} className="flex-1 min-w-[80px] bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                  </div>
                </InputGroup>
              </div>
            </div>
          )}
          {activeTab === 'media' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Product Media</h2>
              <div onClick={() => setImages([...images, { id: `img_${Date.now()}`, url: '', altText: '', isPrimary: images.length === 0, position: images.length }])} className="border-2 border-dashed border-border-subtle rounded-xl p-10 text-center hover:border-brand-yellow/30 hover:bg-brand-yellow/[0.02] transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto text-text-muted mb-3" />
                <p className="text-sm font-medium text-text-secondary">Drag and drop images here</p>
                <p className="text-xs text-text-muted mt-1">or <span className="text-brand-yellow">browse from your device</span></p>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div key={img.id} className={`relative rounded-lg border overflow-hidden aspect-square bg-white/[0.03] ${img.isPrimary ? 'border-brand-yellow/40 ring-1 ring-brand-yellow/20' : 'border-border-subtle'}`}>
                      <div className="absolute inset-0 flex items-center justify-center text-text-muted"><ImageIcon size={24} /></div>
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <GripVertical size={12} className="text-text-muted cursor-grab" />
                        {img.isPrimary && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-yellow text-black">PRIMARY</span>}
                      </div>
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {!img.isPrimary && <button onClick={() => setImages(images.map((im, i) => ({ ...im, isPrimary: i === idx })))} className="p-1 rounded bg-black/50 text-white/70 hover:text-white text-[9px] font-medium">Set Primary</button>}
                        <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="p-1 rounded bg-black/50 text-rose-400 hover:text-rose-300"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <InputGroup label="Selling Price (₹)"><input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={inputClass} /></InputGroup>
                <InputGroup label="Compare-at Price (₹)"><input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className={inputClass} /></InputGroup>
                <InputGroup label="Cost per Item (₹)"><input type="number" value={costPerItem} onChange={(e) => setCostPerItem(e.target.value)} className={inputClass} /></InputGroup>
              </div>
              {basePrice && costPerItem && (
                <div className="p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                  <span className="text-xs text-emerald-400 font-medium">Margin: ₹{(parseFloat(basePrice) - parseFloat(costPerItem)).toFixed(0)} ({(((parseFloat(basePrice) - parseFloat(costPerItem)) / parseFloat(basePrice)) * 100).toFixed(1)}%)</span>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-xs text-text-secondary">Charge tax</span></label>
            </div>
          )}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Inventory</h2>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">Track inventory</span></label>
              {trackInventory && (
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Quantity"><input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className={inputClass} /></InputGroup>
                  <InputGroup label="Low Stock Threshold"><input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className={inputClass} /></InputGroup>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={allowBackorders} onChange={(e) => setAllowBackorders(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">Allow backorders</span></label>
            </div>
          )}
          {activeTab === 'variants' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Variants</h2>
              {variantOptions.map((opt, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-white/[0.02] border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <InputGroup label={`Option ${idx + 1}`}>
                      <input type="text" value={opt.name} onChange={(e) => { const u = [...variantOptions]; u[idx] = { ...u[idx], name: e.target.value }; setVariantOptions(u); }} placeholder="e.g. Size, Color" className={inputClass + ' max-w-xs'} />
                    </InputGroup>
                    <button onClick={() => setVariantOptions(variantOptions.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-border-subtle min-h-[36px]">
                    {opt.values.map((val) => (
                      <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-text-secondary">
                        {val}<button onClick={() => { const u = [...variantOptions]; u[idx] = { ...u[idx], values: u[idx].values.filter((v) => v !== val) }; setVariantOptions(u); }} className="hover:text-white"><X size={12} /></button>
                      </span>
                    ))}
                    <input type="text" placeholder="Add value…" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val && !opt.values.includes(val)) { const u = [...variantOptions]; u[idx] = { ...u[idx], values: [...u[idx].values, val] }; setVariantOptions(u); (e.target as HTMLInputElement).value = ''; } } }} className="flex-1 min-w-[80px] bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={() => setVariantOptions([...variantOptions, { name: '', values: [] }])} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-brand-yellow hover:bg-brand-yellow/10 border border-brand-yellow/20 transition-colors"><Plus size={14} /> Add Option</button>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Shipping</h2>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={requiresShipping} onChange={(e) => setRequiresShipping(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">Requires shipping</span></label>
              {requiresShipping && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Weight (g)"><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} /></InputGroup>
                    <InputGroup label="Shipping Class"><select value={shippingClass} onChange={(e) => setShippingClass(e.target.value)} className={inputClass + ' cursor-pointer'}><option value="standard">Standard</option><option value="oversized">Oversized</option><option value="fragile">Fragile</option></select></InputGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <InputGroup label="Length (cm)"><input type="number" value={dimensions.length} onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })} className={inputClass} /></InputGroup>
                    <InputGroup label="Width (cm)"><input type="number" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} className={inputClass} /></InputGroup>
                    <InputGroup label="Height (cm)"><input type="number" value={dimensions.height} onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} className={inputClass} /></InputGroup>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">Fragile item</span></label>
                </>
              )}
            </div>
          )}
          {activeTab === 'seo' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">SEO</h2>
              <InputGroup label="SEO Title" hint={`${(seoTitle || name).length}/60`}><input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={name} maxLength={60} className={inputClass} /></InputGroup>
              <InputGroup label="Meta Description" hint={`${seoDescription.length}/160`}><textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} maxLength={160} className={textareaClass} /></InputGroup>
              <InputGroup label="URL Slug">
                <div className="flex"><span className="h-9 px-3 flex items-center rounded-l-lg bg-white/[0.02] border border-r-0 border-border-subtle text-xs text-text-muted">starpress.in/shop/</span><input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} className={inputClass + ' rounded-l-none'} /></div>
              </InputGroup>
              <div className="p-4 rounded-lg bg-white/[0.02] border border-border-subtle">
                <p className="text-xs text-text-muted mb-2 font-medium">Search Preview</p>
                <p className="text-sm text-blue-400 font-medium truncate">{seoTitle || name} | Star Press</p>
                <p className="text-xs text-emerald-500 mt-0.5">starpress.in/shop/{seoSlug}</p>
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{seoDescription || shortDescription}</p>
              </div>
            </div>
          )}
          {activeTab === 'publishing' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Publishing</h2>
              <InputGroup label="Status">
                <div className="flex items-center gap-3">
                  {(['draft', 'published', 'archived'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="accent-brand-yellow" /><StatusBadge status={s} size="md" /></label>
                  ))}
                </div>
              </InputGroup>
              <InputGroup label="Visibility">
                <div className="space-y-2">
                  {([{ key: 'onlineStore', label: 'Online Store' }, { key: 'pos', label: 'Point of Sale' }, { key: 'shop', label: 'Shop' }] as const).map((ch) => (
                    <label key={ch.key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={visibility[ch.key]} onChange={(e) => setVisibility({ ...visibility, [ch.key]: e.target.checked })} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">{ch.label}</span></label>
                  ))}
                </div>
              </InputGroup>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 rounded accent-brand-yellow" /><span className="text-sm text-text-secondary">Featured product</span></label>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={deleteDialog} title="Delete Product" message={`Delete "${name}"? This action cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteDialog(false)} />
    </div>
  );
}
