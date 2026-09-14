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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      {/* 1. Header Navigation */}
      <Header />

      {/* Main Content: Exact sequence per PRD §5.1 and 00-PROJECT-OVERVIEW */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero />

        {/* 2.1 Trust Badges Strip */}
        <TrustBadges />

        {/* 3. Shop by Category */}
        <CategoryGrid />

        {/* 4. Best Selling Products */}
        <BestSellers />

        {/* 5. Why Choose STAR PRESS? */}
        <WhyChooseUs />

        {/* 6. How It Works (5-Step Process) */}
        <HowItWorks />

        {/* 7. Bulk Order Section (Corporate Lead Gen CTA) */}
        <BulkOrderBanner />

        {/* 7.1 Custom Printing Promo Banner */}
        <PromoBanner />

        {/* 8. Customer Reviews & Testimonials */}
        <Testimonials />

        {/* 9. Standalone CTA Section (Get Started / WhatsApp) */}
        <CTASection />

        {/* 9.1 Newsletter Subscription */}
        <Newsletter />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}

