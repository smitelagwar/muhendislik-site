export type ClimateBucket = "1" | "2-3" | "4" | "5-6";

export type CalculationStatus =
  | "Uygun"
  | "Sınırda"
  | "Yetersiz"
  | "Enerji verimliliği açısından geliştirilebilir";

export interface DistrictClimateOption {
  id: string;
  label: string;
  bucket: ClimateBucket;
}

export interface ProvinceClimateOption {
  id: string;
  name: string;
  defaultBucket: ClimateBucket;
  districtOptions?: DistrictClimateOption[];
}

export interface ThermalLayer {
  label: string;
  thicknessMeters: number;
  conductivity: number;
}

export interface WallPreset {
  id: string;
  name: string;
  summary: string;
  layers: ThermalLayer[];
}

export interface InsulationMaterial {
  id: "eps" | "xps" | "rockwool";
  name: string;
  conductivity: number;
  summary: string;
}

export interface ResolvedClimateLocation {
  province: ProvinceClimateOption;
  districtOption?: DistrictClimateOption;
  bucket: ClimateBucket;
}

export interface MaterialComparisonRow {
  material: InsulationMaterial;
  theoreticalThicknessMm: number;
  recommendedThicknessMm: number;
  achievedUValue: number;
}

export interface InsulationCalculationResult {
  location: ResolvedClimateLocation;
  wallPreset: WallPreset;
  material: InsulationMaterial;
  statusLabel: CalculationStatus;
  targetUValue: number;
  existingResistance: number;
  existingUValue: number;
  requiredAdditionalResistance: number;
  theoreticalThicknessMm: number;
  recommendedThicknessMm: number;
  achievedUValue: number;
  materialComparison: MaterialComparisonRow[];
  narrative: string;
}
