// ASSUMPTION: useZoomGestures v2 implements page-space anchor tracking (Anchor { el, fx, fy }), wheel delta normalization, macOS Safari gesture events, e.cancelable verification, data-zooming attribute, and viewport-centered zoomTo API.

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { wheelZoomFactor } from "./pdf-zoom-math";

type Anchor = { el: HTMLElement; fx: number; fy: number };
export type ZoomCommitMode = "custom" | "actual-size" | "fit-width" | "fit-page";

type Live = {
  r: number;
  active: boolean;
  ox: number;           // odak noktası, scroll konteynerine göre (px)
  oy: number;
  originX: number;      // transform-origin, content'e göre (px)
  originY: number;
  anchor: Anchor | null;
  mode?: ZoomCommitMode;
};

export type ZoomOpts = {
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  animate?: boolean;
  mode?: ZoomCommitMode;
};

export interface ZoomGestureOptions {
  scale: number;
  min: number;
  max: number;
  onCommit: (next: number, mode?: ZoomCommitMode, hasQueuedZoom?: boolean) => void;
  disabled?: boolean;
  onTap?: (x: number, y: number, target: EventTarget | null) => void;
  onDoubleTap?: (x: number, y: number, target: EventTarget | null) => void;
}

const EMPTY: Live = { r: 1, active: false, ox: 0, oy: 0, originX: 0, originY: 0, anchor: null };

