"use client";

import type { ReactNode } from "react";
import { FileText, Sigma } from "lucide-react";
import { concreteDisplayFont, concreteMonoFont } from "@/lib/concrete-tools/fonts";
import type { ConcreteStatusTone } from "@/lib/concrete-tools/types";
import { cn } from "@/lib/utils";

type ValueTone = ConcreteStatusTone | "neutral";

const valueToneClasses: Record<ValueTone, string> = {
  neutral: "text-sky-300",
  ok: "text-emerald-300",
  warn: "text-amber-300",
  fail: "text-red-300",
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
    <label className={cn(concreteMonoFont.className, "mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>
      <span>{label}</span>
      {unit ? (
        <span className="rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
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
    <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 text-zinc-100 shadow-sm", className)}>
      <div className="flex items-center gap-2 text-zinc-300">
        <FileText className="h-4 w-4 text-amber-300" />
        <p className={cn(concreteDisplayFont.className, "text-base font-black uppercase tracking-[0.12em]")}>{title}</p>
      </div>
      <div className={cn(concreteMonoFont.className, "mt-3 text-sm leading-6 text-zinc-200")}>{children}</div>
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
      <span className="text-sm text-zinc-400">{label}</span>
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
    <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
      <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400")}>{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className={cn(concreteDisplayFont.className, "text-3xl font-black uppercase tracking-[0.08em] text-zinc-950 dark:text-white")}>{value}</p>
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
    <div className={cn("rounded-[28px] border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <Sigma className="h-4 w-4" />
        </div>
        <div>
          <p className={cn(concreteMonoFont.className, "text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500")}>Referans standartlar</p>
          <p className={cn(concreteDisplayFont.className, "mt-2 text-xl font-black uppercase tracking-[0.1em] text-zinc-950 dark:text-white")}>{standards}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{note}</p>
        </div>
      </div>
    </div>
  );
}
