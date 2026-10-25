"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  BELGE_ZOOM_SETTLE_THRESHOLD,
  DEFAULT_BELGE_WHEEL_SENSITIVITY,
  DEFAULT_BELGE_ZOOM_TAU_MS,
  calculateNextTargetZoom,
  calculateZoomFollowAlpha,
  clampBelgeZoom,
  getBelgeZoomAnchorScroll,
  normalizeWheelDelta,
} from "@/lib/belge-studio-zoom";

export type UseBelgeSmoothZoomOptions = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  frameRef: React.RefObject<HTMLDivElement | null>;
  renderedSizeRef: React.MutableRefObject<{ width: number; height: number; zoom: number }>;
  zoomRef: React.MutableRefObject<number>;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setDisplayZoom?: (zoom: number) => void;
  setFitMode: (mode: "page" | "width" | "custom") => void;
  onSettle: (finalZoom: number) => void;
  getFitVisualZoom?: () => number | null;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onVisualZoomChange?: (zoom: number) => void;
  tauMs?: number;
  sensitivity?: number;
};

export type UseBelgeSmoothZoomReturn = {
  addWheelDelta: (event: WheelEvent, point: { x: number; y: number }) => void;
  animateToZoom: (nextZoom: number, anchorPoint?: { x: number; y: number }) => void;
  cancelSmoothZoom: () => void;
  isSmoothZoomActive: () => boolean;
  getVisualZoom: () => number;
};

type AnchorData = {
  relativeX: number;
  relativeY: number;
  pointerX: number;
  pointerY: number;
  frameLeft: number;
  frameTop: number;
};

