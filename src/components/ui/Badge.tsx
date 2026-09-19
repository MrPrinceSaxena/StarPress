import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "pill" | "notification" | "tag";
  className?: string;
}

export default function Badge({
  children,
  variant = "pill",
  className = "",
}: BadgeProps) {
  if (variant === "notification") {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full bg-brand-yellow text-black leading-none ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === "tag") {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 text-white border border-white/10 ${className}`}
      >
        {children}
      </span>
    );
  }

  // Pill variant (Hero top badge)
  return (
    <span
      className={`inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-slate-300 shadow-sm ${className}`}
    >
      {children}
    </span>
  );
}
