"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  Search,
  ShoppingBag,
  Menu,
  User,
  Package,
  MapPin,
  Settings,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import MobileNavDrawer from "./MobileNavDrawer";
import { useCart } from "@/context/CartContext";
import { useAuthSession } from "@/hooks/useAuthSession";

export interface HeaderProps {
  cartCount?: number;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  divider?: boolean;
  highlight?: boolean;
}

export default function Header({ cartCount: propCartCount }: HeaderProps) {
  const router = useRouter();
  const { session, status, isHydrated, signOut: authSignOut } = useAuthSession();
  const { totalCount: dynamicCartCount } = useCart();
  const cartCount = propCartCount !== undefined ? propCartCount : dynamicCartCount;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShopHovered, setIsShopHovered] = useState(false);

  // Profile menu state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsShopHovered(false);
        setIsProfileOpen(false);
        profileTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node) &&
        profileTriggerRef.current &&
        !profileTriggerRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleMenuItemClick = (href: string) => {
    setIsProfileOpen(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authSignOut();
    } catch (error) {
      console.error("[Header] Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  const getUserInitial = (): string => {
    const name = session?.user?.name || session?.user?.email || "";
    return name.charAt(0).toUpperCase() || "U";
  };

  const featuredCategories = [
    { name: "Business Stationery", slug: "business-printing", desc: "Cards, Letterheads, Envelopes" },
    { name: "Marketing & Promo", slug: "marketing-materials", desc: "Flyers, Brochures, Booklets" },
    { name: "Large Format Signage", slug: "outdoor-advertising", desc: "Banners, Standees, Vinyls" },
    { name: "Custom Stickers", slug: "labels-stickers", desc: "Die-Cut, Holographic, Roll" },
    { name: "Corporate Merchandise", slug: "photo-custom-printing", desc: "Mugs, Pens, Diaries, Kits" },
    { name: "Custom Packaging", slug: "packaging", desc: "Boxes, Poly Mailers, Tape" },
  ];

  const userEmail = (session?.user?.email || "").toLowerCase().trim();
  const isAdminUser =
    session?.user?.role === "ADMIN" ||
    userEmail === "admin@starpress.in" ||
    userEmail === "mrdigitalmarketerpro@gmail.com" ||
    Boolean(userEmail.endsWith("@starpress.in"));

  const authenticatedMenuItems: MenuItem[] = [
    ...(isAdminUser
      ? [
          {
            label: "Admin Portal",
            href: "/admin/dashboard",
            icon: <ShieldCheck size={17} className="text-brand-cyan shrink-0" />,
            description: "Manage orders, products, and store settings",
            highlight: true,
          },
        ]
      : []),
    {
      label: "My Orders & Tracking",
      href: "/account?tab=orders",
      icon: <Package size={17} className="text-brand-yellow shrink-0" />,
      description: "View order history & live shipment status",
    },
    {
      label: "Profile & Security",
      href: "/account?tab=profile",
      icon: <User size={17} className="text-brand-cyan shrink-0" />,
      description: "Update personal details & password",
    },
    {
      label: "Saved Delivery Addresses",
      href: "/account?tab=addresses",
      icon: <MapPin size={17} className="text-purple-400 shrink-0" />,
      description: "Manage shipping & billing locations",
    },
    {
      label: "Account Settings",
      href: "/account?tab=profile",
      icon: <Settings size={17} className="text-slate-400 shrink-0" />,
      description: "Notification & account preferences",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-bg-base/90 backdrop-blur-md border-b border-border-subtle transition-all duration-200">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center group shrink-0 focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:outline-none rounded-lg"
            aria-label="Star Press — The Printing Hub"
          >
            <Image
              src="/images/Logo.png"
              alt="Star Press - The Printing Hub"
              width={160}
              height={50}
              priority
              className="h-10 sm:h-11 w-auto object-contain group-hover:scale-[1.03] transition-transform duration-200"
            />
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

            {/* ── Advanced User Profile / Auth Dropdown ── */}
            <div className="relative">
              {!isHydrated || status === "loading" ? (
                // Hydration / Loading Placeholder
                <div
                  className="w-9 h-9 rounded-full bg-white/5 border border-border-subtle animate-pulse"
                  aria-hidden="true"
                />
              ) : status === "authenticated" && session?.user ? (
                // Authenticated Profile Button
                <button
                  ref={profileTriggerRef}
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-label={`User menu for ${session.user.name || session.user.email}`}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-border-subtle transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow"
                >
                  {/* User Avatar Circle */}
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-sm ${
                        isAdminUser
                          ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-black font-extrabold"
                          : "bg-brand-yellow text-black"
                      }`}
                    >
                      {getUserInitial()}
                    </div>
                    {/* Status indicator dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-bg-base ${
                        isAdminUser ? "bg-brand-cyan" : "bg-emerald-400"
                      }`}
                    />
                  </div>

                  {/* Name on large screens */}
                  <span className="hidden xl:inline-block text-xs font-semibold text-white max-w-[90px] truncate">
                    {session.user.name?.split(" ")[0] || "Account"}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180 text-brand-yellow" : ""
                    }`}
                  />
                </button>
              ) : (
                // Unauthenticated / Guest Trigger Button
                <button
                  ref={profileTriggerRef}
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-label="Sign In or Register"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  className="flex items-center gap-1.5 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-brand-yellow"
                >
                  <User size={20} />
                  <ChevronDown
                    size={13}
                    className={`text-slate-500 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180 text-brand-yellow" : ""
                    }`}
                  />
                </button>
              )}

              {/* ── Dropdown Menu Popover ── */}
              {isProfileOpen && (
                <div
                  ref={profileDropdownRef}
                  role="menu"
                  aria-label="User Account Menu"
                  className="absolute right-0 top-full mt-2 w-80 sm:w-84 bg-bg-surface border border-border-subtle rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden"
                >
                  {status === "authenticated" && session?.user ? (
                    // ── Authenticated Dropdown Body ──
                    <div>
                      {/* Identity Header */}
                      <div className="p-4 bg-gradient-to-r from-white/[0.04] to-white/[0.01] border-b border-border-subtle">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-base shrink-0 shadow-md ${
                              isAdminUser
                                ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-black border border-cyan-300"
                                : "bg-brand-yellow text-black border border-yellow-300"
                            }`}
                          >
                            {getUserInitial()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white truncate">
                              {session.user.name || "Valued Customer"}
                            </h3>
                            <p className="text-xs text-text-muted truncate mt-0.5">
                              {session.user.email}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {isAdminUser ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                                  <ShieldCheck size={11} />
                                  <span>Administrator</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30">
                                  <CheckCircle2 size={11} />
                                  <span>Verified Customer</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Items */}
                      <div className="p-1.5 space-y-0.5">
                        {authenticatedMenuItems.map((item, idx) => (
                          <React.Fragment key={idx}>
                            {item.divider && (
                              <div className="border-t border-border-subtle my-1.5 mx-2" />
                            )}
                            <button
                              type="button"
                              onClick={() => handleMenuItemClick(item.href)}
                              role="menuitem"
                              className={`w-full px-3 py-2.5 rounded-xl text-left flex items-start gap-3 transition-colors group ${
                                item.highlight
                                  ? "hover:bg-brand-cyan/10 border border-transparent hover:border-brand-cyan/20"
                                  : "hover:bg-white/5"
                              }`}
                            >
                              <div className="mt-0.5">{item.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-xs font-semibold group-hover:text-white transition-colors ${
                                    item.highlight ? "text-brand-cyan" : "text-slate-200"
                                  }`}
                                >
                                  {item.label}
                                </p>
                                {item.description && (
                                  <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Sign Out Action */}
                      <div className="border-t border-border-subtle p-2">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          role="menuitem"
                          className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSigningOut ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Signing out…</span>
                            </>
                          ) : (
                            <>
                              <LogOut size={14} />
                              <span>Sign Out</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Unauthenticated / Guest Dropdown Body ──
                    <div>
                      {/* Guest Greeting */}
                      <div className="p-5 bg-gradient-to-br from-brand-yellow/[0.08] via-transparent to-brand-cyan/[0.05] border-b border-border-subtle text-center">
                        <div className="w-10 h-10 rounded-full bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center mx-auto mb-2 text-brand-yellow">
                          <Sparkles size={18} />
                        </div>
                        <h3 className="font-display font-bold text-sm text-white mb-1">
                          Welcome to Star Press
                        </h3>
                        <p className="text-xs text-text-muted leading-relaxed">
                          Sign in to manage active print orders, saved designs, and express checkout.
                        </p>
                      </div>

                      {/* Guest CTAs */}
                      <div className="p-4 space-y-2.5">
                        <Link
                          href="/login"
                          onClick={() => setIsProfileOpen(false)}
                          role="menuitem"
                          className="w-full py-2.5 px-4 bg-brand-yellow hover:bg-[#FFE04D] text-black font-bold text-xs rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-yellow/10"
                        >
                          <span>Sign In to Account</span>
                          <ArrowRight size={14} />
                        </Link>

                        <Link
                          href="/register"
                          onClick={() => setIsProfileOpen(false)}
                          role="menuitem"
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-border-subtle text-white font-semibold text-xs rounded-full flex items-center justify-center transition-colors text-center"
                        >
                          Create New Account
                        </Link>
                      </div>

                      {/* Guest Order Tracking Helper */}
                      <div className="p-3 bg-white/[0.02] border-t border-border-subtle">
                        <Link
                          href="/account?tab=orders"
                          onClick={() => setIsProfileOpen(false)}
                          role="menuitem"
                          className="flex items-center gap-2 text-xs text-text-secondary hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                        >
                          <Package size={14} className="text-brand-yellow" />
                          <span>Track an Existing Order</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
