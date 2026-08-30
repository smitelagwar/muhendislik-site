"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  fetchCadWithDeadline,
  readCadResponseWithinLimit,
  convertedDxfDisplayName,
} from "@/lib/dokumantasyon/cad-runtime/io";
import {
  DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
  DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
} from "@/lib/dokumantasyon/dwg/runtime-policy";
import { resolveCadPreviewCapabilities } from "@/lib/dokumantasyon/cad-runtime/capabilities";
import { DokCadUpstreamViewer } from "./cad-upstream-viewer";
import { DwgLegacyConversionFallback } from "./dwg-legacy-conversion-fallback";
import { ApsOnlyDwgViewer } from "./aps-only-dwg-viewer";
import { DwfLocalViewer } from "./dwf-local-viewer";

const CurrentCadViewer = lazy(async () => {
  const viewerModule = await import("./cad-viewer");
  return { default: viewerModule.DokCadViewer };
});

export interface DokCadRuntimeOrchestratorProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
  onViewerFailure?: (reason: string) => void;
}

type DwgEngine = "fast-resolving" | "fast-upstream" | "upstream" | "current-fallback" | "aps";
type DxfEngine = "upstream" | "current";

type CachedDxf = {
  url: string;
  sizeBytes: number;
  decision: "PASS" | "WARN";
};

function normalizeExtension(extension: string): string {
  const value = extension.trim().toLowerCase();
  if (!value) return "";
  return value.startsWith(".") ? value : `.${value}`;
}

export function DokCadRuntimeOrchestrator(props: DokCadRuntimeOrchestratorProps) {
  const extension = normalizeExtension(props.extension);

  if (extension === ".dwg") {
    return <DwgRuntimeOrchestrator key={`${props.fileId}:${props.accessUrl}`} {...props} />;
  }
  if (extension === ".dxf") {
    return <DxfRuntimeOrchestrator key={`${props.fileId}:${props.accessUrl}`} {...props} />;
  }
  if (extension === ".dwf") {
    return (
      <DwfLocalViewer
        key={`${props.fileId}:${props.accessUrl}`}
        accessUrl={props.accessUrl}
        displayName={props.displayName}
        sizeBytes={props.sizeBytes}
        onViewerFailure={props.onViewerFailure}
      />
    );
  }

  return (
    <Suspense fallback={<CadRuntimeLoading engine="legacy" label="CAD fallback hazırlanıyor" />}>
      <CurrentCadViewer {...props} />
    </Suspense>
  );
}

function DxfRuntimeOrchestrator(props: DokCadRuntimeOrchestratorProps) {
  const [engine, setEngine] = useState<DxfEngine>("upstream");
  const [upstreamFailure, setUpstreamFailure] = useState<string | null>(null);

  const useCurrent = useCallback((reason: string) => {
    if (reason.includes("USER_CANCELLED") || reason.includes("AbortError")) {
      return;
    }
    setUpstreamFailure(reason);
    setEngine("current");
  }, []);

  if (engine === "upstream") {
    return (
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-cad-runtime="orchestrator"
        data-cad-engine="upstream"
        data-cad-source="original-dxf"
        data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("upstream"))}
        data-fast-path="not-applicable-dxf"
      >
        <DokCadUpstreamViewer
          {...props}
          onViewerFailure={useCurrent}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 w-full min-w-0"
      data-cad-runtime="orchestrator"
      data-cad-engine="legacy"
      data-cad-source="original-dxf"
      data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("legacy"))}
      data-upstream-failure={upstreamFailure ?? "unknown"}
    >
      <Suspense fallback={<CadRuntimeLoading engine="legacy" label="Mevcut DXF viewer hazırlanıyor" />}>
        <CurrentCadViewer
          {...props}
          onViewerFailure={(reason) => props.onViewerFailure?.(`CURRENT_DXF_FAILED:${reason}`)}
        />
      </Suspense>
    </div>
  );
}

