import type { CadSnapMode } from "./snap-engine";

export type { CadSnapMode } from "./snap-engine";

export const CAD_SNAP_SETTINGS_STORAGE_KEY = "muhendislik-site:cad-snap-settings:v1";

export const CAD_SNAP_MODES = [
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "nearest",
] as const satisfies readonly CadSnapMode[];

export interface CadSnapSettings {
  enabled: boolean;
  modes: Record<CadSnapMode, boolean>;
}

export interface CadSnapSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultCadSnapSettings(): CadSnapSettings {
  return {
    enabled: true,
    modes: {
      endpoint: true,
      midpoint: true,
      intersection: true,
      center: true,
      nearest: true,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeCadSnapSettings(value: unknown): CadSnapSettings {
  const defaults = createDefaultCadSnapSettings();
  if (!isRecord(value)) return defaults;

  const rawModes = isRecord(value.modes) ? value.modes : {};
  const modes = { ...defaults.modes };
  for (const mode of CAD_SNAP_MODES) {
    if (typeof rawModes[mode] === "boolean") {
      modes[mode] = rawModes[mode];
    }
  }

  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : defaults.enabled,
    modes,
  };
}

export function loadCadSnapSettings(
  storage: CadSnapSettingsStorage | null | undefined
): CadSnapSettings {
  if (!storage) return createDefaultCadSnapSettings();

  try {
    const raw = storage.getItem(CAD_SNAP_SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultCadSnapSettings();
    return normalizeCadSnapSettings(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultCadSnapSettings();
  }
}

export function saveCadSnapSettings(
  storage: CadSnapSettingsStorage | null | undefined,
  settings: CadSnapSettings
): boolean {
  if (!storage) return false;

  try {
    storage.setItem(
      CAD_SNAP_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizeCadSnapSettings(settings))
    );
    return true;
  } catch {
    return false;
  }
}

export function setCadSnapEnabled(
  settings: CadSnapSettings,
  enabled: boolean
): CadSnapSettings {
  return {
    enabled,
    modes: { ...settings.modes },
  };
}

export function setCadSnapMode(
  settings: CadSnapSettings,
  mode: CadSnapMode,
  enabled: boolean
): CadSnapSettings {
  return {
    enabled: settings.enabled,
    modes: {
      ...settings.modes,
      [mode]: enabled,
    },
  };
}

export function getEnabledCadSnapModes(settings: CadSnapSettings): Set<CadSnapMode> {
  if (!settings.enabled) return new Set<CadSnapMode>();
  return new Set(CAD_SNAP_MODES.filter((mode) => settings.modes[mode]));
}
