"use client";

import { useEffect, useRef } from "react";
import { generateWhaleMesh } from "@/lib/whale/whale-math";
import { DARK_WHALE_PALETTE, LIGHT_WHALE_PALETTE, renderWhaleFrame } from "@/lib/whale/whale-renderer";
import type { WhaleConfig } from "@/lib/whale/whale-types";

interface AmbientWhaleCanvasProps { enabled?: boolean; className?: string }

export function AmbientWhaleScene({ enabled = true, className = "" }: AmbientWhaleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const enabledRef = useRef(enabled);
  const simTimeRef = useRef(0);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf: number | null = null;
    let lastTimestamp = 0;
    let opacity = enabledRef.current ? 1 : 0;
    let averageDrawCost = 0;
    let frameRate = 60;
    let width = 1, height = 1;
    let isDark = document.documentElement.classList.contains("dark");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = media.matches;
    const getConfig = (): WhaleConfig => ({
      length: Math.min(width * 0.78, height * 1.05, 1060),
      swimSpeed: 0.135, loopPeriod: 76, cameraFocalLength: 1200,
    });
    const paint = (staticPose = false) => {
      ctx.clearRect(0, 0, width, height);
      if (opacity <= 0) return;
      const mesh = generateWhaleMesh(staticPose ? 3 : simTimeRef.current, width, height, getConfig());
      renderWhaleFrame(ctx, mesh, isDark ? DARK_WHALE_PALETTE : LIGHT_WHALE_PALETTE, width, height, opacity);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
      lastTimestamp = 0;
    };
    const animate = (timestamp: number) => {
      raf = null;
      if (document.hidden) { lastTimestamp = 0; return; }
      // Dar masaüstünde 30, geniş ekranda yenileme hızından bağımsız en fazla 60 FPS.
      const interval = 1000 / (width < 1024 ? 30 : frameRate);
      const elapsed = lastTimestamp ? timestamp - lastTimestamp : interval;
      if (elapsed >= interval - 0.5) {
        const delta = Math.min(elapsed / 1000, 0.08);
        lastTimestamp = timestamp;
        opacity = Math.max(0, Math.min(1, opacity + (enabledRef.current ? 1 : -1) * delta / 0.3));
        simTimeRef.current += delta;
        const paintStart = performance.now();
        paint();
        averageDrawCost = averageDrawCost * 0.92 + (performance.now() - paintStart) * 0.08;
        // Yoğun cihaz yükünde detayları silmeden kare bütçesini korur; eşikler titreşimi önler.
        if (averageDrawCost > 12) frameRate = 30;
        else if (averageDrawCost < 8) frameRate = 60;
      }
      if (enabledRef.current || opacity > 0) raf = requestAnimationFrame(animate);
    };
    const sync = () => {
      if (document.hidden) { stop(); return; }
      if (reducedMotion) {
        stop();
        opacity = enabledRef.current ? 1 : 0;
        paint(true);
      } else if (raf === null && (enabledRef.current || opacity > 0)) {
        lastTimestamp = 0;
        raf = requestAnimationFrame(animate);
      }
    };
    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(reducedMotion);
    };
    const motionChange = (event: MediaQueryListEvent) => { reducedMotion = event.matches; sync(); };
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      if (!document.hidden) paint(reducedMotion);
    });
    const resizeObserver = new ResizeObserver(resize);
    resize();
    resizeObserver.observe(container);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", motionChange);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resize);
    syncRef.current = sync;
    sync();
    return () => {
      stop();
      syncRef.current = () => {};
      resizeObserver.disconnect(); themeObserver.disconnect();
      media.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => { enabledRef.current = enabled; syncRef.current(); }, [enabled]);

  return (
    <div ref={containerRef} className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true" role="presentation" data-testid="ambient-whale">
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}
