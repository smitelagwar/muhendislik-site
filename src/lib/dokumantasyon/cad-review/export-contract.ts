import type { CadReviewItem } from "./schema";
import type { CadLengthUnit } from "./units";

export interface CadExportFilters {
  includeMeasurements?: boolean;
  includeComments?: boolean;
  includeShapes?: boolean;
  includeSketches?: boolean;
  /** @deprecated Legacy alias for includeShapes and text/callout grouping. */
  includeMarkup?: boolean;
  includeResolved?: boolean;
  activeLayoutId?: string | null;
}

export const DEFAULT_CAD_EXPORT_FILTERS = Object.freeze({
  includeMeasurements: true,
  includeComments: true,
  includeShapes: true,
  includeSketches: true,
  includeResolved: true,
});

export type CadReviewDxfSourceUnit = CadLengthUnit | "unitless";

export function filterReviewItems(
  items: readonly CadReviewItem[],
  filters?: CadExportFilters
): CadReviewItem[] {
  if (!filters) return [...items];

  const includeMeasurements = filters.includeMeasurements ?? true;
  const includeComments = filters.includeComments ?? true;
  const includeShapes = filters.includeShapes ?? filters.includeMarkup ?? true;
  const includeSketches = filters.includeSketches ?? true;
  const includeResolved = filters.includeResolved ?? true;
  const activeLayoutId = filters.activeLayoutId;
  const useLegacyMarkupGrouping = filters.includeShapes === undefined && filters.includeMarkup !== undefined;
  const includeTextualMarkup = useLegacyMarkupGrouping
    ? includeComments && (filters.includeMarkup ?? true)
    : includeComments;

  return items.filter((item) => {
    if (activeLayoutId && item.layoutId && item.layoutId !== activeLayoutId) {
      return false;
    }

    if (!includeResolved && item.status === "closed") {
      return false;
    }

    switch (item.type) {
      case "distance":
      case "chain_distance":
      case "area":
        return includeMeasurements;

      case "comment_pin":
        return includeComments;

      case "callout":
      case "text":
        return includeTextualMarkup;

      case "shape":
        return includeShapes;

      case "stroke":
        return includeSketches;

      default:
        return true;
    }
  });
}

export function cadExportBaseName(sourceFileName: string): string {
  const withoutExtension = sourceFileName.trim().replace(/\.[^/.]+$/, "");
  const safe = withoutExtension
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return safe || "cad";
}

export function reviewDxfFileName(sourceFileName: string): string {
  return `${cadExportBaseName(sourceFileName)}_review.dxf`;
}

export function reviewJsonFileName(sourceFileName: string): string {
  return `${cadExportBaseName(sourceFileName)}_review.json`;
}

export function viewportPngFileName(sourceFileName: string): string {
  return `${cadExportBaseName(sourceFileName)}_viewport.png`;
}

export function reviewPdfFileName(sourceFileName: string): string {
  return `${cadExportBaseName(sourceFileName)}_review.pdf`;
}

export function dxfInsunitsCodeForSourceUnit(unit: CadReviewDxfSourceUnit): 0 | 4 | 5 | 6 {
  if (unit === "mm") return 4;
  if (unit === "cm") return 5;
  if (unit === "m") return 6;
  return 0;
}

export function normalizeReviewDxfInsunits(
  dxfText: string,
  sourceUnit: CadReviewDxfSourceUnit
): string {
  const nextCode = dxfInsunitsCodeForSourceUnit(sourceUnit);
  const pattern = /(\$INSUNITS\s*\r?\n\s*70\s*\r?\n\s*)-?\d+/;
  if (!pattern.test(dxfText)) {
    throw new Error("Review DXF HEADER içinde $INSUNITS bulunamadı.");
  }
  return dxfText.replace(pattern, `$1${nextCode}`);
}

/**
 * Lightweight structural guard for the review-only ASCII DXF produced by this app.
 * It is intentionally stricter than a filename/MIME check and catches malformed
 * group-code pairing before a browser download is triggered.
 */
export function assertReviewDxfStructure(dxfText: string): void {
  const normalized = dxfText.replace(/\r\n/g, "\n");
  const rawLines = normalized.split("\n");
  if (rawLines[rawLines.length - 1] === "") rawLines.pop();

  if (rawLines.length < 12 || rawLines.length % 2 !== 0) {
    throw new Error("Review DXF group-code satırları geçersiz.");
  }

  for (let index = 0; index < rawLines.length; index += 2) {
    if (!/^-?\d+$/.test(rawLines[index].trim())) {
      throw new Error(`Review DXF group code geçersiz: satır ${index + 1}.`);
    }
  }

  const values = rawLines.filter((_, index) => index % 2 === 1).map((value) => value.trim());
  const requiredValues = ["SECTION", "HEADER", "TABLES", "BLOCKS", "ENTITIES", "EOF"];
  for (const required of requiredValues) {
    if (!values.includes(required)) {
      throw new Error(`Review DXF bölümü eksik: ${required}.`);
    }
  }

  const insunitsIndex = values.indexOf("$INSUNITS");
  if (insunitsIndex < 0) {
    throw new Error("Review DXF $INSUNITS bilgisi eksik.");
  }
}
