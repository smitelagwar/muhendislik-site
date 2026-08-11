import { getProvinceById, STANDARD_THICKNESSES_MM, TARGET_U_VALUES } from "@/lib/ts825/climate-data";
import { getInsulationMaterialById, INSULATION_MATERIALS } from "@/lib/ts825/materials";
import { getWallPresetById } from "@/lib/ts825/wall-presets";
import type {
  CalculationStatus,
  ClimateBucket,
  DistrictClimateOption,
  GradientPoint,
  InsulationCalculationResult,
  LayerCalculationRow,
  MaterialComparisonRow,
  ResolvedClimateLocation,
  SurfaceMoistureCheck,
  ThermalConditions,
  ThermalLayer,
} from "@/lib/ts825/types";

export const INTERNAL_SURFACE_RESISTANCE = 0.13;
export const EXTERNAL_SURFACE_RESISTANCE = 0.04;

export const DEFAULT_THERMAL_CONDITIONS: ThermalConditions = {
  indoorTemperatureC: 20,
  outdoorTemperatureC: -5.4,
  indoorRelativeHumidity: 65,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeConditions(conditions?: Partial<ThermalConditions>): ThermalConditions {
  return {
    indoorTemperatureC: clamp(
      conditions?.indoorTemperatureC ?? DEFAULT_THERMAL_CONDITIONS.indoorTemperatureC,
      5,
      35,
    ),
    outdoorTemperatureC: clamp(
      conditions?.outdoorTemperatureC ?? DEFAULT_THERMAL_CONDITIONS.outdoorTemperatureC,
      -40,
      35,
    ),
    indoorRelativeHumidity: clamp(
      conditions?.indoorRelativeHumidity ?? DEFAULT_THERMAL_CONDITIONS.indoorRelativeHumidity,
      20,
      95,
    ),
  };
}

function calculateLayerResistance(thicknessMeters: number, conductivity: number) {
  return thicknessMeters / conductivity;
}

function calculateAssemblyResistance(layers: ThermalLayer[], skipLayerId?: string) {
  const layerResistance = layers.reduce((total, layer) => {
    if (layer.id === skipLayerId) return total;
    return total + calculateLayerResistance(layer.thicknessMeters, layer.conductivity);
  }, 0);
  return INTERNAL_SURFACE_RESISTANCE + layerResistance + EXTERNAL_SURFACE_RESISTANCE;
}

function normalizeThickness(requiredResistance: number, conductivity: number) {
  if (requiredResistance <= 0) return { theoreticalMm: 0, recommendedMm: 0 };

  const theoreticalMm = requiredResistance * conductivity * 1000;
  const catalogThickness = STANDARD_THICKNESSES_MM.find((thicknessMm) => thicknessMm >= theoreticalMm);
  const recommendedMm = catalogThickness ?? Math.ceil(theoreticalMm / 20) * 20;
  return { theoreticalMm, recommendedMm };
}

function calculateDewPoint(temperatureC: number, relativeHumidity: number) {
  const a = 17.62;
  const b = 243.12;
  const gamma = Math.log(relativeHumidity / 100) + (a * temperatureC) / (b + temperatureC);
  return (b * gamma) / (a - gamma);
}

function calculateSurfaceMoistureCheck(
  totalResistance: number,
  conditions: ThermalConditions,
): SurfaceMoistureCheck {
  const heatFlux =
    (conditions.indoorTemperatureC - conditions.outdoorTemperatureC) / totalResistance;
  const internalSurfaceTemperatureC =
    conditions.indoorTemperatureC - heatFlux * INTERNAL_SURFACE_RESISTANCE;
  const dewPointC = calculateDewPoint(
    conditions.indoorTemperatureC,
    conditions.indoorRelativeHumidity,
  );
  const safetyMarginC = internalSurfaceTemperatureC - dewPointC;
  const surfaceTemperatureDifferenceC =
    conditions.indoorTemperatureC - internalSurfaceTemperatureC;

  if (safetyMarginC <= 0) {
    return {
      dewPointC,
      internalSurfaceTemperatureC,
      surfaceTemperatureDifferenceC,
      safetyMarginC,
      status: "risk",
      label: "Yüzey yoğuşma riski",
    };
  }

  if (safetyMarginC < 2 || surfaceTemperatureDifferenceC > 3) {
    return {
      dewPointC,
      internalSurfaceTemperatureC,
      surfaceTemperatureDifferenceC,
      safetyMarginC,
      status: "watch",
      label: "Sınıra yakın",
    };
  }

  return {
    dewPointC,
    internalSurfaceTemperatureC,
    surfaceTemperatureDifferenceC,
    safetyMarginC,
    status: "safe",
    label: "Yüzey güvenli",
  };
}

function calculateTemperatureGradient(
  layers: ThermalLayer[],
  conditions: ThermalConditions,
): GradientPoint[] {
  const totalResistance = calculateAssemblyResistance(layers);
  const heatFlux =
    (conditions.indoorTemperatureC - conditions.outdoorTemperatureC) / totalResistance;
  const points: GradientPoint[] = [
    { x: 0, temp: conditions.indoorTemperatureC, label: "İç ortam" },
  ];
  let currentTemperature =
    conditions.indoorTemperatureC - heatFlux * INTERNAL_SURFACE_RESISTANCE;
  let currentX = 0;

  points.push({ x: 0, temp: currentTemperature, label: "İç yüzey" });

  for (const layer of layers) {
    currentTemperature -= heatFlux * calculateLayerResistance(layer.thicknessMeters, layer.conductivity);
    currentX += layer.thicknessMeters;
    points.push({ x: currentX, temp: currentTemperature, label: layer.label });
  }

  currentTemperature -= heatFlux * EXTERNAL_SURFACE_RESISTANCE;
  points.push({ x: currentX, temp: currentTemperature, label: "Dış yüzey" });
  points.push({ x: currentX, temp: conditions.outdoorTemperatureC, label: "Dış ortam" });
  return points;
}

function calculateLayerRows(
  layers: ThermalLayer[],
  conditions: ThermalConditions,
): LayerCalculationRow[] {
  const totalResistance = calculateAssemblyResistance(layers);
  const heatFlux =
    (conditions.indoorTemperatureC - conditions.outdoorTemperatureC) / totalResistance;
  let cumulativeResistance = INTERNAL_SURFACE_RESISTANCE;

  return layers.map((layer) => {
    const resistance = calculateLayerResistance(layer.thicknessMeters, layer.conductivity);
    cumulativeResistance += resistance;
    return {
      id: layer.id,
      label: layer.label,
      thicknessMeters: layer.thicknessMeters,
      conductivity: layer.conductivity,
      resistance,
      mu: layer.mu,
      equivalentAirLayerMeters:
        layer.mu !== undefined ? layer.mu * layer.thicknessMeters : undefined,
      cumulativeResistance,
      interfaceTemperature:
        conditions.indoorTemperatureC - heatFlux * cumulativeResistance,
      isInsulation: Boolean(layer.isInsulation),
    };
  });
}

export function resolveClimateLocation(
  provinceId: string,
  districtId?: string,
): ResolvedClimateLocation | null {
  const province = getProvinceById(provinceId);
  if (!province) return null;

  if (!province.districtOptions?.length) {
    return { province, bucket: province.defaultBucket };
  }

  if (!districtId) return null;
  const districtOption = province.districtOptions.find((option) => option.id === districtId);
  if (!districtOption) return null;
  return { province, districtOption, bucket: districtOption.bucket };
}

export function provinceRequiresDistrictSelection(provinceId: string) {
  return Boolean(getProvinceById(provinceId)?.districtOptions?.length);
}

function evaluateStatus(currentUValue: number, targetUValue: number): CalculationStatus {
  if (currentUValue <= targetUValue) return "Uygun";
  if (currentUValue <= targetUValue * 1.05) return "Sınırda";
  return "Yetersiz";
}

function buildLocationLabel(location: ResolvedClimateLocation) {
  if (!location.districtOption || location.districtOption.id === "varsayilan") {
    return location.province.name;
  }
  return `${location.province.name} / ${location.districtOption.label}`;
}

function buildNarrative(
  location: ResolvedClimateLocation,
  currentUValue: number,
  targetUValue: number,
  currentThicknessMm: number,
  theoreticalThicknessMm: number,
  recommendedThicknessMm: number,
  achievedUValue: number,
  materialName: string,
  hasInsulationLayer: boolean,
) {
  const format = (value: number, maximumFractionDigits = 1) =>
    value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits });
  const locationLabel = buildLocationLabel(location);
  if (!hasInsulationLayer) {
    return `${locationLabel} için mevcut kesit U = ${format(currentUValue, 2)} W/m²K. Kalınlık hesabı için bir yalıtım katmanı seçin.`;
  }

  if (recommendedThicknessMm === 0) {
    return `${locationLabel} için yalıtımsız duvar bileşeninin kendisi ${format(targetUValue, 2)} W/m²K hedefini karşılıyor.`;
  }

  const currentCm = format(currentThicknessMm / 10);
  const theoreticalCm = format(theoreticalThicknessMm / 10);
  const recommendedCm = format(recommendedThicknessMm / 10, 0);
  const compliance = currentUValue <= targetUValue ? "karşılıyor" : "karşılamıyor";
  return `${currentCm} cm ${materialName} bulunan kesit hedefi ${compliance}. U hedefi için teorik ${theoreticalCm} cm, uygulama adımıyla en az ${recommendedCm} cm kullanıldığında U = ${format(achievedUValue, 2)} W/m²K olur.`;
}

