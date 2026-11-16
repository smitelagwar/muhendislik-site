import type { KirisliStructuralSystem } from "./types";

export const MAX_SAFE_KIRISLI_AREA_M2 = 10_000_000;
export const MAX_SAFE_KIRISLI_PARCEL_M2 = 2_000_000;
export const MAX_SAFE_KIRISLI_FLOORS = 30;
export const MAX_SAFE_TAKS = 1.0;
export const MAX_SAFE_KAKS = 15.0;

// Kirişli döşeme + kirişler (yatay elemanlar) taban katsayıları
export const BASE_SLAB_BEAM_CONCRETE_M3_PER_M2 = 0.195;
export const BASE_SLAB_BEAM_REBAR_KG_PER_M2 = 17.5;

// Taşıyıcı sistem bazlı düşey eleman beton ve donatı parametreleri (TBDY 2018)
export const STRUCTURAL_SYSTEM_COEFFICIENTS: Record<
  KirisliStructuralSystem,
  {
    readonly verticalConcreteM3PerM2: number;
    readonly verticalRebarKgPerM3: number;
    readonly slabBeamRebarFactor: number;
    readonly foundationConcreteFactor: number;
  }
> = {
  // Saf çerçeve: kolon kesitleri daha kompakt ama düğüm/etriye/güçlü-kolon nedeniyle kg/m³ en yüksek
  kolon: {
    verticalConcreteM3PerM2: 0.058,
    verticalRebarKgPerM3: 122,
    slabBeamRebarFactor: 1.06,
    foundationConcreteFactor: 0.97,
  },
  // Kolon + Perde (karma): orta beton, perdelerin çerçeve momentini almasıyla dengeli donatı
  kolonPerde: {
    verticalConcreteM3PerM2: 0.075,
    verticalRebarKgPerM3: 108,
    slabBeamRebarFactor: 0.97,
    foundationConcreteFactor: 1.0,
  },
  // Sadece Perdeli: perde kalınlıklarından dolayı beton hacmi yüksek, gövde pursantajı daha düşük
  sadecePerde: {
    verticalConcreteM3PerM2: 0.106,
    verticalRebarKgPerM3: 84,
    slabBeamRebarFactor: 0.91,
    foundationConcreteFactor: 1.04,
  },
} as const;

// Temel parametreleri (taban oturum alanı üzerinden)
export const RADYE_REBAR_KG_PER_M3 = 90;
export const MUTEMADI_CONCRETE_RATIO_TO_RADYE = 0.6;
export const MUTEMADI_REBAR_KG_PER_M3 = 105;

// Rijit bodrum çevre perdesi parametreleri (TBDY 2018 Madde 3.3.1 & 7.6)
export const BASEMENT_PERIMETER_SHAPE_FACTOR = 4.15; // ~1.4:1 dikdörtgen apartman oturumu
export const BASEMENT_STOREY_HEIGHT_M = 3.0;
export const BASEMENT_WALL_REBAR_KG_PER_M3 = 100;
