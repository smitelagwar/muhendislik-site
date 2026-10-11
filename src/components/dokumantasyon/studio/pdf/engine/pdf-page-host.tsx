// ============================================================================
// PDF v4 MOTOR — SAYFA KONAĞI (Plan 03 P3.5)
// ----------------------------------------------------------------------------
// Tek sayfa için DOM yapısı, backdrop önizlemesi, nesil bazlı titremesiz zoom,
// parça (tile) yaşam döngüsü ve metin/vurgu katmanı montajı.
// ============================================================================

"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import type { PdfEngine } from "@/lib/dokumantasyon/studio/pdf/engine/engine";
import {
  chooseMode,
  outputScaleFor,
  tilesForRect,
  WHOLE_MAX_PX,
  TILE_PX,
  GUTTER,
  TileRect,
} from "@/lib/dokumantasyon/studio/pdf/engine/tiles";
import {
  useEngineScale,
  useEngineRenderScale,
  useEngineRotation,
} from "@/lib/dokumantasyon/studio/pdf/engine/use-pdf-engine";
import { recordPdfError } from "@/lib/dokumantasyon/studio/pdf/pdf-diagnostics";
import { PdfPageOverlays } from "./pdf-page-overlays";
import type { SearchMatch, SearchOpts } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import type { MappingRule } from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";

const backdropKeyOf = (doc: string, page: number, rot: number) => `b:${doc}:${page}:r${rot}`;
const tileKeyOf = (doc: string, page: number, rot: number, genScale: number, o: number, tile: string) =>
  `s:${doc}:${page}:r${rot}:${genScale}:${o}:${tile}`;

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

function useDpr(): number {
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    let mq: MediaQueryList | null = null;
    const sync = () => {
      const next = window.devicePixelRatio || 1;
      setDpr((prev) => (Math.abs(prev - next) > 1e-3 ? next : prev));
    };
    const onChange = () => {
      sync();
      bind();
    };
    const bind = () => {
      mq?.removeEventListener("change", onChange);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      mq.addEventListener("change", onChange, { once: true });
    };
    bind();
    window.addEventListener("resize", onChange);
    const timer = setInterval(sync, 500);
    return () => {
      mq?.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      clearInterval(timer);
    };
  }, []);
  return dpr;
}

