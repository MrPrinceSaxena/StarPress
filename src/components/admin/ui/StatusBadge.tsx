'use client';

import React from 'react';
import type { ProductStatus, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/lib/admin/types';

type BadgeStatus =
  | ProductStatus
  | OrderStatus
  | PaymentStatus
  | FulfillmentStatus
  | 'active'
  | 'inactive'
  | 'expired'
  | 'disabled'
  | 'low_stock'
  | 'out_of_stock'
  | 'in_stock'
  | 'paused'
  | 'completed';

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; pulse?: boolean }> = {
  published:   { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  active:      { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  in_stock:    { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  delivered:   { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  paid:        { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  fulfilled:   { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  completed:   { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
  draft:       { dot: 'bg-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  inactive:    { dot: 'bg-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  disabled:    { dot: 'bg-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  unfulfilled: { dot: 'bg-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  pending:     { dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', pulse: true },
  processing:  { dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400', pulse: true },
  partial:     { dot: 'bg-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
  paused:      { dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
  shipped:     { dot: 'bg-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-400' },
  low_stock:   { dot: 'bg-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', pulse: true },
  archived:    { dot: 'bg-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-500' },
  expired:     { dot: 'bg-slate-500', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-500' },
  out_of_stock:{ dot: 'bg-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
  cancelled:   { dot: 'bg-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
  failed:      { dot: 'bg-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
  refunded:    { dot: 'bg-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
  returned:    { dot: 'bg-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
};

const LABEL_MAP: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
  archived: 'Archived',
  active: 'Active',
  inactive: 'Inactive',
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  paid: 'Paid',
  failed: 'Failed',
  fulfilled: 'Fulfilled',
  unfulfilled: 'Unfulfilled',
  partial: 'Partial',
  returned: 'Returned',
  paused: 'Paused',
  completed: 'Completed',
  disabled: 'Disabled',
  expired: 'Expired',
};

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = LABEL_MAP[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium tracking-wide transition-all ${
        size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${style.bg} ${style.text} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {style.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`} />
      </span>
      {label}
    </span>
  );
}
