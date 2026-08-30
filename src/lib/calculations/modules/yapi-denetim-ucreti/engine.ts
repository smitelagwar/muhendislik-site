import {
  REGIONAL_DISCOUNT_OPTIONS,
  SCOPE_REVIEW_AREA_THRESHOLD,
  SMALL_BUILDING_AREA_THRESHOLD,
  SMALL_BUILDING_MAX_RATE,
  YAPI_DENETIM_EFFECTIVE_YEAR,
  YAPI_DENETIM_RATE_TABLE,
  YAPI_DENETIM_UNIT_COSTS,
  YAPI_DENETIM_VAT_RATE,
  getAreaBandLabel,
  resolveAreaBand,
} from "./constants";
import type {
  AreaBandKey,
  InspectionBuildingClassGroup,
  InspectionGroupCode,
  ProjectDurationYears,
  RegionalDiscountType,
  YapiDenetimCalculationResult,
  YapiDenetimInput,
  YapiDenetimSemanticFlags,
  YapiDenetimSmallBuildingResult,
} from "./types";

export const MAX_SAFE_CONSTRUCTION_AREA = 10_000_000; // 10 milyon m² teknik üst sınır

export interface YapiDenetimValidationSuccess {
  readonly isValid: true;
  readonly data: YapiDenetimInput;
}

export interface YapiDenetimValidationFailure {
  readonly isValid: false;
  readonly errors: readonly string[];
}

export type YapiDenetimValidationResult =
  | YapiDenetimValidationSuccess
  | YapiDenetimValidationFailure;

const VALID_CLASS_BANDS: readonly InspectionBuildingClassGroup[] = ["I_II", "III", "IV_V"];
const VALID_DURATIONS: readonly ProjectDurationYears[] = [1, 2, 3, 4, 5];
const VALID_REGIONS: readonly RegionalDiscountType[] = [
  "normal",
  "endustri",
  "osb",
  "tgb",
  "serbest",
  "sanayi_sitesi",
];

const GROUP_CODE_MAP: Record<InspectionBuildingClassGroup, InspectionGroupCode> = {
  I_II: "Grup I",
  III: "Grup II",
  IV_V: "Grup III",
};

/**
 * Girdi modelini doğrular ve tip güvenliğini sağlar.
 */
export function validateYapiDenetimInput(input: unknown): YapiDenetimValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { isValid: false, errors: ["Geçerli bir hesaplama girdisi sağlanmalıdır."] };
  }

  const raw = input as Partial<YapiDenetimInput>;

  if (typeof raw.area !== "number" || !Number.isFinite(raw.area) || raw.area <= 0) {
    errors.push("Yapı denetimine esas inşaat alanı sıfırdan büyük geçerli bir sayı olmalıdır.");
  } else if (raw.area > MAX_SAFE_CONSTRUCTION_AREA) {
    errors.push(`Yapı inşaat alanı ${MAX_SAFE_CONSTRUCTION_AREA.toLocaleString("tr-TR")} m² teknik sınırını aşamaz.`);
  }

  if (!raw.classBand || !VALID_CLASS_BANDS.includes(raw.classBand)) {
    errors.push("Geçerli bir yapı sınıf grubu seçilmelidir (I–II. Sınıf, III. Sınıf veya IV–V. Sınıf).");
  }

  if (!raw.durationYears || !VALID_DURATIONS.includes(raw.durationYears)) {
    errors.push("Öngörülen yapım süresi 1 ile 5 yıl arasında bir tam sayı olmalıdır.");
  }

  if (!raw.region || !VALID_REGIONS.includes(raw.region)) {
    errors.push("Geçerli bir bölge türü seçilmelidir.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: {
      area: raw.area as number,
      classBand: raw.classBand as InspectionBuildingClassGroup,
      durationYears: raw.durationYears as ProjectDurationYears,
      region: raw.region as RegionalDiscountType,
    },
  };
}

/**
 * Saf hesap motoru:
 * UI, PDF, Excel, PNG veya yazdırma işlemlerinde tek doğruluk kaynağıdır.
 *
 * Sıra:
 * 1. Sınıf grubu -> Denetim Grubu (Grup I / II / III)
 * 2. Denetim Grubu -> 2026 Birim Maliyet (6.464 / 19.392 / 32.320 TL)
 * 3. Alan -> Alan Bandı (<=1000 / 1000-50000 / >50000)
 * 4. Süre + Alan Bandı -> Hizmet Oranı cetveli
 * 5. Bölge -> İndirim oranı
 * 6. Yaklaşık maliyet = Alan x Birim Maliyet
 * 7. İndirimsiz hizmet bedeli = Yaklaşık maliyet x Hizmet Oranı
 * 8. Net hizmet bedeli = İndirimsiz hizmet bedeli x (1 - İndirim Oranı)
 * 9. KDV = Net hizmet bedeli x %20
 * 10. Toplam = Net hizmet bedeli + KDV
 * 11. Alan <= 500 m² ise azami %3,50 alternatifi
 * 12. Semantik bayraklar (çok yıllı, kapsam, hakediş)
 */
