import type {
  DetailedProjectIdentity,
  FloorProgramRole,
  TechnicalAreaLine,
} from "@/lib/calculations/modules/tahmini-insaat-alani/types";

export const ESTIMATED_AREA_DETAILED_DRAFT_KEY =
  "estimated_construction_area_detailed_draft_v1";

export interface QuickFormState {
  parcelAreaM2: string;
  taks: string;
  kaks: string;
  normalFloorCount: string;
  hasBasement: boolean;
  basementFloorCount: string;
  basementFloorAreaM2: string;
}

export interface TechnicalAreaLineState {
  id: string;
  label: string;
  areaM2: string;
}

export interface FloorProgramBlockState {
  id: string;
  label: string;
  role: FloorProgramRole;
  repeatCount: string;
  grossIndependentAreaM2: string;
  netIndependentAreaM2: string;
  balconyTerraceAreaM2: string;
  commonCirculationAreaM2: string;
  elevatorShaftAreaM2: string;
  technicalLines: TechnicalAreaLineState[];
  notes: string;
}

export type DetailedProjectIdentityState = DetailedProjectIdentity;

export interface DetailedDraftState {
  projectIdentity: DetailedProjectIdentityState;
  blocks: FloorProgramBlockState[];
}

export const DEFAULT_QUICK_FORM: QuickFormState = {
  parcelAreaM2: "1000",
  taks: "0.30",
  kaks: "1.50",
  normalFloorCount: "5",
  hasBasement: false,
  basementFloorCount: "1",
  basementFloorAreaM2: "",
};

export const DEFAULT_PROJECT_IDENTITY: DetailedProjectIdentityState = {
  il: "",
  ilce: "",
  mahalle: "",
  ada: "",
  parsel: "",
  kullanimAmaci: "Konut",
};

export function stringifyNumberState(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return "";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(2)));
}

export function mapTechnicalLineToState(line: TechnicalAreaLine): TechnicalAreaLineState {
  return {
    id: line.id,
    label: line.label,
    areaM2: stringifyNumberState(line.areaM2),
  };
}
