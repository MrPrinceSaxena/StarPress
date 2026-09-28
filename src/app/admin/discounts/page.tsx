'use client';

// =============================================================================
// /admin/discounts — Promotional Discounts & Coupon Management for StarPress
// Features: List, Create, Edit, Toggle status, Delete, Usage tracking
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PercentCircle, Plus, Copy, Trash2, Edit3, Check,
  Search, Calendar, ArrowRight, ShieldCheck, X,
  Loader2, Tag, AlertCircle, RefreshCw
} from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import EmptyState from '@/components/admin/ui/EmptyState';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { showToast } from '@/components/admin/ui/Toast';
import { discountService } from '@/lib/admin/services';
import type { AdminDiscount } from '@/lib/admin/types';

interface DiscountFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  minOrderAmount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const INITIAL_FORM: DiscountFormData = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderAmount: '',
  usageLimit: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  isActive: true,
};

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<AdminDiscount | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminDiscount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await discountService.getDiscounts();
      setDiscounts(data);
    } catch {
      showToast('Failed to load discounts', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  // Filtered
  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      const matchesSearch =
        d.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true : d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [discounts, search, statusFilter]);

  // Stats
  const activeCount = useMemo(() => discounts.filter((d) => d.status === 'active').length, [discounts]);
  const totalUses = useMemo(() => discounts.reduce((sum, d) => sum + (d.usageCount || 0), 0), [discounts]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingDiscount(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (d: AdminDiscount) => {
    setEditingDiscount(d);
    setFormData({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : '',
      usageLimit: d.usageLimit ? String(d.usageLimit) : '',
      startDate: d.startDate ? d.startDate.split('T')[0] : '',
      endDate: d.endDate ? d.endDate.split('T')[0] : '',
      isActive: d.status === 'active',
    });
    setIsModalOpen(true);
  };

  // Toggle Active/Disabled
  const handleToggleStatus = async (d: AdminDiscount) => {
    const nextStatus = d.status === 'active' ? 'disabled' : 'active';
    try {
      await discountService.updateDiscount(d.id, { isActive: nextStatus === 'active' });
      setDiscounts((prev) =>
        prev.map((item) => (item.id === d.id ? { ...item, status: nextStatus } : item))
      );
      showToast(`Coupon "${d.code}" is now ${nextStatus}`, 'success');
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      showToast('Please enter a valid discount value', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        isActive: formData.isActive,
      };

      if (editingDiscount) {
        const updated = await discountService.updateDiscount(editingDiscount.id, payload);
        setDiscounts((prev) =>
          prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
        );
        showToast(`Coupon "${updated.code}" updated successfully`, 'success');
      } else {
        const created = await discountService.createDiscount(payload);
        setDiscounts((prev) => [created, ...prev]);
        showToast(`Coupon "${created.code}" created successfully`, 'success');
      }

      setIsModalOpen(false);
      setEditingDiscount(null);
      setFormData(INITIAL_FORM);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save discount', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const ok = await discountService.deleteDiscount(deleteTarget.id);
      if (ok) {
        setDiscounts((prev) => prev.filter((d) => d.id !== deleteTarget.id));
        showToast(`Coupon "${deleteTarget.code}" deleted`, 'success');
      } else {
        showToast('Failed to delete discount', 'error');
      }
    } catch {
      showToast('Error deleting coupon', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`"${code}" copied to clipboard`, 'info');
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Discounts & Coupons</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Manage promotional coupon codes, percentage discounts, and order offers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDiscounts()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-border-subtle transition-colors disabled:opacity-50"
            title="Refresh discounts"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm"
          >
            <Plus size={15} />
            Create Coupon
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">Total Discount Codes</p>
            <p className="text-2xl font-bold text-white mt-1">{discounts.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
            <Tag size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">Active Promotions</p>
            <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted font-medium">Redemptions / Usages</p>
            <p className="text-2xl font-bold text-white mt-1">{totalUses}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <PercentCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card border border-border-subtle rounded-xl p-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search coupon codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'expired', 'disabled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-brand-yellow text-black font-semibold'
                  : 'bg-white/[0.04] text-text-muted hover:text-white border border-border-subtle'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border-subtle rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-text-muted gap-3">
            <Loader2 size={32} className="animate-spin text-brand-yellow" />
            <p className="text-sm">Loading discount codes...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <EmptyState
            title={search ? 'No matching discounts' : 'No discount codes created'}
            description={
              search
                ? `No coupon found matching "${search}".`
                : 'Create your first promotional discount coupon code for your customers.'
            }
            action={
              <button
                onClick={search ? () => setSearch('') : handleOpenCreate}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
              >
                {search ? 'Clear Search' : 'Create Coupon'}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-white/[0.02] text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {filteredDiscounts.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCode(d.code)}
                          className="font-mono text-sm font-bold text-brand-yellow hover:underline flex items-center gap-1.5"
                          title="Click to copy code"
                        >
                          {d.code}
                          <Copy size={12} className="opacity-50" />
                        </button>
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td className="py-3 px-4 font-semibold text-white">
                      {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} FLAT`}
                    </td>

                    {/* Min Order */}
                    <td className="py-3 px-4 text-xs text-text-secondary">
                      {d.minOrderAmount ? `₹${new Intl.NumberFormat('en-IN').format(d.minOrderAmount)}` : 'No minimum'}
                    </td>

                    {/* Usage */}
                    <td className="py-3 px-4 text-xs text-text-secondary">
                      <span>{d.usageCount}</span>
                      {d.usageLimit ? (
                        <span className="text-text-muted"> / {d.usageLimit}</span>
                      ) : (
                        <span className="text-text-muted"> / ∞</span>
                      )}
                      {d.usageLimit && (
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1.5 w-20">
                          <div
                            className="h-full rounded-full bg-brand-yellow"
                            style={{ width: `${Math.min((d.usageCount / d.usageLimit) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Validity */}
                    <td className="py-3 px-4 text-xs text-text-muted">
                      {d.startDate ? new Date(d.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Now'}
                      {' → '}
                      {d.endDate ? new Date(d.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Expiry'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(d)}
                          className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                            d.status === 'active'
                              ? 'text-amber-400 hover:bg-amber-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={d.status === 'active' ? 'Disable coupon' : 'Enable coupon'}
                        >
                          {d.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(d)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand-yellow hover:bg-white/[0.06] transition-colors"
                          title="Edit coupon"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                          title="Delete coupon"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F1420] border border-border-subtle rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                  <Tag size={16} />
                </div>
                <h2 className="text-base font-semibold text-white">
                  {editingDiscount ? `Edit Coupon "${editingDiscount.code}"` : 'Create New Discount Coupon'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Coupon Code <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10, DIWALI2026, FESTIVE50"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                    }))
                  }
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 font-mono tracking-wider"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as 'percentage' | 'fixed',
                      }))
                    }
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-yellow/50 cursor-pointer"
                  >
                    <option value="percentage" className="bg-[#0F1420]">Percentage (%)</option>
                    <option value="fixed" className="bg-[#0F1420]">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Discount Value <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder={formData.type === 'percentage' ? '15' : '200'}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, value: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50 font-semibold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-muted select-none font-bold">
                      {formData.type === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Order & Max Uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500 (optional)"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minOrderAmount: e.target.value }))
                    }
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 (optional)"
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full bg-white/[0.04] border border-border-subtle rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-brand-yellow focus:ring-0 focus:ring-offset-0 bg-white/[0.04] border-border-subtle cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-white cursor-pointer select-none font-medium">
                  Coupon is active and ready to be redeemed at checkout
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingDiscount ? (
                    'Save Changes'
                  ) : (
                    'Create Coupon'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete Coupon "${deleteTarget?.code}"?`}
        message="Are you sure you want to delete this coupon? Customers will no longer be able to redeem it at checkout."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete Coupon'}
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
