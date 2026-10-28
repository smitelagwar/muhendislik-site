"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "belge_studio_form_panel_width";
const BASE_WIDTH = 420;
const MIN_WIDTH = 340;
const DESKTOP_QUERY = "(min-width: 1024px)";

export interface BelgeStudioResizerApi {
  panelWidth: number;
  derivedZoom: number;
  isDragging: boolean;
  isDesktop: boolean;
  resetWidth: () => void;
  resizerProps: {
    role: "separator";
    tabIndex: number;
    "aria-orientation": "vertical";
    "aria-valuenow": number;
    "aria-valuemin": number;
    "aria-valuemax": number;
    "aria-label": string;
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onDoubleClick: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  };
}

export function useBelgeStudioResizer(): BelgeStudioResizerApi {
  const [panelWidth, setPanelWidth] = useState<number>(BASE_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Sürükleme başlangıç değerleri
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Masaüstü ekran durumunu izle
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Kayıtlı genişliği oku
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const val = Number(saved);
        if (!Number.isNaN(val) && val >= MIN_WIDTH) {
          setPanelWidth(val);
        }
      }
    } catch {
      // localStorage erişim engelli olabilir
    }
  }, []);

  const getMaxWidth = useCallback(() => {
    if (typeof window === "undefined") return 760;
    // Ekranın en fazla %55'i veya 760px
    return Math.max(MIN_WIDTH + 100, Math.min(Math.round(window.innerWidth * 0.55), 760));
  }, []);

  const derivedZoom = useMemo(() => {
    // 420px iken 1.00 zoom; panel genişledikçe sanki tarayıcıda büyütmüş gibi form alanları orantılı büyür
    const zoom = panelWidth / BASE_WIDTH;
    return Math.min(1.65, Math.max(0.85, Number(zoom.toFixed(2))));
  }, [panelWidth]);

  const resetWidth = useCallback(() => {
    setPanelWidth(BASE_WIDTH);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Pointer olayları ile sürükleme
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Yalnızca sol tık
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startWidth: panelWidth,
    };

    // Global cursor ve text selection engelle
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = moveEvt.clientX - dragStartRef.current.startX;
      const maxW = getMaxWidth();
      const nextWidth = Math.min(maxW, Math.max(MIN_WIDTH, dragStartRef.current.startWidth + deltaX));
      setPanelWidth(nextWidth);
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      target.releasePointerCapture(upEvt.pointerId);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);

      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (dragStartRef.current) {
        const deltaX = upEvt.clientX - dragStartRef.current.startX;
        const maxW = getMaxWidth();
        const finalWidth = Math.min(maxW, Math.max(MIN_WIDTH, dragStartRef.current.startWidth + deltaX));
        try {
          localStorage.setItem(STORAGE_KEY, String(finalWidth));
        } catch {
          // ignore
        }
      }
      dragStartRef.current = null;
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onPointerUp);
  }, [panelWidth, getMaxWidth]);

  // Klavye erişilebilirliği
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 40 : 10;
    const maxW = getMaxWidth();

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPanelWidth((prev) => {
        const next = Math.max(MIN_WIDTH, prev - step);
        try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
        return next;
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPanelWidth((prev) => {
        const next = Math.min(maxW, prev + step);
        try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
        return next;
      });
    } else if (e.key === "Home") {
      e.preventDefault();
      setPanelWidth(MIN_WIDTH);
      try { localStorage.setItem(STORAGE_KEY, String(MIN_WIDTH)); } catch { /* ignore */ }
    } else if (e.key === "End") {
      e.preventDefault();
      setPanelWidth(maxW);
      try { localStorage.setItem(STORAGE_KEY, String(maxW)); } catch { /* ignore */ }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      resetWidth();
    }
  }, [getMaxWidth, resetWidth]);

  return {
    panelWidth,
    derivedZoom,
    isDragging,
    isDesktop,
    resetWidth,
    resizerProps: {
      role: "separator",
      tabIndex: 0,
      "aria-orientation": "vertical",
      "aria-valuenow": Math.round(panelWidth),
      "aria-valuemin": MIN_WIDTH,
      "aria-valuemax": getMaxWidth(),
      "aria-label": "Form paneli genişlik ayırıcısı",
      onPointerDown,
      onDoubleClick: resetWidth,
      onKeyDown,
    },
  };
}
