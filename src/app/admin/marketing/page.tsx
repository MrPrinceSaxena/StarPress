'use client';

import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Edit3 } from 'lucide-react';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import EmptyState from '@/components/admin/ui/EmptyState';
import { marketingService } from '@/lib/admin/services';
import type { MarketingCampaign } from '@/lib/admin/types';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketingService.getCampaigns().then((data) => { setCampaigns(data); setLoading(false); });
  }, []);

  const formatPrice = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Marketing</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage campaigns, promotions, and customer outreach.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors shadow-sm">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" /></div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first marketing campaign" />
      ) : (
        <div className="grid gap-4">
          {campaigns.map((camp) => (
            <div key={camp.id} className="bg-bg-surface border border-border-subtle rounded-xl p-5 hover:border-border-strong transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{camp.name}</h3>
                    <StatusBadge status={camp.status === 'active' ? 'active' : camp.status === 'completed' ? 'completed' : camp.status === 'paused' ? 'paused' : 'draft'} />
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 capitalize">{camp.type} Campaign</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Budget</p>
                  <p className="text-sm font-medium text-white">₹{formatPrice(camp.budget)}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle/50">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Reach</p>
                  <p className="text-lg font-bold text-white mt-0.5">{camp.reach.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle/50">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Clicks</p>
                  <p className="text-lg font-bold text-white mt-0.5">{camp.clicks.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle/50">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Conversions</p>
                  <p className="text-lg font-bold text-white mt-0.5">{camp.conversions}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-border-subtle/50">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Revenue</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">₹{formatPrice(camp.revenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle/50">
                <span className="text-[11px] text-text-muted">
                  {new Date(camp.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {camp.endDate ? new Date(camp.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Ongoing'}
                </span>
                {camp.reach > 0 && (
                  <span className="text-[11px] text-text-muted ml-auto">
                    CTR: {((camp.clicks / camp.reach) * 100).toFixed(1)}% · Conv: {((camp.conversions / camp.clicks) * 100).toFixed(1)}%
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