export function useZoomGestures(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  { scale, min, max, onCommit, disabled = false, onTap, onDoubleTap }: ZoomGestureOptions
) {
  const live = useRef<Live>({ ...EMPTY });
  const pending = useRef<Live | null>(null);
  const scaleRef = useRef(scale);
  const commitCb = useRef(onCommit);
  const optsRef = useRef({ onTap, onDoubleTap });
  const api = useRef<((n: number, o?: ZoomOpts) => void) | null>(null);
  const queuedZoom = useRef<{ scale: number; options: ZoomOpts } | null>(null);

  useLayoutEffect(() => {
    scaleRef.current = scale;
    commitCb.current = onCommit;
    optsRef.current = { onTap, onDoubleTap };
  }, [scale, onCommit, onTap, onDoubleTap]);

  const clearStyles = useCallback(() => {
    const c = contentRef.current;
    const s = scrollRef.current;
    if (c) {
      c.style.transform = "";
      c.style.transformOrigin = "";
      c.style.willChange = "";
      c.style.transition = "";
    }
    s?.removeAttribute("data-zooming");
  }, [contentRef, scrollRef]);

  // Commit sonrası (boyamadan önce): transform'u kaldır, sayfa-uzayı çıpasına göre scroll'u düzelt
  useLayoutEffect(() => {
    const p = pending.current;
    const s = scrollRef.current;
    if (!p || !s) return;
    pending.current = null;
    clearStyles();
    const a = p.anchor;
    if (a && a.el.isConnected) {
      const r = a.el.getBoundingClientRect();
      const sr = s.getBoundingClientRect();
      s.scrollLeft += r.left + a.fx * r.width - (sr.left + p.ox);
      s.scrollTop += r.top + a.fy * r.height - (sr.top + p.oy);
    }
    live.current = { ...EMPTY };
    const queued = queuedZoom.current;
    queuedZoom.current = null;
    if (queued) {
      requestAnimationFrame(() => api.current?.(queued.scale, queued.options));
    }
  }, [scale, scrollRef, contentRef, clearStyles]);

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || disabled) return;

    let raf = 0;
    let timer = 0;
    let animationTimer = 0;
    let d0 = 0;
    let r0 = 1;
    let g0 = 1;
    let touchPinch = false;

    const clampR = (r: number) =>
      Math.min(max / scaleRef.current, Math.max(min / scaleRef.current, r));

    const begin = (clientX: number, clientY: number) => {
      const l = live.current;
      if (l.active) return;
      const sr = el.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      l.ox = clientX - sr.left;
      l.oy = clientY - sr.top;
      l.originX = clientX - cr.left;
      l.originY = clientY - cr.top;

      // Çıpa sayfası: imlecin altındaki, yoksa dikeyde en yakın sayfa
      let best: HTMLElement | null = null;
      let bestD = Infinity;
      content.querySelectorAll<HTMLElement>("[data-page]").forEach((p) => {
        if (bestD === 0) return;
        const r = p.getBoundingClientRect();
        const d = clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
        if (d < bestD) {
          best = p;
          bestD = d;
        }
      });
      if (best) {
        const r = (best as HTMLElement).getBoundingClientRect();
        l.anchor = {
          el: best,
          fx: (clientX - r.left) / r.width,
          fy: (clientY - r.top) / r.height,
        };
      } else {
        l.anchor = null;
      }

      l.active = true;
      el.setAttribute("data-zooming", "");
    };

    const paint = () => {
      raf = 0;
      const l = live.current;
      content.style.transformOrigin = `${l.originX}px ${l.originY}px`;
      content.style.transform = `scale(${l.r})`;
      content.style.willChange = "transform";
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const commit = () => {
      const l = live.current;
      if (!l.active) return;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      const next = Math.round(Math.min(max, Math.max(min, scaleRef.current * l.r)) * 1e4) / 1e4;
      if (next === scaleRef.current) {
        clearStyles();
        live.current = { ...EMPTY };
        const queued = queuedZoom.current;
        queuedZoom.current = null;
        if (queued) window.setTimeout(() => api.current?.(queued.scale, queued.options), 0);
        return;
      }
      pending.current = { ...l };
      commitCb.current(next, l.mode, queuedZoom.current !== null);
    };

    // Toolbar butonları ve programatik zoom için: odak korumalı ve animasyonlu zoom (Acrobat v3)
    let animating = false;
    api.current = (n: number, o: ZoomOpts = {}) => {
      if (pending.current || animating) {
        queuedZoom.current = { scale: n, options: o };
        if (animating) {
          window.clearTimeout(animationTimer);
          animationTimer = 0;
          content.style.transition = "";
          animating = false;
          commit();
        }
        return;
      }
      const rect = el.getBoundingClientRect();
      const atTop = el.scrollTop <= 1 && o.x == null && o.y == null; // varsayılan (merkez) çıpa yalnızca belge ortasındayken
      begin(o.x ?? rect.left + rect.width / 2, o.y ?? (atTop ? rect.top : rect.top + rect.height / 2));
      live.current.mode = o.mode;
      if (o.dx != null && o.dy != null) {
        live.current.ox = o.dx - rect.left;
        live.current.oy = o.dy - rect.top;
      }
      live.current.r = clampR(n / scaleRef.current);
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!o.animate || reduce) {
        commit();
        return;
      }
      const l = live.current;
      animating = true;
      content.style.transformOrigin = `${l.originX}px ${l.originY}px`;
      content.style.willChange = "transform";
      content.getBoundingClientRect(); // reflow: geçiş başlangıcı
      content.style.transition = "transform 180ms cubic-bezier(.2,.8,.2,1)";
      content.style.transform = `scale(${l.r})`;
      animationTimer = window.setTimeout(() => {
        content.style.transition = "";
        animating = false;
        animationTimer = 0;
        commit();
      }, 190);
    };

    // --- Masaüstü: ctrl/cmd + tekerlek, Chrome/Firefox trackpad pinch (ctrlKey=true) ---
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (pending.current || animating) return;
      begin(e.clientX, e.clientY);
      live.current.r = clampR(live.current.r * wheelZoomFactor(e));
      schedule();
      clearTimeout(timer);
      timer = window.setTimeout(commit, 180);
    };

    // --- Safari masaüstü ve iPad trackpad pinch (gesture olayları) (D9) ---
    const gStart = (e: any) => {
      e.preventDefault();
      if (touchPinch || pending.current || animating) return;
      begin(e.clientX, e.clientY);
      g0 = live.current.r;
    };
    const gChange = (e: any) => {
      e.preventDefault();
      if (touchPinch || !live.current.active || animating) return;
      live.current.r = clampR(g0 * e.scale);
      schedule();
    };
    const gEnd = (e: any) => {
      e.preventDefault();
      if (!touchPinch && !animating) commit();
    };

    // --- Mobil: iki parmak pinch & tek/çift dokunma (Acrobat v3) ---
    let t0: { x: number; y: number; t: number } | null = null;
    let lastTap: { x: number; y: number; t: number } | null = null;
    let tapTimer = 0;

    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (animating) return;
      t0 =
        e.touches.length === 1
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }
          : null;
      if (e.touches.length !== 2 || pending.current) return;
      touchPinch = true;
      d0 = dist(e.touches);
      begin(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2
      );
      r0 = live.current.r;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (animating) return;
      if (
        t0 &&
        e.touches.length === 1 &&
        Math.hypot(e.touches[0].clientX - t0.x, e.touches[0].clientY - t0.y) > 10
      ) {
        t0 = null;
      }
      if (e.touches.length !== 2 || !d0) return;
      if (e.cancelable) e.preventDefault();
      live.current.r = clampR(r0 * (dist(e.touches) / d0));
      schedule();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (t0 && e.touches.length === 0 && Date.now() - t0.t < 250) {
        const c = e.changedTouches[0];
        const tgt = e.target;
        if (
          lastTap &&
          Date.now() - lastTap.t < 300 &&
          Math.hypot(c.clientX - lastTap.x, c.clientY - lastTap.y) < 30
        ) {
          window.clearTimeout(tapTimer);
          lastTap = null;
          optsRef.current.onDoubleTap?.(c.clientX, c.clientY, tgt);
        } else {
          lastTap = { x: c.clientX, y: c.clientY, t: Date.now() };
          tapTimer = window.setTimeout(() => {
            lastTap = null;
            optsRef.current.onTap?.(c.clientX, c.clientY, tgt);
          }, 300);
        }
      }
      t0 = null;
      if (d0 && e.touches.length < 2) {
        touchPinch = false;
        d0 = 0;
        commit();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("gesturestart", gStart as EventListener);
    el.addEventListener("gesturechange", gChange as EventListener);
    el.addEventListener("gestureend", gEnd as EventListener);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("gesturestart", gStart as EventListener);
      el.removeEventListener("gesturechange", gChange as EventListener);
      el.removeEventListener("gestureend", gEnd as EventListener);
      clearTimeout(timer);
      window.clearTimeout(animationTimer);
      window.clearTimeout(tapTimer);
      if (raf) cancelAnimationFrame(raf);
      api.current = null;
    };
  }, [min, max, scrollRef, contentRef, disabled, clearStyles]);

  return useCallback((n: number, o?: ZoomOpts) => api.current?.(n, o), []); // zoomTo
}
