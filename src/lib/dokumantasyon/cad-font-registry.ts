import rawManifest from "./cad-font-manifest.json";

export type CadFontType = "shx" | "mesh";

export type CadFontRegistryItem = {
  file: string;
  type: CadFontType;
  names: string[];
  encoding?: string;
  exact: boolean;
  licenseId: string;
  sourceNote: string;
};

export interface CadFontParityEvaluation {
  fontParityExact: boolean;
  requestedFonts: string[];
  resolvedExactFonts: string[];
  fallbackFonts: string[];
  missingFonts: string[];
}

export const CAD_FONT_REGISTRY: readonly CadFontRegistryItem[] = rawManifest as CadFontRegistryItem[];

// Hızlı arama için alias -> registry item haritası
const ALIAS_MAP = new Map<string, CadFontRegistryItem>();

for (const item of CAD_FONT_REGISTRY) {
  for (const name of item.names) {
    const normalized = name.trim().toLowerCase();
    ALIAS_MAP.set(normalized, item);
  }
}

/**
 * Belirtilen font adını onaylı CAD registry içinden arar.
 */
export function resolveCadFont(name: string): CadFontRegistryItem | null {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  return ALIAS_MAP.get(normalized) ?? null;
}

/**
 * Belirtilen fontun exact CAD asset olarak mevcut olup olmadığını döndürür.
 */
export function isCadFontExact(name: string): boolean {
  const item = resolveCadFont(name);
  return item !== null && item.exact === true;
}

/**
 * Çizimde talep edilen font listesi için AutoCAD parite durumunu değerlendirir.
 */
export function evaluateCadFontParity(requestedFonts: readonly string[]): CadFontParityEvaluation {
  const requested = Array.from(new Set(requestedFonts.map((f) => f.trim()).filter(Boolean)));
  const resolvedExact: string[] = [];
  const fallback: string[] = [];
  const missing: string[] = [];

  for (const fontName of requested) {
    const item = resolveCadFont(fontName);
    if (item && item.exact) {
      resolvedExact.push(fontName);
    } else if (item && !item.exact) {
      fallback.push(fontName);
    } else {
      missing.push(fontName);
    }
  }

  return {
    fontParityExact: missing.length === 0 && fallback.length === 0,
    requestedFonts: requested,
    resolvedExactFonts: resolvedExact,
    fallbackFonts: fallback,
    missingFonts: missing,
  };
}
