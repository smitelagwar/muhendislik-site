import React from "react";
import { ShieldCheck, Ruler, Tag, Calculator, Sparkles } from "lucide-react";
import type { CalculationKind } from "@/lib/tool-public-meta";

interface ToolScopeBadgeProps {
  kind: CalculationKind;
  className?: string;
}

const SCOPE_CONFIG: Record<
  CalculationKind,
  { label: string; icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  check: {
    label: "Mühendislik Tahkiki",
    icon: ShieldCheck,
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  preliminary: {
    label: "Ön Boyutlandırma",
    icon: Ruler,
    classes: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  classification: {
    label: "Sınıflandırma",
    icon: Tag,
    classes: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  quantity: {
    label: "Yaklaşık Metraj",
    icon: Calculator,
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  estimate: {
    label: "Ön Keşif & Tahmin",
    icon: Sparkles,
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

export function ToolScopeBadge({ kind, className = "" }: ToolScopeBadgeProps) {
  const config = SCOPE_CONFIG[kind] || SCOPE_CONFIG.check;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide transition-all ${config.classes} ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}