"use client";

import { useEffect, useRef } from "react";
import { generateWhaleMesh } from "@/lib/whale/whale-math";
import {
  DARK_WHALE_PALETTE,
  LIGHT_WHALE_PALETTE,
  renderWhaleFrame,
} from "@/lib/whale/whale-renderer";
import type { WhaleConfig, WhaleThemePalette } from "@/lib/whale/whale-types";

interface AmbientWhaleCanvasProps {
  enabled?: boolean;
  className?: string;
}

export function AmbientWhaleCanvas({
  enabled = true,
  className = "",
}: AmbientWhaleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const enabledRef = useRef(enabled);
  const simTimeRef = useRef(0);
  const currentOpacityRef = useRef(enabled ? 1.0 : 0.0);
  const startAnimationRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let lastTimestamp = 0;
    let isDark = document.documentElement.classList.contains("dark");

    // Dynamic DPR capped at 1.5 for optimal performance
    const getDpr = () => Math.min(window.devicePixelRatio || 1, 1.5);

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // Compute whale configuration based on viewport width
    const getWhaleConfig = (w: number): WhaleConfig => {
      // Large solitary whale: well-proportioned across 320px mobile up to ultra-wide displays
      const length = Math.max(220, Math.min(w * 0.52, 740));
      return {
        length,
        swimSpeed: 0.18, // Slow, majestic 5.5-second caudal stroke cycle
        loopPeriod: 54,  // 54-second smooth 3D viewport orbit
        cameraFocalLength: 850,
      };
    };

    const renderStaticPose = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);
      if (!enabledRef.current) return;
      const palette: WhaleThemePalette = isDark ? DARK_WHALE_PALETTE : LIGHT_WHALE_PALETTE;
      const config = getWhaleConfig(width);
      const mesh = generateWhaleMesh(14.0, width, height, config);
      renderWhaleFrame(ctx, mesh, palette, width, height, 0.85);
    };

    const resizeCanvas = () => {
      if (!container || !canvas || !ctx) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      const dpr = getDpr();

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (prefersReducedMotion) {
        renderStaticPose();
      }
    };

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = mediaQuery.matches;

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    // Watch dark mode class changes on <html>
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      if (prefersReducedMotion) {
        renderStaticPose();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        renderStaticPose();
      } else if (enabledRef.current) {
        startAnimation();
      }
    };
    mediaQuery.addEventListener?.("change", handleMotionChange);

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaSec = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      // Handle smooth opacity fade in / fade out when toggled
      const targetOpacity = enabledRef.current ? 1.0 : 0.0;
      const fadeSpeed = 3.0; // ~330ms transition
      if (currentOpacityRef.current < targetOpacity) {
        currentOpacityRef.current = Math.min(targetOpacity, currentOpacityRef.current + fadeSpeed * deltaSec);
      } else if (currentOpacityRef.current > targetOpacity) {
        currentOpacityRef.current = Math.max(targetOpacity, currentOpacityRef.current - fadeSpeed * deltaSec);
      }

      // If fully disabled and faded out: stop RAF completely (0% CPU / 0% battery consumption)
      if (currentOpacityRef.current <= 0 && !enabledRef.current) {
        ctx.clearRect(0, 0, width, height);
        animationFrameId = null;
        return;
      }

      // Advance autonomous simulation time smoothly (preserves continuous motion)
      simTimeRef.current += deltaSec;

      const palette: WhaleThemePalette = isDark ? DARK_WHALE_PALETTE : LIGHT_WHALE_PALETTE;
      const config = getWhaleConfig(width);
      const mesh = generateWhaleMesh(simTimeRef.current, width, height, config);

      ctx.clearRect(0, 0, width, height);
      renderWhaleFrame(ctx, mesh, palette, width, height, currentOpacityRef.current);

      animationFrameId = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (prefersReducedMotion) {
        renderStaticPose();
        return;
      }
      if (animationFrameId === null && enabledRef.current) {
        lastTimestamp = 0;
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    startAnimationRef.current = startAnimation;

    if (prefersReducedMotion) {
      renderStaticPose();
    } else if (enabledRef.current) {
      startAnimation();
    }

    // Pause when tab is hidden to eliminate CPU/battery consumption
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        if (enabledRef.current && !prefersReducedMotion && animationFrameId === null) {
          startAnimation();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      mediaQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  // Trigger animation loop start or static pose redraw when enabled prop changes
  useEffect(() => {
    enabledRef.current = enabled;
    startAnimationRef.current();
  }, [enabled]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-500 ${
        enabled ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <canvas ref={canvasRef} className="block h-full w-full pointer-events-none" />
    </div>
  );
}
