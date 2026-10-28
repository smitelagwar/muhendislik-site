export const BELGE_READABILITY_KEY = "belge-studio:readability:v1";
export const UI_SCALE_MIN = 90;
export const UI_SCALE_MAX = 200;
export const UI_SCALE_STEP = 5;
export const TEXT_SCALE_MIN = 90;
export const TEXT_SCALE_MAX = 200;
export const TEXT_SCALE_STEP = 10;
export const UI_SCALE_PRESETS = [90, 100, 115, 125, 150, 175, 200] as const;
export const TEXT_SCALE_PRESETS = [90, 100, 110, 120, 140] as const;

export type BelgeReadabilitySettings = {
  uiScale: number;
  textScale: number;
  highContrast: boolean;
  comfortableReading: boolean;
  largeTargets: boolean;
};

export const DEFAULT_BELGE_READABILITY: Readonly<BelgeReadabilitySettings> = {
  uiScale: 100,
  textScale: 100,
  highContrast: false,
  comfortableReading: false,
  largeTargets: false,
};

export function normalizeScale(value: unknown, min: number, max: number, step: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value / step) * step));
}

/** Never trust persisted preferences; reject document content and arbitrary keys. */
export function parseBelgeReadability(value: unknown): BelgeReadabilitySettings | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.version !== 1) return null;
  return {
    uiScale: normalizeScale(source.uiScale, UI_SCALE_MIN, UI_SCALE_MAX, UI_SCALE_STEP, 100),
    textScale: normalizeScale(source.textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_STEP, 100),
    highContrast: source.highContrast === true,
    comfortableReading: source.comfortableReading === true,
    largeTargets: source.largeTargets === true,
  };
}

export function sanitizeBelgeReadability(value: Partial<BelgeReadabilitySettings>): BelgeReadabilitySettings {
  return {
    uiScale: normalizeScale(value.uiScale, UI_SCALE_MIN, UI_SCALE_MAX, UI_SCALE_STEP, 100),
    textScale: normalizeScale(value.textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX, TEXT_SCALE_STEP, 100),
    highContrast: value.highContrast === true,
    comfortableReading: value.comfortableReading === true,
    largeTargets: value.largeTargets === true,
  };
}
