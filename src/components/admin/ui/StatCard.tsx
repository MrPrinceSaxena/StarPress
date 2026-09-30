'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from './Skeleton';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  period?: string;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  period = 'vs last month',
  icon: Icon,
  iconColor = 'text-brand-yellow',
  prefix,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-[#10131E]/90 border border-white/[0.06] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="group relative bg-[#10131E]/90 hover:bg-[#141826] border border-white/[0.06] hover:border-white/[0.14] rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] flex items-center justify-center ${iconColor} transition-colors`}>
          <Icon size={16} />
        </div>
      </div>
      
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {prefix}{value}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                isPositive 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            <span className="text-[11px] text-slate-500">{period}</span>
          </div>
        )}
      </div>
    </div>
  );
}
