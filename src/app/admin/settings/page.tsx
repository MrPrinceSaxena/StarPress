'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Store, CreditCard, Truck, Bell, Shield, Users, Globe, Palette, Mail, Save, Loader2 } from 'lucide-react';
import { showToast } from '@/components/admin/ui/Toast';

const TABS = [
  { key: 'general', label: 'General', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings form state
  const [storeName, setStoreName] = useState('Star Press');
  const [storeEmail, setStoreEmail] = useState('starpress.print@gmail.com');
  const [storePhone, setStorePhone] = useState('+91 74568 49955');
  const [storeAddress, setStoreAddress] = useState('Amoun, Khatima (Uttarakhand)');
  const [currency, setCurrency] = useState('INR');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [gstin, setGstin] = useState('07AAAAA0000A1Z5');

  // Payments state
  const [codEnabled, setCodEnabled] = useState(true);
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_...');

  // Shipping state
  const [defaultCourier, setDefaultCourier] = useState('Shiprocket');
  const [flatShippingFee, setFlatShippingFee] = useState('99');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('999');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setStoreName(data.settings.storeName || 'Star Press');
            setStoreEmail(data.settings.storeEmail || 'starpress.print@gmail.com');
            setStorePhone(data.settings.storePhone || '+91 74568 49955');
            setStoreAddress(data.settings.storeAddress || 'Amoun, Khatima (Uttarakhand)');
            setCurrency(data.settings.currency || 'INR');
            setTimezone(data.settings.timezone || 'Asia/Kolkata');
            setGstin(data.settings.gstin || '07AAAAA0000A1Z5');
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          storeEmail,
          storePhone,
          storeAddress,
          currency,
          timezone,
          gstin,
        }),
      });

      if (res.ok) {
        showToast('Settings saved successfully');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-border-subtle text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-yellow/30 transition-colors';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Configure your Star Press store profile, payment gateways, and fulfillment rules.</p>
      </div>

      <div className="flex gap-6">
        {/* Vertical Tabs */}
        <div className="w-48 shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 bg-bg-surface border border-border-subtle rounded-xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Store Identity & Contact</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">Store Name</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Official Support Email</label>
                  <input type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Customer Hotline / WhatsApp</label>
                  <input type="text" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">Store / Factory Physical Address</label>
                <textarea
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  rows={2}
                  className={inputClass.replace('h-9', 'h-auto py-2 resize-none')}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass + ' cursor-pointer'}>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass + ' cursor-pointer'}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">GSTIN Tax Identifier</label>
                  <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border-subtle">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Payment Methods</h2>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">Razorpay Payment Gateway</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-text-secondary">Key ID</label>
                  <input
                    type="password"
                    value={razorpayKey}
                    onChange={(e) => setRazorpayKey(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-border-subtle flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Cash on Delivery (COD)</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Allow offline payment collection upon order delivery.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCodEnabled(!codEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    codEnabled ? 'bg-brand-yellow' : 'bg-white/[0.1]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out ${
                      codEnabled ? 'translate-x-4' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-4 border-t border-border-subtle">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
                >
                  <Save size={13} /> Save Payments
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Shipping & Logistics Rules</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Default Courier Partner</label>
                  <select
                    value={defaultCourier}
                    onChange={(e) => setDefaultCourier(e.target.value)}
                    className={inputClass + ' cursor-pointer'}
                  >
                    <option value="Shiprocket">Shiprocket (Automated Multi-Courier)</option>
                    <option value="BlueDart">BlueDart Express</option>
                    <option value="Delhivery">Delhivery Surface/Air</option>
                    <option value="DTDC">DTDC Courier</option>
                    <option value="India Post">India Post Speed Post</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Standard Flat Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={flatShippingFee}
                    onChange={(e) => setFlatShippingFee(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">Free Shipping Minimum Cart Value (₹)</label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border-subtle">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-yellow text-black hover:bg-[#FFE04D] transition-colors"
                >
                  <Save size={13} /> Save Shipping
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Notification Alerts</h2>
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Instant WhatsApp Order Notification</p>
                    <p className="text-[11px] text-text-muted">Sends live dispatch tracking links to customer WhatsApp.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">ENABLED</span>
                </div>
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-border-subtle flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Admin Email Alert on New Order</p>
                    <p className="text-[11px] text-text-muted">Sends copy of each order receipt to orders@starpress.in.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">ENABLED</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-white mb-4">Security & Access Control</h2>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-border-subtle space-y-2 text-xs">
                <p className="font-semibold text-white">Cryptographic Session Verification</p>
                <p className="text-text-secondary leading-relaxed">
                  Administrative access is enforced via strict server-side cookie sessions. Every administrative API route verifies authoritative role clearances before processing commands.
                </p>
                <div className="pt-2 text-[11px] text-brand-yellow">
                  Brute-force protection: Active (account locks after 5 consecutive failed attempts)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
