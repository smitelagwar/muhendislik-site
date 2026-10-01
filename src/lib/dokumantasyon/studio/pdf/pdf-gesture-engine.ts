// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF GESTURE VE ZOOM ÇEKİRDEĞİ (FAZ F)
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from "react";

export const MIN_PDF_SCALE = 0.25;
export const MAX_PDF_SCALE = 5.0;
export const DEFAULT_ZOOM_STEP = 0.2;

/**
 * Adobe Acrobat standart kademeli zoom basamakları merdiveni.
 * Öngörülebilir, yumuşak ve endüstri standardı ölçekleme adımları.
 */
export const ACROBAT_ZOOM_PRESETS = [
  0.25, 0.333, 0.50, 0.667, 0.75, 1.00, 1.25, 1.50, 2.00, 3.00, 4.00, 5.00
] as const;

/**
 * Adobe Acrobat mantığında bir sonraki Zoom In basamağını hesaplar.
 * Mevcut ölçekten büyük olan ilk preset basamağını seçer.
 */
export function getNextAcrobatZoomIn(currentScale: number): number {
  const next = ACROBAT_ZOOM_PRESETS.find((preset) => preset > currentScale + 0.01);
  return clampPdfScale(next ?? MAX_PDF_SCALE);
}

/**
 * Adobe Acrobat mantığında bir sonraki Zoom Out basamağını hesaplar.
 * Mevcut ölçekten küçük olan en büyük preset basamağını seçer.
 */
export function getNextAcrobatZoomOut(currentScale: number): number {
  const reversed = [...ACROBAT_ZOOM_PRESETS].reverse();
  const prev = reversed.find((preset) => preset < currentScale - 0.01);
  return clampPdfScale(prev ?? MIN_PDF_SCALE);
}

/**
 * Ölçeği min-max sınırları arasında sertçe keser (lastik payı yok).
 */
export function clampPdfScale(
  scale: number,
  min = MIN_PDF_SCALE,
  max = MAX_PDF_SCALE
): number {
  return Math.min(Math.max(scale, min), max);
}

/**
 * Tekerlek / trackpad pinch için ölçek çarpanı hesaplar.
 * Formül (Faz F sözleşmesi): Math.exp(-deltaY * 0.01)
 */
export function calculateWheelZoomFactor(
  deltaY: number,
  deltaMode = 0,
  clientHeight = 800
): number {
  const deltaMultiplier =
    deltaMode === 1 // DOM_DELTA_LINE
      ? 16
      : deltaMode === 2 // DOM_DELTA_PAGE
      ? clientHeight
      : 1;

  const normalizedDelta = Math.min(
    Math.max(deltaY * deltaMultiplier, -200),
    200
  );

  // Hassas ve kararlı tekerlek/trackpad ölçek çarpanı
  return Math.exp(-normalizedDelta * 0.0035);
}

/**
 * Odak koruma formülü (Faz F sözleşmesi):
 * İmleç / parmak merkezi altındaki doküman noktasının yeni ölçekte sabit kalması.
 */
export function calculateAnchorScroll(params: {
  scrollLeft: number;
  scrollTop: number;
  anchorX: number;
  anchorY: number;
  containerLeft: number;
  containerTop: number;
  currentScale: number;
  newScale: number;
}): { scrollLeft: number; scrollTop: number } {
  if (params.currentScale <= 0 || params.newScale <= 0) {
    return { scrollLeft: params.scrollLeft, scrollTop: params.scrollTop };
  }

  const midX = params.anchorX - params.containerLeft;
  const midY = params.anchorY - params.containerTop;

  const contentX = (params.scrollLeft + midX) / params.currentScale;
  const contentY = (params.scrollTop + midY) / params.currentScale;

  const targetLeft = contentX * params.newScale - midX;
  const targetTop = contentY * params.newScale - midY;

  return {
    scrollLeft: Math.max(0, Math.round(targetLeft)),
    scrollTop: Math.max(0, Math.round(targetTop)),
  };
}

/**
 * Hedef öğenin metin katmanı içinde olup olmadığını denetler.
 * Masaüstünde kelime seçimini korumak için kullanılır (Faz F, Madde 5).
 */
export function isTextElement(target: EventTarget | null): boolean {
  if (!target) return false;
  const el =
    (target as Node).nodeType === 3
      ? (target as Node).parentElement
      : (target as HTMLElement);
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(
    el.closest(".pdf-text-layer") ||
      el.closest(".textLayer") ||
      el.closest("span[role='presentation']") ||
      el.tagName === "SPAN" ||
      el.tagName === "P"
  );
}

