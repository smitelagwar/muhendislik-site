"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "../ui-helpers";

const APS_VIEWER_VERSION = "7.108.0";
const APS_VIEWER_BASE_URL = `https://developer.api.autodesk.com/modelderivative/v2/viewers/${APS_VIEWER_VERSION}`;
const DWF_VIEWER_LOAD_TIMEOUT_MS = 45_000;

type DwfStatus = "loading" | "ready" | "failed";

interface DwfViewerInstance {
  start: () => number;
  loadExtension: (extensionId: string) => Promise<unknown>;
  loadModel: (
    url: string,
    options?: Record<string, unknown>,
    onSuccess?: () => void,
    onError?: (code: number, message?: string) => void
  ) => unknown;
  finish: () => void;
  resize: () => void;
  fitToView: () => void;
}

interface AutodeskDwfViewingApi {
  Initializer: (options: { env: "Local" }, callback: () => void) => void;
  GuiViewer3D: new (element: HTMLDivElement) => DwfViewerInstance;
}

type AutodeskWindow = Window & {
  Autodesk?: { Viewing: AutodeskDwfViewingApi };
};

interface DwfLocalViewerProps {
  accessUrl: string;
  displayName: string;
  sizeBytes: number;
  onViewerFailure?: (reason: string) => void;
}

function autodeskViewing(): AutodeskDwfViewingApi | undefined {
  return (window as AutodeskWindow).Autodesk?.Viewing;
}

function loadApsViewerAssets(): Promise<void> {
  if (autodeskViewing()) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>('script[data-aps-viewer="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      if (autodeskViewing()) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Autodesk Viewer betiği yüklenemedi.")), { once: true });
    });
  }

  if (!document.querySelector('link[data-aps-viewer-style="true"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = `${APS_VIEWER_BASE_URL}/style.min.css`;
    stylesheet.dataset.apsViewerStyle = "true";
    document.head.appendChild(stylesheet);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${APS_VIEWER_BASE_URL}/viewer3D.min.js`;
    script.async = true;
    script.dataset.apsViewer = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Autodesk Viewer betiği yüklenemedi."));
    document.head.appendChild(script);
  });
}

function downloadFile(accessUrl: string, displayName: string): void {
  const link = document.createElement("a");
  link.href = accessUrl;
  link.download = displayName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function DwfLocalViewer({ accessUrl, displayName, sizeBytes, onViewerFailure }: DwfLocalViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<DwfStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let terminal = false;
    let viewer: DwfViewerInstance | null = null;
    const observer = new ResizeObserver(() => viewer?.resize());
    observer.observe(container);

    const fail = (reason: string) => {
      if (disposed || terminal) return;
      terminal = true;
      viewer?.finish();
      setStatus("failed");
      setError(reason);
      onViewerFailure?.(reason);
    };

    const deadline = window.setTimeout(() => {
      fail(`DWF Viewer ${Math.round(DWF_VIEWER_LOAD_TIMEOUT_MS / 1000)} saniye içinde açılamadı.`);
    }, DWF_VIEWER_LOAD_TIMEOUT_MS);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      fail("WebGL bağlamı kayboldu. DWF görünümünü yeniden deneyin.");
    };
    container.addEventListener("webglcontextlost", onContextLost, true);

    const mount = async () => {
      try {
        await loadApsViewerAssets();
        if (disposed || terminal) return;

        const viewing = autodeskViewing();
        if (!viewing) {
          fail("Autodesk Viewer API yüklenemedi.");
          return;
        }

        viewing.Initializer({ env: "Local" }, () => {
          if (disposed || terminal || !containerRef.current) return;
          viewer = new viewing.GuiViewer3D(containerRef.current);
          if (viewer.start() > 0) {
            fail("Autodesk DWF Viewer başlatılamadı.");
            return;
          }

          void viewer.loadExtension("Autodesk.DWF")
            .then(() => {
              if (disposed || terminal || !viewer) return;
              viewer.loadModel(
                accessUrl,
                {},
                () => {
                  if (disposed || terminal || !viewer) return;
                  terminal = true;
                  window.clearTimeout(deadline);
                  viewer.fitToView();
                  setStatus("ready");
                },
                (code, message) => fail(`DWF modeli yüklenemedi (${code}${message ? `: ${message}` : ""}).`)
              );
            })
            .catch(() => fail("Autodesk.DWF extension yüklenemedi."));
        });
      } catch (loadError: unknown) {
        fail(loadError instanceof Error ? loadError.message : "DWF Viewer yüklenemedi.");
      }
    };

    void mount();

    return () => {
      disposed = true;
      window.clearTimeout(deadline);
      observer.disconnect();
      container.removeEventListener("webglcontextlost", onContextLost, true);
      viewer?.finish();
    };
  }, [accessUrl, onViewerFailure, retryKey]);

  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setRetryKey((value) => value + 1);
  }, []);
  const download = useCallback(() => downloadFile(accessUrl, displayName), [accessUrl, displayName]);

  return (
    <section
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-zinc-950 text-zinc-100"
      data-testid="cad-dwf-local"
      data-cad-runtime="orchestrator"
      data-cad-engine="autodesk-dwf-local"
      data-dwf-status={status}
    >
      <div ref={containerRef} className="h-full min-h-0 w-full min-w-0 overflow-hidden" data-testid="cad-dwf-canvas" />

      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/95 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">DWF görünümü hazırlanıyor</p>
            <p className="mt-1 text-xs text-zinc-400">Autodesk.DWF yerel viewer extension kullanılıyor.</p>
          </div>
        </div>
      )}

      {status === "failed" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-5">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-red-400" />
            <h2 className="mt-3 text-base font-bold text-red-200">DWF açılamadı</h2>
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
