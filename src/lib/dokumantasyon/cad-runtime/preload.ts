"use client";

// ============================================================================
// CAD RUNTIME PRELOAD & WARMING UTILITY
// Arka planda güvenli kod ön ısıtma (WebGL / manager / fetch başlatmaz)
// ============================================================================

let cadCodePreloadPromise: Promise<unknown> | null = null;
let lastScrollTimestamp = 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      lastScrollTimestamp = Date.now();
    },
    { passive: true }
  );
}

export function isActivelyScrolling(): boolean {
  if (typeof window === "undefined") return false;
  return Date.now() - lastScrollTimestamp < 400;
}

export function shouldAllowCadPreload(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (document.visibilityState === "hidden") return false;

  const nav = navigator as unknown as {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

  if (nav.connection?.saveData) return false;
  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return false;

  return true;
}

export function preloadCadCode(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!shouldAllowCadPreload()) return Promise.resolve();

  if (!cadCodePreloadPromise) {
    cadCodePreloadPromise = Promise.all([
      // 1. Host chunk: cad-runtime-orchestrator
      import("@/components/dokumantasyon/preview/file-preview-shell")
        .then((m) => m.loadCadRuntimeModule?.())
        .catch(() => null),
      // 2. Raw MLightCAD viewer code: @mlightcad/cad-simple-viewer (NO engine initialization)
      import("@/lib/dokumantasyon/cad-upstream/adapter")
        .then((m) => m.preloadCadViewerCode?.())
        .catch(() => null),
    ]).then((res) => {
      if (typeof window !== "undefined") {
        (window as unknown as { __CAD_CODE_PRELOADED__?: boolean }).__CAD_CODE_PRELOADED__ = true;
      }
      return res;
    });
  }

  return cadCodePreloadPromise;
}

export function triggerCadIntentPreload(extension?: string): void {
  if (!extension) return;
  const ext = extension.trim().toLowerCase();
  if (ext === ".dwg" || ext === ".dxf" || ext === "dwg" || ext === "dxf") {
    void preloadCadCode();
  }
}

export function scheduleIdleCadPreload(options?: { minDelayMs?: number }): () => void {
  if (!shouldAllowCadPreload()) return () => {};

  let cancelled = false;
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const executePreload = async () => {
    if (cancelled || !shouldAllowCadPreload()) return;
    if (isActivelyScrolling()) {
      timeoutId = window.setTimeout(executePreload, 500);
      return;
    }
    try {
      await preloadCadCode();
    } catch {
      // Preload hataları sessizce yutulur, ana akışı etkilemez
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    idleId = window.requestIdleCallback(
      () => {
        void executePreload();
      },
      { timeout: 4000 }
    );
  } else {
    timeoutId = window.setTimeout(executePreload, options?.minDelayMs ?? 1500);
  }

  return () => {
    cancelled = true;
    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
}
