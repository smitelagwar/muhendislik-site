import type { ScenarioCollection, ScenarioState, ProjectInputsV2 } from "./types";

export interface ConstructionCostPreset {
  id: string;
  label: string;
  description: string;
  inputs: ProjectInputsV2;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createScenarioId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `scenario-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export const DEFAULT_PROJECT_INPUTS: ProjectInputsV2 = {
  projectName: "Yeni Konut Projesi",
  structureKind: "apartman",
  qualityLevel: "standart",
  floorCount: 4,
  basementCount: 1,
  unitCount: 12,
  saleableArea: 840,
  commonAreaRatio: 0.14,
  facadeComplexity: 1.05,
  elevatorCount: 1,
  area: {
    advancedMode: false,
    totalArea: 1200,
    basementArea: 240,
    normalArea: 960,
    mezzanineArea: 0,
    roofTerraceArea: 0,
    parkingArea: 160,
    landscapeArea: 260,
  },
  commercial: {
    contractorMarginRate: 0.18,
    vatRate: 0.2,
    overheadRate: 0.1,
    contingencyRate: 0.06,
    targetSalePrice: 32500,
    durationMonths: 15,
    monthlyInflationRate: 0.018,
    contractorProfile: "ortaOlcekli",
  },
  site: {
    region: "diger_buyuksehir",
    soilClass: "ZC",
    siteDifficulty: "orta",
    climateZone: "iliman",
    heatingSystem: "merkeziKazan",
    facadeSystem: "klasik",
    mepLevel: "orta",
    parkingType: "kapali",
    wetAreaDensity: "orta",
  },
  reference: {
    officialSelection: null,
  },
};

export const CONSTRUCTION_COST_PRESETS: ConstructionCostPreset[] = [
  {
    id: "urban-apartment",
    label: "Şehir Apartmanı",
    description: "1 bodrum + 4 kat, standart kalite, çoklu bağımsız bölüm kurgusu.",
    inputs: deepClone(DEFAULT_PROJECT_INPUTS),
  },
  {
    id: "premium-residence",
    label: "Premium Rezidans",
    description: "İstanbul Avrupa yakasında premium cephe ve yüksek MEP yoğunluğu.",
    inputs: {
      ...deepClone(DEFAULT_PROJECT_INPUTS),
      projectName: "Premium Rezidans",
      qualityLevel: "premium",
      floorCount: 10,
      basementCount: 2,
      unitCount: 48,
      saleableArea: 3680,
      commonAreaRatio: 0.2,
      facadeComplexity: 1.18,
      elevatorCount: 3,
      area: {
        advancedMode: true,
        totalArea: 0,
        basementArea: 1300,
        normalArea: 4200,
        mezzanineArea: 220,
        roofTerraceArea: 180,
        parkingArea: 1500,
        landscapeArea: 520,
      },
      commercial: {
        contractorMarginRate: 0.22,
        vatRate: 0.2,
        overheadRate: 0.12,
        contingencyRate: 0.07,
        targetSalePrice: 68500,
        durationMonths: 24,
        monthlyInflationRate: 0.02,
        contractorProfile: "kurumsal",
      },
      site: {
        region: "istanbul_avrupa",
        soilClass: "ZD",
        siteDifficulty: "yuksek",
        climateZone: "iliman",
        heatingSystem: "yerdenIsitma",
        facadeSystem: "premiumCam",
        mepLevel: "premium",
        parkingType: "kapali",
        wetAreaDensity: "yuksek",
      },
    },
  },
  {
    id: "detached-villa",
    label: "Müstakil Villa",
    description: "Düşük katlı, yüksek finish yoğunluklu villa senaryosu.",
    inputs: {
      ...deepClone(DEFAULT_PROJECT_INPUTS),
      projectName: "Müstakil Villa",
      structureKind: "villa",
      qualityLevel: "premium",
      floorCount: 2,
      basementCount: 1,
      unitCount: 1,
      saleableArea: 520,
      commonAreaRatio: 0.08,
      facadeComplexity: 1.12,
      elevatorCount: 0,
      area: {
        advancedMode: true,
        totalArea: 0,
        basementArea: 220,
        normalArea: 520,
        mezzanineArea: 0,
        roofTerraceArea: 80,
        parkingArea: 70,
        landscapeArea: 410,
      },
      commercial: {
        contractorMarginRate: 0.2,
        vatRate: 0.2,
        overheadRate: 0.09,
        contingencyRate: 0.05,
        targetSalePrice: 92000,
        durationMonths: 12,
        monthlyInflationRate: 0.017,
        contractorProfile: "bireysel",
      },
      site: {
        region: "antalya",
        soilClass: "ZC",
        siteDifficulty: "orta",
        climateZone: "sicakNemli",
        heatingSystem: "bireyselKombi",
        facadeSystem: "tasCephe",
        mepLevel: "orta",
        parkingType: "acik",
        wetAreaDensity: "yuksek",
      },
    },
  },
  {
    id: "office-block",
    label: "Ofis Bloku",
    description: "Yüksek MEP, yoğun cephe ve kurumsal teslim kurgusu.",
    inputs: {
      ...deepClone(DEFAULT_PROJECT_INPUTS),
      projectName: "Ofis Bloku",
      structureKind: "ofis",
      qualityLevel: "premium",
      floorCount: 8,
      basementCount: 2,
      unitCount: 20,
      saleableArea: 2850,
      commonAreaRatio: 0.18,
      facadeComplexity: 1.16,
      elevatorCount: 2,
      area: {
        advancedMode: true,
        totalArea: 0,
        basementArea: 980,
        normalArea: 3360,
        mezzanineArea: 180,
        roofTerraceArea: 70,
        parkingArea: 920,
        landscapeArea: 210,
      },
      commercial: {
        contractorMarginRate: 0.2,
        vatRate: 0.2,
        overheadRate: 0.11,
        contingencyRate: 0.06,
        targetSalePrice: 59000,
        durationMonths: 18,
        monthlyInflationRate: 0.019,
        contractorProfile: "kurumsal",
      },
      site: {
        region: "ankara",
        soilClass: "ZB",
        siteDifficulty: "orta",
        climateZone: "sert",
        heatingSystem: "vrf",
        facadeSystem: "premiumCam",
        mepLevel: "premium",
        parkingType: "kapali",
        wetAreaDensity: "orta",
      },
    },
  },
];

export function createScenarioFromInputs(
  inputs: ProjectInputsV2,
  options?: { name?: string; presetId?: string }
): ScenarioState {
  return {
    id: createScenarioId(),
    name: options?.name ?? "Senaryo A",
    presetId: options?.presetId,
    inputs: deepClone(inputs),
    manualOverrides: {},
  };
}

export function createScenarioFromPreset(presetId: string, name?: string): ScenarioState {
  const preset = CONSTRUCTION_COST_PRESETS.find((item) => item.id === presetId);
  if (!preset) {
    return createScenarioFromInputs(DEFAULT_PROJECT_INPUTS, { name });
  }

  return createScenarioFromInputs(preset.inputs, {
    name: name ?? preset.label,
    presetId: preset.id,
  });
}

export function createDefaultScenario(name = "Senaryo A"): ScenarioState {
  return createScenarioFromInputs(DEFAULT_PROJECT_INPUTS, {
    name,
    presetId: CONSTRUCTION_COST_PRESETS[0]?.id,
  });
}

export function createDefaultCollection(): ScenarioCollection {
  const scenario = createDefaultScenario();
  return {
    activeScenarioId: scenario.id,
    comparisonMode: "single",
    scenarios: [scenario],
    version: 2,
  };
}

export function nextScenarioName(scenarios: ScenarioState[]): string {
  const alphabet = ["A", "B", "C"];
  const nextIndex = Math.min(scenarios.length, alphabet.length - 1);
  return `Senaryo ${alphabet[nextIndex]}`;
}
