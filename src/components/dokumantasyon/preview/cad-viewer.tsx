"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Compass, Download, Layers3, Loader2, RotateCcw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeDxfBytes, detectDxfEncoding, type DxfEncodingResolution } from "@/lib/dokumantasyon/dxf-encoding";
import {
  auditDxfText,
  getDxfFidelityWarnings,
  getDxfStage2BlockingIssues,
  type DxfFidelityAudit,
} from "@/lib/dokumantasyon/dxf-fidelity-audit";
import {
  buildDxfLayerRuntimeSnapshot,
  fitVisibleDxfLayers,
  initializeDxfLayerRuntime,
  normalizeDxfLayersForInteractiveControl,
  resetDxfLayersToSource,
  setAllDxfLayersVisible,
  setDxfLayerVisible,
  type DxfLayerBounds,
  type DxfLayerRuntimeItem,
} from "@/lib/dokumantasyon/dxf-layer-runtime";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "@/lib/dokumantasyon/dxf-release-hardening";
import {
  DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
  DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES,
  DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS,
  isWithinDxfByteLimit,
  parseDxfContentLength,
} from "@/lib/dokumantasyon/dxf-runtime-policy";
import {
  auditDxfStage3,
  getDxfStage3BlockingIssues,
  getDxfStage3Warnings,
  normalizeDxfTextForStage3Rendering,
} from "@/lib/dokumantasyon/dxf-stage3-fidelity";
import {
  auditDxfStage4,
  getDxfStage4BlockingIssues,
  getDxfStage4Warnings,
  normalizeDxfForStage4Rendering,
  validateDxfStage4ViewerSnapshot,
  type DxfStage4ViewerSnapshot,
} from "@/lib/dokumantasyon/dxf-stage4-fidelity";
import {
  buildDxfStage5DiagnosticsReport,
  type DxfStage5DiagnosticsReport,
} from "@/lib/dokumantasyon/dxf-stage5-diagnostics";
import {
  auditDxfTextRenderSource,
  auditParsedDxfText,
  evaluateDxfTextRenderEvidence,
  probeDxfFontUrls,
  type DxfTextRenderEvidence,
} from "@/lib/dokumantasyon/dxf-text-render-audit";
import { formatBytes } from "../ui-helpers";
import { StudioCommandButton } from "../studio/studio-command-button";
import { DxfDiagnosticsButton, DxfDiagnosticsPanel } from "./dxf-diagnostics-panel";
import { DxfLayerPanel } from "./dxf-layer-panel";

const DXF_FONT_URLS = ["/fonts/Arial-Regular.ttf", "/fonts/Arial-Bold.ttf"];

export interface DokCadViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
  onViewerFailure?: (reason: string) => void;
}

type DxfViewerMessage = { message?: string; level?: string };
type DxfLayerInfo = { name: string; displayName: string; color: number };
type DxfCamera = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  zoom: number;
  position: { x: number; y: number; z: number };
};

