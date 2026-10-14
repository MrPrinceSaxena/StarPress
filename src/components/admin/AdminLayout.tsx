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
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 antialiased selection:bg-brand-yellow selection:text-black">
      <AdminSidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
        } ml-0 min-h-screen flex flex-col`}
      >
        <AdminTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fadeIn max-w-[1600px] w-full mx-auto">
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
