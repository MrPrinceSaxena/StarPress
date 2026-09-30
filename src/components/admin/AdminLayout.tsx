'use client';

import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import ToastContainer from './ui/Toast';
import { AdminSidebarProvider, useAdminSidebar } from './AdminSidebarContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const { collapsed } = useAdminSidebar();

  return (
    <div className="min-h-screen bg-[#07090E] text-white">
      <AdminSidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        } ml-0`}
      >
        <AdminTopbar />
        <main className="p-4 sm:p-6 lg:p-8 animate-fadeIn max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminSidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminSidebarProvider>
  );
}
