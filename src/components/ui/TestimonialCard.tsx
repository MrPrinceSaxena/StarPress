import React from "react";
import Image from "next/image";
import { TestimonialItem } from "@/lib/data";
import StarRating from "./StarRating";

export interface TestimonialCardProps {
  testimonial: TestimonialItem;
}

export default function TestimonialCard({
  testimonial,
}: TestimonialCardProps) {
  return (
    <div className="flex flex-col justify-between bg-bg-surface rounded-2xl border border-border-subtle p-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40">
      <div>
        {/* Header: Avatar + Info */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border-subtle bg-bg-surface-alt shrink-0">
            <Image
              src={testimonial.avatarSrc}
              alt={testimonial.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {testimonial.name}
            </h3>
            <p className="text-xs text-text-secondary">
              {testimonial.role}
            </p>
          </div>
        </div>

        {/* 5-Star Rating */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} showValue={false} />
        </div>

        {/* Quote */}
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-normal">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
      </div>
    </div>
  );
}
