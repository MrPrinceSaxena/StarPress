'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Banknote, ReceiptText } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import StatCard from '@/components/admin/ui/StatCard';
import { financeService } from '@/lib/admin/services';
import type { FinanceSummary, FinanceTransaction } from '@/lib/admin/types';

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([financeService.getSummary(), financeService.getTransactions()]).then(([s, t]) => {
      setSummary(s);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(Math.abs(n));

  if (loading || !summary) return <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Finances</h1>
        <p className="text-sm text-text-muted mt-0.5">Revenue, payouts, taxes, and transaction history.</p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={TrendingUp} title="Total Revenue" value={`₹${formatPrice(summary.totalRevenue)}`} iconColor="text-emerald-400" />
        <StatCard icon={DollarSign} title="Net Sales" value={`₹${formatPrice(summary.netSales)}`} iconColor="text-blue-400" />
        <StatCard icon={ReceiptText} title="Refunds" value={`₹${formatPrice(summary.totalRefunds)}`} iconColor="text-rose-400" />
        <StatCard icon={Banknote} title="Tax Collected" value={`₹${formatPrice(summary.totalTax)}`} iconColor="text-amber-400" />
        <StatCard icon={ArrowUpRight} title="Payouts" value={`₹${formatPrice(summary.totalPayouts)}`} iconColor="text-cyan-400" />
        <StatCard icon={ArrowDownRight} title="Pending" value={`₹${formatPrice(summary.pendingPayouts)}`} iconColor="text-orange-400" />
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-xl">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border-subtle">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Description</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Reference</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-text-muted">Amount</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</th>
            </tr></thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-xs text-text-muted">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${txn.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' : txn.type === 'refund' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>{txn.type}</span></td>
                  <td className="px-4 py-3 text-xs text-text-secondary max-w-xs truncate">{txn.description}</td>
                  <td className="px-4 py-3 text-xs font-mono text-text-muted">{txn.reference}</td>
                  <td className={`px-4 py-3 text-xs font-medium text-right ${txn.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{txn.amount >= 0 ? '+' : '−'}₹{formatPrice(txn.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={txn.status === 'completed' ? 'completed' : 'pending'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
