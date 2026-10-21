// ============================================================================
// DWG/DXF MOTOR V2 — HOST SHELL COMPONENT (G12)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G12), 28_PAN_ZOOM_FIT_SOZLESMESI.md
// ve 29_RENDER_VE_YASAM_DONGUSU.md
// Host state machine, error boundary, session/generation, iptal ve temiz unmount,
// 180s TTL / heartbeat, mobil dokunma izolasyonu, context loss recovery.

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Layers3,
  ShieldAlert,
  XCircle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { CadV2Canvas } from "./cad-v2-canvas";
import { CadV2Toolbar } from "./cad-v2-toolbar";
import { CadV2StatusBar } from "./cad-v2-statusbar";
import { CadV2LayerPanel } from "./cad-v2-layer-panel";
import { CadV2ViewSettingsPanel, type CadV2ViewSettings } from "./cad-v2-view-settings-panel";
import type { CadV2Renderer } from "@/lib/cad-v2/render/cad-v2-renderer";
import type { CadLayer, CadBBox2D } from "@/lib/cad-v2/canonical/types";
import type { CadCameraState } from "@/lib/cad-v2/interaction/d3-camera-adapter";
import { CadV2WorkerClient } from "@/lib/cad-v2/worker/worker-client";
import { applyCurveRefinementsToChunk } from "@/lib/cad-v2/worker/apply-curve-refinements";
import { applyRuntimeHatchFillRefinementToChunk } from "@/lib/cad-v2/worker/hatch-fill-refinement";
import { CoalescedHostUiUpdates } from "@/lib/cad-v2/render/coalesced-host-ui-updates";
import type { UnpackedSceneChunk } from "@/workers/cad-v2/cad-v2-scene-worker";
import {
  validateSceneManifest,
  type ValidatedSceneManifest,
} from "@/lib/cad-v2/protocol/binary-protocol";
import { hydrateSceneManifestIndexes } from "@/lib/cad-v2/protocol/manifest-index-pages";
import { formatBytes } from "../ui-helpers";
import { getCameraWorldViewportBBox, isChunkVisibleInCamera } from "@/lib/cad-v2/render/chunk-visibility";
import { evaluateVisibleHatchFillQuality } from "@/lib/cad-v2/render/hatch-fill-runtime-quality";
import {
  ChunkAdmissionRetryGate,
  LruChunkCache,
  prioritizeChunksByViewportCoverage,
} from "@/lib/cad-v2/cache/chunk-spatial-scheduler";
import { WeightedByteBudget } from "@/lib/cad-v2/worker/weighted-byte-budget";
import { CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR } from "@/lib/cad-v2/worker/overview-linework-compaction";
import {
  CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  estimateUnsharedRefinementSourceBytes,
  estimateUnpackedChunkCpuBytes,
  releaseUnusedCadV2PathDistances,
  selectAdditionalRetainedRefinementSourceBytes,
  tryAddSceneChunkWithinBudget,
} from "@/lib/cad-v2/render/chunk-memory-accounting";
import {
  estimateCurveRefinementMinimumPeakResources,
  estimateCurveRefinementPeakResources,
} from "@/lib/cad-v2/render/curve-refinement-memory-accounting";
import {
  estimateHatchFillRefinementMinimumPeakResources,
  estimateHatchFillRefinementPeakResources,
} from "@/lib/cad-v2/render/hatch-fill-refinement-memory-accounting";
import { CAD_V2_IN_FLIGHT_CHUNK_TRANSFER_BUDGET_BYTES } from "@/lib/cad-v2/worker/resource-budgets";

export interface CadV2HostShellProps {
  accessUrl?: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
  sourceVersionKey?: string;
  publicToken?: string;
  onBack?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onFallbackToLegacy?: () => void;
  onCompare?: () => void;
  isCompareMode?: boolean;
}

export type V2HostPhase =
  | "authorizing"
  | "preparing"
  | "loading"
  | "ready"
  | "degraded"
  | "cancelled"
  | "context-lost"
  | "error";

type CurveRefinementProfile = "transient" | "idle";
const HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX = 0.25;
const HATCH_FILL_RUNTIME_WARNING_PREFIX = "HATCH dolgu hassasiyeti";
class CadV2SceneIntegrityError extends Error {
  constructor(readonly code: "READY_SCENE_MISSING_OBJECT" | "SCENE_CHUNK_HASH_MISMATCH", message: string) {
    super(message);
    this.name = "CadV2SceneIntegrityError";
  }
}

class CadV2ChunkRequestError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "CadV2ChunkRequestError";
  }
}

const CHUNK_REQUEST_MAX_ATTEMPTS = 3;
const CHUNK_REQUEST_RETRY_BUDGET_MS = 6_000;

function getRetryAfterMs(value: string | null, nowMs: number): number {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);
  const retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? Math.max(0, retryAt - nowMs) : 0;
}

function getChunkRetryDelayMs(attempt: number, retryAfterMs: number, elapsedMs: number): number | null {
  const localBackoffMs = Math.min(1_000, 250 * 2 ** Math.max(0, attempt - 1)) + Math.floor(Math.random() * 101);
  const delayMs = Math.max(localBackoffMs, retryAfterMs);
  return elapsedMs + delayMs <= CHUNK_REQUEST_RETRY_BUDGET_MS ? delayMs : null;
}

function waitForChunkRetry(delayMs: number, signal: AbortSignal): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    const finish = (didWait: boolean) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve(didWait);
    };
    const onAbort = () => finish(false);
    const timer = setTimeout(() => finish(true), delayMs);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

type CadV2ResourceDiagnosticEvent = {
  type: "chunk-load-start" | "chunk-load-outcome" | "chunk-evicted" | "viewport-snapshot" |
    "hatch-fill-runtime-quality" | "hatch-fill-runtime-refinement";
  observedAtMs?: number;
  [key: string]: unknown;
};

function emitCadV2ResourceDiagnostic(event: CadV2ResourceDiagnosticEvent): void {
  if (typeof window === "undefined") return;
  const sink = (window as Window & {
    __cadV2ResourceDiagnostics?: (event: CadV2ResourceDiagnosticEvent) => void;
  }).__cadV2ResourceDiagnostics;
  if (typeof sink === "function") {
    try {
      sink({ ...event, observedAtMs: performance.now() });
    } catch {
      // Optional test diagnostics must never change renderer behavior.
    }
  }
}

function hasCadV2ResourceDiagnosticSink(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as Window & {
    __cadV2ResourceDiagnostics?: (event: CadV2ResourceDiagnosticEvent) => void;
  }).__cadV2ResourceDiagnostics === "function";
}

const CURVE_REFINEMENT_ERROR_CSS_PX: Record<CurveRefinementProfile, number> = {
  transient: 0.75,
  idle: 0.25,
};
const CURVE_REFINEMENT_DEBOUNCE_MS = 120;
  const CURVE_REFINEMENT_IDLE_DELAY_MS = 600;

