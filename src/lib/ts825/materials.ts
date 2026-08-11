import type { InsulationMaterial } from "@/lib/ts825/types";

export const INSULATION_MATERIALS: InsulationMaterial[] = [
  {
    id: "eps-035",
    name: "EPS",
    conductivity: 0.035,
    mu: 60,
    summary: "Dış cephe ısı yalıtım sistemlerinde yaygın levha sınıfı.",
  },
  {
    id: "xps-030",
    name: "XPS",
    conductivity: 0.03,
    mu: 150,
    summary: "Düşük λ değerli, suya maruz detaylarda tercih edilen levha sınıfı.",
  },
  {
    id: "rockwool-035",
    name: "Taş yünü",
    conductivity: 0.035,
    mu: 1,
    summary: "A1 sınıfı yanmazlık ve yüksek buhar geçirgenliği odaklı seçenek.",
  },
];

export const BUILDING_MATERIALS = [
  { id: "internal_plaster", name: "Alçı sıva", conductivity: 0.51, mu: 10 },
  { id: "cement_lime_plaster", name: "Kireç-çimento sıvası", conductivity: 1, mu: 15 },
  { id: "brick-033", name: "19 cm yatay delikli tuğla ·033", conductivity: 0.33, mu: 8 },
  { id: "brick-045", name: "Yatay delikli tuğla ·045", conductivity: 0.45, mu: 10 },
  { id: "aac-016", name: "Gazbeton ·016", conductivity: 0.16, mu: 5 },
  { id: "bims-034", name: "Bims blok ·034", conductivity: 0.34, mu: 5 },
  { id: "concrete-250", name: "Betonarme ·250", conductivity: 2.5, mu: 100 },
  { id: "cement_screed", name: "Çimento harçlı şap", conductivity: 1.4, mu: 15 },
  { id: "gypsum-board", name: "Alçı levha", conductivity: 0.25, mu: 10 },
] as const;

export function getInsulationMaterialById(materialId: string) {
  const aliases: Record<string, string> = {
    eps: "eps-035",
    xps: "xps-030",
    rockwool: "rockwool-035",
  };
  const resolvedId = aliases[materialId] ?? materialId;
  return INSULATION_MATERIALS.find((material) => material.id === resolvedId) ?? null;
}
