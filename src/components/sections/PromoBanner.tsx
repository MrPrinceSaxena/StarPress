import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function PromoBanner() {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="relative rounded-[28px] border border-brand-magenta/50 bg-gradient-to-r from-bg-surface via-[#181126] to-bg-surface overflow-hidden shadow-2xl">
          {/* Ambient Lighting Accents */}
          <div
            className="absolute top-0 right-1/4 w-[450px] h-[350px] bg-brand-magenta/20 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[350px] bg-brand-cyan/20 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center p-8 sm:p-12 lg:p-14 relative z-10">
            {/* Left Text Block */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase leading-[1.1] tracking-tight">
                <span className="text-white block">CUSTOM PRINTING</span>
                <span className="text-white">FOR A </span>
                <span className="text-brand-magenta">BOLDER </span>
                <span className="text-white">TOMORROW</span>
              </h2>

              <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
                From business essentials to personal creations, we print what your imagination demands.
              </p>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  href="/custom-printing"
                  className="!px-7 !py-3.5 !text-base font-bold shadow-lg shadow-brand-yellow/15"
                >
                  <span>Start Customizing</span>
                  <ArrowRight size={18} />
                </Button>
              </div>
            </div>

            {/* Right Visual Graphic */}
            <div className="lg:col-span-6 relative w-full flex items-center justify-center">
              <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] max-w-[580px] rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface-alt shadow-2xl group">
                <Image
                  src="/images/promo-banner.jpg"
                  alt="Custom printing mockups with Ideas Into Impact tote bag, notebook, tumbler, and mug"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
