'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  ExternalLink,
  LogOut,
  Loader2,
  X,
  Package,
  ShoppingCart,
  Users,
  Menu,
  Plus,
  Sliders,
  ChevronDown,
  ArrowRight,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useAdminSidebar } from './AdminSidebarContext';

export default function AdminTopbar() {
  const { session, signOut } = useAuthSession();
  const router = useRouter();
  const { toggleMobile } = useAdminSidebar();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    orders: any[];
    products: any[];
    customers: any[];
  }>({ orders: [], products: [], customers: [] });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const userEmail = session?.user?.email || 'admin@starpress.in';
  const userName = session?.user?.name || 'Prince Saxena';
  const userRole = 'Store Manager';
  const userInitial = userName.charAt(0).toUpperCase() || 'P';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults({ orders: [], products: [], customers: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            orders: data.orders || [],
            products: data.products || [],
            customers: data.customers || [],
          });
        }
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push('/admin/login');
    } catch {
      window.location.href = '/admin/login';
    }
  };

  const hasResults =
    searchResults.orders.length > 0 ||
    searchResults.products.length > 0 ||
    searchResults.customers.length > 0;

  return (
    <>
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        {/* Left: Mobile Hamburger & Search Input Trigger */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Global Search Bar (Matching Reference Image) */}
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="w-full max-w-md h-10 px-3.5 rounded-xl bg-[#F8F9FA] hover:bg-slate-100/80 border border-[#E5E7EB] text-left text-xs text-slate-400 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Search size={15} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="text-slate-500 group-hover:text-slate-700 font-normal">
                Search products, orders, customers...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-sm">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  <Link
                    href="/admin/orders?status=pending"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-medium text-[#F5A623] hover:underline"
                  >
                    View Pending Orders
                  </Link>
                </div>
                <div className="py-2.5 space-y-2">
                  <Link
                    href="/admin/orders?status=pending"
                    onClick={() => setNotificationsOpen(false)}
                    className="block p-2 rounded-lg bg-amber-50/60 hover:bg-amber-50 border border-amber-100 text-xs text-slate-800 transition-colors"
                  >
                    <p className="font-semibold text-amber-900">Orders Need Fulfillment</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Check your pending orders awaiting plate setup & dispatch.
                    </p>
                  </Link>
                  <Link
                    href="/admin/products"
                    onClick={() => setNotificationsOpen(false)}
                    className="block p-2 rounded-lg hover:bg-slate-50 text-xs text-slate-700 transition-colors"
                  >
                    <p className="font-medium text-slate-900">Database Connection Active</p>
                    <p className="text-[11px] text-slate-500">Live PostgreSQL connection online.</p>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill Menu (Matching Reference Image) */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left"
              aria-label="User profile menu"
            >
              {/* Round Avatar Circle (Gold with initial) */}
              <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center text-slate-950 font-bold text-sm shrink-0 shadow-sm">
                {userInitial}
              </div>

              {/* Name & Role */}
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {userName}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {userRole}
                </span>
              </div>

              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 hidden sm:block ${
                  profileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{userName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Settings size={14} className="text-slate-400" />
                    <span>Store Settings</span>
                  </Link>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2.5">
                      <ExternalLink size={14} className="text-slate-400" />
                      <span>View Storefront</span>
                    </span>
                    <span className="text-[10px] text-slate-400">New tab</span>
                  </a>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {isSigningOut ? (
                      <Loader2 size={14} className="animate-spin text-rose-600" />
                    ) : (
                      <LogOut size={14} className="text-rose-600" />
                    )}
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fadeIn">
            {/* Input bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
              <Search size={18} className="text-[#F5A623] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, orders, customers…"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              )}
              <kbd
                onClick={() => setSearchOpen(false)}
                className="px-2 py-0.5 text-[11px] rounded bg-white text-slate-500 border border-slate-200 cursor-pointer hover:bg-slate-100 shadow-sm"
              >
                ESC
              </kbd>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 size={18} className="animate-spin text-[#F5A623]" />
                  <span>Searching StarPress live database…</span>
                </div>
              ) : searchQuery.trim().length >= 2 && !hasResults ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No matching orders, products, or customers found for &quot;{searchQuery}&quot;
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="p-4 space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Navigation
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/admin/products/new"
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors"
                    >
                      <Plus size={14} className="text-[#F5A623]" />
                      <span>Create New Product</span>
                    </Link>
                    <Link
                      href="/admin/settings?tab=slider"
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors"
                    >
                      <Sliders size={14} className="text-cyan-600" />
                      <span>Manage Hero Slider</span>
                    </Link>
                    <Link
                      href="/admin/orders?status=pending"
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors"
                    >
                      <ShoppingCart size={14} className="text-emerald-600" />
                      <span>Pending Orders</span>
                    </Link>
                    <Link
                      href="/admin/categories"
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors"
                    >
                      <Package size={14} className="text-purple-600" />
                      <span>Product Categories</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Package size={12} className="text-[#F5A623]" /> Products ({searchResults.products.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={p.href || `/admin/products/${p.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-[#F5A623] transition-colors truncate">
                                {p.title || p.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">{p.subtitle || p.categoryName || 'Product'}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <ShoppingCart size={12} className="text-emerald-600" /> Orders ({searchResults.orders.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.orders.map((o) => (
                          <Link
                            key={o.id}
                            href={o.href || `/admin/orders`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-mono font-bold text-[#F5A623] group-hover:underline">
                                {o.title || o.orderNumber}
                              </p>
                              <p className="text-[11px] text-slate-500">{o.subtitle || o.customerName}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users size={12} className="text-purple-600" /> Customers ({searchResults.customers.length})
                      </div>
                      <div className="space-y-1 mt-1">
                        {searchResults.customers.map((c) => (
                          <Link
                            key={c.id}
                            href={c.href || `/admin/customers`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                                {c.title || c.name}
                              </p>
                              <p className="text-[11px] text-slate-500">{c.subtitle || c.email}</p>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
