"use client";

import { useCallback, useMemo, useSyncExternalStore, type CSSProperties } from "react";
import {
  BELGE_READABILITY_KEY, DEFAULT_BELGE_READABILITY,
  parseBelgeReadability, sanitizeBelgeReadability,
  type BelgeReadabilitySettings,
} from "@/lib/belge-studio-readability";

type ReadabilityRootStyle = CSSProperties & {
  "--belge-ui-scale": number;
  "--belge-text-scale": number;
  "--belge-target-scale": number;
};

const CHANGE_EVENT = "belge-readability:change";
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktopViewport(onChange: () => void): () => void {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function desktopViewportSnapshot(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}
// Storage-denied browsers still need a functioning in-memory preference.
let memoryValue: string | null = null;

function currentSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BELGE_READABILITY_KEY);
  } catch {
    return memoryValue;
  }
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === BELGE_READABILITY_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function writeSettings(next: BelgeReadabilitySettings): void {
  const value = JSON.stringify({ version: 1, ...sanitizeBelgeReadability(next) });
  memoryValue = value;
  try {
    localStorage.setItem(BELGE_READABILITY_KEY, value);
  } catch {
    // Memory fallback stays usable without storage.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useBelgeStudioReadability() {
  // useSyncExternalStore has a stable server snapshot; no hydration mismatch
  // and no synchronous setState in effects.
  const serialized = useSyncExternalStore(subscribe, currentSnapshot, () => null);
  // The custom readability feature is desktop-only. On tablets and phones, keep
  // the stored preference intact but render the studio with its original layout.
  const isDesktopViewport = useSyncExternalStore(
    subscribeDesktopViewport,
    desktopViewportSnapshot,
    () => true,
  );
  const storedSettings = useMemo<BelgeReadabilitySettings>(() => {
    if (!serialized) return { ...DEFAULT_BELGE_READABILITY };
    try {
      return parseBelgeReadability(JSON.parse(serialized)) ?? { ...DEFAULT_BELGE_READABILITY };
    } catch {
      return { ...DEFAULT_BELGE_READABILITY };
    }
  }, [serialized]);
  const settings = isDesktopViewport ? storedSettings : DEFAULT_BELGE_READABILITY;

  const update = useCallback((changes: Partial<BelgeReadabilitySettings>) => {
    writeSettings({ ...settings, ...changes });
  }, [settings]);

  const resetScale = useCallback(() => update({ uiScale: 100 }), [update]);
  const resetAll = useCallback(() => writeSettings({ ...DEFAULT_BELGE_READABILITY }), []);
  const rootStyle = useMemo<ReadabilityRootStyle>(() => ({
    "--belge-ui-scale": settings.uiScale / 100,
    "--belge-text-scale": settings.textScale / 100,
    "--belge-target-scale": settings.largeTargets ? 1.18 : 1,
  }), [settings.uiScale, settings.textScale, settings.largeTargets]);

  return { settings, update, resetScale, resetAll, rootStyle, isDesktopViewport };
}

export type BelgeReadabilityControls = ReturnType<typeof useBelgeStudioReadability>;
