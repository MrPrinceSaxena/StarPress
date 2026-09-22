'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IndianRupee, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight,
  Clock, Eye, BarChart3,
} from 'lucide-react';
import StatCard from '@/components/admin/ui/StatCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { dashboardService, orderService, productService, analyticsService } from '@/lib/admin/services';
import type { DashboardStats, AnalyticsData, AdminOrder } from '@/lib/admin/types';
import { MOCK_ORDERS } from '@/lib/admin/mock-data';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, a, orders] = await Promise.all([
        dashboardService.getStats(),
        analyticsService.getData(),
        orderService.getOrders({ pageSize: 5 }),
      ]);
      setStats(s);
      setAnalytics(a);
      setRecentOrders(orders.data);
      setLoading(false);
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

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-text-muted mt-0.5">Welcome back to StarPress admin console.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={IndianRupee} title="Revenue" value={`₹${formatPrice(stats.totalRevenue)}`} change={stats.revenueChange} iconColor="text-emerald-400" />
        <StatCard icon={ShoppingCart} title="Orders" value={stats.totalOrders.toLocaleString()} change={stats.ordersChange} iconColor="text-blue-400" />
        <StatCard icon={Package} title="Products" value={stats.totalProducts.toLocaleString()} change={stats.productsChange} iconColor="text-brand-yellow" />
        <StatCard icon={Users} title="Customers" value={stats.totalCustomers.toLocaleString()} change={stats.customersChange} iconColor="text-purple-400" />
        <StatCard icon={TrendingUp} title="Avg Order Value" value={`₹${formatPrice(stats.averageOrderValue)}`} change={stats.aovChange} iconColor="text-cyan-400" />
        <StatCard icon={BarChart3} title="Conversion" value={`${stats.conversionRate}%`} change={stats.conversionChange} iconColor="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Area */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Revenue Overview</h2>
            <span className="text-xs text-text-muted">Last 6 months</span>
          </div>
          {/* Simple bar chart visualization */}
          <div className="flex items-end gap-3 h-48 pt-4">
            {analytics.revenueByMonth.map((m) => {
              const maxRevenue = Math.max(...analytics.revenueByMonth.map((r) => r.revenue));
              const height = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-muted font-medium">₹{(m.revenue / 1000).toFixed(0)}k</span>
                  <div className="w-full relative" style={{ height: `${height}%` }}>
                    <div className="absolute inset-0 rounded-t-md bg-gradient-to-t from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/20 border-b-0 group hover:from-brand-yellow/30 hover:to-brand-yellow/10 transition-colors cursor-pointer" />
                  </div>
                  <span className="text-[11px] text-text-muted">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-brand-yellow hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {analytics.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 py-2">
                <span className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-[11px] font-bold text-text-muted">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-text-muted">{p.orders} orders</p>
                </div>
                <span className="text-xs font-medium text-emerald-400">₹{formatPrice(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand-yellow hover:underline">View All</Link>
          </div>
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
                      <span className="text-xs font-mono font-medium text-brand-yellow">{order.orderNumber}</span>
                      <div className="text-[11px] text-text-muted">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{order.customerName}</td>
                    <td className="px-5 py-3 text-xs font-medium text-white">₹{formatPrice(order.total)}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Revenue by Category</h2>
          <div className="space-y-4">
            {analytics.topCategories.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{c.name}</span>
                  <span className="text-xs font-medium text-white">{c.percentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-yellow/60 to-brand-yellow" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
