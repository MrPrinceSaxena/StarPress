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
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 space-y-3 shadow-sm">
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

  // Determine a nice pastel icon background based on iconColor
  let iconBoxBg = 'bg-amber-50 text-amber-600';
  if (iconColor?.includes('emerald') || iconColor?.includes('green')) {
    iconBoxBg = 'bg-emerald-50 text-emerald-600';
  } else if (iconColor?.includes('blue') || iconColor?.includes('cyan')) {
    iconBoxBg = 'bg-blue-50 text-blue-600';
  } else if (iconColor?.includes('purple')) {
    iconBoxBg = 'bg-purple-50 text-purple-600';
  } else if (iconColor?.includes('rose') || iconColor?.includes('red')) {
    iconBoxBg = 'bg-rose-50 text-rose-600';
  }

  return (
    <div className="group relative bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">
          {title}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBoxBg}`}>
          <Icon size={18} />
        </div>
      </div>
      
      <div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {prefix}{value}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className={`inline-flex items-center text-xs font-semibold ${
                isPositive 
                  ? 'text-emerald-700' 
                  : 'text-rose-700'
              }`}
            >
              {isPositive ? '↑' : '↓'} {isPositive ? `+${change}%` : `-${Math.abs(change)}%`}
            </span>
            <span className="text-xs text-slate-500">{period}</span>
          </div>
        )}
      </div>
    </div>
  );
}
