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
      <div className="py-28 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 size={32} className="animate-spin text-[#F5A623]" />
        <p className="text-sm font-medium">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
        <AlertCircle size={48} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900">Customer Not Found</h2>
        <p className="text-sm text-slate-500">
          Could not locate customer records matching this identifier.
        </p>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
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
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
              {customer.isRegistered ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={13} /> Registered Account
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  Guest Buyer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
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
        <div className="flex items-center gap-2.5 flex-wrap">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-xs cursor-pointer"
            >
              <MessageCircle size={15} />
              Chat on WhatsApp
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E5E7EB] transition-colors shadow-2xs cursor-pointer"
            >
              <Mail size={14} />
              Send Email
            </a>
          )}
        </div>
      </div>

      {/* Metric Cards (LTV, Orders, AOV, Last Order) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lifetime Value (LTV)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{formatPrice(customer.metrics.totalSpent)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
            <IndianRupee size={20} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{customer.metrics.totalOrders}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <ShoppingCart size={20} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Order Value (AOV)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ₹{formatPrice(customer.metrics.averageOrderValue)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Package size={20} />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Last Order</p>
            <p className="text-sm font-bold text-slate-900 mt-1.5">
              {customer.metrics.lastOrderDate
                ? new Date(customer.metrics.lastOrderDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'No orders yet'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Orders & Notes | Right Details & Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart size={17} className="text-[#F5A623]" />
                Order History ({customer.orders.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Lifetime Total: ₹{formatPrice(customer.metrics.totalSpent)}
              </span>
            </div>

            {customer.orders.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm">
                No orders recorded for this customer yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4.5">Order #</th>
                      <th className="py-3.5 px-4.5">Date</th>
                      <th className="py-3.5 px-4.5">Items</th>
                      <th className="py-3.5 px-4.5">Total</th>
                      <th className="py-3.5 px-4.5">Fulfillment</th>
                      <th className="py-3.5 px-4.5">Payment</th>
                      <th className="py-3.5 px-4.5 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-sm">
                    {customer.orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4.5 font-mono text-xs font-bold text-blue-600">
                          <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4.5 text-xs text-slate-500 font-medium">
                          {new Date(o.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4.5 text-xs text-slate-700 font-medium">{o.itemCount} pcs</td>
                        <td className="py-3.5 px-4.5 text-xs font-bold text-slate-900">
                          ₹{formatPrice(o.total)}
                        </td>
                        <td className="py-3.5 px-4.5">
                          <StatusBadge status={o.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4.5">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              o.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4.5 text-right">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors inline-block"
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
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText size={17} className="text-[#F5A623]" />
                Staff Notes & Client Preferences
              </h3>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save Notes
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3.5">
              Visible only to StarPress administrators. Record paper finish preferences, bulk price concessions, or GST invoicing notes.
            </p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular client for Visiting Cards. Prefers 350 GSM Velvet Lamination. Send invoices with PO numbers directly to accounts."
              className="w-full bg-slate-50 border border-[#E5E7EB] rounded-xl p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623] transition-all resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User size={17} className="text-[#F5A623]" />
              Contact Information
            </h3>

            <div className="space-y-2.5 text-xs">
              {customer.email ? (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-2.5 truncate">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-medium truncate">{customer.email}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(customer.email, 'Email')}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copy email"
                  >
                    {copiedField === 'Email' ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 italic">No email address on file</p>
              )}

              {customer.phone ? (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <span className="text-slate-800 font-mono font-medium">{customer.phone}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(customer.phone, 'Phone')}
                    className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copy phone"
                  >
                    {copiedField === 'Phone' ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 italic">No phone number on file</p>
              )}
            </div>
          </div>

          {/* Addresses & GST Information Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin size={17} className="text-[#F5A623]" />
              Addresses & GST Details
            </h3>

            {customer.addresses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No addresses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((addr: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                        {addr.type || 'Shipping Address'}
                      </span>
                      {addr.gstin && (
                        <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          GSTIN: {addr.gstin}
                        </span>
                      )}
                    </div>

                    {addr.companyName && (
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        {addr.companyName}
                      </p>
                    )}

                    <p className="text-slate-600 leading-relaxed">
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
