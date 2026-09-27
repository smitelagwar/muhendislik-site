// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ GÖRSEL GÖRÜNTÜLEYİCİ (IMAGE VIEWER STUDIO)
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Grid,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { StudioCommandButton } from "../studio/studio-command-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DokImageViewerProps {
  accessUrl: string;
  displayName: string;
}

type GesturePoint = {
  x: number;
  y: number;
};

type CameraState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type GestureState =
  | { mode: "idle" }
  | {
      mode: "pan";
      pointerId: number;
      startPoint: GesturePoint;
      startCamera: CameraState;
      activated: boolean;
    }
  | {
      mode: "pinch";
      startDistance: number;
      startMidpoint: GesturePoint;
      startCamera: CameraState;
    };

// Büyük mühendislik görsellerinin gerçekten ekrana sığabilmesi için düşük
// ölçeklere izin veriyoruz. Üst sınır Aşama 5 performans ölçümleriyle tekrar
// değerlendirilecek.
const MIN_SCALE = 0.02;
const MAX_SCALE = 5;
const PAN_START_THRESHOLD_PX = 5;
const DOUBLE_TAP_MAX_DELAY_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 28;
const GESTURE_HINT_SESSION_KEY = "dok-image-viewer-gesture-hint-seen";

function clampScale(value: number): number {
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}

