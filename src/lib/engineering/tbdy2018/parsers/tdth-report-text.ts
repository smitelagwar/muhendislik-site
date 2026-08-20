import type { DesignSpectrumParameters, SoilClass } from "../types";

type SecondarySpectrumField = "fs" | "f1" | "sds" | "sd1" | "ta" | "tb" | "tl";

export interface ParsedTdthReport {
  ss?: number;
  s1?: number;
  earthquakeLevel?: "DD-1" | "DD-2" | "DD-3" | "DD-4";
  soilClass?: SoilClass;
  reportedSpectrum: Partial<Record<SecondarySpectrumField, number>>;
  warnings: string[];
}

export interface SpectrumCrossCheckMismatch {
  field: SecondarySpectrumField;
  reported: number;
  calculated: number;
}

function normalizeReportText(text: string): string {
  return text
    .replace(/[–—−]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ");
}

function extractNumber(text: string, labelPattern: string): number | undefined {
  const expression = new RegExp(`(?:^|[^A-Z0-9])${labelPattern}(?![A-Z0-9])\\s*(?:[:=]|-)?\\s*(\\d+(?:[.,]\\d+)?)`, "i");
  const match = text.match(expression);
  if (!match) return undefined;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

/** Client-side parser for text copied from an AFAD TDTH report. */
export function parseTdthReportText(rawText: string): ParsedTdthReport {
  const text = normalizeReportText(rawText);
  const earthquakeMatch = text.match(/\bDD\s*-?\s*([1-4])\b/i);
  const soilMatch = text.match(/(?:yerel\s+)?zemin\s+s[ıi]n[ıi]f[ıi]\s*(?:[:=]|-)?\s*(Z[ABCDEF])\b/i);

  const ss = extractNumber(text, "S[\\s_]*S");
  const s1 = extractNumber(text, "S[\\s_]*1");
  const earthquakeLevel = earthquakeMatch ? (`DD-${earthquakeMatch[1]}` as ParsedTdthReport["earthquakeLevel"]) : undefined;
  const soilClass = soilMatch?.[1].toUpperCase() as SoilClass | undefined;
  const warnings: string[] = [];
  if (ss === undefined) warnings.push("Ss rapor metninde bulunamadı.");
  if (s1 === undefined) warnings.push("S1 rapor metninde bulunamadı.");
  if (!earthquakeLevel) warnings.push("Deprem yer hareketi düzeyi rapor metninde bulunamadı.");
  if (!soilClass) warnings.push("Yerel zemin sınıfı rapor metninde bulunamadı.");

  return {
    ss,
    s1,
    earthquakeLevel,
    soilClass,
    reportedSpectrum: {
      fs: extractNumber(text, "F[\\s_]*S"),
      f1: extractNumber(text, "F[\\s_]*1"),
      sds: extractNumber(text, "S[\\s_]*D[\\s_]*S"),
      sd1: extractNumber(text, "S[\\s_]*D[\\s_]*1"),
      ta: extractNumber(text, "T[\\s_]*A"),
      tb: extractNumber(text, "T[\\s_]*B"),
      tl: extractNumber(text, "T[\\s_]*L"),
    },
    warnings,
  };
}

export function findSpectrumCrossCheckMismatches(
  reported: Partial<Record<SecondarySpectrumField, number>>,
  calculated: DesignSpectrumParameters,
  relativeTolerance = 0.03,
  absoluteTolerance = 0.015,
): SpectrumCrossCheckMismatch[] {
  const values: Record<SecondarySpectrumField, number> = {
    fs: calculated.fs,
    f1: calculated.f1,
    sds: calculated.sds,
    sd1: calculated.sd1,
    ta: calculated.ta,
    tb: calculated.tb,
    tl: calculated.tl,
  };

  return (Object.keys(values) as SecondarySpectrumField[]).flatMap((field) => {
    const reportValue = reported[field];
    const calculatedValue = values[field];
    if (reportValue === undefined || !Number.isFinite(reportValue)) return [];
    const tolerance = Math.max(absoluteTolerance, Math.abs(calculatedValue) * relativeTolerance);
    return Math.abs(reportValue - calculatedValue) > tolerance
      ? [{ field, reported: reportValue, calculated: calculatedValue }]
      : [];
  });
}
