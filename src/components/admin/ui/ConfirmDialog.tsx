'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmStyles = {
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-black',
    default: 'bg-brand-yellow hover:bg-[#FFE04D] text-black',
  }[variant];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn overflow-hidden">
        <div className="flex items-start gap-3.5 p-5">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-[#E5E7EB] bg-white transition-colors disabled:opacity-50 shadow-xs"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-xs ${confirmStyles}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
