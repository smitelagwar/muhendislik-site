"use client";

import type { ReactNode } from "react";
import { FileText, Sigma } from "lucide-react";
import { concreteMonoFont } from "@/lib/concrete-tools/fonts";
import type { ConcreteStatusTone } from "@/lib/concrete-tools/types";
import { cn } from "@/lib/utils";

type ValueTone = ConcreteStatusTone | "neutral";

const valueToneClasses: Record<ValueTone, string> = {
  neutral: "text-sky-200 dark:text-sky-200",
  ok: "text-emerald-200 dark:text-emerald-200",
  warn: "text-amber-200 dark:text-amber-200",
  fail: "text-red-200 dark:text-red-200",
};

const badgeToneClasses: Record<ConcreteStatusTone, string> = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  fail: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function ConcreteFieldLabel({
  label,
  unit,
}: {
  label: string;
  unit?: string;
}) {
  return (
    <label className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
      <span>{label}</span>
      {unit ? (
        <span className={cn(concreteMonoFont.className, "tool-chip rounded-full px-2 py-0.5 text-[10px] font-bold")}>
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
    <div className={cn("tool-formula-card rounded-2xl p-4 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-zinc-300">
        <FileText className="h-4 w-4 text-blue-300" />
        <p className="text-base font-black uppercase tracking-[0.12em]">{title}</p>
      </div>
      <div className={cn(concreteMonoFont.className, "mt-3 overflow-x-auto text-sm leading-6 text-zinc-100")}>{children}</div>
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
    <div className={cn(concreteMonoFont.className, "inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]", badgeToneClasses[tone], className)}>
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
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-sm text-slate-300/88">{label}</span>
      <span className={cn(concreteMonoFont.className, "text-right text-sm font-semibold", valueToneClasses[tone])}>{value}</span>
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
    <div className="tool-panel rounded-3xl p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className={cn(concreteMonoFont.className, "text-2xl font-black text-zinc-950 dark:text-white sm:text-3xl")}>{value}</p>
        <p className={cn(concreteMonoFont.className, "pb-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400")}>{unit}</p>
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
    <div className={cn("tool-panel rounded-[28px] p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
          <Sigma className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Referans standartlar</p>
          <p className="mt-2 text-xl font-black tracking-tight text-zinc-950 dark:text-white">{standards}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{note}</p>
        </div>
      </div>
    </div>
  );
}
