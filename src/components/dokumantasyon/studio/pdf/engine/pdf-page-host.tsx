// ============================================================================
// PDF v4 MOTOR — SAYFA KONAĞI (Plan 03 P3.5)
// ----------------------------------------------------------------------------
// Tek sayfa için DOM yapısı, backdrop önizlemesi, nesil bazlı titremesiz zoom,
// parça (tile) yaşam döngüsü ve metin/vurgu katmanı montajı.
// ============================================================================

"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import type { PdfEngine } from "@/lib/dokumantasyon/studio/pdf/engine/engine";
import {
  chooseMode,
  outputScaleFor,
  tilesForRect,
  WHOLE_MAX_PX,
  TILE_PX,
  GUTTER,
  TileRect,
  tileRect,
  gridSize,
} from "@/lib/dokumantasyon/studio/pdf/engine/tiles";
import { useEngineScale, useEngineRenderScale } from "@/lib/dokumantasyon/studio/pdf/engine/use-pdf-engine";
import { PdfPageOverlays } from "./pdf-page-overlays";
import type { SearchMatch, SearchOpts } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import type { MappingRule } from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";

export interface PdfPageHostProps {
  engine: PdfEngine;
  pdfDoc: any;
  pageNumber: number;
  rotation?: number;
  nightMode?: boolean;
  overlayProps?: {
    searchMatches?: SearchMatch[];
    searchOpts?: SearchOpts;
    searchQuery?: string;
    isCurrentMatchPage?: boolean;
    activeMatchIndexInPage?: number;
    repairRules?: MappingRule[];
    onNavigateDestination?: (dest: unknown) => void;
    isHandTool?: boolean;
  };
}

interface TileItem {
  rect: TileRect;
  canvas: HTMLCanvasElement;
}

interface PageGen {
  id: string;
  scale: number;
  cssW: number;
  cssH: number;
  tiles: Map<string, TileItem>;
  isReady: boolean;
}

