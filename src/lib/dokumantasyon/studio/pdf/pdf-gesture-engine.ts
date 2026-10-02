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

export { useZoomGestures } from "./use-zoom-gestures";
export type { ZoomGestureOptions } from "./use-zoom-gestures";

export interface UsePdfGesturesOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isHandTool: boolean;
  scale: number;
  onScaleChange?: (newScale: number, anchor?: { clientX: number; clientY: number }) => void;
  onCommitScale?: (committedScale: number) => void;
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
 * PDF El Aracı (Pan) ve Akıllı Zoom Çekirdeği:
 * - El aracı (pan) sürükleme
 * - Çift dokunma (mobilde) ve çift tıklama (masaüstünde kelime seçimini bozmadan) akıllı zoom
 * (Wheel ve iki-parmak pinch-to-zoom donanım hızlandırmalı useZoomGestures tarafından yönetilir)
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
    dragOrigin: { x: 0, y: 0 },
    activePointerId: null as number | null,
    lastTap: { time: 0, x: 0, y: 0 },
  });

  // Güncel ölçeği ref ile senkronize tut
  useEffect(() => {
    gestureStateRef.current.scale = scale;
  }, [scale]);


  // 3. Pointer Olayları: El Aracı (Pan) ve Çift Dokunma Akıllı Zoom
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container || disabled) return;

      const state = gestureStateRef.current;

      // Çift dokunma algılayıcı (≤ 300 ms, ≤ 24 px) (Faz F, Madde 5)
      if (e.pointerType === "touch") {
        const now = Date.now();
        const distFromLastTap = Math.hypot(
          e.clientX - state.lastTap.x,
          e.clientY - state.lastTap.y
        );

        if (now - state.lastTap.time <= 300 && distFromLastTap <= 24) {
          state.lastTap = { time: 0, x: 0, y: 0 };
          onSmartZoom({ clientX: e.clientX, clientY: e.clientY });
          return;
        }

        state.lastTap = { time: now, x: e.clientX, y: e.clientY };
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

      // El aracı ile sürükleme (Pan)
      if (!isHandTool || state.activePointerId !== e.pointerId) {
        return;
      }

      container.scrollLeft = Math.max(0, state.dragOrigin.x - e.clientX);
      container.scrollTop = Math.max(0, state.dragOrigin.y - e.clientY);
    },
    [containerRef, disabled, isHandTool]
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      const state = gestureStateRef.current;

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
    [containerRef]
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
