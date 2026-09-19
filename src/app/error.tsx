"use client";

import React, { useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service if needed
    console.error("App Runtime Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full text-center space-y-6 bg-bg-surface border border-border-subtle rounded-2xl p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle size={28} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl text-white">
              Something went wrong!
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              We encountered an unexpected error. Our team has been notified.
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-text-muted">
                Incident ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => reset()}
              className="w-full sm:w-auto"
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              href="/"
              className="w-full sm:w-auto"
            >
              <Home size={16} />
              <span>Go to Homepage</span>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
