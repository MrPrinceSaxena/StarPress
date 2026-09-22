'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

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
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
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
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {items.map((toast) => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-elevation-md animate-fadeIn ${STYLES[toast.type]}`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => {
                toasts = toasts.filter((t) => t.id !== toast.id);
                notify();
              }}
              className="p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