export function calculateYapiDenetimFee(input: YapiDenetimInput): YapiDenetimCalculationResult {
  const validation = validateYapiDenetimInput(input);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(" "));
  }

  const { area, classBand, durationYears, region } = validation.data;

  // 1 & 2. Denetim Grubu ve 2026 Birim Maliyeti
  const inspectionGroup = GROUP_CODE_MAP[classBand];
  const unitCost = YAPI_DENETIM_UNIT_COSTS[classBand];

  // 3. Alan Bandı
  const areaBand: AreaBandKey = resolveAreaBand(area);
  const areaBandLabel = getAreaBandLabel(areaBand);

  // 4. Hizmet Bedeli Oranı (Cetvelden)
  const rateBand = YAPI_DENETIM_RATE_TABLE[durationYears];
  const serviceRate = rateBand[areaBand];

  // 5. Bölgesel İndirim Oranı
  const regionOption = REGIONAL_DISCOUNT_OPTIONS.find((r) => r.id === region);
  const discountRate = regionOption ? regionOption.discountRate : 0;

  // 6. Yapı Denetimine Esas Yaklaşık Maliyet (M = A x U)
  const approximateCost = area * unitCost;

  // 7. İndirimsiz Hizmet Bedeli (H0 = M x r)
  const baseServiceFee = approximateCost * serviceRate;

  // 8. Bölgesel İndirim Tutarı ve KDV Hariç Net Hizmet Bedeli (H = H0 x (1 - d))
  const regionalDiscountAmount = baseServiceFee * discountRate;
  const netServiceFee = baseServiceFee * (1 - discountRate);

  // 9. KDV Tutarı (KDV = H x 0.20)
  const vatRate = YAPI_DENETIM_VAT_RATE;
  const vatAmount = netServiceFee * vatRate;

  // 10. KDV Dahil Genel Toplam (TOPLAM = H + KDV)
  const grossTotal = netServiceFee + vatAmount;

  // 11. 500 m² ve altı özel hüküm (%3,50'ye kadar artırılabilme alternatifi)
  const isSmallBuilding = area <= SMALL_BUILDING_AREA_THRESHOLD;
  let smallBuilding: YapiDenetimSmallBuildingResult;

  if (isSmallBuilding) {
    const maxRate = SMALL_BUILDING_MAX_RATE;
    const maxBaseServiceFee = approximateCost * maxRate;
    const maxDiscountAmount = maxBaseServiceFee * discountRate;
    const maxNetServiceFee = maxBaseServiceFee * (1 - discountRate);
    const maxVatAmount = maxNetServiceFee * vatRate;
    const maxGrossTotal = maxNetServiceFee + maxVatAmount;

    smallBuilding = {
      applies: true,
      maxRate,
      maxBaseServiceFee,
      maxDiscountAmount,
      maxNetServiceFee,
      maxVatAmount,
      maxGrossTotal,
    };
  } else {
    smallBuilding = {
      applies: false,
      maxRate: 0,
      maxBaseServiceFee: 0,
      maxDiscountAmount: 0,
      maxNetServiceFee: 0,
      maxVatAmount: 0,
      maxGrossTotal: 0,
    };
  }

  // 12. Semantik Bayraklar
  const flags: YapiDenetimSemanticFlags = {
    isMultiYear: durationYears > 1,
    possibleScopeReview: area <= SCOPE_REVIEW_AREA_THRESHOLD,
    isOver3000: area > 3000,
    hasSmallBuildingProvision: isSmallBuilding,
  };

  return {
    input: validation.data,
    effectiveYear: YAPI_DENETIM_EFFECTIVE_YEAR,
    inspectionGroup,
    unitCost,
    areaBand,
    areaBandLabel,
    serviceRate,
    discountRate,
    vatRate,
    approximateCost,
    baseServiceFee,
    regionalDiscountAmount,
    netServiceFee,
    vatAmount,
    grossTotal,
    smallBuilding,
    flags,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Hata fırlatmayan güvenli hesaplama fonksiyonu.
 * Girdi geçersizse null döner.
 */
export function tryCalculateYapiDenetimFee(
  input: unknown
): YapiDenetimCalculationResult | null {
  try {
    const validation = validateYapiDenetimInput(input);
    if (!validation.isValid) {
      return null;
    }
    return calculateYapiDenetimFee(validation.data);
  } catch {
    return null;
  }
}
