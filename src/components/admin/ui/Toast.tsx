'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Info, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

let toastListeners: ((toasts: ToastData[]) => void)[] = [];
let toasts: ToastData[] = [];

function notify() {
  toastListeners.forEach((fn) => fn([...toasts]));
}

export function showToast(message: string, type: ToastType = 'success') {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

const ICONS = {
  success: CheckCircle2,
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-emerald-500/30 bg-[#0B1512]/95 text-emerald-300 shadow-[0_8px_30px_rgb(16,185,129,0.15)]',
  error: 'border-rose-500/30 bg-[#1A0B0F]/95 text-rose-300 shadow-[0_8px_30px_rgb(244,63,94,0.15)]',
  warning: 'border-amber-500/30 bg-[#191307]/95 text-amber-300 shadow-[0_8px_30px_rgb(245,158,11,0.15)]',
  info: 'border-blue-500/30 bg-[#0B1220]/95 text-blue-300 shadow-[0_8px_30px_rgb(59,130,246,0.15)]',
};

const ICON_COLORS = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

export default function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {items.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl animate-fadeIn transition-all duration-200 ${STYLES[toast.type]}`}
          >
            <div className={`p-1 rounded-lg bg-white/[0.05] shrink-0 ${ICON_COLORS[toast.type]}`}>
              <Icon size={16} />
            </div>
            <span className="text-xs font-medium text-white flex-1 leading-snug">
              {toast.message}
            </span>
            <button
              onClick={() => {
                toasts = toasts.filter((t) => t.id !== toast.id);
                notify();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
