'use client';

import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import ToastContainer from './ui/Toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base">
      <AdminSidebar />
      <div className="ml-[240px] transition-all duration-200">
        <AdminTopbar />
        <main className="p-6">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
