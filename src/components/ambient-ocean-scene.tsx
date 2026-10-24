"use client";

import { useEffect, useRef } from "react";
import {
  DARK_OCEAN_PALETTE,
  generateOceanSceneState,
  LIGHT_OCEAN_PALETTE,
  renderOceanEcosystemFrame,
} from "@/lib/ocean/ocean-renderer";

interface AmbientOceanSceneProps {
  enabled?: boolean;
  className?: string;
}

export function AmbientOceanScene({ enabled = true, className = "" }: AmbientOceanSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const enabledRef = useRef(enabled);
  const simTimeRef = useRef(0);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf: number | null = null;
    let lastTimestamp = 0;
    let opacity = enabledRef.current ? 1 : 0;
    let averageDrawCost = 0;
    let frameRate = 60;
    let width = 1;
    let height = 1;
    let leftCorridor = 160;
    let rightCorridor = 1760;
    let panels: DOMRect[] = [];
    let isDark = document.documentElement.classList.contains("dark");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = media.matches;

    const paint = (staticPose = false) => {
      ctx.clearRect(0, 0, width, height);
      if (opacity <= 0) return;
      const easedOpacity = opacity * opacity * (3 - 2 * opacity);
      const time = staticPose ? 0 : simTimeRef.current;

      const scene = generateOceanSceneState(time, width, height, leftCorridor, rightCorridor);
      const palette = isDark ? DARK_OCEAN_PALETTE : LIGHT_OCEAN_PALETTE;
      renderOceanEcosystemFrame(
        ctx,
        scene,
        palette,
        width,
        height,
        easedOpacity * (isDark ? 0.88 : 0.80)
      );

      // Kartların ve başlıkların içini temiz tutan 4 kademeli optik tüy (feathered glass) maskesi
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      const featherSteps = [
        { inset: 2, alpha: 0.22, radius: 24 },
        { inset: 9, alpha: 0.38, radius: 20 },
        { inset: 16, alpha: 0.58, radius: 16 },
        { inset: 24, alpha: 0.96, radius: 14 },
      ];
      for (const panel of panels) {
        for (const step of featherSteps) {
          const w = panel.width - step.inset * 2;
          const h = panel.height - step.inset * 2;
          if (w <= 4 || h <= 4) continue;
          ctx.globalAlpha = step.alpha;
          ctx.beginPath();
          ctx.roundRect(panel.x + step.inset, panel.y + step.inset, w, h, step.radius);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      lastTimestamp = 0;
    };

    const animate = (timestamp: number) => {
      raf = null;
      if (document.hidden) {
        lastTimestamp = 0;
        return;
      }
      const interval = 1000 / (width < 1024 ? 30 : frameRate);
      const elapsed = lastTimestamp ? timestamp - lastTimestamp : interval;
      if (elapsed >= interval - 0.5) {
        const delta = Math.min(elapsed / 1000, 0.08);
        lastTimestamp = timestamp;
        opacity = Math.max(0, Math.min(1, opacity + (enabledRef.current ? 1 : -1) * delta / 0.28));
        simTimeRef.current += delta;

        const paintStart = performance.now();
        paint();
        averageDrawCost = averageDrawCost * 0.92 + (performance.now() - paintStart) * 0.08;
        if (averageDrawCost > 13) frameRate = 30;
        else if (averageDrawCost < 8.5) frameRate = 60;
      }
      if (enabledRef.current || opacity > 0) raf = requestAnimationFrame(animate);
    };

    const sync = () => {
      if (document.hidden) {
        stop();
        return;
      }
      if (reducedMotion) {
        stop();
        opacity = enabledRef.current ? 1 : 0;
        paint(true);
      } else if (raf === null && (enabledRef.current || opacity > 0)) {
        lastTimestamp = 0;
        raf = requestAnimationFrame(animate);
      }
    };

    let measureRaf: number | null = null;
    const scheduleMeasure = (paintIfReduced = false) => {
      if (measureRaf !== null) return;
      measureRaf = requestAnimationFrame(() => {
        measureRaf = null;
        measure();
        if (paintIfReduced && reducedMotion && !document.hidden) {
          paint(true);
        }
      });
    };

    const measure = () => {
      const gutter = Math.max(width * 0.095, (width - 1312) / 2 - 24);
      const root = container.closest("section");
      if (!root) return;
      const cardEls = root.querySelectorAll<HTMLElement>("[data-whale-card]");
      const protectEls = root.querySelectorAll<HTMLElement>("[data-whale-protect]");

      const newPanels: DOMRect[] = [];
      for (let i = 0; i < protectEls.length; i++) {
        newPanels.push(protectEls[i].getBoundingClientRect());
      }
      panels = newPanels;

      if (cardEls.length > 0) {
        let minLeft = Infinity;
        let maxRight = -Infinity;
        for (let i = 0; i < cardEls.length; i++) {
          const r = cardEls[i].getBoundingClientRect();
          if (r.left < minLeft) minLeft = r.left;
          if (r.right > maxRight) maxRight = r.right;
        }
        leftCorridor = Math.max(60, minLeft - 12);
        rightCorridor = Math.min(width - 60, maxRight + 12);
      } else {
        leftCorridor = Math.max(60, gutter);
        rightCorridor = Math.min(width - 60, width - gutter);
      }
    };

    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      paint(reducedMotion);
    };

    const onScrollOrMutation = () => {
      scheduleMeasure(true);
    };

    const motionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      sync();
    };

    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      if (!document.hidden) paint(reducedMotion);
    });
    const resizeObserver = new ResizeObserver(resize);
    const contentObserver = new MutationObserver(onScrollOrMutation);

    resize();
    resizeObserver.observe(container);
    const section = container.closest("section");
    if (section) {
      contentObserver.observe(section, { childList: true, subtree: true });
      resizeObserver.observe(section);
    }
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", motionChange);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScrollOrMutation, { passive: true });
    syncRef.current = sync;
    sync();

    return () => {
      stop();
      if (measureRaf !== null) cancelAnimationFrame(measureRaf);
      syncRef.current = () => {};
      resizeObserver.disconnect();
      themeObserver.disconnect();
      contentObserver.disconnect();
      media.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScrollOrMutation);
    };
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
    syncRef.current();
  }, [enabled]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
      data-testid="ambient-ocean"
    >
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}
