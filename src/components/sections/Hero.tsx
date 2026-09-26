"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Gem, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface Slide {
  src: string;
  alt: string;
  badge: string;
  headline: string[];
  highlightIndex: number; // which line to colour with brand-yellow
  sub: string;
  cta: { label: string; href: string };
}

const slides: Slide[] = [
  {
    src: "/images/hero-composition.jpg",
    alt: "Star Press — Premier Custom Printing Press in Khatima, Uttarakhand",
    badge: "Premier Printing Press in Khatima, Uttarakhand",
    headline: ["PRINT YOUR IDEAS", "TO LIFE"],
    highlightIndex: 1,
    sub: "High quality custom printing in Khatima & Pan-India.\nVisiting Cards • Flex Banners • 3D Letters • Neon Signs • Custom Packaging",
    cta: { label: "Shop All Products", href: "/shop" },
  },
  {
    src: "/images/Slider/VisitingCards.png",
    alt: "Premium visiting cards printed by Star Press",
    badge: "Business Essentials",
    headline: ["MAKE EVERY", "FIRST IMPRESSION COUNT"],
    highlightIndex: 1,
    sub: "Premium visiting cards that speak before you do.\nCrisp finishes. Bold designs. Fast delivery.",
    cta: { label: "Explore Visiting Cards", href: "/shop/business-cards" },
  },
  {
    src: "/images/Slider/3D_LetterBoard.png",
    alt: "3D Letter Board custom printing by Star Press",
    badge: "Signage & Displays",
    headline: ["STAND OUT WITH", "3D LETTER BOARDS"],
    highlightIndex: 1,
    sub: "Dimensional letters that demand attention.\nPerfect for retail, events & corporate spaces.",
    cta: { label: "Explore 3D Letter Boards", href: "/shop/3d-letter-board" },
  },
  {
    src: "/images/Slider/LEDNamePlates.png",
    alt: "LED Name Plates custom printing by Star Press",
    badge: "Illuminated Signage",
    headline: ["LIGHT UP YOUR", "BRAND IDENTITY"],
    highlightIndex: 1,
    sub: "Glowing LED name plates for offices & showrooms.\nCustom colours, shapes & sizes available.",
    cta: { label: "Explore LED Name Plates", href: "/shop/name-plates" },
  },
  {
    src: "/images/Slider/NeonBoards.png",
    alt: "Neon Boards custom printing by Star Press",
    badge: "Neon & Glow Signs",
    headline: ["GLOW DIFFERENT,", "GLOW BOLD"],
    highlightIndex: 1,
    sub: "Eye-catching neon boards for cafes, studios & events.\nBring vibrant energy to any space.",
    cta: { label: "Explore Neon Boards", href: "/shop/neon-boards" },
  },
  {
    src: "/images/Slider/CustomizeKeychainNamePlate.png",
    alt: "Customized Keychains and Name Plates by Star Press",
    badge: "Custom Merchandise & Gifts",
    headline: ["CUSTOMIZE EVERY", "DETAIL WITH STYLE"],
    highlightIndex: 1,
    sub: "Personalized keychains and custom name plates crafted to perfection.\nGreat for gifts, branding, and daily use.",
    cta: { label: "Explore Custom Keychains", href: "/shop/keychain-printing" },
  },
];

const AUTOPLAY_MS = 5000;

