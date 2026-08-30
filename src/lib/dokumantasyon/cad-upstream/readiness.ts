"use client";

export interface CadRenderReadinessSnapshot {
  timestamp: string;
  isReady: boolean;
  isIdle: boolean;
  activeLayoutId: string | null;
  entityCount: number;
  hasFiniteBounds: boolean;
  bounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  } | null;
  viewport: {
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
  };
  cameraValid: boolean;
  webglContextLost: boolean;
}

export interface CadResilienceState {
  isContextLost: boolean;
  contextRestoredCount: number;
  zeroSizeRecoveredCount: number;
  lastError: string | null;
}
