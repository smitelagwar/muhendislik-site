import type { OfficialCostSelection } from "@/lib/calculations/official-unit-costs";
import { createDefaultCollection, DEFAULT_PROJECT_INPUTS } from "./presets";
import type { ManualOverrides, ProjectInputsV2, ScenarioCollection, ScenarioState } from "./types";

interface SearchParamsLike {
  get(name: string): string | null;
}

interface CompactScenarioPayload {
  id?: string;
  name?: string;
  presetId?: string;
  inputs?: ProjectInputsV2;
  manualOverrides?: ManualOverrides;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeSelection(value: unknown): OfficialCostSelection | null {
  if (!isObject(value)) {
    return null;
  }

  const yil = value.yil;
  const grup = value.grup;
  const sinif = value.sinif;
  if (yil === 2026 && typeof grup === "string" && typeof sinif === "string") {
    return {
      yil,
      grup: grup as OfficialCostSelection["grup"],
      sinif: sinif as OfficialCostSelection["sinif"],
    };
  }

  return null;
}

function sanitizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeManualOverrides(value: unknown): ManualOverrides {
  if (!isObject(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, amount]) => Boolean(key) && typeof amount === "number" && Number.isFinite(amount) && amount > 0
    )
  ) as ManualOverrides;
}

function sanitizeInputs(value: unknown): ProjectInputsV2 {
  const base = deepClone(DEFAULT_PROJECT_INPUTS);
  if (!isObject(value)) {
    return base;
  }

  const area = isObject(value.area) ? value.area : {};
  const commercial = isObject(value.commercial) ? value.commercial : {};
  const site = isObject(value.site) ? value.site : {};
  const reference = isObject(value.reference) ? value.reference : {};

  return {
    projectName: sanitizeString(value.projectName, base.projectName),
    structureKind: sanitizeString(value.structureKind, base.structureKind) as ProjectInputsV2["structureKind"],
    qualityLevel: sanitizeString(value.qualityLevel, base.qualityLevel) as ProjectInputsV2["qualityLevel"],
    floorCount: sanitizeNumber(value.floorCount, base.floorCount),
    basementCount: sanitizeNumber(value.basementCount, base.basementCount),
    unitCount: sanitizeNumber(value.unitCount, base.unitCount),
    saleableArea: sanitizeNumber(value.saleableArea, base.saleableArea),
    commonAreaRatio: sanitizeNumber(value.commonAreaRatio, base.commonAreaRatio),
    facadeComplexity: sanitizeNumber(value.facadeComplexity, base.facadeComplexity),
    elevatorCount: sanitizeNumber(value.elevatorCount, base.elevatorCount),
    area: {
      advancedMode: sanitizeBoolean(area.advancedMode, base.area.advancedMode),
      totalArea: sanitizeNumber(area.totalArea, base.area.totalArea),
      basementArea: sanitizeNumber(area.basementArea, base.area.basementArea),
      normalArea: sanitizeNumber(area.normalArea, base.area.normalArea),
      mezzanineArea: sanitizeNumber(area.mezzanineArea, base.area.mezzanineArea),
      roofTerraceArea: sanitizeNumber(area.roofTerraceArea, base.area.roofTerraceArea),
      parkingArea: sanitizeNumber(area.parkingArea, base.area.parkingArea),
      landscapeArea: sanitizeNumber(area.landscapeArea, base.area.landscapeArea),
    },
    commercial: {
      contractorMarginRate: sanitizeNumber(
        commercial.contractorMarginRate,
        base.commercial.contractorMarginRate
      ),
      vatRate: sanitizeNumber(commercial.vatRate, base.commercial.vatRate),
      overheadRate: sanitizeNumber(commercial.overheadRate, base.commercial.overheadRate),
      contingencyRate: sanitizeNumber(
        commercial.contingencyRate,
        base.commercial.contingencyRate
      ),
      targetSalePrice: sanitizeNumber(
        commercial.targetSalePrice,
        base.commercial.targetSalePrice
      ),
      durationMonths: sanitizeNumber(commercial.durationMonths, base.commercial.durationMonths),
      monthlyInflationRate: sanitizeNumber(
        commercial.monthlyInflationRate,
        base.commercial.monthlyInflationRate
      ),
      contractorProfile: sanitizeString(
        commercial.contractorProfile,
        base.commercial.contractorProfile
      ) as ProjectInputsV2["commercial"]["contractorProfile"],
    },
    site: {
      region: sanitizeString(site.region, base.site.region) as ProjectInputsV2["site"]["region"],
      soilClass: sanitizeString(site.soilClass, base.site.soilClass) as ProjectInputsV2["site"]["soilClass"],
      siteDifficulty: sanitizeString(
        site.siteDifficulty,
        base.site.siteDifficulty
      ) as ProjectInputsV2["site"]["siteDifficulty"],
      climateZone: sanitizeString(
        site.climateZone,
        base.site.climateZone
      ) as ProjectInputsV2["site"]["climateZone"],
      heatingSystem: sanitizeString(
        site.heatingSystem,
        base.site.heatingSystem
      ) as ProjectInputsV2["site"]["heatingSystem"],
      facadeSystem: sanitizeString(
        site.facadeSystem,
        base.site.facadeSystem
      ) as ProjectInputsV2["site"]["facadeSystem"],
      mepLevel: sanitizeString(site.mepLevel, base.site.mepLevel) as ProjectInputsV2["site"]["mepLevel"],
      parkingType: sanitizeString(
        site.parkingType,
        base.site.parkingType
      ) as ProjectInputsV2["site"]["parkingType"],
      wetAreaDensity: sanitizeString(
        site.wetAreaDensity,
        base.site.wetAreaDensity
      ) as ProjectInputsV2["site"]["wetAreaDensity"],
    },
    reference: {
      officialSelection: sanitizeSelection(reference.officialSelection),
    },
  };
}

