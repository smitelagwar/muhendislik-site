"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
  DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
  DWG_BROWSER_WORKER_TIMEOUT_MS,
  isWithinByteLimit,
  parsePositiveContentLength,
} from "@/lib/dokumantasyon/dwg/runtime-policy";
import { DWG_DXF_WORKER_ASSET_URL } from "@/lib/dokumantasyon/dwg/signature";
import { formatBytes } from "../ui-helpers";

const APS_VIEWER_VERSION = "7.108.0";
const APS_VIEWER_BASE_URL = `https://developer.api.autodesk.com/modelderivative/v2/viewers/${APS_VIEWER_VERSION}`;

const ResolvedDxfCadViewer = lazy(async () => {
  const cadViewerModule = await import("./cad-viewer");
  return { default: cadViewerModule.DokCadViewer };
});

type DwgStatus = "pending" | "uploading" | "translating" | "ready" | "failed";
type FastPathSource = "cache" | "worker";
type FastPathState =
  | { kind: "resolving" }
  | { kind: "dxf"; url: string; sizeBytes: number; source: FastPathSource; decision: "PASS" | "WARN" }
  | { kind: "aps"; reason: string };

interface DwgApiResponse {
  provider?: "aps";
  isAvailable?: boolean;
  status?: DwgStatus;
  urn?: string;
  viewerToken?: string;
  errorCode?: string;
  errorMessage?: string;
  error?: string;
}

interface DwgWorkerResponse {
  requestId: string;
  ok: boolean;
  fallback?: boolean;
  decision?: "PASS" | "WARN" | "REJECT";
  dxfBuffer?: ArrayBuffer;
  dxfBytes?: number;
  errorCode?: string;
  errorMessage?: string;
}

interface AutodeskDocumentNode {
  getRoot: () => { getDefaultGeometry: () => unknown };
}

interface AutodeskViewerInstance {
  start: () => number;
  loadDocumentNode: (document: AutodeskDocumentNode, geometry: unknown) => Promise<unknown>;
  finish: () => void;
  resize: () => void;
  fitToView: () => void;
}

interface AutodeskViewingApi {
  Initializer: (options: { env: string; accessToken: string }, callback: () => void) => void;
  GuiViewer3D: new (element: HTMLDivElement) => AutodeskViewerInstance;
  Document: {
    load: (
      urn: string,
      onSuccess: (document: AutodeskDocumentNode) => void,
      onError: (code: number) => void
    ) => void;
  };
}

declare global {
  interface Window {
    Autodesk?: { Viewing: AutodeskViewingApi };
  }
}

interface ApsDwgViewerProps {
  fileId: string;
  displayName: string;
  sizeBytes: number;
  accessUrl: string;
}

class DwgFastPathError extends Error {
  public constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "DwgFastPathError";
  }
}

function convertedDxfName(displayName: string): string {
  return displayName.replace(/\.dwg$/iu, "") + ".dxf";
}

function statusText(status: DwgStatus): string {
  if (status === "uploading") return "Autodesk APS'ye aktarılıyor";
  if (status === "translating") return "CAD görünümü oluşturuluyor";
  if (status === "ready") return "Hazır";
  return "DWG hazırlanıyor";
}

