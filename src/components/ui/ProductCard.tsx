"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { ProductItem } from "@/lib/data";
import StarRating from "./StarRating";
import Button from "./Button";
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
    <div className="group relative flex flex-col bg-bg-surface rounded-2xl border border-border-subtle p-4 transition-all duration-200 hover:-translate-y-1 hover:border-brand-magenta/40 hover:shadow-[0_0_24px_rgba(240,23,156,0.15)]">
      {/* Product Image Container */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-bg-surface-alt mb-3.5">
        <Link href={product.href} className="block w-full h-full relative">
          <Image
            src={product.imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

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
              ? "bg-brand-magenta text-white scale-110 shadow-lg shadow-brand-magenta/30"
              : "bg-black/50 text-white hover:bg-black/80 hover:text-brand-magenta"
          }`}
        >
          <Heart
            size={16}
            className={`transition-all duration-200 ${
              isWishlisted ? "fill-white text-white" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <Link href={product.href}>
            <h3 className="text-base font-semibold text-text-primary group-hover:text-brand-yellow transition-colors line-clamp-1 mb-1.5">
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="text-lg font-bold text-brand-yellow mb-2">
            ₹{product.price}
          </div>

          {/* Star Rating */}
          <div className="mb-4">
            <StarRating
              rating={product.rating}
              reviewCount={product.reviewCount}
            />
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          size="md"
          onClick={handleAddToCart}
          className="w-full justify-center !text-sm !py-2.5"
        >
          {isAdded ? (
            <>
              <Check size={16} className="text-black stroke-[3]" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingBag size={16} className="text-black stroke-[2.5]" />
              <span>Add to Cart</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
