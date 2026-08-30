export interface BeamShearInput {
  fckMpa: number;
  fctdMpa?: number;
  fcdMpa?: number;
  fywdMpa?: number;
  beamWidthCm: number;
  beamHeightCm: number;
  coverMm: number;
  designShearKn: number;
  stirrupDiameterMm: number;
  stirrupLegCount: number;
}

export interface BeamShearResult {
  effectiveDepthCm: number;
  concreteShearResistanceKn: number;
  maxShearLimitKn: number;
  stirrupShearDemandKn: number;
  singleLegAreaMm2: number;
  totalStirrupAreaMm2: number;
  calculatedSpacingCm: number;
  confinedZoneSpacingLimitCm: number;
  spanZoneSpacingLimitCm: number;
  recommendedConfinedSpacingCm: number;
  recommendedSpanSpacingCm: number;
  isVmaxSafe: boolean;
  status: "safe" | "exceeded_vmax";
  notes: string[];
}

export function calculateBeamShear(input: BeamShearInput): BeamShearResult | null {
  const {
    fckMpa,
    fctdMpa = (0.35 * Math.sqrt(fckMpa)) / 1.5,
    fcdMpa = fckMpa / 1.5,
    fywdMpa = 365,
    beamWidthCm,
    beamHeightCm,
    coverMm,
    designShearKn,
    stirrupDiameterMm,
    stirrupLegCount,
  } = input;

  if (
    [fckMpa, beamWidthCm, beamHeightCm, coverMm, designShearKn, stirrupDiameterMm, stirrupLegCount].some(
      (val) => !Number.isFinite(val) || val <= 0
    )
  ) {
    return null;
  }

  const effectiveDepthCm = Math.max(5, beamHeightCm - coverMm / 10);
  const dMm = effectiveDepthCm * 10;
  const bwMm = beamWidthCm * 10;

  // TS 500 Beton Kesme Dayanımı Vc = 0.8 * fctd * bw * d
  const vcN = 0.8 * fctdMpa * bwMm * dMm;
  const concreteShearResistanceKn = vcN / 1000;

  // TS 500 Maksimum Kesme Sınırı (Gövde Basınç Kırılması) Vmax = 0.22 * fcd * bw * d
  const vmaxN = 0.22 * fcdMpa * bwMm * dMm;
  const maxShearLimitKn = vmaxN / 1000;

  // Donatı kesit alanları
  const singleLegAreaMm2 = (Math.PI * stirrupDiameterMm * stirrupDiameterMm) / 4;
  const totalStirrupAreaMm2 = singleLegAreaMm2 * stirrupLegCount;

  // Etriyeye kalan kesme kuvveti
  const vdN = designShearKn * 1000;
  const vwNeededN = Math.max(0, vdN - vcN);
  const stirrupShearDemandKn = vwNeededN / 1000;

  // Gerekli etriye aralığı s = (Asw * fywd * d) / Vw
  let calculatedSpacingCm: number;
  if (vwNeededN > 0) {
    const sMm = (totalStirrupAreaMm2 * fywdMpa * dMm) / vwNeededN;
    calculatedSpacingCm = Math.max(5, Math.floor((sMm / 10) * 10) / 10);
  } else {
    calculatedSpacingCm = 20; // Minimum konstrüktif aralık
  }

  // TBDY 2018 ve TS 500 sarılma ve orta bölge limitleri
  const confinedZoneSpacingLimitCm = Math.min(Math.floor(beamHeightCm / 4), 10);
  const spanZoneSpacingLimitCm = Math.min(Math.floor(effectiveDepthCm / 2), 20);

  const recommendedConfinedSpacingCm = Math.max(
    5,
    Math.min(Math.floor(calculatedSpacingCm), confinedZoneSpacingLimitCm)
  );
  const recommendedSpanSpacingCm = Math.max(
    5,
    Math.min(Math.floor(calculatedSpacingCm), spanZoneSpacingLimitCm)
  );

  const isVmaxSafe = designShearKn <= maxShearLimitKn;
  const status: "safe" | "exceeded_vmax" = isVmaxSafe ? "safe" : "exceeded_vmax";

  const notes: string[] = [
    `Betonun kesme katkısı Vc = ${concreteShearResistanceKn.toFixed(1)} kN.`,
    isVmaxSafe
      ? `Kesit gövde ezilme tahkiki Vmax = ${maxShearLimitKn.toFixed(1)} kN (Sağlandı).`
      : `UYARI: Vd (${designShearKn} kN) > Vmax (${maxShearLimitKn.toFixed(1)} kN)! Kesit boyutları (bw x h) büyütülmelidir.`,
    `TBDY 2018 gereği mesnet sarılma bölgesinde etriye aralığı en fazla ${confinedZoneSpacingLimitCm} cm olmalıdır.`,
  ];

  return {
    effectiveDepthCm,
    concreteShearResistanceKn,
    maxShearLimitKn,
    stirrupShearDemandKn,
    singleLegAreaMm2,
    totalStirrupAreaMm2,
    calculatedSpacingCm,
    confinedZoneSpacingLimitCm,
    spanZoneSpacingLimitCm,
    recommendedConfinedSpacingCm,
    recommendedSpanSpacingCm,
    isVmaxSafe,
    status,
    notes,
  };
}
