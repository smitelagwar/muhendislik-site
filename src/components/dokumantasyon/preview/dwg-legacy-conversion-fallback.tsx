"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  fetchCadWithDeadline,
  readCadResponseWithinLimit,
  convertedDxfDisplayName,
} from "@/lib/dokumantasyon/cad-runtime/io";
import {
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
  DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
  DWG_BROWSER_WORKER_TIMEOUT_MS,
  isWithinByteLimit,
} from "@/lib/dokumantasyon/dwg/runtime-policy";
import { DWG_DXF_WORKER_ASSET_URL } from "@/lib/dokumantasyon/dwg/signature";

const CurrentCadViewer = lazy(async () => {
  const module = await import("./cad-viewer");
  return { default: module.DokCadViewer };
});

interface DwgLegacyConversionFallbackProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  sizeBytes: number;
  onTerminalFailure: (reason: string) => void;
}

interface DwgWorkerResponse {
  requestId: string;
  ok: boolean;
  decision?: "PASS" | "WARN" | "REJECT";
  dxfBuffer?: ArrayBuffer;
  dxfBytes?: number;
  errorCode?: string;
  errorMessage?: string;
}

type ConvertedDxf = {
  url: string;
  sizeBytes: number;
  decision: "PASS" | "WARN";
};

export function DwgLegacyConversionFallback({
  accessUrl,
  displayName,
  fileId,
  sizeBytes,
  onTerminalFailure,
}: DwgLegacyConversionFallbackProps) {
  const [converted, setConverted] = useState<ConvertedDxf | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let active = true;
    let worker: Worker | null = null;
    let timeoutId: number | null = null;
    let terminalSent = false;

    const fail = (reason: string) => {
      if (!active || terminalSent) return;
      terminalSent = true;
      worker?.terminate();
      worker = null;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = null;
      onTerminalFailure(reason.replace(/[\r\n]+/gu, " ").slice(0, 220));
    };

    const run = async () => {
      if (!isWithinByteLimit(sizeBytes, DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES)) {
        fail("LEGACY_CONVERSION_OUTSIDE_BROWSER_BUDGET");
        return;
      }

      try {
        const sourceResponse = await fetchCadWithDeadline(
          accessUrl,
          { cache: "no-store" },
          abortController.signal,
          DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS,
          "LEGACY_SOURCE_FETCH_TIMEOUT"
        );
        if (!sourceResponse.ok) {
          fail(`LEGACY_DWG_FETCH_${sourceResponse.status}`);
          return;
        }

        const sourceBuffer = await readCadResponseWithinLimit(
          sourceResponse,
          DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES,
          "LEGACY_SOURCE_LIMIT_EXCEEDED"
        );
        if (!active) return;

        const requestId = crypto.randomUUID();
        worker = new Worker(DWG_DXF_WORKER_ASSET_URL, { type: "module" });
        timeoutId = window.setTimeout(() => fail("LEGACY_WORKER_TIMEOUT"), DWG_BROWSER_WORKER_TIMEOUT_MS);
        worker.onerror = () => fail("LEGACY_WORKER_RUNTIME_ERROR");
        worker.onmessageerror = () => fail("LEGACY_WORKER_MESSAGE_ERROR");
        worker.onmessage = (event: MessageEvent<DwgWorkerResponse>) => {
          if (!active || terminalSent) return;
          const result = event.data;
          if (!result || result.requestId !== requestId) return;

          if (
            !result.ok ||
            !(result.dxfBuffer instanceof ArrayBuffer) ||
            (result.decision !== "PASS" && result.decision !== "WARN")
          ) {
            fail(result.errorCode || result.errorMessage || "LEGACY_CONVERSION_REJECTED");
            return;
          }

          if (
            !isWithinByteLimit(result.dxfBuffer.byteLength, DWG_BROWSER_DXF_HARD_LIMIT_BYTES) ||
            (typeof result.dxfBytes === "number" && result.dxfBytes !== result.dxfBuffer.byteLength)
          ) {
            fail("LEGACY_DXF_SIZE_INVALID");
            return;
          }

          if (timeoutId !== null) window.clearTimeout(timeoutId);
          timeoutId = null;
          worker?.terminate();
          worker = null;

          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          const url = URL.createObjectURL(new Blob([result.dxfBuffer], { type: "application/dxf" }));
          objectUrlRef.current = url;
          setConverted({
            url,
            sizeBytes: result.dxfBuffer.byteLength,
            decision: result.decision,
          });
        };

        worker.postMessage({ requestId, buffer: sourceBuffer }, [sourceBuffer]);
      } catch (error) {
        if (!active || abortController.signal.aborted) return;
        fail(error instanceof Error ? `LEGACY_CONVERSION_FAILED:${error.message}` : "LEGACY_CONVERSION_FAILED");
      }
    };

    void run();

    return () => {
      active = false;
      abortController.abort("LEGACY_CONVERSION_UNMOUNT");
      worker?.terminate();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [accessUrl, fileId, onTerminalFailure, sizeBytes]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  if (!converted) {
    return (
      <section className="flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-3 bg-zinc-950 text-center text-zinc-100" data-cad-engine="current-conversion">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <div>
          <p className="text-sm font-semibold">Mevcut DWG fallback hazırlanıyor</p>
          <p className="mt-1 text-xs text-zinc-400">Tarayıcı dönüşümü yalnız upstream başarısız olduktan sonra çalışır.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="h-full min-h-0 w-full min-w-0" data-cad-engine="current-viewer" data-legacy-decision={converted.decision}>
      <Suspense fallback={<LegacyViewerLoading />}>
        <CurrentCadViewer
          accessUrl={converted.url}
          displayName={convertedDxfDisplayName(displayName)}
          fileId={fileId}
          extension=".dxf"
          sizeBytes={converted.sizeBytes}
          onViewerFailure={(reason) => onTerminalFailure(`LEGACY_DXF_RENDER_FAILED:${reason}`)}
        />
      </Suspense>
    </div>
  );
}

function LegacyViewerLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-100">
      <Loader2 className="h-7 w-7 animate-spin text-amber-400" />
    </div>
  );
}
