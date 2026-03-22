import { formatTL, formatYuzde } from "@/lib/calculations/core";
import {
  AREA_COEFFICIENTS,
  BASE_COST_ITEMS,
  CLIMATE_OPTIONS,
  CONTRACTOR_PROFILES,
  FACADE_OPTIONS,
  GROUP_LABELS,
  HEATING_OPTIONS,
  MEP_OPTIONS,
  PARKING_OPTIONS,
  QUALITY_OPTIONS,
  REGION_OPTIONS,
  SITE_DIFFICULTY_OPTIONS,
  SOIL_OPTIONS,
  STRUCTURE_KIND_MULTIPLIERS,
  WET_AREA_OPTIONS,
} from "./config";
import { buildBenchmarkComparison } from "./benchmark";
import { CONSTRUCTION_COST_PRESETS } from "./presets";
import { validateScenarioInputs } from "./validation";
import type {
  ConstructionCostReportSnapshot,
  ConstructionCostScenarioSnapshot,
  CostGroupSummary,
  CostItem,
  CostItemQuantity,
  CostRange,
  ScenarioCollection,
  ScenarioComparisonRow,
  ScenarioState,
  SensitivityEntry,
} from "./types";

function sum(values: number[]) {
  return values.reduce((accumulator, value) => accumulator + value, 0);
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function quantityLabel(quantityKey: string): CostItemQuantity["label"] {
  switch (quantityKey) {
    case "equivalentArea":
      return "Eşdeğer alan";
    case "physicalArea":
      return "Fiziksel alan";
    case "saleableArea":
      return "Satılabilir alan";
    case "parkingArea":
      return "Otopark alanı";
    case "landscapeArea":
      return "Peyzaj alanı";
    case "unitCount":
      return "Bölüm adedi";
    case "elevatorCount":
      return "Asansör adedi";
    default:
      return "Baz miktar";
  }
}

function quantityUnit(quantityKey: string): CostItemQuantity["unit"] {
  return quantityKey === "unitCount" || quantityKey === "elevatorCount" ? "adet" : "m²";
}

export function computePhysicalArea(scenario: ScenarioState): number {
  const { area } = scenario.inputs;
  if (!area.advancedMode) {
    return Math.max(area.totalArea, 0);
  }

  return Math.max(
    area.basementArea + area.normalArea + area.mezzanineArea + area.roofTerraceArea + area.parkingArea,
    0
  );
}

export function computeEquivalentArea(scenario: ScenarioState): number {
  const { area } = scenario.inputs;
  if (!area.advancedMode) {
    return Math.max(area.totalArea, 0);
  }

  return Math.max(
    area.basementArea * AREA_COEFFICIENTS.basement +
      area.normalArea * AREA_COEFFICIENTS.normal +
      area.mezzanineArea * AREA_COEFFICIENTS.mezzanine +
      area.roofTerraceArea * AREA_COEFFICIENTS.roofTerrace,
    0
  );
}

export function computeElevatorCount(scenario: ScenarioState): number {
  if (scenario.inputs.elevatorCount > 0) {
    return scenario.inputs.elevatorCount;
  }

  if (scenario.inputs.floorCount <= 4 || scenario.inputs.structureKind === "villa") {
    return 0;
  }

  return Math.max(1, Math.ceil(scenario.inputs.unitCount / 18));
}

export function buildReasonCandidates(scenario: ScenarioState): string[] {
  const { inputs } = scenario;
  return [
    `${REGION_OPTIONS[inputs.site.region].label} · x${REGION_OPTIONS[inputs.site.region].multiplier.toFixed(2)}`,
    `${QUALITY_OPTIONS[inputs.qualityLevel].label} kalite paketi`,
    `${SOIL_OPTIONS[inputs.site.soilClass].label}`,
    `${HEATING_OPTIONS[inputs.site.heatingSystem].label}`,
    `${FACADE_OPTIONS[inputs.site.facadeSystem].label}`,
    `${MEP_OPTIONS[inputs.site.mepLevel].label}`,
  ];
}

export function buildRange(grandTotal: number, scenario: ScenarioState): CostRange {
  const variancePct = Math.min(
    0.2,
    0.07 +
      (scenario.inputs.site.siteDifficulty === "yuksek" ? 0.03 : 0) +
      (scenario.inputs.site.siteDifficulty === "cokYuksek" ? 0.05 : 0) +
      (scenario.inputs.site.soilClass === "ZE" ? 0.04 : scenario.inputs.site.soilClass === "ZD" ? 0.02 : 0) +
      Math.max(0, scenario.inputs.commercial.durationMonths - 18) * 0.002 +
      scenario.inputs.commercial.monthlyInflationRate * 0.8
  );

  return {
    optimistic: grandTotal * (1 - variancePct * 0.55),
    expected: grandTotal,
    pessimistic: grandTotal * (1 + variancePct),
    variancePct,
  };
}

export function buildSensitivityEntries(
  directCost: number,
  grandTotal: number,
  scenario: ScenarioState
): SensitivityEntry[] {
  const qualityDelta = Math.max(0, QUALITY_OPTIONS[scenario.inputs.qualityLevel].multiplier - 1);
  const regionDelta = Math.max(0, REGION_OPTIONS[scenario.inputs.site.region].multiplier - 1);
  const soilDelta = Math.max(0, SOIL_OPTIONS[scenario.inputs.site.soilClass].structuralMultiplier - 1);
  const marginDelta = scenario.inputs.commercial.contractorMarginRate;
  const vatDelta = scenario.inputs.commercial.vatRate;

  return [
    {
      id: "quality",
      label: "Kalite paketi etkisi",
      impactAmount: directCost * qualityDelta,
      impactPct: grandTotal > 0 ? (directCost * qualityDelta) / grandTotal : 0,
      note: QUALITY_OPTIONS[scenario.inputs.qualityLevel].note ?? "Finish, cephe ve mahal kalitesi etkisi.",
    },
    {
      id: "region",
      label: "Bölgesel maliyet farkı",
      impactAmount: directCost * regionDelta,
      impactPct: grandTotal > 0 ? (directCost * regionDelta) / grandTotal : 0,
      note: REGION_OPTIONS[scenario.inputs.site.region].note ?? "İşçilik ve lojistik etkisi.",
    },
    {
      id: "soil",
      label: "Zemin ve saha etkisi",
      impactAmount: directCost * soilDelta,
      impactPct: grandTotal > 0 ? (directCost * soilDelta) / grandTotal : 0,
      note: SOIL_OPTIONS[scenario.inputs.site.soilClass].note,
    },
    {
      id: "margin",
      label: "Müteahhit kârı",
      impactAmount: grandTotal * marginDelta * 0.78,
      impactPct: marginDelta * 0.78,
      note: `Seçili ticari marj ${formatYuzde(marginDelta)} seviyesinde.`,
    },
    {
      id: "vat",
      label: "KDV etkisi",
      impactAmount: grandTotal * vatDelta * 0.67,
      impactPct: vatDelta * 0.67,
      note: `KDV ${formatYuzde(vatDelta)} ile uygulanıyor.`,
    },
  ].sort((left, right) => right.impactAmount - left.impactAmount);
}

function itemMultiplierFor(itemId: string, scenario: ScenarioState): number {
  const { inputs } = scenario;
  const region = REGION_OPTIONS[inputs.site.region].multiplier;
  const quality = QUALITY_OPTIONS[inputs.qualityLevel].multiplier;
  const structure = STRUCTURE_KIND_MULTIPLIERS[inputs.structureKind];
  const soil = SOIL_OPTIONS[inputs.site.soilClass];
  const siteDifficulty = SITE_DIFFICULTY_OPTIONS[inputs.site.siteDifficulty].multiplier;
  const climate = CLIMATE_OPTIONS[inputs.site.climateZone].multiplier;
  const heating = HEATING_OPTIONS[inputs.site.heatingSystem].multiplier;
  const facade = FACADE_OPTIONS[inputs.site.facadeSystem].multiplier;
  const mep = MEP_OPTIONS[inputs.site.mepLevel].multiplier;
  const wet = WET_AREA_OPTIONS[inputs.site.wetAreaDensity].multiplier;

  const shared = region * structure;
  switch (itemId) {
    case "hafriyat":
      return shared * soil.excavationMultiplier * siteDifficulty * (1 + scenario.inputs.basementCount * 0.03);
    case "temel-betonarme":
      return shared * quality * soil.structuralMultiplier * (1 + scenario.inputs.basementCount * 0.02);
    case "duvar-cati":
      return shared * quality * climate * soil.waterproofingMultiplier;
    case "dis-cephe":
      return shared * quality * facade * climate * scenario.inputs.facadeComplexity;
    case "ince-finish":
      return shared * quality * wet;
    case "mekanik":
      return shared * quality * climate * heating * mep * wet;
    case "elektrik":
      return shared * quality * mep * (scenario.inputs.structureKind === "ofis" ? 1.05 : 1);
    case "asansor":
      return shared * (scenario.inputs.floorCount >= 10 ? 1.12 : 1);
    case "otopark":
      return shared * Math.max(PARKING_OPTIONS[scenario.inputs.site.parkingType].multiplier, 0);
    case "peyzaj":
      return region * siteDifficulty * (scenario.inputs.qualityLevel === "premium" ? 1.05 : 1);
    default:
      return shared * quality;
  }
}

function buildBaseItems(
  scenario: ScenarioState,
  equivalentArea: number,
  physicalArea: number,
  saleableArea: number,
  elevatorCount: number
): CostItem[] {
  const quantityMap = {
    equivalentArea,
    physicalArea,
    saleableArea,
    parkingArea: Math.max(scenario.inputs.area.parkingArea, 0),
    landscapeArea: Math.max(scenario.inputs.area.landscapeArea, 0),
    unitCount: Math.max(scenario.inputs.unitCount, 0),
    elevatorCount: Math.max(elevatorCount, 0),
    subtotal: 0,
  };

  return BASE_COST_ITEMS.map((config) => {
    const quantity = safeNumber(quantityMap[config.quantityKey]);
    const baseAmount =
      quantity <= 0 || (config.id === "otopark" && scenario.inputs.site.parkingType === "yok")
        ? 0
        : config.baseRate * quantity * itemMultiplierFor(config.id, scenario);
    const override = scenario.manualOverrides[config.id];
    const amount = override && override > 0 ? override : baseAmount;

    return {
      id: config.id,
      label: config.label,
      group: config.group,
      description: config.description,
      amount,
      share: 0,
      notes: [
        `${quantityLabel(config.quantityKey)}: ${quantity.toLocaleString("tr-TR", {
          maximumFractionDigits: 1,
        })} ${quantityUnit(config.quantityKey)}`,
        `Baz oran: ${formatTL(config.baseRate)}`,
      ],
      quantity: {
        label: quantityLabel(config.quantityKey),
        value: quantity,
        unit: quantityUnit(config.quantityKey),
      },
      isOverridden: Boolean(override && override > 0),
      isHighImpact: false,
      order: config.order,
    };
  });
}

export function calculateConstructionCostScenario(
  scenario: ScenarioState
): ConstructionCostScenarioSnapshot {
  const physicalArea = computePhysicalArea(scenario);
  const equivalentArea = computeEquivalentArea(scenario);
  const saleableArea =
    scenario.inputs.saleableArea > 0
      ? scenario.inputs.saleableArea
      : Math.max(physicalArea * (1 - scenario.inputs.commonAreaRatio), 0);
  const elevatorCount = computeElevatorCount(scenario);
  const directItems = buildBaseItems(scenario, equivalentArea, physicalArea, saleableArea, elevatorCount);
  const directCost = sum(directItems.map((item) => item.amount));

  const logisticsAmount =
    equivalentArea *
    165 *
    REGION_OPTIONS[scenario.inputs.site.region].multiplier *
    SITE_DIFFICULTY_OPTIONS[scenario.inputs.site.siteDifficulty].multiplier;
  const siteOverheadAmount =
    directCost *
    (scenario.inputs.commercial.overheadRate * CONTRACTOR_PROFILES[scenario.inputs.commercial.contractorProfile].riskFactor);
  const indirectItems: CostItem[] = [
    {
      id: "site-overhead",
      label: "Şantiye Genel Giderleri",
      group: "indirect",
      description: "Şantiye ofisi, saha yönetimi, güvenlik ve geçici tesisler.",
      amount: siteOverheadAmount,
      share: 0,
      notes: [`Overhead oranı ${formatYuzde(scenario.inputs.commercial.overheadRate)}`],
      isOverridden: false,
      isHighImpact: false,
      order: 101,
    },
    {
      id: "logistics",
      label: "Lojistik ve Nakliye",
      group: "indirect",
      description: "Şehir içi erişim, beton santrali mesafesi ve saha lojistiği.",
      amount: logisticsAmount,
      share: 0,
      notes: [REGION_OPTIONS[scenario.inputs.site.region].note ?? "Bölgesel lojistik etkisi."],
      isOverridden: false,
      isHighImpact: false,
      order: 102,
    },
  ];

  const indirectCost = sum(indirectItems.map((item) => item.amount));

  const permitAmount =
    physicalArea *
    (scenario.inputs.structureKind === "ticari" ? 340 : 250) *
    REGION_OPTIONS[scenario.inputs.site.region].multiplier;
  const projectServicesAmount = equivalentArea * 210;
  const insuranceLabAmount = physicalArea * 115;
  const softItems: CostItem[] = [
    {
      id: "permit-fees",
      label: "Ruhsat, Harç ve Otopark",
      group: "soft",
      description: "Belediye ruhsat, harç, otopark ve yasal başvuru giderleri.",
      amount: permitAmount,
      share: 0,
      notes: ["Şehir ve yapı tipine göre kurgulanmış resmi gider bandı."],
      isOverridden: false,
      isHighImpact: false,
      order: 201,
    },
    {
      id: "project-services",
      label: "Proje, Danışmanlık ve Kontrollük",
      group: "soft",
      description: "Mimari, statik, MEP proje hizmetleri ve kontrollük giderleri.",
      amount: projectServicesAmount,
      share: 0,
      notes: ["Metraj, proje çizimleri, yapı denetim ve kontrollük etkisi."],
      isOverridden: false,
      isHighImpact: false,
      order: 202,
    },
    {
      id: "insurance-lab",
      label: "Sigorta, Laboratuvar ve SGK",
      group: "soft",
      description: "Yapı denetim laboratuvarları, İSG ve asgari işçilik primleri.",
      amount: insuranceLabAmount,
      share: 0,
      notes: ["Yapı denetim, laboratuvar ve SGK etkisi."],
      isOverridden: false,
      isHighImpact: false,
      order: 203,
    },
  ];
  const softCost = sum(softItems.map((item) => item.amount));

  const subtotalBase = directCost + indirectCost + softCost;
  const contingencyAmount = subtotalBase * scenario.inputs.commercial.contingencyRate;
  const contractorProfileAdjustment =
    subtotalBase * Math.abs(1 - CONTRACTOR_PROFILES[scenario.inputs.commercial.contractorProfile].riskFactor) * 0.35;
  const contractorMarginAmount =
    (subtotalBase + contingencyAmount + contractorProfileAdjustment) *
    scenario.inputs.commercial.contractorMarginRate;
  const subtotalBeforeVat =
    subtotalBase + contingencyAmount + contractorProfileAdjustment + contractorMarginAmount;
  const vatAmount = subtotalBeforeVat * scenario.inputs.commercial.vatRate;
  const grandTotal = subtotalBeforeVat + vatAmount;

  const commercialItems: CostItem[] = [
    {
      id: "contingency",
      label: "Risk ve Beklenmeyen Gider",
      group: "commercial",
      description: "Fiyat sapması, termin riski ve proje belirsizliği payı.",
      amount: contingencyAmount,
      share: 0,
      notes: [`Contingency oranı ${formatYuzde(scenario.inputs.commercial.contingencyRate)}`],
      isOverridden: false,
      isHighImpact: false,
      order: 301,
    },
    {
      id: "contractor-profile",
      label: "Organizasyon Profili Etkisi",
      group: "commercial",
      description: "Seçilen yüklenici ölçeğinin süreç ve kontrol maliyeti etkisi.",
      amount: contractorProfileAdjustment,
      share: 0,
      notes: [CONTRACTOR_PROFILES[scenario.inputs.commercial.contractorProfile].note],
      isOverridden: false,
      isHighImpact: false,
      order: 302,
    },
    {
      id: "contractor-margin",
      label: "Müteahhit Kârı",
      group: "commercial",
      description: "Ticari hedef marj katmanı.",
      amount: contractorMarginAmount,
      share: 0,
      notes: [`Kâr oranı ${formatYuzde(scenario.inputs.commercial.contractorMarginRate)}`],
      isOverridden: false,
      isHighImpact: false,
      order: 303,
    },
    {
      id: "vat",
      label: "KDV",
      group: "commercial",
      description: "Ticari katman sonrası uygulanan vergi.",
      amount: vatAmount,
      share: 0,
      notes: [`KDV oranı ${formatYuzde(scenario.inputs.commercial.vatRate)}`],
      isOverridden: false,
      isHighImpact: false,
      order: 304,
    },
  ];

  const lineItems = [...directItems, ...indirectItems, ...softItems, ...commercialItems]
    .sort((left, right) => left.order - right.order)
    .map((item) => ({
      ...item,
      share: grandTotal > 0 ? item.amount / grandTotal : 0,
    }))
    .map((item) => ({
      ...item,
      isHighImpact: item.share >= 0.1,
    }));

  const groups: CostGroupSummary[] = (["direct", "indirect", "soft", "commercial"] as const).map(
    (groupId) => {
      const items = lineItems.filter((item) => item.group === groupId);
      const total = sum(items.map((item) => item.amount));
      return {
        id: groupId,
        label: GROUP_LABELS[groupId].label,
        description: GROUP_LABELS[groupId].description,
        total,
        share: grandTotal > 0 ? total / grandTotal : 0,
        items,
      };
    }
  );

  const benchmark = buildBenchmarkComparison(
    scenario.inputs,
    physicalArea,
    grandTotal,
    buildReasonCandidates(scenario)
  );
  const validationIssues = validateScenarioInputs(scenario.inputs, equivalentArea, physicalArea);
  const range = buildRange(grandTotal, scenario);
  const topDrivers = buildSensitivityEntries(directCost, grandTotal, scenario).slice(0, 4);
  const activePresetLabel =
    CONSTRUCTION_COST_PRESETS.find((preset) => preset.id === scenario.presetId)?.label ?? undefined;

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    generatedAt: new Date().toISOString(),
    inputs: scenario.inputs,
    physicalArea,
    equivalentArea,
    saleableArea,
    directCost,
    indirectCost,
    softCost,
    contingencyAmount,
    contractorProfileAdjustment,
    contractorMarginAmount,
    vatAmount,
    subtotalBeforeVat,
    grandTotal,
    costPerM2: equivalentArea > 0 ? grandTotal / equivalentArea : 0,
    costPerSaleableM2: saleableArea > 0 ? grandTotal / saleableArea : 0,
    costPerUnit: scenario.inputs.unitCount > 0 ? grandTotal / scenario.inputs.unitCount : 0,
    range,
    benchmark,
    validationIssues,
    topDrivers,
    assumptions: [
      `${QUALITY_OPTIONS[scenario.inputs.qualityLevel].label} kalite paketi bütün doğrudan kalemlere yayıldı.`,
      `${REGION_OPTIONS[scenario.inputs.site.region].label} bölgesel katsayısı tüm baz fiyatlara uygulandı.`,
      `${SOIL_OPTIONS[scenario.inputs.site.soilClass].note}`,
      `${CONTRACTOR_PROFILES[scenario.inputs.commercial.contractorProfile].note}`,
      "Bu çıktı fizibilite amaçlıdır; uygulama projeleri, keşif ve gerçek teklif ile teyit edilmelidir.",
    ],
    groups,
    lineItems,
    dataSourceLine:
      "2026 resmî yaklaşık birim maliyet referansları, piyasa düzeltme katsayıları ve yapı varsayımları birlikte kullanıldı.",
    activePresetLabel,
  };
}

