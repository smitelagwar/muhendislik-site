import type { InsulationMaterial } from "@/lib/ts825/types";

export const INSULATION_MATERIALS: InsulationMaterial[] = [
  {
    id: "eps",
    name: "EPS",
    conductivity: 0.035,
    summary: "Dış cephe mantolamada yaygın ve ekonomik seçim.",
  },
  {
    id: "xps",
    name: "XPS",
    conductivity: 0.03,
    summary: "Daha düşük lambda değeri ve suya dayanım avantajı sunar.",
  },
  {
    id: "rockwool",
    name: "Taş yünü",
    conductivity: 0.04,
    summary: "Yangın dayanımı ve ses performansı güçlü çözümdür.",
  },
];

export function getInsulationMaterialById(materialId: string) {
  return INSULATION_MATERIALS.find((material) => material.id === materialId) ?? null;
}