export interface UsePdfGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isHandTool: boolean;
  scale: number;
  onScaleChange: (newScale: number, anchor?: { clientX: number; clientY: number }) => void;
  onCommitScale: (committedScale: number) => void;
  onSmartZoom: (point: { clientX: number; clientY: number }) => void;
  disabled?: boolean;
}

export interface UsePdfGesturesResult {
  isDragging: boolean;
  handleDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * Tek Jest Çekirdeği (Unified Gesture Core — Faz F):
 * - Masaüstü Ctrl+Wheel ve trackpad pinch odak koruması
 * - Mobil 2 parmak pinch, anlık ölçekleme ve Faz C çift tampon tetikleme
 * - iOS Safari gesturestart/change/end engellemesi (tüm sayfanın yakınlaşmasını önler)
 * - Çift dokunma (mobilde) ve çift tıklama (masaüstünde kelime seçimini bozmadan) akıllı zoom
 * - El aracı (pan) sürükleme
 */
export function usePdfGestures({
  containerRef,
  isHandTool,
  scale,
  onScaleChange,
  onCommitScale,
  onSmartZoom,
  disabled = false,
}: UsePdfGesturesOptions): UsePdfGesturesResult {
  const [isDragging, setIsDragging] = useState(false);

  // Jest durumunu tek bir ref nesnesinde sakla (Faz F, Madde 1)
  const gestureStateRef = useRef({
    scale,
    activePointers: new Map<number, { x: number; y: number }>(),
    pinchStartDist: 0,
    pinchStartScale: scale,
    pinchAnchor: { clientX: 0, clientY: 0 },
    dragOrigin: { x: 0, y: 0 },
    activePointerId: null as number | null,
    lastTap: { time: 0, x: 0, y: 0 },
  });

  // Güncel ölçeği ref ile senkronize tut
  useEffect(() => {
    gestureStateRef.current.scale = scale;
  }, [scale]);

  // 1. Masaüstü: Ctrl + Tekerlek / Trackpad Pinch (Faz F, Madde 2)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleWheel = (e: WheelEvent) => {
      // Yalnızca Ctrl veya Meta basılıyken (zoom jesti) tarayıcı zoom'unu engelle ve PDF'i yakınlaştır
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();

      const state = gestureStateRef.current;
      const rect = container.getBoundingClientRect();
      const factor = calculateWheelZoomFactor(
        e.deltaY,
        e.deltaMode,
        container.clientHeight
      );

      const targetScale = clampPdfScale(
        Number((state.scale * factor).toFixed(3))
      );
      if (Math.abs(targetScale - state.scale) < 0.005) return;

      // Odak koruma: imleç konumu
      const anchor = { clientX: e.clientX, clientY: e.clientY };
      const scrollPos = calculateAnchorScroll({
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
        anchorX: anchor.clientX,
        anchorY: anchor.clientY,
        containerLeft: rect.left,
        containerTop: rect.top,
        currentScale: state.scale,
        newScale: targetScale,
      });

      state.scale = targetScale;
      onScaleChange(targetScale, anchor);

      container.scrollLeft = scrollPos.scrollLeft;
      container.scrollTop = scrollPos.scrollTop;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, disabled, onScaleChange]);

  // 2. iOS Safari: gesturestart, gesturechange, gestureend engellemesi (Faz F, Madde 3)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleSafariGesture = (e: Event) => {
      // iOS Safari'nin sitenin tamamını büyütmesini engelle
      e.preventDefault();
    };

    container.addEventListener("gesturestart", handleSafariGesture, {
      passive: false,
    });
    container.addEventListener("gesturechange", handleSafariGesture, {
      passive: false,
    });
    container.addEventListener("gestureend", handleSafariGesture, {
      passive: false,
    });

    return () => {
      container.removeEventListener("gesturestart", handleSafariGesture);
      container.removeEventListener("gesturechange", handleSafariGesture);
      container.removeEventListener("gestureend", handleSafariGesture);
    };
  }, [containerRef, disabled]);

  // 3. Pointer Olayları: El Aracı (Pan) ve İki Parmak Pinch (Faz F, Madde 3)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container || disabled) return;

      const state = gestureStateRef.current;

      // Dokunmatik olaylarda parmak takibi
      if (e.pointerType === "touch") {
        state.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Çift dokunma algılayıcı (≤ 300 ms, ≤ 24 px) (Faz F, Madde 5)
        const now = Date.now();
        const distFromLastTap = Math.hypot(
          e.clientX - state.lastTap.x,
          e.clientY - state.lastTap.y
        );

        if (
          state.activePointers.size === 1 &&
          now - state.lastTap.time <= 300 &&
          distFromLastTap <= 24
        ) {
          state.lastTap = { time: 0, x: 0, y: 0 };
          onSmartZoom({ clientX: e.clientX, clientY: e.clientY });
          return;
        }

        state.lastTap = { time: now, x: e.clientX, y: e.clientY };

        // İki parmak algılandı: Pinch gesture başlat
        if (state.activePointers.size === 2) {
          setIsDragging(false);
          state.activePointerId = null;
          const ptrs = Array.from(state.activePointers.values());
          state.pinchStartDist = Math.hypot(
            ptrs[0].x - ptrs[1].x,
            ptrs[0].y - ptrs[1].y
          );
          state.pinchStartScale = state.scale;
          state.pinchAnchor = {
            clientX: (ptrs[0].x + ptrs[1].x) / 2,
            clientY: (ptrs[0].y + ptrs[1].y) / 2,
          };
          return;
        }
      }

      // El Aracı Pan Başlatma (Masaüstü veya tek parmak el aracı açıkken)
      if (!isHandTool) return;

      state.activePointerId = e.pointerId;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {}
      setIsDragging(true);
      state.dragOrigin = {
        x: e.clientX + container.scrollLeft,
        y: e.clientY + container.scrollTop,
      };
    },
    [containerRef, disabled, isHandTool, onSmartZoom]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container || disabled) return;

      const state = gestureStateRef.current;

      // İki parmak pinch hareketi
      if (
        e.pointerType === "touch" &&
        state.activePointers.has(e.pointerId)
      ) {
        state.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (state.activePointers.size === 2 && state.pinchStartDist > 10) {
          const ptrs = Array.from(state.activePointers.values());
          const currentDist = Math.hypot(
            ptrs[0].x - ptrs[1].x,
            ptrs[0].y - ptrs[1].y
          );

          if (currentDist > 10) {
            const ratio = currentDist / state.pinchStartDist;
            const newScale = clampPdfScale(
              Number((state.pinchStartScale * ratio).toFixed(3))
            );

            const midX = (ptrs[0].x + ptrs[1].x) / 2;
            const midY = (ptrs[0].y + ptrs[1].y) / 2;
            const rect = container.getBoundingClientRect();

            // Plandaki odak koruma formülü
            const contentX =
              (container.scrollLeft + midX - rect.left) / state.pinchStartScale;
            const contentY =
              (container.scrollTop + midY - rect.top) / state.pinchStartScale;

            state.scale = newScale;
            onScaleChange(newScale, { clientX: midX, clientY: midY });

            container.scrollLeft = Math.max(
              0,
              Math.round(contentX * newScale - (midX - rect.left))
            );
            container.scrollTop = Math.max(
              0,
              Math.round(contentY * newScale - (midY - rect.top))
            );
          }
          return;
        }
      }

      // El aracı ile sürükleme (Pan)
      if (
        !isHandTool ||
        state.activePointerId !== e.pointerId ||
        state.activePointers.size > 1
      ) {
        return;
      }

      container.scrollLeft = Math.max(0, state.dragOrigin.x - e.clientX);
      container.scrollTop = Math.max(0, state.dragOrigin.y - e.clientY);
    },
    [containerRef, disabled, isHandTool, onScaleChange]
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const state = gestureStateRef.current;

      if (e.pointerType === "touch") {
        state.activePointers.delete(e.pointerId);

        // İki parmak bittiğinde ölçeği commit et (Faz C çift tampon render tetiklemesi)
        if (state.activePointers.size < 2 && state.pinchStartDist > 0) {
          state.pinchStartDist = 0;
          onCommitScale(state.scale);
        }
      }

      if (state.activePointerId === e.pointerId) {
        state.activePointerId = null;
        setIsDragging(false);
        if (container) {
          try {
            container.releasePointerCapture(e.pointerId);
          } catch {}
        }
      }
    },
    [containerRef, onCommitScale]
  );

  // 4. Masaüstü Çift Tıklama (Faz F, Madde 5):
  // Kelime seçimini bozmasın! Yalnızca el aracı açıkken veya metin olmayan alanda akıllı zoom yapar.
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;

      // El aracı kapalıyken metin düğmesine tıklandıysa veya kelime seçimi varsa akıllı zoom yapma (kelime seçimini koru)
      if (!isHandTool) {
        if (typeof window !== "undefined") {
          const selection = window.getSelection();
          if (selection && selection.toString().trim().length > 0) {
            return;
          }
        }
        if (isTextElement(e.target)) {
          return;
        }
      }

      onSmartZoom({ clientX: e.clientX, clientY: e.clientY });
    },
    [disabled, isHandTool, onSmartZoom]
  );

  return {
    isDragging,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: handlePointerEnd,
    handlePointerCancel: handlePointerEnd,
  };
}
