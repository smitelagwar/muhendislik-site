// ASSUMPTION: useZoomGestures hook implements hardware-accelerated CSS transform scaling during wheel, trackpad pinch, and mobile multi-touch pinch, committing React state only once when the gesture completes.

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export interface ZoomGestureOptions {
  scale: number;
  min: number;
  max: number;
  onCommit: (next: number) => void;
  disabled?: boolean;
}

interface LiveGestureState {
  r: number;
  active: boolean;
  cx: number;
  cy: number;
  ox: number;
  oy: number;
}

export function useZoomGestures(
  scrollRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  { scale, min, max, onCommit, disabled = false }: ZoomGestureOptions
) {
  const live = useRef<LiveGestureState>({ r: 1, active: false, cx: 0, cy: 0, ox: 0, oy: 0 });
  const pending = useRef<{ k: number; cx: number; cy: number; ox: number; oy: number } | null>(null);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Commit sonrası: transform'u kaldır + odak noktasını koru (boyamadan önce, aynı frame)
  useLayoutEffect(() => {
    const p = pending.current;
    const s = scrollRef.current;
    const c = contentRef.current;
    if (!p || !s || !c) return;

    c.style.transform = "";
    c.style.transformOrigin = "";
    c.style.willChange = "";
    s.scrollLeft = p.cx * p.k - p.ox;
    s.scrollTop = p.cy * p.k - p.oy;
    pending.current = null;
    live.current = { ...live.current, r: 1, active: false };
  }, [scale, scrollRef, contentRef]);

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || disabled) return;

    let raf = 0;
    let timer = 0;
    let d0 = 0;
    let r0 = 1;

    const clampR = (r: number) =>
      Math.min(max / scaleRef.current, Math.max(min / scaleRef.current, r));

    const begin = (clientX: number, clientY: number) => {
      const l = live.current;
      if (l.active) return;
      const rect = el.getBoundingClientRect();
      l.ox = clientX - rect.left;
      l.oy = clientY - rect.top;
      l.cx = el.scrollLeft + l.ox;
      l.cy = el.scrollTop + l.oy;
      l.active = true;
    };

    const paint = () => {
      raf = 0;
      const { r, cx, cy } = live.current;
      content.style.transformOrigin = `${cx - content.offsetLeft}px ${cy - content.offsetTop}px`;
      content.style.transform = `scale(${r})`;
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
        // Değişim yok: sadece temizle
        content.style.transform = "";
        content.style.transformOrigin = "";
        content.style.willChange = "";
        live.current = { ...l, r: 1, active: false };
        return;
      }
      pending.current = { k: next / scaleRef.current, cx: l.cx, cy: l.cy, ox: l.ox, oy: l.oy };
      onCommitRef.current(next);
    };

    // --- Masaüstü: ctrl/cmd + wheel ve trackpad pinch (ctrlKey=true gelir) ---
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      begin(e.clientX, e.clientY);
      // ASSUMPTION: Normalize wheel delta to handle both trackpad pinch and notched mouse wheel smoothly
      const delta = Math.min(Math.max(e.deltaY, -100), 100);
      live.current.r = clampR(live.current.r * Math.exp(-delta * 0.005));
      schedule();
      clearTimeout(timer);
      timer = window.setTimeout(commit, 180);
    };

    // --- Mobil: iki parmak pinch ---
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      d0 = dist(e.touches);
      begin(
        (e.touches[0].clientX + e.touches[1].clientX) / 2,
        (e.touches[0].clientY + e.touches[1].clientY) / 2
      );
      r0 = live.current.r;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !d0) return;
      e.preventDefault(); // non-passive olmalı
      live.current.r = clampR(r0 * (dist(e.touches) / d0));
      schedule();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (d0 && e.touches.length < 2) {
        d0 = 0;
        commit();
      }
    };

    // iOS Safari'nin kendi gesture zoom'unu engelle
    const block = (e: Event) => e.preventDefault();

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    (["gesturestart", "gesturechange", "gestureend"] as const).forEach((t) =>
      el.addEventListener(t, block)
    );

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      (["gesturestart", "gesturechange", "gestureend"] as const).forEach((t) =>
        el.removeEventListener(t, block)
      );
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [min, max, scrollRef, contentRef, disabled]);
}
