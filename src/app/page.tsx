import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import CategoryGrid from "@/components/sections/CategoryGrid";
import BestSellers from "@/components/sections/BestSellers";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import HowItWorks from "@/components/sections/HowItWorks";
import BulkOrderBanner from "@/components/sections/BulkOrderBanner";
import PromoBanner from "@/components/sections/PromoBanner";
import Testimonials from "@/components/sections/Testimonials";
import CTASection from "@/components/sections/CTASection";
import Newsletter from "@/components/sections/Newsletter";
import { getAllCategories } from "@/lib/catalog";
import { getLiveCatalogProducts } from "@/server/products";

import { db } from "@/lib/db";
import type { Slide } from "@/components/sections/Hero";

export const revalidate = 3600;

export default async function HomePage() {
  const categories = getAllCategories();
  
  // Run independent DB queries in parallel for faster TTFB
  const [allProducts, slideSettingResult] = await Promise.all([
    getLiveCatalogProducts(),
    db.storeSetting.findUnique({ where: { key: "HERO_SLIDER" } }).catch(err => {
      console.warn("Failed to fetch dynamic slides:", err);
      return null;
    })
  ]);
  
  let dynamicSlides: Slide[] | undefined = undefined;
  if (slideSettingResult && slideSettingResult.value) {
    dynamicSlides = slideSettingResult.value as unknown as Slide[];
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      {/* 1. Header Navigation */}
      <Header />

      {/* Main Content: Exact sequence per PRD §5.1 and 00-PROJECT-OVERVIEW */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero slides={dynamicSlides} />

        {/* 2.1 Trust Badges Strip */}
        <TrustBadges />

        {/* 3. Shop by Category */}
        <div id="categories" className="scroll-mt-24">
          <CategoryGrid categories={categories} products={allProducts} />
        </div>

        {/* 4. Best Selling Products */}
        <div id="shop" className="scroll-mt-24">
          <BestSellers />
        </div>

        {/* 5. Why Choose STAR PRESS? */}
        <div id="about" className="scroll-mt-24">
          <WhyChooseUs />
        </div>

        {/* 6. How It Works (5-Step Process) */}
        <HowItWorks />

        {/* 7. Bulk Order Section (Corporate Lead Gen CTA) */}
        <div id="bulk-orders" className="scroll-mt-24">
          <BulkOrderBanner />
        </div>

        {/* 7.1 Custom Printing Promo Banner */}
        <div id="custom-printing" className="scroll-mt-24">
          <PromoBanner />
        </div>

        {/* 8. Customer Reviews & Testimonials */}
        <Testimonials />

        {/* 9. Standalone CTA Section (Get Started / WhatsApp) */}
        <div id="contact" className="scroll-mt-24">
          <CTASection />
        </div>

        {/* 9.1 Newsletter Subscription */}
        <Newsletter />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}

