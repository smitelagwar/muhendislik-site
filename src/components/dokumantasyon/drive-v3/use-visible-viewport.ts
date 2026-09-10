"use client";
import { useEffect, useState } from "react";
/** Klavye daralmasını izler; pinch zoom'u değiştirmez. */
export function useVisibleViewport(enabled: boolean) {
  const [rect, setRect] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    if (!enabled || !window.visualViewport) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (Math.abs(viewport.scale - 1) > .05) return;
        setRect({ height: viewport.height, top: viewport.offsetTop });
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { cancelAnimationFrame(frame); viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, [enabled]);
  return enabled ? rect : null;
}
