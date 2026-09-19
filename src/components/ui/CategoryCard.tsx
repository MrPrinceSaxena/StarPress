import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryItem } from "@/lib/data";

export interface CategoryCardProps {
  category: CategoryItem;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={category.href}
      className="group flex flex-col items-center focus-visible:outline-none"
    >
      {/* Tile Container */}
      <div
        className={`relative w-full aspect-square rounded-2xl p-4 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-black/60 ${category.bgColorClass}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={category.imageSrc}
            alt={category.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Category Name */}
      <span className="mt-3 text-sm md:text-base font-bold text-center text-text-primary group-hover:text-brand-yellow transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
