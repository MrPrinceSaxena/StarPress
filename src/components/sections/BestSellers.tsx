"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { BEST_SELLERS, ProductItem } from "@/lib/data";
import ProductCard from "@/components/ui/ProductCard";

export interface BestSellersProps {
  onAddToCart?: (product: ProductItem) => void;
}

export default function BestSellers({ onAddToCart }: BestSellersProps) {
  return (
    <section className="py-14 md:py-18 relative">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow text-xs font-bold uppercase tracking-wider">
              <TrendingUp size={13} />
              <span>Customer Favorites</span>
            </div>

            <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-tight">
              Best Selling Products
            </h2>

            <p className="text-xs sm:text-sm text-text-secondary max-w-lg leading-relaxed">
              Our highest-rated commercial prints with verified 2400 DPI fidelity, moisture-proof
              packaging, and rapid Pan-India dispatch.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors group shrink-0"
          >
            <span>View Full Shop Catalog</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </div>

        {/* Smart Compact 3×2 Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {BEST_SELLERS.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
