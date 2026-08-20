"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ApsDwgViewerProps {
  fileId: string;
  displayName: string;
  sizeBytes: number;
  accessUrl: string;
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

export function ApsDwgViewer({ fileId, displayName, sizeBytes, accessUrl }: ApsDwgViewerProps) {
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
    const observer = new ResizeObserver(() => viewer?.resize());
    observer.observe(containerRef.current);

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
