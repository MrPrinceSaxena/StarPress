'use client';

import React, { useState } from 'react';
import { Settings, Store, CreditCard, Truck, Bell, Shield, Users, Globe, Palette, Mail } from 'lucide-react';

const TABS = [
  { key: 'general', label: 'General', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'seo', label: 'SEO & Social', icon: Globe },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'email', label: 'Email Templates', icon: Mail },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  const inputClass = "w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow/30 transition-colors";

  return (
    <div className="max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Configure your Star Press admin panel and store settings.</p>
      </div>

      <div className="flex gap-6">
        {/* Vertical Tabs */}
        <div className="w-48 shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-bg-surface border border-border-subtle rounded-xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Store Details</h2>
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Store Name</label><input type="text" defaultValue="Star Press" className={inputClass} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Store Email</label><input type="email" defaultValue="hello@starpress.in" className={inputClass} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Store Phone</label><input type="text" defaultValue="+91 98765 43210" className={inputClass} /></div>
              <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Store Address</label><textarea defaultValue="42, Connaught Place, New Delhi 110001" rows={2} className={inputClass.replace('h-9', 'h-auto py-2')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Currency</label><select className={inputClass + ' cursor-pointer'}><option>INR (₹)</option><option>USD ($)</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-medium text-text-secondary">Timezone</label><select className={inputClass + ' cursor-pointer'}><option>Asia/Kolkata (IST)</option></select></div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border-subtle"><button className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors">Save Changes</button></div>
            </div>
          )}
          {activeTab !== 'general' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Settings size={32} className="text-text-muted mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">{TABS.find((t) => t.key === activeTab)?.label} Settings</h3>
              <p className="text-xs text-text-muted max-w-xs">This section is under development. Settings will be available in the next update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
