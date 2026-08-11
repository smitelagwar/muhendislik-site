import type { WallPreset } from "@/lib/ts825/types";

export const WALL_PRESETS: WallPreset[] = [
  {
    id: "brick-infill",
    name: "19 cm tuğla + mantolama",
    summary: "Betonarme karkas yapılarda dıştan yalıtımlı yatay delikli tuğla dolgu duvar.",
    defaultInsulationMaterialId: "xps-030",
    defaultInsulationThicknessMeters: 0.13,
    layers: [
      { materialId: "internal_plaster", label: "Alçı sıva", thicknessMeters: 0.02, conductivity: 0.51, mu: 10 },
      { materialId: "brick-033", label: "Yatay delikli tuğla", thicknessMeters: 0.19, conductivity: 0.33, mu: 8 },
      { materialId: "cement_lime_plaster", label: "Kireç-çimento sıvası", thicknessMeters: 0.03, conductivity: 1, mu: 15 },
    ],
  },
  {
    id: "aac-wall",
    name: "25 cm gazbeton + mantolama",
    summary: "Gazbeton dolgu duvar için dıştan yalıtımlı kurgu.",
    defaultInsulationMaterialId: "eps-035",
    defaultInsulationThicknessMeters: 0.06,
    layers: [
      { materialId: "internal_plaster", label: "Alçı sıva", thicknessMeters: 0.02, conductivity: 0.51, mu: 10 },
      { materialId: "aac-016", label: "Gazbeton", thicknessMeters: 0.25, conductivity: 0.16, mu: 5 },
      { materialId: "cement_lime_plaster", label: "Kireç-çimento sıvası", thicknessMeters: 0.03, conductivity: 1, mu: 15 },
    ],
  },
  {
    id: "bims-wall",
    name: "19 cm bims blok + mantolama",
    summary: "Hafif beton bloklu dolgu duvar için dıştan yalıtımlı kurgu.",
    defaultInsulationMaterialId: "eps-035",
    defaultInsulationThicknessMeters: 0.08,
    layers: [
      { materialId: "internal_plaster", label: "Alçı sıva", thicknessMeters: 0.02, conductivity: 0.51, mu: 10 },
      { materialId: "bims-034", label: "Bims blok", thicknessMeters: 0.19, conductivity: 0.34, mu: 5 },
      { materialId: "cement_lime_plaster", label: "Kireç-çimento sıvası", thicknessMeters: 0.03, conductivity: 1, mu: 15 },
    ],
  },
  {
    id: "concrete-wall",
    name: "25 cm betonarme perde + mantolama",
    summary: "Perde ve kolon yüzeylerinde dıştan yalıtım kontrolü.",
    defaultInsulationMaterialId: "rockwool-035",
    defaultInsulationThicknessMeters: 0.1,
    layers: [
      { materialId: "internal_plaster", label: "Alçı sıva", thicknessMeters: 0.02, conductivity: 0.51, mu: 10 },
      { materialId: "concrete-250", label: "Betonarme", thicknessMeters: 0.25, conductivity: 2.5, mu: 100 },
      { materialId: "cement_lime_plaster", label: "Kireç-çimento sıvası", thicknessMeters: 0.03, conductivity: 1, mu: 15 },
    ],
  },
];

export function getWallPresetById(wallPresetId: string) {
  return WALL_PRESETS.find((preset) => preset.id === wallPresetId) ?? null;
}
