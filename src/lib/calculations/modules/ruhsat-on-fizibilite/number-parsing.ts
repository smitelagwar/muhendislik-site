export const INTERNAL_DECIMAL_SCALE = 6;

export type LocalizedDecimalParseResult =
  | { state: "parsed"; value: number }
  | { state: "empty" }
  | { state: "invalid" };

const GROUPED_INTEGER_PATTERN = /^\d{1,3}(?:SEPARATOR\d{3})*$/;

function isValidGroupedInteger(value: string, separator: "." | ","): boolean {
  const pattern = new RegExp(GROUPED_INTEGER_PATTERN.source.replace("SEPARATOR", `\\${separator}`));
  return pattern.test(value);
}

export function roundToInternalPrecision(value: number): number {
  return Number(value.toFixed(INTERNAL_DECIMAL_SCALE));
}

export function compareAtInternalPrecision(left: number, right: number): -1 | 0 | 1 {
  const normalizedLeft = roundToInternalPrecision(left);
  const normalizedRight = roundToInternalPrecision(right);

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  return normalizedLeft < normalizedRight ? -1 : 1;
}

export function parseLocalizedDecimal(rawValue: unknown): LocalizedDecimalParseResult {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return { state: "empty" };
  }

  if (typeof rawValue !== "string") {
    return { state: "invalid" };
  }

  if (rawValue.trim() === "") {
    return { state: "empty" };
  }

  const compact = rawValue.replace(/[\s\u00a0\u202f]/g, "");
  if (!/^-?\d+(?:[.,]\d+)*$/.test(compact)) {
    return { state: "invalid" };
  }

  const sign = compact.startsWith("-") ? "-" : "";
  const unsigned = sign ? compact.slice(1) : compact;
  const hasComma = unsigned.includes(",");
  const hasPoint = unsigned.includes(".");
  let canonical: string;

  if (hasComma && hasPoint) {
    const decimalSeparator: "," | "." = unsigned.lastIndexOf(",") > unsigned.lastIndexOf(".") ? "," : ".";
    const groupingSeparator: "," | "." = decimalSeparator === "," ? "." : ",";
    const parts = unsigned.split(decimalSeparator);

    if (parts.length !== 2 || !parts[1] || !isValidGroupedInteger(parts[0], groupingSeparator)) {
      return { state: "invalid" };
    }

    canonical = `${sign}${parts[0].split(groupingSeparator).join("")}.${parts[1]}`;
  } else if (hasComma || hasPoint) {
    const decimalSeparator = hasComma ? "," : ".";
    const parts = unsigned.split(decimalSeparator);

    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return { state: "invalid" };
    }

    canonical = `${sign}${parts[0]}.${parts[1]}`;
  } else {
    canonical = compact;
  }

  const parsed = Number(canonical);
  if (!Number.isFinite(parsed)) {
    return { state: "invalid" };
  }

  return { state: "parsed", value: roundToInternalPrecision(parsed) };
}
