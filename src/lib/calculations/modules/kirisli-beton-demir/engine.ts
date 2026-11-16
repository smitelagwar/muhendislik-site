import { calculateLaboratuvarFee } from "../laboratuvar-ucreti";
import {
  BASE_SLAB_BEAM_CONCRETE_M3_PER_M2,
  BASE_SLAB_BEAM_REBAR_KG_PER_M2,
  BASEMENT_PERIMETER_SHAPE_FACTOR,
  BASEMENT_STOREY_HEIGHT_M,
  BASEMENT_WALL_REBAR_KG_PER_M3,
  MAX_SAFE_KAKS,
  MAX_SAFE_KIRISLI_AREA_M2,
  MAX_SAFE_KIRISLI_FLOORS,
  MAX_SAFE_KIRISLI_PARCEL_M2,
  MAX_SAFE_TAKS,
  MUTEMADI_CONCRETE_RATIO_TO_RADYE,
  MUTEMADI_REBAR_KG_PER_M3,
  RADYE_REBAR_KG_PER_M3,
  STRUCTURAL_SYSTEM_COEFFICIENTS,
} from "./constants";
import type {
  KirisliBasementCount,
  KirisliBetonDemirInput,
  KirisliBetonDemirResult,
  KirisliBreakdownItem,
  KirisliFoundationType,
  KirisliStructuralSystem,
} from "./types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const VALID_SYSTEMS: readonly KirisliStructuralSystem[] = ["kolon", "kolonPerde", "sadecePerde"];
const VALID_FOUNDATIONS: readonly KirisliFoundationType[] = ["radye", "mutemadi"];
const VALID_BASEMENTS: readonly KirisliBasementCount[] = [0, 1, 2];

export interface KirisliValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly data?: KirisliBetonDemirInput;
}

export function validateKirisliInput(input: unknown): KirisliValidationResult {
  if (typeof input !== "object" || input === null) {
    return { isValid: false, errors: ["Geçerli bir hesaplama girdisi sağlanmalıdır."] };
  }

  const raw = input as Partial<KirisliBetonDemirInput>;
  const errors: string[] = [];

  if (!raw.structuralSystem || !VALID_SYSTEMS.includes(raw.structuralSystem)) {
    errors.push("Geçerli bir taşıyıcı sistem seçilmelidir.");
  }

  if (!raw.foundationType || !VALID_FOUNDATIONS.includes(raw.foundationType)) {
    errors.push("Geçerli bir temel tipi seçilmelidir.");
  }

  if (
    raw.basementFloors === undefined ||
    !VALID_BASEMENTS.includes(raw.basementFloors as KirisliBasementCount)
  ) {
    errors.push("Geçerli bir bodrum seçimi yapılmalıdır.");
  }

  if (raw.mode === "parsel") {
    if (
      typeof raw.parcelAreaM2 !== "number" ||
      !Number.isFinite(raw.parcelAreaM2) ||
      raw.parcelAreaM2 <= 0
    ) {
      errors.push("Parsel alanı sıfırdan büyük olmalıdır.");
    } else if (raw.parcelAreaM2 > MAX_SAFE_KIRISLI_PARCEL_M2) {
      errors.push("Parsel alanı teknik sınırı aşıyor.");
    }

    if (
      typeof raw.taks !== "number" ||
      !Number.isFinite(raw.taks) ||
      raw.taks <= 0 ||
      raw.taks > MAX_SAFE_TAKS
    ) {
      errors.push("TAKS 0 ile 1 arasında olmalıdır.");
    }

    if (
      typeof raw.kaks !== "number" ||
      !Number.isFinite(raw.kaks) ||
      raw.kaks <= 0 ||
      raw.kaks > MAX_SAFE_KAKS
    ) {
      errors.push("KAKS 0'dan büyük olmalıdır.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      data: {
        mode: "parsel",
        parcelAreaM2: raw.parcelAreaM2 as number,
        taks: raw.taks as number,
        kaks: raw.kaks as number,
        basementFloors: raw.basementFloors as KirisliBasementCount,
        structuralSystem: raw.structuralSystem as KirisliStructuralSystem,
        foundationType: raw.foundationType as KirisliFoundationType,
      },
    };
  }

  // Mod: "alan"
  const areaRaw = raw as Partial<Extract<KirisliBetonDemirInput, { mode: "alan" }>>;
  if (typeof areaRaw.areaM2 !== "number" || !Number.isFinite(areaRaw.areaM2) || areaRaw.areaM2 <= 0) {
    errors.push("İnşaat alanı sıfırdan büyük olmalıdır.");
  } else if (areaRaw.areaM2 > MAX_SAFE_KIRISLI_AREA_M2) {
    errors.push("İnşaat alanı teknik sınırı aşıyor.");
  }

  if (
    typeof areaRaw.normalFloors !== "number" ||
    !Number.isInteger(areaRaw.normalFloors) ||
    areaRaw.normalFloors < 1 ||
    areaRaw.normalFloors > MAX_SAFE_KIRISLI_FLOORS
  ) {
    errors.push(`Kat sayısı 1 ile ${MAX_SAFE_KIRISLI_FLOORS} arasında tam sayı olmalıdır.`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      mode: "alan",
      areaM2: areaRaw.areaM2 as number,
      normalFloors: areaRaw.normalFloors as number,
      basementFloors: areaRaw.basementFloors as KirisliBasementCount,
      structuralSystem: areaRaw.structuralSystem as KirisliStructuralSystem,
      foundationType: areaRaw.foundationType as KirisliFoundationType,
    },
  };
}