function downloadFile(accessUrl: string, displayName: string): void {
  const link = document.createElement("a");
  link.href = accessUrl;
  link.download = displayName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function fetchWithDeadline(
  input: RequestInfo | URL,
  init: RequestInit,
  parentSignal: AbortSignal,
  timeoutMs: number,
  timeoutCode: string
): Promise<Response> {
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
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new DwgFastPathError(timeoutCode, `İstek ${timeoutMs} ms sınırını aştı.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    parentSignal.removeEventListener("abort", forwardAbort);
  }
}

async function readResponseWithinLimit(
  response: Response,
  maxBytes: number,
  limitCode: string
): Promise<ArrayBuffer> {
  const declaredLength = parsePositiveContentLength(response.headers.get("Content-Length"));
  if (declaredLength !== null && declaredLength > maxBytes) {
    throw new DwgFastPathError(limitCode, `Yanıt ${declaredLength} bayt ile browser sınırını aşıyor.`);
  }

  if (declaredLength !== null || !response.body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new DwgFastPathError(limitCode, `Yanıt ${buffer.byteLength} bayt ile browser sınırını aşıyor.`);
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
      if (totalBytes > maxBytes) {
        await reader.cancel("DWG_BROWSER_BODY_LIMIT_EXCEEDED");
        throw new DwgFastPathError(limitCode, `Streaming yanıt ${maxBytes} bayt browser sınırını aştı.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

function loadApsViewerAssets(): Promise<void> {
  if (window.Autodesk?.Viewing) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>('script[data-aps-viewer="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("APS Viewer betiği yüklenemedi.")), { once: true });
    });
  }

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `${APS_VIEWER_BASE_URL}/style.min.css`;
  stylesheet.dataset.apsViewer = "true";
  document.head.appendChild(stylesheet);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${APS_VIEWER_BASE_URL}/viewer3D.min.js`;
    script.async = true;
    script.dataset.apsViewer = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("APS Viewer betiği yüklenemedi."));
    document.head.appendChild(script);
  });
}

export function ApsDwgViewer(props: ApsDwgViewerProps) {
  return <DwgToDxfViewer {...props} />;
}

function DwgToDxfViewer({ fileId, displayName, sizeBytes, accessUrl }: ApsDwgViewerProps) {
  const [fastPath, setFastPath] = useState<FastPathState>({ kind: "resolving" });

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    let worker: Worker | null = null;
    let objectUrl: string | null = null;
    let timeoutId: number | null = null;

    const chooseAps = (reason: string) => {
      if (!active) return;
      worker?.terminate();
      worker = null;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = null;
      setFastPath({ kind: "aps", reason });
    };

    const exposeDxf = (
      bytes: ArrayBuffer,
      source: FastPathSource,
      decision: "PASS" | "WARN"
    ) => {
      if (!active) return;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = null;
      worker?.terminate();
      worker = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/dxf" }));
      setFastPath({
        kind: "dxf",
        url: objectUrl,
        sizeBytes: bytes.byteLength,
        source,
        decision,
      });
    };

    const run = async () => {
      setFastPath({ kind: "resolving" });

      // Cache lookup is intentionally first. Only Stage 3 PASS/WARN derivatives
      // can be returned by this endpoint. Cache failure is non-fatal, but a cache
      // derivative that is too large is routed to APS before allocating it.
      try {
        const cached = await fetchWithDeadline(
          `/api/dokumantasyon/files/${fileId}/dwg-dxf`,
          { cache: "no-store" },
          abortController.signal,
          DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
          "CACHE_FETCH_TIMEOUT"
        );
        if (!active) return;
        if (cached.ok && cached.status === 200) {
          const buffer = await readResponseWithinLimit(
            cached,
            DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
            "CACHE_DXF_LIMIT_EXCEEDED"
          );
          if (!active) return;
          if (buffer.byteLength > 0) {
            const headerDecision = cached.headers.get("X-DWG-DXF-Decision");
            exposeDxf(buffer, "cache", headerDecision === "WARN" ? "WARN" : "PASS");
            return;
          }
        }
      } catch (error) {
        if (!active || abortController.signal.aborted) return;
        if (error instanceof DwgFastPathError && error.code === "CACHE_DXF_LIMIT_EXCEEDED") {
          chooseAps(error.code);
          return;
        }
        // Cache availability and cache timeouts must never make a locally
        // convertible DWG fail. Continue to the bounded Worker path.
      }

      // Source byte size remains only a hard safety ceiling, not a complexity score.
      if (!isWithinByteLimit(sizeBytes, DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES)) {
        chooseAps("WORKLOAD_OUTSIDE_BROWSER_BUDGET");
        return;
      }

      try {
        const sourceResponse = await fetchWithDeadline(
          accessUrl,
          { cache: "no-store" },
          abortController.signal,
          DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
          "SOURCE_FETCH_TIMEOUT"
        );
        if (!sourceResponse.ok) {
          chooseAps(`DWG_FETCH_${sourceResponse.status}`);
          return;
        }
        const sourceBuffer = await readResponseWithinLimit(
          sourceResponse,
          DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
          "SOURCE_BYTES_OUTSIDE_BROWSER_BUDGET"
        );
        if (!active) return;
        if (!isWithinByteLimit(sourceBuffer.byteLength, DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES)) {
          chooseAps("SOURCE_BYTES_OUTSIDE_BROWSER_BUDGET");
          return;
        }

        const requestId = crypto.randomUUID();
        worker = new Worker(DWG_DXF_WORKER_ASSET_URL, { type: "module" });
        timeoutId = window.setTimeout(() => {
          chooseAps("WORKER_TIMEOUT");
        }, DWG_BROWSER_WORKER_TIMEOUT_MS);

        worker.onerror = () => chooseAps("WORKER_RUNTIME_ERROR");
        worker.onmessageerror = () => chooseAps("WORKER_MESSAGE_ERROR");
        worker.onmessage = (event: MessageEvent<DwgWorkerResponse>) => {
          if (!active) return;
          const result = event.data;
          if (!result || result.requestId !== requestId) return;

          if (
            result.ok &&
            result.dxfBuffer instanceof ArrayBuffer &&
            (result.decision === "PASS" || result.decision === "WARN")
          ) {
            if (
              !isWithinByteLimit(result.dxfBuffer.byteLength, DWG_BROWSER_DXF_HARD_LIMIT_BYTES) ||
              (typeof result.dxfBytes === "number" && result.dxfBytes !== result.dxfBuffer.byteLength)
            ) {
              chooseAps("WORKER_DXF_SIZE_MISMATCH");
              return;
            }
            exposeDxf(result.dxfBuffer, "worker", result.decision);
            return;
          }
          chooseAps(result.errorCode || "FIDELITY_OR_CONVERSION_FALLBACK");
        };

        worker.postMessage({ requestId, buffer: sourceBuffer }, [sourceBuffer]);
      } catch (error) {
        if (!active || abortController.signal.aborted) return;
        chooseAps(error instanceof DwgFastPathError
          ? error.code
          : error instanceof Error
            ? error.message
            : "FAST_PATH_FAILED");
      }
    };

    void run();

    return () => {
      active = false;
      abortController.abort();
      worker?.terminate();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [accessUrl, fileId, sizeBytes]);

  if (fastPath.kind === "aps") {
    return (
      <div className="h-full min-h-0 w-full min-w-0" data-dwg-dxf-fallback={fastPath.reason}>
        <ApsFallbackViewer
          fileId={fileId}
          displayName={displayName}
          sizeBytes={sizeBytes}
          accessUrl={accessUrl}
        />
      </div>
    );
  }

  if (fastPath.kind === "dxf") {
    return (
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-testid="cad-dwg-dxf-orchestrator"
        data-dwg-dxf-source={fastPath.source}
        data-dwg-dxf-decision={fastPath.decision}
      >
        <Suspense fallback={<DwgFastPathLoading label="DXF görüntüleyici hazırlanıyor" />}>
          <ResolvedDxfCadViewer
            accessUrl={fastPath.url}
            displayName={convertedDxfName(displayName)}
            fileId={fileId}
            extension=".dxf"
            sizeBytes={fastPath.sizeBytes}
          />
        </Suspense>
      </div>
    );
  }

  return <DwgFastPathLoading label="DWG → DXF önizleme hazırlanıyor" />;
}

function DwgFastPathLoading({ label }: { label: string }) {
  return (
    <section
      className="flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-3 bg-zinc-950 text-center text-zinc-100"
      data-testid="cad-dwg-dxf-loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">Doğruluk denetimi başarısız olursa APS otomatik devreye girer.</p>
      </div>
    </section>
  );
}

function ApsFallbackViewer({ fileId, displayName, sizeBytes, accessUrl }: ApsDwgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<AutodeskViewerInstance | null>(null);
  const [status, setStatus] = useState<DwgStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{ urn: string; token: string } | null>(null);

  const requestStatus = useCallback(async (): Promise<DwgApiResponse> => {
    const response = await fetch(`/api/dokumantasyon/files/${fileId}/cad`, { cache: "no-store" });
    const data = (await response.json()) as DwgApiResponse;
    if (!response.ok) throw new Error(data.error || "DWG durumu alınamadı.");
    return data;
  }, [fileId]);

  const startTranslation = useCallback(async (retry: boolean) => {
    setStatus("uploading");
    setError(null);
    const response = await fetch(`/api/dokumantasyon/files/${fileId}/cad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retry }),
    });
    const data = (await response.json()) as DwgApiResponse;
    if (!response.ok || data.status === "failed") {
      setStatus("failed");
      setError(data.errorMessage || data.error || "DWG dönüşümü başlatılamadı.");
      return;
    }
    if (data.status) setStatus(data.status);
    if (data.status === "ready" && data.urn && data.viewerToken) {
      setViewerData({ urn: data.urn, token: data.viewerToken });
    }
  }, [fileId]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const data = await requestStatus();
        if (!active) return;
        if (data.status === "failed") {
          setStatus("failed");
          setError(data.errorMessage || data.error || "DWG görüntüleme kullanılamıyor.");
          return;
        }
        if (data.status === "ready" && data.urn && data.viewerToken) {
          setStatus("ready");
          setViewerData({ urn: data.urn, token: data.viewerToken });
          return;
        }
        await startTranslation(false);
      } catch (requestError: unknown) {
        if (!active) return;
        setStatus("failed");
        setError(requestError instanceof Error ? requestError.message : "DWG durumu alınamadı.");
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [requestStatus, startTranslation]);

  useEffect(() => {
    if (status !== "translating" && status !== "uploading") return;
    const interval = window.setInterval(async () => {
      try {
        const data = await requestStatus();
        if (data.status) setStatus(data.status);
        if (data.status === "ready" && data.urn && data.viewerToken) {
          setViewerData({ urn: data.urn, token: data.viewerToken });
        }
        if (data.status === "failed") setError(data.errorMessage || data.error || "DWG dönüşümü tamamlanamadı.");
      } catch (pollError: unknown) {
        setStatus("failed");
        setError(pollError instanceof Error ? pollError.message : "DWG durumu alınamadı.");
      }
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [requestStatus, status]);

  useEffect(() => {
    if (!viewerData || !containerRef.current) return;
    let disposed = false;
    let viewer: AutodeskViewerInstance | null = null;
    const container = containerRef.current;
    const observer = new ResizeObserver(() => viewer?.resize());
    const onContextLost = (event: Event) => {
      event.preventDefault();
      if (disposed) return;
      viewer?.finish();
      disposed = true;
      setViewerData(null);
      setStatus("failed");
      setError("WebGL bağlamı kayboldu. Görünümü tekrar deneyin veya dosyayı indirin.");
    };
    observer.observe(container);
    container.addEventListener("webglcontextlost", onContextLost, true);

    const mount = async () => {
      try {
        await loadApsViewerAssets();
        if (disposed || !containerRef.current || !window.Autodesk?.Viewing) return;
        const viewing = window.Autodesk.Viewing;
        viewing.Initializer({ env: "AutodeskProduction", accessToken: viewerData.token }, () => {
          if (disposed || !containerRef.current) return;
          viewer = new viewing.GuiViewer3D(containerRef.current);
          viewerRef.current = viewer;
          if (viewer.start() > 0) {
            setStatus("failed");
            setError("APS Viewer başlatılamadı.");
            return;
          }
          viewing.Document.load(
            `urn:${viewerData.urn}`,
            (document) => {
              if (!viewer || disposed) return;
              void viewer.loadDocumentNode(document, document.getRoot().getDefaultGeometry()).then(() => viewer?.fitToView());
            },
            () => {
              if (!disposed) {
                setStatus("failed");
                setError("APS CAD görünümü yüklenemedi.");
              }
            }
          );
        });
      } catch (viewerError: unknown) {
        if (!disposed) {
          setStatus("failed");
          setError(viewerError instanceof Error ? viewerError.message : "APS Viewer yüklenemedi.");
        }
      }
    };
    void mount();

    return () => {
      disposed = true;
      observer.disconnect();
      container.removeEventListener("webglcontextlost", onContextLost, true);
      viewer?.finish();
      viewerRef.current = null;
    };
  }, [viewerData]);

  const retry = useCallback(() => { void startTranslation(true); }, [startTranslation]);
  const download = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);

  return (
    <section className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-zinc-950 text-zinc-100" data-testid="cad-dwg-viewer">
      <div ref={containerRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden" data-testid="cad-dwg-canvas" />

      {status !== "ready" && status !== "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/95 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">{statusText(status)}</p>
            <p className="mt-1 text-xs text-zinc-400">{status === "pending" ? "Dönüşüm işi sıraya alınıyor" : "Gerçek APS işlem durumu bekleniyor"}</p>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-5">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-red-400" />
            <h2 className="mt-3 text-base font-bold text-red-200">DWG açılamadı</h2>
            <dl className="mt-4 space-y-1 text-left text-xs text-zinc-300">
              <div><dt className="inline text-zinc-500">Dosya: </dt><dd className="inline break-all">{displayName}</dd></div>
              <div><dt className="inline text-zinc-500">Boyut: </dt><dd className="inline">{formatBytes(sizeBytes)}</dd></div>
              <div><dt className="inline text-zinc-500">Sebep: </dt><dd className="inline">{error || "Bilinmeyen hata"}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={retry} className="bg-amber-500 text-zinc-950 hover:bg-amber-400"><RefreshCw className="mr-2 h-4 w-4" />Tekrar dene</Button>
              <Button variant="outline" onClick={download} className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"><Download className="mr-2 h-4 w-4" />Dosyayı indir</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
