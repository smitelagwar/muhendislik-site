"use client";

import type { ReactNode } from "react";
import { FileText, Sigma } from "lucide-react";
import { concreteMonoFont } from "@/lib/concrete-tools/fonts";
import type { ConcreteStatusTone } from "@/lib/concrete-tools/types";
import { cn } from "@/lib/utils";

type ValueTone = ConcreteStatusTone | "neutral";

const valueToneClasses: Record<ValueTone, string> = {
  neutral: "text-purple-300 dark:text-purple-300",
  ok: "text-emerald-400 dark:text-emerald-300",
  warn: "text-amber-400 dark:text-amber-300",
  fail: "text-rose-400 dark:text-rose-300",
};

const badgeToneClasses: Record<ConcreteStatusTone, string> = {
  ok: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 dark:text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  warn: "border-amber-500/40 bg-amber-500/15 text-amber-400 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  fail: "border-rose-500/40 bg-rose-500/15 text-rose-400 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
};

export function ConcreteFieldLabel({
  label,
  unit,
}: {
  label: string;
  unit?: string;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
      <span>{label}</span>
      {unit ? (
        <span className={cn(concreteMonoFont.className, "tool-chip rounded-md px-2 py-0.5 text-[10px] font-bold")}>
          [{unit}]
        </span>
      ) : null}
    </label>
  );
}

export function ConcreteFormulaCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("tool-formula-card rounded-2xl p-5 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-zinc-300">
        <FileText className="h-4 w-4 text-purple-400" />
        <p className="text-xs font-black uppercase tracking-wider text-purple-200">{title}</p>
      </div>
      <div className={cn(concreteMonoFont.className, "mt-3 overflow-x-auto text-xs sm:text-sm leading-6 text-zinc-100 font-medium")}>{children}</div>
    </div>
  );
}

export function ConcreteStatusBadge({
  tone,
  label,
  className,
}: {
  tone: ConcreteStatusTone;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn(concreteMonoFont.className, "inline-flex rounded-xl border px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm", badgeToneClasses[tone], className)}>
      {label}
    </div>
  );
}

export function ConcreteResultRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: ValueTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 dark:border-white/10 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-300 font-medium">{label}</span>
      <span className={cn(concreteMonoFont.className, "text-right text-xs sm:text-sm font-bold tabular-nums", valueToneClasses[tone])}>{value}</span>
    </div>
  );
}

export function ConcreteMetricCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: ReactNode;
  unit: string;
}) {
  return (
    <div className="tool-panel rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className={cn(concreteMonoFont.className, "text-2xl sm:text-3xl font-black text-foreground dark:text-white tabular-nums drop-shadow-[0_0_15px_rgba(192,132,252,0.3)]")}>{value}</p>
        <p className={cn(concreteMonoFont.className, "text-xs font-bold text-purple-400 dark:text-purple-300")}>{unit}</p>
      </div>
    </div>
  );
}

export function ConcreteStandardsNote({
  standards,
  note,
  className,
}: {
  standards: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={cn("tool-panel rounded-2xl p-6", className)}>
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-3 text-purple-400 shrink-0">
          <Sigma className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">Referans Standartlar</p>
          <p className="mt-1.5 text-base sm:text-lg font-black tracking-tight text-foreground dark:text-white">{standards}</p>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 font-normal">{note}</p>
        </div>
      </div>
    </div>
  );
}
