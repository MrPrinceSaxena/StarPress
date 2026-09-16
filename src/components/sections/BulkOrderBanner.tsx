import React from "react";
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { BULK_ORDER_PERKS, BULK_VOLUME_TIERS, BulkVolumeTier } from "@/lib/data";

export default function BulkOrderBanner() {
  return (
    <section className="py-12 md:py-20">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="relative rounded-[28px] border border-border-subtle bg-gradient-to-br from-bg-surface via-[#161224] to-bg-surface p-8 sm:p-12 lg:p-14 overflow-hidden shadow-2xl">
          {/* Ambient Lighting Accents */}
          <div
            className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-brand-indigo/15 rounded-full blur-[140px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-brand-magenta/15 rounded-full blur-[120px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
            {/* Left Zone: Copy, Perks, and CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow text-xs font-bold tracking-wider uppercase">
                <Sparkles size={14} />
                <span>Corporate & Bulk Printing</span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase leading-[1.1] tracking-tight text-white">
                Bulk Printing Made <span className="text-brand-yellow">Effortless</span> & Affordable
              </h2>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
                Equip your company, corporate events, retail products, or institutional campaigns with top-tier print collateral. Unlock guaranteed volume pricing and priority press queuing.
              </p>

              {/* 2x2 Perks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {BULK_ORDER_PERKS.map((perk) => (
                  <div
                    key={perk.id}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-bg-surface-alt/70 border border-border-subtle/70"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-brand-cyan shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {perk.title}
                      </h4>
                      <p className="text-[11px] text-text-secondary leading-normal">
                        {perk.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Button
                  variant="primary"
                  size="lg"
                  href="/bulk-orders"
                  className="!px-7 !py-3.5 !text-sm font-bold shadow-lg shadow-brand-yellow/15"
                >
                  <span>Request a Bulk Quote</span>
                  <ArrowRight size={18} />
                </Button>

                <a
                  href="https://wa.me/919876543210?text=Hi%20Star%20Press%2C%20I%20have%20a%20bulk%20printing%20inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60 text-sm font-bold transition-all"
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp Inquiry</span>
                </a>
              </div>
            </div>

            {/* Right Zone: Wholesale Volume Slabs Card */}
            <div className="lg:col-span-5 relative">
              <div className="p-6 sm:p-7 rounded-2xl bg-bg-surface border border-border-subtle shadow-2xl relative space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div>
                    <h3 className="font-display font-bold text-base text-white">
                      Volume Discount Slabs
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Instant savings automatically applied
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-[11px] font-bold text-brand-cyan">
                    <ShieldCheck size={13} />
                    <span>GST Invoiced</span>
                  </div>
                </div>

                {/* Slabs List */}
                <div className="space-y-3">
                  {BULK_VOLUME_TIERS.map((tier: BulkVolumeTier, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        tier.featured
                          ? "bg-bg-surface-alt border-brand-magenta/60 shadow-[0_0_15px_rgba(240,23,156,0.15)]"
                          : "bg-bg-surface-alt/50 border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-bold text-sm text-white">
                          {tier.range}
                        </span>
                        <span
                          className={`font-display font-black text-xs px-2.5 py-0.5 rounded-full ${
                            tier.featured
                              ? "bg-brand-magenta text-white"
                              : "bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30"
                          }`}
                        >
                          {tier.discount}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {tier.perks}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-text-muted">
                    Custom specifications? Call our print desk directly at{" "}
                    <span className="text-white font-semibold">+91 99999 99999</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
