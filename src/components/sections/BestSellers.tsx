"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BEST_SELLERS, ProductItem } from "@/lib/data";
import ProductCard from "@/components/ui/ProductCard";

export interface BestSellersProps {
  onAddToCart?: (product: ProductItem) => void;
}

export default function BestSellers({ onAddToCart }: BestSellersProps) {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Best Selling Products
          </h2>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:text-cyan-300 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-150"
            />
          </Link>
        </div>

        {/* 4 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
