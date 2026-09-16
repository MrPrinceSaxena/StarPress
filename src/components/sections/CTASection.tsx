import React from "react";
import { ArrowRight, MessageCircle, Sparkles, Zap, ShieldCheck, Truck, Award } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-brand-magenta/15 via-brand-cyan/15 to-brand-yellow/15 rounded-full blur-[150px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 relative z-10">
        <div className="relative rounded-[28px] border border-border-subtle bg-bg-surface/80 backdrop-blur-md p-8 sm:p-14 lg:p-16 text-center shadow-2xl overflow-hidden">
          {/* Subtle Corner Accents */}
          <div
            className="absolute -top-16 -left-16 w-32 h-32 bg-brand-cyan/20 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -right-16 w-32 h-32 bg-brand-magenta/20 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-magenta/40 bg-brand-magenta/10 text-brand-magenta text-xs font-bold tracking-wider uppercase">
              <Sparkles size={14} />
              <span>Bring Your Vision to Life</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase text-white tracking-tight leading-[1.1]">
              Ready to Turn Your Ideas Into <span className="text-brand-magenta">High-Impact</span> Prints?
            </h2>

            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Whether you need 100 premium business cards or 10,000 corporate brochures, our pre-press team ensures vibrant color fidelity, durable finishes, and expedited Pan-India delivery.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="lg"
                href="/shop"
                className="!px-8 !py-4 !text-base font-bold shadow-xl shadow-brand-yellow/20"
              >
                <span>Start Your Order</span>
                <ArrowRight size={18} />
              </Button>

              <a
                href="https://wa.me/919876543210?text=Hi%20Star%20Press%2C%20I%20want%20to%20place%20a%20printing%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60 text-sm font-bold transition-all shadow-md"
              >
                <MessageCircle size={18} />
                <span>WhatsApp Us Directly</span>
              </a>
            </div>

            {/* Reassurance Micro-Badges */}
            <div className="pt-8 sm:pt-10 border-t border-border-subtle/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-text-secondary">
              <div className="flex items-center justify-center gap-2">
                <Zap size={16} className="text-brand-yellow shrink-0" />
                <span>Fast Turnaround</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Award size={16} className="text-brand-cyan shrink-0" />
                <span>Commercial 2400 DPI</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck size={16} className="text-brand-magenta shrink-0" />
                <span>100% Quality Checked</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Truck size={16} className="text-brand-yellow shrink-0" />
                <span>Insured Pan-India Transit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
