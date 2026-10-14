'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Banknote,
  ReceiptText,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Activity,
  History,
  CheckCircle2,
  XCircle,
  CreditCard,
  Search,
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import StatCard from '@/components/admin/ui/StatCard';
import type { FinanceSummary, FinanceTransaction } from '@/lib/admin/types';

interface PaymentHealth {
  unpaidStaleCount: number;
  disputedCount: number;
  refundFlaggedCount: number;
}

interface GatewayTx {
  id: string;
  orderId: string;
  gatewayPaymentId: string | null;
  method: string | null;
  amount: number;
  currency: string;
  status: string;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  cardLast4: string | null;
  cardNetwork: string | null;
  refundId: string | null;
  refundStatus: string | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    guestName: string | null;
    totalAmount: number;
  };
}

interface RefundQueueItem {
  id: string;
  orderId: string;
  gatewayPaymentId: string | null;
  amount: number;
  status: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    guestName: string | null;
    totalAmount: number;
    paymentId: string | null;
  };
}

interface AuditLogItem {
  id: string;
  orderId: string | null;
  action: string;
  actor: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface RefundAlert {
  id: string;
  orderNumber: string;
  refundFlag: string;
}

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [paymentHealth, setPaymentHealth] = useState<PaymentHealth>({
    unpaidStaleCount: 0,
    disputedCount: 0,
    refundFlaggedCount: 0,
  });
  const [gatewayTxs, setGatewayTxs] = useState<GatewayTx[]>([]);
  const [refundQueue, setRefundQueue] = useState<RefundQueueItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [refundAlerts, setRefundAlerts] = useState<RefundAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'gateway' | 'refunds' | 'audit'>('overview');
  const [auditSearch, setAuditSearch] = useState('');
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);
  const [refundNotification, setRefundNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFinanceData = async () => {
    try {
      const res = await fetch('/api/admin/finances');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setTransactions(data.transactions || []);
        if (data.paymentHealth) setPaymentHealth(data.paymentHealth);
        if (data.paymentTransactions) setGatewayTxs(data.paymentTransactions);
        if (data.refundQueue) setRefundQueue(data.refundQueue);
        if (data.recentAuditLogs) setAuditLogs(data.recentAuditLogs);
        if (data.refundAlerts) setRefundAlerts(data.refundAlerts);
      }
    } catch (e) {
      console.error('Failed to load finance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleProcessRefund = async (item: RefundQueueItem) => {
    if (!item.order?.id) return;
    setProcessingRefundId(item.id);
    setRefundNotification(null);

    try {
      const res = await fetch(`/api/admin/orders/${item.order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(item.amount),
          reason: 'Duplicate payment auto-refund approved by admin',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process refund.');
      }

      setRefundNotification({
        type: 'success',
        message: `Refund of ₹${item.amount} initiated successfully for Order #${item.order.orderNumber}.`,
      });

      // Refresh list
      fetchFinanceData();
    } catch (err: any) {
      setRefundNotification({
        type: 'error',
        message: err.message || 'Refund processing failed.',
      });
    } finally {
      setProcessingRefundId(null);
    }
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(Math.abs(n));

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.actor && log.actor.toLowerCase().includes(term)) ||
      (log.orderId && log.orderId.toLowerCase().includes(term))
    );
  });

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Payment Health &amp; Finances</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Real-time gateway transactions, automated refunds, and payment security monitoring.
        </p>
      </div>

      {/* Payment Health Alert Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${paymentHealth.unpaidStaleCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{paymentHealth.unpaidStaleCount} Orders</div>
            <div className="text-xs text-slate-500">Unpaid &gt; 1h (Expiry Pending)</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${paymentHealth.disputedCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{paymentHealth.disputedCount} Disputed</div>
            <div className="text-xs text-slate-500">Bank Chargebacks / Tampering</div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${paymentHealth.refundFlaggedCount > 0 ? 'bg-purple-50 border-purple-200' : 'bg-white border-[#E5E7EB]'}`}>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <RotateCcw size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{paymentHealth.refundFlaggedCount} Flagged</div>
            <div className="text-xs text-slate-500">Duplicate Payments in Refund Queue</div>
          </div>
        </div>
      </div>

      {refundAlerts.length > 0 && (
        <section className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4" aria-label="Refund accounting alerts">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-800">
            <ShieldAlert size={17} /> Over-refund accounting alerts ({refundAlerts.length})
          </h2>
          <ul className="space-y-1">
            {refundAlerts.map((alert) => (
              <li key={alert.id} className="text-xs text-rose-700">
                Order {alert.orderNumber}: {alert.refundFlag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <StatCard icon={TrendingUp} title="Total Revenue" value={`₹${formatPrice(summary.totalRevenue)}`} iconColor="text-emerald-500" />
        <StatCard icon={DollarSign} title="Net Sales" value={`₹${formatPrice(summary.netSales)}`} iconColor="text-blue-500" />
        <StatCard icon={ReceiptText} title="Refunds" value={`₹${formatPrice(summary.totalRefunds)}`} iconColor="text-rose-500" />
        <StatCard icon={Banknote} title="Tax Collected" value={`₹${formatPrice(summary.totalTax)}`} iconColor="text-amber-500" />
        <StatCard icon={ArrowUpRight} title="Payouts" value={`₹${formatPrice(summary.totalPayouts)}`} iconColor="text-cyan-500" />
        <StatCard icon={ArrowDownRight} title="Pending" value={`₹${formatPrice(summary.pendingPayouts)}`} iconColor="text-orange-500" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E5E7EB] gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#F5A623] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign size={16} className={activeTab === 'overview' ? 'text-[#F5A623]' : ''} />
          <span>Accounting Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'gateway'
              ? 'border-[#F5A623] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard size={16} className={activeTab === 'gateway' ? 'text-[#F5A623]' : ''} />
          <span>Razorpay Transactions ({gatewayTxs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'refunds'
              ? 'border-[#F5A623] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw size={16} className={activeTab === 'refunds' ? 'text-[#F5A623]' : ''} />
          <span>Refund Queue ({refundQueue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold tracking-tight border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-[#F5A623] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={16} className={activeTab === 'audit' ? 'text-[#F5A623]' : ''} />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Notifications */}
      {refundNotification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            refundNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{refundNotification.message}</span>
          <button
            type="button"
            onClick={() => setRefundNotification(null)}
            className="text-slate-700 font-semibold hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW LEDGER */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Sales &amp; Refunds Ledger</h2>
            <span className="text-xs text-slate-500">{transactions.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        txn.type === 'sale'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : txn.type === 'refund'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 max-w-xs truncate font-medium">{txn.description}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{txn.reference}</td>
                    <td className={`px-4 py-3 font-mono font-bold text-right ${txn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {txn.amount >= 0 ? '+' : '−'}₹{formatPrice(txn.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status === 'completed' ? 'completed' : 'pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GATEWAY TRANSACTIONS */}
      {activeTab === 'gateway' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Live Razorpay Payment Transactions</h2>
            <span className="text-xs text-slate-500">Last 50 captured/failed gateway events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Method / Details</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Gateway Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {gatewayTxs.map((gtx) => (
                  <tr key={gtx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(gtx.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-900 font-semibold select-all">
                      {gtx.gatewayPaymentId || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#F5A623]">
                      {gtx.order?.orderNumber || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize font-semibold text-slate-900">{gtx.method || 'online'}</span>
                        {gtx.cardNetwork && <span className="text-[10px] text-slate-400">({gtx.cardNetwork} ••{gtx.cardLast4})</span>}
                        {gtx.vpa && <span className="text-[10px] text-slate-400">({gtx.vpa})</span>}
                        {gtx.bank && <span className="text-[10px] text-slate-400">({gtx.bank})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-right text-slate-900">
                      ₹{formatPrice(Number(gtx.amount))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        gtx.status === 'CAPTURED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : gtx.status === 'REFUND_FLAGGED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : gtx.status === 'REFUND_PROCESSED' || gtx.status === 'REFUNDED'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {gtx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REFUND QUEUE */}
      {activeTab === 'refunds' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pending Automated Refund Queue</h2>
              <p className="text-xs text-slate-500">
                Payments flagged due to duplicate checkout attempts or multi-tab orders. These are refunded automatically every 4 hours or instantly below.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {refundQueue.length} Pending Actions
            </span>
          </div>

          {refundQueue.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Refund Queue is Clear</h3>
              <p className="text-xs text-slate-500">No duplicate transactions or pending refund flags detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {refundQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Order #{item.order?.orderNumber || 'Unknown'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        DUPLICATE PAYMENT
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4">
                      <span>Gateway ID: <strong className="font-mono text-slate-900">{item.gatewayPaymentId}</strong></span>
                      <span>Initial Paid ID: <strong className="font-mono text-slate-900">{item.order?.paymentId || 'N/A'}</strong></span>
                      <span>Amount: <strong className="text-slate-900 font-mono">₹{formatPrice(Number(item.amount))}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleProcessRefund(item)}
                    disabled={processingRefundId === item.id}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                  >
                    {processingRefundId === item.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Initiating Refund...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw size={14} />
                        <span>Issue Instant Refund</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
            <div>
              <h2 className="text-base font-bold text-slate-900">PCI-DSS Payment Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all HMAC verifications, gateway requests, and webhook lifecycle events.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search action or order..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#F5A623]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Actor / Source</th>
                  <th className="px-4 py-2.5">IP Address</th>
                  <th className="px-4 py-2.5">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                        log.action.includes('SUCCESS') || log.action.includes('CAPTURED') || log.action.includes('VERIFIED')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.action.includes('FAILED') || log.action.includes('DISPUTED') || log.action.includes('MISMATCH')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 font-mono font-medium">{log.actor || 'SYSTEM'}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono">{log.ipAddress || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono max-w-xs truncate select-all">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
