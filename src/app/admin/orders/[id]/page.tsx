'use client';

// =============================================================================
// /admin/orders/[id] — Full Order Detail & Fulfillment Page for StarPress
// Features: Order summary, timeline, item specs, courier tracking, GST invoice print
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, Truck, CheckCircle2, Clock,
  Package, User, Mail, Phone, MapPin, CreditCard,
  Calendar, ExternalLink, Save, FileText, AlertCircle,
  Loader2, Check, Copy, ShieldAlert, RotateCcw,
  MessageCircle, Send, X
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { showToast } from '@/components/admin/ui/Toast';
import { orderService } from '@/lib/admin/services';
import type { AdminOrder, OrderStatus } from '@/lib/admin/types';
import {
  getOrderNotificationText,
  buildWhatsAppClickUrl,
  OrderNotificationType,
} from '@/lib/notifications/order-messages';

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

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Customer completed checkout' },
  { key: 'processing', label: 'In Production', desc: 'Pre-press proof & printing underway' },
  { key: 'shipped', label: 'Dispatched', desc: 'Handed over to courier partner' },
  { key: 'delivered', label: 'Delivered', desc: 'Successfully delivered to customer' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states for updates
  const [status, setStatus] = useState<string>('pending');
  const [courierPartner, setCourierPartner] = useState<string>('Shiprocket');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Notification Modal States
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyType, setNotifyType] = useState<OrderNotificationType>('shipped');
  const [notifyChannel, setNotifyChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifySending, setNotifySending] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setStatus(data.order.status || 'pending');
        setCourierPartner(data.order.courierPartner || 'Shiprocket');
        setTrackingNumber(data.order.trackingNumber || '');
        setInternalNotes(data.order.notes || '');
      } else {
        showToast(data.error || 'Order not found', 'error');
      }
    } catch {
      showToast('Failed to load order', 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleManualMarkPaid = async () => {
    if (!order) return;
    if (!window.confirm(`Mark Order #${order.orderNumber} as PAID? This audit action is logged.`)) return;

    setIsMarkingPaid(true);
    try {
      const res = await orderService.markOrderPaid(order.id);
      if (res.success) {
        showToast(res.message || `Order #${order.orderNumber} marked as PAID`);
        loadOrder();
      } else {
        showToast(res.message || 'Failed to mark order as paid', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error marking order as paid', 'error');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const openNotificationModal = (channel: 'whatsapp' | 'email', type: OrderNotificationType) => {
    if (!order) return;
    setNotifyChannel(channel);
    setNotifyType(type);
    const text = getOrderNotificationText(type, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      total: order.total,
      status: status || order.status,
      courierPartner: courierPartner || order.courierPartner,
      trackingNumber: trackingNumber || order.trackingNumber,
    });
    setNotifyMessage(text);
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async () => {
    if (notifyChannel === 'whatsapp') {
      if (!order?.customerPhone) {
        showToast('No customer phone number recorded for this order', 'error');
        return;
      }
      const url = buildWhatsAppClickUrl(order.customerPhone, notifyMessage);
      window.open(url, '_blank');
      setNotifyModalOpen(false);
      showToast('WhatsApp chat window opened', 'success');
      return;
    }

    // Email dispatch
    setNotifySending(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          type: notifyType,
          customMessage: notifyMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          data.sent
            ? 'Customer update email dispatched successfully'
            : 'Email notification logged in order records',
          'success'
        );
        setNotifyModalOpen(false);
      } else {
        showToast(data.error || 'Failed to dispatch email', 'error');
      }
    } catch {
      showToast('Error sending customer notification', 'error');
    } finally {
      setNotifySending(false);
    }
  };

  const handleSaveFulfillment = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          courierPartner,
          trackingNumber,
          notes: internalNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order details and fulfillment updated', 'success');
        loadOrder();
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch {
      showToast('Error saving updates', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Order number copied to clipboard', 'info');
    }
  };

  // Determine current timeline progress index
  const getStepIndex = (st: string) => {
    const s = st.toLowerCase();
    if (s === 'delivered') return 3;
    if (s === 'shipped' || s === 'dispatched') return 2;
    if (s === 'processing' || s === 'confirmed' || s === 'in_production') return 1;
    return 0;
  };

  const currentStepIndex = getStepIndex(status);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 size={32} className="animate-spin text-[#F5A623]" />
        <p className="text-sm font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
        <AlertCircle size={48} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested order could not be located in StarPress database.
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* Non-print Header & Action Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {order.orderNumber}
              </h1>
              <button
                onClick={copyOrderNumber}
                className="text-slate-400 hover:text-slate-700 p-1 transition-colors cursor-pointer"
                title="Copy order number"
              >
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              </button>
              <StatusBadge status={order.status} />
              <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                order.paymentStatus === 'paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-slate-400" />
              Placed on {new Date(order.date).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {order.paymentStatus !== 'paid' && order.paymentMethod === 'PAY_AFTER_PROOF' && (
            <button
              onClick={handleManualMarkPaid}
              disabled={isMarkingPaid}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Confirm payment received offline (audit logged)"
            >
              {isMarkingPaid ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Mark as Paid
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={15} />
            Print GST Invoice
          </button>
          <button
            onClick={handleSaveFulfillment}
            disabled={saving}
            className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Workflow Progress Timeline (Hidden on Print) */}
      <div className="print:hidden bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3.5">
          Order Production & Fulfillment Workflow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 relative">
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                onClick={() => setStatus(step.key)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-50/80 border-[#F5A623] text-slate-900 shadow-2xs ring-1 ring-[#F5A623]/30'
                    : isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                    : 'bg-slate-50/60 border-[#E5E7EB] text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrent ? 'text-amber-800' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    Step {idx + 1}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 size={16} className={isCurrent ? 'text-amber-700' : 'text-emerald-600'} />
                  ) : (
                    <Clock size={16} className="text-slate-300" />
                  )}
                </div>
                <p className="font-bold text-sm text-slate-900">{step.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Items & Financials | Right Customer & Fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Order Items ({order.itemCount} items)</span>
              <span className="text-xs text-slate-500 font-normal">
                Curated for custom print production
              </span>
            </h3>

            <div className="divide-y divide-[#E5E7EB]">
              {order.items.map((it: any) => (
                <div key={it.id} className="py-4.5 flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-50 border border-[#E5E7EB] overflow-hidden shrink-0 flex items-center justify-center">
                    {it.image ? (
                      <Image
                        src={it.image}
                        alt={it.productName}
                        width={64}
                        height={64}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{it.productName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{it.sku}</p>

                    {/* Custom specifications / artwork */}
                    {it.specs && (
                      <div className="mt-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-[#E5E7EB] space-y-1">
                        {Object.entries(it.specs).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-500 capitalize">{key}:</span>
                            <span className="text-slate-800 font-semibold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {it.customText && (
                      <p className="text-xs text-slate-800 mt-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                        <span className="font-bold text-amber-800">Custom Text:</span> {it.customText}
                      </p>
                    )}

                    {it.artworkUrl && (
                      <div className="mt-2.5">
                        <a
                          href={it.artworkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink size={13} />
                          Download Customer Artwork File
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">
                      ₹{new Intl.NumberFormat('en-IN').format(it.total)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      ₹{new Intl.NumberFormat('en-IN').format(it.unitPrice)} × {it.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-5 pt-4.5 border-t border-[#E5E7EB] space-y-2.5 text-xs font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="text-slate-900 font-semibold">₹{new Intl.NumberFormat('en-IN').format(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% Goods & Services Tax)</span>
                <span className="text-slate-900 font-semibold">₹{new Intl.NumberFormat('en-IN').format(order.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping & Handling</span>
                <span className="text-slate-900 font-semibold">{order.shipping > 0 ? `₹${new Intl.NumberFormat('en-IN').format(order.shipping)}` : 'FREE'}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Applied</span>
                  <span>-₹{new Intl.NumberFormat('en-IN').format(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-3 border-t border-[#E5E7EB]">
                <span>Total Amount</span>
                <span className="text-base text-slate-900 font-bold">₹{new Intl.NumberFormat('en-IN').format(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          <div className="print:hidden bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText size={16} className="text-[#F5A623]" />
              Internal Production Notes
            </h3>
            <p className="text-xs text-slate-500 mb-3.5">
              Visible only to StarPress staff. Include pre-press instructions, paper stock details, or courier references.
            </p>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. 350 GSM Matte Lamination approved. Ship with waterproof corner guards."
              className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* Right Column (1 Col): Customer & Dispatch */}
        <div className="space-y-6">
          {/* Dispatch & Fulfillment Card */}
          <div className="print:hidden bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck size={17} className="text-[#F5A623]" />
              Dispatch & Fulfillment
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] cursor-pointer shadow-2xs"
              >
                <option value="pending">Pending</option>
                <option value="processing">In Production / Processing</option>
                <option value="shipped">Dispatched / Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Courier Partner */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Courier Partner
              </label>
              <select
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] cursor-pointer shadow-2xs"
              >
                {COURIER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                AWB / Tracking Number
              </label>
              <input
                type="text"
                placeholder="e.g. 14325890423"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] font-mono shadow-2xs"
              />
            </div>

            <button
              onClick={handleSaveFulfillment}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#F5A623] text-black hover:bg-[#e0961e] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Update Fulfillment
            </button>
          </div>

          {/* Customer Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User size={17} className="text-[#F5A623]" />
                Customer Information
              </h3>
              <Link
                href={`/admin/customers/${encodeURIComponent(order.customerEmail || order.userId || order.customerPhone || 'customer')}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                Profile <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 font-bold shrink-0">
                  {order.customerName ? order.customerName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
                  <p className="text-slate-500 text-[11px]">Direct Store Customer</p>
                </div>
              </div>

              {order.customerEmail && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <a href={`mailto:${order.customerEmail}`} className="hover:text-blue-600 transition-colors truncate font-medium">
                    {order.customerEmail}
                  </a>
                </div>
              )}

              {order.customerPhone && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <a href={`tel:${order.customerPhone}`} className="hover:text-blue-600 transition-colors font-medium">
                    {order.customerPhone}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E7EB]">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={13} className="text-[#F5A623]" />
                Shipping Destination
              </p>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-[#E5E7EB]">
                {order.shippingAddress || 'No address provided'}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={13} className="text-[#F5A623]" />
                  Payment Method
                </p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-700 uppercase font-mono font-medium">
                {order.paymentMethod || 'Online Gateway / Razorpay'}
              </p>
              {order.paymentStatus !== 'paid' && order.paymentMethod === 'PAY_AFTER_PROOF' && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[11px] text-amber-800 font-medium mb-2.5">
                    Pay-after-proof awaiting offline payment verification.
                  </p>
                  <button
                    onClick={handleManualMarkPaid}
                    disabled={isMarkingPaid}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isMarkingPaid ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Confirm Offline Payment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Customer Notifications & WhatsApp Automation */}
          <div className="print:hidden bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle size={17} className="text-[#25D366]" />
                Customer Alerts & WhatsApp
              </h3>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Automated
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Trigger instant order status updates directly to customer’s WhatsApp or registered email address.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => openNotificationModal('whatsapp', 'shipped')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                    <Truck size={14} />
                  </div>
                  <span>WhatsApp: Dispatched + AWB Tracking</span>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => openNotificationModal('whatsapp', 'in_production')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                  <span>WhatsApp: In Production Alert</span>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => openNotificationModal('whatsapp', 'confirmed')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>WhatsApp: Order Confirmation</span>
                </div>
                <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => openNotificationModal('email', 'shipped')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E5E7EB] text-xs font-semibold text-slate-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Mail size={14} />
                  </div>
                  <span>Email: Send Transactional Update</span>
                </div>
                <Send size={14} className="text-slate-400 group-hover:text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable GST Invoice (Only renders clearly on window.print()) */}
      <div className="hidden print:block print:bg-white print:text-black print:p-8 print:w-full">
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">STARPRESS</h1>
            <p className="text-xs text-gray-600">Premium Commercial & Business Printing</p>
            <p className="text-xs text-gray-600">GSTIN: 07AAACS1429B1Z8</p>
            <p className="text-xs text-gray-600">Official Store Invoice | Star Press</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">TAX INVOICE</h2>
            <p className="text-xs font-mono">Invoice #: {order.orderNumber}</p>
            <p className="text-xs">Date: {new Date(order.date).toLocaleDateString('en-IN')}</p>
            <p className="text-xs">Status: {order.paymentStatus?.toUpperCase()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
          <div>
            <p className="font-bold text-gray-700 uppercase mb-1">Billed & Shipped To:</p>
            <p className="font-semibold">{order.customerName}</p>
            <p>{order.shippingAddress}</p>
            <p>Phone: {order.customerPhone}</p>
            <p>Email: {order.customerEmail}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-700 uppercase mb-1">Dispatch Details:</p>
            <p>Courier: {order.courierPartner || 'StarPress Logistics'}</p>
            <p>Tracking AWB: {order.trackingNumber || 'Pending'}</p>
            <p>Payment: {order.paymentMethod}</p>
          </div>
        </div>

        <table className="w-full text-left text-xs mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {order.items.map((it: any) => (
              <tr key={it.id}>
                <td className="py-2">
                  <p className="font-medium">{it.productName}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{it.sku}</p>
                </td>
                <td className="py-2 text-center">{it.quantity}</td>
                <td className="py-2 text-right">₹{new Intl.NumberFormat('en-IN').format(it.unitPrice)}</td>
                <td className="py-2 text-right">₹{new Intl.NumberFormat('en-IN').format(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-black pt-4 flex justify-end text-xs">
          <div className="w-64 space-y-1 text-right">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%):</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(order.tax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{order.shipping > 0 ? `₹${new Intl.NumberFormat('en-IN').format(order.shipping)}` : 'FREE'}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
              <span>Total:</span>
              <span>₹{new Intl.NumberFormat('en-IN').format(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-[10px] text-gray-500 border-t border-gray-300 pt-4">
          <p>Thank you for choosing StarPress for your commercial print solutions!</p>
          <p>This is a computer-generated tax invoice. No signature required.</p>
        </div>
      </div>

      {/* Notification Preview & Send Modal */}
      {notifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  notifyChannel === 'whatsapp' ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-purple-50 text-purple-600'
                }`}>
                  {notifyChannel === 'whatsapp' ? <MessageCircle size={18} /> : <Mail size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {notifyChannel === 'whatsapp' ? 'Send WhatsApp Message' : 'Send Email Notification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    To: {order.customerName} ({notifyChannel === 'whatsapp' ? order.customerPhone || 'No phone' : order.customerEmail || 'No email'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotifyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Message Content Preview (Editable)
                </label>
                <textarea
                  rows={8}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] font-mono leading-relaxed resize-none shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setNotifyModalOpen(false)}
                  disabled={notifySending}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendNotification}
                  disabled={notifySending}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shadow-xs cursor-pointer ${
                    notifyChannel === 'whatsapp'
                      ? 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
                      : 'bg-[#F5A623] text-black hover:bg-[#e0961e]'
                  }`}
                >
                  {notifySending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : notifyChannel === 'whatsapp' ? (
                    <>
                      <MessageCircle size={15} />
                      Open WhatsApp Web
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Email Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
