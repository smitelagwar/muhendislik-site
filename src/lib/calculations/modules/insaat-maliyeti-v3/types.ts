export type StructureKindV3 = "apartman" | "villa" | "ofis" | "endustriyel";
export type QualityLevelV3 = "ekonomik" | "standart" | "luks";
export type SoilClassV3 = "iyi" | "orta" | "kotu";
export type CityKeyV3 =
  | "istanbul"
  | "ankara_izmir"
  | "antalya"
  | "bursa_kocaeli"
  | "genel";

export interface ProjectInputsV3 {
  structureKind: StructureKindV3;
  totalArea: number;          // Brüt inşaat alanı (m²)
  floorCount: number;         // Bodrum dahil toplam kat sayısı
  basementFloors: number;     // Bodrum kat adedi (0–3)
  qualityLevel: QualityLevelV3;
  soilClass: SoilClassV3;
  city: CityKeyV3;
  hasElevator: boolean;       // Asansör var mı?
  elevatorCount: number;      // Kaç asansör?
  facadeType: "klasik" | "kompozit" | "cam_giydirme";  // Cephe tipi
}

export interface MacroMaterials {
  concreteM3: number;
  ironTon: number;
  concreteCost: number;
  ironCost: number;
  brickM2: number;          // Duvar alanı tahmini m²
  brickCost: number;
}

export interface CostCategoryV3 {
  id: "kaba" | "ince" | "mekanik" | "elektrik" | "cephe" | "diger";
  label: string;
  total: number;
  share: number;
  description: string;
}

export interface ConstructionCostResultV3 {
  inputs: ProjectInputsV3;
  grandTotal: number;
  costPerM2: number;
  optimistic: number;
  pessimistic: number;
  macroMaterials: MacroMaterials;
  categories: CostCategoryV3[];
  assumptions: string[];
  generatedAt: string;
  cityLabel: string;
}
