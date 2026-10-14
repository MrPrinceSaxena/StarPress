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
  published:   { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  active:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  in_stock:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  delivered:   { dot: 'bg-emerald-600', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  paid:        { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  fulfilled:   { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  completed:   { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  draft:       { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
  inactive:    { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
  disabled:    { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
  unfulfilled: { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700' },
  pending:     { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-800', pulse: true },
  processing:  { dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200/80', text: 'text-blue-800', pulse: true },
  partial:     { dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200/80', text: 'text-blue-800' },
  paused:      { dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-800' },
  shipped:     { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-800' },
  low_stock:   { dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-700', pulse: true },
  archived:    { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
  expired:     { dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' },
  out_of_stock:{ dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-800' },
  cancelled:   { dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-800' },
  failed:      { dot: 'bg-rose-500', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-800' },
  refunded:    { dot: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200/80', text: 'text-orange-800' },
  returned:    { dot: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200/80', text: 'text-orange-800' },
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
