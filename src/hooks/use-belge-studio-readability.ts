"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
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

export function useBelgeStudioReadability() {
  const [settings, setSettings] = useState<BelgeReadabilitySettings>({ ...DEFAULT_BELGE_READABILITY });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const json = localStorage.getItem(BELGE_READABILITY_KEY);
      const loaded = json ? parseBelgeReadability(JSON.parse(json)) : null;
      if (loaded) setSettings(loaded);
    } catch {
      // Storage can be unavailable in private browsing; defaults remain usable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(BELGE_READABILITY_KEY, JSON.stringify({ version: 1, ...settings }));
    } catch {
      // Rendering must not depend on storage availability.
    }
  }, [settings, hydrated]);

  const update = useCallback((changes: Partial<BelgeReadabilitySettings>) => {
    setSettings((current) => sanitizeBelgeReadability({ ...current, ...changes }));
  }, []);
  const resetScale = useCallback(() => update({ uiScale: 100 }), [update]);
  const resetAll = useCallback(() => setSettings({ ...DEFAULT_BELGE_READABILITY }), []);

  const rootStyle = useMemo<ReadabilityRootStyle>(() => ({
    "--belge-ui-scale": settings.uiScale / 100,
    "--belge-text-scale": settings.textScale / 100,
    "--belge-target-scale": settings.largeTargets ? 1.18 : 1,
  }), [settings.uiScale, settings.textScale, settings.largeTargets]);

  return { settings, update, resetScale, resetAll, rootStyle };
}

export type BelgeReadabilityControls = ReturnType<typeof useBelgeStudioReadability>;
