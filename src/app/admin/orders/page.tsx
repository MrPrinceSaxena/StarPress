'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  X,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Save,
  ExternalLink,
  AlertCircle,
  Copy,
  Phone,
  Mail,
  MapPin,
  Check,
  RefreshCw,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Download,
  FileText,
  MessageSquare,
  Sparkles,
  Layers,
  Building,
  Receipt,
  Scissors,
  FileCheck,
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import StatCard from '@/components/admin/ui/StatCard';
import EmptyState from '@/components/admin/ui/EmptyState';
import { Skeleton, SkeletonTableRow } from '@/components/admin/ui/Skeleton';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Status and tracking state in drawer
  const [drawerStatus, setDrawerStatus] = useState<string>('pending');
  const [drawerTracking, setDrawerTracking] = useState<string>('');
  const [drawerCourier, setDrawerCourier] = useState<string>('Shiprocket');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  // Order Card Detail Drawer state
  const [drawerTab, setDrawerTab] = useState<'all' | 'production' | 'customer' | 'dispatch' | 'payment'>('all');
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // Manual Order Creation Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine1: 'Star Press Counter / Walk-in',
    city: 'Khatima',
    state: 'Uttarakhand',
    pincode: '262308',
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    orderStatus: 'CONFIRMED',
    shippingFee: '0',
    discountAmount: '0',
    notes: '',
  });

  const [orderItems, setOrderItems] = useState<Array<{ productName: string; quantity: number; unitPrice: number }>>([
    { productName: 'Visiting Cards (Premium 350 GSM)', quantity: 500, unitPrice: 450 },
  ]);

  const handleAddItem = () => {
    setOrderItems((prev) => [...prev, { productName: '', quantity: 100, unitPrice: 200 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) {
      showToast('At least one item is required', 'error');
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateSubtotal = () =>
    orderItems.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1), 0);

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const ship = Number(newOrderForm.shippingFee) || 0;
    const disc = Number(newOrderForm.discountAmount) || 0;
    return Math.max(0, sub + ship - disc);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    if (!newOrderForm.customerPhone.trim()) {
      showToast('Customer phone number is required', 'error');
      return;
    }
    for (let i = 0; i < orderItems.length; i++) {
      if (!orderItems[i].productName.trim()) {
        showToast(`Item #${i + 1} name cannot be empty`, 'error');
        return;
      }
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        customerName: newOrderForm.customerName.trim(),
        customerPhone: newOrderForm.customerPhone.trim(),
        customerEmail: newOrderForm.customerEmail.trim() || undefined,
        shippingAddress: {
          fullName: newOrderForm.customerName.trim(),
          phone: newOrderForm.customerPhone.trim(),
          addressLine1: newOrderForm.addressLine1.trim(),
          city: newOrderForm.city.trim(),
          state: newOrderForm.state.trim(),
          pincode: newOrderForm.pincode.trim(),
        },
        items: orderItems.map((it) => ({
          productName: it.productName.trim(),
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          lineTotal: (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
        })),
        paymentMethod: newOrderForm.paymentMethod,
        paymentStatus: newOrderForm.paymentStatus,
        status: newOrderForm.orderStatus,
        shippingFee: Number(newOrderForm.shippingFee) || 0,
        discountAmount: Number(newOrderForm.discountAmount) || 0,
        notes: newOrderForm.notes.trim() || undefined,
      };

      const res = await orderService.createOrder(payload);
      if (res.success && res.order) {
        showToast(`Order #${res.order.orderNumber} created successfully!`);
        setCreateModalOpen(false);
        setNewOrderForm({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          addressLine1: 'Star Press Counter / Walk-in',
          city: 'Khatima',
          state: 'Uttarakhand',
          pincode: '262308',
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          shippingFee: '0',
          discountAmount: '0',
          notes: '',
        });
        setOrderItems([
          { productName: 'Visiting Cards (Premium 350 GSM)', quantity: 500, unitPrice: 450 },
        ]);
        await loadOrders();
      } else {
        showToast(res.error || 'Failed to create order', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error creating order', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const [orderStats, setOrderStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderService.getOrders({
        search: debouncedSearch,
        status: statusTab,
        paymentStatus: paymentFilter as any,
        page,
        pageSize: 10,
      });
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
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusTab, paymentFilter, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusTab, paymentFilter]);

  // Sync drawer form state when order is selected
  useEffect(() => {
    if (selectedOrder) {
      setDrawerStatus(selectedOrder.status);
      setDrawerTracking(selectedOrder.trackingNumber || '');
      setDrawerCourier(selectedOrder.courierPartner || 'Shiprocket');
    }
  }, [selectedOrder]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

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

  const handleManualMarkPaid = async () => {
    if (!selectedOrder) return;
    const confirmMsg = `Are you sure you want to mark Order #${selectedOrder.orderNumber} as PAID? This audit action is logged.`;
    if (!window.confirm(confirmMsg)) return;

    setIsMarkingPaid(true);
    try {
      const res = await orderService.markOrderPaid(selectedOrder.id);
      if (res.success) {
        showToast(res.message || `Order #${selectedOrder.orderNumber} marked as PAID`);
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'paid' as any,
                status: 'confirmed' as any,
              }
            : null
        );
        loadOrders();
      } else {
        showToast(res.message || 'Failed to mark order as paid', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error marking order as paid', 'error');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleIssueRefund = async () => {
    if (!selectedOrder) return;
    if (!refundReason.trim()) {
      showToast('A refund reason is required', 'error');
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason.trim(),
          amount: refundAmount.trim() ? Number(refundAmount) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue refund');
      }

      showToast(`Refund of ₹${data.amount} initiated successfully.`);
      setRefundModalOpen(false);
      setRefundReason('');
      setRefundAmount('');
      loadOrders();
    } catch (err: any) {
      showToast(err.message || 'Refund failed', 'error');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const escapeHtml = (str: string): string => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const handlePrintJobSlip = (order: AdminOrder) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print the job slip.', 'error');
      return;
    }

    const itemsHtml = order.items
      .map((it, idx) => {
        const specsRows = it.specs && typeof it.specs === 'object' && Object.keys(it.specs).length > 0
          ? Object.entries(it.specs)
              .map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:600;text-transform:capitalize;color:#475569;border-bottom:1px solid #e2e8f0;width:35%;">${escapeHtml(k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}</td><td style="padding:4px 8px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(String(v))}</td></tr>`)
              .join('')
          : '<tr><td colspan="2" style="padding:4px 8px;color:#94a3b8;font-style:italic;">Standard Catalog Specifications</td></tr>';

        const customTextHtml = it.customText
          ? `<div style="margin-top:10px;background:#fef3c7;border:2px dashed #f59e0b;border-radius:6px;padding:10px;">
              <div style="font-weight:800;color:#92400e;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">⚠️ CUSTOMER PRINTING GUIDANCE &amp; TEXT:</div>
              <div style="font-family:monospace;font-size:13px;font-weight:700;color:#78350f;white-space:pre-wrap;line-height:1.4;">${escapeHtml(it.customText)}</div>
            </div>`
          : '';

        const artworkHtml = it.artworkUrl
          ? `<div style="margin-top:8px;font-size:11px;color:#1e40af;font-weight:600;">
              📎 Customer Artwork File: <span style="font-family:monospace;word-break:break-all;">${escapeHtml(it.artworkUrl)}</span>
            </div>`
          : '';

        return `
          <div style="border:1px solid #cbd5e1;border-radius:8px;margin-bottom:14px;padding:12px;page-break-inside:avoid;background:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:6px;margin-bottom:8px;">
              <div>
                <span style="background:#0f172a;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:800;margin-right:6px;">ITEM #${idx + 1}</span>
                <span style="font-weight:800;font-size:14px;color:#0f172a;">${escapeHtml(it.productName)}</span>
                <span style="font-family:monospace;font-size:11px;color:#64748b;margin-left:6px;">[${escapeHtml(it.sku)}]</span>
              </div>
              <div style="text-align:right;">
                <span style="font-size:15px;font-weight:900;color:#0f172a;background:#f1f5f9;padding:4px 10px;border-radius:6px;border:1px solid #cbd5e1;">QTY: ${it.quantity}</span>
              </div>
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px;">
              ${specsRows}
            </table>

            ${customTextHtml}
            ${artworkHtml}
          </div>
        `;
      })
      .join('');

    const formattedDate = new Date(order.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const notesHtml = order.notes
      ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-bottom:14px;">
          <strong style="color:#b45309;font-size:11px;text-transform:uppercase;">📝 Customer Special Order Remarks:</strong>
          <div style="color:#78350f;font-size:12px;margin-top:2px;">${escapeHtml(order.notes)}</div>
        </div>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Slip - ${order.orderNumber} - Star Press</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 10px; font-size: 12px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; margin-bottom: 12px; }
            .logo-title { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #0f172a; }
            .logo-sub { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .order-title { text-align: right; }
            .order-num { font-size: 18px; font-weight: 900; font-family: monospace; color: #f59e0b; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
            .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; background: #f8fafc; font-size: 11px; }
            .checklist { border: 1px solid #0f172a; border-radius: 6px; padding: 10px; margin-top: 14px; page-break-inside: avoid; }
            .check-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; font-size: 11px; }
            .check-item { display: flex; align-items: center; gap: 6px; }
            .box { width: 14px; height: 14px; border: 1.5px solid #0f172a; display: inline-block; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;background:#0f172a;color:#fff;padding:8px 16px;border-radius:6px;">
            <span>Press Work Order Slip: <strong>${order.orderNumber}</strong></span>
            <button onclick="window.print()" style="background:#f59e0b;color:#000;border:none;font-weight:700;padding:6px 14px;border-radius:4px;cursor:pointer;">🖨️ Print Slip Now</button>
          </div>

          <div class="header">
            <div>
              <div class="logo-title">⭐ STAR PRESS KHATIMA</div>
              <div class="logo-sub">Commercial Printing Press &amp; Production Job Card</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">Main Market, Khatima, Udham Singh Nagar, UK 262308</div>
            </div>
            <div class="order-title">
              <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Production Job Card</div>
              <div class="order-num">${escapeHtml(order.orderNumber)}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">Ordered: ${formattedDate}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="info-box">
              <div style="font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:4px;font-size:10px;">👤 Customer &amp; Contact Details</div>
              <div style="font-weight:700;font-size:13px;color:#0f172a;">${escapeHtml(order.customerName)}</div>
              <div>📞 Phone: <strong>${escapeHtml(order.customerPhone || 'N/A')}</strong></div>
              <div>✉️ Email: ${escapeHtml(order.customerEmail || 'N/A')}</div>
              <div style="margin-top:4px;">💳 Payment Status: <strong style="text-transform:uppercase;">${escapeHtml(order.paymentStatus)}</strong> (${escapeHtml(order.paymentMethod || 'ONLINE')})</div>
            </div>
            <div class="info-box">
              <div style="font-weight:800;text-transform:uppercase;color:#475569;margin-bottom:4px;font-size:10px;">📍 Delivery Address</div>
              <div style="font-size:11px;line-height:1.3;color:#1e293b;">${escapeHtml(order.shippingAddress || 'Store Pickup / Counter Delivery')}</div>
              <div style="margin-top:6px;font-size:10px;color:#64748b;">Courier Target: <strong>${escapeHtml(order.courierPartner || 'Shiprocket')}</strong> ${order.trackingNumber ? `| AWB: ${escapeHtml(order.trackingNumber)}` : ''}</div>
            </div>
          </div>

          ${notesHtml}

          <div style="margin-top:10px;margin-bottom:6px;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#0f172a;">
            📦 Line Items &amp; Print Specifications (${order.itemCount} items)
          </div>

          ${itemsHtml}

          <div class="checklist">
            <div style="font-weight:900;text-transform:uppercase;font-size:11px;color:#0f172a;border-bottom:1px solid #cbd5e1;padding-bottom:4px;">
              🏭 Factory Press Sign-Off &amp; Quality Check
            </div>
            <div class="check-grid">
              <div class="check-item"><span class="box"></span> <span>1. Pre-Press &amp; Bleed Check</span></div>
              <div class="check-item"><span class="box"></span> <span>2. CTP / Digital RIP</span></div>
              <div class="check-item"><span class="box"></span> <span>3. Machine Print &amp; Density</span></div>
              <div class="check-item"><span class="box"></span> <span>4. Lamination / Coating</span></div>
              <div class="check-item"><span class="box"></span> <span>5. Die Cutting / Corner Trim</span></div>
              <div class="check-item"><span class="box"></span> <span>6. Count &amp; Packing QC</span></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:10px;color:#475569;">
              <div>Press Operator Sign: _____________________</div>
              <div>QC Inspector Sign: _____________________</div>
              <div>Dispatch Sign: _____________________</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const totalDisplay = Math.max(orderStats.total, total, orders.length);

  const PAYMENT_FILTERS = [
    { key: 'all', label: 'All Payments' },
    { key: 'unpaid', label: 'UNPAID' },
    { key: 'paid', label: 'PAID' },
    { key: 'pay_after_proof', label: 'PAY AFTER PROOF' },
  ];

  const STATUS_TABS: { key: StatusTab; label: string; count: number }[] = [
    { key: 'all', label: 'All Orders', count: totalDisplay },
    { key: 'pending', label: 'Pending', count: orderStats.pending },
    { key: 'processing', label: 'Processing', count: orderStats.processing },
    { key: 'shipped', label: 'Shipped', count: orderStats.shipped },
    { key: 'delivered', label: 'Delivered', count: orderStats.delivered },
    { key: 'cancelled', label: 'Cancelled', count: orderStats.cancelled },
    { key: 'refunded', label: 'Refunded', count: orderStats.refunded },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Customer Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              {totalDisplay} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Dispatch printing jobs, assign courier AWB tracking, and track fulfillment in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#111827] hover:bg-black shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>+ Create Order</span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-[#E5E7EB] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#F5A623]' : ''} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          icon={ShoppingCart}
          title="Total Orders"
          value={totalDisplay.toString()}
          iconColor="text-blue-500"
        />
        <StatCard
          icon={Clock}
          title="Pending Action"
          value={orderStats.pending.toString()}
          iconColor="text-amber-500"
          period="needs dispatch"
        />
        <StatCard
          icon={Truck}
          title="In Transit"
          value={orderStats.shipped.toString()}
          iconColor="text-cyan-500"
          period="with courier"
        />
        <StatCard
          icon={CheckCircle2}
          title="Delivered"
          value={orderStats.delivered.toString()}
          iconColor="text-emerald-500"
          period="completed"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-3.5 sm:p-4 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order #, customer name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F5A623] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-[#E5E7EB] overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusTab === tab.key
                  ? 'bg-[#1E2536] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Payment Filter Sub-row */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#E5E7EB] bg-[#F9FAFB] overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1.5 flex items-center gap-1">
            <CreditCard size={12} /> Payment:
          </span>
          {PAYMENT_FILTERS.map((pf) => (
            <button
              key={pf.key}
              onClick={() => setPaymentFilter(pf.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${
                paymentFilter === pf.key
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {pf.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="p-4">
            <table className="w-full">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={8} />
                ))}
              </tbody>
            </table>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={
              search
                ? `No orders match "${search}"`
                : 'Customer orders placed through the store checkout will appear here in real time.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Fulfillment</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-[#F5A623] group-hover:underline">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(order.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">{order.itemCount} item(s)</td>
                    <td className="px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-900">
                      ₹{formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.fulfillmentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E5E7EB] flex items-center justify-between">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={10}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Order Detail & Printing Production Specification Card */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fadeIn"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-3xl bg-white border-l border-[#E5E7EB] shadow-2xl overflow-y-auto animate-fadeIn flex flex-col justify-between">
            {/* Drawer Header */}
            <div>
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 z-20">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                      Work Order
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                      {selectedOrder.orderNumber}
                    </h2>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedOrder.orderNumber, 'order number')}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Copy order number"
                    >
                      {copiedField === 'order number' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock size={12} />
                      {new Date(selectedOrder.date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <StatusBadge status={selectedOrder.status} />
                    <StatusBadge status={selectedOrder.paymentStatus} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintJobSlip(selectedOrder)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                    title="Print press operator job slip"
                  >
                    <Printer size={13} />
                    <span>Print Job Slip</span>
                  </button>
                  <Link
                    href={`/admin/orders/${selectedOrder.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#F5A623] hover:bg-amber-50 border border-amber-200 transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Full Tax Bill</span>
                  </Link>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Filters */}
              <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2 overflow-x-auto text-xs">
                {[
                  { key: 'all', label: 'All Details' },
                  { key: 'production', label: `🎨 Print Specs & Artwork (${selectedOrder.items.length})` },
                  { key: 'customer', label: '📍 Customer & Shipping' },
                  { key: 'dispatch', label: '🚚 Courier Dispatch' },
                  { key: 'payment', label: '💳 Payment Breakdown' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDrawerTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      drawerTab === tab.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* 1. PRINT MANUFACTURING & ARTWORK SPECIFICATIONS (Primary Focus) */}
                {(drawerTab === 'all' || drawerTab === 'production') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#F5A623]/20 text-[#B47000] flex items-center justify-center font-bold">
                          <Layers size={14} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                          Printing Press Specifications &amp; Customer Guidance
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {selectedOrder.items.length} Line Item{selectedOrder.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="rounded-2xl border-2 border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4"
                        >
                          {/* Item Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setPreviewModalUrl(item.image)}
                                  />
                                ) : (
                                  <Package size={20} className="text-slate-400" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase font-mono">
                                    Item #{idx + 1}
                                  </span>
                                  <h4 className="text-sm font-bold text-slate-900">{item.productName}</h4>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                  SKU: {item.sku}
                                </p>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-xs sm:text-sm shadow-xs">
                                QTY: {item.quantity}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 sm:mt-1">
                                ₹{formatPrice(item.unitPrice)} ea • Total: ₹{formatPrice(item.total)}
                              </span>
                            </div>
                          </div>

                          {/* Customer Custom Text Guidance */}
                          {item.customText ? (
                            <div className="rounded-xl border-2 border-amber-300 bg-amber-50/70 p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                                  <Sparkles size={14} className="text-amber-600" />
                                  <span>Customer Printing Guidance &amp; Custom Text</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.customText!, `guidance for ${item.productName}`)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                                >
                                  {copiedField === `guidance for ${item.productName}` ? (
                                    <>
                                      <Check size={12} className="text-emerald-700" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy Text</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-white/95 rounded-lg p-3 border border-amber-200 font-mono text-xs text-slate-900 font-semibold whitespace-pre-wrap leading-relaxed select-all shadow-2xs">
                                {item.customText}
                              </div>
                              <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                                <AlertCircle size={13} className="text-amber-600 shrink-0" />
                                <span>Press Manager Note: Verify spelling, bleed bounds, and contact details with customer before printing.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 italic">
                              ℹ️ No custom text instructions entered by customer for this item.
                            </div>
                          )}

                          {/* Technical Specifications Breakdown (GSM, Finish, Cut, Size) */}
                          {item.specs && typeof item.specs === 'object' && Object.keys(item.specs).length > 0 ? (
                            <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                  <Scissors size={13} className="text-[#F5A623]" />
                                  Manufacturing Specifications
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono lowercase">
                                  {Object.keys(item.specs).length} parameters
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(item.specs).map(([specKey, specVal]) => (
                                  <div
                                    key={specKey}
                                    className="bg-white rounded-lg border border-slate-200 p-2 text-xs shadow-2xs"
                                  >
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight truncate">
                                      {specKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                    </span>
                                    <span className="font-bold text-slate-900 mt-0.5 block truncate" title={String(specVal)}>
                                      {String(specVal)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 italic">
                              ℹ️ Standard catalog print specifications applied.
                            </div>
                          )}

                          {/* Customer Artwork File Download & Soft Proof */}
                          <div className="space-y-2 pt-1">
                            {item.artworkUrl ? (
                              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <FileText size={18} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                      Customer Uploaded Artwork Attached
                                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                        Ready
                                      </span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md font-mono mt-0.5">
                                      {item.artworkUrl}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                  <a
                                    href={item.artworkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                                  >
                                    <Download size={13} />
                                    <span>Download Artwork</span>
                                  </a>
                                  <a
                                    href={item.artworkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors"
                                    title="Open raw artwork in new tab"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
                                <span>No external artwork file uploaded by customer.</span>
                                <span className="text-[10px] text-slate-400 font-mono">Template / Online Design</span>
                              </div>
                            )}

                            {/* Prepress Soft Proof Thumbnail */}
                            {item.previewUrl && (
                              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={item.previewUrl}
                                    alt="Soft proof"
                                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setPreviewModalUrl(item.previewUrl!)}
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 text-xs block">
                                      Prepress Soft Proof Generated
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      Rendered customer layout preview thumbnail
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalUrl(item.previewUrl!)}
                                  className="text-xs text-blue-600 font-bold hover:underline px-2 py-1"
                                >
                                  Zoom Preview
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. SPECIAL CUSTOMER CHECKOUT REMARKS */}
                {selectedOrder.notes && (drawerTab === 'all' || drawerTab === 'production' || drawerTab === 'customer') && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border-2 border-amber-300 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-amber-900 flex items-center gap-1.5 tracking-wider">
                        <MessageSquare size={14} className="text-amber-600" />
                        Customer Special Checkout Remarks
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.notes, 'order notes')}
                        className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                      >
                        <Copy size={11} /> Copy Notes
                      </button>
                    </div>
                    <p className="text-xs font-medium text-amber-950 bg-white/90 p-3 rounded-lg border border-amber-200 leading-relaxed font-sans">
                      "{selectedOrder.notes}"
                    </p>
                  </div>
                )}

                {/* 3. CUSTOMER CONTACT & SHIPPING DESTINATION */}
                {(drawerTab === 'all' || drawerTab === 'customer') && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#F5A623]" /> Customer &amp; Shipping Destination
                      </h3>
                      {selectedOrder.customerPhone && (
                        <a
                          href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(
                            selectedOrder.customerName
                          )},%20this%20is%20Star%20Press%20regarding%20your%20printing%20order%20${selectedOrder.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-colors shadow-2xs"
                        >
                          <Phone size={13} />
                          <span>WhatsApp Customer</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {/* Customer Contact info */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          Contact Person
                        </p>
                        <p className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                        <p className="text-slate-600 flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${selectedOrder.customerEmail}`} className="hover:underline truncate">
                            {selectedOrder.customerEmail}
                          </a>
                        </p>
                        {selectedOrder.customerPhone && (
                          <p className="text-slate-600 font-mono flex items-center gap-1.5">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <a href={`tel:${selectedOrder.customerPhone}`} className="hover:underline">
                              {selectedOrder.customerPhone}
                            </a>
                          </p>
                        )}
                      </div>

                      {/* Delivery Address */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Shipping Destination
                            </p>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedOrder.shippingAddress, 'shipping address')}
                              className="text-[10px] font-bold text-[#F5A623] hover:underline flex items-center gap-1"
                            >
                              <Copy size={11} /> Copy Address
                            </button>
                          </div>
                          <p className="text-slate-800 text-xs leading-relaxed font-medium">
                            {selectedOrder.shippingAddress || 'Store Pickup / Counter Delivery'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Business Tax / GST profile if present */}
                    {selectedOrder.billingAddress && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5">
                          <Building size={13} className="text-slate-500" />
                          <span>Billing &amp; Tax Information (B2B Profile)</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                          {typeof selectedOrder.billingAddress === 'object' ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedOrder.billingAddress.gstin && (
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">GSTIN:</span>
                                  <span className="font-mono font-bold text-slate-900">{selectedOrder.billingAddress.gstin}</span>
                                </div>
                              )}
                              {selectedOrder.billingAddress.companyName && (
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Company Name:</span>
                                  <span className="font-bold text-slate-900">{selectedOrder.billingAddress.companyName}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span>{String(selectedOrder.billingAddress)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DISPATCH, COURIER & ORDER STATUS CONTROLS */}
                {(drawerTab === 'all' || drawerTab === 'dispatch') && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck size={15} className="text-[#F5A623]" /> Courier Dispatch &amp; Production Status
                      </h3>
                      <StatusBadge status={selectedOrder.status} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                          Order Production Status
                        </label>
                        <select
                          value={drawerStatus}
                          onChange={(e) => setDrawerStatus(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#F5A623] capitalize cursor-pointer shadow-xs font-medium"
                        >
                          <option value="pending">Pending Confirmation</option>
                          <option value="processing">Processing / In Production</option>
                          <option value="in_production">Printing Machine Run</option>
                          <option value="shipped">Shipped / Dispatched</option>
                          <option value="delivered">Delivered to Customer</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                          Courier Partner
                        </label>
                        <select
                          value={drawerCourier}
                          onChange={(e) => setDrawerCourier(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-slate-900 focus:outline-none focus:border-[#F5A623] cursor-pointer shadow-xs font-medium"
                        >
                          {COURIER_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                        AWB / Tracking Number
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. SF-789324823 or BLUEDART-1234"
                          value={drawerTracking}
                          onChange={(e) => setDrawerTracking(e.target.value)}
                          className="flex-1 h-9 px-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] shadow-xs"
                        />
                        {drawerTracking && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(drawerTracking, 'tracking number')}
                            className="px-2.5 h-9 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-xs text-slate-600 flex items-center gap-1 shadow-xs font-bold"
                            title="Copy tracking number"
                          >
                            {copiedField === 'tracking number' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateOrderStatus}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{isUpdating ? 'Saving to Database…' : 'Save Status & Notify Customer'}</span>
                    </button>
                  </div>
                )}

                {/* 5. PAYMENT AUDIT & FINANCIAL BREAKDOWN */}
                {(drawerTab === 'all' || drawerTab === 'payment') && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={15} className="text-[#F5A623]" /> Payment Audit &amp; Financial Breakdown
                      </h3>
                      <StatusBadge status={selectedOrder.paymentStatus} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                      <span className="text-slate-500">Payment Channel:</span>
                      <span className="font-mono text-slate-900 uppercase font-bold px-2 py-0.5 rounded bg-white border border-[#E5E7EB]">
                        {selectedOrder.paymentMethod || 'ONLINE'}
                      </span>
                    </div>

                    {/* Razorpay Transaction IDs if available */}
                    {(selectedOrder.paymentId || selectedOrder.razorpayOrderId) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        {selectedOrder.paymentId && (
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment ID</span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="font-mono text-slate-900 font-bold truncate text-[11px]">{selectedOrder.paymentId}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(selectedOrder.paymentId!, 'payment ID')}
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedOrder.razorpayOrderId && (
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Razorpay Order ID</span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="font-mono text-slate-900 font-bold truncate text-[11px]">{selectedOrder.razorpayOrderId}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(selectedOrder.razorpayOrderId!, 'Razorpay order ID')}
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Financial itemization */}
                    <div className="space-y-2 pt-2 border-t border-[#E5E7EB] text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Items Subtotal</span>
                        <span className="text-slate-900 font-semibold font-mono">₹{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">GST / Tax Amount</span>
                        <span className="text-slate-900 font-semibold font-mono">₹{formatPrice(selectedOrder.tax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Shipping Delivery Fee</span>
                        <span className="text-slate-900 font-semibold font-mono">
                          {selectedOrder.shipping > 0 ? `₹${formatPrice(selectedOrder.shipping)}` : 'FREE'}
                        </span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Promo Discount</span>
                          <span className="text-emerald-600 font-semibold font-mono">
                            −₹{formatPrice(selectedOrder.discount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-[#E5E7EB]">
                        <span className="text-slate-900">Total Net Amount</span>
                        <span className="text-[#111827] font-mono text-base sm:text-lg font-black">
                          ₹{formatPrice(selectedOrder.total)}
                        </span>
                      </div>
                    </div>

                    {/* Payment verification & Refund triggers */}
                    {selectedOrder.paymentStatus !== 'paid' ? (
                      selectedOrder.paymentMethod === 'PAY_AFTER_PROOF' ||
                      selectedOrder.paymentMethod === 'COD' ||
                      selectedOrder.paymentMethod === 'MANUAL_PROOF' ? (
                        <div className="pt-2">
                          <button
                            onClick={handleManualMarkPaid}
                            disabled={isMarkingPaid}
                            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            <span>{isMarkingPaid ? 'Recording in Audit Log…' : 'Mark as Paid (Proof/COD Confirmed)'}</span>
                          </button>
                          <p className="text-[10px] text-slate-500 text-center mt-1.5">
                            Audit log records administrator name, prior state, and timestamp.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                          🔒 Online gateway order: Verified automatically upon Razorpay webhook capture. Manual override is locked for zero-trust security.
                        </div>
                      )
                    ) : (
                      <div className="space-y-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>Payment verified and captured. Job approved for printing.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRefundAmount('');
                            setRefundReason('');
                            setRefundModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 h-8 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Issue Refund (Partial or Full)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artwork / Proof Zoom Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold font-mono">Artwork &amp; Soft Proof Preview Zoom</span>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
              <img
                src={previewModalUrl}
                alt="Enlarged Artwork Proof"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end gap-2">
              <a
                href={previewModalUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} /> Download Original File
              </a>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Refund Modal */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <RotateCcw size={16} />
                <span>Issue Razorpay Refund</span>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Initiate an automated refund via Razorpay for Order <strong className="font-mono text-slate-900">#{selectedOrder.orderNumber}</strong>.
              </p>
              <p className="text-[11px] text-slate-500">
                Order Total: <strong className="text-slate-900 font-mono">₹{formatPrice(selectedOrder.total)}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Refund Amount (₹) <span className="text-slate-400 font-normal">(Leave blank for full amount)</span>
                </label>
                <input
                  type="number"
                  placeholder={`Full amount: ${selectedOrder.total}`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                  Reason for Refund <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Customer cancelled before proofing, quality defect, double charged"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueRefund}
                disabled={isSubmittingRefund || !refundReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmittingRefund ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Confirm &amp; Refund</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Customer Order</h3>
                  <p className="text-xs text-slate-500">Record a walk-in, phone, or WhatsApp job with live syncing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateOrderSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Customer Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Phone size={13} className="text-blue-500" />
                  <span>Customer Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, customerName: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Phone / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={newOrderForm.customerPhone}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. customer@gmail.com"
                      value={newOrderForm.customerEmail}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-500" />
                  <span>Delivery Address</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Address / Counter Pickup
                    </label>
                    <input
                      type="text"
                      value={newOrderForm.addressLine1}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      value={newOrderForm.city}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      value={newOrderForm.state}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={newOrderForm.pincode}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, pincode: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Package size={13} className="text-indigo-500" />
                    <span>Order Items</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]"
                    >
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 sm:hidden">
                          Product Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Product Name (e.g. Flex Banner 10x4)"
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          className="w-full h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                        />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 sm:hidden">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623] text-center"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5 sm:hidden">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2.5 rounded-lg border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623] text-right"
                        />
                      </div>
                      <div className="w-24 text-right font-bold text-xs text-slate-900 self-center px-1">
                        ₹{(Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={orderItems.length <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer self-center"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Order Status */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard size={13} className="text-amber-500" />
                  <span>Payment &amp; Fulfillment</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Payment Method</label>
                    <select
                      value={newOrderForm.paymentMethod}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    >
                      <option value="CASH">Cash Counter</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="PAY_AFTER_PROOF">Pay After Proof Approval</option>
                      <option value="ONLINE">Online (Prepaid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Payment Status</label>
                    <select
                      value={newOrderForm.paymentStatus}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    >
                      <option value="PAID">PAID</option>
                      <option value="UNPAID">UNPAID (Pending)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Production Status</label>
                    <select
                      value={newOrderForm.orderStatus}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, orderStatus: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    >
                      <option value="CONFIRMED">Confirmed / Processing</option>
                      <option value="PENDING">Pending Artwork</option>
                      <option value="IN_PRODUCTION">In Production / Printing</option>
                      <option value="DISPATCHED">Dispatched / Out for Delivery</option>
                      <option value="DELIVERED">Delivered / Handed Over</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Shipping Fee (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newOrderForm.shippingFee}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, shippingFee: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={newOrderForm.discountAmount}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, discountAmount: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Internal Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Urgent morning pickup"
                      value={newOrderForm.notes}
                      onChange={(e) => setNewOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-slate-900 focus:outline-none focus:border-[#F5A623]"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-3.5 rounded-xl border border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
                <div className="space-y-0.5 text-xs text-slate-600">
                  <div>Subtotal: ₹{calculateSubtotal()}</div>
                  {Number(newOrderForm.shippingFee) > 0 && <div>Shipping: +₹{newOrderForm.shippingFee}</div>}
                  {Number(newOrderForm.discountAmount) > 0 && <div>Discount: -₹{newOrderForm.discountAmount}</div>}
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total Amount</div>
                  <div className="text-xl font-black text-slate-900">₹{calculateTotal()}</div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-5 py-2 rounded-xl bg-[#111827] hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmittingOrder ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Confirm &amp; Create Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
