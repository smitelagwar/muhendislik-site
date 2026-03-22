import type {
  OfficialCostResultSnapshot,
  OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";

export type StructureKind = "apartman" | "villa" | "ofis" | "ticari";
export type QualityLevel = "ekonomik" | "standart" | "premium" | "luks";
export type RegionKey =
  | "istanbul_avrupa"
  | "istanbul_anadolu"
  | "ankara"
  | "izmir"
  | "bursa"
  | "antalya"
  | "kayseri"
  | "trabzon"
  | "diger_buyuksehir"
  | "il_merkezi"
  | "ilce";
export type SoilClass = "ZA" | "ZB" | "ZC" | "ZD" | "ZE";
export type SiteDifficulty = "dusuk" | "orta" | "yuksek" | "cokYuksek";
export type ClimateZone = "iliman" | "sert" | "sicakNemli";
export type ContractorProfileKey = "bireysel" | "ortaOlcekli" | "kurumsal";
export type HeatingSystemKey = "bireyselKombi" | "merkeziKazan" | "yerdenIsitma" | "vrf";
export type FacadeSystemKey = "klasik" | "kompozit" | "premiumCam" | "tasCephe";
export type MepLevel = "dusuk" | "orta" | "yuksek" | "premium";
export type ParkingType = "yok" | "acik" | "kapali";
export type WetAreaDensity = "dusuk" | "orta" | "yuksek";
export type ComparisonMode = "single" | "compare";
export type CostItemGroup = "direct" | "indirect" | "soft" | "commercial";
export type ValidationTone = "info" | "warning" | "error";
export type ScenarioId = string;

export interface AreaBreakdownInputs {
  advancedMode: boolean;
  totalArea: number;
  basementArea: number;
  normalArea: number;
  mezzanineArea: number;
  roofTerraceArea: number;
  parkingArea: number;
  landscapeArea: number;
}

export interface CommercialInputs {
  contractorMarginRate: number;
  vatRate: number;
  overheadRate: number;
  contingencyRate: number;
  targetSalePrice: number;
  durationMonths: number;
  monthlyInflationRate: number;
  contractorProfile: ContractorProfileKey;
}

export interface SiteInputs {
  region: RegionKey;
  soilClass: SoilClass;
  siteDifficulty: SiteDifficulty;
  climateZone: ClimateZone;
  heatingSystem: HeatingSystemKey;
  facadeSystem: FacadeSystemKey;
  mepLevel: MepLevel;
  parkingType: ParkingType;
  wetAreaDensity: WetAreaDensity;
}

export interface ReferenceInputs {
  officialSelection: OfficialCostSelection | null;
}

export interface ProjectInputsV2 {
  projectName: string;
  structureKind: StructureKind;
  qualityLevel: QualityLevel;
  floorCount: number;
  basementCount: number;
  unitCount: number;
  saleableArea: number;
  commonAreaRatio: number;
  facadeComplexity: number;
  elevatorCount: number;
  area: AreaBreakdownInputs;
  commercial: CommercialInputs;
  site: SiteInputs;
  reference: ReferenceInputs;
}

export type ManualOverrides = Record<string, number>;

export interface ScenarioState {
  id: ScenarioId;
  name: string;
  presetId?: string;
  inputs: ProjectInputsV2;
  manualOverrides: ManualOverrides;
  lastEditedField?: string;
}

export interface ScenarioCollection {
  activeScenarioId: ScenarioId;
  comparisonMode: ComparisonMode;
  scenarios: ScenarioState[];
  version: number;
}

export interface ValidationIssue {
  id: string;
  tone: ValidationTone;
  message: string;
  hint?: string;
}

export interface BenchmarkComparison {
  selection: OfficialCostSelection | null;
  label: string;
  officialUnitCost: number;
  officialTotal: number;
  delta: number;
  deltaPct: number;
  status: "low" | "aligned" | "high";
  reasons: string[];
  officialResult: OfficialCostResultSnapshot | null;
}

export interface SensitivityEntry {
  id: string;
  label: string;
  impactAmount: number;
  impactPct: number;
  note: string;
}

export interface CostRange {
  optimistic: number;
  expected: number;
  pessimistic: number;
  variancePct: number;
}

export interface CostItemQuantity {
  label: string;
  value: number;
  unit: string;
}

export interface CostItem {
  id: string;
  label: string;
  group: CostItemGroup;
  description: string;
  amount: number;
  share: number;
  notes: string[];
  quantity?: CostItemQuantity;
  isOverridden: boolean;
  isHighImpact: boolean;
  order: number;
}

export interface CostGroupSummary {
  id: CostItemGroup;
  label: string;
  description: string;
  total: number;
  share: number;
  items: CostItem[];
}

export interface ConstructionCostScenarioSnapshot {
  scenarioId: ScenarioId;
  scenarioName: string;
  generatedAt: string;
  inputs: ProjectInputsV2;
  physicalArea: number;
  equivalentArea: number;
  saleableArea: number;
  directCost: number;
  indirectCost: number;
  softCost: number;
  contingencyAmount: number;
  contractorProfileAdjustment: number;
  contractorMarginAmount: number;
  vatAmount: number;
  subtotalBeforeVat: number;
  grandTotal: number;
  costPerM2: number;
  costPerSaleableM2: number;
  costPerUnit: number;
  range: CostRange;
  benchmark: BenchmarkComparison;
  validationIssues: ValidationIssue[];
  topDrivers: SensitivityEntry[];
  assumptions: string[];
  groups: CostGroupSummary[];
  lineItems: CostItem[];
  dataSourceLine: string;
  activePresetLabel?: string;
}

export interface ScenarioComparisonValue {
  scenarioId: ScenarioId;
  scenarioName: string;
  value: number;
}

export interface ScenarioComparisonRow {
  id: string;
  label: string;
  unit: string;
  values: ScenarioComparisonValue[];
  bestScenarioId: ScenarioId | null;
}

export interface ConstructionCostReportSnapshot {
  title: string;
  generatedAt: string;
  activeScenarioId: ScenarioId;
  scenarios: ConstructionCostScenarioSnapshot[];
  comparisonRows: ScenarioComparisonRow[];
}
