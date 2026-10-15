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
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Finance', href: '/admin/finances', icon: DollarSign },
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
            className={`transition-all duration-200 ${
              active ? 'text-[#F5A623] scale-105' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          {collapsed && item.badge && item.badge > 0 && (
            <span className="absolute -top-1.5 -right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0F172A]" />
          )}
        </div>

        {!collapsed && (
          <>
            <span className="flex-1 truncate tracking-tight">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="min-w-[20px] h-[20px] px-1.5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none shadow-sm animate-pulse">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : ''}`}
              />
            )}
            {isExternal && <ExternalLink size={12} className="opacity-40" />}
          </>
        )}

        {/* Tooltip when collapsed */}
        {collapsed && (
          <div className="fixed left-[76px] hidden group-hover:flex items-center px-2.5 py-1 rounded-lg bg-[#1E293B] border border-slate-700/60 text-white text-xs font-semibold shadow-xl whitespace-nowrap z-[100] pointer-events-none">
            {item.label}
            {item.badge && item.badge > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </>
    );

    const baseClasses = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative group ${
      active
        ? 'bg-gradient-to-r from-[#F5A623]/15 via-[#F5A623]/8 to-transparent text-amber-400 font-semibold border-l-2 border-[#F5A623] shadow-xs'
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
                      ? 'text-[#F5A623] font-semibold bg-[#F5A623]/10'
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#0F172A] border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'
        } ${
          mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full lg:translate-x-0'
        } ${!mobileOpen && collapsed ? 'w-[72px]' : 'w-[240px]'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center h-16 border-b border-slate-800/80 ${
            collapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5A623] to-[#D97706] flex items-center justify-center text-slate-950 font-black text-base shrink-0 shadow-md transition-transform group-hover:scale-105">
              S
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm tracking-wide text-white leading-tight flex items-center gap-1.5">
                  STARPRESS
                </span>
                <span className="text-[11px] text-amber-400 font-medium leading-tight flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Store Manager
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
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
          {mainNav.map(renderNavItem)}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-slate-800/80 p-3 space-y-1.5 bg-[#0B1120]">
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
              pathname.startsWith('/admin/settings')
                ? 'bg-amber-500/10 text-[#F5A623] font-semibold border-l-2 border-[#F5A623]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? 'Store Settings' : undefined}
          >
            <Settings size={17} className="shrink-0" />
            {!collapsed && <span>Store Settings</span>}
          </Link>

          <a
            href="https://wa.me/917456849955?text=StarPress%20Support%20Inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? 'Help & WhatsApp Support' : undefined}
          >
            <HelpCircle size={17} className="shrink-0 text-emerald-400" />
            {!collapsed && <span>Help &amp; Support</span>}
          </a>

          {/* Dedicated View Store Bottom Card */}
          {!collapsed && (
            <div className="pt-1.5">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5 transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 shrink-0 transition-transform">
                  <Store size={15} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1 group-hover:text-[#F5A623] transition-colors">
                    <span>Live Storefront</span>
                    <ExternalLink size={11} className="opacity-70" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Preview customer site
                  </p>
                </div>
              </a>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:block pt-1 border-t border-slate-800/60">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-300 ${collapsed ? 'rotate-180 text-[#F5A623]' : ''}`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
