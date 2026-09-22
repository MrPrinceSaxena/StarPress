'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package } from 'lucide-react';
import { analyticsService } from '@/lib/admin/services';
import type { AnalyticsData } from '@/lib/admin/types';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getData().then((d) => { setData(d); setLoading(false); });
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  if (loading || !data) return <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-text-muted mt-0.5">Revenue trends, product performance, and customer insights.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Revenue Trend</h2>
          <div className="flex items-end gap-3 h-48 pt-4">
            {data.revenueByMonth.map((m) => {
              const max = Math.max(...data.revenueByMonth.map((r) => r.revenue));
              const h = (m.revenue / max) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted">₹{(m.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full relative" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 border-b-0" />
                  </div>
                  <span className="text-[11px] text-text-muted">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Users size={16} className="text-purple-400" /> Customer Growth</h2>
          <div className="flex items-end gap-3 h-48 pt-4">
            {data.customerGrowth.map((m) => {
              const maxTotal = Math.max(...data.customerGrowth.map((r) => r.newCustomers + r.returning));
              const totalH = ((m.newCustomers + m.returning) / maxTotal) * 100;
              const newH = (m.newCustomers / (m.newCustomers + m.returning)) * totalH;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted">{m.newCustomers + m.returning}</span>
                  <div className="w-full flex flex-col" style={{ height: `${totalH}%` }}>
                    <div className="flex-1 rounded-t-md bg-gradient-to-t from-purple-500/20 to-purple-500/5 border border-purple-500/20 border-b-0" />
                    <div className="bg-purple-500/30 border border-purple-500/30 border-t-0 rounded-b-sm" style={{ height: `${newH}%` }} />
                  </div>
                  <span className="text-[11px] text-text-muted">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-subtle">
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted"><span className="w-2 h-2 rounded-sm bg-purple-500/30" />New</span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-muted"><span className="w-2 h-2 rounded-sm bg-purple-500/10" />Returning</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Package size={16} className="text-brand-yellow" /> Top Products by Revenue</h2>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-text-muted">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{p.name}</p>
                  <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-brand-yellow/60" style={{ width: `${(p.revenue / data.topProducts[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-white">₹{formatPrice(p.revenue)}</p>
                  <p className="text-[10px] text-text-muted">{p.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-cyan-400" /> Revenue by Category</h2>
          <div className="space-y-4">
            {data.topCategories.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">₹{formatPrice(c.revenue)}</span>
                    <span className="text-xs font-medium text-white">{c.percentage}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 to-cyan-400" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
