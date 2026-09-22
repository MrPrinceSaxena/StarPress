"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Save,
  Trash2,
  ExternalLink,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Layers,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Plus,
  RefreshCw,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuthSession } from "@/hooks/useAuthSession";

interface ProductDetail {
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

type TabKey = "basic" | "description" | "images" | "pricing" | "inventory" | "publish";

function ProductEditContent() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { session, status, isHydrated, isAdmin } = useAuthSession();

  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable Form States
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [trackInventory, setTrackInventory] = useState(true);
  const [productStatus, setProductStatus] = useState<"draft" | "published" | "archived">("draft");
  const [images, setImages] = useState<ProductDetail["images"]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Fetch Product Data
  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      if (data.success && data.product) {
        const p: ProductDetail = data.product;
        setProduct(p);
        setName(p.name);
        setSku(p.sku);
        setSlug(p.slug);
        setCategoryId(p.categoryId || "");
        setShortDescription(p.shortDescription || "");
        setDescription(p.description || "");
        setBasePrice(p.basePrice?.toString() || "");
        setCompareAtPrice(p.compareAtPrice?.toString() || "");
        setCostPerUnit(p.costPerUnit?.toString() || "");
        setStockQuantity(p.stockQuantity?.toString() || "0");
        setLowStockThreshold(p.lowStockThreshold?.toString() || "10");
        setTrackInventory(p.trackInventory ?? true);
        setProductStatus(p.status || "draft");
        setImages(p.images || []);
      } else {
        setErrorMessage("Product not found.");
      }
    } catch {
      setErrorMessage("Failed to load product details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Live profit margin calculation
  const numericBasePrice = parseFloat(basePrice) || 0;
  const numericCost = parseFloat(costPerUnit) || 0;
  const marginPercent =
    numericBasePrice > 0 && numericCost > 0
      ? (((numericBasePrice - numericCost) / numericBasePrice) * 100).toFixed(1)
      : null;

  // Save Product Updates
  const handleSave = async () => {
    if (!name.trim()) {
      showToast("Product name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        slug: slug.trim(),
        categoryId,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        basePrice: numericBasePrice,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPerUnit: numericCost || null,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        trackInventory,
        status: productStatus,
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast("Product changes saved successfully!");
      } else {
        setErrorMessage(data.error || "Failed to update product.");
      }
    } catch {
      setErrorMessage("Error communicating with server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Add Image via URL
  const handleAddImageUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("imageUrl", newImageUrl.trim());
      formData.append("altText", `${name} image`);
      formData.append("isPrimary", images.length === 0 ? "true" : "false");

      const res = await fetch(`/api/admin/products/${productId}/images/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.images) {
        setImages((prev) => [...prev, ...data.images]);
        setNewImageUrl("");
        showToast("Image added to gallery.");
      }
    } catch {
      showToast("Failed to add image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove Image
  const handleDeleteImage = (imgId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imgId));
    showToast("Image removed from gallery.");
  };

  // Set Primary Image
  const handleSetPrimaryImage = (imgId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === imgId,
      }))
    );
    showToast("Primary display image updated.");
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/products");
      }
    } catch {
      showToast("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isHydrated || status === "loading" || isLoading) {
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

  const navTabs: Array<{ id: TabKey; label: string; icon: React.ReactNode }> = [
    { id: "basic", label: "Basic Info", icon: <Package size={15} /> },
    { id: "description", label: "Description & HTML", icon: <FileText size={15} /> },
    { id: "images", label: `Images (${images.length})`, icon: <ImageIcon size={15} /> },
    { id: "pricing", label: "Pricing & Margin", icon: <DollarSign size={15} /> },
    { id: "inventory", label: "Inventory", icon: <Layers size={15} /> },
    { id: "publish", label: "Publish & Visibility", icon: <Eye size={15} /> },
  ];

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

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Return to Product List"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>SKU: {sku || "UNASSIGNED"}</span>
                <span>•</span>
                <span
                  className={`uppercase font-bold ${
                    productStatus === "published" ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {productStatus}
                </span>
              </div>
              <h1 className="font-display font-black text-2xl text-white truncate max-w-lg">
                {name || "Edit Product"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View on Public Store */}
            <a
              href={`/shop/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <span>View Storefront</span>
              <ExternalLink size={13} />
            </a>

            {/* Delete */}
            <button
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all text-xs"
              title="Delete Product"
            >
              {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-brand-yellow hover:bg-[#FFE04D] text-black text-xs font-bold flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(255,224,77,0.25)] disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Navigation & Content Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Tabs Sidebar */}
          <div className="lg:col-span-1 space-y-1">
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-2 space-y-1">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    activeTab === tab.id
                      ? "bg-brand-yellow text-black font-bold shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Metrics Widget */}
            <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/40 p-4 space-y-3 mt-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Financial Snapshot
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Margin:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {marginPercent ? `${marginPercent}%` : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Inventory Units:</span>
                <span className="font-mono font-bold text-white">{stockQuantity}</span>
              </div>
            </div>
          </div>

          {/* Right Main Content Pane */}
          <div className="lg:col-span-3">
            {/* Tab 1: Basic Info */}
            {activeTab === "basic" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-yellow flex items-center gap-2">
                  <Package size={16} />
                  <span>Basic Product Information</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow rounded-xl text-xs text-white outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow font-mono rounded-xl text-xs text-white outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Storefront URL Slug
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Short Description (Product Card Snippet)
                  </label>
                  <textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 bg-black/40 border border-white/10 focus:border-brand-yellow rounded-xl text-xs text-white outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Description & Live HTML Preview */}
            {activeTab === "description" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-yellow flex items-center gap-2">
                    <FileText size={16} />
                    <span>Rich Product Description & Specifications</span>
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400">
                    Supports HTML & Markdown
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Editor */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-300 mb-1">
                      HTML / Markdown Source
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={14}
                      placeholder="<p>Detailed product overview, paper weight specifications, printing technique...</p>"
                      className="w-full px-3.5 py-3 bg-black/50 border border-white/10 focus:border-brand-yellow rounded-xl font-mono text-xs text-white placeholder:text-slate-600 outline-none resize-none flex-1"
                    />
                  </div>

                  {/* Live Rendered Preview */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-300 mb-1">
                      Live Storefront Preview
                    </label>
                    <div className="w-full p-4 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-slate-200 overflow-y-auto max-h-[340px] prose prose-invert prose-xs">
                      {description ? (
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                      ) : (
                        <p className="text-slate-500 italic">No description written yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Images Management */}
            {activeTab === "images" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-yellow flex items-center gap-2">
                  <ImageIcon size={16} />
                  <span>Product Photo Gallery</span>
                </h2>

                {/* Add Image by URL */}
                <form onSubmit={handleAddImageUrl} className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL (/images/... or https://...)"
                    className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow rounded-xl text-xs text-white placeholder:text-slate-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isUploadingImage || !newImageUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand-yellow text-black text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    <span>Add Image</span>
                  </button>
                </form>

                {/* Images Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl border border-white/10 bg-black/40 overflow-hidden"
                    >
                      <div className="aspect-square relative w-full">
                        <Image
                          src={img.url}
                          alt={img.altText || name}
                          fill
                          sizes="200px"
                          className="object-cover"
                        />
                      </div>

                      {img.isPrimary && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-yellow text-black font-bold text-[9px] uppercase font-mono tracking-wider shadow-md">
                          Primary
                        </span>
                      )}

                      <div className="p-2 flex items-center justify-between border-t border-white/10 bg-[#07090E]/90">
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(img.id)}
                          className="text-[10px] text-slate-400 hover:text-brand-yellow transition-colors font-medium"
                        >
                          Set Primary
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Pricing & Margin */}
            {activeTab === "pricing" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-cyan flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>Pricing & Profit Margin</span>
                  </h2>

                  {marginPercent !== null && (
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                      Calculated Margin: {marginPercent}%
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Base Retail Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Compare-at Price (₹) (Strike-through)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cost per Unit (₹) (Production Cost)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Inventory */}
            {activeTab === "inventory" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-purple-400 flex items-center gap-2">
                  <Layers size={16} />
                  <span>Stock & Inventory Thresholds</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Available Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Low Stock Threshold (Alert level)
                    </label>
                    <input
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 font-mono rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="trackInventory"
                    checked={trackInventory}
                    onChange={(e) => setTrackInventory(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-yellow focus:ring-brand-yellow/50 bg-black/40 border-white/10"
                  />
                  <label htmlFor="trackInventory" className="text-xs text-slate-300 cursor-pointer">
                    Enable real-time inventory tracking for this item
                  </label>
                </div>
              </div>
            )}

            {/* Tab 6: Publish & Visibility */}
            {activeTab === "publish" && (
              <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-emerald-400 flex items-center gap-2">
                  <Eye size={16} />
                  <span>Catalog Status & Live Visibility</span>
                </h2>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Product Lifecycle Status
                  </label>
                  <div className="flex gap-3">
                    {(["published", "draft", "archived"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setProductStatus(st)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-all ${
                          productStatus === st
                            ? "bg-brand-yellow text-black shadow-lg"
                            : "bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <a
                    href={`/shop/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    <span>Preview Live Storefront View</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
          <Loader2 size={32} className="animate-spin text-brand-yellow" />
        </div>
      }
    >
      <ProductEditContent />
    </Suspense>
  );
}
