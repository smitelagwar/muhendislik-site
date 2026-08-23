"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCadWithDeadline } from "@/lib/dokumantasyon/cad-runtime/io";
import {
  DWG_APS_STATUS_REQUEST_TIMEOUT_MS,
  DWG_APS_TRANSLATION_TIMEOUT_MS,
  DWG_APS_VIEWER_LOAD_TIMEOUT_MS,
} from "@/lib/dokumantasyon/dwg/runtime-policy";
import { formatBytes } from "../ui-helpers";

const APS_VIEWER_VERSION = "7.108.0";
const APS_VIEWER_BASE_URL = `https://developer.api.autodesk.com/modelderivative/v2/viewers/${APS_VIEWER_VERSION}`;

type DwgStatus = "pending" | "uploading" | "translating" | "ready" | "failed";

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

interface ApsOnlyDwgViewerProps {
  fileId: string;
  displayName: string;
  sizeBytes: number;
  accessUrl: string;
}

function statusText(status: DwgStatus): string {
  if (status === "uploading") return "Autodesk APS'ye aktarılıyor";
  if (status === "translating") return "APS CAD görünümü oluşturuluyor";
  if (status === "ready") return "APS Viewer hazırlanıyor";
  return "APS fallback hazırlanıyor";
}

function downloadFile(accessUrl: string, displayName: string): void {
  const link = document.createElement("a");
  link.href = accessUrl;
  link.download = displayName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

export function ApsOnlyDwgViewer({ fileId, displayName, sizeBytes, accessUrl }: ApsOnlyDwgViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const translationStartedAtRef = useRef<number | null>(null);
  const [status, setStatus] = useState<DwgStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{ urn: string; token: string } | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const requestStatus = useCallback(async (signal: AbortSignal): Promise<DwgApiResponse> => {
    const response = await fetchCadWithDeadline(
      `/api/dokumantasyon/files/${fileId}/cad`,
      { cache: "no-store" },
      signal,
      DWG_APS_STATUS_REQUEST_TIMEOUT_MS,
      "APS_STATUS_TIMEOUT"
    );
    const data = (await response.json()) as DwgApiResponse;
    if (!response.ok) throw new Error(data.error || "DWG APS durumu alınamadı.");
    return data;
  }, [fileId]);

  const startTranslation = useCallback(async (retry: boolean, signal: AbortSignal) => {
    translationStartedAtRef.current = Date.now();
    setStatus("uploading");
    setError(null);
    setViewerData(null);

    const response = await fetchCadWithDeadline(
      `/api/dokumantasyon/files/${fileId}/cad`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retry }),
      },
      signal,
      DWG_APS_STATUS_REQUEST_TIMEOUT_MS,
      "APS_START_TIMEOUT"
    );
    const data = (await response.json()) as DwgApiResponse;
    if (!response.ok || data.status === "failed") {
      throw new Error(data.errorMessage || data.error || "DWG APS dönüşümü başlatılamadı.");
    }
    if (data.status) setStatus(data.status);
    if (data.status === "ready" && data.urn && data.viewerToken) {
      setViewerData({ urn: data.urn, token: data.viewerToken });
    }
  }, [fileId]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const initialize = async () => {
      try {
        if (retryKey > 0) {
          await startTranslation(true, controller.signal);
          return;
        }

        const data = await requestStatus(controller.signal);
        if (!active) return;
        if (data.status === "failed") {
          setStatus("failed");
          setError(data.errorMessage || data.error || "DWG APS görüntüleme kullanılamıyor.");
          return;
        }
        if (data.status === "ready" && data.urn && data.viewerToken) {
          setStatus("ready");
          setViewerData({ urn: data.urn, token: data.viewerToken });
          return;
        }
        await startTranslation(false, controller.signal);
      } catch (requestError: unknown) {
        if (!active || controller.signal.aborted) return;
        setStatus("failed");
        setError(requestError instanceof Error ? requestError.message : "DWG APS durumu alınamadı.");
      }
    };

    void initialize();
    return () => {
      active = false;
      controller.abort("APS_INITIALIZE_UNMOUNT");
    };
  }, [requestStatus, retryKey, startTranslation]);

  useEffect(() => {
    if (status !== "translating" && status !== "uploading") return;

    const controller = new AbortController();
    let active = true;
    let pollTimer: number | null = null;
    const startedAt = translationStartedAtRef.current ?? Date.now();
    translationStartedAtRef.current = startedAt;
    const remaining = Math.max(0, DWG_APS_TRANSLATION_TIMEOUT_MS - (Date.now() - startedAt));

    const hardDeadline = window.setTimeout(() => {
      if (!active) return;
      controller.abort("APS_TRANSLATION_TIMEOUT");
      setStatus("failed");
      setError(`APS çevirisi ${Math.round(DWG_APS_TRANSLATION_TIMEOUT_MS / 1000)} saniye içinde tamamlanmadı.`);
    }, remaining);

    const poll = async () => {
      try {
        const data = await requestStatus(controller.signal);
        if (!active) return;
        if (data.status) setStatus(data.status);
        if (data.status === "ready" && data.urn && data.viewerToken) {
          setViewerData({ urn: data.urn, token: data.viewerToken });
          return;
        }
        if (data.status === "failed") {
          setError(data.errorMessage || data.error || "DWG APS dönüşümü tamamlanamadı.");
          return;
        }
        pollTimer = window.setTimeout(() => void poll(), 5_000);
      } catch (pollError: unknown) {
        if (!active || controller.signal.aborted) return;
        setStatus("failed");
        setError(pollError instanceof Error ? pollError.message : "DWG APS durumu alınamadı.");
      }
    };

    pollTimer = window.setTimeout(() => void poll(), 5_000);

    return () => {
      active = false;
      controller.abort("APS_POLL_UNMOUNT");
      window.clearTimeout(hardDeadline);
      if (pollTimer !== null) window.clearTimeout(pollTimer);
    };
  }, [requestStatus, status]);

  useEffect(() => {
    if (!viewerData || !containerRef.current) return;

    let disposed = false;
    let terminal = false;
    let viewer: AutodeskViewerInstance | null = null;
    const container = containerRef.current;
    const observer = new ResizeObserver(() => viewer?.resize());
    observer.observe(container);
    setViewerLoading(true);

    const failViewer = (message: string) => {
      if (disposed || terminal) return;
      terminal = true;
      viewer?.finish();
      setViewerLoading(false);
      setStatus("failed");
      setError(message);
    };

    const viewerDeadline = window.setTimeout(() => {
      failViewer(`APS Viewer ${Math.round(DWG_APS_VIEWER_LOAD_TIMEOUT_MS / 1000)} saniye içinde açılamadı.`);
    }, DWG_APS_VIEWER_LOAD_TIMEOUT_MS);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      failViewer("WebGL bağlamı kayboldu. Görünümü tekrar deneyin veya dosyayı indirin.");
    };
    container.addEventListener("webglcontextlost", onContextLost, true);

    const mount = async () => {
      try {
        await loadApsViewerAssets();
        if (disposed || terminal || !containerRef.current || !window.Autodesk?.Viewing) return;
        const viewing = window.Autodesk.Viewing;
        viewing.Initializer({ env: "AutodeskProduction", accessToken: viewerData.token }, () => {
          if (disposed || terminal || !containerRef.current) return;
          viewer = new viewing.GuiViewer3D(containerRef.current);
          if (viewer.start() > 0) {
            failViewer("APS Viewer başlatılamadı.");
            return;
          }
          viewing.Document.load(
            `urn:${viewerData.urn}`,
            (document) => {
              if (!viewer || disposed || terminal) return;
              void viewer
                .loadDocumentNode(document, document.getRoot().getDefaultGeometry())
                .then(() => {
                  if (disposed || terminal) return;
                  window.clearTimeout(viewerDeadline);
                  viewer?.fitToView();
                  setViewerLoading(false);
                })
                .catch(() => failViewer("APS CAD geometry yüklenemedi."));
            },
            () => failViewer("APS CAD görünümü yüklenemedi.")
          );
        });
      } catch (viewerError: unknown) {
        failViewer(viewerError instanceof Error ? viewerError.message : "APS Viewer yüklenemedi.");
      }
    };
    void mount();

    return () => {
      disposed = true;
      window.clearTimeout(viewerDeadline);
      observer.disconnect();
      container.removeEventListener("webglcontextlost", onContextLost, true);
      viewer?.finish();
    };
  }, [viewerData]);

  const retry = useCallback(() => {
    translationStartedAtRef.current = null;
    setRetryKey((key) => key + 1);
  }, []);
  const download = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);
  const isLoading = status !== "failed" && (status !== "ready" || viewerLoading);

  return (
    <section className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-zinc-950 text-zinc-100" data-testid="cad-dwg-aps-only" data-cad-engine="aps" data-aps-status={status}>
      <div ref={containerRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden" data-testid="cad-dwg-canvas" />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/95 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">{statusText(status)}</p>
            <p className="mt-1 text-xs text-zinc-400">Son fallback terminal süre sınırlarıyla çalışıyor.</p>
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
