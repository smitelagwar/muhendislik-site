// ============================================================================
// PDF v4 MOTOR — GİRİŞ VE ETKİLEŞİM KONTROLCÜSÜ (Plan 04 B1–B9)
// ----------------------------------------------------------------------------
// - Masaüstü tekerlek & trackpad (çentik vs sürekli)
// - Mobil 2 parmak pinch (kaydırma kilidi, rubber-band direnci, atalet bastırma)
// - Çift dokunma ve tek dokunma (pinch sonrası yanlış algılama korumalı)
// - Retarget edilebilir ZoomAnimator ile tam entegrasyon
// - v3 uyumlu zoomTo API adaptörü
// ============================================================================

"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PdfEngine } from "./engine";
import { anchorFromPoint, type DocAnchor } from "./layout";
import { ZoomAnimator } from "./zoom-animator";
import { ScrollTracker } from "./scroll-tracker";
import { rubber } from "./rubber";
import {
  wheelZoomFactor,
  isWheelNotch,
} from "../pdf-zoom-math";

export interface ResolveAnchorSource {
  kind: "pointer" | "viewport" | "fit";
  x?: number;
  y?: number;
}

export function resolveAnchor(
  engine: PdfEngine,
  src: ResolveAnchorSource
): { anchor: DocAnchor; vx: number; vy: number } {
  const sc = engine.scroller;
  const r = sc.getBoundingClientRect();
  const L = engine.getLayout();
  let vx: number;
  let vy: number;

  if (src.kind === "pointer" && src.x != null && src.y != null) {
    vx = src.x - r.left;
    vy = src.y - r.top;
  } else if (src.kind === "fit" || sc.scrollTop <= 1) {
    vx = r.width / 2;
    vy = 0;
  } else {
    vx = r.width / 2;
    vy = r.height / 2;
  }

  let a: DocAnchor;
  if (src.kind === "pointer" && src.x != null && src.y != null && typeof document !== "undefined") {
    const el = document.elementFromPoint(src.x, src.y)?.closest("[data-page]") as HTMLElement | null;
    if (el && el.dataset.page) {
      const pageIndex = Number(el.dataset.page) - 1;
      const elRect = el.getBoundingClientRect();
      a = {
        page: pageIndex,
        fx: (src.x - elRect.left) / elRect.width,
        fy: (src.y - elRect.top) / elRect.height,
      };
    } else {
      a = anchorFromPoint(L, sc.scrollLeft + vx, sc.scrollTop + vy);
    }
  } else {
    a = anchorFromPoint(L, sc.scrollLeft + vx, sc.scrollTop + vy);
  }

  return { anchor: a, vx, vy };
}

export interface InputControllerOptions {
  onTap?: (clientX: number, clientY: number, target: EventTarget | null) => void;
  onDoubleTap?: (clientX: number, clientY: number, target: EventTarget | null) => void;
  onSettle?: (scale: number, mode?: string) => void;
  disabled?: boolean;
}

export interface ZoomToOptions {
  x?: number;
  y?: number;
  animate?: boolean;
  mode?: "fit-width" | "fit-page" | "custom" | "actual-size";
}

