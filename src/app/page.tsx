import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import TrustBadges from "@/components/sections/TrustBadges";
import CategoryGrid from "@/components/sections/CategoryGrid";
import BestSellers from "@/components/sections/BestSellers";
import PromoBanner from "@/components/sections/PromoBanner";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Testimonials from "@/components/sections/Testimonials";
import Newsletter from "@/components/sections/Newsletter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary selection:bg-brand-yellow selection:text-black">
      {/* 5.1 Header */}
      <Header />

      {/* Main Content: Exact sections from Section 5 in order */}
      <main className="flex-1">
        {/* 5.2 Hero Section */}
        <Hero />

        {/* 5.3 Trust Badges Strip */}
        <TrustBadges />

        {/* 5.4 Shop by Category */}
        <CategoryGrid />

        {/* 5.5 Best Selling Products */}
        <BestSellers />

        {/* 5.6 Custom Printing Promo Banner */}
        <PromoBanner />

        {/* 5.7 Why Choose STAR PRESS? */}
        <WhyChooseUs />

        {/* 5.8 Testimonials — "What Our Customers Say" */}
        <Testimonials />

        {/* 5.9 Newsletter CTA */}
        <Newsletter />
      </main>

      {/* 5.10 Footer */}
      <Footer />
    </div>
  );
}
