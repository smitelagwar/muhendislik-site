// dxf-viewer ships the canonical AutoCAD ACI palette but does not publish TypeScript declarations
// for its parser internals. Reuse the exact palette used by the renderer instead of maintaining a
// second, potentially divergent table in the application.
// @ts-expect-error dxf-viewer internal module has no declaration file
import AUTO_CAD_COLOR_INDEX from "dxf-viewer/src/parser/AutoCadColorIndex.js";

const DIMENSION_COLOR_KEYS = ["DIMCLRD", "DIMCLRE", "DIMCLRT"] as const;
const DIMENSION_COLOR_CODES = new Set([176, 177, 178]);
const NORMALIZED_MARKER = Symbol.for("muhendislik-site.dxf-dimension-colors-normalized");

type DimensionColorKey = (typeof DIMENSION_COLOR_KEYS)[number];
type DxfXdataValue = { code?: number; value?: unknown };
type DxfDimensionEntity = {
  type?: string;
  xdata?: {
    ACAD?: {
      DSTYLE?: {
        values?: DxfXdataValue[];
      };
    };
  };
};
type DxfDimStyle = Record<string, unknown>;
type DxfDimensionColorParsedDxf = {
  entities?: DxfDimensionEntity[];
  blocks?: Record<string, { entities?: DxfDimensionEntity[] }>;
  tables?: {
    dimstyle?: {
      dimStyles?: Record<string, DxfDimStyle>;
    };
  };
  [NORMALIZED_MARKER]?: true;
};

export type DxfDimensionColorNormalizationReport = {
  styleColorCount: number;
  overrideColorCount: number;
  inheritedColorCount: number;
  invalidColorCount: number;
};

type NormalizedColor = {
  value: unknown;
  changed: boolean;
  inherited: boolean;
  invalid: boolean;
};

/**
 * dxf-viewer parses DIMCLRD/DIMCLRE/DIMCLRT as raw ACI indices but later feeds those numbers
 * directly to Three.js as 24-bit RGB values. That turns ACI 2 (yellow) into RGB 0x000002.
 *
 * Convert only explicit ACI 1..255 values to the exact RGB palette used by dxf-viewer's entity
 * parser. AutoCAD inheritance sentinels 0 (BYBLOCK) and 256 (BYLAYER) become null so the existing
 * dimension decomposition path falls back to the entity/layer/block color it has already resolved.
 * Values outside the documented ACI range are left untouched and reported as invalid rather than
 * guessed. This operates only on the worker-owned parsed representation.
 */
export function normalizeDxfDimensionAciColor(value: unknown): NormalizedColor {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { value, changed: false, inherited: false, invalid: value != null };
  }

  if (value === 0 || value === 256) {
    return { value: null, changed: true, inherited: true, invalid: false };
  }

  if (value >= 1 && value <= 255) {
    const rgb = AUTO_CAD_COLOR_INDEX[value];
    if (typeof rgb === "number" && Number.isFinite(rgb)) {
      return { value: rgb, changed: rgb !== value, inherited: false, invalid: false };
    }
  }

  return { value, changed: false, inherited: false, invalid: true };
}

function normalizeStyleColor(
  style: DxfDimStyle,
  key: DimensionColorKey,
  report: DxfDimensionColorNormalizationReport
) {
  if (!Object.prototype.hasOwnProperty.call(style, key)) return;
  const normalized = normalizeDxfDimensionAciColor(style[key]);
  if (normalized.invalid) report.invalidColorCount += 1;
  if (normalized.inherited) report.inheritedColorCount += 1;
  if (normalized.changed) {
    style[key] = normalized.value;
    report.styleColorCount += 1;
  }
}

function normalizeEntityOverrides(
  entity: DxfDimensionEntity,
  report: DxfDimensionColorNormalizationReport
) {
  if (entity.type?.toUpperCase() !== "DIMENSION") return;
  const values = entity.xdata?.ACAD?.DSTYLE?.values;
  if (!Array.isArray(values)) return;

  // dxf-viewer's resolver consumes ACAD/DSTYLE values as alternating 1070 variable-code/value
  // records. Preserve that structure and rewrite only the value paired with 176/177/178.
  for (let index = 0; index + 1 < values.length; index += 2) {
    const variable = values[index];
    const payload = values[index + 1];
    if (variable?.code !== 1070 || !DIMENSION_COLOR_CODES.has(Number(variable.value))) continue;

    const normalized = normalizeDxfDimensionAciColor(payload?.value);
    if (normalized.invalid) report.invalidColorCount += 1;
    if (normalized.inherited) report.inheritedColorCount += 1;
    if (normalized.changed && payload) {
      payload.value = normalized.value;
      report.overrideColorCount += 1;
    }
  }
}

export function normalizeParsedDxfDimensionColors(
  input: unknown
): DxfDimensionColorNormalizationReport {
  const dxf = input as DxfDimensionColorParsedDxf;
  const report: DxfDimensionColorNormalizationReport = {
    styleColorCount: 0,
    overrideColorCount: 0,
    inheritedColorCount: 0,
    invalidColorCount: 0,
  };

  if (!dxf || typeof dxf !== "object" || dxf[NORMALIZED_MARKER]) return report;

  for (const style of Object.values(dxf.tables?.dimstyle?.dimStyles ?? {})) {
    for (const key of DIMENSION_COLOR_KEYS) normalizeStyleColor(style, key, report);
  }

  for (const entity of dxf.entities ?? []) normalizeEntityOverrides(entity, report);
  for (const block of Object.values(dxf.blocks ?? {})) {
    for (const entity of block.entities ?? []) normalizeEntityOverrides(entity, report);
  }

  Object.defineProperty(dxf, NORMALIZED_MARKER, {
    value: true,
    enumerable: false,
    configurable: false,
  });

  return report;
}
