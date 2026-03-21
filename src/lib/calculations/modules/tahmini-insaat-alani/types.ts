export type EstimatedConstructionAreaStatus = "ok" | "warn";
export type AreaEstimationMode = "quick" | "detailed";
export type FloorProgramRole =
  | "basement"
  | "ground"
  | "typicalResidential"
  | "roofTechnical"
  | "custom";

export interface EstimatedConstructionAreaWarning {
  tone: "warn";
  message: string;
}

export interface QuickEstimatedConstructionAreaInput {
  parcelAreaM2: number;
  taks: number;
  kaks: number;
  normalFloorCount: number;
  hasBasement: boolean;
  basementFloorCount: number;
  basementFloorAreaM2: number | null;
}

export interface QuickEstimatedConstructionAreaResult {
  maxGroundAreaM2: number;
  emsalAreaM2: number;
  enteredFloorCapacityM2: number;
  averageRequiredFloorAreaM2: number;
  theoreticalFloorEquivalent: number;
  resolvedBasementFloorAreaM2: number;
  totalBasementAreaM2: number;
  totalAreaWithBasementM2: number;
  approximateTotalConstructionAreaM2: number;
  status: EstimatedConstructionAreaStatus;
  statusLabel: string;
  statusMessage: string;
  warnings: EstimatedConstructionAreaWarning[];
  notes: string[];
}

export interface DetailedProjectIdentity {
  il: string;
  ilce: string;
  mahalle: string;
  ada: string;
  parsel: string;
  kullanimAmaci: string;
}

export interface TechnicalAreaLine {
  id: string;
  label: string;
  areaM2: number;
}

export interface FloorProgramBlock {
  id: string;
  label: string;
  role: FloorProgramRole;
  repeatCount: number;
  grossIndependentAreaM2: number;
  netIndependentAreaM2: number;
  balconyTerraceAreaM2: number;
  commonCirculationAreaM2: number;
  elevatorShaftAreaM2: number;
  technicalLines: TechnicalAreaLine[];
  notes?: string;
}

export interface DetailedEstimatedConstructionAreaInput {
  projectIdentity: DetailedProjectIdentity;
  blocks: FloorProgramBlock[];
}

export interface FloorAreaSummary {
  id: string;
  label: string;
  role: FloorProgramRole;
  repeatCount: number;
  netIndependentAreaM2: number;
  balconyTerraceAreaM2: number;
  grossIndependentAreaM2: number;
  commonCirculationAreaM2: number;
  elevatorShaftAreaM2: number;
  technicalAreaM2: number;
  floorTotalM2: number;
  repeatedFloorTotalM2: number;
  technicalLines: TechnicalAreaLine[];
  notes?: string;
}

export interface DetailedEstimatedConstructionAreaResult {
  netIndependentAreaTotalM2: number;
  balconyTerraceAreaTotalM2: number;
  grossIndependentAreaTotalM2: number;
  commonAreaTotalM2: number;
  technicalAreaTotalM2: number;
  grandTotalConstructionAreaM2: number;
  quickReferenceTotalM2: number | null;
  quickDifferenceRatio: number | null;
  floors: FloorAreaSummary[];
  status: EstimatedConstructionAreaStatus;
  statusLabel: string;
  statusMessage: string;
  warnings: EstimatedConstructionAreaWarning[];
  notes: string[];
}

export type EstimatedConstructionAreaInput = QuickEstimatedConstructionAreaInput;
export type EstimatedConstructionAreaResult = QuickEstimatedConstructionAreaResult;
