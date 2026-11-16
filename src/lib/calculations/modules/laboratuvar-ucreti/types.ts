export type LaboratuvarConcreteGrade = "standard" | "high";

export type LaboratuvarSampleType = "cube" | "cylinder";

export interface LaboratuvarUcretiInput {
  area: number;
  floors: number;
  concreteGrade: LaboratuvarConcreteGrade;
  sampleType: LaboratuvarSampleType;
  concreteM3?: number;
  rebarTons?: number;
  pourCount?: number;
  karotCount?: number;
  chipUnitPrice?: number;
}

export interface LaboratuvarBreakdownItem {
  id: "concrete" | "chip" | "steel" | "karot";
  label: string;
  quantityText: string;
  unitPriceNet: number;
  amountNet: number;
}

export interface LaboratuvarUcretiResult {
  input: LaboratuvarUcretiInput;
  effectiveYear: number;
  estimatedConcreteM3: number;
  estimatedRebarTons: number;
  pourCount: number;
  sampleCount: number;
  chipCount: number;
  steelTeamCount: number;
  karotCount: number;
  concreteUnitMinNet: number;
  concreteUnitMidNet: number;
  concreteUnitMaxNet: number;
  concreteTestCostNet: number;
  chipUnitPriceNet: number;
  chipCostNet: number;
  steelUnitPriceNet: number;
  steelTestCostNet: number;
  karotUnitPriceNet: number;
  karotCostNet: number;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  minGross: number;
  maxGross: number;
  perSquareMeterGross: number;
  breakdown: LaboratuvarBreakdownItem[];
}