function PdfPageHostInner({
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

  const engineRotation = useEngineRotation(engine);
  const rotation = propRotation ?? engineRotation;

  const backdropKey = backdropKeyOf(docId, pageNumber, rotation);
  const [pageProxy, setPageProxy] = useState<any>(null);
  const [hasBackdrop, setHasBackdrop] = useState(() => engine.governor.backdrop.has(backdropKey));
  const [generations, setGenerations] = useState<PageGen[]>([]);
  const [renderFailed, setRenderFailed] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [viewTick, setViewTick] = useState(0);
  const modeRef = useRef<"whole" | "tiles">("whole");
  const [pageState, setPageState] = useState<"empty" | "backdrop" | "rendered" | "error">(() =>
    engine.governor.backdrop.has(backdropKey) ? "backdrop" : "empty"
  );

  const generationsRef = useRef(generations);
  generationsRef.current = generations;
  const retryRef = useRef(new Map<string, number>());

  const bumpRaf = useRef(0);
  const bumpTiles = useCallback(() => {
    if (bumpRaf.current) return;
    bumpRaf.current = requestAnimationFrame(() => {
      bumpRaf.current = 0;
      setGenerations((prev) => [...prev]);
    });
  }, []);
  useEffect(() => () => { if (bumpRaf.current) cancelAnimationFrame(bumpRaf.current); }, []);

  useEffect(() => () => engine.clearPageKeys(pageNumber), [engine, pageNumber]);

  useEffect(() => {
    return engine.subscribe("refresh", () => {
      for (const g of generationsRef.current) {
        for (const [k, t] of [...g.tiles]) if (t.canvas.width === 0) g.tiles.delete(k);
      }
      setRefreshTick((n) => n + 1);
    });
  }, [engine]);

  const inViewRef = useRef(false);
  useEffect(
    () =>
      engine.subscribe("view", () => {
        const nowInView = engine.viewRectInPage(pageNumber) !== null;
        if (modeRef.current === "tiles" || nowInView !== inViewRef.current) {
          inViewRef.current = nowInView;
          setViewTick((n) => n + 1);
        }
      }),
    [engine, pageNumber]
  );

  // 1. Box DOM kaydı: motor sayfa kutusunu doğrudan translate3d ile konumlandırır
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    return engine.registerPage(pageNumber, el);
  }, [engine, pageNumber]);

  // 2. Sayfa Proxy'sini yükle (görünür sayfalar hemen, overscan sayfalar 25ms gecikmeyle)
  useEffect(() => {
    let active = true;
    let requested = false;
    if (!pdfDoc) return;

    const load = () => {
      if (requested || !active) return;
      requested = true;
      pdfDoc
        .getPage(pageNumber)
        .then((p: unknown) => {
          if (active) setPageProxy(p);
        })
        .catch(() => {});
    };

    if (engine.viewRectInPage(pageNumber) !== null) {
      load();
      return () => {
        active = false;
      };
    }

    const timer = setTimeout(load, 25);
    const unsub = engine.subscribe("view", () => {
      if (engine.viewRectInPage(pageNumber) !== null) {
        clearTimeout(timer);
        load();
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      unsub();
    };
  }, [pdfDoc, pageNumber, engine]);

  useEffect(
    () => () => {
      try {
        pageProxy?.cleanup();
      } catch {}
    },
    [pageProxy]
  );

  // 3. Profil ve Ölçek Sabitleri
  const isCoarse = typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
  const wholeMax = isCoarse ? WHOLE_MAX_PX.mobile : WHOLE_MAX_PX.desktop;
  const tilePx = isCoarse ? TILE_PX.mobile : TILE_PX.desktop;
  const dpr = useDpr();
  const o = outputScaleFor(dpr);

  // 4. Backdrop (Düşük Çözünürlüklü Önizleme)
  useEffect(() => {
    if (!pageProxy) return;

    const backdropKey = backdropKeyOf(docId, pageNumber, rotation);
    const cached = engine.governor.backdrop.get(backdropKey);

    if (cached && cached.width === 0) {
      engine.governor.backdrop.delete(backdropKey);
    } else if (cached) {
      const bCanvas = backdropCanvasRef.current;
      if (bCanvas) {
        bCanvas.width = cached.width;
        bCanvas.height = cached.height;
        const ctx = bCanvas.getContext("2d");
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, cached.width, cached.height);
          ctx.drawImage(cached, 0, 0);
        }
        bCanvas.style.opacity = "1";
        if (boxRef.current?.getAttribute("data-page-state") === "empty") {
          boxRef.current.setAttribute("data-page-state", "backdrop");
        }
        setHasBackdrop(true);
        setPageState((prev) => (prev === "empty" ? "backdrop" : prev));
      }
      return;
    }

    let cancelled = false;
    const inViewNow = engine.viewRectInPage(pageNumber) !== null;

    const job = {
      id: backdropKey,
      cls: 1, // Backdrop önceliği sınıf 1
      dist: (inViewNow ? 0 : 100) + Math.abs(pageNumber - engine.getCurrentPage()),
      run: async (signal: AbortSignal) => {
        if (signal.aborted || cancelled) return;
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
        const bCtx = bCanvas.getContext("2d");
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
          if (signal.aborted || cancelled) return;

          engine.governor.addBackdrop(backdropKey, bCanvas);
          const target = backdropCanvasRef.current;
          if (target) {
            target.width = bCanvas.width;
            target.height = bCanvas.height;
            const ctx = target.getContext("2d");
            if (ctx) {
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.clearRect(0, 0, bCanvas.width, bCanvas.height);
              ctx.drawImage(bCanvas, 0, 0);
            }
            target.style.opacity = "1";
            if (boxRef.current?.getAttribute("data-page-state") === "empty") {
              boxRef.current.setAttribute("data-page-state", "backdrop");
            }
            setHasBackdrop(true);
            setPageState((prev) => (prev === "empty" ? "backdrop" : prev));
          }
        } catch (e: unknown) {
          signal.removeEventListener("abort", onAbort);
          if ((e as { name?: string })?.name !== "RenderingCancelledException") {
            recordPdfError("render", e);
            const n = (retryRef.current.get(backdropKey) ?? 0) + 1;
            if (n <= 2) {
              retryRef.current.set(backdropKey, n);
              setTimeout(() => {
                if (!cancelled) engine.scheduler.enqueue(job);
              }, 600 * n);
            } else {
              setRenderFailed(true);
            }
          }
        }
      },
    };

    engine.scheduler.enqueue(job);
    return () => {
      cancelled = true;
      engine.scheduler.cancel(backdropKey);
    };
  }, [pageProxy, docId, pageNumber, rotation, engine, isCoarse, refreshTick]);

  // 5. Nesil Yönetimi ve Parça Render Döngüsü
  const renderScale = useEngineRenderScale(engine);
  const liveScale = useEngineScale(engine);

  useEffect(() => {
    if (!pageProxy) return;

    const baseVp = pageProxy.getViewport({ scale: renderScale, rotation });
    const cssW = baseVp.width;
    const cssH = baseVp.height;
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
  const activeGenerationId = generations[generations.length - 1]?.id;
  useEffect(() => {
    if (!pageProxy || !hasBackdrop || generations.length === 0) return;

    const curGen = generations[generations.length - 1];
    if (!curGen || curGen.id !== `${pageNumber}:${renderScale}:${rotation}`) return;

    const { cssW, cssH, scale: genScale } = curGen;
    const mode = chooseMode(cssW, cssH, o, wholeMax);
    modeRef.current = mode;
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
    } else if (viewRect === null) {
      targetTiles = [];
    } else {
      const visibleOnly = tilesForRect(cssW, cssH, o, tilePx, viewRect, 0);
      const withMargin = tilesForRect(cssW, cssH, o, tilePx, viewRect, tilePx / o);
      const seen = new Set(visibleOnly.map((t) => t.key));
      targetTiles = [...visibleOnly];
      for (const t of withMargin) {
        if (!seen.has(t.key) && targetTiles.length < 24) {
          seen.add(t.key);
          targetTiles.push(t);
        }
      }
    }

    let cancelled = false;
    const enqueuedIds: string[] = [];
    const visibleTileKeys = new Set(targetTiles.map((t) => t.key));
    for (const k of [...curGen.tiles.keys()]) {
      if (!visibleTileKeys.has(k)) {
        curGen.tiles.delete(k);
      }
    }

    const keyOf = (t: TileRect) => tileKeyOf(docId, pageNumber, rotation, genScale, o, t.key);
    inViewRef.current = viewRect !== null;
    if (viewRect === null) {
      engine.clearPageKeys(pageNumber);
    } else {
      const protectedTiles =
        mode === "whole" ? targetTiles : tilesForRect(cssW, cssH, o, tilePx, viewRect, 0);
      engine.setPageKeys(pageNumber, [
        backdropKeyOf(docId, pageNumber, rotation),
        ...protectedTiles.map(keyOf),
      ]);
    }

    targetTiles.forEach((tile) => {
      const tileKey = keyOf(tile);
      const cached = engine.governor.sharp.get(tileKey);

      if (cached && cached.width === 0) {
        engine.governor.sharp.delete(tileKey);
      } else if (cached) {
        if (curGen.tiles.get(tile.key)?.canvas !== cached) {
          curGen.tiles.set(tile.key, { rect: tile, canvas: cached });
          bumpTiles();
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
        : false;

      const job = {
        id: tileKey,
        cls: isVisible ? 1.5 : 2, // Görünür parça backdrop sonrası (1.5), overscan sınıf 2
        dist: Math.abs(pageNumber - engine.getCurrentPage()),
        run: async (signal: AbortSignal) => {
          if (signal.aborted || cancelled) return;

          const g = mode === "tiles" ? GUTTER : 0;
          const bufW = tile.w + 2 * g;
          const bufH = tile.h + 2 * g;
          const buf = engine.pool.acquire(bufW, bufH);
          const bufCtx = buf.getContext("2d");
          if (!bufCtx) {
            engine.pool.release(buf);
            engine.governor.onAllocFailure();
            return;
          }
          bufCtx.setTransform(1, 0, 0, 1, 0, 0);
          bufCtx.clearRect(0, 0, bufW, bufH);

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
            const tCtx = tCanvas.getContext("2d");
            if (tCtx) {
              tCtx.drawImage(buf, g, g, tile.w, tile.h, 0, 0, tile.w, tile.h);
            }
            engine.pool.release(buf);

            engine.governor.addSharp(tileKey, tCanvas);
            curGen.tiles.set(tile.key, { rect: tile, canvas: tCanvas });

            bumpTiles();
          } catch (e: unknown) {
            signal.removeEventListener("abort", onAbort);
            engine.pool.release(buf);
            if ((e as { name?: string })?.name !== "RenderingCancelledException") {
              recordPdfError("render", e);
              const n = (retryRef.current.get(tileKey) ?? 0) + 1;
              if (n <= 2) {
                retryRef.current.set(tileKey, n);
                setTimeout(() => {
                  if (!cancelled) engine.scheduler.enqueue(job);
                }, 600 * n);
              } else {
                setRenderFailed(true);
              }
            }
          }
        },
      };

      enqueuedIds.push(tileKey);
      engine.scheduler.enqueue(job);
    });

    return () => {
      cancelled = true;
      for (const id of enqueuedIds) {
        engine.scheduler.cancel(id);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Nesil dizisinin tamamı tile başına yenilenir; kimliği izlemek yeniden kuyruklama döngüsünü önler.
  }, [pageProxy, hasBackdrop, activeGenerationId, renderScale, rotation, o, docId, pageNumber, engine, tilePx, wholeMax, refreshTick, viewTick, bumpTiles]);

  // 7. Nesil Hazırlık Kontrolü ve Sayfa Durumu (data-page-state) Hesabı
  useEffect(() => {
    if (renderFailed) {
      setPageState("error");
      return;
    }
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
      const t0 = curGen.tiles.get("0:0");
      allReady = !!t0 && t0.canvas.width > 0;
    } else if (viewRect === null) {
      allReady = false;
    } else {
      const needed = tilesForRect(cssW, cssH, o, tilePx, viewRect, 0);
      allReady =
        needed.length > 0 &&
        needed.every((t) => {
          const item = curGen.tiles.get(t.key);
          return !!item && item.canvas.width > 0;
        });
    }

    if (allReady) {
      /* eslint-disable react-hooks/immutability */
      curGen.isReady = true;
      /* eslint-enable react-hooks/immutability */
      setPageState("rendered");
      if (generations.length > 1) {
        setGenerations([curGen]);
      }
    } else if (mode === "tiles" && viewRect === null) {
      setPageState(hasBackdrop ? "backdrop" : "empty");
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
  }, [generations, hasBackdrop, o, wholeMax, tilePx, pageNumber, engine, renderFailed, viewTick]);

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
        <div className="placeholder pointer-events-none absolute inset-0 bg-white flex items-center justify-center text-zinc-400 text-sm font-medium z-0">
          Sayfa {pageNumber}
        </div>
      )}

      {/* 0b. Render Hatası Durumu */}
      {pageState === "error" && (
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-2 text-zinc-600 text-sm font-medium z-10">
          <span>Sayfa çizilemedi</span>
          <button
            type="button"
            data-testid={`pdf-page-retry-${pageNumber}`}
            data-no-tap
            onClick={() => {
              retryRef.current.clear();
              setRenderFailed(false);
              setRefreshTick((n) => n + 1);
            }}
            className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
          >
            Yeniden dene
          </button>
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
          opacity: hasBackdrop ? 1 : 0,
          pointerEvents: "none",
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
      {latestGen && overlayVp && (pageState === "rendered" || generations.some((g) => g.isReady)) && (
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

function areEqual(prev: PdfPageHostProps, next: PdfPageHostProps): boolean {
  if (
    prev.engine !== next.engine ||
    prev.pdfDoc !== next.pdfDoc ||
    prev.pageNumber !== next.pageNumber ||
    prev.rotation !== next.rotation ||
    prev.nightMode !== next.nightMode
  ) {
    return false;
  }
  const po = prev.overlayProps;
  const no = next.overlayProps;
  if (po === no) return true;
  if (!po || !no) return false;
  return (
    po.searchMatches === no.searchMatches &&
    po.searchOpts === no.searchOpts &&
    po.searchQuery === no.searchQuery &&
    po.isCurrentMatchPage === no.isCurrentMatchPage &&
    po.activeMatchIndexInPage === no.activeMatchIndexInPage &&
    po.repairRules === no.repairRules &&
    po.onNavigateDestination === no.onNavigateDestination &&
    po.isHandTool === no.isHandTool
  );
}

export const PdfPageHost = React.memo(PdfPageHostInner, areEqual);
