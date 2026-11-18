/** Input units only. No code limits or design formula are inferred here. */
export type PressureUnit = "kPa" | "MPa" | "tf/m2";
export type ForcePerVolumeUnit = "kN/m3" | "tf/m3";
const PRESSURE_TO_KPA: Record<PressureUnit, number> = { kPa: 1, MPa: 1000, "tf/m2": 9.80665 };

export function parseDecimal(input: string): number | null {
  const value = input.trim();
  if (!value) return null;
  // Grouping separators and mixed decimal punctuation are intentionally ambiguous.
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value)) throw new Error("Ondalık sayı girin; binlik ayırıcı kullanmayın.");
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) throw new Error("Sonlu sayı girin.");
  return parsed;
}

export function pressureToKPa(value: number, unit: PressureUnit): number {
  if (!Number.isFinite(value) || value < 0 || !Object.hasOwn(PRESSURE_TO_KPA, unit)) throw new Error("Geçersiz basınç veya birim.");
  const result = value * PRESSURE_TO_KPA[unit];
  if (!Number.isFinite(result)) throw new Error("Basınç birim dönüşümünde sayı sınırı aşıldı.");
  return result;
}

export function pressureFromKPa(value: number, unit: PressureUnit): number {
  if (!Number.isFinite(value) || value < 0 || !Object.hasOwn(PRESSURE_TO_KPA, unit)) throw new Error("Geçersiz basınç veya birim.");
  return value / PRESSURE_TO_KPA[unit];
}

export function forcePerVolumeToSI(value: number, unit: ForcePerVolumeUnit): number {
  if (!Number.isFinite(value) || value < 0 || !["kN/m3", "tf/m3"].includes(unit)) throw new Error("Geçersiz kuvvet/hacim girdisi.");
  const result = value * (unit === "tf/m3" ? 9.80665 : 1);
  if (!Number.isFinite(result)) throw new Error("Kuvvet/hacim dönüşümünde sayı sınırı aşıldı.");
  return result;
}
export function forcePerVolumeFromSI(value: number, unit: ForcePerVolumeUnit): number {
  forcePerVolumeToSI(0, unit);
  if (!Number.isFinite(value) || value < 0) throw new Error("Geçersiz kuvvet/hacim girdisi.");
  return value / (unit === "tf/m3" ? 9.80665 : 1);
}
