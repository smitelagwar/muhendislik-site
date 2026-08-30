export type InspectionBuildingClassGroup = "I_II" | "III" | "IV_V";

export type InspectionGroupCode = "Grup I" | "Grup II" | "Grup III";

export type ProjectDurationYears = 1 | 2 | 3 | 4 | 5;

export type RegionalDiscountType =
  | "normal"
  | "endustri"
  | "osb"
  | "tgb"
  | "serbest"
  | "sanayi_sitesi";

export type AreaBandKey = "upTo1000" | "from1000To50000" | "over50000";

export interface InspectionClassGroupOption {
  readonly id: InspectionBuildingClassGroup;
  readonly groupCode: InspectionGroupCode;
  readonly title: string;
  readonly shortLabel: string;
  readonly unitCostTL: number;
  readonly description: string;
  readonly officialClasses: readonly string[];
}

export interface RegionalDiscountOption {
  readonly id: RegionalDiscountType;
  readonly label: string;
  readonly discountRate: number;
  readonly percentText: string;
  readonly description: string;
}

export interface DurationRateBand {
  readonly years: ProjectDurationYears;
  readonly upTo1000: number;
  readonly from1000To50000: number;
  readonly over50000: number;
}

export interface InstallmentStage {
  readonly stage: number;
  readonly name: string;
  readonly description: string;
  readonly percentage: number;
  readonly percentText: string;
}

export interface YapiDenetimSourceMetadata {
  readonly effectiveYear: number;
  readonly lawName: string;
  readonly lawNo: string;
  readonly regulationName: string;
  readonly article: string;
  readonly verificationDate: string;
  readonly sourceUrl: string;
  readonly yiUfeAnnualPercent: number;
  readonly tufeAnnualPercent: number;
  readonly averageIncreasePercent: number;
  readonly notes: readonly string[];
}

export interface YapiDenetimInput {
  area: number;
  classBand: InspectionBuildingClassGroup;
  durationYears: ProjectDurationYears;
  region: RegionalDiscountType;
}

export interface YapiDenetimSmallBuildingResult {
  applies: boolean;
  maxRate: number;
  maxBaseServiceFee: number;
  maxDiscountAmount: number;
  maxNetServiceFee: number;
  maxVatAmount: number;
  maxGrossTotal: number;
}

export interface YapiDenetimSemanticFlags {
  isMultiYear: boolean;
  possibleScopeReview: boolean;
  isOver3000: boolean;
  hasSmallBuildingProvision: boolean;
}

export interface YapiDenetimInstallmentBreakdown {
  stage: number;
  name: string;
  description: string;
  percentage: number;
  percentText: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export interface YapiDenetimPaymentModel {
  isUpfrontMandatory: boolean;
  thresholdArea: number;
  modalityBadge: string;
  title: string;
  summary: string;
  accountNotice: string;
  legalBasis: string;
  installments: YapiDenetimInstallmentBreakdown[];
}

export interface YapiDenetimCalculationResult {
  input: YapiDenetimInput;
  effectiveYear: number;
  inspectionGroup: InspectionGroupCode;
  unitCost: number;
  areaBand: AreaBandKey;
  areaBandLabel: string;
  serviceRate: number;
  discountRate: number;
  vatRate: number;
  approximateCost: number;
  baseServiceFee: number;
  regionalDiscountAmount: number;
  netServiceFee: number;
  vatAmount: number;
  grossTotal: number;
  smallBuilding: YapiDenetimSmallBuildingResult;
  flags: YapiDenetimSemanticFlags;
  paymentModel: YapiDenetimPaymentModel;
  calculatedAt: string;
}
