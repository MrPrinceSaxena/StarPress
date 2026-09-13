import React from "react";
import { Star } from "lucide-react";

export interface StarRatingProps {
  rating: number;
  maxStars?: number;
  reviewCount?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  reviewCount,
  size = "sm",
  showValue = true,
  className = "",
}: StarRatingProps) {
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${maxStars} stars`}>
        {Array.from({ length: maxStars }).map((_, i) => (
          <Star
            key={i}
            size={iconSize}
            className={`transition-colors ${
              i < Math.floor(rating)
                ? "text-brand-yellow fill-brand-yellow"
                : "text-zinc-600 fill-zinc-800"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-text-primary">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-text-secondary">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