export default function Hero() {
  const [current, setCurrent] = useState(0);

  // Touch swipe support for native mobile feel
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Navigate to next slide
  const handleNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  // Navigate to previous slide
  const handlePrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Directly select slide on dot click
  const handleSelect = useCallback((index: number) => {
    setCurrent((prev) => {
      if (index === prev) return prev;
      return index;
    });
  }, []);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  // Continuous uninterrupted autoplay: whenever current changes (either by timer or user click),
  // a clean new 5s timer starts. It NEVER gets stuck or cancelled indefinitely.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTOPLAY_MS);

    return () => clearTimeout(timer);
  }, [current]);

  const slide = slides[current];

  return (
    <>
      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroProgressFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .hs-content    { animation: heroFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .hs-content-d1 { animation-delay: 0.04s; }
        .hs-content-d2 { animation-delay: 0.10s; }
        .hs-content-d3 { animation-delay: 0.18s; }
        .hs-content-d4 { animation-delay: 0.25s; }
        .hs-progress-active {
          animation: heroProgressFill ${AUTOPLAY_MS}ms linear forwards;
        }
      `}</style>

      <section
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden select-none min-h-[560px] xs:min-h-[600px] sm:min-h-[650px] md:min-h-[700px] lg:min-h-[82vh] lg:max-h-[840px] flex items-center"
      >
        {/* ── Background Slide Images (Netflix-style smooth crossfade & scale) ── */}
        {slides.map((s, index) => {
          const isActive = index === current;
          return (
            <div
              key={s.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <div
                className={`relative w-full h-full transform transition-transform duration-1000 ease-out ${
                  isActive ? "scale-100" : "scale-105"
                }`}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center sm:object-center"
                />
              </div>

              {/* Full-coverage vertical vignette for mobile (guarantees text contrast on any bright image) */}
              <div
                className="absolute inset-0 md:hidden"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(11,12,16,0.88) 0%, rgba(11,12,16,0.72) 35%, rgba(11,12,16,0.90) 75%, #0B0C10 100%)",
                }}
              />

              {/* Left-to-right cinematic gradient for tablet/desktop */}
              <div
                className="hidden md:block absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(11,12,16,0.96) 0%, rgba(11,12,16,0.88) 36%, rgba(11,12,16,0.55) 60%, rgba(11,12,16,0.12) 85%, transparent 100%)",
                }}
              />

              {/* Bottom vignette blending seamlessly into the next page section */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(0deg, rgba(11,12,16,0.85) 0%, transparent 30%)",
                }}
              />
            </div>
          );
        })}

        {/* ── Content overlay (Staggered fade-up per slide, aligned & responsive across all devices) ── */}
        <div className="relative z-20 w-full max-w-[1280px] mx-auto px-5 xs:px-6 sm:px-10 lg:px-16 xl:px-20 pt-16 pb-20 xs:pt-20 xs:pb-24 sm:py-24 md:py-28 lg:py-32">
          <div key={`content-${current}`} className="max-w-[640px] w-full">
            {/* Pill Badge */}
            <div className="hs-content hs-content-d1 inline-flex items-center gap-1.5 sm:gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] sm:text-xs text-slate-300 mb-3.5 sm:mb-5">
              <Gem size={12} className="text-brand-yellow flex-shrink-0" />
              <span className="font-medium tracking-wide">{slide.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="hs-content hs-content-d2 font-display font-black leading-[1.08] tracking-tight uppercase mb-3.5 sm:mb-5 text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px]">
              {slide.headline.map((line, i) => (
                <span
                  key={i}
                  className={`block ${
                    i === slide.highlightIndex
                      ? "text-brand-yellow"
                      : "text-white"
                  }`}
                >
                  {line}
                </span>
              ))}
            </h1>

            {/* Subcopy */}
            <div className="hs-content hs-content-d3 text-xs xs:text-sm sm:text-base text-slate-200/90 leading-relaxed mb-6 sm:mb-8 space-y-0.5 sm:space-y-1 max-w-xl">
              {slide.sub.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* CTAs — Full width stacked on narrow phones, inline row on larger screens */}
            <div className="hs-content hs-content-d4 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 w-full xs:w-auto pt-1">
              <Button
                variant="primary"
                size="lg"
                href={slide.cta.href}
                className="w-full xs:w-auto justify-center text-center !px-6 sm:!px-7 !py-3 sm:!py-3.5 !text-xs xs:!text-sm sm:!text-base font-bold shadow-lg shadow-black/50"
              >
                <span>{slide.cta.label}</span>
                <ArrowRight size={17} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                href="/bulk-orders"
                className="w-full xs:w-auto justify-center text-center !px-6 sm:!px-7 !py-3 sm:!py-3.5 !text-xs xs:!text-sm sm:!text-base font-semibold"
              >
                Get a Quote
              </Button>
            </div>
          </div>
        </div>

        {/* ── Desktop Navigation Arrows (Positioned cleanly on sides, hidden on mobile so they don't block copy) ── */}
        <button
          onClick={handlePrev}
          aria-label="Previous slide"
          className="hidden md:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-11 h-11 rounded-full bg-black/45 border border-white/10 text-white hover:bg-black/75 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={handleNext}
          aria-label="Next slide"
          className="hidden md:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-11 h-11 rounded-full bg-black/45 border border-white/10 text-white hover:bg-black/75 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>

        {/* ── Bottom Controls Dock (Dots + Slide Counter nicely aligned & fitting on all screen sizes) ── */}
        <div className="absolute bottom-4 xs:bottom-5 sm:bottom-7 inset-x-0 z-30 flex items-center justify-between px-5 xs:px-6 sm:px-10 lg:px-16 xl:px-20 max-w-[1280px] mx-auto pointer-events-none">
          {/* Dot indicators */}
          <div className="flex items-center gap-2 xs:gap-2.5 pointer-events-auto">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                className="relative flex items-center justify-center p-1 cursor-pointer focus:outline-none"
              >
                {i === current ? (
                  /* Active slide: pill shape with CSS progress fill */
                  <span className="relative block w-8 xs:w-10 h-1.5 xs:h-2 rounded-full bg-white/20 overflow-hidden">
                    <span
                      key={`bar-${current}`}
                      className="absolute inset-y-0 left-0 bg-brand-yellow rounded-full hs-progress-active"
                    />
                  </span>
                ) : (
                  <span className="block w-2 xs:w-2.5 h-1.5 xs:h-2 rounded-full bg-white/30 hover:bg-white/70 transition-colors duration-200" />
                )}
              </button>
            ))}
          </div>

          {/* Slide counter */}
          <div className="pointer-events-auto text-[10px] xs:text-xs text-white/70 font-mono font-medium tabular-nums px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 select-none">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </div>
      </section>
    </>
  );
}