export function useBelgeSmoothZoom({
  containerRef,
  canvasRef,
  frameRef,
  renderedSizeRef,
  zoomRef,
  setZoomLevel,
  setDisplayZoom,
  setFitMode,
  onSettle,
  getFitVisualZoom,
  onAnimationStart,
  onAnimationEnd,
  onVisualZoomChange,
  tauMs = DEFAULT_BELGE_ZOOM_TAU_MS,
  sensitivity = DEFAULT_BELGE_WHEEL_SENSITIVITY,
}: UseBelgeSmoothZoomOptions): UseBelgeSmoothZoomReturn {
  const isAnimatingRef = useRef(false);
  const targetZoomRef = useRef(zoomRef.current);
  const visualZoomRef = useRef(zoomRef.current);
  const rafIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const lastDisplayUpdateRef = useRef<number>(0);
  const anchorRef = useRef<AnchorData | null>(null);

  const cancelSmoothZoom = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    const wasAnimating = isAnimatingRef.current;
    isAnimatingRef.current = false;
    anchorRef.current = null;
    if (wasAnimating && onAnimationEnd) {
      onAnimationEnd();
    }
  }, [onAnimationEnd]);

  const isSmoothZoomActive = useCallback(() => isAnimatingRef.current, []);

  const getVisualZoom = useCallback(() => visualZoomRef.current, []);

  const applyDomTransforms = useCallback(
    (zoomValue: number) => {
      const canvas = canvasRef.current;
      const frame = frameRef.current;
      const container = containerRef.current;
      const rendered = renderedSizeRef.current;

      const baseZoom = rendered.zoom > 0 ? rendered.zoom : zoomValue;
      const ratio = zoomValue / Math.max(1, baseZoom);
      const nextWidth = rendered.width * ratio;
      const nextHeight = rendered.height * ratio;

      if (frame && rendered.width > 0 && rendered.height > 0) {
        frame.style.width = `${nextWidth}px`;
        frame.style.height = `${nextHeight}px`;
      }

      if (canvas) {
        canvas.style.transformOrigin = "top left";
        canvas.style.transform = ratio === 1 ? "none" : `scale(${ratio})`;
      }

      if (anchorRef.current && container) {
        const anchor = anchorRef.current;
        const targetScroll = getBelgeZoomAnchorScroll({
          frameLeft: anchor.frameLeft,
          frameTop: anchor.frameTop,
          nextWidth,
          nextHeight,
          relativeX: anchor.relativeX,
          relativeY: anchor.relativeY,
          pointerX: anchor.pointerX,
          pointerY: anchor.pointerY,
          scrollLeft: container.scrollLeft,
          scrollTop: container.scrollTop,
        });
        container.scrollLeft = targetScroll.scrollLeft;
        container.scrollTop = targetScroll.scrollTop;
      }
    },
    [canvasRef, frameRef, containerRef, renderedSizeRef]
  );

  const startLoopIfNeeded = useCallback(() => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    lastTimestampRef.current = performance.now();
    lastDisplayUpdateRef.current = 0;

    if (onAnimationStart) {
      onAnimationStart();
    }

    const step = (now: number) => {
      if (!isAnimatingRef.current) return;

      const dt = Math.max(1, Math.min(64, now - lastTimestampRef.current));
      lastTimestampRef.current = now;

      const alpha = calculateZoomFollowAlpha(dt, tauMs);
      visualZoomRef.current += (targetZoomRef.current - visualZoomRef.current) * alpha;

      const diff = Math.abs(targetZoomRef.current - visualZoomRef.current);
      const isSettled = diff < BELGE_ZOOM_SETTLE_THRESHOLD;

      if (isSettled) {
        visualZoomRef.current = targetZoomRef.current;
      }

      applyDomTransforms(visualZoomRef.current);

      if (now - lastDisplayUpdateRef.current >= 45 || isSettled) {
        lastDisplayUpdateRef.current = now;
        const rounded = Math.round(visualZoomRef.current);
        if (setDisplayZoom) {
          setDisplayZoom(rounded);
        }
        if (onVisualZoomChange) {
          onVisualZoomChange(visualZoomRef.current);
        }
      }

      if (isSettled) {
        isAnimatingRef.current = false;
        rafIdRef.current = null;
        anchorRef.current = null;

        const finalZoom = targetZoomRef.current;
        zoomRef.current = finalZoom;
        setZoomLevel(finalZoom);
        if (setDisplayZoom) {
          setDisplayZoom(finalZoom);
        }
        setFitMode("custom");

        if (onAnimationEnd) {
          onAnimationEnd();
        }

        onSettle(finalZoom);
      } else {
        rafIdRef.current = requestAnimationFrame(step);
      }
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [
    tauMs,
    applyDomTransforms,
    setDisplayZoom,
    onVisualZoomChange,
    zoomRef,
    setZoomLevel,
    setFitMode,
    onAnimationStart,
    onAnimationEnd,
    onSettle,
  ]);

  const addWheelDelta = useCallback(
    (event: WheelEvent, point: { x: number; y: number }) => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const frame = frameRef.current;
      if (!container || !canvas || !frame) return;

      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const normalizedDelta = normalizeWheelDelta(event, container.clientHeight);
      if (normalizedDelta === 0) return;

      const rect = canvas.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(1, (point.x - rect.left) / Math.max(1, rect.width)));
      const relativeY = Math.max(0, Math.min(1, (point.y - rect.top) / Math.max(1, rect.height)));
      const containerRect = container.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const viewportLeft = containerRect.left + container.clientLeft;
      const viewportTop = containerRect.top + container.clientTop;

      anchorRef.current = {
        relativeX,
        relativeY,
        pointerX: point.x - viewportLeft,
        pointerY: point.y - viewportTop,
        frameLeft: frameRect.left - viewportLeft + container.scrollLeft,
        frameTop: frameRect.top - viewportTop + container.scrollTop,
      };

      if (!isAnimatingRef.current) {
        const fitVisual = getFitVisualZoom ? getFitVisualZoom() : null;
        const startVisual = fitVisual ?? zoomRef.current;
        visualZoomRef.current = startVisual;
        targetZoomRef.current = startVisual;
      }

      const nextTarget = calculateNextTargetZoom(
        targetZoomRef.current,
        normalizedDelta,
        sensitivity
      );
      targetZoomRef.current = nextTarget;

      if (reduceMotion) {
        cancelSmoothZoom();
        visualZoomRef.current = nextTarget;
        zoomRef.current = nextTarget;
        setZoomLevel(nextTarget);
        if (setDisplayZoom) setDisplayZoom(nextTarget);
        setFitMode("custom");
        applyDomTransforms(nextTarget);
        onSettle(nextTarget);
        return;
      }

      startLoopIfNeeded();
    },
    [
      containerRef,
      canvasRef,
      frameRef,
      sensitivity,
      getFitVisualZoom,
      zoomRef,
      cancelSmoothZoom,
      setZoomLevel,
      setDisplayZoom,
      setFitMode,
      applyDomTransforms,
      onSettle,
      startLoopIfNeeded,
    ]
  );

  const animateToZoom = useCallback(
    (nextZoom: number, anchorPoint?: { x: number; y: number }) => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const frame = frameRef.current;
      if (!container || !canvas || !frame) {
        const clamped = clampBelgeZoom(nextZoom);
        zoomRef.current = clamped;
        setZoomLevel(clamped);
        return;
      }

      const clamped = clampBelgeZoom(nextZoom);
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const containerRect = container.getBoundingClientRect();
      const point = anchorPoint ?? {
        x: containerRect.left + container.clientWidth / 2,
        y: containerRect.top + container.clientHeight / 2,
      };

      const rect = canvas.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(1, (point.x - rect.left) / Math.max(1, rect.width)));
      const relativeY = Math.max(0, Math.min(1, (point.y - rect.top) / Math.max(1, rect.height)));
      const frameRect = frame.getBoundingClientRect();
      const viewportLeft = containerRect.left + container.clientLeft;
      const viewportTop = containerRect.top + container.clientTop;

      anchorRef.current = {
        relativeX,
        relativeY,
        pointerX: point.x - viewportLeft,
        pointerY: point.y - viewportTop,
        frameLeft: frameRect.left - viewportLeft + container.scrollLeft,
        frameTop: frameRect.top - viewportTop + container.scrollTop,
      };

      if (!isAnimatingRef.current) {
        const fitVisual = getFitVisualZoom ? getFitVisualZoom() : null;
        const startVisual = fitVisual ?? zoomRef.current;
        visualZoomRef.current = startVisual;
      }

      targetZoomRef.current = clamped;

      if (reduceMotion) {
        cancelSmoothZoom();
        visualZoomRef.current = clamped;
        zoomRef.current = clamped;
        setZoomLevel(clamped);
        if (setDisplayZoom) setDisplayZoom(clamped);
        setFitMode("custom");
        applyDomTransforms(clamped);
        onSettle(clamped);
        return;
      }

      startLoopIfNeeded();
    },
    [
      containerRef,
      canvasRef,
      frameRef,
      zoomRef,
      setZoomLevel,
      getFitVisualZoom,
      cancelSmoothZoom,
      setDisplayZoom,
      setFitMode,
      applyDomTransforms,
      onSettle,
      startLoopIfNeeded,
    ]
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return {
    addWheelDelta,
    animateToZoom,
    cancelSmoothZoom,
    isSmoothZoomActive,
    getVisualZoom,
  };
}
