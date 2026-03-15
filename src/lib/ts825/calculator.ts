import { getProvinceById, STANDARD_THICKNESSES_MM, TARGET_U_VALUES } from "@/lib/ts825/climate-data";
import { getInsulationMaterialById, INSULATION_MATERIALS } from "@/lib/ts825/materials";
import { getWallPresetById } from "@/lib/ts825/wall-presets";
import type {
  CalculationStatus,
  ClimateBucket,
  DistrictClimateOption,
  InsulationCalculationResult,
  MaterialComparisonRow,
  ResolvedClimateLocation,
} from "@/lib/ts825/types";

const INTERNAL_SURFACE_RESISTANCE = 0.13;
const EXTERNAL_SURFACE_RESISTANCE = 0.04;

function calculateLayerResistance(thicknessMeters: number, conductivity: number) {
  return thicknessMeters / conductivity;
}

function normalizeThickness(requiredResistance: number, conductivity: number) {
  if (requiredResistance <= 0) {
    return { theoreticalMm: 0, recommendedMm: 0 };
  }

  const theoreticalMm = requiredResistance * conductivity * 1000;
  const recommendedMm = STANDARD_THICKNESSES_MM.find((thicknessMm) => thicknessMm >= theoreticalMm) ?? STANDARD_THICKNESSES_MM[STANDARD_THICKNESSES_MM.length - 1];

  return { theoreticalMm, recommendedMm };
}

function calculateExistingResistance(wallPresetId: string) {
  const wallPreset = getWallPresetById(wallPresetId);

  if (!wallPreset) {
    return null;
  }

  const layersResistance = wallPreset.layers.reduce((total, layer) => {
    return total + calculateLayerResistance(layer.thicknessMeters, layer.conductivity);
  }, 0);

  const existingResistance = INTERNAL_SURFACE_RESISTANCE + EXTERNAL_SURFACE_RESISTANCE + layersResistance;

  return {
    wallPreset,
    existingResistance,
    existingUValue: 1 / existingResistance,
  };
}

export function resolveClimateLocation(provinceId: string, districtId?: string): ResolvedClimateLocation | null {
  const province = getProvinceById(provinceId);

  if (!province) {
    return null;
  }

  if (!province.districtOptions?.length) {
    return {
      province,
      bucket: province.defaultBucket,
    };
  }

  if (!districtId) {
    return null;
  }

  const districtOption = province.districtOptions.find((option) => option.id === districtId);

  if (!districtOption) {
    return null;
  }

  return {
    province,
    districtOption,
    bucket: districtOption.bucket,
  };
}

export function provinceRequiresDistrictSelection(provinceId: string) {
  return Boolean(getProvinceById(provinceId)?.districtOptions?.length);
}

function evaluateStatus(existingUValue: number, targetUValue: number): CalculationStatus {
  const ratio = existingUValue / targetUValue;

  if (ratio <= 1) {
    return "Uygun";
  }

  if (ratio <= 1.15) {
    return "Sınırda";
  }

  if (ratio <= 1.5) {
    return "Enerji verimliliği açısından geliştirilebilir";
  }

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
  targetUValue: number,
  theoreticalThicknessMm: number,
  recommendedThicknessMm: number,
  materialName: string,
) {
  const locationLabel = buildLocationLabel(location);
  const bucketLabel = location.bucket;

  if (recommendedThicknessMm <= 0) {
    return `TS 825:2024'e göre ${locationLabel} için ${bucketLabel}. iklim grubu hedefi baz alındığında mevcut duvar kurgusu ${targetUValue.toFixed(2)} W/m²K sınırını zaten karşılıyor; ilave ${materialName} yalıtımı zorunlu görünmüyor.`;
  }

  return `TS 825:2024'e göre ${locationLabel} için ${bucketLabel}. iklim grubu ve ${materialName} seçimi baz alındığında dış cephede teorik minimum ${(theoreticalThicknessMm / 10).toFixed(1)} cm, uygulamada ise en az ${recommendedThicknessMm / 10} cm önerilir.`;
}

function buildMaterialComparisonRows(
  requiredAdditionalResistance: number,
  existingResistance: number,
): MaterialComparisonRow[] {
  return INSULATION_MATERIALS.map((material) => {
    const { theoreticalMm, recommendedMm } = normalizeThickness(requiredAdditionalResistance, material.conductivity);
    const achievedResistance = existingResistance + recommendedMm / 1000 / material.conductivity;

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
  wallPresetId: string,
  materialId: string,
  districtId?: string,
): InsulationCalculationResult | null {
  const location = resolveClimateLocation(provinceId, districtId);
  const material = getInsulationMaterialById(materialId);
  const wallData = calculateExistingResistance(wallPresetId);

  if (!location || !material || !wallData) {
    return null;
  }

  const targetUValue = TARGET_U_VALUES[location.bucket];

  // TS 825 yaklaşımı: gerekli ek direnç = hedef toplam direnç - mevcut toplam direnç.
  const requiredAdditionalResistance = Math.max(0, 1 / targetUValue - wallData.existingResistance);
  const normalizedThickness = normalizeThickness(requiredAdditionalResistance, material.conductivity);
  const achievedResistance =
    wallData.existingResistance + normalizedThickness.recommendedMm / 1000 / material.conductivity;
  const achievedUValue = 1 / achievedResistance;

  return {
    location,
    wallPreset: wallData.wallPreset,
    material,
    statusLabel: evaluateStatus(wallData.existingUValue, targetUValue),
    targetUValue,
    existingResistance: wallData.existingResistance,
    existingUValue: wallData.existingUValue,
    requiredAdditionalResistance,
    theoreticalThicknessMm: normalizedThickness.theoreticalMm,
    recommendedThicknessMm: normalizedThickness.recommendedMm,
    achievedUValue,
    materialComparison: buildMaterialComparisonRows(requiredAdditionalResistance, wallData.existingResistance),
    narrative: buildNarrative(
      location,
      targetUValue,
      normalizedThickness.theoreticalMm,
      normalizedThickness.recommendedMm,
      material.name,
    ),
  };
}

export function getClimateBucketLabel(bucket: ClimateBucket) {
  return bucket;
}

export { getProvinceById } from "@/lib/ts825/climate-data";
