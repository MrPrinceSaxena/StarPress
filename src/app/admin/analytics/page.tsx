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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Analytics &amp; Reports</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">Revenue trends, product performance, and customer growth insights.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" /> Revenue Trend
          </h2>
          <div className="flex items-end gap-3 h-48 pt-4">
            {data.revenueByMonth.map((m) => {
              const max = Math.max(...data.revenueByMonth.map((r) => r.revenue), 1);
              const h = Math.max((m.revenue / max) * 100, 4);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">₹{(m.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full relative" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 rounded-t-lg bg-emerald-500 hover:bg-emerald-600 transition-colors" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Growth */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={16} className="text-purple-600" /> Customer Growth
          </h2>
          <div className="flex items-end gap-3 h-48 pt-4">
            {data.customerGrowth.map((m) => {
              const maxTotal = Math.max(...data.customerGrowth.map((r) => r.newCustomers + r.returning), 1);
              const totalH = Math.max(((m.newCustomers + m.returning) / maxTotal) * 100, 6);
              const newH = (m.newCustomers / Math.max(m.newCustomers + m.returning, 1)) * totalH;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">{m.newCustomers + m.returning}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: `${totalH}%` }}>
                    <div className="flex-1 rounded-t-lg bg-purple-300" />
                    <div className="bg-purple-600 rounded-b-sm" style={{ height: `${newH}%` }} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600">{m.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E5E7EB]">
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />New Customers
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-300" />Returning
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Package size={16} className="text-[#F5A623]" /> Top Products by Revenue
          </h2>
          <div className="space-y-3.5">
            {data.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-amber-50 text-[#F5A623] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1.5">
                    <div
                      className="h-full rounded-full bg-[#F5A623]"
                      style={{ width: `${(p.revenue / Math.max(data.topProducts[0]?.revenue || 1, 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 font-mono">₹{formatPrice(p.revenue)}</p>
                  <p className="text-[11px] text-slate-500">{p.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" /> Revenue by Category
          </h2>
          <div className="space-y-4">
            {data.topCategories.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">₹{formatPrice(c.revenue)}</span>
                    <span className="text-xs font-bold text-slate-900">{c.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
