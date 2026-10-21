import type { CadTextStyle } from "../canonical/types";

export type TextStyleTable = Record<string, CadTextStyle>;

/** Maps decoded DXF/DWG STYLE records without inferring missing font extensions. */
export function mapTextStyleRecords(records: unknown[]): TextStyleTable {
  const styles: TextStyleTable = {};

  for (const value of records) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const rawName = typeof record.name === "string" ? record.name.trim() : "";
    const rawHandle = record.objectHandle ?? record.handle ?? record.objectId;
    const objectHandle = typeof rawHandle === "string" && rawHandle.trim()
      ? rawHandle.trim().replace(/^0x/i, "").toUpperCase()
      : undefined;
    if (!rawName && !objectHandle) continue;

    const standardFlag = finite(record.standardFlag ?? record.flags) ?? 0;
    const fontFileName = stringValue(record.fontFileName)
      ?? stringValue(record.fileName)
      ?? stringValue(record.font)
      ?? stringValue(record.extendedFont)
      ?? "";
    const bigFontFileName = stringValue(record.bigFontFileName) ?? stringValue(record.bigFont);
    const obliqueAngleDeg = finite(record.obliqueAngleDeg)
      ?? radiansToDegrees(finite(record.obliqueAngle));
    const id = rawName || `@${objectHandle}`;
    const style: CadTextStyle = {
      id,
      name: rawName,
      ...(objectHandle ? { objectHandle } : {}),
      fontFileName,
      ...(bigFontFileName !== undefined ? { bigFontFileName } : {}),
      isShapeFile: (standardFlag & 1) === 1,
      height: finite(record.height ?? record.fixedTextHeight ?? record.textSize) ?? 0,
      widthFactor: finite(record.widthFactor ?? record.xScale) ?? 1,
      obliqueAngleDeg: obliqueAngleDeg ?? 0,
      isVertical: typeof record.isVertical === "boolean"
        ? record.isVertical
        : (standardFlag & 4) === 4,
    };
    styles[id] = style;
  }

  return styles;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function radiansToDegrees(value: number | undefined): number | undefined {
  return value === undefined ? undefined : value * (180 / Math.PI);
}
