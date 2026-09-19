"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, ChevronRight, Star, Phone, MessageCircle, ShoppingBag, Sparkles, User, LogOut, ShieldCheck } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
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
  const { data: session } = useSession();

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

            {/* Auth / Account Links */}
            <div className="pt-2 mt-2 border-t border-border-subtle">
              {session?.user ? (
                <div className="space-y-1">
                  <div className="px-3.5 py-2 flex items-center gap-3 bg-white/[0.03] border border-border-subtle rounded-xl mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow font-bold text-xs uppercase">
                      {session.user.name?.[0] || session.user.email?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{session.user.name || "Customer"}</p>
                      <p className="text-[10px] text-text-muted truncate">{session.user.email}</p>
                    </div>
                    {session.user.role === "ADMIN" && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                        Admin
                      </span>
                    )}
                  </div>

                  <Link
                    href="/account"
                    onClick={onClose}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <User size={16} className="text-brand-cyan" />
                      <span>My Account & Orders</span>
                    </div>
                    <ChevronRight size={15} className="text-zinc-500" />
                  </Link>

                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin/orders"
                      onClick={onClose}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-brand-cyan hover:text-white hover:bg-brand-cyan/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={16} />
                        <span>Admin Console</span>
                      </div>
                      <ChevronRight size={15} className="text-zinc-500" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-yellow hover:bg-brand-yellow/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User size={16} />
                    <span>Sign In / Register</span>
                  </div>
                  <ChevronRight size={15} className="text-brand-yellow" />
                </Link>
              )}
            </div>
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
