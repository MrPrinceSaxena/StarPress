'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ExternalLink, LogOut, Loader2, X, Package, ShoppingCart, Users } from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useRouter } from 'next/navigation';

export default function AdminTopbar() {
  const { session, signOut } = useAuthSession();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    orders: any[];
    products: any[];
    customers: any[];
  }>({ orders: [], products: [], customers: [] });
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userEmail = session?.user?.email || 'admin@starpress.in';
  const userName = session?.user?.name || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();

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
        // silent search error
      } finally {
        setIsSearching(false);
      }
    }, 250);

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
    <header className="sticky top-0 z-40 h-14 flex items-center gap-4 px-6 bg-[#0A0C12]/80 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search products, orders, customers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/40 focus:bg-white/[0.06] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Live Search Dropdown */}
        {searchOpen && searchQuery.trim().length >= 2 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSearchOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-bg-surface border border-border-subtle rounded-xl shadow-elevation-md overflow-hidden z-20 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                  <Loader2 size={14} className="animate-spin text-brand-yellow" />
                  Searching database…
                </div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-xs text-text-muted">
                  No matching orders, products, or customers found.
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {searchResults.orders.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <ShoppingCart size={11} /> Orders
                      </div>
                      {searchResults.orders.map((o) => (
                        <Link
                          key={o.id}
                          href={o.href}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <p className="text-xs font-medium text-white">{o.title}</p>
                            <p className="text-[10px] text-text-muted">{o.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <Package size={11} /> Products
                      </div>
                      {searchResults.products.map((p) => (
                        <Link
                          key={p.id}
                          href={p.href}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <p className="text-xs font-medium text-white">{p.title}</p>
                            <p className="text-[10px] text-emerald-400">{p.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                        <Users size={11} /> Customers
                      </div>
                      {searchResults.customers.map((c) => (
                        <Link
                          key={c.id}
                          href={c.href}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                        >
                          <div>
                            <p className="text-xs font-medium text-white">{c.title}</p>
                            <p className="text-[10px] text-text-muted">{c.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* View Store */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <span>View Store</span>
          <ExternalLink size={12} />
        </a>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-yellow" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.06] mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow font-bold text-xs">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
              {userEmail}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
          title="Sign Out"
        >
          {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
        </button>
      </div>
    </header>
  );
}
