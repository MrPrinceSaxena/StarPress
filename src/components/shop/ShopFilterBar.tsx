"use client";

import React from "react";
import { Search, X, ArrowUpDown, Filter } from "lucide-react";
import { CatalogCategory } from "@/lib/catalog";

export interface ShopFilterBarProps {
  categories: CatalogCategory[];
  selectedCategory: string;
  onSelectCategory: (categorySlug: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export default function ShopFilterBar({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalResults,
}: ShopFilterBarProps) {
  return (
    <div className="space-y-6 mb-10">
      {/* Top Controls: Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search products (e.g. business cards, flyers, banners, stickers)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle rounded-xl pl-10 pr-10 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1"
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-text-secondary">
            Showing <span className="text-white font-bold">{totalResults}</span> products
          </div>

          <div className="relative inline-flex items-center">
            <ArrowUpDown size={14} className="absolute left-3 text-text-muted pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-bg-surface border border-border-subtle rounded-xl pl-8 pr-8 py-2.5 text-xs sm:text-sm text-text-primary focus:outline-none focus:border-brand-yellow cursor-pointer appearance-none"
            >
              <option value="featured">Featured & Best Selling</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="relative">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-x-contain -mx-1 px-1 touch-pan-x"
          role="tablist"
          aria-label="Filter products by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "all"}
            onClick={() => onSelectCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all select-none min-h-[38px] flex items-center justify-center ${
              selectedCategory === "all"
                ? "bg-brand-yellow text-black shadow-md shadow-brand-yellow/20 font-bold scale-[1.02]"
                : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-white hover:border-white/30 active:scale-95"
            }`}
          >
            All Categories
          </button>

          {categories.map((category) => {
            const isSelected = selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(category.slug)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all select-none min-h-[38px] flex items-center justify-center ${
                  isSelected
                    ? "bg-brand-magenta text-white shadow-md shadow-brand-magenta/30 font-bold scale-[1.02]"
                    : "bg-bg-surface border border-border-subtle text-text-secondary hover:text-white hover:border-white/30 active:scale-95"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
