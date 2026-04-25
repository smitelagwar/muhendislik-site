import type {
  QuickQuantityArchetype,
  QuickQuantityBasementRetainingCondition,
  QuickQuantityFoundationType,
  QuickQuantityPlanCompactness,
  QuickQuantitySeismicDemand,
  QuickQuantitySlabSystem,
  QuickQuantitySoilClass,
  QuickQuantitySpanClass,
  QuickQuantityStructuralSystem,
} from "@/lib/calculations/modules/hizli-metraj/types";

export interface QuickQuantityFormState {
  katAlaniM2: string;
  normalKatSayisi: string;
  bodrumKatSayisi: string;
  bodrumKatAlaniM2: string;
  yapiArketipi: QuickQuantityArchetype;
  tasiyiciSistem: QuickQuantityStructuralSystem;
  dosemeSistemi: QuickQuantitySlabSystem;
  temelTipi: QuickQuantityFoundationType;
  zeminSinifi: QuickQuantitySoilClass;
  depremTalebi: QuickQuantitySeismicDemand;
  planKompaktligi: QuickQuantityPlanCompactness;
  bodrumCevrePerdesi: QuickQuantityBasementRetainingCondition;
  tipikAciklik: QuickQuantitySpanClass;
  resmiSinifOverride: boolean;
  resmiGrup: string;
  resmiSinif: string;
  showAdvanced: boolean;
}

export const DEFAULT_QUICK_QUANTITY_FORM: QuickQuantityFormState = {
  katAlaniM2: "450",
  normalKatSayisi: "5",
  bodrumKatSayisi: "1",
  bodrumKatAlaniM2: "",
  yapiArketipi: "apartman-4-7-kat",
  tasiyiciSistem: "cercevePerde",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "tam",
  tipikAciklik: "standart",
  resmiSinifOverride: false,
  resmiGrup: "III",
  resmiSinif: "B",
  showAdvanced: false,
};