function TileHostCanvas({
  rect,
  canvas,
  nightMode,
  isLatestGen = true,
}: {
  rect: TileRect;
  canvas: HTMLCanvasElement;
  nightMode?: boolean;
  isLatestGen?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !canvas) return;

    /* eslint-disable react-hooks/immutability */
    canvas.setAttribute("data-layer", isLatestGen ? "sharp" : "backdrop");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.style.filter = nightMode ? "invert(1) hue-rotate(180deg)" : "";
    /* eslint-enable react-hooks/immutability */

    if (canvas.parentElement !== el) {
      el.innerHTML = "";
      el.appendChild(canvas);
    }

    return () => {
      if (canvas.parentElement === el) {
        el.removeChild(canvas);
      }
    };
  }, [canvas, nightMode, isLatestGen]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${rect.cssX}px`,
        top: `${rect.cssY}px`,
        width: `${rect.cssW}px`,
        height: `${rect.cssH}px`,
      }}
      ref={containerRef}
    />
  );
}

export function PdfPageHost({
  engine,
  pdfDoc,
  pageNumber,
  rotation: propRotation,
  nightMode = false,
  overlayProps,
}: PdfPageHostProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const backdropCanvasRef = useRef<HTMLCanvasElement>(null);

  const docId = useMemo(() => {
    return pdfDoc?.fingerprints?.[0] || pdfDoc?.fingerprint || "doc";
  }, [pdfDoc]);

  const backdropKey = `b:${docId}:${pageNumber}`;
  const [pageProxy, setPageProxy] = useState<any>(null);
  const [hasBackdrop, setHasBackdrop] = useState(() => engine.governor.backdrop.has(backdropKey));
  const [generations, setGenerations] = useState<PageGen[]>([]);
  const [pageState, setPageState] = useState<"empty" | "backdrop" | "rendered">(() =>
    engine.governor.backdrop.has(backdropKey) ? "backdrop" : "empty"
  );

  const rotation = propRotation ?? engine.getRotation();

  // 1. Box DOM kaydı: motor sayfa kutusunu doğrudan translate3d ile konumlandırır
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    return engine.registerPage(pageNumber, el);
  }, [engine, pageNumber]);

  // 2. Sayfa Proxy'sini yükle
  useEffect(() => {
    let active = true;
    if (!pdfDoc) return;

    pdfDoc
      .getPage(pageNumber)
      .then((p: any) => {
        if (active) setPageProxy(p);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber]);

  // 3. Profil ve Ölçek Sabitleri
  const isCoarse = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
  const wholeMax = isCoarse ? WHOLE_MAX_PX.mobile : WHOLE_MAX_PX.desktop;
  const tilePx = isCoarse ? TILE_PX.mobile : TILE_PX.desktop;
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const o = outputScaleFor(dpr);

  // 4. Backdrop (Düşük Çözünürlüklü Önizleme)
  useEffect(() => {
    if (!pageProxy) return;

    const backdropKey = `b:${docId}:${pageNumber}`;
    const cached = engine.governor.backdrop.get(backdropKey);

    if (cached) {
      const bCanvas = backdropCanvasRef.current;
      if (bCanvas) {
        bCanvas.width = cached.width;
        bCanvas.height = cached.height;
        const ctx = bCanvas.getContext("2d", { alpha: false });
        if (ctx) ctx.drawImage(cached, 0, 0);
        setHasBackdrop(true);
      }
      return;
    }

    const job = {
      id: backdropKey,
      cls: 1, // Backdrop önceliği sınıf 1
      dist: Math.abs(pageNumber - engine.getCurrentPage()),
      run: async (signal: AbortSignal) => {
        if (signal.aborted) return;
        const baseVp = pageProxy.getViewport({ scale: 1, rotation });
        const maxDim = isCoarse ? 640 : 960;
        const bScale = Math.min(
          maxDim / Math.max(baseVp.width, 1),
          maxDim / Math.max(baseVp.height, 1),
          1.0
        );
        const bVp = pageProxy.getViewport({ scale: bScale, rotation });

        const bCanvas = document.createElement("canvas");
        bCanvas.width = Math.max(1, Math.ceil(bVp.width));
        bCanvas.height = Math.max(1, Math.ceil(bVp.height));
        const bCtx = bCanvas.getContext("2d", { alpha: false });
        if (!bCtx) return;

        const renderTask = pageProxy.render({
          canvasContext: bCtx,
          viewport: bVp,
          background: "#ffffff",
        });

        const onAbort = () => {
          try {
            renderTask.cancel();
          } catch {}
        };
        signal.addEventListener("abort", onAbort);

        try {
          await renderTask.promise;
          signal.removeEventListener("abort", onAbort);
          if (signal.aborted) return;

          engine.governor.addBackdrop(backdropKey, bCanvas);
          const target = backdropCanvasRef.current;
          if (target) {
            target.width = bCanvas.width;
            target.height = bCanvas.height;
            const ctx = target.getContext("2d", { alpha: false });
            if (ctx) ctx.drawImage(bCanvas, 0, 0);
            setHasBackdrop(true);
          }
        } catch (e: any) {
          signal.removeEventListener("abort", onAbort);
          if (e?.name !== "RenderingCancelledException") {
            // Render hatasında sessiz kal, backdrop atlanabilir
          }
        }
      },
    };

    engine.scheduler.enqueue(job);
    return () => {
      engine.scheduler.cancel(backdropKey);
    };
  }, [pageProxy, docId, pageNumber, rotation, engine, isCoarse]);

  // 5. Nesil Yönetimi ve Parça Render Döngüsü
  const renderScale = useEngineRenderScale(engine);
  const liveScale = useEngineScale(engine);

  useEffect(() => {
    if (!pageProxy) return;

    const baseVp = pageProxy.getViewport({ scale: renderScale, rotation });
    const cssW = baseVp.width;
    const cssH = baseVp.height;
    const mode = chooseMode(cssW, cssH, o, wholeMax);
    const genId = `${pageNumber}:${renderScale}:${rotation}`;

    setGenerations((prev) => {
      const existing = prev.find((g) => g.id === genId);
      if (existing) return prev;
      const newGen: PageGen = {
        id: genId,
        scale: renderScale,
        cssW,
        cssH,
        tiles: new Map(),
        isReady: false,
      };
      // En fazla 2 nesil tutulur: [eski, yeni]
      const next = prev.length >= 2 ? [prev[prev.length - 1], newGen] : [...prev, newGen];
      return next;
    });
  }, [pageProxy, renderScale, rotation, o, wholeMax, pageNumber]);

  // 6. Görünür Parçaları Çizdirme
  useEffect(() => {
    if (!pageProxy || generations.length === 0) return;

    const curGen = generations[generations.length - 1];
    if (!curGen) return;

    const { cssW, cssH, scale: genScale } = curGen;
    const mode = chooseMode(cssW, cssH, o, wholeMax);
    const viewRect = engine.viewRectInPage(pageNumber);

    let targetTiles: TileRect[] = [];
    if (mode === "whole") {
      const bw = Math.ceil(cssW * o);
      const bh = Math.ceil(cssH * o);
      targetTiles = [
        {
          col: 0,
          row: 0,
          x: 0,
          y: 0,
          w: bw,
          h: bh,
          cssX: 0,
          cssY: 0,
          cssW,
          cssH,
          key: "0:0",
        },
      ];
    } else {
      const effectiveRect = viewRect ?? { x: 0, y: 0, w: cssW, h: cssH };
      const visibleOnly = tilesForRect(cssW, cssH, o, tilePx, effectiveRect, 0);
      const withMargin = tilesForRect(cssW, cssH, o, tilePx, effectiveRect, tilePx / o);
      const seen = new Set(visibleOnly.map((t) => t.key));
      targetTiles = [...visibleOnly];
      for (const t of withMargin) {
        if (!seen.has(t.key) && targetTiles.length < 32) {
          seen.add(t.key);
          targetTiles.push(t);
        }
      }
    }

    let cancelled = false;
    const visibleTileKeys = new Set(targetTiles.map((t) => t.key));

    targetTiles.forEach((tile) => {
      const tileKey = `s:${docId}:${pageNumber}:${genScale}:${o}:${tile.key}`;
      const cached = engine.governor.sharp.get(tileKey);

      if (cached) {
        if (!curGen.tiles.has(tile.key)) {
          curGen.tiles.set(tile.key, { rect: tile, canvas: cached });
          setGenerations((prev) => [...prev]);
        }
        return;
      }

      const isVisible = viewRect
        ? !(
            tile.cssX + tile.cssW < viewRect.x ||
            tile.cssX > viewRect.x + viewRect.w ||
            tile.cssY + tile.cssH < viewRect.y ||
            tile.cssY > viewRect.y + viewRect.h
          )
        : true;

      const job = {
        id: tileKey,
        cls: isVisible ? 0 : 2, // Görünür parça sınıf 0, overscan sınıf 2
        dist: Math.abs(pageNumber - engine.getCurrentPage()),
        run: async (signal: AbortSignal) => {
          if (signal.aborted || cancelled) return;

          const g = mode === "tiles" ? GUTTER : 0;
          const bufW = tile.w + 2 * g;
          const bufH = tile.h + 2 * g;
          const buf = engine.pool.acquire(bufW, bufH);
          const bufCtx = buf.getContext("2d", { alpha: false });
          if (!bufCtx) {
            engine.pool.release(buf);
            engine.governor.onAllocFailure();
            return;
          }

          const vp = pageProxy.getViewport({ scale: genScale, rotation });
          const transform = [o, 0, 0, o, -(tile.x - g), -(tile.y - g)];

          const renderTask = pageProxy.render({
            canvasContext: bufCtx,
            viewport: vp,
            transform,
            background: "#ffffff",
          });

          const onAbort = () => {
            try {
              renderTask.cancel();
            } catch {}
          };
          signal.addEventListener("abort", onAbort);

          try {
            await renderTask.promise;
            signal.removeEventListener("abort", onAbort);
            if (signal.aborted || cancelled) {
              engine.pool.release(buf);
              return;
            }

            const tCanvas = document.createElement("canvas");
            tCanvas.width = tile.w;
            tCanvas.height = tile.h;
            const tCtx = tCanvas.getContext("2d", { alpha: false });
            if (tCtx) {
              tCtx.drawImage(buf, g, g, tile.w, tile.h, 0, 0, tile.w, tile.h);
            }
            engine.pool.release(buf);

            engine.governor.addSharp(tileKey, tCanvas);
            curGen.tiles.set(tile.key, { rect: tile, canvas: tCanvas });

            setGenerations((prev) => [...prev]);
          } catch (e: any) {
            signal.removeEventListener("abort", onAbort);
            engine.pool.release(buf);
            if (e?.name !== "RenderingCancelledException") {
              // Hata durumunda yeniden deneme veya sessiz kalma
            }
          }
        },
      };

      engine.scheduler.enqueue(job);
    });

    return () => {
      cancelled = true;
    };
  }, [pageProxy, generations[generations.length - 1]?.id, renderScale, rotation, o, docId, pageNumber, engine, tilePx, wholeMax]);

  // 7. Nesil Hazırlık Kontrolü ve Sayfa Durumu (data-page-state) Hesabı
  useEffect(() => {
    if (generations.length === 0) {
      setPageState(hasBackdrop ? "backdrop" : "empty");
      return;
    }
    const curGen = generations[generations.length - 1];
    if (!curGen) {
      setPageState(hasBackdrop ? "backdrop" : "empty");
      return;
    }

    const { cssW, cssH } = curGen;
    const mode = chooseMode(cssW, cssH, o, wholeMax);
    const viewRect = engine.viewRectInPage(pageNumber);

    let allReady = false;
    if (mode === "whole") {
      allReady = curGen.tiles.has("0:0");
    } else {
      const effectiveRect = viewRect ?? { x: 0, y: 0, w: cssW, h: cssH };
      const needed = tilesForRect(cssW, cssH, o, tilePx, effectiveRect, 0);
      allReady = needed.length > 0 && needed.every((t) => curGen.tiles.has(t.key));
    }

    if (allReady) {
      /* eslint-disable react-hooks/immutability */
      curGen.isReady = true;
      /* eslint-enable react-hooks/immutability */
      setPageState("rendered");
      if (generations.length > 1) {
        setGenerations([curGen]);
      }
    } else {
      const hasAnySharp = curGen.tiles.size > 0;
      setPageState(hasBackdrop || hasAnySharp || generations.length > 1 ? "backdrop" : "empty");
    }

    // 2500 ms güvenlik zaman aşımı: eski nesil temizlenir
    const timeout = setTimeout(() => {
      if (generations.length > 1) {
        setGenerations([generations[generations.length - 1]]);
      }
    }, 2500);

    return () => clearTimeout(timeout);
  }, [generations, hasBackdrop, o, wholeMax, tilePx, pageNumber, engine]);

  // 9. Katmanlar (Metin, Vurgu, Ek Açıklamalar)
  const latestGen = generations[generations.length - 1];
  const overlayVp = useMemo(() => {
    if (!pageProxy || !latestGen) return null;
    return pageProxy.getViewport({ scale: latestGen.scale, rotation });
  }, [pageProxy, latestGen, rotation]);

  return (
    <div
      ref={boxRef}
      data-page={pageNumber}
      data-testid={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      data-page-state={pageState}
      className="pdf-page relative bg-white shadow-md rounded-sm select-none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        contain: "layout paint style",
      }}
    >
      {/* 0. Yer Tutucu (Yalnızca sayfa tamamen boşken görünür) */}
      {pageState === "empty" && (
        <div className="placeholder absolute inset-0 bg-white flex items-center justify-center text-zinc-400 text-sm font-medium z-0">
          Sayfa {pageNumber}
        </div>
      )}

      {/* 1. Backdrop Düşük Çözünürlüklü Tuval (z=1) */}
      <canvas
        ref={backdropCanvasRef}
        data-layer="backdrop"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          filter: nightMode ? "invert(1) hue-rotate(180deg)" : undefined,
        }}
      />

      {/* 2. Nesil Kapları: [eski nesil, yeni nesil] (z=2, z=3) */}
      {generations.map((gen, idx) => {
        const isLatest = idx === generations.length - 1;
        const scaleRatio = liveScale / gen.scale;

        return (
          <div
            key={gen.id}
            className="gen pointer-events-none"
            data-gen-scale={gen.scale}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${gen.cssW}px`,
              height: `${gen.cssH}px`,
              transformOrigin: "0 0",
              transform: `scale(${scaleRatio})`,
              zIndex: isLatest ? 3 : 2,
            }}
          >
            {Array.from(gen.tiles.values()).map(({ rect, canvas }) => (
              <TileHostCanvas
                key={rect.key}
                rect={rect}
                canvas={canvas}
                nightMode={nightMode}
                isLatestGen={isLatest}
              />
            ))}
          </div>
        );
      })}

      {/* 3. Metin, Vurgu ve Ek Açıklama Katmanları (z=4) */}
      {latestGen && overlayVp && (
        <div
          className="overlays absolute inset-0 pointer-events-auto"
          data-gen-scale={latestGen.scale}
          style={{
            width: `${latestGen.cssW}px`,
            height: `${latestGen.cssH}px`,
            transformOrigin: "0 0",
            transform: `scale(${liveScale / latestGen.scale})`,
            zIndex: 4,
          }}
        >
          <PdfPageOverlays
            page={pageProxy}
            pageNumber={pageNumber}
            viewport={overlayVp}
            renderScale={latestGen.scale}
            searchMatches={overlayProps?.searchMatches}
            searchOpts={overlayProps?.searchOpts}
            searchQuery={overlayProps?.searchQuery}
            isCurrentMatchPage={overlayProps?.isCurrentMatchPage}
            activeMatchIndexInPage={overlayProps?.activeMatchIndexInPage}
            repairRules={overlayProps?.repairRules}
            onNavigateDestination={overlayProps?.onNavigateDestination}
            isHandTool={overlayProps?.isHandTool}
          />
        </div>
      )}
    </div>
  );
}
