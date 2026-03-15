import type { WallPreset } from "@/lib/ts825/types";

export const WALL_PRESETS: WallPreset[] = [
  {
    id: "brick-infill",
    name: "19 cm tuğla dolgu + sıva",
    summary: "Klasik betonarme karkas yapı dolgu duvar yaklaşımı.",
    layers: [
      { label: "İç sıva", thicknessMeters: 0.02, conductivity: 0.87 },
      { label: "Tuğla dolgu", thicknessMeters: 0.19, conductivity: 0.45 },
      { label: "Dış sıva", thicknessMeters: 0.03, conductivity: 0.87 },
    ],
  },
  {
    id: "aac-wall",
    name: "25 cm gazbeton + sıva",
    summary: "Gazbeton blok duvarın göreli olarak güçlü ısıl direnci baz alınır.",
    layers: [
      { label: "İç sıva", thicknessMeters: 0.02, conductivity: 0.87 },
      { label: "Gazbeton", thicknessMeters: 0.25, conductivity: 0.12 },
      { label: "Dış sıva", thicknessMeters: 0.03, conductivity: 0.87 },
    ],
  },
  {
    id: "bims-wall",
    name: "19 cm bims blok + sıva",
    summary: "Hafif bloklu duvarlarda tipik ön tasarım kabulleri kullanılır.",
    layers: [
      { label: "İç sıva", thicknessMeters: 0.02, conductivity: 0.87 },
      { label: "Bims blok", thicknessMeters: 0.19, conductivity: 0.25 },
      { label: "Dış sıva", thicknessMeters: 0.03, conductivity: 0.87 },
    ],
  },
  {
    id: "concrete-wall",
    name: "20 cm betonarme perde + sıva",
    summary: "Perde veya yoğun betonarme dolgu etkisini temsil eden düşük dirençli kurgu.",
    layers: [
      { label: "İç sıva", thicknessMeters: 0.02, conductivity: 0.87 },
      { label: "Betonarme", thicknessMeters: 0.2, conductivity: 2.1 },
      { label: "Dış sıva", thicknessMeters: 0.03, conductivity: 0.87 },
    ],
  },
];

export function getWallPresetById(wallPresetId: string) {
  return WALL_PRESETS.find((preset) => preset.id === wallPresetId) ?? null;
}
