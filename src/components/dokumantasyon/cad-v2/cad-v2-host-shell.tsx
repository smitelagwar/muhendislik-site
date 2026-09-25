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
import type { UnpackedSceneChunk } from "@/workers/cad-v2/cad-v2-scene-worker";
import {
  validateSceneManifest,
  type ValidatedSceneManifest,
} from "@/lib/cad-v2/protocol/binary-protocol";
import { formatBytes } from "../ui-helpers";

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
  const [diagnosticsWarning, setDiagnosticsWarning] = useState<string | null>(null);
  const [coords, setCoords] = useState<[number, number]>([0, 0]);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isPanActive, setIsPanActive] = useState<boolean>(true);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [entityCount, setEntityCount] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<string>("İşlem başlatılıyor...");
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
  const workerClientRef = useRef<CadV2WorkerClient | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentViewSessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const generationRef = useRef<number>(1);
  const fitURef = useRef<number | null>(null);
  const currentVersionKeyRef = useRef<string | undefined>(sourceVersionKey);
  const startPrepareFlowRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const refinementChunksRef = useRef<Map<string, UnpackedSceneChunk>>(new Map());
  const refinementSourceBytesRef = useRef(0);
  const refinementSourceBudgetExceededRef = useRef(false);
    const refinedProfilesRef = useRef<Map<string, { bucket: number; attemptedErrorCssPixels: number; displayedErrorWorldUnits: number | null }>>(new Map());
  const refinementTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refinementEpochRef = useRef(0);
  const refinementRunningRef = useRef(false);
  const refinementEnabledRef = useRef(false);
  const requestedRefinementBucketRef = useRef<number | null>(null);
  const latestCameraStateRef = useRef<CadCameraState | null>(null);
  const requestRefinementRef = useRef<(state: CadCameraState) => void>(() => {});

  const apiBase = publicToken ? "/api/public/cad-v2" : "/api/dokumantasyon/cad-v2";
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (publicToken) {
      headers["x-share-token"] = publicToken;
    }
    return headers;
  }, [publicToken]);

  // Kalp atışı (Heartbeat) yöneticisi (180s TTL, 30s aktif, 60s arka plan)
  const scheduleHeartbeat = useCallback((viewSessionId: string) => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    const intervalMs = typeof document !== "undefined" && document.visibilityState === "hidden" ? 60_000 : 30_000;

    heartbeatTimerRef.current = setInterval(async () => {
      if (isCancelledRef.current || !currentViewSessionIdRef.current) return;
      try {
        const res = await fetch(`${apiBase}/view-sessions/${viewSessionId}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
        });
        if (res.status === 410) {
          // VIEW_SESSION_EXPIRED: Oturum süresi dolmuşsa yeniden prepare çağır
          console.warn("[CadV2Host] Oturum süresi doldu, yeniden hazırlanıyor...");
          startPrepareFlowRef.current();
        }
      } catch (err) {
        // Ağ hatası durumunda bir sonraki heartbeat deneyecek
      }
    }, intervalMs);
  }, [apiBase, authHeaders]);

  // Ana Hazırlama ve Yükleme Akışı
  const startPrepareFlow = useCallback(async () => {
    isCancelledRef.current = false;
    generationRef.current++;
    refinementEnabledRef.current = false;
    requestedRefinementBucketRef.current = null;
    refinementEpochRef.current++;
    refinementChunksRef.current.clear();
    refinementSourceBytesRef.current = 0;
    refinementSourceBudgetExceededRef.current = false;
    refinedProfilesRef.current.clear();
    if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
    const currentGen = generationRef.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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

      if (!prepRes.ok) {
        const errJson = await prepRes.json().catch(() => ({}));
        if (prepRes.status === 409) {
          // SOURCE_REVISION_CHANGED
          if (errJson.actualSourceVersionKey) {
            currentVersionKeyRef.current = errJson.actualSourceVersionKey;
          }
          setLoadingProgress("Dosya güncellendi, yeni revizyon yükleniyor...");
          return startPrepareFlow();
        }
        throw new Error(errJson.message || `Hazırlama isteği başarısız (${prepRes.status})`);
      }

      const prepData = await prepRes.json();
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
      // P02 Kuralı: JSON cast yerine katı doğrulayıcı çalıştır
      const manifest: ValidatedSceneManifest = validateSceneManifest(rawManifestJson);
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
      }

      // Modelin gerçek sınır kutusunu kaydet ve ekrana hemen sığdır
      if (manifest.layouts?.[0]?.bbox && rendererRef.current) {
        const modelBBox = manifest.layouts[0].bbox;
        rendererRef.current.setFitBBox(modelBBox);
        rendererRef.current.fit(modelBBox);
        fitURef.current = rendererRef.current.getCameraAdapter()?.getState()?.unitsPerCssPixel ?? null;
        setZoomPercent(100);
      }

      // WorkerClient başlat
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
      }
      workerClientRef.current = new CadV2WorkerClient(viewSessionId, manifest.sourceVersionKey || "1");

      // 4. Parçaları (chunks) set tabanlı takip et ve doğrula
      const chunks = manifest.chunks;
      const expectedChunkIds = new Set(chunks.map((c) => c.chunkId));
      const fetchedChunkIds = new Set<string>();
      const hashVerifiedChunkIds = new Set<string>();
      const decodedChunkIds = new Set<string>();
      const rendererAcceptedChunkIds = new Set<string>();

      let loadedCount = 0;
      let totalVertices = 0;

      if (rendererRef.current) {
        rendererRef.current.clearChunks();
      }
      refinementChunksRef.current.clear();
      refinementSourceBytesRef.current = 0;
      refinementSourceBudgetExceededRef.current = false;
      refinedProfilesRef.current.clear();
      requestedRefinementBucketRef.current = null;

      if (chunks.length === 0) {
        setPhase(manifest.qualityStatus === "degraded" ? "degraded" : "ready");
        return;
      }

      const CHUNK_CONCURRENCY = 6;
      let nextIndex = 0;

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

      const workerTask = async () => {
        while (nextIndex < chunks.length) {
          if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
          const idx = nextIndex++;
          const ch = chunks[idx];

          let attempt = 0;
          let chunkBuf: ArrayBuffer | null = null;

          while (attempt < 3 && !chunkBuf) {
            if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
            attempt++;
            try {
              const chunkUrl = `${apiBase}/scenes/${sceneId}/chunks/${ch.chunkId}${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
              const chunkRes = await fetch(chunkUrl, { headers: authHeaders, signal });
              if (chunkRes.status === 401 || chunkRes.status === 403) {
                throw new Error(`Yetki hatası (${chunkRes.status}): ${ch.chunkId}`);
              }
              if (chunkRes.status === 404) {
                throw new Error(`Kritik parça bulunamadı (404): ${ch.chunkId}`);
              }
              if (!chunkRes.ok) {
                if (attempt < 3) {
                  await new Promise((r) => setTimeout(r, 250 * attempt));
                  continue;
                }
                throw new Error(`Parça indirilemedi (${chunkRes.status}): ${ch.chunkId}`);
              }
              chunkBuf = await chunkRes.arrayBuffer();
            } catch (fetchErr: any) {
              if (fetchErr.name === "AbortError" || signal.aborted) return;
              if (attempt >= 3) throw fetchErr;
              await new Promise((r) => setTimeout(r, 250 * attempt));
            }
          }

          if (!chunkBuf) {
            throw new Error(`Parça indirilemedi: ${ch.chunkId}`);
          }
          fetchedChunkIds.add(ch.chunkId);

          // Byte length ve Hash doğrulama
          if (chunkBuf.byteLength !== ch.byteLength) {
            throw new Error(
              `[HostShell] Parça boyutu uyuşmazlığı (${ch.chunkId}): beklenen ${ch.byteLength}, alınan ${chunkBuf.byteLength}`
            );
          }

          const actualSha = await computeBufferSha256(chunkBuf);
          if (actualSha && ch.sha256 && actualSha.toLowerCase() !== ch.sha256.toLowerCase()) {
            throw new Error(
              `[HostShell] SHA-256 sağlama toplamı uyuşmazlığı (${ch.chunkId}): beklenen ${ch.sha256}, alınan ${actualSha}`
            );
          }
          hashVerifiedChunkIds.add(ch.chunkId);

          if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

          const workerClient = workerClientRef.current;
          if (!workerClient) return;

          const unpacked = await workerClient.loadChunk(ch.chunkId, chunkBuf);
          decodedChunkIds.add(ch.chunkId);

          if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

          if (rendererRef.current) {
            rendererRef.current.addSceneChunk(unpacked);
            if (unpacked.curveDataArray && unpacked.meta?.curveSourceRefs?.length) {
              const metadataBytes = JSON.stringify(unpacked.meta).length * 2;
              const sourceBytes = unpacked.xyArray.byteLength + (unpacked.trianglesArray?.byteLength ?? 0) +
                (unpacked.pathDistancesArray?.byteLength ?? 0) + (unpacked.drawRunsArray?.byteLength ?? 0) +
                unpacked.curveDataArray.byteLength + metadataBytes;
              if (refinementSourceBytesRef.current + sourceBytes <= 32 * 1024 * 1024) {
                refinementChunksRef.current.set(ch.chunkId, unpacked);
                refinementSourceBytesRef.current += sourceBytes;
              } else {
                refinementSourceBudgetExceededRef.current = true;
              }
            }
            rendererAcceptedChunkIds.add(ch.chunkId);
            totalVertices += unpacked.vertexCount;
            setEntityCount(totalVertices);
          }

          loadedCount++;
          setLoadingProgress(`Parçalar aktarılıyor (${loadedCount}/${chunks.length})...`);
        }
      };

      const workerPool = Array.from(
        { length: Math.min(CHUNK_CONCURRENCY, chunks.length) },
        () => workerTask()
      );
      await Promise.all(workerPool);

      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

      // P02 Kuralı: Bütün beklenen parçalar doğrulandı mı kontrol et
      const isComplete = expectedChunkIds.size === rendererAcceptedChunkIds.size &&
        [...expectedChunkIds].every((id) => rendererAcceptedChunkIds.has(id));

      if (!isComplete) {
        const missingCount = expectedChunkIds.size - rendererAcceptedChunkIds.size;
        setDiagnosticsWarning(`Bazı parçalar aktarılamadı (${missingCount} eksik parça). Çizim kısmi görüntülendi.`);
        setPhase("degraded");
        return;
      }

      if (manifest.qualityStatus === "degraded" || refinementSourceBudgetExceededRef.current) {
        setDiagnosticsWarning(refinementSourceBudgetExceededRef.current
          ? "Büyük çizim nedeniyle bazı eğriler canlı hassaslaştırma belleği sınırının dışında kaldı; temel çizimleri korunuyor."
          : "Çizim bazı uyarılarla açıldı (eksik font veya desteklenmeyen nesneler mevcut).");
        setPhase("degraded");
      } else {
        setPhase("ready");
      }
      refinementEnabledRef.current = true;
      if (latestCameraStateRef.current) requestRefinementRef.current(latestCameraStateRef.current);
    } catch (err: any) {
      if (signal.aborted || isCancelledRef.current) return;
      setPhase("error");
      setErrorMessage(err?.message || "Beklenmeyen bir hata oluştu.");
    }
  }, [apiBase, authHeaders, fileId, sourceVersionKey, publicToken, scheduleHeartbeat]);

  startPrepareFlowRef.current = startPrepareFlow;

  // Kullanıcı İptali (Cancellation)
  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    refinementEnabledRef.current = false;
    refinementEpochRef.current++;
    if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (currentViewSessionIdRef.current) {
      fetch(`${apiBase}/view-sessions/${currentViewSessionIdRef.current}`, {
        method: "DELETE",
        headers: authHeaders,
        keepalive: true,
      }).catch(() => {});
      currentViewSessionIdRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    setPhase("cancelled");
  }, [apiBase, authHeaders]);

  // WebGL Context Loss / Restore Yöneticisi (R30, V16)
  const handleContextLost = useCallback(() => {
    console.warn("[CadV2Host] WebGL context loss algılandı.");
    setPhase("context-lost");
  }, []);

  const handleContextRestored = useCallback(() => {
    console.log("[CadV2Host] WebGL context başarıyla geri yüklendi.");
    setPhase("ready");
  }, []);

  // Yaşam Döngüsü (Mount, Unmount per fileId)
  useEffect(() => {
    startPrepareFlow();

    return () => {
      isCancelledRef.current = true;
      refinementEnabledRef.current = false;
      refinementEpochRef.current++;
      if (refinementTimerRef.current) clearTimeout(refinementTimerRef.current);
      refinementChunksRef.current.clear();
      refinementSourceBytesRef.current = 0;
      refinementSourceBudgetExceededRef.current = false;
      refinedProfilesRef.current.clear();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (currentViewSessionIdRef.current) {
        fetch(`${apiBase}/view-sessions/${currentViewSessionIdRef.current}`, {
          method: "DELETE",
          headers: authHeaders,
          keepalive: true,
        }).catch(() => {});
      }
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
      }
    };
  }, [fileId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, []);

  const handleCameraChange = useCallback((camState: any) => {
    if (camState && Number.isFinite(camState.unitsPerCssPixel) && camState.unitsPerCssPixel > 0) {
      latestCameraStateRef.current = camState as CadCameraState;
      requestRefinementRef.current(camState as CadCameraState);
    }
    if (fitURef.current && fitURef.current > 0 && camState?.unitsPerCssPixel > 0) {
      const pct = (fitURef.current / camState.unitsPerCssPixel) * 100;
      setZoomPercent(pct);
    }
  }, []);

  const queueCameraRefinement = useCallback((cameraState: CadCameraState) => {
    if (!refinementEnabledRef.current || !Number.isFinite(cameraState.unitsPerCssPixel) || cameraState.unitsPerCssPixel <= 0) return;
    // 1/4 octave buckets: pan is excluded, and small wheel noise is coalesced.
    const bucket = Math.round(Math.log2(cameraState.unitsPerCssPixel) * 4) / 4;
    const curveChunks = [...refinementChunksRef.current.entries()].filter(([, chunk]) =>
      chunk.curveDataArray && chunk.meta?.curveSourceRefs?.length);
    if (curveChunks.length === 0) return;
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
      });
      const idleAttempted = curveChunks.every(([chunkId]) => {
        const state = refinedProfilesRef.current.get(chunkId);
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
        for (const [chunkId, sourceChunk] of curveChunks) {
          if (epoch !== refinementEpochRef.current || !refinementEnabledRef.current) break;
          const previous = refinedProfilesRef.current.get(chunkId);
          if (previous?.bucket === bucket && previous.attemptedErrorCssPixels <= targetErrorCssPixels) continue;
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
              const refinedChunk = applyCurveRefinementsToChunk(sourceChunk, result);
              if (refinedChunk !== sourceChunk) renderer.replaceSceneChunkGeometry(refinedChunk);
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
      } catch (error) {
        // Refinement is an enhancement. The validated/current display remains visible.
        console.warn("[CadV2Host] Eğri hassaslaştırması uygulanamadı; mevcut geometri korunuyor.", error);
        if (refinementEnabledRef.current && epoch === refinementEpochRef.current) {
          setDiagnosticsWarning("Canlı eğri hassaslaştırması tamamlanamadı; mevcut çizim korunuyor.");
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
  }, []);
  requestRefinementRef.current = queueCameraRefinement;

  const handleZoomIn = () => rendererRef.current?.zoomIn();
  const handleZoomOut = () => rendererRef.current?.zoomOut();
  const handleFit = () => {
    rendererRef.current?.fit();
    if (rendererRef.current) {
      fitURef.current = rendererRef.current.getCameraAdapter()?.getState()?.unitsPerCssPixel ?? null;
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
      setActiveLayoutName(target.name);
      rendererRef.current.setActiveLayout(target.layoutId);
      rendererRef.current.setFitBBox(target.bbox);
      rendererRef.current.fit(target.bbox);
      fitURef.current = rendererRef.current.getCameraAdapter()?.getState()?.unitsPerCssPixel ?? null;
      setZoomPercent(100);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<CadV2ViewSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
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
      if (newSettings.showLineweights !== undefined && rendererRef.current) {
        rendererRef.current.setLineweight(newSettings.showLineweights);
      }
      return updated;
    });
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
        {(phase === "preparing" || phase === "loading") && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-md">
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
                  onClick={startPrepareFlow}
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
                  onClick={startPrepareFlow}
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
