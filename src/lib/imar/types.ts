export type ImarStatusTone = "ok" | "warn" | "fail";

export interface ImarCalculatorInput {
  grossParcelAreaM2: number;
  taks: number;
  kaks: number;
  basementCount: number;
  frontSetbackM: number;
  rearSetbackM: number;
  sideSetbackM: number;
  parcelWidthM: number | null;
  parcelDepthM: number | null;
}

export interface ImarWarning {
  tone: Exclude<ImarStatusTone, "ok">;
  message: string;
}

export interface ImarCalculationResult {
  netParcelAreaM2: number;
  maxGroundAreaM2: number;
  totalConstructionAreaM2: number;
  theoreticalFloorEquivalent: number;
  safeNormalFloorCount: number;
  roundedNormalFloorCount: number;
  totalFloorCount: number;
  buildingHeightM: number;
  openAreaM2: number;
  coverageRatio: number;
  netAreaMode: "gross" | "setbacks";
  buildableWidthM: number | null;
  buildableDepthM: number | null;
  notes: string[];
  warnings: ImarWarning[];
  statusTone: ImarStatusTone;
  statusLabel: string;
  statusMessage: string;
}
