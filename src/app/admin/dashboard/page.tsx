'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Eye,
  BarChart3,
  Plus,
  RefreshCw,
  Sliders,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import StatCard from '@/components/admin/ui/StatCard';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { Skeleton, SkeletonCard, SkeletonTableRow } from '@/components/admin/ui/Skeleton';
import { dashboardService, orderService, analyticsService } from '@/lib/admin/services';
import type { DashboardStats, AnalyticsData, AdminOrder } from '@/lib/admin/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
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
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* KPI Row Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Charts & Top Products Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#10131E] border border-white/[0.06] rounded-2xl p-6 h-72">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-44 w-full" />
          </div>
          <div className="bg-[#10131E] border border-white/[0.06] rounded-2xl p-6 h-72">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...(analytics?.revenueByMonth || []).map((r) => r.revenue), 1);
  const pendingOrders = recentOrders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Store Dashboard</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
              Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time catalog metrics, customer transactions, and print dispatch operations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-brand-yellow' : ''} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/settings?tab=slider"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all hover:text-white"
          >
            <Sliders size={13} className="text-brand-yellow" />
            <span>Home Slider</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-all shadow-[0_0_15px_rgba(245,186,19,0.2)] active:scale-[0.98]"
          >
            <Plus size={14} />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Operational Notice if orders need dispatch */}
      {pendingOrders > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">
              You have <strong className="text-amber-300 font-bold">{pendingOrders} pending order(s)</strong> awaiting fulfillment and courier dispatch.
            </span>
          </div>
          <Link
            href="/admin/orders?status=pending"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            Review Orders <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard
          icon={IndianRupee}
          title="Revenue"
          value={`₹${formatPrice(stats?.totalRevenue ?? 0)}`}
          change={stats?.revenueChange}
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={(stats?.totalOrders ?? 0).toLocaleString()}
          change={stats?.ordersChange}
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Package}
          title="Products"
          value={(stats?.totalProducts ?? 0).toLocaleString()}
          change={stats?.productsChange}
          iconColor="text-brand-yellow"
        />
        <StatCard
          icon={Users}
          title="Customers"
          value={(stats?.totalCustomers ?? 0).toLocaleString()}
          change={stats?.customersChange}
          iconColor="text-purple-400"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Order"
          value={`₹${formatPrice(stats?.averageOrderValue ?? 0)}`}
          change={stats?.aovChange}
          iconColor="text-cyan-400"
        />
        <StatCard
          icon={BarChart3}
          title="Conversion"
          value={`${stats?.conversionRate ?? 0}%`}
          change={stats?.conversionChange}
          iconColor="text-orange-400"
        />
      </div>

      {/* Main Grid: Revenue Trend & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Visualizer */}
        <div className="lg:col-span-2 bg-[#0E111B] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-elevation-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue Performance</h2>
              <p className="text-xs text-slate-400">Monthly gross sales volume</p>
            </div>
            <Link
              href="/admin/analytics"
              className="text-xs text-brand-yellow hover:underline flex items-center gap-1 font-medium"
            >
              Detailed Analytics <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Bar chart visualization */}
          <div className="flex items-end gap-3 h-52 pt-4 px-2">
            {(analytics?.revenueByMonth || []).map((m) => {
              const height = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-slate-400 font-medium group-hover:text-brand-yellow transition-colors">
                    {m.revenue > 0 ? `₹${(m.revenue / 1000).toFixed(1)}k` : '₹0'}
                  </span>
                  <div className="w-full relative h-36 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-brand-yellow/30 to-brand-yellow/10 border border-brand-yellow/30 border-b-0 group-hover:from-brand-yellow/50 group-hover:to-brand-yellow/20 group-hover:border-brand-yellow/60 transition-all cursor-pointer min-h-[6px] shadow-[0_0_12px_rgba(245,186,19,0.08)]"
                      style={{ height: `${Math.max(6, height)}%` }}
                      title={`${m.month}: ₹${formatPrice(m.revenue)} (${m.orders} orders)`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">
                    {m.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[#0E111B] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-elevation-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Top Products</h2>
              <p className="text-xs text-slate-400">Best selling items</p>
            </div>
            <Link href="/admin/products" className="text-xs text-brand-yellow hover:underline">
              View Catalog
            </Link>
          </div>

          {(analytics?.topProducts || []).length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No sales data recorded yet. Once store orders are placed, top products will rank here.
            </div>
          ) : (
            <div className="space-y-3">
              {(analytics?.topProducts || []).map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
                >
                  <span className="w-6 h-6 rounded-md bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-slate-400">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.orders} ordered</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">₹{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Second Grid: Recent Orders & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Real Orders */}
        <div className="lg:col-span-2 bg-[#0E111B] border border-white/[0.06] rounded-2xl shadow-elevation-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
              <p className="text-xs text-slate-400">Latest customer checkouts from the storefront</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-brand-yellow hover:underline font-medium flex items-center gap-1"
            >
              All Orders ({stats?.totalOrders ?? 0}) <ChevronRight size={13} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No customer orders received yet. Orders placed on the live store will appear here immediately.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Order
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href="/admin/orders"
                          className="text-xs font-mono font-bold text-brand-yellow group-hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <div className="text-[11px] text-slate-500">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-300">
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">{order.customerEmail || order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-white">
                        ₹{formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#0E111B] border border-white/[0.06] rounded-2xl p-5 sm:p-6 shadow-elevation-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Category Distribution</h2>
              <p className="text-xs text-slate-400">Order share across catalog</p>
            </div>
            <Link href="/admin/categories" className="text-xs text-brand-yellow hover:underline">
              Categories
            </Link>
          </div>

          {(analytics?.topCategories || []).length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Categories will populate as orders are completed across categories.
            </div>
          ) : (
            <div className="space-y-4">
              {(analytics?.topCategories || []).map((c) => (
                <div key={c.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{c.name}</span>
                    <span className="text-slate-400 font-mono">{c.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-yellow to-amber-500 rounded-full"
                      style={{ width: `${c.percentage}%` }}
                    />
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
