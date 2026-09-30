'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fadeIn">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400 shadow-inner">
          <Icon size={30} className="text-slate-400" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-brand-yellow/5 -z-10 blur-xl pointer-events-none" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
