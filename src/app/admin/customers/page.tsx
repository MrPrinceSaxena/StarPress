'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, X, Mail, Phone, ShoppingCart, IndianRupee, ExternalLink } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import Pagination from '@/components/admin/ui/Pagination';
import EmptyState from '@/components/admin/ui/EmptyState';
import { customerService } from '@/lib/admin/services';
import type { AdminCustomer } from '@/lib/admin/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await customerService.getCustomers(search, page, 10);
      setCustomers(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
    }
    load();
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Customers</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">Manage your customer base and track client engagement.</p>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-3.5 sm:p-4 border-b border-[#E5E7EB]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers…"
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
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A623] font-bold text-xs shadow-xs">
                          {c.name.charAt(0)}
                        </div>
                        <Link
                          href={`/admin/customers/${encodeURIComponent(c.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#F5A623] group-hover:underline transition-colors"
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{c.email}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 font-semibold">{c.totalOrders}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 font-bold font-mono">₹{formatPrice(c.totalSpent)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E5E7EB] flex items-center justify-between">
            <Pagination page={page} totalPages={totalPages} total={total} pageSize={10} onPageChange={setPage} />
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
                <h2 className="text-sm font-bold text-slate-900">{selected.name}</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/customers/${encodeURIComponent(selected.id)}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F5A623] hover:bg-[#E09612] text-slate-950 transition-colors shadow-sm"
                  >
                    <ExternalLink size={13} />
                    Full Profile & LTV
                  </Link>
                  <button onClick={() => setSelected(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#F5A623] font-bold text-2xl shadow-xs">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{selected.name}</p>
                    <div className="mt-1">
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" /> {selected.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-mono">
                    <Phone size={14} className="text-slate-400" /> {selected.phone || 'No phone recorded'}
                  </div>
                </div>
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
                <div>
                  <p className="text-[11px] text-slate-400">
                    Customer registered {new Date(selected.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
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