function getPointerDistance(first: GesturePoint, second: GesturePoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getPointerMidpoint(first: GesturePoint, second: GesturePoint): GesturePoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function DokImageViewer({ accessUrl, displayName }: DokImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [camera, setCamera] = useState<CameraState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const scale = camera.scale;
  const [isFitMode, setIsFitMode] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [showCheckerboard, setShowCheckerboard] = useState<boolean>(true);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showGestureHint, setShowGestureHint] = useState(false);

  // Mobil/masaüstü işaretçi (pointer) ve gesture durumu.
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const activePointersRef = useRef<Map<number, GesturePoint>>(new Map());
  const gestureRef = useRef<GestureState>({ mode: "idle" });
  const cameraRef = useRef<CameraState>(camera);
  const lastTapRef = useRef<{ time: number; point: GesturePoint } | null>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setError(null);
    setLoading(false);
  };

  const handleImageError = () => {
    setError("Görsel yüklenirken bir hata oluştu veya bağlantı süresi doldu.");
    setLoading(false);
  };

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    return () => {
      activePointersRef.current.clear();
      gestureRef.current = { mode: "idle" };
      lastTapRef.current = null;
    };
  }, []);

  const dismissGestureHint = useCallback(() => {
    setShowGestureHint(false);
    try {
      window.sessionStorage.setItem(GESTURE_HINT_SESSION_KEY, "1");
    } catch {
      // Depolama kapalıysa ipucu yalnız mevcut oturum belleğinde kapanır.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    if (!coarsePointer) return;

    try {
      if (window.sessionStorage.getItem(GESTURE_HINT_SESSION_KEY) === "1") return;
    } catch {
      // sessionStorage kullanılamıyorsa yine de tek seferlik ipucu gösterilebilir.
    }

    setShowGestureHint(true);
    const timeoutId = window.setTimeout(() => dismissGestureHint(), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [dismissGestureHint]);

  const commitCamera = useCallback((nextCamera: CameraState) => {
    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  }, []);

  const clampCamera = useCallback(
    (candidate: CameraState, rotationValue = rotation): CameraState => {
      const container = containerRef.current;
      if (!container || !naturalSize) {
        return {
          ...candidate,
          scale: clampScale(candidate.scale),
        };
      }

      const safeScale = clampScale(candidate.scale);
      const isQuarterTurn = rotationValue % 180 !== 0;
      const displayWidth = (isQuarterTurn ? naturalSize.height : naturalSize.width) * safeScale;
      const displayHeight = (isQuarterTurn ? naturalSize.width : naturalSize.height) * safeScale;

      const maxOffsetX = Math.max(0, (displayWidth - container.clientWidth) / 2);
      const maxOffsetY = Math.max(0, (displayHeight - container.clientHeight) / 2);

      return {
        scale: safeScale,
        offsetX: Math.min(Math.max(candidate.offsetX, -maxOffsetX), maxOffsetX),
        offsetY: Math.min(Math.max(candidate.offsetY, -maxOffsetY), maxOffsetY),
      };
    },
    [naturalSize, rotation]
  );

  // Zoom to Fit
  const handleFitScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || !naturalSize) return;

    const compactViewport = container.clientWidth < 640;
    const padding = compactViewport ? 32 : 64;
    const containerWidth = Math.max(container.clientWidth - padding, 1);
    const containerHeight = Math.max(container.clientHeight - padding, 1);
    const isQuarterTurn = rotation % 180 !== 0;
    const imageWidth = isQuarterTurn ? naturalSize.height : naturalSize.width;
    const imageHeight = isQuarterTurn ? naturalSize.width : naturalSize.height;

    const widthRatio = containerWidth / imageWidth;
    const heightRatio = containerHeight / imageHeight;
    const fitRatio = Math.min(widthRatio, heightRatio, 1);
    const nextScale = parseFloat(clampScale(fitRatio).toFixed(3));

    commitCamera({ scale: nextScale, offsetX: 0, offsetY: 0 });
  }, [commitCamera, naturalSize, rotation]);

  useEffect(() => {
    if (naturalSize && isFitMode) {
      handleFitScreen();
    }
  }, [naturalSize, isFitMode, handleFitScreen]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !naturalSize) return;

    const observer = new ResizeObserver(() => {
      if (isFitMode) {
        handleFitScreen();
      } else {
        commitCamera(clampCamera(cameraRef.current));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [clampCamera, commitCamera, handleFitScreen, isFitMode, naturalSize]);

  useEffect(() => {
    if (!naturalSize || isFitMode) return;
    commitCamera(clampCamera(cameraRef.current, rotation));
  }, [clampCamera, commitCamera, isFitMode, naturalSize, rotation]);

  const zoomCameraAroundClientPoint = useCallback(
    (targetScale: number, clientPoint?: GesturePoint) => {
      const container = containerRef.current;
      if (!container) return;

      const current = cameraRef.current;
      const nextScale = parseFloat(clampScale(targetScale).toFixed(3));
      if (Math.abs(nextScale - current.scale) < 0.0005) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const localX = clientPoint ? clientPoint.x - rect.left : centerX;
      const localY = clientPoint ? clientPoint.y - rect.top : centerY;
      const scaleRatio = nextScale / current.scale;

      const anchorFromCameraX = localX - centerX - current.offsetX;
      const anchorFromCameraY = localY - centerY - current.offsetY;

      const nextCamera = clampCamera({
        scale: nextScale,
        offsetX: localX - centerX - anchorFromCameraX * scaleRatio,
        offsetY: localY - centerY - anchorFromCameraY * scaleRatio,
      });

      setIsFitMode(false);
      commitCamera(nextCamera);
    },
    [clampCamera, commitCamera]
  );

  const setCustomScale = useCallback(
    (updater: (current: number) => number) => {
      const current = cameraRef.current;
      zoomCameraAroundClientPoint(updater(current.scale));
    },
    [zoomCameraAroundClientPoint]
  );

  const rotate = (direction: 1 | -1) => {
    setRotation((current) => (current + direction * 90 + 360) % 360);
  };

  const resetView = () => {
    setIsFitMode(false);
    commitCamera({ scale: 1, offsetX: 0, offsetY: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Ctrl/Cmd + Wheel: mouse imlecinin altındaki görüntü noktasını koruyarak zoom.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      zoomCameraAroundClientPoint(cameraRef.current.scale + delta, {
        x: e.clientX,
        y: e.clientY,
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoomCameraAroundClientPoint]);

  const startPanGesture = useCallback((pointerId: number, point: GesturePoint) => {
    gestureRef.current = {
      mode: "pan",
      pointerId,
      startPoint: point,
      startCamera: cameraRef.current,
      activated: false,
    };
    setIsDragging(true);
  }, []);

  const startPinchGesture = useCallback(() => {
    const points = Array.from(activePointersRef.current.values());
    if (points.length < 2) return;

    const [first, second] = points;
    const startDistance = getPointerDistance(first, second);
    if (startDistance <= 0) return;

    gestureRef.current = {
      mode: "pinch",
      startDistance,
      startMidpoint: getPointerMidpoint(first, second),
      startCamera: cameraRef.current,
    };

    setIsFitMode(false);
    setIsDragging(true);
  }, []);

  const rebaseGestureFromActivePointers = useCallback(() => {
    const pointers = Array.from(activePointersRef.current.entries());

    if (pointers.length >= 2) {
      startPinchGesture();
      return;
    }

    if (pointers.length === 1) {
      const [pointerId, point] = pointers[0];
      startPanGesture(pointerId, point);
      return;
    }

    gestureRef.current = { mode: "idle" };
    setIsDragging(false);
  }, [startPanGesture, startPinchGesture]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    if (e.pointerType === "touch") {
      dismissGestureHint();
    }
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture desteklenmese bile gesture mevcut koordinatlarla devam edebilir.
    }

    if (activePointersRef.current.size === 1) {
      startPanGesture(e.pointerId, { x: e.clientX, y: e.clientY });
    } else if (activePointersRef.current.size === 2) {
      startPinchGesture();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const activePointers = activePointersRef.current;
    if (!container || !activePointers.has(e.pointerId)) return;

    e.preventDefault();
    const point = { x: e.clientX, y: e.clientY };
    activePointers.set(e.pointerId, point);

    const gesture = gestureRef.current;

    if (gesture.mode === "pan") {
      if (gesture.pointerId !== e.pointerId || activePointers.size !== 1) return;

      const deltaX = point.x - gesture.startPoint.x;
      const deltaY = point.y - gesture.startPoint.y;
      const movement = Math.hypot(deltaX, deltaY);

      if (!gesture.activated && movement < PAN_START_THRESHOLD_PX) {
        return;
      }

      if (!gesture.activated) {
        gestureRef.current = { ...gesture, activated: true };
      }

      setIsFitMode(false);
      commitCamera(
        clampCamera({
          ...gesture.startCamera,
          offsetX: gesture.startCamera.offsetX + deltaX,
          offsetY: gesture.startCamera.offsetY + deltaY,
        })
      );
      return;
    }

    if (gesture.mode !== "pinch" || activePointers.size < 2) return;

    const pointerEntries = Array.from(activePointers.entries()).slice(0, 2);
    if (!pointerEntries.some(([pointerId]) => pointerId === e.pointerId)) return;

    const first = pointerEntries[0][1];
    const second = pointerEntries[1][1];
    const currentDistance = getPointerDistance(first, second);
    if (currentDistance <= 0 || gesture.startDistance <= 0) return;

    const currentMidpoint = getPointerMidpoint(first, second);
    const nextScale = parseFloat(
      clampScale(
        gesture.startCamera.scale * (currentDistance / gesture.startDistance)
      ).toFixed(3)
    );
    const scaleRatio = nextScale / gesture.startCamera.scale;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const startLocalX = gesture.startMidpoint.x - rect.left;
    const startLocalY = gesture.startMidpoint.y - rect.top;
    const currentLocalX = currentMidpoint.x - rect.left;
    const currentLocalY = currentMidpoint.y - rect.top;

    const anchorFromCameraX =
      startLocalX - centerX - gesture.startCamera.offsetX;
    const anchorFromCameraY =
      startLocalY - centerY - gesture.startCamera.offsetY;

    commitCamera(
      clampCamera({
        scale: nextScale,
        offsetX:
          currentLocalX - centerX - anchorFromCameraX * scaleRatio,
        offsetY:
          currentLocalY - centerY - anchorFromCameraY * scaleRatio,
      })
    );
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const activePointers = activePointersRef.current;
    if (!activePointers.has(e.pointerId)) return;

    const gestureBeforeEnd = gestureRef.current;
    const wasTapCandidate =
      e.type === "pointerup" &&
      e.pointerType === "touch" &&
      activePointers.size === 1 &&
      gestureBeforeEnd.mode === "pan" &&
      gestureBeforeEnd.pointerId === e.pointerId &&
      !gestureBeforeEnd.activated;

    activePointers.delete(e.pointerId);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    rebaseGestureFromActivePointers();

    if (!wasTapCandidate) {
      if (gestureBeforeEnd.mode !== "pan" || gestureBeforeEnd.activated) {
        lastTapRef.current = null;
      }
      return;
    }

    const now = performance.now();
    const point = { x: e.clientX, y: e.clientY };
    const previousTap = lastTapRef.current;

    if (
      previousTap &&
      now - previousTap.time <= DOUBLE_TAP_MAX_DELAY_MS &&
      getPointerDistance(previousTap.point, point) <= DOUBLE_TAP_MAX_DISTANCE_PX
    ) {
      lastTapRef.current = null;

      if (isFitMode) {
        const targetScale = Math.min(1, cameraRef.current.scale * 2);
        zoomCameraAroundClientPoint(targetScale, point);
      } else {
        setIsFitMode(true);
        handleFitScreen();
      }
      return;
    }

    lastTapRef.current = { time: now, point };
  };

  // CSS Transform Hesabı — pan/zoom layout ölçülerini büyütmek yerine
  // tek kamera transform'u üzerinden uygulanır.
  const transformStyle: React.CSSProperties = naturalSize
    ? {
        left: "50%",
        top: "50%",
        width: naturalSize.width,
        height: naturalSize.height,
        marginLeft: -naturalSize.width / 2,
        marginTop: -naturalSize.height / 2,
        transform: `translate3d(${camera.offsetX}px, ${camera.offsetY}px, 0) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${scale})`,
        transformOrigin: "center center",
        transition: isDragging ? "none" : "transform 0.15s ease-out",
      }
    : undefined;

  return (
    <div
      data-zoom-mode={isFitMode ? "fit" : "custom"}
      data-rotation={rotation}
      data-scale={scale.toFixed(3)}
      data-camera-x={camera.offsetX.toFixed(2)}
      data-camera-y={camera.offsetY.toFixed(2)}
      className="flex h-full w-full flex-col bg-background text-foreground select-none"
    >
      {/* Görsel Araç Çubuğu (Toolbar) */}
      <div className="z-30 flex min-h-12 shrink-0 items-center justify-between gap-1.5 border-b border-border/70 bg-card/85 px-2 text-xs backdrop-blur-md sm:px-3">
        {/* Sol Alan: Çözünürlük ve Piksel Bilgisi */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          {naturalSize ? (
            <span className="block truncate font-mono text-[10px] font-bold text-foreground min-[390px]:text-[11px]">
              {naturalSize.width} × {naturalSize.height} px
            </span>
          ) : (
            <span>Görsel Yükleniyor...</span>
          )}
        </div>

        {/* Sağ Alan: Zoom, Döndürme, Aynalama, Zemin */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Zoom Kontrolleri */}
          <StudioCommandButton
            commandId="image.zoom.out"
            onClick={() => setCustomScale((current) => current - 0.2)}
            showLabel={false}
            className="h-10 w-10 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors sm:h-8 sm:w-8"
            icon={<ZoomOut className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.100"
            onClick={resetView}
            className="h-10 min-w-[46px] px-2 text-[11px] font-mono font-bold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors sm:h-7 sm:min-w-0"
            label={`${Math.round(scale * 100)}%`}
          />

          <StudioCommandButton
            commandId="image.zoom.in"
            onClick={() => setCustomScale((current) => current + 0.2)}
            showLabel={false}
            className="h-10 w-10 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors sm:h-8 sm:w-8"
            icon={<ZoomIn className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.zoom.fit"
            onClick={() => {
              setIsFitMode(true);
              handleFitScreen();
            }}
            className="inline-flex h-10 px-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors sm:h-7"
            label="Sığdır"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Görsel ek işlemleri" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={() => rotate(-1)}>Sola döndür</DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={() => rotate(1)}>Sağa döndür</DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={resetView}>Görünümü sıfırla</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={() => setFlipH((value) => !value)}>Yatay aynala</DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={() => setFlipV((value) => !value)}>Dikey aynala</DropdownMenuItem>
              <DropdownMenuItem className="min-h-10 cursor-pointer text-xs rounded-lg sm:min-h-0" onClick={() => setShowCheckerboard((value) => !value)}>Şeffaflık zeminini değiştir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

          {/* Döndürme */}
          <StudioCommandButton
            commandId="image.rotate.ccw"
            onClick={() => rotate(-1)}
            showLabel={false}
            className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.rotate.cw"
            onClick={() => rotate(1)}
            showLabel={false}
            className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<RotateCw className="h-3.5 w-3.5" />}
          />

          <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

          {/* Aynalama */}
          <StudioCommandButton
            commandId="image.flip.horizontal"
            onClick={() => setFlipH((value) => !value)}
            active={flipH}
            showLabel={false}
            className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<FlipHorizontal className="h-3.5 w-3.5" />}
          />

          <StudioCommandButton
            commandId="image.flip.vertical"
            onClick={() => setFlipV((value) => !value)}
            active={flipV}
            showLabel={false}
            className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<FlipVertical className="h-3.5 w-3.5" />}
          />

          <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

          {/* Şeffaflık Arkaplan Izgarası */}
          <StudioCommandButton
            commandId="image.checkerboard.toggle"
            onClick={() => setShowCheckerboard((value) => !value)}
            active={showCheckerboard}
            showLabel={false}
            className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<Grid className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Görsel Çalışma Alanı (Viewport) */}
      <div
        ref={containerRef}
        data-testid="image-viewer-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
        className={`relative flex flex-1 touch-none items-center justify-center overflow-hidden p-4 sm:p-8 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        } ${
          showCheckerboard
            ? "bg-[linear-gradient(45deg,#18181b_25%,transparent_25%),linear-gradient(-45deg,#18181b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#18181b_75%),linear-gradient(-45deg,transparent_75%,#18181b_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-zinc-950"
            : "bg-zinc-950"
        }`}
      >
        {showGestureHint && naturalSize && !loading && !error && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-zinc-950/85 px-3 py-2 text-[11px] font-medium text-zinc-100 shadow-xl backdrop-blur-md"
            style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            İki parmakla yakınlaştır • Sürükleyerek gez
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Görsel yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl backdrop-blur-md">
            <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Görsel Yükleme Hatası</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
            <button type="button" onClick={retryLoad} className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 hover:bg-white">Tekrar dene</button>
          </div>
        )}

        {naturalSize && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              key={loadAttempt}
              src={accessUrl}
              alt={displayName}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={transformStyle}
              draggable={false}
              className={`absolute max-w-none rounded shadow-2xl transition-opacity duration-200 pointer-events-none select-none ${loading ? "opacity-0" : "opacity-100"}`}
            />
          </>
        )}
        {!naturalSize && (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imageRef} key={loadAttempt} src={accessUrl} alt={displayName} onLoad={handleImageLoad} onError={handleImageError} className="hidden" />
        )}
      </div>
    </div>
  );
}
