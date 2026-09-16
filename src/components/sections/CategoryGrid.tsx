"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import CategoryCard, { CategoryCardData } from "@/components/ui/CategoryCard";
import { getAllCategories, getProductsByCategory } from "@/lib/catalog";

export default function CategoryGrid() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Enriched categories with catalog products, pricing, and item counts
  const enrichedCategories: CategoryCardData[] = useMemo(() => {
    const categories = getAllCategories();

    return categories.map((cat) => {
      const prods = getProductsByCategory(cat.slug);
      const minPrice =
        prods.length > 0
          ? Math.min(...prods.map((p) => p.basePrice))
          : 199;
      const sampleNames = prods.slice(0, 3).map((p) => p.name);

      return {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        tagline: cat.tagline,
        imageUrl: cat.imageUrl,
        accentColor: cat.accentColor,
        productCount: prods.length,
        startingPrice: minPrice,
        sampleProducts: sampleNames,
        href: `/shop?category=${cat.slug}`,
      };
    });
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollAmount = Math.max(320, el.clientWidth * 0.7);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div
        className="absolute top-1/2 -left-20 w-80 h-80 bg-brand-magenta/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/2 -right-20 w-80 h-80 bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"
        aria-hidden="true"
      />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 md:mb-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Curated Print Lines</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
              Shop by Category
            </h2>

            <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
              Explore our complete range of commercial offset, digital printing, and custom
              merchandise with live volume tier pricing.
            </p>
          </div>

          {/* Right Controls: Navigation Buttons & View All */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollLeft
                    ? "border-border-subtle bg-bg-surface text-white hover:border-brand-yellow hover:text-brand-yellow hover:bg-bg-surface-alt hover:scale-105 active:scale-95"
                    : "border-border-subtle/30 bg-bg-surface/30 text-text-muted/40 cursor-not-allowed"
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  canScrollRight
                    ? "border-border-subtle bg-bg-surface text-white hover:border-brand-yellow hover:text-brand-yellow hover:bg-bg-surface-alt hover:scale-105 active:scale-95"
                    : "border-border-subtle/30 bg-bg-surface/30 text-text-muted/40 cursor-not-allowed"
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <span className="text-border-subtle hidden sm:inline">|</span>

            {/* View All Categories Link */}
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-cyan hover:text-cyan-300 transition-colors group"
            >
              <span>View All</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Netflix-Style Horizontal Scroll Rail with Fade Masks */}
      <div className="relative max-w-[1440px] mx-auto">
        {/* Left Edge Fade Mask */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-bg-base to-transparent z-10 transition-opacity duration-300 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Right Edge Fade Mask */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-bg-base to-transparent z-10 transition-opacity duration-300 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Horizontal Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-6 lg:px-12 no-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {enrichedCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
