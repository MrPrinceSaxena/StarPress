"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, Star, Phone, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { NAV_LINKS, WHATSAPP_NUMBER, CONTACT_PHONE } from "@/lib/data";
import Button from "@/components/ui/Button";

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
}: MobileNavDrawerProps) {
  // Prevent body scroll and handle Escape key when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onClose]);

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
        className="fixed inset-y-0 right-0 w-full max-w-xs bg-bg-surface border-l border-border-subtle p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-5 border-b border-border-subtle">
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
              aria-label="Close navigation menu"
              className="p-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 flex flex-col space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
              >
                <span>{link.label}</span>
                <ChevronRight size={16} className="text-zinc-500" />
              </Link>
            ))}

            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-brand-yellow hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-brand-yellow" />
                <span>My Shopping Cart</span>
              </div>
              <ChevronRight size={16} className="text-zinc-500" />
            </Link>
          </nav>
        </div>

        {/* Drawer Bottom Actions: WhatsApp, Call, Quote */}
        <div className="pt-6 border-t border-border-subtle space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Star%20Press,%20I%20have%20an%20inquiry`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 border border-border-subtle text-text-secondary hover:text-white hover:bg-white/10 text-xs font-bold transition-colors"
            >
              <Phone size={14} />
              <span>Call Desk</span>
            </a>
          </div>

          <Button
            variant="primary"
            size="lg"
            href="/custom-printing"
            className="w-full justify-center !py-3 !text-sm font-bold shadow-lg shadow-brand-yellow/15"
            onClick={onClose}
          >
            <Sparkles size={16} />
            <span>Launch Print Studio</span>
          </Button>

          <p className="text-center text-[11px] text-text-muted">
            Pan-India Delivery • Pre-Press Verified
          </p>
        </div>
      </div>
    </div>
  );
}