export function buildScenarioComparisonRows(
  scenarios: ConstructionCostScenarioSnapshot[]
): ScenarioComparisonRow[] {
  const rows = [
    {
      id: "grand-total",
      label: "Toplam maliyet",
      unit: "TL",
      getValue: (snapshot: ConstructionCostScenarioSnapshot) => snapshot.grandTotal,
    },
    {
      id: "cost-m2",
      label: "m² birim maliyet",
      unit: "TL/m²",
      getValue: (snapshot: ConstructionCostScenarioSnapshot) => snapshot.costPerM2,
    },
    {
      id: "cost-unit",
      label: "Bölüm başı maliyet",
      unit: "TL/adet",
      getValue: (snapshot: ConstructionCostScenarioSnapshot) => snapshot.costPerUnit,
    },
    {
      id: "direct",
      label: "Doğrudan yapım",
      unit: "TL",
      getValue: (snapshot: ConstructionCostScenarioSnapshot) => snapshot.directCost,
    },
    {
      id: "soft-commercial",
      label: "Yumuşak + ticari katman",
      unit: "TL",
      getValue: (snapshot: ConstructionCostScenarioSnapshot) =>
        snapshot.softCost +
        snapshot.contingencyAmount +
        snapshot.contractorProfileAdjustment +
        snapshot.contractorMarginAmount +
        snapshot.vatAmount,
    },
  ];

  return rows.map((row) => {
    const values = scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      scenarioName: scenario.scenarioName,
      value: row.getValue(scenario),
    }));
    const best = values.reduce(
      (winner, current) => (winner === null || current.value < winner.value ? current : winner),
      null as (typeof values)[number] | null
    );

    return {
      id: row.id,
      label: row.label,
      unit: row.unit,
      values,
      bestScenarioId: best?.scenarioId ?? null,
    };
  });
}

export function buildConstructionCostReport(
  collection: ScenarioCollection
): ConstructionCostReportSnapshot {
  const scenarios = collection.scenarios.map((scenario) => calculateConstructionCostScenario(scenario));
  return {
    title: "İnşaat Maliyeti Analizi",
    generatedAt: new Date().toISOString(),
    activeScenarioId: collection.activeScenarioId,
    scenarios,
    comparisonRows: buildScenarioComparisonRows(scenarios),
  };
}
