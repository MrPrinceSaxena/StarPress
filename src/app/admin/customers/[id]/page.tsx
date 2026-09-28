'use client';

// =============================================================================
// /admin/customers/[id] — Full Customer Profile & Lifetime Value (LTV) Page
// Features: Customer metrics, full order history, GST & addresses, staff notes, 1-click WhatsApp
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, ShoppingCart, IndianRupee,
  Calendar, MapPin, Building2, FileText, ExternalLink,
  Save, Loader2, MessageCircle, AlertCircle, Copy, Check,
  Clock, Package, ShieldCheck
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { showToast } from '@/components/admin/ui/Toast';
import { buildWhatsAppClickUrl } from '@/lib/notifications/order-messages';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`);
      const data = await res.json();
      if (data.success && data.customer) {
        setCustomer(data.customer);
        setNotes(data.customer.internalNotes || '');
      } else {
        showToast(data.error || 'Customer not found', 'error');
      }
    } catch {
      showToast('Failed to load customer profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Customer notes saved', 'success');
      } else {
        showToast(data.error || 'Failed to save notes', 'error');
      }
    } catch {
      showToast('Error saving notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    showToast(`${fieldName} copied to clipboard`, 'info');
  };

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-text-muted gap-3">
        <Loader2 size={32} className="animate-spin text-brand-yellow" />
        <p className="text-sm">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-400" />
        <h2 className="text-xl font-bold text-white">Customer Not Found</h2>
        <p className="text-sm text-text-muted">
          Could not locate customer records matching this identifier.
        </p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.1] text-xs font-semibold"
        >
          <ArrowLeft size={14} /> Back to Customers
        </Link>
      </div>
    );
  }

  // Generate general WhatsApp greeting link
  const whatsappUrl = customer.phone
    ? buildWhatsAppClickUrl(
        customer.phone,
        `Hello ${customer.name}, greetings from StarPress Print Studio!`
      )
    : null;

  return (
    <div className="max-w-[1320px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] border border-border-subtle transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">{customer.name}</h1>
              {customer.isRegistered ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={12} /> Registered Account
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-text-muted bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                  Guest Buyer
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1">
              Customer since{' '}
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString('en-IN', {
                    dateStyle: 'medium',
                  })
                : 'Recent'}
            </p>
          </div>
        </div>

        {/* Quick Contact Actions */}
        <div className="flex items-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#25D366] text-black hover:bg-[#20bd5a] transition-colors shadow-sm"
            >
              <MessageCircle size={15} />
              Chat on WhatsApp
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors"
            >
              <Mail size={14} />
              Send Email
            </a>
          )}
        </div>
      </div>

      {/* Metric Cards (LTV, Orders, AOV) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Lifetime Value (LTV)</p>
            <p className="text-2xl font-bold text-brand-yellow mt-1">
              ₹{formatPrice(customer.metrics.totalSpent)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
            <IndianRupee size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-1">{customer.metrics.totalOrders}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ShoppingCart size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Avg Order Value (AOV)</p>
            <p className="text-2xl font-bold text-white mt-1">
              ₹{formatPrice(customer.metrics.averageOrderValue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Package size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Last Order</p>
            <p className="text-sm font-semibold text-white mt-1">
              {customer.metrics.lastOrderDate
                ? new Date(customer.metrics.lastOrderDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'No orders yet'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Orders & Notes | Right Details & Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History Table */}
          <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShoppingCart size={16} className="text-brand-yellow" />
                Order History ({customer.orders.length})
              </h3>
              <span className="text-xs text-text-muted font-mono">
                Lifetime Total: ₹{formatPrice(customer.metrics.totalSpent)}
              </span>
            </div>

            {customer.orders.length === 0 ? (
              <div className="py-16 text-center text-text-muted text-sm">
                No orders found for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-white/[0.02] text-xs font-semibold text-text-muted uppercase tracking-wider">
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Fulfillment</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle text-sm">
                    {customer.orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-brand-yellow">
                          <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-muted">
                          {new Date(o.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">{o.itemCount} pcs</td>
                        <td className="py-3 px-4 text-xs font-semibold text-white">
                          ₹{formatPrice(o.total)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                              o.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors inline-block"
                            title="View Order"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Internal Staff Notes */}
          <div className="bg-card border border-border-subtle rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText size={16} className="text-brand-yellow" />
                Staff Notes & Client Preferences
              </h3>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50"
              >
                {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Notes
              </button>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Visible only to StarPress administrators. Record paper finish preferences, bulk price concessions, or GST invoicing notes.
            </p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular client for Visiting Cards. Prefers 350 GSM Velvet Lamination. Send invoices with PO numbers directly to accounts."
              className="w-full bg-white/[0.04] border border-border-subtle rounded-lg p-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-card border border-border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User size={16} className="text-brand-yellow" />
              Contact Information
            </h3>

            <div className="space-y-3 text-xs">
              {customer.email ? (
                <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-lg border border-border-subtle">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-text-muted shrink-0" />
                    <span className="text-text-secondary truncate">{customer.email}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(customer.email, 'Email')}
                    className="p-1 text-text-muted hover:text-white"
                    title="Copy email"
                  >
                    {copiedField === 'Email' ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-text-muted italic">No email address on file</p>
              )}

              {customer.phone ? (
                <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-lg border border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-text-muted shrink-0" />
                    <span className="text-text-secondary font-mono">{customer.phone}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(customer.phone, 'Phone')}
                    className="p-1 text-text-muted hover:text-white"
                    title="Copy phone"
                  >
                    {copiedField === 'Phone' ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-text-muted italic">No phone number on file</p>
              )}
            </div>
          </div>

          {/* Addresses & GST Information Card */}
          <div className="bg-card border border-border-subtle rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin size={16} className="text-brand-yellow" />
              Addresses & GST Details
            </h3>

            {customer.addresses.length === 0 ? (
              <p className="text-xs text-text-muted italic">No addresses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-secondary uppercase text-[10px] tracking-wider">
                        {addr.type}
                      </span>
                      {addr.gstin && (
                        <span className="text-[10px] font-mono text-brand-yellow font-bold bg-brand-yellow/10 px-1.5 py-0.5 rounded">
                          GSTIN: {addr.gstin}
                        </span>
                      )}
                    </div>

                    {addr.companyName && (
                      <p className="font-medium text-white flex items-center gap-1.5">
                        <Building2 size={13} className="text-text-muted" />
                        {addr.companyName}
                      </p>
                    )}

                    <p className="text-text-muted leading-relaxed">
                      {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
