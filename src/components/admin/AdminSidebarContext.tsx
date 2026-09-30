'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AdminSidebarContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'starpress_admin_sidebar_collapsed';

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Load persisted collapse state on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setCollapsedState(saved === 'true');
      }
    } catch {
      // ignore localStorage errors in private mode
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const setCollapsed = (val: boolean) => {
    setCollapsedState(val);
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
    } catch {
      // ignore
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobile = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <AdminSidebarContext.Provider
      value={{
        collapsed,
        mobileOpen,
        toggleCollapse,
        setCollapsed,
        toggleMobile,
        closeMobile,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error('useAdminSidebar must be used within an AdminSidebarProvider');
  }
  return context;
}
