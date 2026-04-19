import type { ConstructionAreaProfile } from "@/lib/calculations/modules/tahmini-insaat-alani/types";

export const ESTIMATED_AREA_LEGACY_DRAFT_KEY =
  "estimated_construction_area_detailed_draft_v1";

export interface EstimatedAreaFormState {
  parcelAreaM2: string;
  taks: string;
  kaks: string;
  normalFloorCount: string;
  profile: ConstructionAreaProfile;
  hasBasement: boolean;
  basementFloorCount: string;
  basementFloorAreaM2: string;
}

export const DEFAULT_ESTIMATED_AREA_FORM: EstimatedAreaFormState = {
  parcelAreaM2: "1200",
  taks: "0.35",
  kaks: "1.20",
  normalFloorCount: "5",
  profile: "konut",
  hasBasement: false,
  basementFloorCount: "1",
  basementFloorAreaM2: "",
};
