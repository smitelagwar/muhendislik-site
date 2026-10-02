// ASSUMPTION: useZoomGestures v2 implements page-space anchor tracking (Anchor { el, fx, fy }), wheel delta normalization, macOS Safari gesture events, e.cancelable verification, data-zooming attribute, and viewport-centered zoomTo API.

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

type Anchor = { el: HTMLElement; fx: number; fy: number };

type Live = {
  r: number;
  active: boolean;
  ox: number;           // odak noktası, scroll konteynerine göre (px)
  oy: number;
  originX: number;      // transform-origin, content'e göre (px)
  originY: number;
  anchor: Anchor | null;
};

export interface ZoomGestureOptions {
  scale: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
  disabled?: boolean;
}

const EMPTY: Live = { r: 1, active: false, ox: 0, oy: 0, originX: 0, originY: 0, anchor: null };

export function useZoomGestures(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  { scale, min, max, onCommit, disabled = false }: ZoomGestureOptions
) {
  const live = useRef<Live>({ ...EMPTY });
  const pending = useRef<Live | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const commitCb = useRef(onCommit);
  commitCb.current = onCommit;
  const api = useRef<((n: number) => void) | null>(null);

  const clearStyles = () => {
    const c = contentRef.current;
    const s = scrollRef.current;
    if (c) {
      c.style.transform = "";
      c.style.transformOrigin = "";
      c.style.willChange = "";
    }
    s?.removeAttribute("data-zooming");
  };

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
  }, [scale, scrollRef, contentRef]);

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || disabled) return;

    let raf = 0;
    let timer = 0;
    let d0 = 0;
    let r0 = 1;
    let g0 = 1;
    const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

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
      const next = Math.round(Math.min(max, Math.max(min, scaleRef.current * l.r)) * 100) / 100;
      if (next === scaleRef.current) {
        clearStyles();
        live.current = { ...EMPTY };
        return;
      }
      pending.current = { ...l };
      commitCb.current(next);
    };

    // Toolbar butonları için: viewport merkezine göre zoom
    api.current = (n: number) => {
      const rect = el.getBoundingClientRect();
      begin(rect.left + rect.width / 2, rect.top + rect.height / 2);
      live.current.r = clampR(n / scaleRef.current);
      commit();
    };

    // --- Masaüstü: ctrl/cmd + tekerlek, Chrome/Firefox trackpad pinch (ctrlKey=true) ---
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (pending.current) return;
      begin(e.clientX, e.clientY);
      const raw = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const dy = Math.max(-30, Math.min(30, raw)); // mouse çentiği fırlamasın
      live.current.r = clampR(live.current.r * Math.exp(-dy * 0.01));
      schedule();
      clearTimeout(timer);
      timer = window.setTimeout(commit, 180);
    };

    // --- Safari masaüstü trackpad pinch (gesture olayları). Dokunmatik cihazda touch kullanılır ---
    const gStart = (e: any) => {
      e.preventDefault();
      if (isTouchDevice || pending.current) return;
      begin(e.clientX, e.clientY);
      g0 = live.current.r;
    };
    const gChange = (e: any) => {
      e.preventDefault();
      if (isTouchDevice || !live.current.active) return;
      live.current.r = clampR(g0 * e.scale);
      schedule();
    };
    const gEnd = (e: any) => {
      e.preventDefault();
      if (!isTouchDevice) commit();
    };

    // --- Mobil: iki parmak pinch ---
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pending.current) return;
      d0 = dist(e.touches);
      begin(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2
      );
      r0 = live.current.r;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !d0) return;
      if (e.cancelable) e.preventDefault();
      live.current.r = clampR(r0 * (dist(e.touches) / d0));
      schedule();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (d0 && e.touches.length < 2) {
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
      if (raf) cancelAnimationFrame(raf);
      api.current = null;
    };
  }, [min, max, scrollRef, contentRef, disabled]);

  return useCallback((n: number) => api.current?.(n), []); // zoomTo
}
