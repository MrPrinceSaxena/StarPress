"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, Star } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import Button from "@/components/ui/Button";

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
}: MobileNavDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-xs bg-bg-surface border-l border-border-subtle p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2 font-display font-black text-xl tracking-tight text-white"
            >
              <Star className="text-brand-yellow fill-brand-yellow" size={20} />
              <span>STAR PRESS</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-3 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="text-zinc-600" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Drawer Bottom Action */}
        <div className="pt-6 border-t border-border-subtle">
          <Button
            variant="primary"
            size="lg"
            href="/quote"
            className="w-full justify-center"
            onClick={onClose}
          >
            Get a Quote
          </Button>
          <p className="text-center text-xs text-text-muted mt-4">
            Turning Ideas Into Print
          </p>
        </div>
      </div>
    </div>
  );
}
