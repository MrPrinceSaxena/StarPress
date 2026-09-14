"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Layers, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShopFilterBar from "@/components/shop/ShopFilterBar";
import CatalogProductCard from "@/components/shop/CatalogProductCard";
import { getAllCategories, getAllProducts } from "@/lib/catalog";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  const categories = useMemo(() => getAllCategories(), []);
  const allProducts = useMemo(() => getAllProducts(), []);

  // Filter and sort pipeline
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.basePrice - a.basePrice);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // Featured / Default
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  const activeCategoryObject = categories.find((c) => c.slug === selectedCategory);

  return (
    <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14">
      {/* Page Header Banner */}
      <div className="relative rounded-2xl border border-border-subtle bg-gradient-to-r from-bg-surface via-[#171324] to-bg-surface p-8 sm:p-12 mb-10 overflow-hidden shadow-2xl">
        {/* Glow Flares */}
        <div
          className="absolute -top-10 right-10 w-72 h-72 bg-brand-magenta/15 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-10 left-10 w-72 h-72 bg-brand-cyan/15 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan text-xs font-bold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Star Press Full Catalog</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight leading-[1.1]">
            {activeCategoryObject ? activeCategoryObject.name : "Commercial & Custom Printing"}
          </h1>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {activeCategoryObject
              ? activeCategoryObject.description
              : "Explore our complete range of business cards, marketing flyers, flex banners, corporate stationery, and custom merchandise with real-time multi-quantity pricing."}
          </p>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <ShopFilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalResults={filteredProducts.length}
      />

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 px-6 rounded-2xl border border-border-subtle bg-bg-surface max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface-alt border border-border-subtle flex items-center justify-center mx-auto text-brand-yellow">
            <Layers size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white">No products found</h3>
            <p className="text-sm text-text-secondary">
              We couldn&apos;t find any products matching &quot;{searchQuery}&quot; in the selected category.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
              setSortBy("featured");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-yellow text-black font-bold text-sm hover:bg-[#FFE04D] transition-colors"
          >
            <RefreshCw size={15} />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </main>
  );
}

export default function ShopPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-32">
            <div className="animate-spin text-3xl text-brand-yellow">⭐</div>
          </div>
        }
      >
        <ShopContent />
      </Suspense>
      <Footer />
    </div>
  );
}
