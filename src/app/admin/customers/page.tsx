'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, X, Mail, Phone, ShoppingCart, IndianRupee } from 'lucide-react';
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
    <div className="max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Customers</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your customer base and track engagement.</p>
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        <div className="flex items-center gap-3 p-3 border-b border-border-subtle">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-yellow/30 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-white"><X size={14} /></button>}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Email</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Orders</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Spent</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Last Order</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow font-bold text-xs">{c.name.charAt(0)}</div>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{c.email}</td>
                    <td className="px-4 py-3 text-xs text-white font-medium">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-xs text-white font-medium">₹{formatPrice(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && <div className="px-3 border-t border-border-subtle"><Pagination page={page} totalPages={totalPages} total={total} pageSize={10} onPageChange={setPage} /></div>}
      </div>

      {/* Customer Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-bg-surface border-l border-border-subtle shadow-elevation-md overflow-y-auto animate-fadeIn">
            <div className="sticky top-0 bg-bg-surface border-b border-border-subtle p-5 flex items-center justify-between z-10">
              <h2 className="text-sm font-bold text-white">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06]"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow font-bold text-xl">{selected.name.charAt(0)}</div>
                <div><p className="text-sm font-bold text-white">{selected.name}</p><StatusBadge status={selected.status} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Mail size={13} /> {selected.email}</div>
                <div className="flex items-center gap-2 text-xs text-text-secondary"><Phone size={13} /> {selected.phone}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle"><p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Orders</p><p className="text-lg font-bold text-white mt-1">{selected.totalOrders}</p></div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle"><p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Total Spent</p><p className="text-lg font-bold text-white mt-1">₹{formatPrice(selected.totalSpent)}</p></div>
              </div>
              <div><h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Address</h3><p className="text-xs text-text-secondary">{selected.address}</p></div>
              <div><p className="text-[11px] text-text-muted">Customer since {new Date(selected.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
