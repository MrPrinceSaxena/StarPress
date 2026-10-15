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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  // Determine a nice pastel icon background based on iconColor
  let iconBoxBg = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
  if (iconColor?.includes('emerald') || iconColor?.includes('green')) {
    iconBoxBg = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
  } else if (iconColor?.includes('blue') || iconColor?.includes('cyan')) {
    iconBoxBg = 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
  } else if (iconColor?.includes('purple')) {
    iconBoxBg = 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
  } else if (iconColor?.includes('rose') || iconColor?.includes('red')) {
    iconBoxBg = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
  }

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:shadow-[0_6px_16px_0_rgba(15,23,42,0.06)] hover:border-slate-300 transition-all duration-200">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconBoxBg}`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div>
        <div className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">
          {prefix}{value}
        </div>
        {change !== undefined ? (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                isPositive 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {isPositive ? '↑' : '↓'} {isPositive ? `+${change}%` : `-${Math.abs(change)}%`}
            </span>
            <span className="text-xs text-slate-400 font-medium">{period}</span>
          </div>
        ) : period ? (
          <p className="text-[11px] text-slate-400 font-medium mt-1.5 capitalize">{period}</p>
        ) : null}
      </div>
    </div>
  );
}
