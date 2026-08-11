export type ClimateBucket = "1" | "2" | "3" | "4" | "5" | "6";

export type CalculationStatus = "Uygun" | "Sınırda" | "Yetersiz";

export type MoistureStatus = "safe" | "watch" | "risk";

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
  id: string;
  materialId?: string;
  label: string;
  thicknessMeters: number;
  conductivity: number;
  mu?: number;
  isInsulation?: boolean;
}

export interface WallPreset {
  id: string;
  name: string;
  summary: string;
  layers: Omit<ThermalLayer, "id">[];
  defaultInsulationMaterialId?: string;
  defaultInsulationThicknessMeters?: number;
}

export interface InsulationMaterial {
  id: string;
  name: string;
  conductivity: number;
  mu?: number;
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

export interface GradientPoint {
  x: number;
  temp: number;
  label: string;
}

export interface LayerCalculationRow {
  id: string;
  label: string;
  thicknessMeters: number;
  conductivity: number;
  resistance: number;
  mu?: number;
  equivalentAirLayerMeters?: number;
  cumulativeResistance: number;
  interfaceTemperature: number;
  isInsulation: boolean;
}

export interface ThermalConditions {
  indoorTemperatureC: number;
  outdoorTemperatureC: number;
  indoorRelativeHumidity: number;
}

export interface SurfaceMoistureCheck {
  dewPointC: number;
  internalSurfaceTemperatureC: number;
  surfaceTemperatureDifferenceC: number;
  safetyMarginC: number;
  status: MoistureStatus;
  label: string;
}

export interface InsulationCalculationResult {
  location: ResolvedClimateLocation;
  layers: ThermalLayer[];
  recommendedLayers: ThermalLayer[];
  layerRows: LayerCalculationRow[];
  insulationLayerId?: string;
  material: InsulationMaterial;
  statusLabel: CalculationStatus;
  targetUValue: number;
  baseResistance: number;
  baseUValue: number;
  currentResistance: number;
  currentUValue: number;
  existingResistance: number;
  existingUValue: number;
  requiredAdditionalResistance: number;
  theoreticalThicknessMm: number;
  recommendedThicknessMm: number;
  achievedResistance: number;
  achievedUValue: number;
  currentInsulationThicknessMm: number;
  materialComparison: MaterialComparisonRow[];
  narrative: string;
  temperatureGradient: GradientPoint[];
  conditions: ThermalConditions;
  surfaceMoistureCheck: SurfaceMoistureCheck;
}