function DwgRuntimeOrchestrator(props: DokCadRuntimeOrchestratorProps) {
  const { accessUrl, displayName, fileId, sizeBytes } = props;
  const [engine, setEngine] = useState<DwgEngine>("fast-resolving");
  const [cachedDxf, setCachedDxf] = useState<CachedDxf | null>(null);
  const [transitionReason, setTransitionReason] = useState<string>("INITIAL");
  const objectUrlRef = useRef<string | null>(null);

  const revokeCachedUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const resolveFastCache = async () => {
      try {
        const response = await fetchCadWithDeadline(
          `/api/dokumantasyon/files/${fileId}/dwg-dxf`,
          { cache: "no-store" },
          controller.signal,
          DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS,
          "FAST_CACHE_TIMEOUT"
        );
        if (!active) return;

        if (!response.ok || response.status !== 200) {
          setTransitionReason(`FAST_CACHE_MISS_HTTP_${response.status}`);
          setEngine("upstream");
          return;
        }

        const buffer = await readCadResponseWithinLimit(
          response,
          DWG_BROWSER_DXF_HARD_LIMIT_BYTES,
          "FAST_CACHE_DXF_LIMIT"
        );
        if (!active) return;

        revokeCachedUrl();
        const url = URL.createObjectURL(new Blob([buffer], { type: "application/dxf" }));
        objectUrlRef.current = url;
        setCachedDxf({
          url,
          sizeBytes: buffer.byteLength,
          decision: response.headers.get("X-DWG-DXF-Decision") === "WARN" ? "WARN" : "PASS",
        });
        setTransitionReason("FAST_CACHE_HIT");
        setEngine("fast-upstream");
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setTransitionReason(error instanceof Error ? `FAST_CACHE_FAILED:${error.message}` : "FAST_CACHE_FAILED");
        setEngine("upstream");
      }
    };

    void resolveFastCache();
    return () => {
      active = false;
      controller.abort("FAST_CACHE_UNMOUNT");
    };
  }, [fileId, revokeCachedUrl]);

  useEffect(() => () => revokeCachedUrl(), [revokeCachedUrl]);

  const advanceFromFastRender = useCallback((reason: string) => {
    revokeCachedUrl();
    setTransitionReason(`FAST_RENDER_FAILED:${reason}`);
    setEngine("upstream");
  }, [revokeCachedUrl]);

  const advanceFromUpstream = useCallback((reason: string) => {
    if (reason.includes("USER_CANCELLED") || reason.includes("AbortError")) {
      return;
    }
    setTransitionReason(`UPSTREAM_FAILED:${reason}`);
    setEngine("current-fallback");
  }, []);

  const advanceFromCurrent = useCallback((reason: string) => {
    setTransitionReason(`CURRENT_FALLBACK_FAILED:${reason}`);
    setEngine("aps");
  }, []);

  if (engine === "fast-resolving") {
    return <CadRuntimeLoading engine="fast" label="Hızlı DWG cache kontrol ediliyor" reason={transitionReason} />;
  }

  if (engine === "fast-upstream" && cachedDxf) {
    return (
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-cad-runtime="orchestrator"
        data-cad-engine="upstream"
        data-cad-source="cached-dxf"
        data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("upstream"))}
        data-fast-source="cached-dxf"
        data-fast-decision={cachedDxf.decision}
      >
        <DokCadUpstreamViewer
          accessUrl={cachedDxf.url}
          displayName={convertedDxfDisplayName(displayName)}
          fileId={fileId}
          extension=".dxf"
          sizeBytes={cachedDxf.sizeBytes}
          onViewerFailure={advanceFromFastRender}
        />
      </div>
    );
  }

  if (engine === "upstream") {
    return (
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-cad-runtime="orchestrator"
        data-cad-engine="upstream"
        data-cad-source="original-dwg"
        data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("upstream"))}
        data-transition-reason={transitionReason}
      >
        <DokCadUpstreamViewer
          {...props}
          extension=".dwg"
          onViewerFailure={advanceFromUpstream}
        />
      </div>
    );
  }

  if (engine === "current-fallback") {
    return (
      <div
        className="h-full min-h-0 w-full min-w-0"
        data-cad-runtime="orchestrator"
        data-cad-engine="legacy"
        data-cad-source="original-dwg"
        data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("legacy"))}
        data-transition-reason={transitionReason}
      >
        <DwgLegacyConversionFallback
          accessUrl={accessUrl}
          displayName={displayName}
          fileId={fileId}
          sizeBytes={sizeBytes}
          onTerminalFailure={advanceFromCurrent}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 w-full min-w-0"
      data-cad-runtime="orchestrator"
      data-cad-engine="aps"
      data-cad-source="original-dwg"
      data-cad-capabilities={JSON.stringify(resolveCadPreviewCapabilities("aps"))}
      data-transition-reason={transitionReason}
    >
      <ApsOnlyDwgViewer
        fileId={fileId}
        displayName={displayName}
        sizeBytes={sizeBytes}
        accessUrl={accessUrl}
      />
    </div>
  );
}

function CadRuntimeLoading({ engine, label, reason }: { engine: string; label: string; reason?: string }) {
  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-3 bg-zinc-950 text-center text-zinc-100" data-cad-runtime="orchestrator" data-cad-engine={engine} data-transition-reason={reason}>
      <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">Her motor terminal süre sınırıyla çalışır.</p>
      </div>
    </section>
  );
}
