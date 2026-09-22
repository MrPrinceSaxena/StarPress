'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, X, ChevronDown, Package, Clock,
  Truck, CheckCircle2, XCircle, RotateCcw, Eye,
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import StatCard from '@/components/admin/ui/StatCard';
import EmptyState from '@/components/admin/ui/EmptyState';
import { orderService } from '@/lib/admin/services';
import type { AdminOrder, OrderStatus } from '@/lib/admin/types';

type StatusTab = 'all' | OrderStatus;

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const stats = orderService.getStats();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const result = await orderService.getOrders({ search, status: statusTab, page, pageSize: 10 });
    setOrders(result.data);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, [search, statusTab, page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { setPage(1); }, [search, statusTab]);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'processing', label: 'Processing', count: stats.processing },
    { key: 'shipped', label: 'Shipped', count: stats.shipped },
    { key: 'delivered', label: 'Delivered', count: stats.delivered },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
    { key: 'refunded', label: 'Refunded', count: stats.refunded },
  ];

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage and track customer orders across StarPress.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={ShoppingCart} title="Total Orders" value={stats.total.toString()} change={-1.4} iconColor="text-blue-400" />
        <StatCard icon={Clock} title="Pending" value={stats.pending.toString()} iconColor="text-amber-400" />
        <StatCard icon={Truck} title="Shipped" value={stats.shipped.toString()} iconColor="text-cyan-400" />
        <StatCard icon={CheckCircle2} title="Delivered" value={stats.delivered.toString()} iconColor="text-emerald-400" />
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        {/* Search */}
        <div className="flex items-center gap-3 p-3 border-b border-border-subtle">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search orders, customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/30 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white"><X size={14} /></button>}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button key={tab.key} onClick={() => setStatusTab(tab.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${statusTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-text-muted hover:text-white hover:bg-white/[0.04]'}`}>
              {tab.label}<span className="ml-1.5 text-[10px] opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No orders found" description={search ? `No orders match "${search}"` : 'No orders yet'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Order</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Items</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Payment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Fulfillment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-4 py-3"><span className="text-xs font-mono font-medium text-brand-yellow">{order.orderNumber}</span></td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-white">{order.customerName}</div>
                      <div className="text-[11px] text-text-muted">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{order.itemCount}</td>
                    <td className="px-4 py-3 text-xs font-medium text-white">₹{formatPrice(order.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.fulfillmentStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-3 border-t border-border-subtle">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={10} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-bg-surface border-l border-border-subtle shadow-elevation-md overflow-y-auto animate-fadeIn">
            <div className="sticky top-0 bg-bg-surface border-b border-border-subtle p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-sm font-bold text-white">{selectedOrder.orderNumber}</h2>
                <div className="flex items-center gap-2 mt-1"><StatusBadge status={selectedOrder.status} /> <StatusBadge status={selectedOrder.paymentStatus} /></div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06]"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Customer</h3>
                <p className="text-sm text-white font-medium">{selectedOrder.customerName}</p>
                <p className="text-xs text-text-secondary">{selectedOrder.customerEmail}</p>
                <p className="text-xs text-text-muted mt-1">{selectedOrder.shippingAddress}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border-subtle/50">
                      <div><p className="text-xs font-medium text-white">{item.productName}</p><p className="text-[11px] text-text-muted">{item.sku} × {item.quantity}</p></div>
                      <span className="text-xs font-medium text-white">₹{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <div className="flex justify-between text-xs"><span className="text-text-muted">Subtotal</span><span className="text-white">₹{formatPrice(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-text-muted">Tax</span><span className="text-white">₹{formatPrice(selectedOrder.tax)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-text-muted">Shipping</span><span className="text-white">₹{formatPrice(selectedOrder.shipping)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-xs"><span className="text-text-muted">Discount</span><span className="text-emerald-400">−₹{formatPrice(selectedOrder.discount)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border-subtle"><span className="text-white">Total</span><span className="text-white">₹{formatPrice(selectedOrder.total)}</span></div>
              </div>
              {selectedOrder.notes && (
                <div><h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes</h3><p className="text-xs text-text-secondary bg-white/[0.02] rounded-lg p-3 border border-border-subtle">{selectedOrder.notes}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
