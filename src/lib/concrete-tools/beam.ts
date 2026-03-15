import type { ConcreteStatus } from "@/lib/concrete-tools/types";

export const BEAM_CONCRETE_OPTIONS = [
  { value: "16.7", label: "C25 -> fcd = 16.7 MPa", fck: 25 },
  { value: "20", label: "C30 -> fcd = 20.0 MPa", fck: 30 },
  { value: "23.3", label: "C35 -> fcd = 23.3 MPa", fck: 35 },
  { value: "26.7", label: "C40 -> fcd = 26.7 MPa", fck: 40 },
] as const;

export const BEAM_STEEL_OPTIONS = [
  { value: "365", label: "B420C -> fyd = 365 MPa", fyk: 420 },
  { value: "435", label: "B500C -> fyd = 435 MPa", fyk: 500 },
] as const;

export const STIRRUP_DIAMETER_OPTIONS = [8, 10, 12] as const;
export const STIRRUP_LEG_OPTIONS = [2, 3, 4] as const;

function getConcreteOption(fcd: number) {
  return BEAM_CONCRETE_OPTIONS.find((option) => Number(option.value) === fcd) ?? null;
}

function getSteelOption(fyd: number) {
  return BEAM_STEEL_OPTIONS.find((option) => Number(option.value) === fyd) ?? null;
}

export interface BeamFlexureInput {
  widthMm: number;
  totalHeightMm: number;
  coverMm: number;
  stirrupDiameterMm: number;
  designMomentKnM: number;
  concreteDesignStrengthMpa: number;
  steelDesignStrengthMpa: number;
}

export interface BeamFlexureResult {
  effectiveDepthMm: number;
  kFactorMpa: number;
  requiredSteelAreaMm2: number;
  minimumSteelAreaMm2: number;
  designSteelAreaMm2: number;
  referenceKLimitMpa: number;
  status: ConcreteStatus;
}

export interface BeamShearInput {
  designShearKn: number;
  widthMm: number;
  effectiveDepthMm: number;
  concreteStrengthMpa: number;
  stirrupDiameterMm: number;
  stirrupLegCount: number;
  stirrupSpacingMm: number;
}

export interface BeamShearResult {
  shearStressMpa: number;
  shearStressLimitMpa: number;
  stirrupCapacityKn: number;
  status: ConcreteStatus;
}

export function calculateBeamFlexure(input: BeamFlexureInput): BeamFlexureResult | null {
  const {
    widthMm,
    totalHeightMm,
    coverMm,
    stirrupDiameterMm,
    designMomentKnM,
    concreteDesignStrengthMpa: fcd,
    steelDesignStrengthMpa: fyd,
  } = input;

  if (
    [widthMm, totalHeightMm, coverMm, stirrupDiameterMm, designMomentKnM, fcd, fyd].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  ) {
    return null;
  }

  const effectiveDepthMm = totalHeightMm - coverMm - stirrupDiameterMm - 10;
  if (effectiveDepthMm <= 0) {
    return null;
  }

  const concreteOption = getConcreteOption(fcd);
  const steelOption = getSteelOption(fyd);

  if (!concreteOption || !steelOption) {
    return null;
  }

  const kFactorMpa = (designMomentKnM * 1_000_000) / (widthMm * effectiveDepthMm * effectiveDepthMm);
  const requiredSteelAreaMm2 = (designMomentKnM * 1_000_000) / (fyd * 0.9 * effectiveDepthMm);
  const fctm = 0.3 * Math.pow(concreteOption.fck, 2 / 3);
  const minimumSteelAreaMm2 = 0.26 * (fctm / steelOption.fyk) * widthMm * effectiveDepthMm;
  const designSteelAreaMm2 = Math.max(requiredSteelAreaMm2, minimumSteelAreaMm2);
  const referenceKLimitMpa = 0.85 * fcd * 0.8 * 0.617 * (1 - 0.5 * 0.8 * 0.617);

  let status: ConcreteStatus;
  if (kFactorMpa > 5.5) {
    status = { tone: "fail", label: "Kesit yetersiz, toplam yüksekliği artırın." };
  } else if (kFactorMpa > 4) {
    status = { tone: "warn", label: "Moment yoğun. Çift donatı veya daha rijit kesit kontrolü yapın." };
  } else {
    status = { tone: "ok", label: "Tek donatılı çözüm ön kontrol için yeterli görünüyor." };
  }

  return {
    effectiveDepthMm,
    kFactorMpa,
    requiredSteelAreaMm2,
    minimumSteelAreaMm2,
    designSteelAreaMm2,
    referenceKLimitMpa,
    status,
  };
}

export function calculateBeamShear(input: BeamShearInput): BeamShearResult | null {
  const {
    designShearKn,
    widthMm,
    effectiveDepthMm,
    concreteStrengthMpa,
    stirrupDiameterMm,
    stirrupLegCount,
    stirrupSpacingMm,
  } = input;

  if (
    [designShearKn, widthMm, effectiveDepthMm, concreteStrengthMpa, stirrupDiameterMm, stirrupLegCount, stirrupSpacingMm].some(
      (value) => !Number.isFinite(value) || value <= 0,
    )
  ) {
    return null;
  }

  const shearStressMpa = (designShearKn * 1000) / (widthMm * effectiveDepthMm);
  const shearStressLimitMpa = 0.65 * Math.sqrt(concreteStrengthMpa);
  const stirrupAreaMm2 = stirrupLegCount * Math.PI * Math.pow(stirrupDiameterMm / 2, 2);
  const stirrupCapacityKn = ((stirrupAreaMm2 / stirrupSpacingMm) * 365 * effectiveDepthMm) / 1000;

  let status: ConcreteStatus;
  if (shearStressMpa > shearStressLimitMpa) {
    status = { tone: "fail", label: "Kesme gerilmesi sınırı aşıldı. Kesit veya beton sınıfı artırılmalı." };
  } else if (designShearKn > stirrupCapacityKn) {
    status = { tone: "warn", label: "Etriye kapasitesi yetersiz. Aralığı küçültün veya kol sayısını artırın." };
  } else {
    status = { tone: "ok", label: "Kesme kapasitesi ön kontrol için yeterli." };
  }

  return {
    shearStressMpa,
    shearStressLimitMpa,
    stirrupCapacityKn,
    status,
  };
}
