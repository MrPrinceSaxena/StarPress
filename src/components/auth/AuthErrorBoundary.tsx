// src/components/auth/AuthErrorBoundary.tsx
'use client';

import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Auth Error Boundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-bg-base text-white">
          <div className="max-w-md w-full text-center bg-bg-surface border border-rose-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Authentication Service Notice
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {this.state.error?.message || 'A session sync interruption occurred. Please reload to restore session credentials.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-yellow text-black font-bold text-sm rounded-full hover:bg-[#FFE04D] transition-all shadow-lg shadow-brand-yellow/15"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Session</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
