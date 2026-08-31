import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface GoverningCheckProps {
  label: string;
  demand?: number;
  capacity?: number;
  utilization?: number;
  unit?: string;
  status: "ok" | "warn" | "fail";
  explanation: string;
  className?: string;
}

export function GoverningCheckCard({
  label,
  demand,
  capacity,
  utilization,
  unit = "",
  status,
  explanation,
  className = "",
}: GoverningCheckProps) {
  const statusConfig = {
    ok: {
      border: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      badgeText: "UYGUN",
      icon: CheckCircle2,
    },
    warn: {
      border: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
      badgeText: "SINIRDA",
      icon: AlertTriangle,
    },
    fail: {
      border: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      badge: "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30",
      badgeText: "YETERSİZ",
      icon: XCircle,
    },
  }[status];

  const Icon = statusConfig.icon;
  const utilPercent = utilization !== undefined ? (utilization * 100).toFixed(1) : undefined;

  return (
    <div className={`rounded-2xl border p-4 transition-all ${statusConfig.border} ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white">
            {label}
          </span>
        </div>
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConfig.badge}`}>
          {statusConfig.badgeText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono my-2 text-muted-foreground dark:text-zinc-300">
        {demand !== undefined && (
          <div>
            <span className="block text-[10px] uppercase font-sans text-muted-foreground/80">Talep / Yük:</span>
            <span className="font-bold text-foreground dark:text-white">{demand} {unit}</span>
          </div>
        )}
        {capacity !== undefined && (
          <div>
            <span className="block text-[10px] uppercase font-sans text-muted-foreground/80">Kapasite / Sınır:</span>
            <span className="font-bold text-foreground dark:text-white">{capacity} {unit}</span>
          </div>
        )}
      </div>

      {utilPercent !== undefined && (
        <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between text-xs">
          <span className="text-[11px] text-muted-foreground dark:text-zinc-400">Kullanım Oranı:</span>
          <span className="font-mono font-bold text-foreground dark:text-white">%{utilPercent}</span>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300">
        {explanation}
      </p>
    </div>
  );
}