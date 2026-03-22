export type EstimatedConstructionAreaStatus = "ok" | "warn";

export type ConstructionAreaProfile = "konut" | "ticariOfis" | "karma";

export interface EstimatedConstructionAreaWarning {
  tone: "warn";
  message: string;
}

export interface ConstructionAreaProfileDefinition {
  id: ConstructionAreaProfile;
  label: string;
  description: string;
  baseNonEmsalRatio: number;
  helper: string;
}

export interface EstimatedConstructionAreaInput {
  parcelAreaM2: number;
  taks: number;
  kaks: number;
  normalFloorCount: number;
  profile: ConstructionAreaProfile;
  hasBasement: boolean;
  basementFloorCount: number;
  basementFloorAreaM2: number | null;
}

export interface EstimatedConstructionAreaResult {
  profile: ConstructionAreaProfile;
  profileLabel: string;
  maxGroundAreaM2: number;
  emsalAreaM2: number;
  katYerlesimKapasitesiM2: number;
  averageRequiredFloorAreaM2: number;
  theoreticalFloorEquivalent: number;
  bazEmsalHariciOrani: number;
  katAdediDuzeltmesiOrani: number;
  emsalHariciEkAlanOrani: number;
  emsalHariciEkAlanM2: number;
  resolvedBasementFloorAreaM2: number;
  toplamBodrumAlanM2: number;
  bodrumVarsayimKullanildi: boolean;
  yaklasikToplamInsaatAlaniM2: number;
  status: EstimatedConstructionAreaStatus;
  statusLabel: string;
  statusMessage: string;
  warnings: EstimatedConstructionAreaWarning[];
  notes: string[];
}

export type QuickEstimatedConstructionAreaInput = EstimatedConstructionAreaInput;
export type QuickEstimatedConstructionAreaResult = EstimatedConstructionAreaResult;
