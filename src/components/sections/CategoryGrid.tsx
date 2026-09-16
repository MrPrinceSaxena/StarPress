"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, Layers, Compass } from "lucide-react";
import { getAllCategories, getProductsByCategory } from "@/lib/catalog";

export default function CategoryGrid() {
  const categories = useMemo(() => getAllCategories(), []);

  // Enriched category data with product stats and starting prices
  const enrichedCategories = useMemo(() => {
    return categories.map((cat, idx) => {
      const prods = getProductsByCategory(cat.slug);
      const minPrice =
        prods.length > 0 ? Math.min(...prods.map((p) => p.basePrice)) : 199;
      const sampleNames = prods.slice(0, 3).map((p) => p.name);

      return {
        ...cat,
        indexNumber: String(idx + 1).padStart(2, "0"),
        productCount: prods.length,
        startingPrice: minPrice,
        sampleProducts: sampleNames,
        href: `/shop?category=${cat.slug}`,
      };
    });
  }, [categories]);

  // Desktop active expanded card (default to first category)
  const [activeId, setActiveId] = useState<string>(enrichedCategories[0]?.id || "cat-1");

  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-bg-base">
      {/* Ambient background glows */}
      <div
        className="absolute top-1/3 -left-32 w-96 h-96 bg-brand-magenta/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 -right-32 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 md:mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Interactive Collection Rail</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight">
              Shop by Category
            </h2>

            <p className="text-sm sm:text-base text-text-secondary max-w-xl leading-relaxed">
              Hover over any print collection to expand full specifications, sample items,
              and live volume tier pricing.
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-brand-cyan hover:text-white bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 transition-all group shrink-0"
          >
            <span>View All Categories</span>
            <ArrowRight
              size={15}
              className="group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
        </div>

        {/* 1. DESKTOP ACCORDION COLLECTION RAIL (Hidden on mobile/tablet) */}
        <div
          className="hidden lg:flex gap-3 h-[480px] w-full rounded-[28px] border border-border-subtle bg-bg-surface/50 p-3.5 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          onMouseLeave={() => setActiveId(enrichedCategories[0]?.id || "cat-1")}
        >
          {enrichedCategories.map((cat) => {
            const isExpanded = activeId === cat.id;

            return (
              <Link
                key={cat.id}
                href={cat.href}
                onMouseEnter={() => setActiveId(cat.id)}
                onFocus={() => setActiveId(cat.id)}
                className={`relative rounded-2xl overflow-hidden cursor-pointer select-none transition-[flex,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between border ${
                  isExpanded
                    ? "flex-[3.8] border-brand-yellow/60 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(255,230,0,0.12)] ring-1 ring-brand-yellow/40"
                    : "flex-1 border-white/5 bg-bg-surface-alt hover:border-white/20"
                }`}
                style={{
                  willChange: "flex",
                }}
              >
                {/* Background Image with Scale Animation */}
                <div className="absolute inset-0 bg-bg-surface-alt">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1280px) 380px, 450px"
                    quality={70}
                    className={`object-cover transition-all duration-700 ${
                      isExpanded
                        ? "scale-105 opacity-90 filter-none"
                        : "scale-100 opacity-25 grayscale-[30%]"
                    }`}
                  />
                </div>

                {/* Scrim Overlays */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
                    isExpanded
                      ? "bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/70 to-black/60"
                      : "bg-[#0A0A0F]/80 group-hover:bg-[#0A0A0F]/60"
                  }`}
                  aria-hidden="true"
                />

                {/* Accent Color Ambient Bloom at Bottom */}
                <div
                  className={`absolute -bottom-8 inset-x-0 h-36 transition-opacity duration-500 blur-2xl pointer-events-none ${
                    isExpanded ? "opacity-35" : "opacity-0"
                  }`}
                  style={{
                    background: cat.accentColor || "#FFCF1B",
                  }}
                  aria-hidden="true"
                />

                {/* --- CARD TOP HEADER --- */}
                <div className="relative z-10 p-5 flex items-center justify-between gap-2">
                  {/* Category Index Number */}
                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      isExpanded
                        ? "bg-brand-yellow/15 border-brand-yellow/40 text-brand-yellow"
                        : "bg-white/5 border-white/10 text-text-muted"
                    }`}
                  >
                    {cat.indexNumber}
                  </span>

                  {/* Expanded Only: Item count pill */}
                  {isExpanded && (
                    <span className="animate-fadeIn text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-text-secondary border border-white/10">
                      {cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}
                    </span>
                  )}
                </div>

                {/* --- CARD BOTTOM CONTENT --- */}
                <div className="relative z-10 p-5 sm:p-6">
                  {isExpanded ? (
                    /* EXPANDED CONTENT VIEW */
                    <div className="space-y-3 animate-fadeIn">
                      {/* Top sample tags */}
                      {cat.sampleProducts && cat.sampleProducts.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0 animate-pulse" />
                          <span className="text-[11px] font-medium text-brand-cyan tracking-wide truncate">
                            {cat.sampleProducts.join(" • ")}
                          </span>
                        </div>
                      )}

                      {/* Main Title */}
                      <h3 className="font-display font-black text-2xl xl:text-3xl text-white uppercase tracking-tight leading-[1.1]">
                        {cat.name}
                      </h3>

                      {/* Tagline */}
                      <p className="text-xs xl:text-sm text-text-secondary line-clamp-2 leading-relaxed">
                        {cat.tagline}
                      </p>

                      {/* Price & Action Row */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block">
                            Starting from
                          </span>
                          <div className="font-mono font-black text-xl text-brand-yellow">
                            ₹{cat.startingPrice.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-black bg-brand-yellow hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(255,230,0,0.3)]">
                          <span>Explore Line</span>
                          <ArrowUpRight size={15} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* COLLAPSED VERTICAL PREVIEW */
                    <div className="flex flex-col items-center justify-end h-full pb-2">
                      <span
                        className="font-display font-bold text-xs xl:text-sm text-text-secondary tracking-widest uppercase whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-colors hover:text-white"
                      >
                        {cat.name}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-3 transition-colors"
                        style={{ background: cat.accentColor || "#FFCF1B" }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 2. MOBILE & TABLET HORIZONTAL SWIPE RAIL (< lg) */}
        <div className="lg:hidden">
          <div
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-2 no-scrollbar"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {enrichedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="relative w-[280px] sm:w-[320px] h-[400px] shrink-0 snap-center rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface flex flex-col justify-between p-5 select-none shadow-xl active:scale-[0.98] transition-transform"
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-bg-surface-alt">
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="320px"
                    quality={70}
                    className="object-cover"
                  />
                </div>

                {/* Dark Vignette */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/70 to-black/50 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Top Badge Row */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-brand-yellow/40 text-brand-yellow">
                    {cat.indexNumber}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-text-secondary border border-white/10">
                    {cat.productCount} Items
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 space-y-2">
                  {cat.sampleProducts && cat.sampleProducts.length > 0 && (
                    <p className="text-[10px] font-medium text-brand-cyan tracking-wide truncate">
                      {cat.sampleProducts.join(" • ")}
                    </p>
                  )}

                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {cat.tagline}
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted block">
                        From
                      </span>
                      <span className="font-mono font-black text-base text-brand-yellow">
                        ₹{cat.startingPrice.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-black bg-brand-yellow">
                      <span>Explore</span>
                      <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-muted">
            <Compass size={13} className="text-brand-yellow animate-pulse" />
            <span>Swipe horizontally to explore all 8 print categories</span>
          </div>
        </div>
      </div>
    </section>
  );
}
