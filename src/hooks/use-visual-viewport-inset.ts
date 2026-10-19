"use client";

import { useEffect, useState } from "react";
import { computeKeyboardInset } from "@/lib/belge-inline-mobile";

export type VisualViewportMetrics = { keyboardInset: number; viewportHeight: number };

/** Klavye boşluğunu ve görünür viewport yüksekliğini izler (iOS Safari + Android Chrome). */
export function useVisualViewportInset(enabled: boolean): VisualViewportMetrics {
  const [metrics, setMetrics] = useState<VisualViewportMetrics>({ keyboardInset: 0, viewportHeight: 0 });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const vv = window.visualViewport;
    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = vv?.height ?? window.innerHeight;
        const keyboardInset = computeKeyboardInset({
          innerHeight: window.innerHeight,
          viewportHeight: height,
          viewportOffsetTop: vv?.offsetTop ?? 0,
          viewportScale: vv?.scale ?? 1,
        });
        const viewportHeight = Math.round(height);
        setMetrics((prev) =>
          prev.keyboardInset === keyboardInset && prev.viewportHeight === viewportHeight
            ? prev
            : { keyboardInset, viewportHeight }
        );
      });
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return metrics;
}