type DxfViewerInstance = {
  Destroy: () => void;
  FitView: (minX: number, maxX: number, minY: number, maxY: number, padding?: number) => void;
  GetBounds: () => { maxX: number; maxY: number; minX: number; minY: number } | null;
  GetCamera: () => DxfCamera;
  GetDxf?: () => unknown;
  GetLayers: (nonEmptyOnly?: boolean) => Iterable<DxfLayerInfo>;
  GetOrigin: () => { x: number; y: number };
  HasRenderer: () => boolean;
  Load: (params: {
    url: string;
    fonts?: string[];
    progressCbk?: (phase: "font" | "fetch" | "parse" | "prepare") => void;
    workerFactory?: () => Worker;
  }) => Promise<void>;
  ShowLayer: (name: string, show: boolean) => void;
  Subscribe: (eventName: "viewChanged" | "message", handler: (event: CustomEvent<DxfViewerMessage>) => void) => void;
  Unsubscribe: (eventName: "viewChanged" | "message", handler: (event: CustomEvent<DxfViewerMessage>) => void) => void;
  hasMissingChars?: boolean;
  parsedDxf?: unknown;
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

function uniqueMessages(messages: string[]): string[] {
  return [...new Set(messages.filter(Boolean))];
}

async function fetchDxfSourceBytes(accessUrl: string, parentSignal: AbortSignal): Promise<ArrayBuffer> {
  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => controller.abort(parentSignal.reason);

  if (parentSignal.aborted) {
    forwardAbort();
  } else {
    parentSignal.addEventListener("abort", forwardAbort, { once: true });
  }

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(accessUrl, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      throw new DxfViewerLoadError("fetch", `Dosya indirilemedi (HTTP ${response.status}).`);
    }

    const declaredLength = parseDxfContentLength(response.headers.get("Content-Length"));
    if (declaredLength !== null && !isWithinDxfByteLimit(declaredLength)) {
      throw new DxfViewerLoadError(
        "fetch",
        `DXF dosyası browser güvenlik sınırını aşıyor (${declaredLength} > ${DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES} bayt).`
      );
    }

    if (!response.body) {
      const buffer = await response.arrayBuffer();
      if (!isWithinDxfByteLimit(buffer.byteLength)) {
        throw new DxfViewerLoadError("fetch", "DXF dosya boyutu browser güvenlik sınırının dışında.");
      }
      return buffer;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value?.byteLength) continue;
        totalBytes += value.byteLength;
        if (totalBytes > DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES) {
          await reader.cancel("DXF_BROWSER_SOURCE_HARD_LIMIT_EXCEEDED");
          throw new DxfViewerLoadError("fetch", "DXF akışı browser güvenlik sınırını aştı.");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    if (!isWithinDxfByteLimit(totalBytes)) {
      throw new DxfViewerLoadError("parse", "DXF dosyası boş veya geçersiz boyutta.");
    }

    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return merged.buffer;
  } catch (error) {
    if (timedOut) {
      throw new DxfViewerLoadError(
        "fetch",
        `DXF kaynağı ${Math.round(DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS / 1000)} saniye içinde alınamadı.`
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    parentSignal.removeEventListener("abort", forwardAbort);
  }
}

function captureViewerSnapshot(
  viewer: DxfViewerInstance,
  container: HTMLElement,
  visibleLocalBounds: DxfLayerBounds | null = null,
  layerNames?: string[]
): DxfStage4ViewerSnapshot {
  const origin = viewer.GetOrigin();
  const camera = viewer.GetCamera();
  const bounds = visibleLocalBounds && origin
    ? {
        minX: visibleLocalBounds.minX + origin.x,
        maxX: visibleLocalBounds.maxX + origin.x,
        minY: visibleLocalBounds.minY + origin.y,
        maxY: visibleLocalBounds.maxY + origin.y,
      }
    : viewer.GetBounds();

  return {
    viewport: {
      width: container.clientWidth,
      height: container.clientHeight,
    },
    bounds,
    origin,
    camera: camera
      ? {
          left: camera.left,
          right: camera.right,
          top: camera.top,
          bottom: camera.bottom,
          zoom: camera.zoom,
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
        }
      : null,
    layers: layerNames ?? [...viewer.GetLayers()].map((layer) => layer.name),
  };
}

export function DokCadViewer({ accessUrl, displayName, fileId, extension, sizeBytes, onViewerFailure }: DokCadViewerProps) {
  const normalizedExtension = normalizeExtension(extension);

  if (normalizedExtension !== ".dxf") {
    return <DwgDownloadFallback accessUrl={accessUrl} displayName={displayName} extension={extension} sizeBytes={sizeBytes} />;
  }

  return (
    <DxfViewer
      key={`${fileId}:${accessUrl}`}
      accessUrl={accessUrl}
      displayName={displayName}
      fileId={fileId}
      sizeBytes={sizeBytes}
      onViewerFailure={onViewerFailure}
    />
  );
}

function DxfViewer({
  accessUrl,
  displayName,
  fileId,
  sizeBytes,
  onViewerFailure,
}: Pick<DokCadViewerProps, "accessUrl" | "displayName" | "fileId" | "sizeBytes" | "onViewerFailure">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DxfViewerInstance | null>(null);
  const layerRuntimeRef = useRef<DxfLayerRuntimeItem[]>([]);
  const [loadState, setLoadState] = useState<ViewerLoadState>("loading");
  const [progress, setProgress] = useState("Dosya alınıyor");
  const [error, setError] = useState<ViewerError | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [viewRevision, setViewRevision] = useState(0);
  const [encodingResolution, setEncodingResolution] = useState<DxfEncodingResolution | null>(null);
  const [fidelityAudit, setFidelityAudit] = useState<DxfFidelityAudit | null>(null);
  const [fidelityWarnings, setFidelityWarnings] = useState<string[]>([]);
  const [viewerWarnings, setViewerWarnings] = useState<string[]>([]);
  const [diagnosticsReport, setDiagnosticsReport] = useState<DxfStage5DiagnosticsReport | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<DxfStage4ViewerSnapshot | null>(null);
  const [textRenderEvidence, setTextRenderEvidence] = useState<DxfTextRenderEvidence | null>(null);
  const [layerRuntime, setLayerRuntime] = useState<DxfLayerRuntimeItem[]>([]);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [layerQuery, setLayerQuery] = useState("");

  const layerSnapshot = useMemo(() => buildDxfLayerRuntimeSnapshot(layerRuntime), [layerRuntime]);

  const commitLayerRuntime = useCallback((next: DxfLayerRuntimeItem[]) => {
    layerRuntimeRef.current = next;
    setLayerRuntime(next);
    setViewRevision((revision) => revision + 1);
  }, []);

  const fitDrawing = useCallback(() => {
    const viewer = viewerRef.current;
    const container = containerRef.current;
    if (!viewer || !container) return;

    const currentLayers = layerRuntimeRef.current;
    if (currentLayers.length > 0) {
      const visibleBounds = fitVisibleDxfLayers(viewer, currentLayers, 0.1);
      if (visibleBounds) {
        setRuntimeSnapshot(
          captureViewerSnapshot(
            viewer,
            container,
            visibleBounds,
            currentLayers.filter((layer) => layer.visible).map((layer) => layer.name)
          )
        );
        return;
      }
      if (currentLayers.every((layer) => !layer.visible)) return;
    }

    const bounds = viewer.GetBounds();
    const origin = viewer.GetOrigin();
    if (!bounds || !origin || !hasFiniteBounds(bounds)) return;

    viewer.FitView(
      bounds.minX - origin.x,
      bounds.maxX - origin.x,
      bounds.minY - origin.y,
      bounds.maxY - origin.y,
      0.1
    );
    setRuntimeSnapshot(captureViewerSnapshot(viewer, container));
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    let viewer: DxfViewerInstance | null = null;
    let renderWorker: Worker | null = null;
    let viewerLoadTimeoutId: number | null = null;
    let objectUrl: string | null = null;
    let onViewChanged: ((event: CustomEvent<DxfViewerMessage>) => void) | null = null;
    let onViewerMessage: ((event: CustomEvent<DxfViewerMessage>) => void) | null = null;
    const capturedViewerWarnings: string[] = [];
    const container = containerRef.current;

    const failViewer = (viewerError: ViewerError) => {
      if (!active) return;
      renderWorker?.terminate();
      renderWorker = null;
      if (viewerLoadTimeoutId !== null) window.clearTimeout(viewerLoadTimeoutId);
      viewerLoadTimeoutId = null;
      viewer?.Destroy();
      if (viewerRef.current === viewer) viewerRef.current = null;
      setError(viewerError);
      setLoadState("error");
      onViewerFailure?.(`${viewerError.kind}:${viewerError.message}`);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (!active) return;
      abortController.abort();
      failViewer({ kind: "render", message: "WebGL bağlamı kayboldu. Görünümü tekrar deneyin veya dosyayı indirin." });
    };
    container?.addEventListener("webglcontextlost", onContextLost, true);

    const load = async () => {
      setLoadState("loading");
      setError(null);
      setEncodingResolution(null);
      setFidelityAudit(null);
      setFidelityWarnings([]);
      setViewerWarnings([]);
      setDiagnosticsReport(null);
      setDiagnosticsOpen(false);
      setRuntimeSnapshot(null);
      setTextRenderEvidence(null);
      layerRuntimeRef.current = [];
      setLayerRuntime([]);
      setLayerPanelOpen(false);
      setLayerQuery("");
      setProgress("Dosya alınıyor");

      try {
        const dxfBuffer = await fetchDxfSourceBytes(accessUrl, abortController.signal);
        if (!active) return;

        setProgress("DXF kaynağı doğrulanıyor");
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

        setProgress("DXF doğruluk denetimleri çalışıyor");
        const audit = auditDxfText(dxfText);
        const stage3Audit = auditDxfStage3(dxfText);
        const stage4Audit = auditDxfStage4(dxfText);
        const releaseHardeningAudit = auditDxfReleaseHardening(dxfText);
        const textSourceAudit = auditDxfTextRenderSource(dxfText);
        const fontProbes = textSourceAudit.renderCandidateTextRecords > 0
          ? await probeDxfFontUrls(DXF_FONT_URLS, abortController.signal)
          : [];
        const stage3Normalization = normalizeDxfTextForStage3Rendering(dxfText);
        const stage4Normalization = normalizeDxfForStage4Rendering(stage3Normalization.text);
        const interactiveLayerNormalization = normalizeDxfLayersForInteractiveControl(stage4Normalization.text);
        const stage2BlockingIssues = getDxfStage2BlockingIssues(audit);
        const stage3BlockingIssues = getDxfStage3BlockingIssues(stage3Audit);
        const stage4BlockingIssues = getDxfStage4BlockingIssues(stage4Audit);
        const releaseHardeningBlockingIssues = getDxfReleaseHardeningBlockingIssues(releaseHardeningAudit);
        const blockingIssues = [
          ...stage2BlockingIssues,
          ...stage3BlockingIssues,
          ...stage4BlockingIssues,
          ...releaseHardeningBlockingIssues,
        ];
        const stage4Warnings = getDxfStage4Warnings(stage4Audit).filter(
          (warning) => !warning.includes("kapalı layer") && !warning.includes("frozen layer")
        );
        const normalizationWarnings = [
          ...(stage3Normalization.stackedFractionFallbackCount > 0
            ? [`${stage3Normalization.stackedFractionFallbackCount} MTEXT stacked fraction görünür plain-text biçimine dönüştürüldü.`]
            : []),
        ];
        const preRenderWarnings = uniqueMessages([
          ...encoding.warnings,
          ...getDxfFidelityWarnings(audit),
          ...getDxfStage3Warnings(stage3Audit),
          ...stage4Warnings,
          ...normalizationWarnings,
          ...blockingIssues,
        ]);

        const preRenderDiagnostics = buildDxfStage5DiagnosticsReport({
          encoding,
          audit,
          stage3: stage3Audit,
          stage4: stage4Audit,
          releaseHardening: releaseHardeningAudit,
          stage2BlockingIssues,
          stage3BlockingIssues,
          stage4BlockingIssues,
          releaseHardeningBlockingIssues,
        });

        setFidelityAudit(audit);
        setFidelityWarnings(preRenderWarnings);
        setDiagnosticsReport(preRenderDiagnostics);

        if (blockingIssues.length > 0) {
          setDiagnosticsOpen(true);
          throw new DxfViewerLoadError(
            "unsupported",
            `DXF eksik render edileceği için görüntüleme durduruldu. ${blockingIssues.join(" ")}`
          );
        }

        objectUrl = URL.createObjectURL(new Blob([interactiveLayerNormalization.text], { type: "application/dxf;charset=utf-8" }));

        setProgress("Görüntüleyici modülü yükleniyor");
        const dxfModule = await import("dxf-viewer");
        const renderContainer = containerRef.current;
        if (!active || !renderContainer) return;
        if (renderContainer.clientWidth < 2 || renderContainer.clientHeight < 2) {
          throw new DxfViewerLoadError(
            "render",
            `DXF viewport boyutu geçersiz (${renderContainer.clientWidth}×${renderContainer.clientHeight}).`
          );
        }

        viewer = new dxfModule.DxfViewer(renderContainer, {
          autoResize: true,
          clearAlpha: 1,
          antialias: true,
          colorCorrection: true,
          blackWhiteInversion: true,
          fileEncoding: "utf-8",
          retainParsedDxf: textSourceAudit.renderCandidateTextRecords > 0,
          sceneOptions: {
            suppressPaperSpace: true,
          },
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
            if (message && !capturedViewerWarnings.includes(message)) capturedViewerWarnings.push(message);
            if (message) setViewerWarnings((current) => current.includes(message) ? current : [...current, message]);
          }
        };
        viewer.Subscribe("viewChanged", onViewChanged);
        viewer.Subscribe("message", onViewerMessage);
        viewerRef.current = viewer;

        let rejectWorkerFailure: ((reason: unknown) => void) | null = null;
        const workerFailurePromise = new Promise<never>((_, reject) => {
          rejectWorkerFailure = reject;
        });
        const timeoutPromise = new Promise<never>((_, reject) => {
          viewerLoadTimeoutId = window.setTimeout(() => {
            reject(new DxfViewerLoadError(
              "render",
              `DXF worker ${Math.round(DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS / 1000)} saniye içinde render hazırlığını tamamlayamadı.`
            ));
          }, DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS);
        });

        setProgress("DXF worker başlatılıyor");
        const viewerLoadPromise = viewer.Load({
          url: objectUrl,
          fonts: DXF_FONT_URLS,
          workerFactory: () => {
            const nextWorker = new Worker(new URL("./dxf-viewer-worker.ts", import.meta.url), { type: "module" });
            renderWorker = nextWorker;
            nextWorker.addEventListener("error", (event) => {
              rejectWorkerFailure?.(new DxfViewerLoadError(
                "render",
                event.message ? `DXF worker runtime hatası: ${event.message}` : "DXF worker runtime hatası oluştu."
              ));
            }, { once: true });
            nextWorker.addEventListener("messageerror", () => {
              rejectWorkerFailure?.(new DxfViewerLoadError("render", "DXF worker mesajı çözümlenemedi."));
            }, { once: true });
            return nextWorker;
          },
          progressCbk: (phase) => {
            if (!active) return;
            const phaseLabels = {
              fetch: "Normalize edilmiş DXF okunuyor",
              parse: "DXF yapısı parse ediliyor",
              prepare: "Layer, block, ölçü ve geometri hazırlanıyor",
              font: "TEXT/MTEXT glifleri hazırlanıyor",
            } as const;
            setProgress(phaseLabels[phase]);
          },
        });

        await Promise.race([viewerLoadPromise, workerFailurePromise, timeoutPromise]);
        if (viewerLoadTimeoutId !== null) window.clearTimeout(viewerLoadTimeoutId);
        viewerLoadTimeoutId = null;
        renderWorker?.terminate();
        renderWorker = null;

        if (!active) return;

        const parsedDxf = viewer.GetDxf?.() ?? viewer.parsedDxf;
        const parsedTextAudit = auditParsedDxfText(parsedDxf);
        const textEvidence = evaluateDxfTextRenderEvidence({
          source: textSourceAudit,
          parsed: parsedTextAudit,
          fontProbes,
          rendererMissingChars: viewer.hasMissingChars ?? null,
        });
        setTextRenderEvidence(textEvidence);
        viewer.parsedDxf = undefined;

        if (textEvidence.status === "blocking") {
          setDiagnosticsOpen(true);
          throw new DxfViewerLoadError(
            "render",
            `Metin fidelity doğrulaması başarısız. ${textEvidence.issues.join(" ")}`
          );
        }

        const runtimeLayers = initializeDxfLayerRuntime(viewer, stage4Audit);
        layerRuntimeRef.current = runtimeLayers;
        setLayerRuntime(runtimeLayers);

        let visibleBounds: DxfLayerBounds | null = null;
        if (runtimeLayers.length > 0) {
          visibleBounds = fitVisibleDxfLayers(viewer, runtimeLayers, 0.1);
        }
        if (!visibleBounds && !runtimeLayers.every((layer) => !layer.visible)) {
          const globalBounds = viewer.GetBounds();
          const origin = viewer.GetOrigin();
          if (globalBounds && origin && hasFiniteBounds(globalBounds)) {
            viewer.FitView(
              globalBounds.minX - origin.x,
              globalBounds.maxX - origin.x,
              globalBounds.minY - origin.y,
              globalBounds.maxY - origin.y,
              0.1
            );
          }
        }

        const initialVisibleLayerNames = runtimeLayers.length > 0
          ? runtimeLayers.filter((layer) => layer.visible).map((layer) => layer.name)
          : undefined;
        const snapshot = captureViewerSnapshot(viewer, renderContainer, visibleBounds, initialVisibleLayerNames);
        setRuntimeSnapshot(snapshot);
        const viewerValidation = validateDxfStage4ViewerSnapshot(stage4Audit, snapshot);
        const finalFidelityWarnings = uniqueMessages([
          ...preRenderWarnings,
          ...textEvidence.issues,
          ...viewerValidation.warnings,
          ...viewerValidation.blockingIssues,
          ...capturedViewerWarnings,
        ]);
        const finalDiagnostics = buildDxfStage5DiagnosticsReport({
          encoding,
          audit,
          stage3: stage3Audit,
          stage4: stage4Audit,
          releaseHardening: releaseHardeningAudit,
          stage2BlockingIssues,
          stage3BlockingIssues,
          stage4BlockingIssues,
          releaseHardeningBlockingIssues,
          viewerValidation,
          rendererWarnings: capturedViewerWarnings,
        });
        setFidelityWarnings(finalFidelityWarnings);
        setDiagnosticsReport(finalDiagnostics);

        if (viewerValidation.blockingIssues.length > 0) {
          setDiagnosticsOpen(true);
          throw new DxfViewerLoadError(
            "render",
            `DXF geometri/viewport doğrulaması başarısız. ${viewerValidation.blockingIssues.join(" ")}`
          );
        }

        setProgress("Hazır");
        setLoadState("ready");
      } catch (caughtError: unknown) {
        if (!active) return;
        if (abortController.signal.aborted && !(caughtError instanceof DxfViewerLoadError)) return;
        const kind: ViewerErrorKind = viewer ? "parse" : "fetch";
        failViewer(errorMessageFor(caughtError, kind));
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
      if (viewerLoadTimeoutId !== null) window.clearTimeout(viewerLoadTimeoutId);
      renderWorker?.terminate();
      container?.removeEventListener("webglcontextlost", onContextLost, true);
      if (viewer && onViewChanged) viewer.Unsubscribe("viewChanged", onViewChanged);
      if (viewer && onViewerMessage) viewer.Unsubscribe("message", onViewerMessage);
      viewer?.Destroy();
      if (viewerRef.current === viewer) viewerRef.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessUrl, fileId, onViewerFailure, retryKey]);

  const handleToggleLayer = useCallback((name: string, visible: boolean) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    commitLayerRuntime(setDxfLayerVisible(viewer, layerRuntimeRef.current, name, visible));
  }, [commitLayerRuntime]);

  const handleShowAllLayers = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    commitLayerRuntime(setAllDxfLayersVisible(viewer, layerRuntimeRef.current, true));
  }, [commitLayerRuntime]);

  const handleHideAllLayers = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    commitLayerRuntime(setAllDxfLayersVisible(viewer, layerRuntimeRef.current, false));
  }, [commitLayerRuntime]);

  const handleResetLayers = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    commitLayerRuntime(resetDxfLayersToSource(viewer, layerRuntimeRef.current));
  }, [commitLayerRuntime]);

  const handleDownload = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);
  const allWarnings = [...fidelityWarnings, ...viewerWarnings];

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-zinc-950 text-zinc-100" data-testid="cad-dxf-viewer" data-cad-file-id={fileId} data-cad-load-state={loadState} data-cad-progress={progress}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Compass className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="truncate font-bold text-amber-300">DXF görüntüleyici</span>
          <span className="hidden text-zinc-500 sm:inline">{formatBytes(sizeBytes)}</span>
          {fidelityAudit && (
            <span
              data-testid="cad-dxf-fidelity"
              className={diagnosticsReport?.status === "blocked" ? "hidden text-red-300 md:inline" : diagnosticsReport?.status === "warning" ? "hidden text-amber-300 md:inline" : "hidden text-emerald-400 md:inline"}
              title={allWarnings.join("\n")}
            >
              {fidelityAudit.entityCount} entity · {fidelityAudit.textEntityCount} yazı · {fidelityAudit.dimensionEntityCount} ölçü
              {encodingResolution ? ` · kaynak ${encodingResolution.encoding}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {diagnosticsReport && (
            <DxfDiagnosticsButton
              report={diagnosticsReport}
              open={diagnosticsOpen}
              onToggle={() => setDiagnosticsOpen((open) => !open)}
            />
          )}
          <StudioCommandButton
            commandId="cad.dxf.layers"
            onClick={() => setLayerPanelOpen((open) => !open)}
            disabled={loadState !== "ready" || layerRuntime.length === 0}
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            icon={<Layers3 className="h-3.5 w-3.5" />}
            label="Katmanlar"
          />
          <StudioCommandButton
            commandId="cad.dxf.fit"
            onClick={fitDrawing}
            disabled={loadState !== "ready" || layerSnapshot.allHidden}
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            icon={<ScanLine className="h-3.5 w-3.5" />}
            label="Sığdır"
          />
          <StudioCommandButton
            commandId="cad.dxf.reset"
            onClick={fitDrawing}
            disabled={loadState !== "ready" || layerSnapshot.allHidden}
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

      {diagnosticsOpen && diagnosticsReport && <DxfDiagnosticsPanel report={diagnosticsReport} />}
      {textRenderEvidence && textRenderEvidence.source.renderCandidateTextRecords > 0 && (
        <div
          data-testid="cad-dxf-text-evidence"
          data-status={textRenderEvidence.status}
          className={textRenderEvidence.status === "blocking"
            ? "shrink-0 border-b border-red-500/30 bg-red-950/30 px-3 py-1.5 text-[11px] text-red-200"
            : textRenderEvidence.status === "warning"
              ? "shrink-0 border-b border-amber-500/20 bg-amber-950/20 px-3 py-1.5 text-[11px] text-amber-200"
              : "shrink-0 border-b border-emerald-500/20 bg-emerald-950/15 px-3 py-1.5 text-[11px] text-emerald-300"}
        >
          <span className="font-semibold">Metin denetimi:</span>{" "}
          kaynak {textRenderEvidence.source.renderCandidateTextRecords} · parser {textRenderEvidence.parsed?.totalTextRecords ?? "?"} · font {textRenderEvidence.fontProbes.filter((font) => font.ok).length}/{textRenderEvidence.fontProbes.length}
          {textRenderEvidence.rendererMissingChars === true ? " · eksik glyph" : ""}
          {textRenderEvidence.issues[0] ? ` · ${textRenderEvidence.issues[0]}` : ""}
        </div>
      )}
      {textRenderEvidence && (
        <output className="sr-only" data-testid="cad-dxf-text-render-evidence">
          {JSON.stringify(textRenderEvidence)}
        </output>
      )}
      {runtimeSnapshot && (
        <output className="sr-only" data-testid="cad-dxf-runtime-snapshot">
          {JSON.stringify(runtimeSnapshot)}
        </output>
      )}
      {layerRuntime.length > 0 && (
        <output className="sr-only" data-testid="cad-dxf-layer-snapshot">
          {JSON.stringify(layerSnapshot)}
        </output>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-view-revision={viewRevision}>
        <div ref={containerRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden" data-testid="cad-dxf-canvas" />

        {layerPanelOpen && loadState === "ready" && layerRuntime.length > 0 && (
          <DxfLayerPanel
            layers={layerRuntime}
            query={layerQuery}
            onQueryChange={setLayerQuery}
            onToggleLayer={handleToggleLayer}
            onShowAll={handleShowAllLayers}
            onHideAll={handleHideAllLayers}
            onResetSource={handleResetLayers}
            onClose={() => setLayerPanelOpen(false)}
          />
        )}

        {loadState === "ready" && layerSnapshot.allHidden && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-5" data-testid="cad-dxf-all-layers-hidden">
            <div className="pointer-events-auto rounded-2xl border border-zinc-800 bg-zinc-950/90 px-5 py-4 text-center shadow-xl backdrop-blur">
              <Layers3 className="mx-auto h-6 w-6 text-zinc-500" />
              <p className="mt-2 text-xs font-semibold text-zinc-200">Tüm katmanlar gizli</p>
              <button type="button" onClick={handleResetLayers} className="mt-2 text-[11px] font-medium text-amber-300 hover:text-amber-200">
                Kaynak görünürlüğüne dön
              </button>
            </div>
          </div>
        )}

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
          <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-zinc-950 p-5">
            <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
              <AlertCircle className="mx-auto h-9 w-9 text-red-400" />
              <h2 className="mt-3 text-base font-bold text-red-200">DXF açılamadı</h2>
              <dl className="mt-4 space-y-1 text-left text-xs text-zinc-300">
                <div><dt className="inline text-zinc-500">Dosya: </dt><dd className="inline break-all">{displayName}</dd></div>
                <div><dt className="inline text-zinc-500">Boyut: </dt><dd className="inline">{formatBytes(sizeBytes)}</dd></div>
                {encodingResolution && <div><dt className="inline text-zinc-500">Kaynak encoding: </dt><dd className="inline">{encodingResolution.encoding} ({encodingResolution.source})</dd></div>}
                <div><dt className="inline text-zinc-500">Sebep: </dt><dd className="inline">{error.kind} — {error.message}</dd></div>
                {textRenderEvidence && textRenderEvidence.source.renderCandidateTextRecords > 0 && (
                  <div><dt className="inline text-zinc-500">Metin: </dt><dd className="inline">kaynak {textRenderEvidence.source.renderCandidateTextRecords}, parser {textRenderEvidence.parsed?.totalTextRecords ?? "?"}, font {textRenderEvidence.fontProbes.filter((font) => font.ok).length}/{textRenderEvidence.fontProbes.length}.</dd></div>
                )}
                {diagnosticsReport && diagnosticsReport.blockingCount > 0 && (
                  <div><dt className="inline text-zinc-500">Fidelity engeli: </dt><dd className="inline">{diagnosticsReport.blockingCount} doğruluk problemi — ayrıntılar üstteki Denetim panelinde.</dd></div>
                )}
              </dl>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button onClick={() => setRetryKey((key) => key + 1)} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">Tekrar dene</Button>
                <Button variant="outline" onClick={handleDownload} className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">Orijinal dosyayı indir</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DwgDownloadFallback({ accessUrl, displayName, extension, sizeBytes }: Omit<DokCadViewerProps, "fileId" | "onViewerFailure">) {
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
