"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Compass, Download, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeDxfBytes, detectDxfEncoding, type DxfEncodingResolution } from "@/lib/dokumantasyon/dxf-encoding";
import {
  auditDxfText,
  getDxfFidelityWarnings,
  getDxfStage2BlockingIssues,
  type DxfFidelityAudit,
} from "@/lib/dokumantasyon/dxf-fidelity-audit";
import { formatBytes } from "../ui-helpers";
import { StudioCommandButton } from "../studio/studio-command-button";
import { ApsDwgViewer } from "./aps-dwg-viewer";

const DXF_FONT_URLS = ["/fonts/Arial-Regular.ttf", "/fonts/Arial-Bold.ttf"];

interface DokCadViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
}

type DxfViewerMessage = { message?: string; level?: string };

type DxfViewerInstance = {
  Destroy: () => void;
  FitView: (minX: number, maxX: number, minY: number, maxY: number, padding?: number) => void;
  GetBounds: () => { maxX: number; maxY: number; minX: number; minY: number } | null;
  GetOrigin: () => { x: number; y: number };
  HasRenderer: () => boolean;
  Load: (params: {
    url: string;
    fonts?: string[];
    progressCbk?: (phase: "font" | "fetch" | "parse" | "prepare") => void;
    workerFactory?: () => Worker;
  }) => Promise<void>;
  Subscribe: (eventName: "viewChanged" | "message", handler: (event: CustomEvent<DxfViewerMessage>) => void) => void;
  Unsubscribe: (eventName: "viewChanged" | "message", handler: (event: CustomEvent<DxfViewerMessage>) => void) => void;
};

type ViewerLoadState = "loading" | "ready" | "error";
type ViewerErrorKind = "fetch" | "parse" | "render" | "unsupported";

interface ViewerError {
  kind: ViewerErrorKind;
  message: string;
}

class DxfViewerLoadError extends Error {
  constructor(public readonly kind: ViewerErrorKind, message: string) {
    super(message);
    this.name = "DxfViewerLoadError";
  }
}

function normalizeExtension(extension: string): string {
  return extension.trim().toLowerCase();
}

function errorMessageFor(error: unknown, fallbackKind: ViewerErrorKind): ViewerError {
  if (error instanceof DxfViewerLoadError) return { kind: error.kind, message: error.message };
  const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
  return { kind: fallbackKind, message };
}

