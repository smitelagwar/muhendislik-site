// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GELİŞMİŞ GÖRSEL GÖRÜNTÜLEYİCİ (IMAGE VIEWER STUDIO)
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Share2,
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
  Copy,
  Download,
  Check,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { StudioCommandButton } from "../studio/studio-command-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  clampImageCamera,
  computeImageFitScale,
  getImageViewerScaleLimits,
  getImagePointerDistance,
  getImagePointerMidpoint,
  zoomImageCameraBetweenPoints,
  type ImageViewerCamera as CameraState,
  type ImageViewerPoint as GesturePoint,
  type ImageViewerSize,
} from "./image-viewer-geometry";

interface DokImageViewerProps {
  accessUrl: string;
  displayName: string;
  fileId?: string;
  versionNo?: number;
  onBack?: () => void;
  onShare?: () => void;
}

async function renderTransformedBlob(
  sourceUrl: string,
  naturalWidth: number,
  naturalHeight: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const isPerpendicular = (Math.abs(rotation) / 90) % 2 === 1;
  canvas.width = isPerpendicular ? naturalHeight : naturalWidth;
  canvas.height = isPerpendicular ? naturalWidth : naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context alınamadı");

  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("CORS hatası"));
      el.src = sourceUrl;
    });
  } catch {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = sourceUrl;
    });
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas blob üretilemedi"))),
      "image/png"
    );
  });
}

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

const PAN_START_THRESHOLD_PX = 5;
const DOUBLE_TAP_MAX_DELAY_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 28;
const GESTURE_HINT_SESSION_KEY = "dok-image-viewer-gesture-hint-seen";
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
const MAX_NORMALIZED_WHEEL_DELTA = 300;

