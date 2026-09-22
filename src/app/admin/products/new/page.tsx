"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Layers,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuthSession } from "@/hooks/useAuthSession";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function NewProductContent() {
  const router = useRouter();
  const { session, status, isHydrated, isAdmin } = useAuthSession();

  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [stockQuantity, setStockQuantity] = useState("100");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [trackInventory, setTrackInventory] = useState(true);
  const [productStatus, setProductStatus] = useState<"draft" | "published">("published");
  const [imageUrl, setImageUrl] = useState("");

  // Load Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
          if (data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch {
        // ignore
      }
    }
    loadCategories();
  }, []);

  // Auto-generate slug and SKU when name changes (if not manually edited)
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
    if (!sku) {
      const clean = val.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
      if (clean) {
        setSku(`SP-PRD-${clean}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
  };

  // Live profit margin calculation
  const numericBasePrice = parseFloat(basePrice) || 0;
  const numericCost = parseFloat(costPerUnit) || 0;
  const marginPercent =
    numericBasePrice > 0 && numericCost > 0
      ? (((numericBasePrice - numericCost) / numericBasePrice) * 100).toFixed(1)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!numericBasePrice || numericBasePrice <= 0) {
      setErrorMessage("Please specify a valid base price.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        slug: slug.trim() || slugify(name),
        categoryId: categoryId || undefined,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        basePrice: numericBasePrice,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPerUnit: numericCost || null,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        trackInventory,
        status: productStatus,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.product) {
        router.push(`/admin/products/${data.product.id}`);
      } else {
        setErrorMessage(data.error || "Failed to create product.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to connect to server.");
    } finally {
      setIsSubmitting(false);
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Return to Product List"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-xs text-slate-400 font-mono">Catalog Management</span>
              <h1 className="font-display font-black text-2xl text-white">
                Create New Printing Product
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-yellow hover:bg-[#FFE04D] text-black text-xs font-bold flex items-center gap-2 transition-all shadow-[0_4px_16px_rgba(255,224,77,0.25)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save & Continue</span>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Basic Info Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-yellow flex items-center gap-2">
              <Package size={16} />
              <span>1. Basic Product Identity</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Premium Spot UV Business Cards"
                  required
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/50 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
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
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g., SP-BIZ-CARD-8921"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow font-mono rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="e.g., premium-spot-uv-business-cards"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-yellow font-mono rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Short Description (for product cards)
              </label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                placeholder="Brief summary of paper finish, tactile feel, and ideal use case."
                className="w-full px-3.5 py-2 bg-black/40 border border-white/10 focus:border-brand-yellow rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* 2. Pricing & Margin Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-brand-cyan flex items-center gap-2">
                <DollarSign size={16} />
                <span>2. Pricing & Profit Margin</span>
              </h2>

              {marginPercent !== null && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                  Estimated Margin: {marginPercent}%
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Base Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="e.g., 499"
                  required
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
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
                  placeholder="e.g., 699"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cost per Unit (₹) (Internal Margin)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="e.g., 220"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-brand-cyan font-mono rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* 3. Inventory & Publishing Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/70 backdrop-blur-xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-purple-400 flex items-center gap-2">
              <Layers size={16} />
              <span>3. Inventory & Publishing</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 font-mono rounded-xl text-xs text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 font-mono rounded-xl text-xs text-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catalog Status
                </label>
                <select
                  value={productStatus}
                  onChange={(e) => setProductStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 font-mono rounded-xl text-xs text-white outline-none"
                >
                  <option value="published">Published (Visible Live)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Image Preview URL */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary Product Image (URL or Path)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/placeholder-product.png or https://…"
                  className="flex-1 px-3.5 py-2.5 bg-black/40 border border-white/10 focus:border-purple-400 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-yellow hover:bg-[#FFE04D] text-black text-xs font-bold flex items-center gap-2 transition-all shadow-[0_4px_20px_rgba(255,224,77,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>Create Product</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#07090E] text-white">
          <Loader2 size={32} className="animate-spin text-brand-yellow" />
        </div>
      }
    >
      <NewProductContent />
    </Suspense>
  );
}