export const CadV2HostShell: React.FC<CadV2HostShellProps> = ({
  accessUrl,
  displayName,
  fileId,
  extension,
  sizeBytes,
  sourceVersionKey,
  publicToken,
  onBack,
  onDownload,
  onShare,
  onFallbackToLegacy,
}) => {
  const [phase, setPhase] = useState<V2HostPhase>("preparing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnosticsWarning, setDiagnosticsWarningState] = useState<string | null>(null);
  const diagnosticsWarningRef = useRef<string | null>(null);
  const setDiagnosticsWarning = useCallback((warning: string | null) => {
    diagnosticsWarningRef.current = warning;
    setDiagnosticsWarningState(warning);
  }, []);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isPanActive, setIsPanActive] = useState<boolean>(true);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [entityCount, setEntityCount] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<string>("İşlem başlatılıyor...");
  const hostUiUpdatesRef = useRef<CoalescedHostUiUpdates | null>(null);
  const [hasInitialRenderedFrame, setHasInitialRenderedFrame] = useState(false);
  const [layouts, setLayouts] = useState<Array<{ layoutId: string; name: string; isModelSpace: boolean; bbox: CadBBox2D }>>([]);
  const [activeLayoutName, setActiveLayoutName] = useState<string>("Model");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setTheme, resolvedTheme } = useTheme();

  const [settings, setSettings] = useState<CadV2ViewSettings>({
    monochrome: false,
    showLineweights: true,
    background: "black",
  });

  useEffect(() => {
    const updates = new CoalescedHostUiUpdates((update) => {
      if (update.progress !== undefined) setLoadingProgress(update.progress);
      if (update.entityCount !== undefined) setEntityCount(update.entityCount);
    }, 100);
    hostUiUpdatesRef.current = updates;
    return () => {
      updates.dispose();
      if (hostUiUpdatesRef.current === updates) hostUiUpdatesRef.current = null;
    };
  }, []);

  const [layers, setLayers] = useState<Record<string, CadLayer>>({
    "0": {
      id: "0",
      name: "0",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 7 },
      lineweightMm: 0,
      linetypeName: "Continuous",
    },
  });

  const rendererRef = useRef<CadV2Renderer | null>(null);
  const resourceOwnerRef = useRef<{ ownerScene: string; generation: number }>({ ownerScene: "pending", generation: 0 });
  const workerClientRef = useRef<CadV2WorkerClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentViewSessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatAbortControllersRef = useRef<Set<AbortController>>(new Set());
  const isCancelledRef = useRef<boolean>(false);
  const generationRef = useRef<number>(1);
  const fitURef = useRef<number | null>(null);
  const layoutCameraStatesRef = useRef<Map<string, Pick<CadCameraState, "center" | "unitsPerCssPixel">>>(new Map());
  const layoutFitUnitsRef = useRef<Map<string, number>>(new Map());
  const layoutSwitchRevisionRef = useRef(0);
  const currentVersionKeyRef = useRef<string | undefined>(sourceVersionKey);
  const residentCacheRef = useRef<LruChunkCache<string> | null>(null);
  const withCacheEvictionContextRef = useRef<(
    reason: string,
    triggerChunkId: string | null,
    triggerLoadId: number | null,
    operation: () => string | null,
  ) => string | null>((_reason, _triggerChunkId, _triggerLoadId, operation) => operation());
  const startPrepareFlowRef = useRef<(revisionRepairCount?: number, sceneRepairCount?: number, sessionRefreshCount?: number) => Promise<void>>(() => Promise.resolve());
  const repairCountsRef = useRef({ revision: 0, scene: 0, session: 0 });
  const refinementChunksRef = useRef<Map<string, UnpackedSceneChunk>>(new Map());
  const refinementSourceBytesRef = useRef(0);
  const refinementSourceBudgetExceededRef = useRef(false);
    const refinedProfilesRef = useRef<Map<string, { bucket: number; attemptedErrorCssPixels: number; displayedErrorWorldUnits: number | null }>>(new Map());
  const hatchRefinedProfilesRef = useRef<Map<string, { bucket: number; attemptedErrorCssPixels: number; displayedErrorWorldUnits: number | null }>>(new Map());
  const refinementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refinementEpochRef = useRef(0);
  const refinementRunningRef = useRef(false);
  const refinementEnabledRef = useRef(false);
  const requestedRefinementBucketRef = useRef<number | null>(null);
  const latestCameraStateRef = useRef<CadCameraState | null>(null);
  const lastStablePhaseRef = useRef<"ready" | "degraded" | null>(null);
  const manifestQualityStatusRef = useRef<ValidatedSceneManifest["qualityStatus"] | null>(null);
  const contextRecoveryAttemptRef = useRef(0);
  const manifestChunksRef = useRef<ValidatedSceneManifest["chunks"]>([]);
  const resourceBudgetExceededRef = useRef(false);
  const requestRefinementRef = useRef<(state: CadCameraState) => void>(() => {});
  const loadVisibleChunksRef = useRef<(camera: CadCameraState, layoutId: string) => Promise<void>>(async () => {});
  const viewportChunkLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateHatchFillRuntimeQuality = useCallback((camera: CadCameraState) => {
    if (lastStablePhaseRef.current === null || manifestChunksRef.current.length === 0) return;
    const layoutId = rendererRef.current?.getActiveLayout() || "Model";
    const staticQuality = evaluateVisibleHatchFillQuality(
      manifestChunksRef.current,
      camera,
      layoutId,
      HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX,
    );
    const visibleChunks = manifestChunksRef.current.filter((chunk) =>
      chunk.layoutId === layoutId && isChunkVisibleInCamera(chunk.bbox, camera));
    const resolvedRuntimeErrorByChunk = new Map<string, number>();
    for (const chunk of visibleChunks) {
      const retained = refinementChunksRef.current.get(chunk.chunkId);
      if (!Array.isArray(retained?.meta?.hatchFillSources) || retained.meta.hatchFillSources.length === 0) continue;
      const displayedErrorWorld = hatchRefinedProfilesRef.current.get(chunk.chunkId)?.displayedErrorWorldUnits;
      if (displayedErrorWorld === null || displayedErrorWorld === undefined || !Number.isFinite(displayedErrorWorld)) continue;
      resolvedRuntimeErrorByChunk.set(chunk.chunkId, displayedErrorWorld / camera.unitsPerCssPixel);
    }
    const affectedChunkIds: string[] = [];
    const unverifiableChunkIds: string[] = [];
    let maxErrorCssPixels = 0;
    for (const chunk of visibleChunks) {
      const runtimeError = resolvedRuntimeErrorByChunk.get(chunk.chunkId);
      const staticError = chunk.maxHatchFillEncodedGeometryErrorWorld;
      if (runtimeError !== undefined) {
        maxErrorCssPixels = Math.max(maxErrorCssPixels, runtimeError);
        if (runtimeError > HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX * (1 + 1e-12)) affectedChunkIds.push(chunk.chunkId);
      } else if (staticError === undefined || !Number.isFinite(staticError) || staticError < 0) {
        unverifiableChunkIds.push(chunk.chunkId);
      } else {
        const errorCssPixels = staticError / camera.unitsPerCssPixel;
        maxErrorCssPixels = Math.max(maxErrorCssPixels, errorCssPixels);
        if (errorCssPixels > HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX * (1 + 1e-12)) affectedChunkIds.push(chunk.chunkId);
      }
    }
    const quality = {
      ...staticQuality,
      status: affectedChunkIds.length > 0 ? "over-budget" as const
        : unverifiableChunkIds.length > 0 ? "unverifiable" as const : "within-budget" as const,
      maxErrorCssPixels,
      affectedChunkIds,
      unverifiableChunkIds,
    };
    emitCadV2ResourceDiagnostic({
      type: "hatch-fill-runtime-quality",
      layoutId,
      unitsPerCssPixel: camera.unitsPerCssPixel,
      status: quality.status,
      targetErrorCssPixels: quality.targetErrorCssPixels,
      maxErrorCssPixels: quality.maxErrorCssPixels,
      affectedChunkIds: quality.affectedChunkIds,
      unverifiableChunkIds: quality.unverifiableChunkIds,
    });

    if (quality.status === "over-budget") {
      if (diagnosticsWarningRef.current === null || diagnosticsWarningRef.current.startsWith(HATCH_FILL_RUNTIME_WARNING_PREFIX)) {
        const sourceAvailable = [...quality.affectedChunkIds, ...quality.unverifiableChunkIds].some((chunkId) =>
          Array.isArray(refinementChunksRef.current.get(chunkId)?.meta?.hatchFillSources) &&
          refinementChunksRef.current.get(chunkId)!.meta!.hatchFillSources.length > 0);
        setDiagnosticsWarning(
          `${HATCH_FILL_RUNTIME_WARNING_PREFIX}: görünür dolgu ${quality.maxErrorCssPixels.toFixed(3)} CSS px hata sınırında; hedef ${quality.targetErrorCssPixels.toFixed(2)} CSS px. ` +
          (sourceAvailable ? "Kaynak tabanlı runtime remesh sırada; geçerli görüntü korunuyor." : "Kaynak mesh bulunmadığı için runtime fill remesh uygulanamıyor; geçerli görüntü korunuyor."),
        );
      }
      lastStablePhaseRef.current = "degraded";
      setPhase("degraded");
      return;
    }

    if (quality.status === "unverifiable") {
      if (diagnosticsWarningRef.current === null || diagnosticsWarningRef.current.startsWith(HATCH_FILL_RUNTIME_WARNING_PREFIX)) {
        const sourceAvailable = quality.unverifiableChunkIds.some((chunkId) =>
          Array.isArray(refinementChunksRef.current.get(chunkId)?.meta?.hatchFillSources) &&
          refinementChunksRef.current.get(chunkId)!.meta!.hatchFillSources.length > 0);
        const affected = quality.unverifiableChunkIds.length > 0
          ? ` ölçü eksik chunk: ${quality.unverifiableChunkIds.join(", ")}`
          : " kamera/ölçü alanı geçersiz";
        setDiagnosticsWarning(
          `${HATCH_FILL_RUNTIME_WARNING_PREFIX}: görünür alanın statik HATCH dolgu hata sınırı doğrulanamıyor;${affected}. ` +
          (sourceAvailable ? "Kaynak tabanlı runtime remesh sırada; geçerli görüntü korunuyor." : "Kaynak mesh bulunmadığı için runtime fill remesh uygulanamıyor; geçerli görüntü korunuyor."),
        );
      }
      lastStablePhaseRef.current = "degraded";
      setPhase("degraded");
      return;
    }

    if (diagnosticsWarningRef.current?.startsWith(HATCH_FILL_RUNTIME_WARNING_PREFIX)) {
      setDiagnosticsWarning(null);
      if (manifestQualityStatusRef.current === "exact" && !resourceBudgetExceededRef.current &&
          !refinementSourceBudgetExceededRef.current) {
        lastStablePhaseRef.current = "ready";
        setPhase("ready");
      }
    }
  }, [setDiagnosticsWarning]);

  const apiBase = publicToken ? "/api/public/cad-v2" : "/api/dokumantasyon/cad-v2";
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (publicToken) {
      headers["x-share-token"] = publicToken;
    }
    return headers;
  }, [publicToken]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    for (const controller of heartbeatAbortControllersRef.current) controller.abort();
    heartbeatAbortControllersRef.current.clear();
  }, []);

  const closeCurrentViewSession = useCallback(() => {
    stopHeartbeat();
    workerClientRef.current?.dispose();
    workerClientRef.current = null;
    const viewSessionId = currentViewSessionIdRef.current;
    currentViewSessionIdRef.current = null;
    if (viewSessionId) {
      fetch(`${apiBase}/view-sessions/${viewSessionId}`, {
        method: "DELETE",
        headers: authHeaders,
        keepalive: true,
      }).catch(() => {});
    }
  }, [apiBase, authHeaders, stopHeartbeat]);

  // Kalp atışı (Heartbeat) yöneticisi (180s TTL, 30s aktif, 60s arka plan)
  const scheduleHeartbeat = useCallback((viewSessionId: string) => {
    stopHeartbeat();

    const intervalMs = typeof document !== "undefined" && document.visibilityState === "hidden" ? 60_000 : 30_000;

    heartbeatTimerRef.current = setInterval(async () => {
      if (isCancelledRef.current || !currentViewSessionIdRef.current) return;
      const heartbeatController = new AbortController();
      heartbeatAbortControllersRef.current.add(heartbeatController);
      try {
        const res = await fetch(`${apiBase}/view-sessions/${viewSessionId}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          signal: heartbeatController.signal,
        });
        if (res.status === 410) {
          const responseBody = await res.json().catch(() => null) as { code?: unknown; message?: unknown } | null;
          if (currentViewSessionIdRef.current !== viewSessionId || heartbeatController.signal.aborted) return;
          if (responseBody?.code !== "VIEW_SESSION_EXPIRED") {
            closeCurrentViewSession();
            setPhase("error");
            setErrorMessage(typeof responseBody?.message === "string"
              ? responseBody.message
              : "Paylaşım erişimi sona erdi; çizimi yeniden açın.");
            return;
          }
          const repairCounts = repairCountsRef.current;
          if (repairCounts.session >= 1) {
            closeCurrentViewSession();
            setPhase("error");
            setErrorMessage("Oturum süresi doldu; çizimi yeniden deneyin.");
            return;
          }
          console.warn("[CadV2Host] Oturum süresi doldu, sınırlı biçimde yeniden hazırlanıyor...");
          currentViewSessionIdRef.current = null;
          stopHeartbeat();
          void startPrepareFlowRef.current(repairCounts.revision, repairCounts.scene, repairCounts.session + 1);
          return;
        }
        if (res.status === 401 || res.status === 403) {
          if (currentViewSessionIdRef.current !== viewSessionId) return;
          closeCurrentViewSession();
          setPhase("error");
          setErrorMessage(`Yetki hatası (${res.status}): görüntüleme oturumu sona erdi.`);
        }
      } catch {
        // Ağ hatası durumunda bir sonraki heartbeat deneyecek
      } finally {
        heartbeatAbortControllersRef.current.delete(heartbeatController);
      }
    }, intervalMs);
  }, [apiBase, authHeaders, closeCurrentViewSession, stopHeartbeat]);

  // Ana Hazırlama ve Yükleme Akışı
  const startPrepareFlow = useCallback(async (revisionRepairCount = 0, sceneRepairCount = 0, sessionRefreshCount = 0) => {
    stopHeartbeat();
    workerClientRef.current?.dispose();
    workerClientRef.current = null;
    repairCountsRef.current = {
      revision: revisionRepairCount,
      scene: sceneRepairCount,
      session: sessionRefreshCount,
    };
    isCancelledRef.current = false;
    layoutCameraStatesRef.current.clear();
    layoutFitUnitsRef.current.clear();
    layoutSwitchRevisionRef.current++;
    if (viewportChunkLoadTimerRef.current) {
      clearTimeout(viewportChunkLoadTimerRef.current);
      viewportChunkLoadTimerRef.current = null;
    }
    setHasInitialRenderedFrame(false);
    lastStablePhaseRef.current = null;
    manifestChunksRef.current = [];
    manifestQualityStatusRef.current = null;
    resourceBudgetExceededRef.current = false;
    contextRecoveryAttemptRef.current++;
    generationRef.current++;
    refinementEnabledRef.current = false;
    requestedRefinementBucketRef.current = null;
    refinementEpochRef.current++;
    residentCacheRef.current = null;
    refinementChunksRef.current.clear();
    refinementSourceBytesRef.current = 0;
    refinementSourceBudgetExceededRef.current = false;
    refinedProfilesRef.current.clear();
    hatchRefinedProfilesRef.current.clear();
    if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
    const currentGen = generationRef.current;
    resourceOwnerRef.current = { ownerScene: `prepare:${fileId}`, generation: currentGen };
    rendererRef.current?.setResourceOwner(resourceOwnerRef.current.ownerScene, currentGen);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    hostUiUpdatesRef.current?.cancelPending();

    setPhase("preparing");
    setErrorMessage(null);
    setLoadingProgress("Çizim analiz ediliyor...");

    try {
      const clientRequestId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`;

      // 1. POST /prepare
      const prepRes = await fetch(`${apiBase}/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          fileId,
          expectedSourceVersionKey: currentVersionKeyRef.current,
          clientRequestId,
          accessUrl: accessUrl || undefined,
          ...(publicToken ? { shareToken: publicToken } : {}),
        }),
        signal,
      });
      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

      if (!prepRes.ok) {
        const errJson = await prepRes.json().catch(() => ({}));
        if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
        if (prepRes.status === 409) {
          // Allow one automatic repair when the server supplies a genuinely newer source revision.
          const actualSourceVersionKey = typeof errJson.actualSourceVersionKey === "string"
            ? errJson.actualSourceVersionKey.trim()
            : "";
          if (!actualSourceVersionKey || actualSourceVersionKey === currentVersionKeyRef.current) {
            throw new Error(errJson.message || "Kaynak revizyonu doğrulanamadı; çizimi tekrar başlatın.");
          }
          currentVersionKeyRef.current = actualSourceVersionKey;
          if (revisionRepairCount >= 1) {
            throw new Error(errJson.message || "Kaynak revizyonu yeniden değişti; çizimi tekrar başlatın.");
          }
          setLoadingProgress("Dosya güncellendi, yeni revizyon yükleniyor...");
          return startPrepareFlow(revisionRepairCount + 1, sceneRepairCount, sessionRefreshCount);
        }
        throw new Error(errJson.message || `Hazırlama isteği başarısız (${prepRes.status})`);
      }

      const prepData = await prepRes.json();
      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
      const viewSessionId = prepData.viewSessionId;
      currentViewSessionIdRef.current = viewSessionId;
      scheduleHeartbeat(viewSessionId);

      let sceneId = prepData.sceneId;

      // 2. Hazır değilse iş durumunu sorgula (polling)
      if (prepData.status === "preparing" && prepData.jobId) {
        setLoadingProgress("DWG/DXF geometrisi derleniyor...");
        const jobId = prepData.jobId;
        let isDone = false;
        let attempts = 0;

        while (!isDone && attempts < 30) {
          if (signal.aborted || isCancelledRef.current) return;
          await new Promise((r) => setTimeout(r, 1000));
          attempts++;

          const jobUrl = `${apiBase}/jobs/${jobId}${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
          const jobRes = await fetch(jobUrl, { headers: authHeaders, signal });
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            if (jobData.status === "ready" && jobData.sceneId) {
              sceneId = jobData.sceneId;
              isDone = true;
            } else if (jobData.status === "failed") {
              throw new Error(jobData.error || "Çizim hazırlama işlemi başarısız oldu.");
            } else if (jobData.status === "cancelled") {
              lastStablePhaseRef.current = null;
              setPhase("cancelled");
              return;
            }
          }
        }

        if (!sceneId) {
          throw new Error("Çizim hazırlama zaman aşımına uğradı (30s).");
        }
      }

      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

      // 3. GET /manifest
      setPhase("loading");
      setLoadingProgress("Sahne manifesti ve ikili parçalar yükleniyor...");

      const manifestUrl = `${apiBase}/scenes/${sceneId}/manifest${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
      const manifestRes = await fetch(manifestUrl, { headers: authHeaders, signal });
      if (!manifestRes.ok) {
        throw new Error(`Manifest alınamadı (${manifestRes.status})`);
      }
      const rawManifestJson = await manifestRes.json();
      const hydratedManifestJson = await hydrateSceneManifestIndexes(
        rawManifestJson,
        async (indexId) => {
          const indexUrl = `${apiBase}/scenes/${sceneId}/indexes/${encodeURIComponent(indexId)}${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
          const indexRes = await fetch(indexUrl, { headers: authHeaders, signal });
          if (!indexRes.ok) throw new Error(`Sahne index sayfası alınamadı (${indexRes.status}): ${indexId}`);
          return new Uint8Array(await indexRes.arrayBuffer());
        },
      );
      // P02 Kuralı: JSON cast yerine katı doğrulayıcı çalıştır
      const manifest: ValidatedSceneManifest = validateSceneManifest(hydratedManifestJson);
      manifestQualityStatusRef.current = manifest.qualityStatus;
      resourceOwnerRef.current = { ownerScene: sceneId, generation: currentGen };
      rendererRef.current?.setResourceOwner(sceneId, currentGen);
      manifestChunksRef.current = manifest.chunks;
      rendererRef.current?.setChunkBounds(manifest.chunks);

      // Gerçek katmanları ve paftaları yükle
      if (manifest.layers && Object.keys(manifest.layers).length > 0) {
        setLayers(manifest.layers);
      }
      if (manifest.layouts && manifest.layouts.length > 0) {
        const normalizedLayouts = manifest.layouts.map((l) => ({
          layoutId: l.layoutId || l.sourceName || "Model",
          name: l.sourceName || l.layoutId || "Model",
          isModelSpace: l.kind === "model",
          bbox: l.bbox,
        }));
        setLayouts(normalizedLayouts);
        setActiveLayoutName(normalizedLayouts[0].name);
        rendererRef.current?.setActiveLayout(normalizedLayouts[0].layoutId);
      }

      // Modelin gerçek sınır kutusunu kaydet ve ekrana hemen sığdır
      if (manifest.layouts?.[0]?.bbox && rendererRef.current) {
        const modelBBox = manifest.layouts[0].bbox;
        rendererRef.current.setFitBBox(modelBBox);
        rendererRef.current.fit(modelBBox);
        fitURef.current = rendererRef.current.getCameraAdapter()?.getState()?.unitsPerCssPixel ?? null;
        const initialLayoutId = manifest.layouts[0]!.layoutId || manifest.layouts[0]!.sourceName || "Model";
        const initialCamera = rendererRef.current.getCameraAdapter()?.getState();
        if (fitURef.current) layoutFitUnitsRef.current.set(initialLayoutId, fitURef.current);
        if (initialCamera) {
          layoutCameraStatesRef.current.set(initialLayoutId, {
            center: [...initialCamera.center],
            unitsPerCssPixel: initialCamera.unitsPerCssPixel,
          });
        }
        setZoomPercent(100);
      }

      // WorkerClient başlat
      workerClientRef.current = new CadV2WorkerClient(viewSessionId, manifest.sourceVersionKey || "1");

      // 4. Görünür layout/viewport parçalarını iste; diğer parçalar pan/pafta değişiminde yüklenecek.
      const chunks = manifest.chunks;
      const downloadedChunkIds = new Set<string>();
      const validatedChunkIds = new Set<string>();
      const drawableChunkIds = new Set<string>();
      const drawnChunkIds = new Set<string>();
      const rendererAcceptedChunkIds = new Set<string>();
      const inFlightChunkIds = new Set<string>();
      const resourceBudgetRetryGate = new ChunkAdmissionRetryGate();
      const loadedVertexCounts = new Map<string, number>();
      const retainedSourceBytesByChunk = new Map<string, number>();
      const lastAdmissionCostByChunk = new Map<string, { cpuBytes: number; gpuBufferBytes: number }>();
      const overviewScaleByChunk = new Map<string, number>();
      let totalVertices = 0;
      let visibleSetKey = "";
      let visibleSetRevision = 0;
      let currentVisibleChunkIds = new Set<string>();
      let budgetPartialActive = false;
      let nextChunkLoadId = 0;
      let currentCacheEvictionReason: string | null = null;
      let currentCacheEvictionTriggerChunkId: string | null = null;
      let currentCacheEvictionTriggerLoadId: number | null = null;
      const withCacheEvictionContext = <T,>(
        reason: string,
        triggerChunkId: string | null,
        triggerLoadId: number | null,
        operation: () => T,
      ): T => {
        const previous = {
          reason: currentCacheEvictionReason,
          triggerChunkId: currentCacheEvictionTriggerChunkId,
          triggerLoadId: currentCacheEvictionTriggerLoadId,
        };
        currentCacheEvictionReason = reason;
        currentCacheEvictionTriggerChunkId = triggerChunkId;
        currentCacheEvictionTriggerLoadId = triggerLoadId;
        try {
          return operation();
        } finally {
          currentCacheEvictionReason = previous.reason;
          currentCacheEvictionTriggerChunkId = previous.triggerChunkId;
          currentCacheEvictionTriggerLoadId = previous.triggerLoadId;
        }
      };
      withCacheEvictionContextRef.current = (reason, triggerChunkId, triggerLoadId, operation) =>
        withCacheEvictionContext(reason, triggerChunkId, triggerLoadId, operation);
      const residentCache = new LruChunkCache<string>(CAD_V2_CPU_RESIDENT_BUDGET_BYTES, (chunkId) => {
        if (currentCacheEvictionReason !== "visible-admission-budget-pressure") {
          resourceBudgetRetryGate.noteCapacityOpportunity();
        }
        const lastAdmissionCost = lastAdmissionCostByChunk.get(chunkId);
        if (lastAdmissionCost) resourceBudgetRetryGate.markEvicted(chunkId, lastAdmissionCost);
        rendererRef.current?.removeSceneChunk(chunkId);
        rendererAcceptedChunkIds.delete(chunkId);
        overviewScaleByChunk.delete(chunkId);
        totalVertices -= loadedVertexCounts.get(chunkId) ?? 0;
        loadedVertexCounts.delete(chunkId);
        hostUiUpdatesRef.current?.schedule({ entityCount: totalVertices });
        const retainedBytes = retainedSourceBytesByChunk.get(chunkId) ?? 0;
        refinementSourceBytesRef.current = Math.max(0, refinementSourceBytesRef.current - retainedBytes);
        retainedSourceBytesByChunk.delete(chunkId);
        refinementChunksRef.current.delete(chunkId);
        refinedProfilesRef.current.delete(chunkId);
        hatchRefinedProfilesRef.current.delete(chunkId);
        if (retainedBytes > 0) {
          refinementEpochRef.current++;
          requestedRefinementBucketRef.current = null;
        }
        if (currentCacheEvictionReason) {
          emitCadV2ResourceDiagnostic({
            type: "chunk-evicted",
            chunkId,
            reason: currentCacheEvictionReason,
            triggerChunkId: currentCacheEvictionTriggerChunkId,
            triggerLoadId: currentCacheEvictionTriggerLoadId,
            visibleSetRevision,
          });
        }
      });
      residentCacheRef.current = residentCache;

      if (rendererRef.current) {
        rendererRef.current.clearChunks();
      }
      loadVisibleChunksRef.current = async () => {};
      refinementChunksRef.current.clear();
      refinementSourceBytesRef.current = 0;
      refinementSourceBudgetExceededRef.current = false;
      refinedProfilesRef.current.clear();
      hatchRefinedProfilesRef.current.clear();
      requestedRefinementBucketRef.current = null;

      if (chunks.length === 0) {
        throw new Error("Sahne manifestinde çizilecek parça bulunamadı; boş canvas hazır kabul edilmedi.");
      }

      const CHUNK_CONCURRENCY = 24;
      const chunkTransferBudget = new WeightedByteBudget(CAD_V2_IN_FLIGHT_CHUNK_TRANSFER_BUDGET_BYTES);
      let sharedChunkRetryBudgetStartedAt: number | null = null;

      // Yardımcı: SHA-256 doğrulayıcı
      const computeBufferSha256 = async (buf: ArrayBuffer): Promise<string> => {
        if (typeof crypto !== "undefined" && crypto.subtle) {
          const digest = await crypto.subtle.digest("SHA-256", buf);
          return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }
        return "";
      };

      const failSceneIntegrity = (
        code: CadV2SceneIntegrityError["code"],
        message: string,
      ): never => {
        const error = new CadV2SceneIntegrityError(code, message);
        if (currentGen === generationRef.current && !isCancelledRef.current) {
          abortControllerRef.current?.abort();
        }
        throw error;
      };

      const failChunkRequest = (message: string, status?: number): never => {
        const error = new CadV2ChunkRequestError(message, status);
        if (currentGen === generationRef.current && !isCancelledRef.current) {
          abortControllerRef.current?.abort();
          closeCurrentViewSession();
          setPhase("error");
          setErrorMessage(message);
        }
        throw error;
      };

      const loadVisibleChunks = async (camera: CadCameraState, layoutId: string): Promise<void> => {
        if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
        const visibleChunks = chunks.filter((chunk) => chunk.layoutId === layoutId && isChunkVisibleInCamera(chunk.bbox, camera));
        const viewportBBox = getCameraWorldViewportBBox(camera);
        for (const chunk of visibleChunks) {
          const loadedUnitsPerCssPixel = overviewScaleByChunk.get(chunk.chunkId);
          if (!loadedUnitsPerCssPixel) continue;
          const scaleRatio = loadedUnitsPerCssPixel / camera.unitsPerCssPixel;
          if (scaleRatio > CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR ||
              scaleRatio < 1 / CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR) {
            withCacheEvictionContext("overview-scale-refresh", chunk.chunkId, null, () => residentCache.remove(chunk.chunkId));
          }
        }
        const acceptedVisibleChunkIds = new Set(visibleChunks
          .filter((chunk) => rendererAcceptedChunkIds.has(chunk.chunkId))
          .map((chunk) => chunk.chunkId));
        const updateProgress = () => {
          const visibleAcceptedCount = acceptedVisibleChunkIds.size;
          hostUiUpdatesRef.current?.schedule({
            progress: `İndirilen ${downloadedChunkIds.size}/${chunks.length} · Doğrulanan ${validatedChunkIds.size}/${chunks.length} · Görünür ${visibleAcceptedCount}/${visibleChunks.length} · Çizilen ${drawnChunkIds.size}/${chunks.length}`,
          });
        };
        updateProgress();
        const nextVisibleChunkIds = new Set(visibleChunks.map((chunk) => chunk.chunkId));
        const nextVisibleSetKey = visibleChunks.map((chunk) => chunk.chunkId).join("\u0000");
        let newlyInvisibleAcceptedChunkCount = 0;
        if (nextVisibleSetKey !== visibleSetKey) {
          visibleSetKey = nextVisibleSetKey;
          visibleSetRevision++;
          for (const chunkId of rendererAcceptedChunkIds) {
            if (currentVisibleChunkIds.has(chunkId) && !nextVisibleChunkIds.has(chunkId)) {
              newlyInvisibleAcceptedChunkCount++;
            }
          }
          if (newlyInvisibleAcceptedChunkCount > 0) resourceBudgetRetryGate.noteCapacityOpportunity();
        }
        currentVisibleChunkIds = nextVisibleChunkIds;
        if (hasCadV2ResourceDiagnosticSink()) {
          emitCadV2ResourceDiagnostic({
            type: "viewport-snapshot",
            layoutId,
            cameraState: {
              center: [...camera.center],
              width: camera.width,
              height: camera.height,
              unitsPerCssPixel: camera.unitsPerCssPixel,
            },
            viewportBBox,
            visibleChunkCount: visibleChunks.length,
            capacityOpportunity: newlyInvisibleAcceptedChunkCount > 0,
            newlyInvisibleAcceptedChunkCount,
          });
        }
        for (const chunkId of rendererAcceptedChunkIds) residentCache.setVisible(chunkId, currentVisibleChunkIds.has(chunkId));
        const currentResourceEstimate = rendererRef.current?.getResourceMemoryEstimate();
        const invisibleResidentIds = residentCache.getInvisibleChunkIds();
        const reclaimableCpuBytes = invisibleResidentIds.reduce((total, chunkId) =>
          total + (rendererRef.current?.getChunkResourceMemoryEstimate(chunkId)?.cpuResidentBytes ?? 0) +
            (retainedSourceBytesByChunk.get(chunkId) ?? 0),
        0);
        const reclaimableGpuBufferBytes = invisibleResidentIds.reduce((total, chunkId) =>
          total + (rendererRef.current?.getChunkResourceMemoryEstimate(chunkId)?.gpuBufferBytesEstimate ?? 0),
        0);
        const retryCapacity = {
          cpuBytes: currentResourceEstimate
            ? Math.max(0, CAD_V2_CPU_RESIDENT_BUDGET_BYTES -
              currentResourceEstimate.cpuResidentBytes - refinementSourceBytesRef.current) + reclaimableCpuBytes
            : 0,
          gpuBufferBytes: currentResourceEstimate
            ? Math.max(0, CAD_V2_GPU_BUFFER_BUDGET_BYTES - currentResourceEstimate.gpuBufferBytesEstimate) +
              reclaimableGpuBufferBytes
            : 0,
        };
        const settleBudgetQuality = () => {
          if (nextVisibleSetKey !== visibleSetKey) return;
          if (!budgetPartialActive || !visibleChunks.every((chunk) => rendererAcceptedChunkIds.has(chunk.chunkId))) return;
          budgetPartialActive = false;
          resourceBudgetExceededRef.current = false;
          if (manifest.qualityStatus !== "exact" || refinementSourceBudgetExceededRef.current) return;
          if (!diagnosticsWarningRef.current?.startsWith("Bellek bütçesi") &&
              !diagnosticsWarningRef.current?.startsWith("Çizim, CPU/GPU kaynak bütçesi")) return;
          setDiagnosticsWarning(null);
          if (lastStablePhaseRef.current) {
            lastStablePhaseRef.current = "ready";
            setPhase("ready");
          }
        };
        const preserveDeferredVisibleWarning = (): boolean => {
          if (nextVisibleSetKey !== visibleSetKey) return false;
          let deferredVisibleCount = 0;
          for (const chunk of visibleChunks) {
            if (!rendererAcceptedChunkIds.has(chunk.chunkId) && !inFlightChunkIds.has(chunk.chunkId) &&
                resourceBudgetRetryGate.hasDeferredAdmission(chunk.chunkId)) {
              deferredVisibleCount++;
            }
          }
          if (deferredVisibleCount === 0) return false;
          resourceBudgetExceededRef.current = true;
          budgetPartialActive = true;
          setDiagnosticsWarning(
            `Bellek bütçesi nedeniyle görünür alanda ${deferredVisibleCount} parça atlandı. Çizim kısmi görüntülendi.`,
          );
          if (lastStablePhaseRef.current) lastStablePhaseRef.current = "degraded";
          setPhase("degraded");
          return true;
        };
        const prioritizedVisibleChunks = viewportBBox
          ? prioritizeChunksByViewportCoverage(visibleChunks, viewportBBox)
          : visibleChunks;
        const retryEligibleChunkIds = resourceBudgetRetryGate.selectRetryCandidates(
          prioritizedVisibleChunks.map((chunk) => chunk.chunkId),
          retryCapacity,
        );
        const pendingChunks = prioritizedVisibleChunks.filter((chunk) =>
          !rendererAcceptedChunkIds.has(chunk.chunkId) && !inFlightChunkIds.has(chunk.chunkId)
          && retryEligibleChunkIds.has(chunk.chunkId)
        );
        let firstVisibleFramePromise: Promise<void> | null = null;
        const ensureFirstVisibleFrame = (): Promise<void> => {
          if (firstVisibleFramePromise) return firstVisibleFramePromise;
          const renderer = rendererRef.current;
          if (!renderer) return Promise.reject(new Error("İlk görünür frame için CAD renderer hazır değil."));
          firstVisibleFramePromise = renderer.waitForNextRenderedFrame(5_000).then((frameRendered) => {
            if (!frameRendered) throw new Error("İlk görünür çizim karesi doğrulanamadı; V2 hazır duruma geçirilmedi.");
            const visibleDrawableChunkIds = visibleChunks
              .map((chunk) => chunk.chunkId)
              .filter((chunkId) => rendererAcceptedChunkIds.has(chunkId) && drawableChunkIds.has(chunkId));
            if (visibleDrawableChunkIds.length === 0) {
              throw new Error("İlk çizim karesi geldi ancak kabul edilmiş görünür geometri bulunamadı.");
            }
            for (const chunkId of visibleDrawableChunkIds) drawnChunkIds.add(chunkId);
            setHasInitialRenderedFrame(true);
            updateProgress();
          });
          return firstVisibleFramePromise;
        };
        if (pendingChunks.length === 0) {
          if (!preserveDeferredVisibleWarning()) settleBudgetQuality();
          if (!signal.aborted && !isCancelledRef.current && currentGen === generationRef.current) {
            hostUiUpdatesRef.current?.flush();
          }
          return;
        }
        for (const chunk of pendingChunks) inFlightChunkIds.add(chunk.chunkId);
        let nextIndex = 0;
        const releaseUnclaimedChunks = () => {
          while (nextIndex < pendingChunks.length) {
            inFlightChunkIds.delete(pendingChunks[nextIndex++]!.chunkId);
          }
        };

        const workerTask = async () => {
          while (nextIndex < pendingChunks.length) {
            if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) {
              releaseUnclaimedChunks();
              return;
            }
            const ch = pendingChunks[nextIndex++]!;
            if (!currentVisibleChunkIds.has(ch.chunkId)) {
              inFlightChunkIds.delete(ch.chunkId);
              continue;
            }
            inFlightChunkIds.add(ch.chunkId);
            const loadId = ++nextChunkLoadId;
            let releaseChunkTransferBudget = () => {};
            try {
              // Keep reservations through renderer admission so fetched/decoded chunk inputs cannot pile up.
              const release = await chunkTransferBudget.acquire(ch.byteLength, signal);
              if (!release) {
                releaseUnclaimedChunks();
                return;
              }
              releaseChunkTransferBudget = release;
              emitCadV2ResourceDiagnostic({
                type: "chunk-load-start",
                loadId,
                chunkId: ch.chunkId,
                layoutId,
                visibleSetRevision,
                visibleChunkCount: currentVisibleChunkIds.size,
              });
              let attempt = 0;
              let chunkBuf: ArrayBuffer | null = null;
              while (attempt < CHUNK_REQUEST_MAX_ATTEMPTS && !chunkBuf) {
                if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
                attempt++;
                try {
                  const chunkUrl = `${apiBase}/scenes/${sceneId}/chunks/${ch.chunkId}${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
                  const chunkRes = await fetch(chunkUrl, { headers: authHeaders, signal });
                  if (chunkRes.status === 401 || chunkRes.status === 403) {
                    failChunkRequest(`Yetki hatası (${chunkRes.status}): ${ch.chunkId}`, chunkRes.status);
                  }
                  if (chunkRes.status === 404) {
                    failSceneIntegrity("READY_SCENE_MISSING_OBJECT", `Kritik parça bulunamadı (404): ${ch.chunkId}`);
                  }
                  if (chunkRes.status === 410) {
                    failChunkRequest(`Görüntüleme erişimi sona erdi (410): ${ch.chunkId}`, chunkRes.status);
                  }
                  if (!chunkRes.ok) {
                    const retryable = chunkRes.status === 429 || [500, 502, 503, 504].includes(chunkRes.status);
                    if (!retryable) {
                      failChunkRequest(`Parça isteği reddedildi (${chunkRes.status}): ${ch.chunkId}`, chunkRes.status);
                    }
                    if (attempt >= CHUNK_REQUEST_MAX_ATTEMPTS) {
                      failChunkRequest(`Parça indirilemedi (${chunkRes.status}, ${attempt} deneme): ${ch.chunkId}`, chunkRes.status);
                    }
                    sharedChunkRetryBudgetStartedAt ??= Date.now();
                    const retryAfterMs = getRetryAfterMs(chunkRes.headers.get("Retry-After"), Date.now());
                    const retryDelayMs = getChunkRetryDelayMs(
                      attempt,
                      retryAfterMs,
                      Date.now() - sharedChunkRetryBudgetStartedAt,
                    );
                    if (retryDelayMs === null) {
                      failChunkRequest(`Parça indirilemedi (${chunkRes.status}): retry zaman bütçesi aşıldı (${ch.chunkId})`, chunkRes.status);
                    }
                    if (!await waitForChunkRetry(retryDelayMs ?? 0, signal)) return;
                    continue;
                  }
                  chunkBuf = await chunkRes.arrayBuffer();
                  downloadedChunkIds.add(ch.chunkId);
                  updateProgress();
                } catch (fetchErr: unknown) {
                  const fetchError = fetchErr instanceof Error ? fetchErr : new Error(String(fetchErr));
                  if (fetchError instanceof CadV2SceneIntegrityError) throw fetchError;
                  if (fetchError instanceof CadV2ChunkRequestError) throw fetchError;
                  if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
                  if (fetchError.name === "AbortError") {
                    failChunkRequest(`Parça isteği iptal edildi; yeni generation başlatın (${ch.chunkId})`);
                  }
                  if (attempt >= CHUNK_REQUEST_MAX_ATTEMPTS) {
                    failChunkRequest(`Parça ağ hatası nedeniyle indirilemedi (${attempt} deneme): ${ch.chunkId}`);
                  }
                  sharedChunkRetryBudgetStartedAt ??= Date.now();
                  const retryDelayMs = getChunkRetryDelayMs(
                    attempt,
                    0,
                    Date.now() - sharedChunkRetryBudgetStartedAt,
                  );
                  if (retryDelayMs === null) {
                    failChunkRequest(`Parça ağ hatası nedeniyle indirilemedi: retry zaman bütçesi aşıldı (${ch.chunkId})`);
                  }
                  if (!await waitForChunkRetry(retryDelayMs ?? 0, signal)) return;
                }
              }

              if (!chunkBuf) failChunkRequest(`Parça indirilemedi: ${ch.chunkId}`);
              const receivedChunkBuffer = chunkBuf as ArrayBuffer;
              if (receivedChunkBuffer.byteLength !== ch.byteLength) {
                failSceneIntegrity("SCENE_CHUNK_HASH_MISMATCH", `[HostShell] Parça boyutu uyuşmazlığı (${ch.chunkId}): beklenen ${ch.byteLength}, alınan ${receivedChunkBuffer.byteLength}`);
              }
              const actualSha = await computeBufferSha256(receivedChunkBuffer);
              if (actualSha && ch.sha256 && actualSha.toLowerCase() !== ch.sha256.toLowerCase()) {
                failSceneIntegrity("SCENE_CHUNK_HASH_MISMATCH", `SHA-256 sağlama toplamı uyuşmazlığı (${ch.chunkId}): beklenen ${ch.sha256}, alınan ${actualSha}`);
              }
              if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
              const workerClient = workerClientRef.current;
              if (!workerClient) return;
              const overviewUnitsPerCssPixel = rendererRef.current?.getCameraAdapter().getState().unitsPerCssPixel;
              const unpacked = await workerClient.loadChunk(ch.chunkId, receivedChunkBuffer, overviewUnitsPerCssPixel);
              if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
              const releasedUnusedPathDistanceBytes = releaseUnusedCadV2PathDistances(unpacked);
              const hasCurveRefinementSource = Boolean(unpacked.curveDataArray && unpacked.meta?.curveSourceRefs?.length);
              const hasHatchRefinementSource = Array.isArray(unpacked.meta?.hatchFillSources) && unpacked.meta.hatchFillSources.length > 0;
              const hasRuntimeRefinementSource = hasCurveRefinementSource || hasHatchRefinementSource;
              validatedChunkIds.add(ch.chunkId);
              if (unpacked.xyArray.length > 0 || (unpacked.trianglesArray?.length ?? 0) > 0 ||
                  (unpacked.curveDataArray?.length ?? 0) > 0) {
                drawableChunkIds.add(ch.chunkId);
              }
              updateProgress();
              if (!currentVisibleChunkIds.has(ch.chunkId)) {
                emitCadV2ResourceDiagnostic({
                  type: "chunk-load-outcome",
                  loadId,
                  chunkId: ch.chunkId,
                  status: "stale-visibility",
                  attemptCount: 0,
                  evictedChunkIds: [],
                  visibleSetRevision,
                });
                continue;
              }

              const renderer = rendererRef.current;
              if (!renderer) throw new Error("CAD renderer is not ready to accept visible chunks.");
              const positionCodecErrorWorld = unpacked.positionCodec?.maxWorldError ?? 0;
              const positionCodecErrorCssPixels = positionCodecErrorWorld /
                Math.max(Number.MIN_VALUE, renderer.getCameraAdapter().getState().unitsPerCssPixel);
              let refinementSourceBytes = hasRuntimeRefinementSource
                ? estimateUnpackedChunkCpuBytes(unpacked)
                : 0;
              const retainedSourceBytesForSharedBuffers = (sharedRendererBytes: number) => {
                // Admission releases ingestion-only runs after renderer ingestion. Recount
                // the retained source from the compacted chunk before applying the cap.
                refinementSourceBytes = hasRuntimeRefinementSource
                  ? estimateUnpackedChunkCpuBytes(unpacked)
                  : 0;
                const uniqueBytes = estimateUnsharedRefinementSourceBytes(refinementSourceBytes, sharedRendererBytes);
                return selectAdditionalRetainedRefinementSourceBytes(refinementSourceBytesRef.current, uniqueBytes);
              };
              let admission = tryAddSceneChunkWithinBudget(
                renderer,
                unpacked,
                refinementSourceBytesRef.current,
                retainedSourceBytesForSharedBuffers,
              );
              let attemptCount = 1;
              const evictedChunkIds: string[] = [];
              while (!admission.accepted) {
                const evictedChunkId = withCacheEvictionContext(
                  "visible-admission-budget-pressure",
                  ch.chunkId,
                  loadId,
                  () => residentCache.evictOldestInvisible(),
                );
                if (!evictedChunkId) break;
                evictedChunkIds.push(evictedChunkId);
                attemptCount++;
                admission = tryAddSceneChunkWithinBudget(
                  renderer,
                  unpacked,
                  refinementSourceBytesRef.current,
                  retainedSourceBytesForSharedBuffers,
                );
              }
              const sharedRendererSourceBytes = admission.sharedIncomingCpuBytes;
              const uniqueRefinementSourceBytes = hasRuntimeRefinementSource
                ? estimateUnsharedRefinementSourceBytes(refinementSourceBytes, sharedRendererSourceBytes)
                : 0;
              const candidateRetainedSourceBytes = admission.candidateRetainedRefinementSourceBytes;
              const rejectedResources = admission.accepted ? [] : [
                ...(admission.budget.cpuResidentBytes > admission.budget.cpuBudgetBytes ? ["cpu"] : []),
                ...(admission.budget.gpuBufferBytesEstimate > admission.budget.gpuBudgetBytes ? ["gpu"] : []),
              ];
              emitCadV2ResourceDiagnostic({
                type: "chunk-load-outcome",
                loadId,
                chunkId: ch.chunkId,
                chunkBBox: ch.bbox,
                status: admission.accepted ? "accepted" : "rejected",
                attemptCount,
                rejectionResources: rejectedResources,
                evictedChunkIds,
                chunkVertexCount: unpacked.vertexCount,
                overviewLod: unpacked.overviewLod,
                positionCodecErrorWorld,
                positionCodecErrorCssPixels,
                releasedUnusedPathDistanceBytes,
                geometryCpuBytesAdded: admission.geometryCpuBytesAdded,
                candidateCpuBytes: admission.candidateCpuBytes,
                incomingUnpackedCpuBytes: admission.incomingUnpackedCpuBytes,
                candidateRefinementSourceBytes: refinementSourceBytes,
                sharedRendererSourceBytes,
                candidateUniqueRefinementSourceBytes: uniqueRefinementSourceBytes,
                retainedRefinementSourceBytesIfAccepted: candidateRetainedSourceBytes,
                candidateGpuBufferBytes: admission.candidateGpuBufferBytes,
                cpuResidentBytes: admission.budget.cpuResidentBytes,
                rendererCpuResidentBytes: renderer.getResourceMemoryEstimate().cpuResidentBytes,
                retainedRefinementSourceBytes: refinementSourceBytesRef.current,
                additionalRetainedRendererCpuBytes: admission.additionalRetainedRendererCpuBytes,
                cpuBudgetBytes: admission.budget.cpuBudgetBytes,
                gpuBufferBytesEstimate: admission.budget.gpuBufferBytesEstimate,
                gpuBudgetBytes: admission.budget.gpuBudgetBytes,
                visibleSetRevision,
              });
              if (!admission.accepted) {
                resourceBudgetExceededRef.current = true;
                budgetPartialActive = true;
                resourceBudgetRetryGate.markRejected(ch.chunkId, {
                  cpuBytes: admission.candidateCpuBytes,
                  gpuBufferBytes: admission.candidateGpuBufferBytes,
                });
                const cpuMiB = Math.ceil(admission.budget.cpuResidentBytes / (1024 * 1024));
                const gpuMiB = Math.ceil(admission.budget.gpuBufferBytesEstimate / (1024 * 1024));
                setDiagnosticsWarning(
                  `Bellek bütçesi nedeniyle görünür parça atlandı (CPU tahmini ${cpuMiB}/${CAD_V2_CPU_RESIDENT_BUDGET_BYTES / (1024 * 1024)} MiB, GPU buffer tahmini ${gpuMiB}/${CAD_V2_GPU_BUFFER_BUDGET_BYTES / (1024 * 1024)} MiB). Görünüm kısmi.`,
                );
                if (lastStablePhaseRef.current) lastStablePhaseRef.current = "degraded";
                setPhase("degraded");
                continue;
              }
              if (hasRuntimeRefinementSource) {
                if (candidateRetainedSourceBytes > 0) {
                  refinementChunksRef.current.set(ch.chunkId, unpacked);
                  refinementSourceBytesRef.current += candidateRetainedSourceBytes;
                  retainedSourceBytesByChunk.set(ch.chunkId, candidateRetainedSourceBytes);
                } else {
                  refinementSourceBudgetExceededRef.current = true;
                }
              }
              rendererAcceptedChunkIds.add(ch.chunkId);
              acceptedVisibleChunkIds.add(ch.chunkId);
              resourceBudgetRetryGate.markAccepted(ch.chunkId);
              lastAdmissionCostByChunk.set(ch.chunkId, {
                cpuBytes: admission.candidateCpuBytes,
                gpuBufferBytes: admission.candidateGpuBufferBytes,
              });
              if (evictedChunkIds.length > 0) resourceBudgetRetryGate.noteCapacityOpportunity();
              loadedVertexCounts.set(ch.chunkId, unpacked.vertexCount);
              totalVertices += unpacked.vertexCount;
              withCacheEvictionContext("resident-cache-weight-pressure", ch.chunkId, loadId, () => {
                residentCache.put(ch.chunkId, ch.chunkId, admission.candidateCpuBytes, true);
              });
              if (unpacked.overviewLod) {
                overviewScaleByChunk.set(ch.chunkId, unpacked.overviewLod.unitsPerCssPixel);
              } else {
                overviewScaleByChunk.delete(ch.chunkId);
              }
              hostUiUpdatesRef.current?.schedule({ entityCount: totalVertices });
              updateProgress();
              if (!firstVisibleFramePromise && drawableChunkIds.has(ch.chunkId)) await ensureFirstVisibleFrame();
            } finally {
              releaseChunkTransferBudget();
              inFlightChunkIds.delete(ch.chunkId);
            }
          }
        };

        const endChunkMutationBatch = rendererRef.current?.beginChunkMutationBatch();
        let workerResults: PromiseSettledResult<void>[];
        try {
          workerResults = await Promise.allSettled(
            Array.from({ length: Math.min(CHUNK_CONCURRENCY, pendingChunks.length) }, () => workerTask()),
          );
        } finally {
          endChunkMutationBatch?.(!signal.aborted && !isCancelledRef.current && currentGen === generationRef.current);
        }
        if (!signal.aborted && !isCancelledRef.current && currentGen === generationRef.current) {
          hostUiUpdatesRef.current?.flush();
        }
        for (const chunk of pendingChunks) inFlightChunkIds.delete(chunk.chunkId);
        const failedWorker = workerResults.find((result): result is PromiseRejectedResult => result.status === "rejected");
        if (failedWorker) throw failedWorker.reason;
        if (!preserveDeferredVisibleWarning()) settleBudgetQuality();
        if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
        const visibleDrawableChunkIds = visibleChunks
          .map((chunk) => chunk.chunkId)
          .filter((chunkId) => rendererAcceptedChunkIds.has(chunkId) && drawableChunkIds.has(chunkId));
        if (visibleDrawableChunkIds.length > 0) {
          const frameRendered = await rendererRef.current?.waitForNextRenderedFrame(5_000);
          if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
          if (!frameRendered) throw new Error("Görünür çizim karesi doğrulanamadı; V2 hazır duruma geçirilmedi.");
          for (const chunkId of visibleDrawableChunkIds) drawnChunkIds.add(chunkId);
          setHasInitialRenderedFrame(true);
          updateProgress();
        }
      };

      loadVisibleChunksRef.current = loadVisibleChunks;
      const initialLayoutId = manifest.layouts?.[0]?.layoutId || "Model";
      const initialCamera = rendererRef.current?.getCameraAdapter()?.getState() || latestCameraStateRef.current;
      if (initialCamera) await loadVisibleChunks(initialCamera, initialLayoutId);

      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

      // İlk çizim için o anki viewport'ta görünmesi gereken parçalar doğrulanıp işlendi mi?
      const initialVisibleIds = chunks
        .filter((chunk) => chunk.layoutId === initialLayoutId && initialCamera && isChunkVisibleInCamera(chunk.bbox, initialCamera))
        .map((chunk) => chunk.chunkId);
      if (initialVisibleIds.length === 0 || !initialVisibleIds.some((id) => drawnChunkIds.has(id))) {
        throw new Error("İlk görünür çizim doğrulanamadı; boş canvas hazır kabul edilmedi.");
      }
      const isComplete = initialVisibleIds.every((id) => rendererAcceptedChunkIds.has(id) &&
        drawableChunkIds.has(id) && drawnChunkIds.has(id));

      if (!isComplete) {
        const missingCount = initialVisibleIds.filter((id) => !rendererAcceptedChunkIds.has(id)).length;
        setDiagnosticsWarning(resourceBudgetExceededRef.current
          ? `Bellek bütçesi nedeniyle görünür alanda ${missingCount} parça atlandı. Çizim kısmi görüntülendi.`
          : `Görünür alandaki bazı parçalar aktarılamadı (${missingCount} eksik parça). Çizim kısmi görüntülendi.`);
        lastStablePhaseRef.current = "degraded";
        setPhase("degraded");
        return;
      }

      if (manifest.qualityStatus === "degraded" || refinementSourceBudgetExceededRef.current || resourceBudgetExceededRef.current) {
        setDiagnosticsWarning(refinementSourceBudgetExceededRef.current
          ? "Büyük çizim nedeniyle bazı eğriler canlı hassaslaştırma belleği sınırının dışında kaldı; temel çizimleri korunuyor."
          : resourceBudgetExceededRef.current
          ? "Çizim, CPU/GPU kaynak bütçesi nedeniyle kısmi gösteriliyor."
          : "Çizim bazı uyarılarla açıldı (eksik font veya desteklenmeyen nesneler mevcut).");
        lastStablePhaseRef.current = "degraded";
        setPhase("degraded");
      } else {
        lastStablePhaseRef.current = "ready";
        setPhase("ready");
      }
      if (initialCamera) updateHatchFillRuntimeQuality(initialCamera);
      refinementEnabledRef.current = true;
      if (latestCameraStateRef.current) requestRefinementRef.current(latestCameraStateRef.current);
    } catch (err: unknown) {
      if (isCancelledRef.current || currentGen !== generationRef.current) return;
      if (err instanceof CadV2SceneIntegrityError) {
        closeCurrentViewSession();
        if (sceneRepairCount < 1) {
          setLoadingProgress("Sahne bütünlüğü doğrulanamadı; sahne bir kez yenileniyor...");
          return startPrepareFlow(revisionRepairCount, sceneRepairCount + 1);
        }
        setPhase("error");
        setErrorMessage(`Sahne bütünlüğü doğrulanamadı: ${err.message}`);
        return;
      }
      if (err instanceof CadV2ChunkRequestError) {
        closeCurrentViewSession();
        setPhase("error");
        setErrorMessage(err.message);
        return;
      }
      if (signal.aborted) return;
      closeCurrentViewSession();
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu.");
    }
  }, [apiBase, authHeaders, closeCurrentViewSession, fileId, sourceVersionKey, publicToken, scheduleHeartbeat, stopHeartbeat, updateHatchFillRuntimeQuality]);

  startPrepareFlowRef.current = startPrepareFlow;

  // Kullanıcı İptali (Cancellation)
  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    hostUiUpdatesRef.current?.cancelPending();
    refinementEnabledRef.current = false;
    refinementEpochRef.current++;
    if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
    if (viewportChunkLoadTimerRef.current) clearTimeout(viewportChunkLoadTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    closeCurrentViewSession();
    setPhase("cancelled");
    lastStablePhaseRef.current = null;
    contextRecoveryAttemptRef.current++;
  }, [closeCurrentViewSession]);

  // WebGL Context Loss / Restore Yöneticisi (R30, V16)
  const handleContextLost = useCallback(() => {
    console.warn("[CadV2Host] WebGL context loss algılandı.");
    contextRecoveryAttemptRef.current++;
    setPhase("context-lost");
  }, []);

  const handleContextRestored = useCallback(async () => {
    console.log("[CadV2Host] WebGL context başarıyla geri yüklendi.");
    const attempt = contextRecoveryAttemptRef.current;
    const generation = generationRef.current;
    const renderer = rendererRef.current;
    const stablePhase = lastStablePhaseRef.current;
    if (!renderer || !stablePhase) {
      setPhase("error");
      setErrorMessage("WebGL bağlamı çizim hazırlanırken geri geldi. Çizimi yeniden deneyin.");
      return;
    }

    setPhase("loading");
    try {
      const camera = renderer.getCameraAdapter().getState();
      const layoutId = renderer.getActiveLayout();
      await loadVisibleChunksRef.current(camera, layoutId);
      if (generation !== generationRef.current || attempt !== contextRecoveryAttemptRef.current || isCancelledRef.current) return;

      const requiredIds = manifestChunksRef.current
        .filter((chunk) => chunk.layoutId === layoutId && isChunkVisibleInCamera(chunk.bbox, camera))
        .map((chunk) => chunk.chunkId);
      const loadedIds = renderer.getLoadedChunkIds();
      const missingCount = requiredIds.filter((id) => !loadedIds.has(id)).length;
      if (missingCount > 0) {
        lastStablePhaseRef.current = "degraded";
        setDiagnosticsWarning(`WebGL geri yüklendi ancak görünür alanda ${missingCount} parça eksik kaldı.`);
        setPhase("degraded");
        return;
      }

      const framePresented = await renderer.waitForNextRenderedFrame();
      if (generation !== generationRef.current || attempt !== contextRecoveryAttemptRef.current || isCancelledRef.current) return;
      if (!framePresented) throw new Error("WebGL geri yüklendi ancak görünür çizimin yeni frame'i doğrulanamadı.");
      setPhase(stablePhase);
    } catch (error: any) {
      if (generation !== generationRef.current || attempt !== contextRecoveryAttemptRef.current || isCancelledRef.current) return;
      setPhase("error");
      setErrorMessage(error?.message || "WebGL çizimi kurtarılamadı.");
    }
  }, []);

  // Yaşam Döngüsü (Mount, Unmount per fileId)
  useEffect(() => {
    // React StrictMode's first development effect is cleaned up immediately.
    // Defer the request one task so that cancelled mount never creates a server session.
    const prepareTimer = window.setTimeout(() => { void startPrepareFlow(); }, 0);

    return () => {
      window.clearTimeout(prepareTimer);
      isCancelledRef.current = true;
      generationRef.current++;
      refinementEnabledRef.current = false;
      refinementEpochRef.current++;
      if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
      if (viewportChunkLoadTimerRef.current) clearTimeout(viewportChunkLoadTimerRef.current);
      loadVisibleChunksRef.current = async () => {};
      refinementChunksRef.current.clear();
      residentCacheRef.current = null;
      refinementSourceBytesRef.current = 0;
      refinementSourceBudgetExceededRef.current = false;
      refinedProfilesRef.current.clear();
      hatchRefinedProfilesRef.current.clear();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      stopHeartbeat();
      if (currentViewSessionIdRef.current) {
        fetch(`${apiBase}/view-sessions/${currentViewSessionIdRef.current}`, {
          method: "DELETE",
          headers: authHeaders,
          keepalive: true,
        }).catch(() => {});
        currentViewSessionIdRef.current = null;
      }
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
        workerClientRef.current = null;
      }
    };
  }, [fileId, stopHeartbeat]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ekran ve görünürlük olayları (Visibility, Fullscreen)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (currentViewSessionIdRef.current) {
        scheduleHeartbeat(currentViewSessionIdRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [scheduleHeartbeat]);

  // Klavye kısayolları (Escape vb.)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLayerPanelOpen || isSettingsOpen) {
          e.preventDefault();
          setIsLayerPanelOpen(false);
          setIsSettingsOpen(false);
        } else if (isFocusMode) {
          e.preventDefault();
          setIsFocusMode(false);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isLayerPanelOpen, isSettingsOpen, isFocusMode]);

  const handleRendererReady = useCallback((renderer: CadV2Renderer) => {
    rendererRef.current = renderer;
    renderer.setResourceOwner(resourceOwnerRef.current.ownerScene, resourceOwnerRef.current.generation);
    const lineweightAccepted = renderer.setLineweight(settings.showLineweights, refinementSourceBytesRef.current);
    if (!lineweightAccepted && settings.showLineweights) {
      setSettings((prev) => ({ ...prev, showLineweights: false }));
      setDiagnosticsWarning("Çizgi kalınlıkları 64 MiB CPU/GPU tahmin bütçesine sığmadı; çizimin merkez çizgileri korundu.");
    }
  }, [settings.showLineweights]);

  const handleCameraChange = useCallback((camState: any) => {
    if (camState && Number.isFinite(camState.unitsPerCssPixel) && camState.unitsPerCssPixel > 0) {
      latestCameraStateRef.current = camState as CadCameraState;
      updateHatchFillRuntimeQuality(camState as CadCameraState);
      requestRefinementRef.current(camState as CadCameraState);
      if (viewportChunkLoadTimerRef.current) clearTimeout(viewportChunkLoadTimerRef.current);
      const camera = camState as CadCameraState;
      const layoutId = rendererRef.current?.getActiveLayout() || "Model";
      layoutCameraStatesRef.current.set(layoutId, {
        center: [...camera.center],
        unitsPerCssPixel: camera.unitsPerCssPixel,
      });
      const layoutFitUnits = layoutFitUnitsRef.current.get(layoutId) ?? fitURef.current;
      if (layoutFitUnits && layoutFitUnits > 0) {
        setZoomPercent((layoutFitUnits / camera.unitsPerCssPixel) * 100);
      }
      const layoutSwitchRevision = layoutSwitchRevisionRef.current;
      viewportChunkLoadTimerRef.current = setTimeout(() => {
        if (layoutSwitchRevision !== layoutSwitchRevisionRef.current ||
          rendererRef.current?.getActiveLayout() !== layoutId) return;
        loadVisibleChunksRef.current(camera, layoutId).catch((err) => {
          setDiagnosticsWarning(err?.message || "Görünür çizim parçaları yüklenemedi.");
          lastStablePhaseRef.current = "degraded";
          setPhase("degraded");
        });
      }, 120);
    }
    if (fitURef.current && fitURef.current > 0 && camState?.unitsPerCssPixel > 0) {
      const pct = (fitURef.current / camState.unitsPerCssPixel) * 100;
      setZoomPercent(pct);
    }
  }, [updateHatchFillRuntimeQuality]);

  const queueCameraRefinement = useCallback((cameraState: CadCameraState) => {
    if (!refinementEnabledRef.current || !Number.isFinite(cameraState.unitsPerCssPixel) || cameraState.unitsPerCssPixel <= 0) return;
    // 1/4 octave buckets: pan is excluded, and small wheel noise is coalesced.
    const bucket = Math.round(Math.log2(cameraState.unitsPerCssPixel) * 4) / 4;
    const currentRenderer = rendererRef.current;
    if (!currentRenderer) return;
    const activeLayoutId = currentRenderer.getActiveLayout() || "Model";
    const visibleChunkIds = new Set(manifestChunksRef.current
      .filter((chunk) => chunk.layoutId === activeLayoutId && isChunkVisibleInCamera(chunk.bbox, cameraState))
      .map((chunk) => chunk.chunkId));
    const curveChunks = [...refinementChunksRef.current.entries()].filter(([, chunk]) =>
      visibleChunkIds.has(chunk.chunkId) && chunk.curveDataArray && chunk.meta?.curveSourceRefs?.length);
    const hatchChunks = [...refinementChunksRef.current.entries()].filter(([, chunk]) =>
      visibleChunkIds.has(chunk.chunkId) && Array.isArray(chunk.meta?.hatchFillSources) && chunk.meta.hatchFillSources.length > 0);
    if (curveChunks.length === 0 && hatchChunks.length === 0) return;
      const bucketChanged = requestedRefinementBucketRef.current !== bucket;
      if (bucketChanged) {
        requestedRefinementBucketRef.current = bucket;
        refinementEpochRef.current++;
      }
      if (refinementRunningRef.current) return;
      if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
      const transientAttempted = curveChunks.every(([chunkId]) => {
        const state = refinedProfilesRef.current.get(chunkId);
        return state?.bucket === bucket && state.attemptedErrorCssPixels <= CURVE_REFINEMENT_ERROR_CSS_PX.transient;
      }) && hatchChunks.every(([chunkId]) => {
        const state = hatchRefinedProfilesRef.current.get(chunkId);
        return state?.bucket === bucket && state.attemptedErrorCssPixels <= CURVE_REFINEMENT_ERROR_CSS_PX.transient;
      });
      const idleAttempted = curveChunks.every(([chunkId]) => {
        const state = refinedProfilesRef.current.get(chunkId);
        return state?.bucket === bucket && state.attemptedErrorCssPixels <= CURVE_REFINEMENT_ERROR_CSS_PX.idle;
      }) && hatchChunks.every(([chunkId]) => {
        const state = hatchRefinedProfilesRef.current.get(chunkId);
        return state?.bucket === bucket && state.attemptedErrorCssPixels <= CURVE_REFINEMENT_ERROR_CSS_PX.idle;
      });
      if (idleAttempted) return;
      const profile: CurveRefinementProfile = transientAttempted ? "idle" : "transient";
      const epoch = refinementEpochRef.current;

    const runProfile = async (profile: CurveRefinementProfile): Promise<void> => {
      if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current || refinementRunningRef.current) return;
      refinementRunningRef.current = true;
      const targetErrorCssPixels = CURVE_REFINEMENT_ERROR_CSS_PX[profile];
      try {
        const client = workerClientRef.current;
        const renderer = rendererRef.current;
        if (!client || !renderer) return;
        const replacementChunksInPass = new Map<string, UnpackedSceneChunk>();
        for (const [chunkId, sourceChunk] of curveChunks) {
          if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current) break;
          const previous = refinedProfilesRef.current.get(chunkId);
          if (previous?.bucket === bucket && previous.attemptedErrorCssPixels <= targetErrorCssPixels) continue;
          const getMinimumPeak = async () => {
            const workerSourceCacheBytes = await client.getCurveRefinementWorkerSourceBytes(sourceChunk);
            if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current ||
                rendererRef.current !== renderer || workerClientRef.current !== client) return null;
            return estimateCurveRefinementMinimumPeakResources({
              rendererResources: renderer.getResourceMemoryEstimate(),
              replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
              retainedRefinementSourceBytes: refinementSourceBytesRef.current,
              workerSourceCacheBytes,
            });
          };
          let minimumPeak = await getMinimumPeak();
          if (!minimumPeak) break;
          while (!minimumPeak.budget.withinBudget && renderer.hasChunk(chunkId)) {
            const evictedChunkId = withCacheEvictionContextRef.current(
              "curve-refinement-budget-pressure",
              chunkId,
              null,
              () => residentCacheRef.current?.evictOldestInvisible() ?? null,
            );
            if (!evictedChunkId) break;
            minimumPeak = await getMinimumPeak();
            if (!minimumPeak) break;
          }
          if (!minimumPeak) break;
          if (!renderer.hasChunk(chunkId)) continue;
          if (!minimumPeak.budget.withinBudget) {
            const cpuMiB = Number.isFinite(minimumPeak.budget.cpuResidentBytes)
              ? `${Math.ceil(minimumPeak.budget.cpuResidentBytes / (1024 * 1024))}` : "hesaplanamadı";
            const gpuMiB = Number.isFinite(minimumPeak.budget.gpuBufferBytesEstimate)
              ? `${Math.ceil(minimumPeak.budget.gpuBufferBytesEstimate / (1024 * 1024))}` : "hesaplanamadı";
            setDiagnosticsWarning(
              `Eğri iyileştirmesi worker başlamadan önce alt tepe bütçesini aştığı için atlandı; son geçerli geometri korundu (CPU ${cpuMiB}/${CAD_V2_CPU_RESIDENT_BUDGET_BYTES / (1024 * 1024)} MiB, GPU buffer ${gpuMiB}/${CAD_V2_GPU_BUFFER_BUDGET_BYTES / (1024 * 1024)} MiB).`,
            );
            lastStablePhaseRef.current = "degraded";
            setPhase("degraded");
            refinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
            });
            continue;
          }
          const unitsPerCssPixel = 2 ** (bucket + 0.125);
          const targetErrorWorldUnits = targetErrorCssPixels * unitsPerCssPixel;
          const result = await client.refineCurves(sourceChunk, {
            targetErrorCssPixels,
            // Use the most zoomed-in scale in this bucket so reuse within the bucket stays conservative.
            unitsPerCssPixel,
            maxTransformSingularValue: 1,
          });
          // A camera bucket change invalidates the in-flight result; retain the last displayed geometry.
          if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current) break;

            // A capped/partial result is never safe to replace the current whole chunk with:
            // applying only successful spans would silently restore failed spans to coarse fallback.
            if (!result.errorBoundMet) {
              setDiagnosticsWarning("Bazı daire/yay eğrileri çalışma anı hata veya bellek sınırına ulaştı; son geçerli görüntü korunuyor.");
              lastStablePhaseRef.current = "degraded";
              setPhase("degraded");
              refinedProfilesRef.current.set(chunkId, {
                bucket,
                attemptedErrorCssPixels: targetErrorCssPixels,
                displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
              });
              continue;
            }

            // Never replace a displayed curve set with a coarser transient result after a zoom.
            const keepHigherPrecisionDisplay = previous?.displayedErrorWorldUnits !== null &&
              previous?.displayedErrorWorldUnits !== undefined && previous.displayedErrorWorldUnits <= targetErrorWorldUnits;
            if (!keepHigherPrecisionDisplay) {
              const workerSourceCacheBytes = await client.getCurveRefinementWorkerSourceBytes(sourceChunk);
              if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current ||
                  rendererRef.current !== renderer || workerClientRef.current !== client) break;
              let peak = estimateCurveRefinementPeakResources({
                source: sourceChunk,
                result,
                rendererResources: renderer.getResourceMemoryEstimate(),
                replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
                retainedRefinementSourceBytes: refinementSourceBytesRef.current,
                workerSourceCacheBytes,
              });
              while (!peak.budget.withinBudget && renderer.hasChunk(chunkId)) {
                const evictedChunkId = withCacheEvictionContextRef.current(
                  "curve-refinement-budget-pressure",
                  chunkId,
                  null,
                  () => residentCacheRef.current?.evictOldestInvisible() ?? null,
                );
                if (!evictedChunkId) break;
                const currentWorkerSourceCacheBytes = await client.getCurveRefinementWorkerSourceBytes(sourceChunk);
                if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current ||
                    rendererRef.current !== renderer || workerClientRef.current !== client) break;
                peak = estimateCurveRefinementPeakResources({
                  source: sourceChunk,
                  result,
                  rendererResources: renderer.getResourceMemoryEstimate(),
                  replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
                  retainedRefinementSourceBytes: refinementSourceBytesRef.current,
                  workerSourceCacheBytes: currentWorkerSourceCacheBytes,
                });
              }
              if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current ||
                  rendererRef.current !== renderer || workerClientRef.current !== client) break;
              if (!renderer.hasChunk(chunkId)) continue;
              if (!peak.budget.withinBudget) {
                const cpuMiB = Number.isFinite(peak.budget.cpuResidentBytes)
                  ? `${Math.ceil(peak.budget.cpuResidentBytes / (1024 * 1024))}` : "hesaplanamadı";
                const gpuMiB = Number.isFinite(peak.budget.gpuBufferBytesEstimate)
                  ? `${Math.ceil(peak.budget.gpuBufferBytesEstimate / (1024 * 1024))}` : "hesaplanamadı";
                setDiagnosticsWarning(
                  `Eğri iyileştirmesi replacement tepe tahmini bütçeyi aşacağı için atlandı; son geçerli geometri korundu (CPU ${cpuMiB}/${CAD_V2_CPU_RESIDENT_BUDGET_BYTES / (1024 * 1024)} MiB, GPU buffer ${gpuMiB}/${CAD_V2_GPU_BUFFER_BUDGET_BYTES / (1024 * 1024)} MiB).`,
                );
                lastStablePhaseRef.current = "degraded";
                setPhase("degraded");
                refinedProfilesRef.current.set(chunkId, {
                  bucket,
                  attemptedErrorCssPixels: targetErrorCssPixels,
                  displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
                });
                continue;
              }
              const refinedChunk = applyCurveRefinementsToChunk(sourceChunk, result);
              if (refinedChunk !== sourceChunk) {
                if (!renderer.replaceSceneChunkGeometry(refinedChunk)) continue;
                replacementChunksInPass.set(chunkId, refinedChunk);
                const replacementGeometry = renderer.getChunkResourceMemoryEstimate(chunkId);
                if (replacementGeometry && residentCacheRef.current?.updateByteLength(chunkId, replacementGeometry.cpuResidentBytes) !== true) {
                  console.warn(`[CadV2Host] LRU geometri ağırlığı güncellenemedi: ${chunkId}`);
                }
              }
            }
            const refinedErrorWorldUnits = Math.max(...result.intervals.map((interval) => interval.conservativeErrorCssPixels)) * unitsPerCssPixel;
            refinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: keepHigherPrecisionDisplay
                ? previous.displayedErrorWorldUnits
                : refinedErrorWorldUnits,
            });
        }

        for (const [chunkId, sourceChunk] of hatchChunks) {
          if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current) break;
          const previous = hatchRefinedProfilesRef.current.get(chunkId);
          if (previous?.bucket === bucket && previous.attemptedErrorCssPixels <= targetErrorCssPixels) continue;
          const unitsPerCssPixel = cameraState.unitsPerCssPixel;
          const targetErrorWorldUnits = HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX * unitsPerCssPixel;
          const keepHigherPrecisionDisplay = previous?.displayedErrorWorldUnits !== null &&
            previous?.displayedErrorWorldUnits !== undefined && previous.displayedErrorWorldUnits <= targetErrorWorldUnits;
          if (keepHigherPrecisionDisplay) {
            hatchRefinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: previous.displayedErrorWorldUnits,
            });
            continue;
          }

          const getMinimumPeak = () => estimateHatchFillRefinementMinimumPeakResources({
            rendererResources: renderer.getResourceMemoryEstimate(),
            replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
            retainedRefinementSourceBytes: refinementSourceBytesRef.current,
          });
          let minimumPeak = getMinimumPeak();
          while (!minimumPeak.budget.withinBudget && renderer.hasChunk(chunkId)) {
            const evictedChunkId = withCacheEvictionContextRef.current(
              "hatch-refinement-budget-pressure",
              chunkId,
              null,
              () => residentCacheRef.current?.evictOldestInvisible() ?? null,
            );
            if (!evictedChunkId) break;
            minimumPeak = getMinimumPeak();
          }
          if (!renderer.hasChunk(chunkId)) continue;
          if (!minimumPeak.budget.withinBudget) {
            setDiagnosticsWarning("HATCH worker'ı başlamadan önce bile bilinen CPU/GPU alt tepe bütçesi aşılıyor; son geçerli dolgu görüntüsü korundu.");
            lastStablePhaseRef.current = "degraded";
            setPhase("degraded");
            hatchRefinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
            });
            continue;
          }

          let replacementChunk = replacementChunksInPass.get(chunkId) ?? sourceChunk;
          const sources = replacementChunk.meta?.hatchFillSources as Array<{ sourceId?: unknown; source?: unknown }>;
          let allSourcesRefined = true;
          let totalResultBytes = 0;
          let maxEncodedErrorWorld = 0;
          for (const hatchSource of sources) {
            if (typeof hatchSource.sourceId !== "string" || !hatchSource.source || typeof hatchSource.source !== "object") {
              allSourcesRefined = false;
              break;
            }
            const result = await client.refineHatchFill(chunkId, hatchSource.source as any, {
              targetErrorCssPixels: HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX,
              unitsPerCssPixel,
              maxTransformSingularValue: 1,
            });
            if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current) {
              allSourcesRefined = false;
              break;
            }
            if (result.status !== "refined" || !result.errorBoundMet || !result.verticesWorld) {
              allSourcesRefined = false;
              break;
            }
            const applied = applyRuntimeHatchFillRefinementToChunk(replacementChunk, hatchSource.sourceId, result);
            replacementChunk = applied.chunk;
            totalResultBytes += result.verticesWorld.byteLength;
            maxEncodedErrorWorld = Math.max(maxEncodedErrorWorld, applied.encodedErrorWorld);
          }
          if (!allSourcesRefined || sources.length === 0) {
            setDiagnosticsWarning("HATCH çalışma anı yeniden ağ örneklemesi başarısız veya sınırda kaldı; son geçerli dolgu görüntüsü korundu.");
            lastStablePhaseRef.current = "degraded";
            setPhase("degraded");
            hatchRefinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
            });
            continue;
          }

          const workingChunkBytes = replacementChunk === sourceChunk ? 0 :
            (replacementChunk.xyArray.byteLength + (replacementChunk.trianglesArray?.byteLength ?? 0) +
              (replacementChunk.pathDistancesArray?.byteLength ?? 0) + (replacementChunk.drawRunsArray?.byteLength ?? 0) +
              (replacementChunk.curveDataArray?.byteLength ?? 0) + JSON.stringify(replacementChunk.meta ?? {}).length * 2);
          let peak = estimateHatchFillRefinementPeakResources({
            replacement: replacementChunk,
            resultBytes: totalResultBytes,
            rendererResources: renderer.getResourceMemoryEstimate(),
            replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
            retainedRefinementSourceBytes: refinementSourceBytesRef.current + workingChunkBytes,
          });
          while (!peak.budget.withinBudget && renderer.hasChunk(chunkId)) {
            const evictedChunkId = withCacheEvictionContextRef.current(
              "hatch-refinement-budget-pressure",
              chunkId,
              null,
              () => residentCacheRef.current?.evictOldestInvisible() ?? null,
            );
            if (!evictedChunkId) break;
            peak = estimateHatchFillRefinementPeakResources({
              replacement: replacementChunk,
              resultBytes: totalResultBytes,
              rendererResources: renderer.getResourceMemoryEstimate(),
              replacedChunkResources: renderer.getChunkResourceMemoryEstimate(chunkId),
              retainedRefinementSourceBytes: refinementSourceBytesRef.current + workingChunkBytes,
            });
          }
          if (!renderer.hasChunk(chunkId)) continue;
          if (!peak.budget.withinBudget) {
            setDiagnosticsWarning("HATCH iyileştirmesi replacement tepe CPU/GPU tahmini bütçesini aştı; son geçerli dolgu görüntüsü korundu.");
            lastStablePhaseRef.current = "degraded";
            setPhase("degraded");
            hatchRefinedProfilesRef.current.set(chunkId, {
              bucket,
              attemptedErrorCssPixels: targetErrorCssPixels,
              displayedErrorWorldUnits: previous?.displayedErrorWorldUnits ?? null,
            });
            continue;
          }
          if (!renderer.replaceSceneChunkGeometry(replacementChunk)) continue;
          replacementChunksInPass.set(chunkId, replacementChunk);
          const replacementGeometry = renderer.getChunkResourceMemoryEstimate(chunkId);
          if (replacementGeometry && residentCacheRef.current?.updateByteLength(chunkId, replacementGeometry.cpuResidentBytes) !== true) {
            console.warn(`[CadV2Host] HATCH LRU geometri ağırlığı güncellenemedi: ${chunkId}`);
          }
          hatchRefinedProfilesRef.current.set(chunkId, {
            bucket,
            attemptedErrorCssPixels: targetErrorCssPixels,
            displayedErrorWorldUnits: maxEncodedErrorWorld,
          });
          emitCadV2ResourceDiagnostic({
            type: "hatch-fill-runtime-refinement",
            chunkId,
            sourceCount: sources.length,
            triangleCount: (replacementChunk.trianglesArray?.length ?? 0) / 6,
            unitsPerCssPixel,
            errorWorld: maxEncodedErrorWorld,
            requestedErrorWorld: HATCH_FILL_RUNTIME_TARGET_ERROR_CSS_PX * unitsPerCssPixel,
            peakCpuBytes: peak.budget.cpuResidentBytes,
            peakGpuBufferBytesEstimate: peak.budget.gpuBufferBytesEstimate,
            status: "replaced",
          });
          if (latestCameraStateRef.current) updateHatchFillRuntimeQuality(latestCameraStateRef.current);
        }
      } catch (error) {
        // Refinement is an enhancement. The validated/current display remains visible.
        console.warn("[CadV2Host] Eğri hassaslaştırması uygulanamadı; mevcut geometri korunuyor.", error);
        if (refinementEnabledRef.current && epoch === refinementEpochRef.current) {
          setDiagnosticsWarning("Canlı eğri hassaslaştırması tamamlanamadı; mevcut çizim korunuyor.");
          lastStablePhaseRef.current = "degraded";
          setPhase("degraded");
        }
      } finally {
        refinementRunningRef.current = false;
        if (!refinementEnabledRef.current) return;
        if (epoch !== refinementEpochRef.current) {
          if (latestCameraStateRef.current) requestRefinementRef.current(latestCameraStateRef.current);
          return;
        }
        if (profile === "transient") {
          refinementTimerRef.current = setTimeout(() => {
            refinementTimerRef.current = null;
            void runProfile("idle");
          }, CURVE_REFINEMENT_IDLE_DELAY_MS);
        }
      }
    };

      const delayMs = profile === "transient" ? CURVE_REFINEMENT_DEBOUNCE_MS : CURVE_REFINEMENT_IDLE_DELAY_MS;
      refinementTimerRef.current = setTimeout(() => {
        refinementTimerRef.current = null;
        void runProfile(profile);
      }, delayMs);
  }, [updateHatchFillRuntimeQuality]);
  requestRefinementRef.current = queueCameraRefinement;

  const handleZoomIn = () => rendererRef.current?.zoomIn();
  const handleZoomOut = () => rendererRef.current?.zoomOut();
  const handleFit = () => {
    rendererRef.current?.fit();
    if (rendererRef.current) {
      const layoutId = rendererRef.current.getActiveLayout();
      fitURef.current = rendererRef.current.getCameraAdapter()?.getState()?.unitsPerCssPixel ?? null;
      if (fitURef.current) layoutFitUnitsRef.current.set(layoutId, fitURef.current);
      setZoomPercent(100);
    }
  };
  const handleTogglePan = () => {
    setIsPanActive((prev) => {
      const next = !prev;
      rendererRef.current?.setPanToolActive(next);
      return next;
    });
  };
  const handleToggleLayerPanel = () => {
    setIsLayerPanelOpen((prev) => !prev);
    setIsSettingsOpen(false);
  };
  const handleToggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
    setIsLayerPanelOpen(false);
  };

  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFocusMode((prev) => !prev);
      });
    } else {
      setIsFocusMode((prev) => !prev);
    }
  };

  const handleToggleLayerVisibility = (layerId: string, visible: boolean) => {
    setLayers((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], visible },
    }));
    rendererRef.current?.setLayerVisibility(layerId, visible);
  };

  const handleToggleAllLayers = (visible: boolean) => {
    setLayers((prev) => {
      const next: Record<string, CadLayer> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = { ...v, visible };
        rendererRef.current?.setLayerVisibility(k, visible);
      }
      return next;
    });
  };

  const handleSelectLayout = (layoutName: string) => {
    const target = layouts.find((l) => l.name === layoutName || l.layoutId === layoutName);
    if (target && rendererRef.current) {
      const renderer = rendererRef.current;
      const cameraAdapter = renderer.getCameraAdapter();
      const previousLayoutId = renderer.getActiveLayout();
      const previousCamera = cameraAdapter?.getState();
      if (previousCamera) {
        layoutCameraStatesRef.current.set(previousLayoutId, {
          center: [...previousCamera.center],
          unitsPerCssPixel: previousCamera.unitsPerCssPixel,
        });
      }
      if (fitURef.current && fitURef.current > 0) {
        layoutFitUnitsRef.current.set(previousLayoutId, fitURef.current);
      }
      layoutSwitchRevisionRef.current++;
      if (viewportChunkLoadTimerRef.current) {
        clearTimeout(viewportChunkLoadTimerRef.current);
        viewportChunkLoadTimerRef.current = null;
      }
      setActiveLayoutName(target.name);
      renderer.setActiveLayout(target.layoutId);
      renderer.setFitBBox(target.bbox);
      const savedCamera = layoutCameraStatesRef.current.get(target.layoutId);
      const savedFitUnits = layoutFitUnitsRef.current.get(target.layoutId);
      if (savedCamera && savedFitUnits) {
        fitURef.current = savedFitUnits;
        cameraAdapter?.restoreView(savedCamera);
      } else {
        renderer.fit(target.bbox);
        const fittedCamera = cameraAdapter?.getState();
        fitURef.current = fittedCamera?.unitsPerCssPixel ?? null;
        if (fitURef.current) layoutFitUnitsRef.current.set(target.layoutId, fitURef.current);
        if (fittedCamera) {
          layoutCameraStatesRef.current.set(target.layoutId, {
            center: [...fittedCamera.center],
            unitsPerCssPixel: fittedCamera.unitsPerCssPixel,
          });
        }
        setZoomPercent(100);
      }
      const camera = cameraAdapter?.getState();
      if (camera) {
        loadVisibleChunksRef.current(camera, target.layoutId).catch((err) => {
          setDiagnosticsWarning(err?.message || "Seçili paftanın görünür parçaları yüklenemedi.");
          lastStablePhaseRef.current = "degraded";
          setPhase("degraded");
        });
      }
    }
  };

  const handleUpdateSettings = (newSettings: Partial<CadV2ViewSettings>) => {
    const lineweightRejected = newSettings.showLineweights !== undefined && rendererRef.current
      ? !rendererRef.current.setLineweight(newSettings.showLineweights, refinementSourceBytesRef.current)
      : false;
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (lineweightRejected) updated.showLineweights = prev.showLineweights;
      if (newSettings.background && rendererRef.current) {
        const bgColors = {
          black: 0x050505,
          darkGray: 0x18181b,
          light: 0xf4f4f5,
        };
        rendererRef.current.setBackgroundColor(bgColors[updated.background]);
      }
      if (newSettings.monochrome !== undefined && rendererRef.current) {
        rendererRef.current.setMonochrome(newSettings.monochrome);
      }
      return updated;
    });
    if (lineweightRejected && newSettings.showLineweights) {
      setDiagnosticsWarning("Çizgi kalınlıkları 64 MiB CPU/GPU tahmin bütçesine sığmadı; çizimin merkez çizgileri korundu.");
    }
  };

  const handleFallbackToLegacy = () => {
    if (onFallbackToLegacy) {
      onFallbackToLegacy();
      return;
    }
    if (publicToken) {
      if (onBack) {
        onBack();
      } else {
        window.location.reload();
      }
      return;
    }
    window.location.href = `/dokumantasyon/dosya/${fileId}`;
  };

  return (
    <div
      ref={containerRef}
      data-v2-phase={phase}
      data-cad-v2-progress={loadingProgress}
      className={`relative w-full h-full flex flex-col overflow-hidden bg-neutral-950 text-neutral-200 select-none ${
        isFocusMode ? "fixed inset-0 z-50 bg-neutral-950" : ""
      }`}
    >
      {/* 1. Üst Çubuk (Topbar - motor_v2/21_ARAYUZ_TASARIM_SISTEMI Sözleşmesi) */}
      <header
        data-testid="document-studio-topbar"
        className="h-12 border-b border-neutral-800/80 bg-neutral-900/90 flex items-center justify-between px-3 z-10 backdrop-blur-xl shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              title="Geri Dön"
              className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate" title={displayName}>
              {displayName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              V2
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              ({formatBytes(sizeBytes)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {diagnosticsWarning && (
            <span className="text-[11px] text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hidden lg:flex">
              <AlertTriangle className="h-3 w-3" /> Uyarılar Mevcut
            </span>
          )}

          {/* UI Teması Değiştirme */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg cursor-pointer hidden sm:flex"
            title={resolvedTheme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
          >
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Tam Ekran / Odak Görünümü (F20) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFullscreen}
            className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
            title={isFullscreen || isFocusMode ? "Tam Ekrandan Çık (Esc)" : "Tam Ekran / Odak Görünümü"}
          >
            {isFullscreen || isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Paylaş */}
          {onShare && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg cursor-pointer hidden sm:flex"
              title="Paylaş"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}

          {/* İndir */}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="h-8 w-8 text-neutral-400 hover:text-white rounded-lg cursor-pointer hidden sm:flex"
              title="İndir"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Mevcut Görüntüleyiciyle Aç (Legacy Fallback - F17) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFallbackToLegacy}
            className="h-7 text-xs border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg px-2 sm:px-2.5"
            title="Mevcut Görüntüleyiciyle Aç"
          >
            <span className="hidden sm:inline">Mevcut Motorla Aç</span>
            <span className="sm:hidden text-[11px]">Mevcut Motor</span>
          </Button>
        </div>
      </header>

      {/* 2. Ana Çizim Alanı */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Render Canvas & D3 Giriş Katmanı */}
        <CadV2Canvas
          initialBBox={[-500, -500, 500, 500]}
          backgroundColor={
            settings.background === "black"
              ? 0x050505
              : settings.background === "light"
              ? 0xf4f4f5
              : 0x18181b
          }
          onRendererReady={handleRendererReady}
          onCameraChange={handleCameraChange}
          onPanToolChange={setIsPanActive}
          onMouseMoveCoords={setCoords}
          onContextLost={handleContextLost}
          onContextRestored={handleContextRestored}
        />

        {phase === "degraded" && diagnosticsWarning && (
          <div
            role="alert"
            data-testid="cad-v2-quality-warning"
            className="pointer-events-none absolute top-3 left-14 right-3 z-20 mx-auto flex max-w-2xl items-start gap-2 rounded-lg border border-amber-600/50 bg-neutral-950/90 px-3 py-2 text-xs text-amber-100 shadow-lg"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <span>{diagnosticsWarning}</span>
          </div>
        )}

        {/* Araç Çubuğu */}
        {(phase === "ready" || phase === "degraded") && (
          <CadV2Toolbar
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFit={handleFit}
            isPanActive={isPanActive}
            onTogglePan={handleTogglePan}
            isLayerPanelOpen={isLayerPanelOpen}
            onToggleLayerPanel={handleToggleLayerPanel}
            isSettingsOpen={isSettingsOpen}
            onToggleSettings={handleToggleSettings}
          />
        )}

        {/* Katman Paneli (Mobil Dokunma Güvenli) */}
        {isLayerPanelOpen && (
          <div
            className="absolute bottom-20 left-3 right-3 sm:bottom-auto sm:top-4 sm:left-16 sm:right-auto z-20"
            style={{ touchAction: "pan-y" }}
          >
            <CadV2LayerPanel
              layers={layers}
              onToggleVisibility={handleToggleLayerVisibility}
              onToggleAllVisibility={handleToggleAllLayers}
              onClose={() => setIsLayerPanelOpen(false)}
            />
          </div>
        )}

        {/* Görünüm Ayarları Paneli (Mobil Dokunma Güvenli) */}
        {isSettingsOpen && (
          <div
            className="absolute bottom-20 left-3 right-3 sm:bottom-auto sm:top-4 sm:left-16 sm:right-auto z-20"
            style={{ touchAction: "pan-y" }}
          >
            <CadV2ViewSettingsPanel
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        )}

        {/* Durum Çubuğu */}
        {(phase === "ready" || phase === "degraded") && (
          <CadV2StatusBar
            coords={coords}
            zoomPercent={zoomPercent}
            activeLayoutName={activeLayoutName}
            layouts={layouts.map((l) => l.name)}
            onSelectLayout={handleSelectLayout}
            entityCount={entityCount}
          />
        )}

        {/* Hazırlanıyor / Yükleniyor Durumu + İptal Butonu */}
        {(phase === "preparing" || (phase === "loading" && !hasInitialRenderedFrame)) && (
          <div
            data-testid="cad-v2-blocking-loading-overlay"
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-3 p-6 bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl max-w-xs w-full text-center">
              <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
              <div>
                <div className="font-semibold text-sm text-neutral-100">DWG Motor V2 Hazırlanıyor</div>
                <div className="text-xs text-neutral-400 mt-1">{loadingProgress}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="mt-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                İptal Et
              </Button>
            </div>
          </div>
        )}

        {phase === "loading" && hasInitialRenderedFrame && (
          <div
            role="status"
            data-testid="cad-v2-streaming-progress"
            className="absolute top-3 right-3 z-30 flex max-w-[min(28rem,calc(100%-1.5rem))] items-center gap-2 rounded-lg border border-neutral-700/80 bg-neutral-950/90 px-3 py-2 text-xs text-neutral-100 shadow-lg"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
            <span className="min-w-0 truncate">{loadingProgress}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-7 shrink-0 px-2 text-[11px] text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              İptal Et
            </Button>
          </div>
        )}

        {/* WebGL Context Loss Kurtarma Durumu */}
        {phase === "context-lost" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4">
            <div className="p-6 bg-neutral-900 border border-amber-800/50 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-3">
              <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
              <h3 className="text-sm font-semibold text-neutral-100">Görüntü yeniden hazırlanıyor...</h3>
              <p className="text-xs text-neutral-400">
                Grafik bağlamı geçici olarak kaybedildi. GPU kaynakları otomatik olarak kurtarılıyor.
              </p>
            </div>
          </div>
        )}

        {/* İptal Edildi Durumu */}
        {phase === "cancelled" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4">
            <div className="max-w-sm w-full p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-4">
              <XCircle className="h-10 w-10 text-neutral-400" />
              <div>
                <h3 className="text-sm font-semibold text-neutral-100">İşlem İptal Edildi</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Çizim hazırlama işlemi kullanıcı tarafından sonlandırıldı.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => startPrepareFlow()}
                  className="text-xs border-neutral-700 hover:bg-neutral-800"
                >
                  Yeniden Başlat
                </Button>
                {onBack && (
                  <Button onClick={onBack} className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                    Geri Dön
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hata Durumu */}
        {phase === "error" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-md p-4">
            <div className="max-w-md w-full p-6 bg-neutral-900 border border-red-900/50 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-4">
              <ShieldAlert className="h-10 w-10 text-red-400" />
              <div>
                <h3 className="text-base font-semibold text-neutral-100">Görüntüleme Başarısız</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {errorMessage || "DWG/DXF Motor V2 dosyayı ayrıştırırken beklenmeyen bir durumla karşılaştı."}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full justify-center">
                <Button
                  variant="outline"
                  onClick={handleFallbackToLegacy}
                  className="text-xs border-neutral-700 hover:bg-neutral-800"
                >
                  Mevcut Görüntüleyiciyle Aç
                </Button>
                <Button
                  onClick={() => startPrepareFlow()}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  Tekrar Dene
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