export function useInputController(
  engine: PdfEngine | null,
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  opts: InputControllerOptions = {}
) {
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  const animatorRef = useRef<ZoomAnimator | null>(null);
  const scrollTrackerRef = useRef<ScrollTracker | null>(null);
  const pendingModeRef = useRef<string>("custom");

  // Dokunma ve jest durumları
  const suppressTapsUntilRef = useRef<number>(0);
  const lockTimerRef = useRef<any>(null);

  // Initialize animator & scroll tracker
  useEffect(() => {
    if (!engine || !scrollContainerRef.current) return;
    const scroller = scrollContainerRef.current;

    const animator = new ZoomAnimator(engine);
    animatorRef.current = animator;

    const tracker = new ScrollTracker(scroller, (state) => {
      if (!animator.isAnimating()) {
        engine.setInteraction(state);
      }
    });
    scrollTrackerRef.current = tracker;

    return () => {
      animator.stop();
      tracker.dispose();
      animatorRef.current = null;
      scrollTrackerRef.current = null;
    };
  }, [engine, scrollContainerRef]);

  // Tekerlek & trackpad dinleyicisi (yalnızca scroller üzerinde, passive: false)
  useEffect(() => {
    if (!engine || !scrollContainerRef.current) return;
    const scroller = scrollContainerRef.current;
    const animator = animatorRef.current;
    if (!animator) return;

    let pendingTarget: number | null = null;
    let notchTimer: any = null;
    let liveTarget: number | null = null;
    let settleTimer: any = null;
    let activeWheelAnchor: { anchor: DocAnchor; vx: number; vy: number } | null = null;
    let coalesceRaf = 0;

    const onWheel = (e: WheelEvent) => {
      if (optsRef.current.disabled) return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const f = wheelZoomFactor(e);
      const notch = isWheelNotch(e);

      if (!activeWheelAnchor) {
        activeWheelAnchor = resolveAnchor(engine, {
          kind: "pointer",
          x: e.clientX,
          y: e.clientY,
        });
      }
      const { anchor, vx, vy } = activeWheelAnchor;

      if (notch) {
        // Çentikli fare: hedef birikir ve 120ms animatörle yumuşar
        pendingTarget = engine.clampScale((pendingTarget ?? engine.getScale()) * f);
        animator.animate(pendingTarget, anchor, vx, vy, 120);

        if (notchTimer) clearTimeout(notchTimer);
        notchTimer = setTimeout(() => {
          pendingTarget = null;
          activeWheelAnchor = null;
        }, 200);
      } else {
        // Trackpad sürekli jest: animasyonsuz doğrudan canlı ölçek
        liveTarget = engine.clampScale((liveTarget ?? engine.getScale()) * f);
        engine.setInteraction("gesture");

        if (coalesceRaf) cancelAnimationFrame(coalesceRaf);
        coalesceRaf = requestAnimationFrame(() => {
          coalesceRaf = 0;
          if (liveTarget != null) {
            engine.setLiveScale(liveTarget, anchor, vx, vy);
          }
        });

        if (settleTimer) clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          engine.settleScale();
          engine.setInteraction("idle");
          liveTarget = null;
          activeWheelAnchor = null;
          optsRef.current.onSettle?.(engine.getScale());
        }, 140);
      }
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scroller.removeEventListener("wheel", onWheel);
      if (notchTimer) clearTimeout(notchTimer);
      if (settleTimer) clearTimeout(settleTimer);
      if (coalesceRaf) cancelAnimationFrame(coalesceRaf);
    };
  }, [engine, scrollContainerRef]);

  // İki parmak pinch (mobil dokunmatik)
  useEffect(() => {
    if (!engine || !scrollContainerRef.current) return;
    const scroller = scrollContainerRef.current;
    const animator = animatorRef.current;
    if (!animator) return;

    let active = false;
    let ignoreUntilAllUp = false;
    let d0 = 0;
    let s0 = 1;
    let anchor: DocAnchor | null = null;
    let locked = false;
    let wasPinching = false;
    let coalesceRaf = 0;
    let latestState = { s: 1, vx: 0, vy: 0 };

    const lockScroll = () => {
      if (locked) return;
      locked = true;
      scroller.style.overflow = "hidden";
      // 10 sn güvenlik zamanlayıcısı (olay kaybı durumunda takılı kalmayı önler)
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(unlockScroll, 10_000);
    };

    const unlockScroll = () => {
      if (!locked) return;
      locked = false;
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
      requestAnimationFrame(() => {
        scroller.style.overflow = "";
      });
    };

    const suppressTaps = () => {
      suppressTapsUntilRef.current = performance.now() + 350;
    };

    const endPinch = (settle: boolean) => {
      if (!active) return;
      active = false;
      ignoreUntilAllUp = true;
      suppressTaps();

      if (coalesceRaf) {
        cancelAnimationFrame(coalesceRaf);
        coalesceRaf = 0;
      }

      if (anchor) {
        engine.setLiveScale(latestState.s, anchor, latestState.vx, latestState.vy);
      }

      const curScale = engine.getScale();
      const target = engine.clampScale(curScale);

      // Lastik payı varsa (rubber-band) yumuşak geri yaylan
      if (Math.abs(target - curScale) > 1e-4 && anchor) {
        animator.animate(target, anchor, latestState.vx, latestState.vy, 180).then(() => {
          optsRef.current.onSettle?.(engine.getScale());
          scroller.removeAttribute("data-zooming");
        });
      } else if (settle) {
        engine.settleScale();
        engine.setInteraction("idle");
        optsRef.current.onSettle?.(engine.getScale());
        scroller.removeAttribute("data-zooming");
      } else {
        scroller.removeAttribute("data-zooming");
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (optsRef.current.disabled) return;
      // 3 veya daha fazla parmak: jesti sonlandır ve yut
      if (e.touches.length >= 3) {
        endPinch(false);
        ignoreUntilAllUp = true;
        return;
      }
      if (ignoreUntilAllUp) return;

      if (e.touches.length === 2) {
        // Girdi kutusunda başlamışsa karışma
        const target = e.target as HTMLElement | null;
        if (target?.closest("input, textarea, select")) return;

        lockScroll();
        animator.stop();

        const [t1, t2] = [e.touches[0], e.touches[1]];
        const cx = (t1.clientX + t2.clientX) / 2;
        const cy = (t1.clientY + t2.clientY) / 2;

        active = true;
        wasPinching = true;
        d0 = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY) || 1;
        s0 = engine.getScale();

        const res = resolveAnchor(engine, { kind: "pointer", x: cx, y: cy });
        anchor = res.anchor;
        latestState = { s: s0, vx: res.vx, vy: res.vy };

        engine.setInteraction("gesture");
        scroller.setAttribute("data-zooming", "");
        suppressTaps();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || e.touches.length !== 2 || !anchor) return;

      const [t1, t2] = [e.touches[0], e.touches[1]];
      const d = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY) || 1;
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const r = scroller.getBoundingClientRect();

      const raw = s0 * (d / d0);
      const s = rubber(raw, engine.minScale(), engine.maxScale());

      latestState = { s, vx: cx - r.left, vy: cy - r.top };

      if (coalesceRaf) cancelAnimationFrame(coalesceRaf);
      coalesceRaf = requestAnimationFrame(() => {
        coalesceRaf = 0;
        engine.setLiveScale(latestState.s, anchor!, latestState.vx, latestState.vy);
      });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (active && e.touches.length < 2) {
        endPinch(true);
      }
      if (e.touches.length === 0) {
        ignoreUntilAllUp = false;
        wasPinching = false;
        unlockScroll();
      } else if (!active && e.touches.length === 1 && wasPinching) {
        ignoreUntilAllUp = true;
      }
    };

    const onTouchCancel = () => {
      endPinch(false);
      ignoreUntilAllUp = false;
      wasPinching = false;
      unlockScroll();
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("pagehide", onTouchCancel);

    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("pagehide", onTouchCancel);
      if (coalesceRaf) cancelAnimationFrame(coalesceRaf);
      unlockScroll();
    };
  }, [engine, scrollContainerRef]);

  // Tek dokunma ve Çift dokunma algılayıcı
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const scroller = scrollContainerRef.current;

    let lastTapTime = 0;
    let lastTapPos = { x: 0, y: 0 };
    let tapTimer: any = null;

    const onTouchEnd = (e: TouchEvent) => {
      if (optsRef.current.disabled) return;
      if (performance.now() < suppressTapsUntilRef.current) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const now = performance.now();
      const dist = Math.hypot(touch.clientX - lastTapPos.x, touch.clientY - lastTapPos.y);

      if (now - lastTapTime < 300 && dist < 35) {
        // Çift dokunma
        if (tapTimer) clearTimeout(tapTimer);
        tapTimer = null;
        lastTapTime = 0;
        optsRef.current.onDoubleTap?.(touch.clientX, touch.clientY, e.target);
      } else {
        // İlk dokunma: çift dokunma süresi kadar bekle
        lastTapTime = now;
        lastTapPos = { x: touch.clientX, y: touch.clientY };

        if (tapTimer) clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
          tapTimer = null;
          optsRef.current.onTap?.(touch.clientX, touch.clientY, e.target);
        }, 260);
      }
    };

    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      scroller.removeEventListener("touchend", onTouchEnd);
      if (tapTimer) clearTimeout(tapTimer);
    };
  }, [scrollContainerRef]);

  // Programatik zoomTo API'si (v3 imza adaptörü)
  const zoomTo = useCallback(
    (n: number, o: ZoomToOptions = {}): Promise<void> => {
      if (!engine || !animatorRef.current) return Promise.resolve();

      const { anchor, vx, vy } = resolveAnchor(
        engine,
        o.x != null && o.y != null
          ? { kind: "pointer", x: o.x, y: o.y }
          : { kind: o.mode?.startsWith("fit") ? "fit" : "viewport" }
      );

      pendingModeRef.current = o.mode ?? "custom";
      const isFit = o.mode?.startsWith("fit");
      const ms = o.animate ? (isFit ? 220 : 160) : 0;

      return animatorRef.current.animate(n, anchor, vx, vy, ms).then(() => {
        optsRef.current.onSettle?.(engine.getScale(), pendingModeRef.current);
      });
    },
    [engine]
  );

  return {
    zoomTo,
  };
}
