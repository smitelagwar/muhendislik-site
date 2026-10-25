"use client";

import { useCallback, useEffect, useRef } from "react";

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type UseBelgeFitTransitionOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  frameRef: React.RefObject<HTMLDivElement | null>;
  renderedSizeRef: React.MutableRefObject<{ width: number; height: number; zoom: number }>;
  zoomRef: React.MutableRefObject<number>;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setFitMode: (mode: "page" | "width" | "custom") => void;
  onTransitionEnd?: (targetZoom: number) => void;
  onTransitionStart?: (targetZoom: number) => void;
  duration?: number;
};

export function useBelgeFitTransition({
  containerRef,
  canvasRef,
  frameRef,
  renderedSizeRef,
  zoomRef,
  setZoomLevel,
  setFitMode,
  onTransitionEnd,
  onTransitionStart,
  duration = 240,
}: UseBelgeFitTransitionOptions) {
  const isTransitioningRef = useRef(false);
  const currentVisualZoomRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const transitionIdRef = useRef(0);

  const cancelTransition = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    transitionIdRef.current++;
    isTransitioningRef.current = false;
  }, []);

  const startFitTransition = useCallback(
    (params: {
      mode: "page" | "width";
      targetZoom: number;
      targetScrollLeft?: number;
      targetScrollTop?: number;
      initialVisualZoom?: number;
    }) => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const frame = frameRef.current;
      const rendered = renderedSizeRef.current;

      if (!container || !canvas || !frame) return;

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Cancel running transition
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const currentZoom = params.initialVisualZoom ?? currentVisualZoomRef.current ?? zoomRef.current;
      const targetZoom = params.targetZoom;
      const startScrollLeft = container.scrollLeft;
      const startScrollTop = container.scrollTop;
      const targetScrollLeft = params.targetScrollLeft ?? 0;
      const targetScrollTop =
        params.targetScrollTop ??
        (params.mode === "page"
          ? 0
          : startScrollTop * (targetZoom / Math.max(1, currentZoom)));

      // If already at target zoom and scroll, no animation needed
      const zoomDiff = Math.abs(currentZoom - targetZoom);
      const scrollDiff =
        Math.abs(startScrollLeft - targetScrollLeft) +
        Math.abs(startScrollTop - targetScrollTop);

      if (zoomDiff < 0.5 && scrollDiff < 1) {
        setFitMode(params.mode);
        return;
      }

      if (reduceMotion) {
        container.scrollLeft = targetScrollLeft;
        container.scrollTop = targetScrollTop;
        const ratio = targetZoom / Math.max(1, rendered.zoom);
        canvas.style.transform = ratio === 1 ? "none" : `scale(${ratio})`;
        if (rendered.width > 0 && rendered.height > 0) {
          frame.style.width = `${rendered.width * ratio}px`;
          frame.style.height = `${rendered.height * ratio}px`;
        }
        setFitMode(params.mode);
        zoomRef.current = targetZoom;
        setZoomLevel(targetZoom);
        currentVisualZoomRef.current = targetZoom;
        if (onTransitionEnd) onTransitionEnd(targetZoom);
        return;
      }

      const transitionId = ++transitionIdRef.current;
      isTransitioningRef.current = true;
      setFitMode(params.mode);

      if (onTransitionStart) {
        onTransitionStart(targetZoom);
      }

      const startTime = performance.now();

      const step = (now: number) => {
        if (transitionIdRef.current !== transitionId) return;

        const elapsed = Math.max(0, now - startTime);
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOutCubic(progress);

        const z = currentZoom + (targetZoom - currentZoom) * eased;
        const sLeft = startScrollLeft + (targetScrollLeft - startScrollLeft) * eased;
        const sTop = startScrollTop + (targetScrollTop - startScrollTop) * eased;

        currentVisualZoomRef.current = z;

        container.scrollLeft = sLeft;
        container.scrollTop = sTop;

        const baseZoom = rendered.zoom > 0 ? rendered.zoom : currentZoom;
        const ratio = z / Math.max(1, baseZoom);
        canvas.style.transformOrigin = "top left";
        canvas.style.transform = ratio === 1 ? "none" : `scale(${ratio})`;

        if (rendered.width > 0 && rendered.height > 0) {
          frame.style.width = `${rendered.width * ratio}px`;
          frame.style.height = `${rendered.height * ratio}px`;
        }

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          rafIdRef.current = null;
          isTransitioningRef.current = false;
          currentVisualZoomRef.current = targetZoom;

          // Settle exact target values
          container.scrollLeft = targetScrollLeft;
          container.scrollTop = targetScrollTop;

          const finalRatio = targetZoom / Math.max(1, baseZoom);
          canvas.style.transform = finalRatio === 1 ? "none" : `scale(${finalRatio})`;
          if (rendered.width > 0 && rendered.height > 0) {
            frame.style.width = `${rendered.width * finalRatio}px`;
            frame.style.height = `${rendered.height * finalRatio}px`;
          }

          zoomRef.current = targetZoom;
          setZoomLevel(targetZoom);

          if (onTransitionEnd) {
            onTransitionEnd(targetZoom);
          }
        }
      };

      rafIdRef.current = requestAnimationFrame(step);
    },
    [
      containerRef,
      canvasRef,
      frameRef,
      renderedSizeRef,
      zoomRef,
      setZoomLevel,
      setFitMode,
      onTransitionEnd,
      onTransitionStart,
      duration,
    ]
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return {
    startFitTransition,
    cancelTransition,
    isTransitioningRef,
    currentVisualZoomRef,
  };
}
