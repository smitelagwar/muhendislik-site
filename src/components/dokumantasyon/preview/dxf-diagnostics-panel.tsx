"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, CircleAlert, Gauge, Info, Palette, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DXF_LINEWEIGHT_READY_EVENT,
  getDxfLineweightSnapshot,
  getDxfLineweightViewerForRoot,
  setDxfLineweightEnabled,
} from "@/lib/dokumantasyon/dxf-lineweight-runtime";
import {
  getDxfRenderStyleViewerForRoot,
  setDxfColorMode,
} from "@/lib/dokumantasyon/dxf-render-style-runtime";
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

type DxfColorMode = "true-color" | "monochrome";

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

function getDxfRoot(host: HTMLElement | null): HTMLElement | null {
  return host?.closest<HTMLElement>('[data-testid="cad-dxf-viewer"]') ?? null;
}

function applyDxfColorMode(root: HTMLElement, mode: DxfColorMode): boolean {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="cad-dxf-canvas"] canvas');
  const viewer = getDxfRenderStyleViewerForRoot(root);
  if (!canvas || !viewer) return false;

  setDxfColorMode(viewer, mode === "monochrome" ? "monochrome" : "source");
  canvas.dataset.dxfColorMode = mode;
  canvas.style.filter = "";
  canvas.style.transition = "";
  return true;
}

function applyDxfLineweightMode(root: HTMLElement, enabled: boolean) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="cad-dxf-canvas"] canvas');
  const viewer = getDxfLineweightViewerForRoot(root);
  if (!canvas || !viewer) return null;

  const snapshot = setDxfLineweightEnabled(viewer, enabled);
  canvas.dataset.dxfLineweightMode = enabled ? "source" : "hairline";
  return snapshot;
}

function DxfRenderModeControls() {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [renderReady, setRenderReady] = useState(false);
  const [colorMode, setColorMode] = useState<DxfColorMode>("true-color");
  const [lineweightEnabled, setLineweightEnabled] = useState(false);
  const [lineweightSnapshot, setLineweightSnapshot] = useState<unknown>(null);
  const monochrome = colorMode === "monochrome";

  useEffect(() => {
    const root = getDxfRoot(hostRef.current);
    if (!root) return;

    let retryTimer: number | null = null;
    const syncInitialState = () => {
      const colorViewer = getDxfRenderStyleViewerForRoot(root);
      const lineweightViewer = getDxfLineweightViewerForRoot(root);
      if (!colorViewer || !lineweightViewer) return false;

      applyDxfColorMode(root, colorMode);
      const snapshot = applyDxfLineweightMode(root, lineweightEnabled) ?? getDxfLineweightSnapshot(lineweightViewer);
      setLineweightSnapshot(snapshot);
      setRenderReady(true);
      return true;
    };

    const handleReady = () => {
      if (syncInitialState()) return;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        syncInitialState();
      }, 0);
    };

    handleReady();
    root.addEventListener(DXF_LINEWEIGHT_READY_EVENT, handleReady);

    return () => {
      root.removeEventListener(DXF_LINEWEIGHT_READY_EVENT, handleReady);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="cad-dxf-canvas"] canvas');
      if (canvas) {
        delete canvas.dataset.dxfColorMode;
        delete canvas.dataset.dxfLineweightMode;
      }
    };
    // The controls cannot be changed before renderReady, so the initial source/hairline state is
    // intentionally captured once for each mounted viewer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleColorMode = () => {
    if (!renderReady) return;
    const root = getDxfRoot(hostRef.current);
    if (!root) return;
    const next: DxfColorMode = monochrome ? "true-color" : "monochrome";
    if (!applyDxfColorMode(root, next)) return;
    setColorMode(next);
  };

  const toggleLineweight = () => {
    if (!renderReady) return;
    const root = getDxfRoot(hostRef.current);
    if (!root) return;
    const next = !lineweightEnabled;
    const snapshot = applyDxfLineweightMode(root, next);
    if (!snapshot) return;
    setLineweightEnabled(next);
    setLineweightSnapshot(snapshot);
  };

  return (
    <span ref={hostRef} className="contents">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggleColorMode}
        disabled={!renderReady}
        aria-pressed={monochrome}
        aria-label={monochrome ? "Renk modu: Siyah-Beyaz. Gerçek Renge geç" : "Renk modu: Gerçek Renk. Siyah-Beyaza geç"}
        title={monochrome ? "Siyah-Beyaz görünüm — Gerçek Renk moduna geç" : "Gerçek Renk görünümü — Siyah-Beyaz moduna geç"}
        data-testid="cad-dxf-color-mode-toggle"
        data-mode={colorMode}
        className={monochrome
          ? "h-7 gap-1.5 border-zinc-500/60 bg-zinc-800 px-2.5 text-[11px] text-zinc-100 hover:bg-zinc-700"
          : "h-7 gap-1.5 border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] text-sky-200 hover:bg-sky-500/15"}
      >
        <Palette className="h-3.5 w-3.5" />
        <span className="sm:hidden">{monochrome ? "S/B" : "Gerçek"}</span>
        <span className="hidden sm:inline">{monochrome ? "Siyah-Beyaz" : "Gerçek Renk"}</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggleLineweight}
        disabled={!renderReady}
        aria-pressed={lineweightEnabled}
        aria-label={lineweightEnabled ? "Lineweight açık. Kaynak çizgi kalınlıklarını kapat" : "Lineweight kapalı. Kaynak çizgi kalınlıklarını aç"}
        title={lineweightEnabled ? "Lineweight açık — ince çizgi görünümüne geç" : "Kaynak DXF lineweight değerlerini göster"}
        data-testid="cad-dxf-lineweight-toggle"
        data-mode={lineweightEnabled ? "source" : "hairline"}
        className={lineweightEnabled
          ? "h-7 gap-1.5 border-amber-500/40 bg-amber-500/10 px-2.5 text-[11px] text-amber-200 hover:bg-amber-500/15"
          : "h-7 gap-1.5 border-zinc-700 bg-zinc-900 px-2.5 text-[11px] text-zinc-300 hover:bg-zinc-800"}
      >
        <Gauge className="h-3.5 w-3.5" />
        <span className="sm:hidden">LW</span>
        <span className="hidden sm:inline">Lineweight</span>
      </Button>

      {lineweightSnapshot !== null && (
        <output
          className="sr-only"
          data-testid="cad-dxf-lineweight-snapshot"
          data-enabled={lineweightEnabled ? "true" : "false"}
        >
          {JSON.stringify(lineweightSnapshot)}
        </output>
      )}
    </span>
  );
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
    <>
      <style>{`
        @media (max-width: 639px) {
          [data-testid="cad-dxf-viewer"] > header > div:last-child {
            width: 100%;
            max-width: 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
        }
      `}</style>
      <div className="flex items-center gap-1.5">
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
        <DxfRenderModeControls />
      </div>
    </>
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
