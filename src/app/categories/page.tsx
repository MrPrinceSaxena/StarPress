import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers } from "lucide-react";
import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getAllCategories, getProductsByCategory } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All Print Categories | Star Press Khatima",
  description:
    "Explore Star Press commercial and custom printing categories in Khatima: Business Printing, Marketing Materials, Outdoor Advertising, 3D Signage, Stationery, and Custom Packaging.",
  alternates: {
    canonical: "https://www.starpress.in/categories",
  },
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Banner */}
        <div className="relative rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-10 mb-8 sm:mb-10 overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} className="text-brand-yellow" />
              <span>Full Print Catalog</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl uppercase text-white tracking-tight leading-[1.1]">
              Shop by Category
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Explore high-precision commercial printing, custom retail packaging, outdoor 3D signages, and personalized merchandise crafted at Star Press Khatima.
            </p>
          </div>
        </div>

        {/* E-Commerce Product Category Grid (2 cols mobile, 3 tablet, 4 desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {categories.map((category) => {
            const categoryProducts = getProductsByCategory(category.slug);
            const minPrice =
              categoryProducts.length > 0
                ? Math.min(...categoryProducts.map((p) => p.basePrice))
                : 199;
            const topProducts = categoryProducts
              .slice(0, 3)
              .map((p) => p.name)
              .join(", ");

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#12131A] overflow-hidden transition-all duration-300 hover:border-brand-yellow/60 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/70 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50"
              >
                {/* Hero Category Product Image (Aspect Square for Clean E-commerce Look) */}
                <div className="relative aspect-square w-full overflow-hidden bg-bg-surface-alt">
                  <Image
                    src={category.imageUrl}
                    alt={`${category.name} - Star Press`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                  />

                  {/* Subtle Gradient Scrim at Bottom of Image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12131A] via-transparent to-black/20 opacity-70 group-hover:opacity-40 transition-opacity" />

                  {/* Top-Right Item Count Pill */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold px-2 py-0.5 sm:py-1 rounded-full bg-black/70 backdrop-blur-md text-slate-300 border border-white/15 shadow-sm">
                      {categoryProducts.length} items
                    </span>
                  </div>
                </div>

                {/* Compact Content Info (Less Text, High Legibility) */}
                <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h2 className="font-display font-black text-sm sm:text-base text-white group-hover:text-brand-yellow transition-colors line-clamp-1">
                      {category.name}
                    </h2>

                    {topProducts && (
                      <p className="text-[11px] sm:text-xs text-text-secondary line-clamp-1 mt-0.5 font-normal">
                        {topProducts}
                      </p>
                    )}
                  </div>

                  {/* Price & Action Row */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted block leading-none">
                        Starting from
                      </span>
                      <span className="font-mono font-black text-xs sm:text-sm text-brand-yellow mt-0.5 block">
                        ₹{minPrice.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-brand-yellow transition-colors shrink-0">
                      <span>Shop</span>
                      <ArrowRight
                        size={13}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