function downloadFile(accessUrl: string, displayName: string) {
  const link = document.createElement("a");
  link.href = accessUrl;
  link.download = displayName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function hasFiniteBounds(bounds: ReturnType<DxfViewerInstance["GetBounds"]>): boolean {
  if (!bounds) return false;
  return [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY].every(Number.isFinite);
}

export function DokCadViewer({ accessUrl, displayName, fileId, extension, sizeBytes }: DokCadViewerProps) {
  const normalizedExtension = normalizeExtension(extension);

  if (normalizedExtension === ".dwg") {
    return <ApsDwgViewer fileId={fileId} displayName={displayName} sizeBytes={sizeBytes} accessUrl={accessUrl} />;
  }

  if (normalizedExtension !== ".dxf") {
    return <DwgDownloadFallback accessUrl={accessUrl} displayName={displayName} extension={extension} sizeBytes={sizeBytes} />;
  }

  return (
    <DxfViewer
      key={`${fileId}:${accessUrl}`}
      accessUrl={accessUrl}
      displayName={displayName}
      sizeBytes={sizeBytes}
    />
  );
}

function DxfViewer({ accessUrl, displayName, sizeBytes }: Pick<DokCadViewerProps, "accessUrl" | "displayName" | "sizeBytes">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DxfViewerInstance | null>(null);
  const [loadState, setLoadState] = useState<ViewerLoadState>("loading");
  const [progress, setProgress] = useState("Dosya alınıyor");
  const [error, setError] = useState<ViewerError | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [viewRevision, setViewRevision] = useState(0);
  const [encodingResolution, setEncodingResolution] = useState<DxfEncodingResolution | null>(null);
  const [fidelityAudit, setFidelityAudit] = useState<DxfFidelityAudit | null>(null);
  const [fidelityWarnings, setFidelityWarnings] = useState<string[]>([]);
  const [viewerWarnings, setViewerWarnings] = useState<string[]>([]);

  const fitDrawing = useCallback(() => {
    const viewer = viewerRef.current;
    const bounds = viewer?.GetBounds();
    const origin = viewer?.GetOrigin();
    if (!viewer || !bounds || !origin || !hasFiniteBounds(bounds)) return;

    viewer.FitView(
      bounds.minX - origin.x,
      bounds.maxX - origin.x,
      bounds.minY - origin.y,
      bounds.maxY - origin.y,
      0.1
    );
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    let viewer: DxfViewerInstance | null = null;
    let objectUrl: string | null = null;
    let onViewChanged: ((event: CustomEvent<DxfViewerMessage>) => void) | null = null;
    let onViewerMessage: ((event: CustomEvent<DxfViewerMessage>) => void) | null = null;
    const container = containerRef.current;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!active) return;
      active = false;
      abortController.abort();
      viewer?.Destroy();
      if (viewerRef.current === viewer) viewerRef.current = null;
      setError({ kind: "render", message: "WebGL bağlamı kayboldu. Görünümü tekrar deneyin veya dosyayı indirin." });
      setLoadState("error");
    };
    container?.addEventListener("webglcontextlost", onContextLost, true);

    const load = async () => {
      setLoadState("loading");
      setError(null);
      setEncodingResolution(null);
      setFidelityAudit(null);
      setFidelityWarnings([]);
      setViewerWarnings([]);
      setProgress("Dosya alınıyor");

      try {
        const response = await fetch(accessUrl, { signal: abortController.signal });
        if (!response.ok) {
          throw new DxfViewerLoadError("fetch", `Dosya indirilemedi (HTTP ${response.status}).`);
        }

        const dxfBuffer = await response.arrayBuffer();
        if (dxfBuffer.byteLength === 0) {
          throw new DxfViewerLoadError("parse", "DXF dosyası boş.");
        }

        const dxfBytes = new Uint8Array(dxfBuffer);
        const encoding = detectDxfEncoding(dxfBytes);
        setEncodingResolution(encoding);
        if (encoding.isBinary) {
          throw new DxfViewerLoadError(
            "unsupported",
            "Binary DXF algılandı. Mevcut DXF parser ASCII DXF bekliyor; dosyayı ASCII DXF olarak dışa aktarın."
          );
        }

        setProgress(`Encoding çözümleniyor (${encoding.encoding})`);
        const dxfText = decodeDxfBytes(dxfBytes, encoding.encoding);
        if (!dxfText.trim()) {
          throw new DxfViewerLoadError("parse", "DXF içeriği seçilen encoding ile çözümlenemedi.");
        }

        const audit = auditDxfText(dxfText);
        const auditWarnings = getDxfFidelityWarnings(audit);
        const blockingIssues = getDxfStage2BlockingIssues(audit);
        setFidelityAudit(audit);
        setFidelityWarnings([...encoding.warnings, ...auditWarnings, ...blockingIssues]);
        if (blockingIssues.length > 0) {
          throw new DxfViewerLoadError(
            "unsupported",
            `DXF eksik render edileceği için görüntüleme durduruldu. ${blockingIssues.join(" ")}`
          );
        }

        objectUrl = URL.createObjectURL(new Blob([dxfBuffer], { type: "application/dxf" }));

        setProgress("Görüntüleyici hazırlanıyor");
        const dxfModule = await import("dxf-viewer");
        if (!active || !containerRef.current) return;

        viewer = new dxfModule.DxfViewer(containerRef.current, {
          autoResize: true,
          clearAlpha: 1,
          antialias: true,
          colorCorrection: true,
          blackWhiteInversion: true,
          fileEncoding: encoding.encoding,
        }) as DxfViewerInstance;

        if (!viewer.HasRenderer()) {
          throw new DxfViewerLoadError("render", "WebGL görüntüleyicisi başlatılamadı.");
        }

        onViewChanged = () => {
          if (active) setViewRevision((revision) => revision + 1);
        };
        onViewerMessage = (event) => {
          if (!active) return;
          const detail = event.detail;
          if (detail?.level === "warn" || detail?.level === "error") {
            const message = detail.message?.trim();
            if (message) setViewerWarnings((current) => current.includes(message) ? current : [...current, message]);
          }
        };
        viewer.Subscribe("viewChanged", onViewChanged);
        viewer.Subscribe("message", onViewerMessage);
        viewerRef.current = viewer;

        await viewer.Load({
          url: objectUrl,
          fonts: DXF_FONT_URLS,
          workerFactory: () => new Worker(new URL("./dxf-viewer-worker.ts", import.meta.url), { type: "module" }),
          progressCbk: (phase) => {
            if (!active) return;
            const phaseLabels = {
              fetch: "Ham DXF byte'ları okunuyor",
              parse: "DXF yapısı parse ediliyor",
              prepare: "Block ve geometri hazırlanıyor",
              font: "Yazılar ve glifler hazırlanıyor",
            } as const;
            setProgress(phaseLabels[phase]);
          },
        });

        if (!active) return;
        const bounds = viewer.GetBounds();
        if ((audit.entityCount > 0 || audit.blockEntityCount > 0) && !hasFiniteBounds(bounds)) {
          throw new DxfViewerLoadError(
            "render",
            "DXF parse edildi ancak geçerli çizim sınırları üretilemedi. Yükleme başarılı sayılamaz."
          );
        }

        fitDrawing();
        setLoadState("ready");
      } catch (caughtError: unknown) {
        if (!active || abortController.signal.aborted) return;
        const kind: ViewerErrorKind = viewer ? "parse" : "fetch";
        setError(errorMessageFor(caughtError, kind));
        setLoadState("error");
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      }
    };

    void load();

    return () => {
      active = false;
      abortController.abort();
      container?.removeEventListener("webglcontextlost", onContextLost, true);
      if (viewer && onViewChanged) viewer.Unsubscribe("viewChanged", onViewChanged);
      if (viewer && onViewerMessage) viewer.Unsubscribe("message", onViewerMessage);
      viewer?.Destroy();
      if (viewerRef.current === viewer) viewerRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessUrl, fitDrawing, retryKey]);

  const handleDownload = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);
  const allWarnings = [...fidelityWarnings, ...viewerWarnings];

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100" data-testid="cad-dxf-viewer">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="truncate font-bold text-amber-300">DXF görüntüleyici</span>
          <span className="hidden text-zinc-500 sm:inline">{formatBytes(sizeBytes)}</span>
          {loadState === "ready" && fidelityAudit && (
            <span
              data-testid="cad-dxf-fidelity"
              className={allWarnings.length > 0 ? "hidden text-amber-300 md:inline" : "hidden text-emerald-400 md:inline"}
              title={allWarnings.join("\n")}
            >
              {fidelityAudit.entityCount} entity · {fidelityAudit.textEntityCount} yazı · {fidelityAudit.dimensionEntityCount} ölçü
              {encodingResolution ? ` · ${encodingResolution.encoding}` : ""}
              {allWarnings.length > 0 ? ` · ${allWarnings.length} uyarı` : " · denetim temiz"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <StudioCommandButton
            commandId="cad.dxf.fit"
            onClick={fitDrawing}
            disabled={loadState !== "ready"}
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            icon={<ScanLine className="h-3.5 w-3.5" />}
            label="Sığdır"
          />
          <StudioCommandButton
            commandId="cad.dxf.reset"
            onClick={fitDrawing}
            disabled={loadState !== "ready"}
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            label="Sıfırla"
          />
          <StudioCommandButton
            commandId="cad.download"
            onClick={handleDownload}
            className="h-7 gap-1.5 bg-amber-500 px-2.5 text-[11px] font-bold text-zinc-950 hover:bg-amber-400"
            icon={<Download className="h-3.5 w-3.5" />}
            label="İndir"
          />
        </div>
      </header>

      {loadState === "ready" && allWarnings.length > 0 && (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100" data-testid="cad-dxf-fidelity-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="min-w-0 truncate" title={allWarnings.join("\n")}>
            DXF açıldı; ancak sadakat denetimi uyarı verdi: {allWarnings.join(" ")}
          </p>
        </div>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-view-revision={viewRevision}>
        <div ref={containerRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden" data-testid="cad-dxf-canvas" />

        {loadState === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-100">DXF hazırlanıyor</p>
              <p className="mt-1 text-xs text-zinc-400">{progress}</p>
            </div>
          </div>
        )}

        {loadState === "error" && error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-5">
            <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-red-400" />
              <h2 className="mt-3 text-base font-bold text-red-200">DXF açılamadı</h2>
              <dl className="mt-4 space-y-1 text-left text-xs text-zinc-300">
                <div><dt className="inline text-zinc-500">Dosya: </dt><dd className="inline break-all">{displayName}</dd></div>
                <div><dt className="inline text-zinc-500">Boyut: </dt><dd className="inline">{formatBytes(sizeBytes)}</dd></div>
                {encodingResolution && <div><dt className="inline text-zinc-500">Encoding: </dt><dd className="inline">{encodingResolution.encoding} ({encodingResolution.source})</dd></div>}
                <div><dt className="inline text-zinc-500">Sebep: </dt><dd className="inline">{error.kind} — {error.message}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button onClick={() => setRetryKey((key) => key + 1)} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">Tekrar dene</Button>
                <Button variant="outline" onClick={handleDownload} className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">Dosyayı indir</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DwgDownloadFallback({ accessUrl, displayName, extension, sizeBytes }: Omit<DokCadViewerProps, "fileId">) {
  const handleDownload = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);

  return (
    <section className="flex h-full w-full items-center justify-center bg-zinc-950 p-5 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <Compass className="mx-auto h-10 w-10 text-amber-400" />
        <h2 className="mt-3 text-base font-bold">DWG görüntüleyici lisans kararı bekliyor</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">{displayName} ({extension.toUpperCase()}, {formatBytes(sizeBytes)}) güvenli olarak indirilebilir. DWG decoder’i, onaylı lisans olmadan bu sürüme eklenmeyecek.</p>
        <Button onClick={handleDownload} className="mt-5 bg-amber-500 text-zinc-950 hover:bg-amber-400">
          <Download className="mr-2 h-4 w-4" />Dosyayı indir
        </Button>
      </div>
    </section>
  );
}
