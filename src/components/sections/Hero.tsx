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
    alt: "Star Press custom printed products — Good Ideas Print Well packaging with branded mugs",
    badge: "Premium Printing for Every Idea",
    headline: ["PRINT YOUR IDEAS", "TO LIFE"],
    highlightIndex: 1,
    sub: "High quality prints for every idea.\nBusiness. Events. Personal. Everything Custom.",
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
];

const AUTOPLAY_MS = 5000;

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (AUTOPLAY_MS / 50);
    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 100;
        }
        return p + step;
      });
    }, 50);
  }, []);

  const go = useCallback(
    (index: number, direction: "next" | "prev") => {
      if (animating || index === current) return;
      clearTimers();
      setDir(direction);
      setPrev(current);
      setCurrent(index);
      setAnimating(true);
    },
    [animating, current]
  );

  const goNext = useCallback(() => {
    go((current + 1) % slides.length, "next");
  }, [current, go]);

  const goPrev = useCallback(() => {
    go((current - 1 + slides.length) % slides.length, "prev");
  }, [current, go]);

  // Reset animation lock
  useEffect(() => {
    if (!animating) return;
    const t = setTimeout(() => {
      setAnimating(false);
      setPrev(null);
    }, 750);
    return () => clearTimeout(t);
  }, [animating]);

  // Autoplay + progress bar
  useEffect(() => {
    startProgress();
    timerRef.current = setTimeout(() => {
      goNext();
    }, AUTOPLAY_MS);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const slide = slides[current];
  const prevSlide = prev !== null ? slides[prev] : null;

  return (
    <>
      <style>{`
        @keyframes heroSlideInRight {
          from { transform: translateX(8%); opacity: 0; }
          to   { transform: translateX(0);  opacity: 1; }
        }
        @keyframes heroSlideInLeft {
          from { transform: translateX(-8%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes heroSlideOutLeft {
          from { transform: translateX(0);  opacity: 1; }
          to   { transform: translateX(-4%); opacity: 0; }
        }
        @keyframes heroSlideOutRight {
          from { transform: translateX(0);  opacity: 1; }
          to   { transform: translateX(4%); opacity: 0; }
        }
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hs-enter-next { animation: heroSlideInRight 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .hs-enter-prev { animation: heroSlideInLeft  0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .hs-exit-next  { animation: heroSlideOutLeft  0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .hs-exit-prev  { animation: heroSlideOutRight 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .hs-content    { animation: heroFadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .hs-content-d1 { animation-delay: 0.08s; }
        .hs-content-d2 { animation-delay: 0.18s; }
        .hs-content-d3 { animation-delay: 0.28s; }
        .hs-content-d4 { animation-delay: 0.38s; }
      `}</style>

      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: "clamp(480px, 88vh, 780px)" }}
      >
        {/* ── Slide layers ── */}

        {/* Exiting slide */}
        {animating && prevSlide && (
          <div
            key={`exit-${prev}`}
            className={`absolute inset-0 ${
              dir === "next" ? "hs-exit-next" : "hs-exit-prev"
            }`}
            style={{ zIndex: 1 }}
          >
            <Image
              src={prevSlide.src}
              alt={prevSlide.alt}
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Gradient overlay on exiting */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(11,12,16,0.97) 0%, rgba(11,12,16,0.82) 38%, rgba(11,12,16,0.45) 62%, rgba(11,12,16,0.15) 100%)",
              }}
            />
          </div>
        )}

        {/* Active slide */}
        <div
          key={`enter-${current}`}
          className={`absolute inset-0 ${
            animating
              ? dir === "next"
                ? "hs-enter-next"
                : "hs-enter-prev"
              : ""
          }`}
          style={{ zIndex: 2 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={current === 0}
            sizes="100vw"
            className="object-cover object-center"
          />

          {/* Left-to-right gradient: keeps text readable, fades naturally to right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(11,12,16,0.97) 0%, rgba(11,12,16,0.85) 32%, rgba(11,12,16,0.50) 56%, rgba(11,12,16,0.10) 80%, transparent 100%)",
            }}
          />
          {/* Bottom vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(11,12,16,0.65) 0%, transparent 40%)",
            }}
          />
        </div>

        {/* ── Content overlay ── */}
        <div
          className="relative flex flex-col justify-center h-full px-6 sm:px-10 lg:px-20"
          style={{
            zIndex: 10,
            minHeight: "clamp(480px, 88vh, 780px)",
            paddingTop: "clamp(80px, 12vh, 120px)",
            paddingBottom: "clamp(80px, 12vh, 120px)",
          }}
        >
          <div className="max-w-[620px]">
            {/* Badge */}
            <div
              key={`badge-${current}`}
              className="hs-content hs-content-d1 inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-slate-300 mb-5"
            >
              <Gem size={13} className="text-brand-yellow flex-shrink-0" />
              <span>{slide.badge}</span>
            </div>

            {/* Headline */}
            <h1
              key={`h1-${current}`}
              className="hs-content hs-content-d2 font-display font-black leading-[1.04] tracking-tight uppercase mb-5"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
            >
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
            <div
              key={`sub-${current}`}
              className="hs-content hs-content-d3 text-base sm:text-lg text-slate-300 leading-relaxed mb-8 space-y-1"
            >
              {slide.sub.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>

            {/* CTAs */}
            <div
              key={`cta-${current}`}
              className="hs-content hs-content-d4 flex flex-wrap items-center gap-4"
            >
              <Button
                variant="primary"
                size="lg"
                href={slide.cta.href}
                className="!px-7 !py-3.5 !text-base font-bold shadow-lg shadow-black/40"
              >
                <span>{slide.cta.label}</span>
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
        </div>

        {/* ── Prev / Next arrows ── */}
        <button
          onClick={() => { clearTimers(); goPrev(); }}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => { clearTimers(); goNext(); }}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all duration-200 backdrop-blur-md"
        >
          <ChevronRight size={22} />
        </button>

        {/* ── Bottom nav: dots + progress ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearTimers(); go(i, i > current ? "next" : "prev"); }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
              className="relative flex items-center justify-center"
            >
              {i === current ? (
                /* Active: pill with animated progress fill */
                <span className="relative block w-10 h-2 rounded-full bg-white/20 overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 bg-brand-yellow rounded-full transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              ) : (
                <span className="block w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-colors duration-200" />
              )}
            </button>
          ))}
        </div>

        {/* Slide counter */}
        <div className="absolute bottom-6 right-5 z-20 text-xs text-white/50 font-medium tabular-nums select-none">
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </div>
      </section>
    </>
  );
}