export function DokImageViewer({
  accessUrl,
  displayName,
  fileId,
  versionNo,
  onBack,
  onShare,
}: DokImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [camera, setCamera] = useState<CameraState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [viewportSize, setViewportSize] = useState<ImageViewerSize | null>(null);
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
  const [isWheelZooming, setIsWheelZooming] = useState(false);

  // Kopyalama & İndirme Durumları
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "done" | "error">("idle");
  const copyFeedbackTimerRef = useRef<number | null>(null);
  const downloadFeedbackTimerRef = useRef<number | null>(null);

  // Mobil/masaüstü işaretçi (pointer) ve gesture durumu.
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const activePointersRef = useRef<Map<number, GesturePoint>>(new Map());
  const gestureRef = useRef<GestureState>({ mode: "idle" });
  const cameraRef = useRef<CameraState>(camera);
  const pendingCameraRef = useRef<CameraState | null>(null);
  const cameraFrameRef = useRef<number | null>(null);
  const wheelIdleTimeoutRef = useRef<number | null>(null);
  const lastTapRef = useRef<{ time: number; point: GesturePoint } | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
      if (downloadFeedbackTimerRef.current) window.clearTimeout(downloadFeedbackTimerRef.current);
    };
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    if (!naturalSize || copyState === "copying") return;
    setCopyState("copying");
    try {
      const blob = await renderTransformedBlob(
        accessUrl,
        naturalSize.width,
        naturalSize.height,
        rotation,
        flipH,
        flipV
      );
      if (typeof navigator !== "undefined" && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopyState("copied");
      } else {
        throw new Error("Tarayıcı panoya görsel yazmayı desteklemiyor");
      }
    } catch (err) {
      console.error("Panoya kopyalama hatası:", err);
      setCopyState("error");
    } finally {
      if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
      copyFeedbackTimerRef.current = window.setTimeout(() => {
        setCopyState("idle");
      }, 2000);
    }
  }, [accessUrl, naturalSize, rotation, flipH, flipV, copyState]);

  const handleDownload = useCallback(async () => {
    if (!naturalSize || downloadState === "downloading") return;
    setDownloadState("downloading");
    try {
      const blob = await renderTransformedBlob(
        accessUrl,
        naturalSize.width,
        naturalSize.height,
        rotation,
        flipH,
        flipV
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = displayName.replace(/\.[^/.]+$/, "");
      a.download = `${baseName}_duzenlenmis.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadState("done");
    } catch (err) {
      console.error("Görsel indirme hatası:", err);
      setDownloadState("error");
    } finally {
      if (downloadFeedbackTimerRef.current) window.clearTimeout(downloadFeedbackTimerRef.current);
      downloadFeedbackTimerRef.current = window.setTimeout(() => {
        setDownloadState("idle");
      }, 2000);
    }
  }, [accessUrl, naturalSize, rotation, flipH, flipV, displayName, downloadState]);

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
    const activePointers = activePointersRef.current;

    return () => {
      if (cameraFrameRef.current !== null) {
        cancelAnimationFrame(cameraFrameRef.current);
      }
      if (wheelIdleTimeoutRef.current !== null) {
        window.clearTimeout(wheelIdleTimeoutRef.current);
      }
      cameraFrameRef.current = null;
      pendingCameraRef.current = null;
      activePointers.clear();
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

    // React Hooks lint kuralına göre effect gövdesinde senkron state değişimi
    // yapmıyoruz. İlk paint/hydration tamamlandıktan sonra ipucunu göster.
    const revealTimeoutId = window.setTimeout(() => {
      setShowGestureHint(true);
    }, 0);
    const hideTimeoutId = window.setTimeout(() => {
      dismissGestureHint();
    }, 4500);

    return () => {
      window.clearTimeout(revealTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [dismissGestureHint]);

  const commitCamera = useCallback((nextCamera: CameraState) => {
    if (cameraFrameRef.current !== null) {
      cancelAnimationFrame(cameraFrameRef.current);
      cameraFrameRef.current = null;
    }
    pendingCameraRef.current = null;
    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  }, []);

  // Pointermove çok yüksek frekansta gelebilir. Kamera ref'i anında güncellenir,
  // React state ise frame başına en fazla bir kez commit edilir.
  const scheduleCamera = useCallback((nextCamera: CameraState) => {
    cameraRef.current = nextCamera;
    pendingCameraRef.current = nextCamera;

    if (cameraFrameRef.current !== null) return;

    cameraFrameRef.current = requestAnimationFrame(() => {
      cameraFrameRef.current = null;
      const pendingCamera = pendingCameraRef.current;
      pendingCameraRef.current = null;
      if (pendingCamera) {
        setCamera(pendingCamera);
      }
    });
  }, []);

  const flushScheduledCamera = useCallback(() => {
    const pendingCamera = pendingCameraRef.current;
    if (!pendingCamera) return;

    if (cameraFrameRef.current !== null) {
      cancelAnimationFrame(cameraFrameRef.current);
      cameraFrameRef.current = null;
    }

    pendingCameraRef.current = null;
    cameraRef.current = pendingCamera;
    setCamera(pendingCamera);
  }, []);

  const getScaleLimits = useCallback(
    (viewport: ImageViewerSize, rotationValue = rotation) => {
      if (!naturalSize) {
        return getImageViewerScaleLimits(1);
      }

      const padding = viewport.width < 640 ? 32 : 64;
      const fitScale = computeImageFitScale(viewport, naturalSize, rotationValue, padding);
      return getImageViewerScaleLimits(fitScale);
    },
    [naturalSize, rotation]
  );

  const clampCamera = useCallback(
    (candidate: CameraState, rotationValue = rotation): CameraState => {
      const container = containerRef.current;
      if (!container || !naturalSize) return candidate;

      const viewport = { width: container.clientWidth, height: container.clientHeight };

      return clampImageCamera(
        candidate,
        viewport,
        naturalSize,
        rotationValue,
        getScaleLimits(viewport, rotationValue)
      );
    },
    [getScaleLimits, naturalSize, rotation]
  );

  // Zoom to Fit
  const handleFitScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container || !naturalSize) return;

    const compactViewport = container.clientWidth < 640;
    const padding = compactViewport ? 32 : 64;
    const nextScale = computeImageFitScale(
      { width: container.clientWidth, height: container.clientHeight },
      naturalSize,
      rotation,
      padding
    );

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
      const nextViewport = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
      setViewportSize((current) =>
        current?.width === nextViewport.width && current.height === nextViewport.height
          ? current
          : nextViewport
      );

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

      if (!naturalSize) return;

      const current = cameraRef.current;
      const rect = container.getBoundingClientRect();
      const centerPoint = { x: rect.width / 2, y: rect.height / 2 };
      const localPoint = clientPoint
        ? { x: clientPoint.x - rect.left, y: clientPoint.y - rect.top }
        : centerPoint;

      const nextCamera = zoomImageCameraBetweenPoints(
        current,
        targetScale,
        localPoint,
        localPoint,
        { width: rect.width, height: rect.height },
        naturalSize,
        rotation,
        getScaleLimits({ width: rect.width, height: rect.height })
      );

      if (Math.abs(nextCamera.scale - current.scale) < 0.0005) return;

      setIsFitMode(false);
      scheduleCamera(nextCamera);
    },
    [getScaleLimits, naturalSize, rotation, scheduleCamera]
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
    const container = containerRef.current;
    setIsFitMode(true);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);

    if (!container || !naturalSize) return;

    const viewport = { width: container.clientWidth, height: container.clientHeight };
    const padding = viewport.width < 640 ? 32 : 64;
    const fitScale = computeImageFitScale(viewport, naturalSize, 0, padding);
    commitCamera({ scale: fitScale, offsetX: 0, offsetY: 0 });
  };

  const retryLoad = () => {
    setError(null);
    setLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  };

  // Tekerlek ve trackpad yakınlaştırması pointer odağını korur.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!Number.isFinite(e.deltaY) || e.deltaY === 0) return;

      const deltaMultiplier =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? container.clientHeight
            : 1;
      const normalizedDelta = Math.min(
        Math.max(e.deltaY * deltaMultiplier, -MAX_NORMALIZED_WHEEL_DELTA),
        MAX_NORMALIZED_WHEEL_DELTA
      );

      setIsWheelZooming(true);
      if (wheelIdleTimeoutRef.current !== null) {
        window.clearTimeout(wheelIdleTimeoutRef.current);
      }
      wheelIdleTimeoutRef.current = window.setTimeout(() => {
        wheelIdleTimeoutRef.current = null;
        setIsWheelZooming(false);
      }, 180);

      zoomCameraAroundClientPoint(
        cameraRef.current.scale * Math.exp(-normalizedDelta * WHEEL_ZOOM_SENSITIVITY),
        {
        x: e.clientX,
        y: e.clientY,
        }
      );
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
    const startDistance = getImagePointerDistance(first, second);
    if (startDistance <= 0) return;

    gestureRef.current = {
      mode: "pinch",
      startDistance,
      startMidpoint: getImagePointerMidpoint(first, second),
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

    // Pinch motoru ilk iki aktif pointer ile deterministik çalışır.
    // Üçüncü ve sonraki pointer'lar gesture geometrisine dahil edilmez.
    if (activePointersRef.current.size >= 2) {
      return;
    }

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

      const limits = getScaleLimits({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      if (gesture.startCamera.scale <= limits.minScale + 0.0005) {
        gestureRef.current = { ...gesture, activated: true };
        return;
      }

      if (!gesture.activated) {
        gestureRef.current = { ...gesture, activated: true };
      }

      setIsFitMode(false);
      scheduleCamera(
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
    const currentDistance = getImagePointerDistance(first, second);
    if (currentDistance <= 0 || gesture.startDistance <= 0) return;

    const currentMidpoint = getImagePointerMidpoint(first, second);
    if (!naturalSize) return;

    const rect = container.getBoundingClientRect();
    const nextScale =
      gesture.startCamera.scale * (currentDistance / gesture.startDistance);

    scheduleCamera(
      zoomImageCameraBetweenPoints(
        gesture.startCamera,
        nextScale,
        {
          x: gesture.startMidpoint.x - rect.left,
          y: gesture.startMidpoint.y - rect.top,
        },
        {
          x: currentMidpoint.x - rect.left,
          y: currentMidpoint.y - rect.top,
        },
        { width: rect.width, height: rect.height },
        naturalSize,
        rotation,
        getScaleLimits({ width: rect.width, height: rect.height })
      )
    );
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const activePointers = activePointersRef.current;
    if (!activePointers.has(e.pointerId)) return;

    // Son pointermove aynı frame içinde kuyruğa alınmış olabilir. Pointer
    // bırakılırken kamera state/ref farkını sıfırla; böylece pinch→pan geçişi
    // eski bir frame'den başlamaz.
    flushScheduledCamera();

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
      getImagePointerDistance(previousTap.point, point) <= DOUBLE_TAP_MAX_DISTANCE_PX
    ) {
      lastTapRef.current = null;

      if (isFitMode) {
        const container = containerRef.current;
        const limits = container
          ? getScaleLimits({ width: container.clientWidth, height: container.clientHeight })
          : getImageViewerScaleLimits(cameraRef.current.scale);
        const targetScale = Math.min(limits.maxScale, limits.minScale * 2);
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
  const transformStyle: React.CSSProperties | undefined = naturalSize
    ? {
        left: "50%",
        top: "50%",
        width: naturalSize.width,
        height: naturalSize.height,
        marginLeft: -naturalSize.width / 2,
        marginTop: -naturalSize.height / 2,
        transform: `translate3d(${camera.offsetX}px, ${camera.offsetY}px, 0) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${scale})`,
        transformOrigin: "center center",
        transition: isDragging || isWheelZooming ? "none" : "transform 0.15s ease-out",
        willChange: isDragging || isWheelZooming ? "transform" : "auto",
        backfaceVisibility: "hidden",
      }
    : undefined;

  const fitScale =
    naturalSize && viewportSize
      ? computeImageFitScale(
          viewportSize,
          naturalSize,
          rotation,
          viewportSize.width < 640 ? 32 : 64
        )
      : scale;
  const zoomPercent = Math.round((scale / Math.max(fitScale, 0.02)) * 100);

  return (
    <div
      data-zoom-mode={isFitMode ? "fit" : "custom"}
      data-rotation={rotation}
      data-flip-h={flipH ? "true" : "false"}
      data-flip-v={flipV ? "true" : "false"}
      data-zoom={String(scale / Math.max(fitScale, 0.02))}
      data-fit-scale={String(fitScale)}
      data-scale={String(scale)}
      data-camera-x={camera.offsetX.toFixed(2)}
      data-camera-y={camera.offsetY.toFixed(2)}
      className="flex h-full w-full flex-col bg-background text-foreground select-none"
    >
      {/* Görsel Araç Çubuğu (Toolbar) — Tekil & Modern Stüdyo Çubuğu */}
      <div
        data-testid="image-viewer-toolbar"
        role="group"
        aria-label="Görsel stüdyo araç çubuğu"
        className="z-30 box-border flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-card/85 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] text-xs backdrop-blur-2xl shadow-sm sm:h-16 sm:px-4"
      >
        {/* Sol Ada: Navigasyon, Dosya Kimliği & Çözünürlük HUD */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack && (
            <StudioCommandButton
              commandId="studio.back"
              onClick={onBack}
              size="sm"
              variant="ghost"
              showLabel={false}
              title="Dosya Yöneticisine Dön"
              aria-label="Dosya Yöneticisine Dön"
              className="h-9 w-9 shrink-0 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 sm:h-10 sm:w-10"
              icon={<ArrowLeft className="h-4.5 w-4.5" />}
            />
          )}

          {onBack && <div className="hidden h-5 w-px bg-border/60 sm:block" />}

          <div className="flex min-w-0 items-center gap-2">
            <h1
              title={displayName}
              className="truncate font-semibold text-sm tracking-tight text-foreground/90 max-w-[130px] min-[380px]:max-w-[190px] sm:max-w-[280px] md:max-w-[380px]"
            >
              {displayName}
            </h1>

            {versionNo != null && (
              <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                v{versionNo}
              </span>
            )}

            {naturalSize && (
              <span className="hidden items-center gap-1 rounded-md bg-secondary/50 border border-border/40 px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground md:inline-flex shrink-0">
                {naturalSize.width} × {naturalSize.height} px
              </span>
            )}
          </div>
        </div>

        {/* Sağ Alan: Büyütülmüş Zoom Kapsülü, Aksiyonlar & Dönüşüm Kontrolleri */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Zoom Segmentli Kapsülü */}
          <div className="flex items-center rounded-xl bg-secondary/50 border border-border/60 p-0.5 shadow-inner">
            <StudioCommandButton
              commandId="image.zoom.out"
              onClick={() => setCustomScale((current) => current / BUTTON_ZOOM_FACTOR)}
              aria-label="Uzaklaştır"
              showLabel={false}
              title="Uzaklaştır"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
              icon={<ZoomOut className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
            />

            <StudioCommandButton
              commandId="image.zoom.100"
              onClick={resetView}
              aria-label={`Görünümü sıfırla, yakınlaştırma yüzde ${zoomPercent}`}
              title={`Görünümü sıfırla · ${zoomPercent}%`}
              className="h-8 px-2 sm:h-9 sm:px-2.5 rounded-lg text-xs font-mono font-bold text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
              label={`${zoomPercent}%`}
            />

            <StudioCommandButton
              commandId="image.zoom.in"
              onClick={() => setCustomScale((current) => current * BUTTON_ZOOM_FACTOR)}
              aria-label="Yakınlaştır"
              showLabel={false}
              title="Yakınlaştır"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
              icon={<ZoomIn className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
            />

            <div className="h-4 w-px bg-border/60 mx-0.5" />

            <StudioCommandButton
              commandId="image.zoom.fit"
              onClick={() => {
                setIsFitMode(true);
                handleFitScreen();
              }}
              aria-label="Görseli ekrana sığdır"
              className="h-8 px-2.5 sm:h-9 sm:px-3 rounded-lg text-xs font-semibold text-foreground/90 hover:bg-background/80 hover:text-foreground transition-colors"
              label="Sığdır"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Görsel ek işlemleri" className="inline-flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-amber-500 sm:hidden">
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={() => rotate(-1)}>Sola döndür</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={() => rotate(1)}>Sağa döndür</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={resetView}>Görünümü sıfırla</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={() => setFlipH((value) => !value)}>Yatay aynala</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={() => setFlipV((value) => !value)}>Dikey aynala</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-xs rounded-lg" onClick={() => setShowCheckerboard((value) => !value)}>Şeffaflık zeminini değiştir</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/60" />
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                disabled={!naturalSize || copyState === "copying"}
                onClick={handleCopyToClipboard}
              >
                <span>Panoya kopyala</span>
                {copyState === "copied" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                {copyState === "copying" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                disabled={!naturalSize || downloadState === "downloading"}
                onClick={handleDownload}
              >
                <span>Görseli indir</span>
                {downloadState === "done" && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                {downloadState === "downloading" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </DropdownMenuItem>
              {onShare && (
                <>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem
                    className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                    onClick={onShare}
                  >
                    <span>Paylaşım bağlantısı oluştur</span>
                    <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden h-5 w-px bg-border/60 sm:block" />

          {/* Panoya Kopyala */}
          <StudioCommandButton
            commandId="image.clipboard.copy"
            onClick={handleCopyToClipboard}
            disabled={!naturalSize || copyState === "copying"}
            aria-label={
              copyState === "copied"
                ? "Panoya kopyalandı"
                : copyState === "error"
                  ? "Kopyalama başarısız"
                  : "Panoya kopyala"
            }
            showLabel={false}
            title={
              copyState === "copied"
                ? "Panoya Kopyalandı!"
                : copyState === "error"
                  ? "Kopyalama başarısız"
                  : "Panoya Kopyala (Ctrl+C)"
            }
            className={`hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 transition-all sm:inline-flex ${
              copyState === "copied"
                ? "bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/40"
                : copyState === "error"
                  ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/40"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            icon={
              copyState === "copying" ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : copyState === "copied" ? (
                <Check className="h-4.5 w-4.5 text-emerald-400" />
              ) : (
                <Copy className="h-4.5 w-4.5" />
              )
            }
          />

          {/* Görseli İndir */}
          <StudioCommandButton
            commandId="image.download"
            onClick={handleDownload}
            disabled={!naturalSize || downloadState === "downloading"}
            aria-label={
              downloadState === "done"
                ? "Görsel indirildi"
                : downloadState === "error"
                  ? "İndirme başarısız"
                  : "Görseli indir"
            }
            showLabel={false}
            title={
              downloadState === "done"
                ? "Görsel İndirildi!"
                : downloadState === "error"
                  ? "İndirme başarısız"
                  : "Görseli İndir (Ctrl+S)"
            }
            className={`hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 transition-all sm:inline-flex ${
              downloadState === "done"
                ? "bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/40"
                : downloadState === "error"
                  ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/40"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
            icon={
              downloadState === "downloading" ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : downloadState === "done" ? (
                <Check className="h-4.5 w-4.5 text-emerald-400" />
              ) : (
                <Download className="h-4.5 w-4.5" />
              )
            }
          />

          <div className="hidden h-5 w-px bg-border/60 sm:block" />

          {/* Döndürme */}
          <StudioCommandButton
            commandId="image.rotate.ccw"
            onClick={() => rotate(-1)}
            showLabel={false}
            title="Saat Yönü Tersine Döndür (Shift+R)"
            className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<RotateCcw className="h-4.5 w-4.5" />}
          />

          <StudioCommandButton
            commandId="image.rotate.cw"
            onClick={() => rotate(1)}
            showLabel={false}
            title="Saat Yönünde Döndür (R)"
            className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<RotateCw className="h-4.5 w-4.5" />}
          />

          <div className="hidden h-5 w-px bg-border/60 sm:block" />

          {/* Aynalama */}
          <StudioCommandButton
            commandId="image.flip.horizontal"
            onClick={() => setFlipH((value) => !value)}
            active={flipH}
            showLabel={false}
            title="Yatay Aynala"
            className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<FlipHorizontal className="h-4.5 w-4.5" />}
          />

          <StudioCommandButton
            commandId="image.flip.vertical"
            onClick={() => setFlipV((value) => !value)}
            active={flipV}
            showLabel={false}
            title="Dikey Aynala"
            className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<FlipVertical className="h-4.5 w-4.5" />}
          />

          <div className="hidden h-5 w-px bg-border/60 sm:block" />

          {/* Şeffaflık Arkaplan Izgarası */}
          <StudioCommandButton
            commandId="image.checkerboard.toggle"
            onClick={() => setShowCheckerboard((value) => !value)}
            active={showCheckerboard}
            showLabel={false}
            title="Şeffaflık Izgarasını Aç/Kapat"
            className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<Grid className="h-4.5 w-4.5" />}
          />

          {/* Paylaşım & Tema Ayırıcı */}
          <div className="hidden h-5 w-px bg-border/60 sm:block" />

          {/* Paylaşım Bağlantısı Oluştur */}
          {onShare && (
            <StudioCommandButton
              commandId="studio.share"
              onClick={onShare}
              showLabel={false}
              title="Paylaşım Bağlantısı Oluştur (Ctrl+Shift+S)"
              aria-label="Paylaşım Bağlantısı Oluştur"
              className="hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
              icon={<Share2 className="h-4.5 w-4.5" />}
            />
          )}

          {/* Ay / Güneş Tema Değiştirici (ModeToggle) */}
          <div className="flex items-center shrink-0 pl-0.5">
            <ModeToggle />
          </div>
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
        className={`relative flex flex-1 touch-none overscroll-contain items-center justify-center overflow-hidden p-4 sm:p-8 ${
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

        {/* Görsel tek DOM düğümü olarak yaşamaya devam eder. Zoom/pan/rotate
            sırasında src veya key değişmediği için yeniden request/decode tetiklenmez. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          key={loadAttempt}
          data-testid="image-viewer-image"
          src={accessUrl}
          alt={displayName}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={transformStyle}
          draggable={false}
          decoding="async"
          className={`absolute max-w-none rounded shadow-2xl transition-opacity duration-200 pointer-events-none select-none ${loading || !naturalSize ? "opacity-0" : "opacity-100"}`}
        />
      </div>
    </div>
  );
}
