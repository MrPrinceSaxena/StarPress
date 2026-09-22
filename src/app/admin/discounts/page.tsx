'use client';

import React, { useState, useEffect } from 'react';
import { PercentCircle, Plus, Copy } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import EmptyState from '@/components/admin/ui/EmptyState';
import { showToast } from '@/components/admin/ui/Toast';
import { discountService } from '@/lib/admin/services';
import type { AdminDiscount } from '@/lib/admin/types';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    discountService.getDiscounts().then((data) => { setDiscounts(data); setLoading(false); });
  }, []);

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Discounts</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage discount codes, promotions, and offers.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm">
          <Plus size={14} /> Create Discount
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
      ) : discounts.length === 0 ? (
        <EmptyState icon={PercentCircle} title="No discounts yet" />
      ) : (
        <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border-subtle">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Code</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Discount</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Usage</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Min Order</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Validity</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
            </tr></thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => { navigator.clipboard.writeText(d.code); showToast(`"${d.code}" copied`); }} className="flex items-center gap-1.5 font-mono text-sm font-bold text-brand-yellow hover:text-white transition-colors">
                      {d.code} <Copy size={12} className="opacity-40" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {d.type === 'percentage' ? `${d.value}% off` : `₹${d.value} off`}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ''}
                    {d.usageLimit && (
                      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1 w-16">
                        <div className="h-full rounded-full bg-brand-yellow/60" style={{ width: `${Math.min((d.usageCount / d.usageLimit) * 100, 100)}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{d.minOrderAmount ? `₹${d.minOrderAmount.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {new Date(d.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {d.endDate ? new Date(d.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '∞'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
