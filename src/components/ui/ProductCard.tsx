"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Sparkles } from "lucide-react";
import { ProductItem } from "@/lib/data";
import StarRating from "./StarRating";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export interface ProductCardProps {
  product: ProductItem;
  onAddToCart?: (product: ProductItem) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isAdded, setIsAdded] = useState(false);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setIsAdded(true);
    if (onAddToCart) {
      onAddToCart(product);
    }
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <div className="group relative flex flex-col justify-between bg-bg-surface rounded-2xl border border-border-subtle p-3 sm:p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-magenta/50 hover:shadow-[0_8px_30px_rgba(240,23,156,0.15)] select-none">
      {/* 1. Compact Product Image (4:3 Aspect Ratio for Space-Efficiency) */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-bg-surface-alt mb-3">
        <Link href={product.href} className="block w-full h-full relative">
          <Image
            src={product.imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Ambient Dark Gradient on Image Bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top-Left: Best Seller Badge */}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-brand-yellow/30 text-[9px] sm:text-[10px] font-bold text-brand-yellow uppercase tracking-wider shadow-sm">
          <Sparkles size={10} />
          <span>Best Seller</span>
        </span>

        {/* Top-Right: Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-yellow ${
            isWishlisted
              ? "bg-brand-magenta text-white scale-110 shadow-lg shadow-brand-magenta/30"
              : "bg-black/50 text-white hover:bg-black/80 hover:text-brand-magenta"
          }`}
        >
          <Heart
            size={14}
            className={`transition-all duration-200 ${
              isWishlisted ? "fill-white text-white" : ""
            }`}
          />
        </button>

        {/* Bottom-Left Print Spec Pill */}
        <span className="absolute bottom-2 left-2 text-[9px] font-mono font-medium px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-text-secondary border border-white/5">
          2400 DPI Offset
        </span>
      </div>

      {/* 2. Content Info & Inline Bottom Row */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        {/* Title */}
        <div>
          <Link href={product.href} className="block">
            <h3 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-brand-yellow transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Star Rating Strip */}
          <div className="flex items-center justify-between text-xs mt-1">
            <StarRating
              rating={product.rating}
              reviewCount={product.reviewCount}
              size="sm"
            />
            <span className="text-[10px] font-mono text-emerald-400 font-medium">
              In Stock
            </span>
          </div>
        </div>

        {/* 3. Smart Merged Footer Row (Price + Quick-Add Button) */}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted block leading-none mb-0.5">
              From
            </span>
            <div className="font-mono font-black text-base sm:text-lg text-brand-yellow leading-tight">
              ₹{product.price.toLocaleString("en-IN")}
            </div>
          </div>

          {/* Inline Quick Add Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm shrink-0 ${
              isAdded
                ? "bg-brand-yellow text-black"
                : "bg-white/10 hover:bg-brand-yellow hover:text-black text-white border border-white/15 hover:border-brand-yellow active:scale-95"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={13} className="text-black stroke-[3]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
