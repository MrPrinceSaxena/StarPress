"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Layers, RefreshCw } from "lucide-react";
import ShopFilterBar from "@/components/shop/ShopFilterBar";
import CatalogProductCard from "@/components/shop/CatalogProductCard";
import {
  CatalogCategory,
  CatalogProduct,
  CATEGORY_SLUG_ALIASES,
} from "@/lib/catalog";

export interface ShopClientViewProps {
  initialProducts: CatalogProduct[];
  categories: CatalogCategory[];
}

export default function ShopClientView({
  initialProducts,
  categories,
}: ShopClientViewProps) {
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category") || "all";
  const initialCategory =
    rawCategory !== "all" && CATEGORY_SLUG_ALIASES[rawCategory]
      ? CATEGORY_SLUG_ALIASES[rawCategory]
      : rawCategory;
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>("featured");

  // Keep state in sync if URL search params change
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setSelectedCategory(CATEGORY_SLUG_ALIASES[cat] || cat);
    }
    const q = searchParams.get("search") || searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Filter and sort pipeline
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

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
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  const activeCategoryObject = categories.find((c) => c.slug === selectedCategory);

  return (
    <div>
      {/* Dynamic Category Description (client-synced) */}
      {activeCategoryObject && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-slate-300">
          <span>
            Filtering by <strong>{activeCategoryObject.name}</strong> ({filteredProducts.length} items)
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-brand-yellow hover:underline font-semibold"
          >
            Show All
          </button>
        </div>
      )}

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
    </div>
  );
}
