"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Check, SlidersHorizontal, ArrowRight } from "lucide-react";
import { CatalogProduct } from "@/lib/catalog";
import StarRating from "@/components/ui/StarRating";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatINR } from "@/lib/pricing";

export interface CatalogProductCardProps {
  product: CatalogProduct;
}

export default function CatalogProductCard({ product }: CatalogProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isAdded, setIsAdded] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.basePrice,
        imageSrc: product.images[0] || "/images/hero-composition.jpg",
        href: `/shop/${product.slug}`,
      },
      1
    );
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const maxDiscount = Math.max(...product.quantityTiers.map((t) => t.discountPercent), 0);

  return (
    <div className="group relative flex flex-col bg-bg-surface rounded-2xl border border-border-subtle p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-xl hover:shadow-black/50">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-bg-surface-alt mb-3.5">
        <Link href={`/shop/${product.slug}`} className="block w-full h-full relative">
          <Image
            src={product.images[0] || "/images/hero-composition.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Category Pill */}
        <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 uppercase tracking-wider">
          {product.categoryName}
        </span>

        {/* Bulk discount tag */}
        {maxDiscount > 0 && (
          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white shadow-sm">
            Save up to {maxDiscount}%
          </span>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-yellow ${
            isWishlisted
              ? "bg-rose-600 text-white scale-110 shadow-md shadow-rose-950/40"
              : "bg-black/50 text-white hover:bg-black/80 hover:text-rose-400"
          }`}
        >
          <Heart
            size={15}
            className={`transition-all duration-200 ${
              isWishlisted ? "fill-white text-white" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/shop/${product.slug}`}>
            <h3 className="text-base font-bold text-text-primary group-hover:text-brand-yellow transition-colors line-clamp-1 mb-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-xs text-text-secondary line-clamp-2 mb-2.5 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-xs text-text-muted mr-1">Starts at</span>
              <span className="text-xl font-display font-black text-brand-yellow">
                {formatINR(product.basePrice)}
              </span>
            </div>
            <span className="text-[11px] text-text-muted">
              {product.sizeOptions.length} sizes
            </span>
          </div>
        </div>

        {/* Dual Actions: Configure & Quick Add */}
        <div className="grid grid-cols-5 gap-2 pt-1">
          <Link
            href={`/shop/${product.slug}`}
            className="col-span-4 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-bg-surface-alt border border-border-subtle hover:border-brand-yellow/60 hover:text-brand-yellow text-xs font-bold text-white transition-all group/btn"
          >
            <SlidersHorizontal size={13} />
            <span>Customize & Price</span>
            <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={handleQuickAdd}
            title="Quick Add to Cart"
            className="col-span-1 inline-flex items-center justify-center rounded-lg bg-brand-yellow text-black hover:bg-[#FFE04D] active:scale-95 transition-all"
          >
            {isAdded ? (
              <Check size={16} className="stroke-[3]" />
            ) : (
              <ShoppingBag size={16} className="stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
