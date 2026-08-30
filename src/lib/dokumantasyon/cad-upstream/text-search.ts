import type { CadSnapPoint } from "./snap-engine";

export interface CadTextEntityInfo {
  id: string;
  handle: string;
  type: "TEXT" | "MTEXT" | "ATTRIB";
  text: string;
  normalizedText: string;
  layer: string;
  layout: string;
  anchor: CadSnapPoint;
  bounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
  rotationDeg: number;
}

export interface CadTextSearchQuery {
  query: string;
  layerFilter?: string[]; // if empty or undefined, all layers
  layoutFilter?: string; // if empty or undefined, all layouts
  region?: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  } | null;
  caseSensitive?: boolean;
}

export interface CadTextSearchResult {
  item: CadTextEntityInfo;
  matchScore: number;
}

// Turkish case normalization (İ -> i, I -> ı)
export function normalizeTurkishText(text: string): string {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase();
}

/**
 * Strips basic formatting from DXF MTEXT (braces, \P, formatting codes)
 * while preserving native text.
 */
export function cleanMText(raw: string): string {
  if (!raw) return "";
  let clean = raw;
  // Replace line breaks \P with spaces
  clean = clean.replace(/\\P/gi, " ");
  // Remove formatting braces { ... }
  clean = clean.replace(/\{([^}]+)\}/g, "$1");
  // Remove formatting control sequences like \A1;, \H1.5;, \W0.8;, \C1;
  clean = clean.replace(/\\[A-Z][^;]*;/gi, "");
  // Remove font tags \F...;
  clean = clean.replace(/\\F[^;]*;/gi, "");
  // Remove redundant whitespace
  return clean.replace(/\s+/g, " ").trim();
}

export function intersectsAabb(
  a: { min: { x: number; y: number }; max: { x: number; y: number } },
  b: { min: { x: number; y: number }; max: { x: number; y: number } }
): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y
  );
}

export class CadTextSearchIndex {
  private readonly items: CadTextEntityInfo[] = [];

  constructor(items: CadTextEntityInfo[] = []) {
    this.items = items;
  }

  get count(): number {
    return this.items.length;
  }

  getItems(): readonly CadTextEntityInfo[] {
    return this.items;
  }

  search(options: CadTextSearchQuery): CadTextSearchResult[] {
    const rawQuery = options.query.trim();
    if (!rawQuery) return [];

    const queryNorm = options.caseSensitive
      ? rawQuery
      : normalizeTurkishText(rawQuery);

    const layerSet = options.layerFilter && options.layerFilter.length > 0
      ? new Set(options.layerFilter)
      : null;

    const results: CadTextSearchResult[] = [];

    for (const item of this.items) {
      if (layerSet && !layerSet.has(item.layer)) continue;
      if (options.layoutFilter && item.layout !== options.layoutFilter) continue;

      if (options.region) {
        // Must intersect or anchor must be inside
        const intersects = intersectsAabb(item.bounds, options.region);
        const anchorInside =
          item.anchor.x >= options.region.min.x &&
          item.anchor.x <= options.region.max.x &&
          item.anchor.y >= options.region.min.y &&
          item.anchor.y <= options.region.max.y;

        if (!intersects && !anchorInside) {
          continue;
        }
      }

      const targetText = options.caseSensitive
        ? item.text
        : item.normalizedText;

      const idx = targetText.indexOf(queryNorm);
      if (idx !== -1) {
        // Exact match score
        const score = idx === 0 ? 100 : 50;
        results.push({ item, matchScore: score });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}