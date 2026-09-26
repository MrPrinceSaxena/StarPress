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
    canonical: "https://starpress.in/categories",
  },
};

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14">
        {/* Banner */}
        <div className="relative rounded-[28px] border border-border-subtle bg-bg-surface p-8 sm:p-14 mb-12 overflow-hidden shadow-xl text-center md:text-left">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} className="text-brand-yellow" />
              <span>Full Printing Solutions</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase text-white tracking-tight leading-[1.1]">
              Explore All Print Categories
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              From everyday office stationery and promotional marketing flyers to massive flex hoardings and custom packaging, find the perfect print specs for your brand.
            </p>
          </div>
        </div>

        {/* 8 Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {categories.map((category) => {
            const categoryProducts = getProductsByCategory(category.slug);

            return (
              <div
                key={category.id}
                className="group relative rounded-2xl border border-border-subtle bg-bg-surface p-6 sm:p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-xl hover:shadow-black/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-bg-surface-alt border border-border-subtle shrink-0">
                      <Image
                        src={category.imageUrl}
                        alt={category.name}
                        fill
                        sizes="96px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <span className="text-xs font-mono text-text-muted">
                      {categoryProducts.length} Items Available
                    </span>
                  </div>

                  <h2 className="font-display font-black text-2xl text-white group-hover:text-brand-yellow transition-colors mb-1.5">
                    {category.name}
                  </h2>

                  <p className="text-xs font-semibold text-slate-400 mb-2">
                    {category.tagline}
                  </p>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                    {category.description}
                  </p>
                </div>

                <div>
                  {/* Sample products list */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {categoryProducts.slice(0, 4).map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-bg-surface-alt border border-border-subtle text-text-secondary font-medium"
                      >
                        {p.name}
                      </span>
                    ))}
                    {categoryProducts.length > 4 && (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-bg-surface-alt border border-border-subtle text-text-muted">
                        +{categoryProducts.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Browse Button */}
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="inline-flex items-center justify-between w-full py-3 px-4 rounded-xl bg-bg-surface-alt border border-border-subtle hover:border-brand-yellow/60 hover:text-brand-yellow text-xs sm:text-sm font-bold text-white transition-all group/btn"
                  >
                    <span>Browse {category.name}</span>
                    <ArrowRight
                      size={15}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
