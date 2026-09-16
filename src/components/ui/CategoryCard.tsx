import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

export interface CategoryCardData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  imageUrl: string;
  accentColor?: string;
  productCount?: number;
  startingPrice?: number;
  sampleProducts?: string[];
  href?: string;
}

export interface CategoryCardProps {
  category: CategoryCardData;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const targetHref = category.href || `/shop?category=${category.slug}`;

  return (
    <Link
      href={targetHref}
      className="group relative flex flex-col justify-between w-[280px] sm:w-[320px] md:w-[340px] h-[400px] sm:h-[430px] rounded-[24px] overflow-hidden shrink-0 snap-start border border-border-subtle bg-bg-surface select-none transition-all duration-300 hover:-translate-y-2 hover:border-brand-yellow/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(255,230,0,0.15)] focus-visible:ring-2 focus-visible:ring-brand-yellow"
    >
      {/* Full-Bleed Background Photography with Zoom Effect */}
      <div className="absolute inset-0 bg-bg-surface-alt">
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 280px, 340px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      </div>

      {/* Netflix Scrims: Dark Top Vignette + Bottom Cinematic Shadow */}
      <div
        className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/85 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Ambient Accent Color Glow on Hover */}
      <div
        className="absolute -bottom-10 inset-x-0 h-40 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-2xl pointer-events-none"
        style={{
          background: category.accentColor || "#FFCF1B",
        }}
        aria-hidden="true"
      />

      {/* Card Top: Badges */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-sm">
          <Sparkles size={11} className="text-brand-yellow" />
          <span>Category</span>
        </span>

        {category.productCount !== undefined && (
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-text-secondary border border-white/10">
            {category.productCount} {category.productCount === 1 ? "Item" : "Items"}
          </span>
        )}
      </div>

      {/* Card Bottom: Typographic Content */}
      <div className="relative z-10 p-5 sm:p-6 space-y-3">
        {category.sampleProducts && category.sampleProducts.length > 0 && (
          <p className="text-[11px] font-medium text-brand-cyan tracking-wide truncate">
            {category.sampleProducts.join(" • ")}
          </p>
        )}

        <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-[1.1] group-hover:text-brand-yellow transition-colors">
          {category.name}
        </h3>

        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
          {category.tagline}
        </p>

        {/* Price & Action Button Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
              Starting from
            </span>
            <div className="font-mono font-black text-lg sm:text-xl text-brand-yellow">
              ₹{category.startingPrice ? category.startingPrice.toLocaleString("en-IN") : "199"}
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-white/10 backdrop-blur-md border border-white/15 group-hover:bg-brand-yellow group-hover:text-black group-hover:border-brand-yellow transition-all duration-200 shadow-md">
            <span>Explore</span>
            <ArrowUpRight
              size={15}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
