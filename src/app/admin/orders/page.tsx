'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Search, X, Package, Clock,
  Truck, CheckCircle2, XCircle, RotateCcw, Eye, Save, ExternalLink, AlertCircle
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import StatCard from '@/components/admin/ui/StatCard';
import EmptyState from '@/components/admin/ui/EmptyState';
import { showToast } from '@/components/admin/ui/Toast';
import { orderService } from '@/lib/admin/services';
import type { AdminOrder, OrderStatus } from '@/lib/admin/types';

type StatusTab = 'all' | OrderStatus;

const COURIER_OPTIONS = [
  'Shiprocket',
  'BlueDart',
  'Delhivery',
  'DTDC',
  'India Post',
  'Ekart',
  'Shadowfax',
  'Hand Delivery / Local Pickup',
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Status and tracking state in drawer
  const [drawerStatus, setDrawerStatus] = useState<string>('pending');
  const [drawerTracking, setDrawerTracking] = useState<string>('');
  const [drawerCourier, setDrawerCourier] = useState<string>('Shiprocket');
  const [isUpdating, setIsUpdating] = useState(false);

  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const result = await orderService.getOrders({ search, status: statusTab, page, pageSize: 10 });
    setOrders(result.data);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    if (result.stats && result.stats.total > 0) {
      setOrderStats(result.stats);
    } else if (result.data.length > 0 || result.total > 0) {
      const totalCount = Math.max(result.total, result.data.length);
      const pendingCount = result.data.filter((o) => o.status === 'pending').length;
      const processingCount = result.data.filter((o) => o.status === 'processing').length;
      const shippedCount = result.data.filter((o) => o.status === 'shipped').length;
      const deliveredCount = result.data.filter((o) => o.status === 'delivered').length;
      const cancelledCount = result.data.filter((o) => o.status === 'cancelled').length;
      const refundedCount = result.data.filter((o) => o.status === 'refunded').length;

      setOrderStats((prev) => ({
        total: Math.max(prev.total, totalCount),
        pending: prev.pending || pendingCount,
        processing: prev.processing || processingCount,
        shipped: prev.shipped || shippedCount,
        delivered: prev.delivered || deliveredCount,
        cancelled: prev.cancelled || cancelledCount,
        refunded: prev.refunded || refundedCount,
      }));
    } else if (result.stats) {
      setOrderStats(result.stats);
    }
    setLoading(false);
  }, [search, statusTab, page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { setPage(1); }, [search, statusTab]);

  // Sync drawer form state when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setDrawerStatus(selectedOrder.status);
      setDrawerTracking(selectedOrder.trackingNumber || '');
      setDrawerCourier(selectedOrder.courierPartner || 'Shiprocket');
    }
  }, [selectedOrder]);

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    try {
      const res = await orderService.updateOrderStatus(selectedOrder.id, drawerStatus, {
        trackingNumber: drawerTracking,
        courierPartner: drawerCourier,
      });

      if (res.success) {
        showToast(`Order ${selectedOrder.orderNumber} updated to ${drawerStatus.toUpperCase()}`);
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: drawerStatus as any,
                trackingNumber: drawerTracking,
                courierPartner: drawerCourier,
              }
            : null
        );
        loadOrders();
      } else {
        showToast('Failed to update order status', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating order', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  const totalDisplay = Math.max(orderStats.total, total, orders.length);

  const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalDisplay },
    { key: 'pending', label: 'Pending', count: orderStats.pending },
    { key: 'processing', label: 'Processing', count: orderStats.processing },
    { key: 'shipped', label: 'Shipped', count: orderStats.shipped },
    { key: 'delivered', label: 'Delivered', count: orderStats.delivered },
    { key: 'cancelled', label: 'Cancelled', count: orderStats.cancelled },
    { key: 'refunded', label: 'Refunded', count: orderStats.refunded },
  ];

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage, fulfill, and track real customer orders across StarPress.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ShoppingCart} title="Total Orders" value={totalDisplay.toString()} iconColor="text-blue-400" />
        <StatCard icon={Clock} title="Pending" value={(orderStats.pending || (statusTab === 'pending' ? totalDisplay : 0)).toString()} iconColor="text-amber-400" />
        <StatCard icon={Truck} title="Shipped" value={(orderStats.shipped || (statusTab === 'shipped' ? totalDisplay : 0)).toString()} iconColor="text-cyan-400" />
        <StatCard icon={CheckCircle2} title="Delivered" value={(orderStats.delivered || (statusTab === 'delivered' ? totalDisplay : 0)).toString()} iconColor="text-emerald-400" />
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        {/* Search */}
        <div className="flex items-center gap-3 p-3 border-b border-border-subtle">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search orders, customers, emails…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/30 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border-subtle overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] opacity-60 font-semibold">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description={
              search
                ? `No orders match "${search}"`
                : 'Customer orders placed through the store checkout will appear here in real time.'
            }
          />
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
                  <tr
                    key={order.id}
                    className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-medium text-brand-yellow hover:underline">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-white">{order.customerName}</div>
                      <div className="text-[11px] text-text-muted">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{order.itemCount} pcs</td>
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

      {/* Order Detail & Fulfillment Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-bg-surface border-l border-border-subtle shadow-elevation-md overflow-y-auto animate-fadeIn">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-bg-surface/95 backdrop-blur border-b border-border-subtle p-5 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white font-mono">{selectedOrder.orderNumber}</h2>
                  <span className="text-[11px] text-text-muted">
                    {new Date(selectedOrder.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={selectedOrder.status} />
                  <StatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Order Status & Fulfillment Actions */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border-subtle space-y-3.5">
                <h3 className="text-xs font-semibold text-brand-yellow uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} /> Update Fulfillment & Status
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-text-muted block mb-1">Order Status</label>
                    <select
                      value={drawerStatus}
                      onChange={(e) => setDrawerStatus(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-bg-base border border-border-subtle text-xs text-white focus:outline-none focus:border-brand-yellow/40 capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing / Confirmed</option>
                      <option value="in_production">In Production</option>
                      <option value="shipped">Shipped / Dispatched</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-text-muted block mb-1">Courier Partner</label>
                    <select
                      value={drawerCourier}
                      onChange={(e) => setDrawerCourier(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg bg-bg-base border border-border-subtle text-xs text-white focus:outline-none focus:border-brand-yellow/40"
                    >
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-text-muted block mb-1">AWB / Courier Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-98234823 or SP-TRACK-123"
                    value={drawerTracking}
                    onChange={(e) => setDrawerTracking(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg bg-bg-base border border-border-subtle text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow/40"
                  />
                </div>

                <button
                  onClick={handleUpdateOrderStatus}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50"
                >
                  <Save size={13} />
                  {isUpdating ? 'Updating Order…' : 'Save Status & Tracking'}
                </button>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Customer Details</h3>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle/50 text-xs space-y-1">
                  <p className="text-sm text-white font-semibold">{selectedOrder.customerName}</p>
                  <p className="text-text-secondary">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-text-muted font-mono">{selectedOrder.customerPhone}</p>
                  )}
                  {selectedOrder.shippingAddress && (
                    <div className="pt-2 mt-2 border-t border-border-subtle/40">
                      <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Shipping Address:</span>
                      <p className="text-text-secondary leading-relaxed">{selectedOrder.shippingAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Ordered Items ({selectedOrder.itemCount})</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-border-subtle/40">
                      <div>
                        <p className="text-xs font-medium text-white">{item.productName}</p>
                        <p className="text-[11px] text-text-muted font-mono">
                          {item.sku} • {item.quantity} pcs @ ₹{formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-white">₹{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border-subtle">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-white">₹{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">GST Tax (Itemized)</span>
                  <span className="text-white">₹{formatPrice(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Shipping</span>
                  <span className="text-white">{selectedOrder.shipping > 0 ? `₹${formatPrice(selectedOrder.shipping)}` : 'FREE'}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Discount Applied</span>
                    <span className="text-emerald-400">−₹{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-border-subtle">
                  <span className="text-white">Total Amount</span>
                  <span className="text-brand-yellow font-mono text-base">₹{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Special Instructions</h3>
                  <p className="text-xs text-text-secondary bg-white/[0.02] rounded-lg p-3 border border-border-subtle">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
