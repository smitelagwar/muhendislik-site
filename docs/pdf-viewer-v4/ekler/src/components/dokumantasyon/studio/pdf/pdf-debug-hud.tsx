"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { pdfStats } from "@/lib/dokumantasyon/studio/pdf/pdf-debug-stats";

/** `?pdfdebug=1` ile açılır. Gerçek telefonda DevTools olmadan rakam okumak içindir. */
export function usePdfDebugFlag(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("pdfdebug") === "1",
    () => false
  );
}

interface Snap {
  fps: number;
  gapMaxMs: number;
  longTaskMaxMs: number;
  canvases: number;
  canvasMB: number;
  maxMP: number;
  heapMB: number | null;
  vvScale: number;
  dpr: number;
  engine: string;
  state: string;
  extra: [string, string][];
}

export function PdfDebugHud() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const frames = useRef<number[]>([]);
  const longTasks = useRef<{ t: number; d: number }[]>([]);

  useEffect(() => {
    let alive = true;
    let raf = 0;
    const tick = (t: number) => {
      frames.current.push(t);
      if (frames.current.length > 900) frames.current.shift();
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let po: PerformanceObserver | null = null;
    try {
      po = new PerformanceObserver((list) => {
        const now = performance.now();
        for (const e of list.getEntries()) longTasks.current.push({ t: now, d: e.duration });
      });
      po.observe({ entryTypes: ["longtask"] });
    } catch {
      /* longtask desteklenmiyor (Safari) */
    }

    const iv = window.setInterval(() => {
      const now = performance.now();
      const f = frames.current.filter((x) => now - x < 5000);
      let gapMax = 0;
      for (let i = 1; i < f.length; i++) gapMax = Math.max(gapMax, f[i] - f[i - 1]);
      const fps = f.length > 1 ? Math.round(((f.length - 1) * 1000) / (f[f.length - 1] - f[0])) : 0;
      longTasks.current = longTasks.current.filter((x) => now - x.t < 5000);
      let bytes = 0;
      let maxPx = 0;
      let count = 0;
      for (const c of document.querySelectorAll("canvas")) {
        const px = c.width * c.height;
        count++;
        bytes += px * 4;
        maxPx = Math.max(maxPx, px);
      }
      const root = document.querySelector("[data-pdf-viewer-state]");
      const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
      setSnap({
        fps,
        gapMaxMs: Math.round(gapMax),
        longTaskMaxMs: Math.round(Math.max(0, ...longTasks.current.map((x) => x.d))),
        canvases: count,
        canvasMB: Math.round(bytes / 104857.6) / 10,
        maxMP: Math.round(maxPx / 100000) / 10,
        heapMB: mem ? Math.round(mem.usedJSHeapSize / 104857.6) / 10 : null,
        vvScale: Math.round((window.visualViewport?.scale ?? 1) * 1000) / 1000,
        dpr: window.devicePixelRatio,
        engine: root?.getAttribute("data-pdf-engine") ?? "?",
        state: root?.getAttribute("data-pdf-viewer-state") ?? "?",
        extra: Object.entries(pdfStats.snapshot()).map(([k, v]) => [k, String(v)] as [string, string]),
      });
    }, 500);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearInterval(iv);
      po?.disconnect();
    };
  }, []);

  if (!snap) return null;
  return (
    <div
      data-testid="pdf-debug-hud"
      className="pointer-events-none fixed bottom-2 left-2 z-[9999] max-w-[70vw] rounded bg-black/75 p-2 font-mono text-[10px] leading-tight text-lime-300"
    >
      <div>
        engine {snap.engine} · {snap.state} · dpr {snap.dpr} · browserZoom {snap.vvScale}
      </div>
      <div>
        fps {snap.fps} · maxFrameGap {snap.gapMaxMs}ms · longTask {snap.longTaskMaxMs}ms
      </div>
      <div>
        canvas {snap.canvases} · {snap.canvasMB}MB · max {snap.maxMP}MP{snap.heapMB != null ? ` · heap ${snap.heapMB}MB` : ""}
      </div>
      {snap.extra.map(([k, v]) => (
        <div key={k}>
          {k} {v}
        </div>
      ))}
    </div>
  );
}
