'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  X,
  Mail,
  Phone,
  ShoppingCart,
  IndianRupee,
  ExternalLink,
  RefreshCw,
  UserCheck,
  UserPlus,
  Shield,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import EmptyState from '@/components/admin/ui/EmptyState';
import { customerService } from '@/lib/admin/services';
import type { AdminCustomer } from '@/lib/admin/types';
import { showToast } from '@/components/admin/ui/Toast';

type FilterTab = 'all' | 'with_orders' | 'no_orders';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<{ total: number; withOrders: number; noOrders: number }>({
    total: 0,
    withOrders: 0,
    noOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const loadCustomers = useCallback(async (isManualSync = false) => {
    if (isManualSync) setSyncing(true);
    else setLoading(true);

    try {
      const result = await customerService.getCustomers(search, page, 25, activeFilter);
      setCustomers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (result.stats) {
        setStats(result.stats);
      }
      if (isManualSync) {
        showToast('Synced all Supabase accounts successfully!', 'success');
      }
    } catch {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [search, page, activeFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight flex items-center gap-2.5">
            <span>Customers</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {stats.total || total} Accounts
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Real-time synced customer accounts from Supabase Auth &amp; Storefront orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadCustomers(true)}
          disabled={syncing || loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E7EB] hover:bg-slate-50 text-slate-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Force-sync all Supabase Auth users to database"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin text-[#F5A623]' : ''} />
          <span>{syncing ? 'Syncing Supabase…' : 'Sync Supabase Users'}</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-amber-50/70 border-[#F5A623] ring-1 ring-[#F5A623]/20 shadow-xs'
              : 'bg-white border-[#E5E7EB] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">All Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-[#F5A623] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{stats.total || total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total registered in store &amp; Supabase</p>
        </div>

        <div
          onClick={() => setActiveFilter('with_orders')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'with_orders'
              ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-[#E5E7EB] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">With Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{stats.withOrders}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Purchased customers with order history</p>
        </div>

        <div
          onClick={() => setActiveFilter('no_orders')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'no_orders'
              ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
              : 'bg-white border-[#E5E7EB] hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-600 flex items-center justify-center">
              <UserPlus size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{stats.noOrders}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Signed up accounts awaiting first order</p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 border-b border-[#E5E7EB]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F5A623] transition-colors"
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

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({stats.total || total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('with_orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'with_orders'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              With Orders ({stats.withOrders})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('no_orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeFilter === 'no_orders'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              New Leads ({stats.noOrders})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Account Type</th>
                  <th className="px-4 py-3.5">Orders</th>
                  <th className="px-4 py-3.5">Total Spent</th>
                  <th className="px-4 py-3.5">Last Order</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs text-slate-700">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelected(c)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A623] font-bold text-xs shadow-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#F5A623] transition-colors truncate">
                              {c.name}
                            </span>
                            {c.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                ADMIN
                              </span>
                            )}
                          </div>
                          {c.phone && <span className="text-[10px] text-slate-400 font-mono block">{c.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{c.email}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {c.role === 'ADMIN' ? (
                        <span className="font-semibold text-purple-700">Administrator</span>
                      ) : c.role === 'GUEST' ? (
                        <span className="text-slate-500">Guest Checkout</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Supabase Auth</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 font-semibold">
                      {c.totalOrders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold">{c.totalOrders}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 font-bold font-mono">
                      {c.totalSpent > 0 ? `₹${formatPrice(c.totalSpent)}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {c.totalOrders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Purchased
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Registered
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E5E7EB] flex items-center justify-between">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={25} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white border-l border-[#E5E7EB] shadow-2xl overflow-y-auto animate-fadeIn flex flex-col justify-between">
            <div>
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] p-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{selected.name}</h2>
                  {selected.role === 'ADMIN' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/customers/${encodeURIComponent(selected.id)}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-colors shadow-sm"
                  >
                    <ExternalLink size={13} />
                    Full Profile
                  </Link>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A623] font-bold text-2xl shadow-xs">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{selected.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{selected.email}</p>
                    <div className="mt-1">
                      {selected.totalOrders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Buyer ({selected.totalOrders} {selected.totalOrders === 1 ? 'order' : 'orders'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Registered User (No orders yet)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{selected.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{selected.phone || 'No phone recorded'}</span>
                  </div>
                </div>

                {/* Direct Contact Actions */}
                {selected.phone && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hello ${selected.name}, greetings from StarPress Printing! How can we assist you today?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Customer</span>
                    </a>
                    <a
                      href={`tel:${selected.phone}`}
                      className="px-3.5 h-9 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E7EB] text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Phone size={13} />
                      <span>Call</span>
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Orders</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{selected.totalOrders}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Spent</p>
                    <p className="text-xl font-bold text-slate-900 font-mono mt-1">₹{formatPrice(selected.totalSpent)}</p>
                  </div>
                </div>

                {selected.address && (
                  <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Address</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{selected.address}</p>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <p>
                    <strong>Registered Date:</strong>{' '}
                    {new Date(selected.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p>
                    <strong>Account ID:</strong> <span className="font-mono text-[10px]">{selected.id}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
