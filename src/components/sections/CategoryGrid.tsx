import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import CategoryCard from "@/components/ui/CategoryCard";

export default function CategoryGrid() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary tracking-tight">
            Shop by Category
          </h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:text-cyan-300 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-150"
            />
          </Link>
        </div>

        {/* 8 Category Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 sm:gap-4">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
