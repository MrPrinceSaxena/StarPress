'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { label: string; href: string }[];
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart, badge: 3 },
  { label: 'Products', href: '/admin/products', icon: Package },
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
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === '/admin/dashboard' || pathname === '/admin';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenu === item.label;
    const isExternal = item.href === '/' || item.href === '/shop';

    const linkContent = (
      <>
        <item.icon size={18} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-brand-yellow text-black text-[10px] font-bold leading-none">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                size={14}
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
            {isExternal && <ExternalLink size={12} className="opacity-40" />}
          </>
        )}
      </>
    );

    const className = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative group ${
      active
        ? 'bg-white/[0.08] text-white before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-brand-yellow'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
    }`;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
            className={`w-full ${className}`}
            title={collapsed ? item.label : undefined}
          >
            {linkContent}
          </button>
          {isExpanded && !collapsed && (
            <div className="ml-[30px] mt-0.5 space-y-0.5 border-l border-white/[0.06] pl-3">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                    pathname === child.href
                      ? 'text-white bg-white/[0.06]'
                      : 'text-slate-500 hover:text-slate-300'
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
          className={className}
          title={collapsed ? item.label : undefined}
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={className}
        title={collapsed ? item.label : undefined}
      >
        {linkContent}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[#0A0C12] border-r border-white/[0.06] transition-all duration-200 ${
        collapsed ? 'w-[60px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-white/[0.06] ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
        <Link href="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow font-display font-black text-sm shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-black text-xs tracking-wider text-white leading-none">
                STAR<span className="text-brand-yellow">PRESS</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500 tracking-widest">
                ADMIN
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-2.5 py-3">
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                Main
              </span>
            </div>
          )}
          {MAIN_NAV.map(renderNavItem)}
        </div>

        <div className="mt-6 space-y-0.5">
          {!collapsed && (
            <div className="px-3 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
                Sales Channels
              </span>
            </div>
          )}
          {CHANNEL_NAV.map(renderNavItem)}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/[0.06] px-2.5 py-2.5 space-y-0.5">
        <Link
          href="/admin/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
            pathname.startsWith('/admin/settings')
              ? 'bg-white/[0.08] text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </Link>
        <a
          href="https://docs.starpress.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
          title={collapsed ? 'Help' : undefined}
        >
          <HelpCircle size={18} />
          {!collapsed && <span>Help</span>}
        </a>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-white/[0.06] px-2.5 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] transition-all"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
}
