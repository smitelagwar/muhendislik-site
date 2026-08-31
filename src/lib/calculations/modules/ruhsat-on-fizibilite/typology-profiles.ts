import { roundToInternalPrecision } from "./number-parsing";

export type UnitTypology = "1+1" | "2+1" | "3+1" | "4+1";
export type ComfortBand = "COMPACT" | "BALANCED" | "COMFORT";

export const UNIT_TYPOLOGIES: readonly UnitTypology[] = ["1+1", "2+1", "3+1", "4+1"] as const;
export const COMFORT_BANDS: readonly ComfortBand[] = ["COMPACT", "BALANCED", "COMFORT"] as const;

export const QUICK_RESERVE_ENVELOPE = {
  COMPACT: 0.08,
  BALANCED: 0.12,
  COMFORT: 0.20,
} as const;

export interface TypologyProfileBand {
  targetNetAreaM2: { min: number; max: number };
  targetClosedGrossAreaM2: { min: number; max: number };
}

export interface UnitTypologyProfile {
  unitType: UnitTypology;
  version: string;
  provenance: "HEURISTIC";
  calibrationStatus: "PROVISIONAL" | "OFFICE_CALIBRATED";
  sourceNotes: readonly string[];
  bands: Record<ComfortBand, TypologyProfileBand>;
}

// Seed net alan bantları (v4.2 standardı §14.4 OFFICE_TARGET hedeflerinden türetilmiş geçici ofis heuristic seed'leri)
const RAW_SEED_NET_AREAS: Record<UnitTypology, Record<ComfortBand, { min: number; max: number }>> = {
  "1+1": {
    COMPACT: { min: 35, max: 45 },
    BALANCED: { min: 45, max: 55 },
    COMFORT: { min: 55, max: 65 },
  },
  "2+1": {
    COMPACT: { min: 55, max: 70 },
    BALANCED: { min: 70, max: 85 },
    COMFORT: { min: 85, max: 100 },
  },
  "3+1": {
    COMPACT: { min: 80, max: 95 },
    BALANCED: { min: 95, max: 115 },
    COMFORT: { min: 115, max: 135 },
  },
  "4+1": {
    COMPACT: { min: 105, max: 125 },
    BALANCED: { min: 125, max: 150 },
    COMFORT: { min: 150, max: 180 },
  },
};

// Standartta incelenen vaka gözlem bandı (HEURISTIC: 1.12 - 1.24)
const CLOSED_GROSS_MIN_COEFF = 1.12;
const CLOSED_GROSS_MAX_COEFF = 1.24;

function buildProfile(unitType: UnitTypology): UnitTypologyProfile {
  const seeds = RAW_SEED_NET_AREAS[unitType];
  const bands: Record<ComfortBand, TypologyProfileBand> = {
    COMPACT: {
      targetNetAreaM2: seeds.COMPACT,
      targetClosedGrossAreaM2: {
        min: roundToInternalPrecision(seeds.COMPACT.min * CLOSED_GROSS_MIN_COEFF),
        max: roundToInternalPrecision(seeds.COMPACT.max * CLOSED_GROSS_MAX_COEFF),
      },
    },
    BALANCED: {
      targetNetAreaM2: seeds.BALANCED,
      targetClosedGrossAreaM2: {
        min: roundToInternalPrecision(seeds.BALANCED.min * CLOSED_GROSS_MIN_COEFF),
        max: roundToInternalPrecision(seeds.BALANCED.max * CLOSED_GROSS_MAX_COEFF),
      },
    },
    COMFORT: {
      targetNetAreaM2: seeds.COMFORT,
      targetClosedGrossAreaM2: {
        min: roundToInternalPrecision(seeds.COMFORT.min * CLOSED_GROSS_MIN_COEFF),
        max: roundToInternalPrecision(seeds.COMFORT.max * CLOSED_GROSS_MAX_COEFF),
      },
    },
  };

  return {
    unitType,
    version: "provisional-office-target-v1",
    provenance: "HEURISTIC",
    calibrationStatus: "PROVISIONAL",
    sourceNotes: [
      "v4.2 standardı Bölüm 14.4 OFFICE_TARGET hedeflerinden türetilmiştir.",
      "Net -> kapalı brüt aralığı için v4.2 vaka kütüphanesindeki 1.12-1.24 HEURISTIC bandı kullanılmıştır.",
      "Bu değerler mevzuat hükmü değildir; ofis ön etüt hedefidir.",
    ],
    bands,
  };
}

export const TYPOLOGY_PROFILES: Readonly<Record<UnitTypology, UnitTypologyProfile>> = {
  "1+1": buildProfile("1+1"),
  "2+1": buildProfile("2+1"),
  "3+1": buildProfile("3+1"),
  "4+1": buildProfile("4+1"),
};
