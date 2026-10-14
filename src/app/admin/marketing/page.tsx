'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Edit3, TrendingUp, Users, MousePointer, IndianRupee } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import EmptyState from '@/components/admin/ui/EmptyState';
import { marketingService } from '@/lib/admin/services';
import type { MarketingCampaign } from '@/lib/admin/types';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketingService.getCampaigns().then((data) => {
      setCampaigns(data);
      setLoading(false);
    });
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Marketing</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage advertising campaigns, seasonal discounts, and customer outreach.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#F5A623] hover:bg-[#e0961e] text-black transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-3 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 shadow-sm">
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Create your first marketing promotion to boost your store revenue."
          />
        </div>
      ) : (
        <div className="grid gap-4.5">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white border border-[#E5E7EB] rounded-xl p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">{camp.name}</h3>
                    <StatusBadge
                      status={
                        camp.status === 'active'
                          ? 'active'
                          : camp.status === 'completed'
                          ? 'completed'
                          : camp.status === 'paused'
                          ? 'paused'
                          : 'draft'
                      }
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">
                    {camp.type} Promotion Campaign
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Allocated Budget</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">₹{formatPrice(camp.budget)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Impressions</span>
                    <Users size={14} className="text-slate-400" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{camp.reach.toLocaleString()}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Clicks</span>
                    <MousePointer size={14} className="text-blue-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{camp.clicks.toLocaleString()}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E5E7EB] shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Conversions</span>
                    <TrendingUp size={14} className="text-purple-500" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{camp.conversions}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">Attributed Revenue</span>
                    <IndianRupee size={14} className="text-emerald-700" />
                  </div>
                  <p className="text-lg font-bold text-emerald-800">₹{formatPrice(camp.revenue)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#E5E7EB] text-xs font-medium text-slate-500">
                <span>
                  {new Date(camp.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} —{' '}
                  {camp.endDate
                    ? new Date(camp.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Ongoing indefinitely'}
                </span>
                {camp.reach > 0 && (
                  <span className="text-slate-700 font-semibold font-mono">
                    CTR: {((camp.clicks / camp.reach) * 100).toFixed(1)}% · Conv. Rate: {((camp.conversions / camp.clicks) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
