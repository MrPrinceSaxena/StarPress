import React from "react";
import Link from "next/link";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:outline-none select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-2 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-brand-yellow text-black hover:bg-[#FFE04D] hover:scale-[1.03] shadow-md shadow-brand-yellow/10 font-bold",
    outline:
      "border border-white/30 text-white bg-transparent hover:bg-white/10 hover:border-white/60 hover:scale-[1.03]",
    ghost:
      "text-text-secondary hover:text-white hover:bg-white/5 bg-transparent",
    secondary:
      "bg-bg-surface-alt text-white border border-border-subtle hover:bg-white/10 hover:border-white/30",
  }[variant];

  const combinedStyles = `${baseStyles} ${sizeStyles} ${variantStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
