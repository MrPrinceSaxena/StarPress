'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight,
  Clock, Eye, BarChart3, Plus
} from 'lucide-react';
import StatCard from '@/components/admin/ui/StatCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { dashboardService, orderService, analyticsService } from '@/lib/admin/services';
import type { DashboardStats, AnalyticsData, AdminOrder } from '@/lib/admin/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, a, ordersRes] = await Promise.all([
          dashboardService.getStats(),
          analyticsService.getData(),
          orderService.getOrders({ pageSize: 5 }),
        ]);
        setStats(s);
        setAnalytics(a);
        setRecentOrders(ordersRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  if (loading || !stats || !analytics) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.revenueByMonth.map((r) => r.revenue), 1);

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Live store overview, real customer orders, and catalog status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
          >
            <Plus size={14} /> New Product
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={IndianRupee} title="Revenue" value={`₹${formatPrice(stats.totalRevenue)}`} iconColor="text-emerald-400" />
        <StatCard icon={ShoppingCart} title="Total Orders" value={stats.totalOrders.toLocaleString()} iconColor="text-blue-400" />
        <StatCard icon={Package} title="Active Products" value={stats.totalProducts.toLocaleString()} iconColor="text-brand-yellow" />
        <StatCard icon={Users} title="Customers" value={stats.totalCustomers.toLocaleString()} iconColor="text-purple-400" />
        <StatCard icon={TrendingUp} title="Avg Order Value" value={`₹${formatPrice(stats.averageOrderValue)}`} iconColor="text-cyan-400" />
        <StatCard icon={BarChart3} title="Conversion" value={`${stats.conversionRate}%`} iconColor="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Area */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue Overview</h2>
            <span className="text-xs text-text-muted">Last 6 months</span>
          </div>
          {/* Bar chart visualization */}
          <div className="flex items-end gap-3 h-48 pt-4">
            {analytics.revenueByMonth.map((m) => {
              const height = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted font-medium">
                    {m.revenue > 0 ? `₹${(m.revenue / 1000).toFixed(1)}k` : '₹0'}
                  </span>
                  <div className="w-full relative h-32 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-brand-yellow/30 to-brand-yellow/10 border border-brand-yellow/30 border-b-0 group hover:from-brand-yellow/40 hover:to-brand-yellow/20 transition-all cursor-pointer min-h-[4px]"
                      style={{ height: `${Math.max(4, height)}%` }}
                      title={`${m.month}: ₹${formatPrice(m.revenue)} (${m.orders} orders)`}
                    />
                  </div>
                  <span className="text-[11px] text-text-muted font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-brand-yellow hover:underline">View All</Link>
          </div>
          {analytics.topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No product sales recorded yet. Once orders are placed, top products will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border-subtle/30 last:border-0">
                  <span className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-text-muted">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-text-muted">{p.orders} ordered</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">₹{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Real Orders */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand-yellow hover:underline">View All Orders</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No customer orders placed yet. Orders received through the store checkout will be shown here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Order</th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total</th>
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <Link href="/admin/orders" className="text-xs font-mono font-medium text-brand-yellow hover:underline">
                          {order.orderNumber}
                        </Link>
                        <div className="text-[11px] text-text-muted">
                          {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-text-secondary">{order.customerName}</td>
                      <td className="px-5 py-3 text-xs font-medium text-white">₹{formatPrice(order.total)}</td>
                      <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Category Distribution</h2>
          {analytics.topCategories.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Categories will populate as orders are fulfilled.
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.topCategories.map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{c.name}</span>
                    <span className="text-text-muted font-mono">{c.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full bg-brand-yellow rounded-full" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