function sanitizeScenario(value: unknown, fallbackName: string): ScenarioState | null {
  if (!isObject(value)) {
    return null;
  }

  return {
    id: sanitizeString(value.id, `${fallbackName}-${Date.now()}`),
    name: sanitizeString(value.name, fallbackName),
    presetId: typeof value.presetId === "string" ? value.presetId : undefined,
    inputs: sanitizeInputs(value.inputs),
    manualOverrides: sanitizeManualOverrides(value.manualOverrides),
    lastEditedField:
      typeof value.lastEditedField === "string" ? value.lastEditedField : undefined,
  };
}

export function serializeCollectionToSearchParams(collection: ScenarioCollection): URLSearchParams {
  const params = new URLSearchParams();
  params.set("v", String(collection.version || 2));
  params.set("active", collection.activeScenarioId);
  params.set("mode", collection.comparisonMode);

  collection.scenarios.slice(0, 3).forEach((scenario, index) => {
    const payload: CompactScenarioPayload = {
      id: scenario.id,
      name: scenario.name,
      presetId: scenario.presetId,
      inputs: scenario.inputs,
      manualOverrides: scenario.manualOverrides,
    };

    params.set(`s${index + 1}`, JSON.stringify(payload));
  });

  return params;
}

export function deserializeCollectionFromSearchParams(
  searchParams: SearchParamsLike | null | undefined
): ScenarioCollection | null {
  if (!searchParams) {
    return null;
  }

  const scenarios = [searchParams.get("s1"), searchParams.get("s2"), searchParams.get("s3")]
    .map((raw, index) => {
      if (!raw) {
        return null;
      }

      try {
        return sanitizeScenario(JSON.parse(raw), `Senaryo ${String.fromCharCode(65 + index)}`);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ScenarioState[];

  if (scenarios.length > 0) {
    const activeScenarioId =
      searchParams.get("active") && scenarios.some((scenario) => scenario.id === searchParams.get("active"))
        ? (searchParams.get("active") as string)
        : scenarios[0].id;

    return {
      activeScenarioId,
      comparisonMode: scenarios.length > 1 ? "compare" : "single",
      scenarios,
      version: Number.parseInt(searchParams.get("v") ?? "2", 10) || 2,
    };
  }

  const legacyArea = Number.parseFloat(searchParams.get("alan") ?? "");
  const legacyGroup = searchParams.get("grup");
  const legacyClass = searchParams.get("sinif");

  if (Number.isFinite(legacyArea) && legacyArea > 0) {
    const collection = createDefaultCollection();
    const scenario = collection.scenarios[0];
    scenario.inputs.area.totalArea = legacyArea;
    scenario.inputs.area.advancedMode = false;
    scenario.inputs.projectName = "URL'den geri yüklenen proje";

    if (legacyGroup && legacyClass) {
      scenario.inputs.reference.officialSelection = {
        yil: 2026,
        grup: legacyGroup as OfficialCostSelection["grup"],
        sinif: legacyClass as OfficialCostSelection["sinif"],
      };
    }

    return collection;
  }

  return null;
}


export function normalizeCollection(value: unknown): ScenarioCollection {
  if (!isObject(value)) {
    return createDefaultCollection();
  }

  const rawScenarios = Array.isArray(value.scenarios) ? value.scenarios : [];
  const scenarios = rawScenarios
    .map((scenario, index) => sanitizeScenario(scenario, `Senaryo ${String.fromCharCode(65 + index)}`))
    .filter(Boolean) as ScenarioState[];

  if (scenarios.length === 0) {
    return createDefaultCollection();
  }

  const activeScenarioId =
    typeof value.activeScenarioId === "string" &&
    scenarios.some((scenario) => scenario.id === value.activeScenarioId)
      ? value.activeScenarioId
      : scenarios[0].id;

  return {
    activeScenarioId,
    comparisonMode:
      scenarios.length > 1 || value.comparisonMode === "compare" ? "compare" : "single",
    scenarios: scenarios.slice(0, 3),
    version: typeof value.version === "number" ? value.version : 2,
  };
}
