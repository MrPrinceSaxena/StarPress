"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  ChevronDown,
  Search,
  ShoppingBag,
  Menu,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { NAV_LINKS } from "@/lib/data";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import MobileNavDrawer from "./MobileNavDrawer";
import { useCart } from "@/context/CartContext";

export interface HeaderProps {
  cartCount?: number;
}

export default function Header({ cartCount: propCartCount }: HeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { totalCount: dynamicCartCount } = useCart();
  const cartCount = propCartCount !== undefined ? propCartCount : dynamicCartCount;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShopHovered, setIsShopHovered] = useState(false);

  // Close search popover on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsShopHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const featuredCategories = [
    { name: "Business Stationery", slug: "business-printing", desc: "Cards, Letterheads, Envelopes" },
    { name: "Marketing & Promo", slug: "marketing-materials", desc: "Flyers, Brochures, Booklets" },
    { name: "Large Format Signage", slug: "outdoor-advertising", desc: "Banners, Standees, Vinyls" },
    { name: "Custom Stickers", slug: "labels-stickers", desc: "Die-Cut, Holographic, Roll" },
    { name: "Corporate Merchandise", slug: "photo-custom-printing", desc: "Mugs, Pens, Diaries, Kits" },
    { name: "Custom Packaging", slug: "packaging", desc: "Boxes, Poly Mailers, Tape" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-bg-base/90 backdrop-blur-md border-b border-border-subtle transition-all duration-200">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:outline-none rounded-lg"
          >
            <Star
              size={20}
              className="text-brand-yellow fill-brand-yellow group-hover:rotate-12 transition-transform duration-200"
            />
            <span className="font-display font-black text-xl tracking-tight text-text-primary">
              STAR PRESS
            </span>
          </Link>

          {/* Center: Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center gap-1 xl:gap-2"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => setIsShopHovered(true)}
                    onMouseLeave={() => setIsShopHovered(false)}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        size={14}
                        className={`text-text-secondary transition-transform duration-200 ${
                          isShopHovered ? "rotate-180 text-brand-yellow" : ""
                        }`}
                      />
                    </Link>

                    {/* Shop Desktop Megamenu Popover */}
                    {isShopHovered && (
                      <div className="absolute left-0 top-full pt-2 w-[420px] z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-2xl space-y-3">
                          <div className="flex items-center justify-between px-2 pb-2 border-b border-border-subtle">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                              Popular Categories
                            </span>
                            <Link
                              href="/categories"
                              onClick={() => setIsShopHovered(false)}
                              className="text-xs text-brand-yellow hover:underline font-semibold"
                            >
                              All 8 Categories →
                            </Link>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {featuredCategories.map((cat) => (
                              <Link
                                key={cat.slug}
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => setIsShopHovered(false)}
                                className="p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-border-subtle transition-all group/item"
                              >
                                <div className="text-xs font-bold text-white group-hover/item:text-brand-yellow transition-colors line-clamp-1">
                                  {cat.name}
                                </div>
                                <div className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                                  {cat.desc}
                                </div>
                              </Link>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-border-subtle flex items-center justify-between px-2 text-xs">
                            <Link
                              href="/custom-printing"
                              onClick={() => setIsShopHovered(false)}
                              className="text-brand-cyan hover:underline font-semibold"
                            >
                              Custom Printing Studio
                            </Link>
                            <Link
                              href="/bulk-orders"
                              onClick={() => setIsShopHovered(false)}
                              className="text-text-secondary hover:text-white"
                            >
                              Bulk B2B Rates
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Icon Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search products"
                className="p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Search size={19} />
              </button>

              {/* Quick Search Popover */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-bg-surface border border-border-subtle rounded-xl p-3 shadow-2xl z-50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        router.push(
                          `/shop?search=${encodeURIComponent(searchQuery.trim())}`
                        );
                      }
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Search cards, banners, mugs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      autoComplete="off"
                      className="w-full bg-bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-xs text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow"
                    />
                    <Button variant="primary" size="sm" type="submit">
                      Go
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Cart Icon Button with Badge */}
            <Link
              href="/cart"
              aria-label={`Cart with ${cartCount} items`}
              className="relative p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <Badge
                  variant="notification"
                  className="absolute top-1.5 right-1.5 transform translate-x-1 -translate-y-1 bg-brand-magenta text-white font-black text-[10px] min-w-[16px] h-[16px] flex items-center justify-center shadow-md"
                >
                  {cartCount}
                </Badge>
              )}
            </Link>

            {/* User Account / Sign In Button */}
            <Link
              href={session?.user ? "/account" : "/login"}
              aria-label={session?.user ? `Account (${session.user.name})` : "Sign In"}
              className="relative p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              {session?.user ? (
                <div className="w-6 h-6 rounded-full bg-brand-yellow text-black font-black text-xs flex items-center justify-center shadow-sm">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
              ) : (
                <User size={20} />
              )}
            </Link>

            {/* "Get a Quote" Button (Desktop) */}
            <div className="hidden sm:block">
              <Button
                variant="primary"
                size="md"
                href="/custom-printing"
                className="!px-5 !py-2.5 !text-sm font-semibold !bg-brand-yellow !text-black hover:!bg-[#FFE04D]"
              >
                Get a Quote
              </Button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileOpen}
              className="lg:hidden p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <MobileNavDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />
    </>
  );
}
