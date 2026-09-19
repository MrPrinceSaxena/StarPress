import React from "react";
import {
  Gem,
  Truck,
  ShieldCheck,
  Palette,
  Tag,
  Star,
  LucideIcon,
} from "lucide-react";

export type SupportedIcon =
  | "Diamond"
  | "Truck"
  | "ShieldCheck"
  | "Palette"
  | "Tag"
  | "Star";

export interface IconBadgeProps {
  iconName: SupportedIcon;
  variant?: "outline" | "filled";
  outlineColor?: string;
  fillColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function IconBadge({
  iconName,
  variant = "outline",
  outlineColor = "border-border-subtle text-slate-300",
  fillColor = "bg-bg-surface-alt text-brand-yellow border border-border-subtle",
  size = "md",
  className = "",
}: IconBadgeProps) {
  const iconMap: Record<SupportedIcon, LucideIcon> = {
    Diamond: Gem,
    Truck: Truck,
    ShieldCheck: ShieldCheck,
    Palette: Palette,
    Tag: Tag,
    Star: Star,
  };

  const IconComponent = iconMap[iconName] || Gem;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
  }[size];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  if (variant === "filled") {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full text-white shadow-lg shrink-0 ${sizeClasses} ${fillColor} ${className}`}
      >
        <IconComponent size={iconSizes} className="text-white" />
      </div>
    );
  }

  // Outline variant (Trust badges)
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border-2 text-white bg-bg-surface shrink-0 shadow-sm ${sizeClasses} ${outlineColor} ${className}`}
    >
      <IconComponent size={iconSizes} className="text-white" />
    </div>
  );
}
