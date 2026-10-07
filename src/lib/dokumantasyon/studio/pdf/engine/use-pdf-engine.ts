// ============================================================================
// PDF v4 MOTOR — REACT BAĞLAYICI KANCALARI (Plan 03 P3.3)
// ----------------------------------------------------------------------------
// useSyncExternalStore ile React'ın render döngüsünü kaydırmadan ayırır.
// Sayfalar yalnızca aralık (range) veya sayfa numarası değişince re-render olur.
// ============================================================================

import { useSyncExternalStore, useCallback } from "react";
import type { PdfEngine } from "./engine";
import type { Layout } from "./layout";

const DEFAULT_RANGE = { first: 1, last: 1 };

export function useEngineRange(engine: PdfEngine | null): { first: number; last: number } {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe("range", onStoreChange);
    },
    [engine]
  );

  const getSnapshot = useCallback(() => {
    return engine ? engine.getRange() : DEFAULT_RANGE;
  }, [engine]);

  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_RANGE);
}

export function useEngineCurrentPage(engine: PdfEngine | null): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe("page", onStoreChange);
    },
    [engine]
  );

  const getSnapshot = useCallback(() => {
    return engine ? engine.getCurrentPage() : 1;
  }, [engine]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 1);
}

export function useEngineScale(engine: PdfEngine | null): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe("scale", onStoreChange);
    },
    [engine]
  );

  const getSnapshot = useCallback(() => {
    return engine ? engine.getScale() : 1.0;
  }, [engine]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 1.0);
}

export function useEngineRenderScale(engine: PdfEngine | null): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe("scale", onStoreChange);
    },
    [engine]
  );

  const getSnapshot = useCallback(() => {
    return engine ? engine.getRenderScale() : 1.0;
  }, [engine]);

  return useSyncExternalStore(subscribe, getSnapshot, () => 1.0);
}

export function useEngineLayout(engine: PdfEngine | null): Layout | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe("layout", onStoreChange);
    },
    [engine]
  );

  const getSnapshot = useCallback(() => {
    return engine ? engine.getLayout() : null;
  }, [engine]);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
