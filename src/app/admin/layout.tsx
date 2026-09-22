'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Login page gets full-screen layout without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