function buildMaterialComparisonRows(
  requiredAdditionalResistance: number,
  baseResistance: number,
): MaterialComparisonRow[] {
  return INSULATION_MATERIALS.map((material) => {
    const { theoreticalMm, recommendedMm } = normalizeThickness(
      requiredAdditionalResistance,
      material.conductivity,
    );
    const achievedResistance =
      baseResistance + recommendedMm / 1000 / material.conductivity;
    return {
      material,
      theoreticalThicknessMm: theoreticalMm,
      recommendedThicknessMm: recommendedMm,
      achievedUValue: 1 / achievedResistance,
    };
  });
}

export function getDistrictOptions(provinceId: string): DistrictClimateOption[] {
  return getProvinceById(provinceId)?.districtOptions ?? [];
}

export function calculateExternalWallInsulation(
  provinceId: string,
  layers: ThermalLayer[],
  insulationLayerId?: string,
  districtId?: string,
  conditions?: Partial<ThermalConditions>,
): InsulationCalculationResult | null;
export function calculateExternalWallInsulation(
  provinceId: string,
  wallPresetId: string,
  materialId: string,
  districtId?: string,
  conditions?: Partial<ThermalConditions>,
): InsulationCalculationResult | null;
export function calculateExternalWallInsulation(
  provinceId: string,
  layersOrPresetId: ThermalLayer[] | string,
  insulationLayerOrMaterialId?: string,
  districtId?: string,
  conditionsInput?: Partial<ThermalConditions>,
): InsulationCalculationResult | null {
  let layers: ThermalLayer[];
  let insulationLayerId: string | undefined;

  if (Array.isArray(layersOrPresetId)) {
    layers = layersOrPresetId;
    insulationLayerId = insulationLayerOrMaterialId;
  } else {
    const preset = getWallPresetById(layersOrPresetId);
    const material = insulationLayerOrMaterialId
      ? getInsulationMaterialById(insulationLayerOrMaterialId)
      : null;
    if (!preset || !material) return null;

    insulationLayerId = `${preset.id}-${material.id}-insulation`;
    layers = preset.layers.map((layer, index) => ({
      ...layer,
      id: `${preset.id}-layer-${index + 1}`,
    }));
    layers.splice(Math.max(0, layers.length - 1), 0, {
      id: insulationLayerId,
      materialId: material.id,
      label: material.name,
      thicknessMeters: 0.05,
      conductivity: material.conductivity,
      mu: material.mu,
      isInsulation: true,
    });
  }

  const location = resolveClimateLocation(provinceId, districtId);
  const validLayers =
    layers.length > 0 &&
    layers.every(
      (layer) =>
        Number.isFinite(layer.thicknessMeters) &&
        layer.thicknessMeters > 0 &&
        Number.isFinite(layer.conductivity) &&
        layer.conductivity > 0,
    );
  if (!location || !validLayers) return null;

  const conditions = normalizeConditions(conditionsInput);
  const targetUValue = TARGET_U_VALUES[location.bucket];
  const insulationLayer = layers.find((layer) => layer.id === insulationLayerId);
  const baseResistance = calculateAssemblyResistance(layers, insulationLayerId);
  const baseUValue = 1 / baseResistance;
  const currentResistance = calculateAssemblyResistance(layers);
  const currentUValue = 1 / currentResistance;
  const requiredAdditionalResistance = Math.max(0, 1 / targetUValue - baseResistance);
  const normalizedThickness = insulationLayer
    ? normalizeThickness(requiredAdditionalResistance, insulationLayer.conductivity)
    : { theoreticalMm: 0, recommendedMm: 0 };
  const achievedResistance = insulationLayer
    ? baseResistance +
      normalizedThickness.recommendedMm / 1000 / insulationLayer.conductivity
    : currentResistance;
  const achievedUValue = 1 / achievedResistance;
  const recommendedLayers = layers.map((layer) =>
    layer.id === insulationLayerId
      ? { ...layer, thicknessMeters: normalizedThickness.recommendedMm / 1000 }
      : { ...layer },
  );
  const gradientLayers = recommendedLayers.filter((layer) => layer.thicknessMeters > 0);
  const currentInsulationThicknessMm = insulationLayer
    ? insulationLayer.thicknessMeters * 1000
    : 0;
  const material = insulationLayer
    ? {
        id: insulationLayer.materialId ?? insulationLayer.id,
        name: insulationLayer.label,
        conductivity: insulationLayer.conductivity,
        mu: insulationLayer.mu,
        summary: "",
      }
    : { id: "none", name: "Yalıtım katmanı seçilmedi", conductivity: 1, summary: "" };

  return {
    location,
    layers,
    recommendedLayers,
    layerRows: calculateLayerRows(layers, conditions),
    insulationLayerId,
    material,
    statusLabel: evaluateStatus(currentUValue, targetUValue),
    targetUValue,
    baseResistance,
    baseUValue,
    currentResistance,
    currentUValue,
    existingResistance: baseResistance,
    existingUValue: baseUValue,
    requiredAdditionalResistance,
    theoreticalThicknessMm: normalizedThickness.theoreticalMm,
    recommendedThicknessMm: normalizedThickness.recommendedMm,
    achievedResistance,
    achievedUValue,
    currentInsulationThicknessMm,
    materialComparison: buildMaterialComparisonRows(requiredAdditionalResistance, baseResistance),
    narrative: buildNarrative(
      location,
      currentUValue,
      targetUValue,
      currentInsulationThicknessMm,
      normalizedThickness.theoreticalMm,
      normalizedThickness.recommendedMm,
      achievedUValue,
      material.name,
      Boolean(insulationLayer),
    ),
    temperatureGradient: calculateTemperatureGradient(gradientLayers, conditions),
    conditions,
    surfaceMoistureCheck: calculateSurfaceMoistureCheck(currentResistance, conditions),
  };
}

export function getClimateBucketLabel(bucket: ClimateBucket) {
  return bucket;
}

export { getProvinceById } from "@/lib/ts825/climate-data";
