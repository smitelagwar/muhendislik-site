import type { PeriodSystem, SoilClass } from "./types";

export const HORIZONTAL_SPECTRUM_TL = 6;

export const PERIOD_SYSTEMS: ReadonlyArray<{
  id: PeriodSystem;
  label: string;
  ct?: number;
}> = [
  { id: "reinforced-concrete-frame", label: "Yalnız betonarme çerçeve", ct: 0.1 },
  {
    id: "reinforced-concrete-other",
    label: "Betonarme perde + çerçeve / diğer betonarme taşıyıcı sistem",
    ct: 0.07,
  },
  {
    id: "shear-wall-only",
    label: "Deprem etkilerinin tamamı betonarme perdelerle karşılanan sistem",
  },
  { id: "steel-frame", label: "Çelik çerçeve / çaprazlı çelik çerçeve", ct: 0.08 },
  { id: "other", label: "Diğer", ct: 0.07 },
];

export const SOIL_CLASSES: ReadonlyArray<SoilClass> = ["ZA", "ZB", "ZC", "ZD", "ZE", "ZF"];

export const FS_TABLE = {
  breakpoints: [0.25, 0.5, 0.75, 1, 1.25, 1.5],
  values: {
    ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    ZB: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
    ZC: [1.3, 1.3, 1.2, 1.2, 1.2, 1.2],
    ZD: [1.6, 1.4, 1.2, 1.1, 1, 1],
    ZE: [2.4, 1.7, 1.3, 1.1, 0.9, 0.8],
  },
} as const;

export const F1_TABLE = {
  breakpoints: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6],
  values: {
    ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    ZB: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8],
    ZC: [1.5, 1.5, 1.5, 1.5, 1.5, 1.4],
    ZD: [2.4, 2.2, 2, 1.9, 1.8, 1.7],
    ZE: [4.2, 3.3, 2.8, 2.4, 2.2, 2],
  },
} as const;
