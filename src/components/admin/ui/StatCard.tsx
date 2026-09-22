'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  period?: string;
  icon: LucideIcon;
  iconColor?: string;
  prefix?: string;
}

export default function StatCard({
  title,
  value,
  change,
  period = 'Last 7 days',
  icon: Icon,
  iconColor = 'text-brand-yellow',
  prefix,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 hover:border-border-strong transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center ${iconColor}`}>
            <Icon size={16} />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {title}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {prefix}{value}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-xs font-semibold ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
              </span>
              <span className="text-[11px] text-text-muted">{period}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
