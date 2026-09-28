'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLoginPage from '@/app/admin/login/page';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Loader2 } from 'lucide-react';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isHydrated, status, isAdmin } = useAuthSession();

  // Any variation of login path (direct /admin/login or rewritten /login on subdomain)
  const isLoginPage = pathname === '/admin/login' || pathname === '/login';

  // Login route directly renders full-screen login card without any sidebar or topbar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Initial hydration loading screen: pure dark loader (no sidebar or topbar)
  if (!isHydrated || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07090E] text-white">
        <Loader2 size={36} className="animate-spin text-brand-yellow mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Verifying Admin Clearance...</p>
      </div>
    );
  }

  // If unauthenticated or not an authorized admin, display ONLY the clean full-screen login form
  if (status !== 'authenticated' || !isAdmin) {
    return <AdminLoginPage />;
  }

  // Authorized Admin: show complete dashboard layout with sidebar and topbar
  return <AdminLayout>{children}</AdminLayout>;
}