export function calculateKirisliBetonDemir(
  input: KirisliBetonDemirInput
): KirisliBetonDemirResult {
  const validation = validateKirisliInput(input);
  if (!validation.isValid || !validation.data) {
    throw new Error(validation.errors.join(" "));
  }

  const clean = validation.data;
  const basementFloors = clean.basementFloors;

  let totalAreaM2: number;
  let footprintAreaM2: number;
  let normalFloors: number;
  let totalFloors: number;

  if (clean.mode === "parsel") {
    footprintAreaM2 = clean.parcelAreaM2 * clean.taks;
    const emsalAreaM2 = clean.parcelAreaM2 * clean.kaks;
    normalFloors = clamp(Math.round(clean.kaks / clean.taks), 1, MAX_SAFE_KIRISLI_FLOORS);
    totalFloors = normalFloors + basementFloors;
    totalAreaM2 = emsalAreaM2 + basementFloors * footprintAreaM2;
  } else {
    normalFloors = clean.normalFloors;
    totalFloors = normalFloors + basementFloors;
    // Kullanıcının girdiği alan bodrum seçiliyse bodrum kat(lar)ı da kapsar
    totalAreaM2 = clean.areaM2;
    footprintAreaM2 = totalAreaM2 / totalFloors;
  }

  const sys = STRUCTURAL_SYSTEM_COEFFICIENTS[clean.structuralSystem];

  // Kat sayısına bağlı kesit büyüme katsayısı
  const floorHeightFactor = clamp(1 + (totalFloors - 3) * 0.03, 0.94, 1.35);
  const slabSpanFactor = clamp(1 + (totalFloors - 3) * 0.01, 0.97, 1.08);

  // 1. Üst Yapı + Kat Döşeme ve Kirişleri (kirişli döşeme)
  const slabBeamConcretePerM2 = BASE_SLAB_BEAM_CONCRETE_M3_PER_M2 * slabSpanFactor;
  const verticalConcretePerM2 = sys.verticalConcreteM3PerM2 * floorHeightFactor;

  const upperConcreteM3 = round2(totalAreaM2 * (slabBeamConcretePerM2 + verticalConcretePerM2));
  const slabBeamRebarKgPerM2 =
    BASE_SLAB_BEAM_REBAR_KG_PER_M2 * slabSpanFactor * sys.slabBeamRebarFactor;
  const verticalRebarKgPerM2 = verticalConcretePerM2 * sys.verticalRebarKgPerM3;
  const upperRebarTons = round2(
    (totalAreaM2 * (slabBeamRebarKgPerM2 + verticalRebarKgPerM2)) / 1000
  );

  // 2. Temel (taban oturum alanı üzerinden)
  const baseRadyeThicknessM =
    clamp(0.36 + totalFloors * 0.034, 0.4, 0.88) * sys.foundationConcreteFactor;
  const foundationThicknessM = round2(baseRadyeThicknessM);

  const foundationConcreteM3 =
    clean.foundationType === "radye"
      ? round2(footprintAreaM2 * baseRadyeThicknessM)
      : round2(footprintAreaM2 * baseRadyeThicknessM * MUTEMADI_CONCRETE_RATIO_TO_RADYE);

  const foundationRebarTons =
    clean.foundationType === "radye"
      ? round2((foundationConcreteM3 * RADYE_REBAR_KG_PER_M3) / 1000)
      : round2((foundationConcreteM3 * MUTEMADI_REBAR_KG_PER_M3) / 1000);

  // 3. Rijit Bodrum Çevre Perdesi (TBDY 2018 Madde 3.3.1)
  const perimeterM = round2(BASEMENT_PERIMETER_SHAPE_FACTOR * Math.sqrt(footprintAreaM2));
  let basementWallConcreteM3 = 0;
  let basementWallRebarTons = 0;

  if (basementFloors > 0) {
    const wallThicknessM = basementFloors === 1 ? 0.25 : 0.28;
    basementWallConcreteM3 = round2(
      perimeterM * BASEMENT_STOREY_HEIGHT_M * wallThicknessM * basementFloors
    );
    basementWallRebarTons = round2(
      (basementWallConcreteM3 * BASEMENT_WALL_REBAR_KG_PER_M3) / 1000
    );
  }

  const totalConcreteM3 = round2(upperConcreteM3 + foundationConcreteM3 + basementWallConcreteM3);
  const totalRebarTons = round2(upperRebarTons + foundationRebarTons + basementWallRebarTons);

  const concretePerM2 = round2(totalConcreteM3 / totalAreaM2);
  const rebarKgPerM2 = round2((totalRebarTons * 1000) / totalAreaM2);
  const rebarKgPerM3 = round2((totalRebarTons * 1000) / totalConcreteM3);

  const breakdown: KirisliBreakdownItem[] = [
    {
      id: "ustYapi",
      label: "Üst Yapı (Kirişli Döşeme + Düşey)",
      concreteM3: upperConcreteM3,
      rebarTons: upperRebarTons,
    },
    {
      id: "temel",
      label: clean.foundationType === "radye" ? "Radye Temel" : "Mütemadi Temel",
      concreteM3: foundationConcreteM3,
      rebarTons: foundationRebarTons,
    },
  ];

  if (basementFloors > 0) {
    breakdown.push({
      id: "bodrumPerde",
      label: `Rijit Bodrum Çevre Perdesi (${basementFloors} kat)`,
      concreteM3: basementWallConcreteM3,
      rebarTons: basementWallRebarTons,
    });
  }

  const labEstimate = calculateLaboratuvarFee({
    area: round2(totalAreaM2),
    floors: totalFloors,
    concreteGrade: "standard",
    sampleType: "cube",
    concreteM3: totalConcreteM3,
    rebarTons: totalRebarTons,
  });

  return {
    mode: clean.mode,
    totalAreaM2: round2(totalAreaM2),
    footprintAreaM2: round2(footprintAreaM2),
    normalFloors,
    basementFloors,
    totalFloors,
    structuralSystem: clean.structuralSystem,
    foundationType: clean.foundationType,
    totalConcreteM3,
    totalRebarTons,
    concretePerM2,
    rebarKgPerM2,
    rebarKgPerM3,
    foundationThicknessM,
    perimeterM,
    breakdown,
    labEstimate,
  };
}

export function tryCalculateKirisliBetonDemir(
  input: KirisliBetonDemirInput
): KirisliBetonDemirResult | null {
  try {
    return calculateKirisliBetonDemir(input);
  } catch {
    return null;
  }
}
