import type { LaboratuvarUcretiResult } from "../laboratuvar-ucreti";

export type KirisliInputMode = "alan" | "parsel";

export type KirisliStructuralSystem = "kolon" | "kolonPerde" | "sadecePerde";

export type KirisliFoundationType = "radye" | "mutemadi";

export type KirisliBasementCount = 0 | 1 | 2;

export interface KirisliAreaModeInput {
  mode: "alan";
  areaM2: number;
  normalFloors: number;
  basementFloors: KirisliBasementCount;
  structuralSystem: KirisliStructuralSystem;
  foundationType: KirisliFoundationType;
}

export interface KirisliParcelModeInput {
  mode: "parsel";
  parcelAreaM2: number;
  taks: number;
  kaks: number;
  basementFloors: KirisliBasementCount;
  structuralSystem: KirisliStructuralSystem;
  foundationType: KirisliFoundationType;
}

export type KirisliBetonDemirInput = KirisliAreaModeInput | KirisliParcelModeInput;

export interface KirisliBreakdownItem {
  id: "ustYapi" | "temel" | "bodrumPerde";
  label: string;
  concreteM3: number;
  rebarTons: number;
}

export interface KirisliBetonDemirResult {
  mode: KirisliInputMode;
  totalAreaM2: number;
  footprintAreaM2: number;
  normalFloors: number;
  basementFloors: KirisliBasementCount;
  totalFloors: number;
  structuralSystem: KirisliStructuralSystem;
  foundationType: KirisliFoundationType;
  totalConcreteM3: number;
  totalRebarTons: number;
  concretePerM2: number;
  rebarKgPerM2: number;
  rebarKgPerM3: number;
  foundationThicknessM: number;
  perimeterM: number;
  breakdown: KirisliBreakdownItem[];
  labEstimate: LaboratuvarUcretiResult;
}
