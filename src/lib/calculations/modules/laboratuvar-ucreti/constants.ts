import type { LaboratuvarSampleType } from "./types";

export const LABORATUVAR_EFFECTIVE_YEAR = 2026 as const;
export const LABORATUVAR_VAT_RATE = 0.20 as const;

export const MAX_SAFE_LAB_AREA_M2 = 10_000_000;
export const MAX_SAFE_LAB_FLOORS = 60;
export const MAX_SAFE_LAB_POURS = 500;
export const MAX_SAFE_LAB_KAROT = 500;

// Varsayılan taşıyıcı metraj katsayıları (ortalama betonarme konut/ticari yapı)
export const DEFAULT_CONCRETE_M3_PER_M2 = 0.38;
export const DEFAULT_REBAR_TON_PER_M2 = 0.036;

// Ek-9 Tarife Cetveli — 2026 projeksiyonu (KDV hariç TL / adet)
// 2023 RG 32304 baz -> 2024 (%44,22) -> 2025 (%28,52) -> 2026 (%29,28)
export const EK9_CONCRETE_UNIT_PRICES: Record<
  LaboratuvarSampleType,
  { readonly minNet: number; readonly midNet: number; readonly maxNet: number }
> = {
  cube: {
    minNet: 167,
    midNet: 222,
    maxNet: 277,
  },
  cylinder: {
    minNet: 231,
    midNet: 307,
    maxNet: 382,
  },
} as const;

// Aselsannet EBİS RFID Beton Etiketi 2026 referans birim fiyatı (KDV hariç TL / adet)
export const DEFAULT_EBIS_CHIP_UNIT_PRICE_NET = 123.49;

// ÇŞİDB Döner Sermaye 2026 — Beton Çelik Çubuklar (TS 708, her çap için 3 adet = 1 takım)
// Çekme Deneyi (666,30 TL) + Gözle Muayene ve Kütle Tayini (106,61 TL) = 772,91 TL KDV hariç
export const STEEL_TENSILE_TEST_UNIT_PRICE_NET = 666.3;
export const STEEL_MASS_VISUAL_TEST_UNIT_PRICE_NET = 106.61;
export const STEEL_TEAM_UNIT_PRICE_NET = 772.91;

// İsteğe bağlı ek karot ortalama piyasa birim bedeli (KDV hariç TL / adet)
export const DEFAULT_KAROT_UNIT_PRICE_NET = 1800;

// TS 13515 Çizelge B1.1 & 2022/7 Sayılı Genelge — günlük döküm basamakları
export interface ConcreteSampleTier {
  readonly maxVolumeM3: number;
  readonly maxAreaM2: number;
  readonly totalSamples: number;
}

export const TS13515_DAILY_TIERS: readonly ConcreteSampleTier[] = [
  { maxVolumeM3: 24, maxAreaM2: 0, totalSamples: 8 },
  { maxVolumeM3: 100, maxAreaM2: 450, totalSamples: 12 },
  { maxVolumeM3: 150, maxAreaM2: 650, totalSamples: 16 },
  { maxVolumeM3: 200, maxAreaM2: 850, totalSamples: 20 },
  { maxVolumeM3: 250, maxAreaM2: 1050, totalSamples: 24 },
  { maxVolumeM3: 300, maxAreaM2: 1250, totalSamples: 28 },
  { maxVolumeM3: 400, maxAreaM2: 1450, totalSamples: 32 },
  { maxVolumeM3: 500, maxAreaM2: 1650, totalSamples: 36 },
  { maxVolumeM3: 600, maxAreaM2: 1850, totalSamples: 40 },
] as const;
