"use client";

import { useSyncExternalStore } from "react";

// Stüdyonun lg kırılımıyla aynı: bu genişliğin altında sekmeli mobil düzen kullanılır.
const MOBILE_QUERY = "(max-width: 1023px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(MOBILE_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** PDF üzerinde düzenlemede alt sayfa editörünün kullanılacağı mobil mod. */
export function useBelgeInlineMobileMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
