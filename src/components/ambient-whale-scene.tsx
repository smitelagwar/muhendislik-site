"use client";

import { useEffect, useRef } from "react";
import { generateWhaleMesh } from "@/lib/whale/whale-math";
import { defaultWhaleLayout, sampleWhaleMotion } from "@/lib/whale/whale-motion";
import { DARK_WHALE_PALETTE, LIGHT_WHALE_PALETTE, renderWhaleFrame } from "@/lib/whale/whale-renderer";
import type { WhaleConfig, WhaleSceneLayout } from "@/lib/whale/whale-types";

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
    // Her birey ayrı yüzeyde tamamlanır; anatomik örtüşme diğer balinayı silemez.
    const layer = document.createElement("canvas");
    const layerCtx = layer.getContext("2d", { alpha: true });
    if (!layerCtx) return;

    let raf: number | null = null;
    let lastTimestamp = 0;
    let opacity = enabledRef.current ? 1 : 0;
    let averageDrawCost = 0;
    let frameRate = 60;
    let width = 1, height = 1;
    let layout: WhaleSceneLayout = defaultWhaleLayout(width, height);
    let targetLayout = layout;
    let panels: DOMRect[] = [];
    let isDark = document.documentElement.classList.contains("dark");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = media.matches;
    const getConfig = (actor: 0 | 1): WhaleConfig => ({
      length: Math.min(width * 0.80, height * 1.17, 1220) * (actor ? 0.88 : 1),
      swimSpeed: actor ? 0.145 : 0.17, loopPeriod: 112, cameraFocalLength: 1500,
      actor, layout,
    });
    const paint = (staticPose = false) => {
      ctx.clearRect(0, 0, width, height);
      if (opacity <= 0) return;
      const easedOpacity = opacity * opacity * (3 - 2 * opacity);
      const time = staticPose ? 0 : simTimeRef.current;
      const actors = ([0, 1] as const).map(actor => {
        const config = getConfig(actor);
        return { config, motion: sampleWhaleMotion(time, width, height, config) };
      }).sort((a, b) => b.motion.pos.z - a.motion.pos.z);
      for (const { config, motion } of actors) {
        const distance = Math.max(0, Math.min(1, (motion.pos.z + 180) / 1100));
        config.detail = distance > 0.68 ? "distant" : "full";
        const mesh = generateWhaleMesh(time, width, height, config);
        const bounds = [
          ...mesh.silhouettePolygon,
          ...mesh.flukes.outline,
          ...mesh.leftFlipper.leadingEdge,
          ...mesh.rightFlipper.leadingEdge,
        ];
        if (
          bounds.every(p => p.x < -8) ||
          bounds.every(p => p.x > width + 8) ||
          bounds.every(p => p.y < -8) ||
          bounds.every(p => p.y > height + 8)
        ) continue;
        layerCtx.clearRect(0, 0, width, height);
        renderWhaleFrame(layerCtx, mesh, isDark ? DARK_WHALE_PALETTE : LIGHT_WHALE_PALETTE, width, height);
        ctx.save();
        ctx.globalAlpha = easedOpacity * (isDark ? 0.86 - distance * 0.42 : 0.76 - distance * 0.36);
        ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, width, height);
        ctx.restore();
      }
      // Kartların ve başlıkların kenarında keskin giyotin kesik oluşmaması için
      // 4 kademeli yumuşak optik cam geçişi (feathered glass occlusion) uygulanır; metin içi net kalır.
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
      if (document.hidden) { lastTimestamp = 0; return; }
      // Dar masaüstünde 30, geniş ekranda yenileme hızından bağımsız en fazla 60 FPS.
      const interval = 1000 / (width < 1024 ? 30 : frameRate);
      const elapsed = lastTimestamp ? timestamp - lastTimestamp : interval;
      if (elapsed >= interval - 0.5) {
        const delta = Math.min(elapsed / 1000, 0.08);
        lastTimestamp = timestamp;
        opacity = Math.max(0, Math.min(1, opacity + (enabledRef.current ? 1 : -1) * delta / 0.28));
        simTimeRef.current += delta;
        const follow = 1 - Math.exp(-delta * 2.2);
        const approach = (a: number, b: number) => a + (b - a) * follow;
        layout = {
          left: approach(layout.left, targetLayout.left),
          right: approach(layout.right, targetLayout.right),
          top: approach(layout.top, targetLayout.top),
          opening: {
            x: approach(layout.opening.x, targetLayout.opening.x),
            y: approach(layout.opening.y, targetLayout.opening.y),
          },
        };
        const paintStart = performance.now();
        paint();
        averageDrawCost = averageDrawCost * 0.92 + (performance.now() - paintStart) * 0.08;
        // Yoğun cihaz yükünde detayları silmeden kare bütçesini korur; eşikler titreşimi önler.
        if (averageDrawCost > 13) frameRate = 30;
        else if (averageDrawCost < 8.5) frameRate = 60;
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
    const measure = () => {
      const fallback = defaultWhaleLayout(width, height);
      const root = container.closest("section");
      const cards = Array.from(root?.querySelectorAll("[data-whale-card]") ?? []).map(el => el.getBoundingClientRect());
      panels = Array.from(root?.querySelectorAll("[data-whale-protect]") ?? []).map(el => el.getBoundingClientRect());
      if (cards.length) {
        const left = Math.min(...cards.map(r => r.left));
        const right = Math.max(...cards.map(r => r.right));
        const last = cards.at(-1)!;
        const missingCell = right - last.right > last.width * 0.8;
        targetLayout = { left: Math.max(35, left * 0.54), right: width - Math.max(35, (width - right) * 0.54),
          top: fallback.top, opening: missingCell
            ? { x: (last.right + right) / 2, y: Math.min(height * 0.86, Math.max(height * 0.64, last.y + last.height * 0.55)) }
            : fallback.opening };
      } else targetLayout = fallback;
    };
    const resize = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      layer.width = canvas.width; layer.height = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      layout = targetLayout;
      paint(reducedMotion);
    };
    const layoutChange = () => {
      measure();
      if (reducedMotion && !document.hidden) { layout = targetLayout; paint(true); }
    };
    const motionChange = (event: MediaQueryListEvent) => { reducedMotion = event.matches; sync(); };
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      if (!document.hidden) paint(reducedMotion);
    });
    const resizeObserver = new ResizeObserver(resize);
    const contentObserver = new MutationObserver(layoutChange);
    resize();
    resizeObserver.observe(container);
    const section = container.closest("section");
    if (section) { contentObserver.observe(section, { childList: true, subtree: true }); resizeObserver.observe(section); }
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    media.addEventListener("change", motionChange);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", layoutChange, { passive: true });
    syncRef.current = sync;
    sync();
    return () => {
      stop();
      syncRef.current = () => {};
      resizeObserver.disconnect(); themeObserver.disconnect(); contentObserver.disconnect();
      media.removeEventListener("change", motionChange);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", layoutChange);
      layer.width = 0; layer.height = 0;
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
