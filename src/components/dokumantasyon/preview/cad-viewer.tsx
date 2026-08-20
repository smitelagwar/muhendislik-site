"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Compass, Download, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "../ui-helpers";
import { StudioCommandButton } from "../studio/studio-command-button";
import { ApsDwgViewer } from "./aps-dwg-viewer";

interface DokCadViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
}

type DxfViewerInstance = {
  Destroy: () => void;
  FitView: (minX: number, maxX: number, minY: number, maxY: number, padding?: number) => void;
  GetBounds: () => { maxX: number; maxY: number; minX: number; minY: number } | null;
  GetOrigin: () => { x: number; y: number };
  HasRenderer: () => boolean;
  Load: (params: {
    url: string;
    progressCbk?: (phase: "font" | "fetch" | "parse" | "prepare") => void;
    workerFactory?: () => Worker;
  }) => Promise<void>;
  Subscribe: (eventName: "viewChanged", handler: () => void) => void;
  Unsubscribe: (eventName: "viewChanged", handler: () => void) => void;
};

type ViewerLoadState = "loading" | "ready" | "error";
type ViewerErrorKind = "fetch" | "parse" | "render" | "unsupported";

interface ViewerError {
  kind: ViewerErrorKind;
  message: string;
}

function normalizeExtension(extension: string): string {
  return extension.trim().toLowerCase();
}

function errorMessageFor(error: unknown, fallbackKind: ViewerErrorKind): ViewerError {
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

  const fitDrawing = useCallback(() => {
    const viewer = viewerRef.current;
    const bounds = viewer?.GetBounds();
    const origin = viewer?.GetOrigin();
    if (!viewer || !bounds || !origin) return;

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
    let onViewChanged: (() => void) | null = null;

    const load = async () => {
      setLoadState("loading");
      setError(null);
      setProgress("Dosya alınıyor");

      try {
        const response = await fetch(accessUrl, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`Dosya indirilemedi (HTTP ${response.status}).`);
        }

        const dxfText = await response.text();
        if (!dxfText.trim()) {
          throw new Error("DXF dosyası boş.");
        }
        objectUrl = URL.createObjectURL(new Blob([dxfText], { type: "application/dxf" }));

        setProgress("Görüntüleyici hazırlanıyor");
        const dxfModule = await import("dxf-viewer");
        if (!active || !containerRef.current) return;

        viewer = new dxfModule.DxfViewer(containerRef.current, {
          autoResize: true,
          clearAlpha: 1,
          antialias: true,
          colorCorrection: true,
          blackWhiteInversion: true,
        }) as DxfViewerInstance;

        if (!viewer.HasRenderer()) {
          throw new Error("WebGL görüntüleyicisi başlatılamadı.");
        }

        onViewChanged = () => {
          if (active) setViewRevision((revision) => revision + 1);
        };
        viewer.Subscribe("viewChanged", onViewChanged);
        viewerRef.current = viewer;

        await viewer.Load({
          url: objectUrl,
          workerFactory: () => new Worker(new URL("./dxf-viewer-worker.ts", import.meta.url), { type: "module" }),
          progressCbk: (phase) => {
            if (!active) return;
            const phaseLabels = {
              fetch: "Dosya alınıyor",
              parse: "DXF verisi okunuyor",
              prepare: "Geometri hazırlanıyor",
              font: "Yazılar hazırlanıyor",
            } as const;
            setProgress(phaseLabels[phase]);
          },
        });

        if (!active) return;
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
      if (viewer && onViewChanged) viewer.Unsubscribe("viewChanged", onViewChanged);
      viewer?.Destroy();
      if (viewerRef.current === viewer) viewerRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessUrl, fitDrawing, retryKey]);

  const handleDownload = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100" data-testid="cad-dxf-viewer">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="truncate font-bold text-amber-300">DXF görüntüleyici</span>
          <span className="hidden text-zinc-500 sm:inline">{formatBytes(sizeBytes)}</span>
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
