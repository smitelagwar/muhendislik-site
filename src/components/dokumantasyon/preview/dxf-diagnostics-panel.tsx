"use client";

import { AlertTriangle, ChevronDown, ChevronUp, CircleAlert, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DxfDiagnosticCategory,
  DxfDiagnosticItem,
  DxfStage5DiagnosticsReport,
} from "@/lib/dokumantasyon/dxf-stage5-diagnostics";

const CATEGORY_LABELS: Record<DxfDiagnosticCategory, string> = {
  encoding: "Encoding",
  structure: "Yapı",
  block: "Block",
  text: "Yazı",
  dimension: "Ölçü",
  layer: "Layer",
  geometry: "Geometri",
  viewport: "Görünüm",
  renderer: "Renderer",
};

function statusText(report: DxfStage5DiagnosticsReport): string {
  if (report.status === "blocked") return `${report.blockingCount} engel`;
  if (report.status === "warning") return `${report.warningCount} uyarı`;
  return "Denetim temiz";
}

function statusClasses(report: DxfStage5DiagnosticsReport): string {
  if (report.status === "blocked") return "border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15";
  if (report.status === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15";
}

function StatusIcon({ report }: { report: DxfStage5DiagnosticsReport }) {
  if (report.status === "blocked") return <CircleAlert className="h-3.5 w-3.5" />;
  if (report.status === "warning") return <AlertTriangle className="h-3.5 w-3.5" />;
  return <ShieldCheck className="h-3.5 w-3.5" />;
}

function SeverityIcon({ item }: { item: DxfDiagnosticItem }) {
  if (item.severity === "blocking") return <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />;
  if (item.severity === "warning") return <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />;
  return <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />;
}

export function DxfDiagnosticsButton({
  report,
  open,
  onToggle,
}: {
  report: DxfStage5DiagnosticsReport;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="cad-dxf-diagnostics-panel"
      data-testid="cad-dxf-diagnostics-toggle"
      className={`h-7 gap-1.5 px-2.5 text-[11px] ${statusClasses(report)}`}
    >
      <StatusIcon report={report} />
      <span className="hidden sm:inline">Denetim:</span>
      <span>{statusText(report)}</span>
      {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
    </Button>
  );
}

export function DxfDiagnosticsPanel({ report }: { report: DxfStage5DiagnosticsReport }) {
  return (
    <section
      id="cad-dxf-diagnostics-panel"
      data-testid="cad-dxf-diagnostics-panel"
      className="max-h-[38vh] shrink-0 overflow-y-auto border-b border-zinc-800 bg-zinc-950/95 px-3 py-3 text-xs"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCell label="Model entity" value={report.modelSpaceGeometryCount} />
          <SummaryCell label="Aktif layer" value={report.activeLayerCount} />
          <SummaryCell label="Kapalı / frozen" value={report.offLayerCount + report.frozenLayerCount} />
          <SummaryCell label="Layout dışarıda" value={report.paperSpaceGeometryCount} />
        </div>

        {report.items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
            Bu DXF için bilinen fidelity riski bulunmadı.
          </div>
        ) : (
          <div className="space-y-1.5">
            {report.items.map((item) => (
              <article
                key={item.id}
                className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2"
                data-severity={item.severity}
              >
                <SeverityIcon item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-zinc-100">{item.title}</span>
                    <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                  <p className="mt-0.5 leading-relaxed text-zinc-400">{item.detail}</p>
                  {item.evidence && item.evidence.length > 0 && (
                    <p className="mt-1 break-words font-mono text-[10px] text-zinc-500">
                      {item.evidence.join(" · ")}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-zinc-500">
          Denetim paneli yalnız mevcut DXF’nin görüntüleme güvenilirliğini açıklar. Kaynak dosya değiştirilmez; indirilen dosya orijinal içeriktir.
        </p>
      </div>
    </section>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-0.5 font-semibold text-zinc-200">{value}</div>
    </div>
  );
}
