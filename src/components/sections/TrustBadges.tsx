import React from "react";
import { TRUST_BADGES } from "@/lib/data";
import IconBadge from "@/components/ui/IconBadge";

export default function TrustBadges() {
  return (
    <section className="w-full border-t border-b border-border-subtle py-10 bg-bg-base">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-3.5 sm:gap-4 justify-start group"
            >
              <IconBadge
                iconName={badge.iconName}
                variant="outline"
                outlineColor="border-brand-magenta"
                size="md"
                className="group-hover:border-brand-magenta group-hover:scale-105 transition-transform duration-200"
              />
              <div>
                <div className="text-sm sm:text-base font-bold text-text-primary tracking-tight font-display">
                  {badge.title}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {badge.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
