"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitted(true);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="relative rounded-2xl border border-brand-magenta/50 bg-bg-surface p-8 sm:p-10 lg:p-12 overflow-hidden shadow-2xl">
          {/* Ambient Lighting */}
          <div
            className="absolute top-0 left-10 w-[350px] h-[250px] bg-brand-yellow/10 rounded-full blur-[100px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-10 w-[350px] h-[250px] bg-brand-magenta/15 rounded-full blur-[100px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Zone: Form */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight">
                Let&apos;s Print Something Amazing
              </h2>
              <p className="text-sm sm:text-base text-text-secondary max-w-lg">
                Be the first to know about new products, offers and creative ideas.
              </p>

              {isSubmitted ? (
                <div className="p-4 rounded-xl bg-brand-magenta/15 border border-brand-magenta/40 text-white text-sm font-semibold max-w-md">
                  🎉 Thanks for subscribing! Check your inbox for your 10% welcome coupon.
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md pt-2"
                >
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className="flex-1 bg-bg-surface-alt border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow transition-colors"
                  />
                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    className="!px-6 !py-3 !text-sm font-bold shadow-md shrink-0"
                  >
                    Subscribe
                  </Button>
                </form>
              )}

              {error && (
                <p className="text-xs text-brand-magenta font-medium">{error}</p>
              )}
            </div>

            {/* Right Zone: Doodle Graphic */}
            <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
              <div className="relative flex items-center gap-4 sm:gap-6 py-4">
                {/* Hand-drawn style curved cyan arrow */}
                <div className="relative shrink-0 text-brand-cyan">
                  <svg
                    width="110"
                    height="70"
                    viewBox="0 0 110 70"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform -rotate-6"
                  >
                    <path
                      d="M10 50 C 40 55, 75 45, 95 18"
                      stroke="#29C5F6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M80 15 L 98 16 L 93 33"
                      stroke="#29C5F6"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Rotated Handwritten Text Doodle */}
                <div className="relative transform -rotate-8 select-none">
                  {/* Paint-splash decorative accents behind doodle */}
                  <div
                    className="absolute -top-3 -left-4 w-12 h-12 bg-brand-yellow/30 rounded-full blur-md"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -bottom-2 -right-3 w-14 h-14 bg-brand-magenta/30 rounded-full blur-md"
                    aria-hidden="true"
                  />

                  <div className="relative font-script text-2xl sm:text-3xl lg:text-4xl text-white tracking-wider leading-tight text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                    <div>GOOD</div>
                    <div>IDEAS</div>
                    <div className="text-brand-magenta">PRINT WELL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
