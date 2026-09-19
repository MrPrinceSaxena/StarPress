import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-text-secondary animate-pulse">
          Loading Star Press...
        </div>
      </div>
    </div>
  );
}
