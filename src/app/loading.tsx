import React from "react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Glowing star pulse */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute w-16 h-16 bg-brand-yellow/30 rounded-full blur-xl animate-ping"
            aria-hidden="true"
          />
          <span className="text-3xl animate-spin text-brand-yellow" aria-hidden="true">
            ⭐
          </span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-text-secondary animate-pulse">
          Loading Star Press...
        </div>
      </div>
    </div>
  );
}
