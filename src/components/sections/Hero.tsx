import React from "react";
import Image from "next/image";
import { Gem, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          {/* Left Column: Text and CTAs */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-slate-300 shadow-sm">
              <Gem size={13} className="text-brand-yellow" />
              <span>Premium Printing for Every Idea</span>
            </div>

            {/* H1 Headline */}
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-tight uppercase">
              <span className="text-white">PRINT YOUR </span>
              <span className="text-brand-yellow">IDEAS TO LIFE</span>
            </h1>

            {/* Subcopy */}
            <div className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-lg space-y-1">
              <p>High quality prints for every idea.</p>
              <p>Business. Events. Personal. Everything Custom.</p>
            </div>

            {/* CTA Row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                href="/shop"
                className="!px-7 !py-3.5 !text-base font-bold shadow-lg shadow-black/40"
              >
                <span>Shop Now</span>
                <ArrowRight size={18} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/bulk-orders"
                className="!px-7 !py-3.5 !text-base font-semibold"
              >
                Get a Quote
              </Button>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic */}
          <div className="relative w-full flex items-center justify-center">
            <div className="relative w-full aspect-[4/3] max-w-[620px] rounded-2xl overflow-hidden border border-border-subtle bg-bg-surface shadow-2xl shadow-black/80">
              <Image
                src="/images/hero-composition.jpg"
                alt="Star Press custom printed products collage with Good Ideas Print Well packaging box and mugs"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 620px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
