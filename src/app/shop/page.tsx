import React, { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShopClientView from "@/components/shop/ShopClientView";
import { getAllCategories } from "@/lib/catalog";
import { getLiveCatalogProducts } from "@/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commercial & Custom Printing Catalog | Star Press Khatima",
  description:
    "Explore our complete range of business cards, marketing flyers, flex banners, 3D acrylic letters, LED boards, stationery, and packaging available at Star Press, Khatima (Uttarakhand) with Pan-India delivery.",
  keywords: [
    "printing press catalog Khatima",
    "visiting cards Khatima",
    "flex banners Khatima",
    "3D letter boards Khatima",
    "neon signs Khatima",
    "Star Press store",
  ],
  alternates: {
    canonical: "https://starpress.in/shop",
  },
  openGraph: {
    title: "Commercial & Custom Printing Catalog | Star Press Khatima",
    description:
      "Explore our complete range of business cards, marketing flyers, flex banners, 3D acrylic letters, LED boards, and packaging from Star Press, Khatima.",
    url: "https://starpress.in/shop",
  },
};

export default function ShopPage() {
  const categories = getAllCategories();
  const allProducts = getLiveCatalogProducts();

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 lg:px-10 py-10 md:py-14">
        {/* Page Header Banner (Server Rendered for SEO) */}
        <div className="relative rounded-2xl border border-border-subtle bg-bg-surface p-8 sm:p-12 mb-10 overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} className="text-brand-yellow" />
              <span>Star Press Full Catalog</span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight leading-[1.1]">
              Commercial &amp; Custom Printing
            </h1>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Explore our complete range of business cards, marketing flyers, flex
              banners, corporate stationery, and custom merchandise with real-time
              multi-quantity pricing and Pan-India delivery.
            </p>
          </div>
        </div>

        {/* Client Interactive Filter & Grid */}
        <Suspense
          fallback={
            <div className="py-20 text-center text-text-secondary space-y-3">
              <div className="inline-block w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Loading products...
              </p>
            </div>
          }
        >
          <ShopClientView
            initialProducts={allProducts}
            categories={categories}
          />
        </Suspense>

        {/* Fallback Static Crawl Index for Search Engine Bots */}
        <noscript>
          <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Complete Product Directory</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {allProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/shop/${p.slug}`}
                    className="text-brand-yellow hover:underline"
                  >
                    {p.name} (Starting at ₹{p.basePrice})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </noscript>
      </main>

      <Footer />
    </div>
  );
}
