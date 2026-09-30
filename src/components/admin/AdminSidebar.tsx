'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Megaphone,
  PercentCircle,
  Store,
  CreditCard,
  ShoppingBag,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronDown,
  ExternalLink,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAdminSidebar } from './AdminSidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { label: string; href: string }[];
}

const BASE_MAIN_NAV: Omit<NavItem, 'badge'>[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    children: [
      { label: 'All Products', href: '/admin/products' },
      { label: 'Categories', href: '/admin/categories' },
    ],
  },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Content', href: '/admin/content', icon: FileText },
  { label: 'Finances', href: '/admin/finances', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  {
    label: 'Marketing',
    href: '/admin/marketing',
    icon: Megaphone,
    children: [
      { label: 'Campaigns', href: '/admin/marketing' },
      { label: 'Abandoned Carts', href: '/admin/marketing?tab=carts' },
    ],
  },
  { label: 'Discounts', href: '/admin/discounts', icon: PercentCircle },
];

const CHANNEL_NAV: NavItem[] = [
  { label: 'Online Store', href: '/', icon: Store },
  { label: 'Point of Sale', href: '/admin/settings?tab=pos', icon: CreditCard },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapse, mobileOpen, closeMobile } = useAdminSidebar();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/admin/orders?status=pending&limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats?.pending !== undefined) {
          setPendingOrdersCount(data.stats.pending);
        } else if (data.total !== undefined) {
          setPendingOrdersCount(data.total);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const mainNav: NavItem[] = BASE_MAIN_NAV.map((item) => {
    if (item.label === 'Orders') {
      return { ...item, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined };
    }
    return item;
  });

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const hasChildren = Boolean(item.children && item.children.length > 0);
    const isExpanded =
      expandedMenu === item.label ||
      (expandedMenu === null && (item.children?.some((c) => pathname.startsWith(c.href)) ?? false));
    const isExternal = item.href === '/' || item.href === '/shop';

    const linkContent = (
      <>
        <div className="relative shrink-0 flex items-center justify-center">
          <item.icon
            size={18}
            className={`transition-colors duration-150 ${active ? 'text-brand-yellow' : 'text-slate-400 group-hover:text-slate-200'}`}
          />
          {collapsed && item.badge && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-brand-yellow ring-2 ring-[#0A0C14]" />
          )}
        </div>

        {!collapsed && (
          <>
            <span className="flex-1 truncate tracking-tight">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow text-[10px] font-bold leading-none animate-pulse">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : ''}`}
              />
            )}
            {isExternal && <ExternalLink size={12} className="opacity-40" />}
          </>
        )}

        {/* Floating tooltip when collapsed */}
        {collapsed && (
          <div className="fixed left-[76px] hidden group-hover:flex items-center px-2.5 py-1 rounded-md bg-[#161B29] border border-white/10 text-white text-xs font-medium shadow-elevation-md whitespace-nowrap z-[100] pointer-events-none">
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="ml-1.5 px-1 rounded bg-brand-yellow text-black text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </>
    );

    const baseClasses = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative group ${
      active
        ? 'bg-gradient-to-r from-brand-yellow/15 to-transparent text-white font-semibold border-l-2 border-brand-yellow'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
    } ${collapsed ? 'justify-center px-0' : ''}`;

    if (hasChildren) {
      return (
        <div key={item.label} className="relative">
          <button
            onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
            className={`w-full ${baseClasses}`}
            title={collapsed ? item.label : undefined}
          >
            {linkContent}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-5 mt-1 space-y-0.5 border-l border-white/[0.08] pl-3.5 animate-fadeIn">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    pathname === child.href
                      ? 'text-brand-yellow font-medium bg-brand-yellow/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (isExternal) {
      return (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseClasses}
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link key={item.label} href={item.href} className={baseClasses}>
        {linkContent}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#0A0C14] border-r border-white/[0.06] transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'
        } ${!mobileOpen && collapsed ? 'w-[72px]' : 'w-[240px]'}`}
      >
        {/* Logo Header */}
        <div
          className={`flex items-center h-16 border-b border-white/[0.06] ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow font-display font-black text-sm shrink-0 shadow-[0_0_12px_rgba(245,186,19,0.15)] group-hover:scale-105 transition-transform">
              S
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-xs tracking-wider text-white">
                    STAR<span className="text-brand-yellow">PRESS</span>
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.06] text-slate-300">
                    PRO
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 tracking-widest">
                  ADMIN CONSOLE
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Store Management
                </span>
              </div>
            )}
            <div className="space-y-1">{mainNav.map(renderNavItem)}</div>
          </div>

          <div>
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Sales Channels
                </span>
              </div>
            )}
            <div className="space-y-1">{CHANNEL_NAV.map(renderNavItem)}</div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/[0.06] p-3 space-y-1 bg-[#08090F]">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
              pathname.startsWith('/admin/settings')
                ? 'bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Store Settings</span>}
          </Link>

          <a
            href="https://wa.me/917456849955?text=StarPress%20Support%20Inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Support' : undefined}
          >
            <HelpCircle size={18} className="shrink-0" />
            {!collapsed && <span>Live Support</span>}
          </a>

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:block pt-2 border-t border-white/[0.04]">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-300 ${collapsed ? 'rotate-180 text-brand-yellow' : ''}`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
