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
// Storage-denied browsers still need a functioning in-memory preference.
let memoryValue: string | null = null;

function currentSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(BELGE_READABILITY_KEY) ?? memoryValue;
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
  const settings = useMemo<BelgeReadabilitySettings>(() => {
    if (!serialized) return { ...DEFAULT_BELGE_READABILITY };
    try {
      return parseBelgeReadability(JSON.parse(serialized)) ?? { ...DEFAULT_BELGE_READABILITY };
    } catch {
      return { ...DEFAULT_BELGE_READABILITY };
    }
  }, [serialized]);

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

  return { settings, update, resetScale, resetAll, rootStyle };
}

export type BelgeReadabilityControls = ReturnType<typeof useBelgeStudioReadability>;
