"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  ChevronDown,
  Search,
  ShoppingBag,
  Menu,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import MobileNavDrawer from "./MobileNavDrawer";
import { useCart } from "@/context/CartContext";

export interface HeaderProps {
  cartCount?: number;
}

export default function Header({ cartCount: propCartCount }: HeaderProps) {
  const { totalCount: dynamicCartCount } = useCart();
  const cartCount = propCartCount !== undefined ? propCartCount : dynamicCartCount;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <span>{link.label}</span>
                {link.hasDropdown && (
                  <ChevronDown
                    size={14}
                    className="text-text-secondary group-hover:text-white"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search Icon Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Search"
                className="p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow"
              >
                <Search size={19} />
              </button>

              {/* Quick Search Popover */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-bg-surface border border-border-subtle rounded-xl p-3 shadow-2xl z-50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
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

            {/* "Get a Quote" Button (Desktop) */}
            <div className="hidden sm:block">
              <Button
                variant="primary"
                size="md"
                href="/quote"
                className="!px-5 !py-2.5 !text-sm font-semibold !bg-brand-yellow !text-black hover:!bg-[#FFE04D]"
              >
                Get a Quote
              </Button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow"
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
