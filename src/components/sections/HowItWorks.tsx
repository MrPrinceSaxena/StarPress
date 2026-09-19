import React from "react";
import {
  Layers,
  UploadCloud,
  CheckCircle2,
  Printer,
  Truck,
  ArrowRight,
} from "lucide-react";
import { HOW_IT_WORKS_STEPS, HowItWorksStep } from "@/lib/data";

const ICON_MAP = {
  Layers,
  UploadCloud,
  CheckCircle2,
  Printer,
  Truck,
};

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/5 text-slate-300 text-xs font-semibold tracking-wider uppercase">
            <span>Seamless Ordering</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight uppercase">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-text-secondary">
            From design upload to doorstep delivery in 5 simple, transparent steps.
          </p>
        </div>

        {/* 5-Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
          {HOW_IT_WORKS_STEPS.map((stepItem: HowItWorksStep, index: number) => {
            const IconComponent = ICON_MAP[stepItem.iconName];
            const isLast = index === HOW_IT_WORKS_STEPS.length - 1;

            return (
              <div
                key={stepItem.step}
                className="relative flex flex-col justify-between p-6 rounded-2xl bg-bg-surface border border-border-subtle hover:border-white/20 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
              >
                {/* Step indicator header */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={`inline-flex items-center justify-center font-display font-black text-xs px-2.5 py-1 rounded-full border ${stepItem.badgeColorClass}`}
                    >
                      STEP {stepItem.step}
                    </span>

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center bg-bg-surface-alt border border-border-subtle group-hover:scale-110 transition-transform duration-200 ${stepItem.accentColorClass}`}
                    >
                      <IconComponent size={20} />
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-lg text-text-primary tracking-tight mb-2 group-hover:text-white transition-colors">
                    {stepItem.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {stepItem.description}
                  </p>
                </div>

                {/* Subtle horizontal arrow indicator for desktop navigation */}
                {!isLast && (
                  <div className="hidden lg:flex items-center gap-1 mt-6 pt-3 border-t border-border-subtle/50 text-text-muted text-xs group-hover:text-brand-yellow transition-colors">
                    <span>Next step</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
                {isLast && (
                  <div className="hidden lg:flex items-center gap-1 mt-6 pt-3 border-t border-border-subtle/50 text-brand-yellow font-semibold text-xs">
                    <span>Ready for dispatch!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
