// ============================================================================
// DWG/DXF MOTOR V2 — HOST SHELL COMPONENT (G12)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G12), 28_PAN_ZOOM_FIT_SOZLESMESI.md
// ve 29_RENDER_VE_YASAM_DONGUSU.md
// Host state machine, error boundary, session/generation, iptal ve temiz unmount,
// 180s TTL / heartbeat, mobil dokunma izolasyonu, context loss recovery.

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { CadV2WorkerClient } from "@/lib/cad-v2/worker/worker-client";
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

  const apiBase = publicToken ? "/api/public/cad-v2" : "/api/dokumantasyon/cad-v2";
  const authHeaders: Record<string, string> = publicToken ? { "x-share-token": publicToken } : {};

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
      const manifest = await manifestRes.json();

      // Gerçek katmanları ve paftaları yükle
      if (manifest.layers && Object.keys(manifest.layers).length > 0) {
        setLayers(manifest.layers);
      }
      if (manifest.layouts && manifest.layouts.length > 0) {
        const normalizedLayouts = manifest.layouts.map((l: any) => ({
          layoutId: l.layoutId || l.sourceName || "Model",
          name: l.sourceName || l.name || l.layoutId || "Model",
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
        fitURef.current = rendererRef.current.getCameraAdapter().getState().unitsPerCssPixel;
        setZoomPercent(100);
      }

      // WorkerClient başlat
      if (workerClientRef.current) {
        workerClientRef.current.dispose();
      }
      workerClientRef.current = new CadV2WorkerClient(viewSessionId, manifest.sourceVersionKey || "1");

      // 4. Parçaları (chunks) eşzamanlı indir (concurrency = 6), worker ile unpack et ve renderera ekle
      const chunks = manifest.chunks || (manifest.indexPages?.[0]?.chunks) || [];
      let loadedCount = 0;
      let totalVertices = 0;

      if (rendererRef.current) {
        rendererRef.current.clearChunks();
      }

      if (chunks.length === 0) {
        setPhase(manifest.qualityStatus === "degraded" ? "degraded" : "ready");
        return;
      }

      const CHUNK_CONCURRENCY = 6;
      let nextIndex = 0;

      const workerTask = async () => {
        while (nextIndex < chunks.length) {
          if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;
          const idx = nextIndex++;
          const ch = chunks[idx];

          try {
            const chunkUrl = `${apiBase}/scenes/${sceneId}/chunks/${ch.chunkId}${publicToken ? `?shareToken=${encodeURIComponent(publicToken)}` : ""}`;
            const chunkRes = await fetch(chunkUrl, { headers: authHeaders, signal });
            if (!chunkRes.ok) continue;

            const chunkBuf = await chunkRes.arrayBuffer();
            if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

            const workerClient = workerClientRef.current;
            if (!workerClient) return;
            const unpacked = await workerClient.loadChunk(ch.chunkId, chunkBuf);
            if (rendererRef.current) {
              rendererRef.current.addSceneChunk(unpacked);
              totalVertices += unpacked.vertexCount;
              setEntityCount(totalVertices);
            }
          } catch (err: any) {
            console.warn(`[CadV2HostShell] Chunk yükleme hatası (${ch.chunkId}):`, err);
          }

          loadedCount++;
          setLoadingProgress(`Parçalar aktarılıyor (${loadedCount}/${chunks.length})...`);

          // İlk parça eklendiğinde kanvası aç, devamını progressive akıt
          if (loadedCount === 1) {
            setPhase((prev) => (prev === "loading" ? "ready" : prev));
          }
        }
      };

      const workerPool = Array.from(
        { length: Math.min(CHUNK_CONCURRENCY, chunks.length) },
        () => workerTask()
      );
      await Promise.all(workerPool);

      if (signal.aborted || isCancelledRef.current || currentGen !== generationRef.current) return;

      if (manifest.qualityStatus === "degraded") {
        setDiagnosticsWarning("Çizim bazı uyarılarla açıldı (eksik font veya desteklenmeyen nesneler mevcut).");
        setPhase("degraded");
      } else {
        setPhase("ready");
      }
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

  // Yaşam Döngüsü (Mount, Unmount, Visibility Change, Fullscreen, Escape)
  useEffect(() => {
    startPrepareFlow();

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
      isCancelledRef.current = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleGlobalKeyDown);
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
  }, [startPrepareFlow, scheduleHeartbeat, apiBase, authHeaders, isLayerPanelOpen, isSettingsOpen, isFocusMode]);

  const handleRendererReady = useCallback((renderer: CadV2Renderer) => {
    rendererRef.current = renderer;
  }, []);

  const handleCameraChange = useCallback((camState: any) => {
    if (fitURef.current && fitURef.current > 0 && camState?.unitsPerCssPixel > 0) {
      const pct = (fitURef.current / camState.unitsPerCssPixel) * 100;
      setZoomPercent(pct);
    }
  }, []);

  const handleZoomIn = () => rendererRef.current?.zoomIn();
  const handleZoomOut = () => rendererRef.current?.zoomOut();
  const handleFit = () => {
    rendererRef.current?.fit();
    if (rendererRef.current) {
      fitURef.current = rendererRef.current.getCameraAdapter().getState().unitsPerCssPixel;
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
      rendererRef.current.setFitBBox(target.bbox);
      rendererRef.current.fit(target.bbox);
      fitURef.current = rendererRef.current.getCameraAdapter().getState().unitsPerCssPixel;
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
