// TS 500 / TBDY 2018 Kiriş Kesme Güvenliği ve Etriye Hesabı Motoru

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
  concreteShearResistanceKn: number; // Vc
  maxShearLimitKn: number; // Vmax (Gövde ezilme sınırı)
  stirrupShearDemandKn: number; // Vw = Vd - Vc
  singleLegAreaMm2: number;
  totalStirrupAreaMm2: number; // Asw
  aswPerSRequiredMm2PerM: number; // Gerekli Asw / s (mm2/m)
  calculatedSpacingCm: number;
  confinedZoneSpacingLimitCm: number;
  spanZoneSpacingLimitCm: number;
  recommendedConfinedSpacingCm: number;
  recommendedSpanSpacingCm: number;
  isVmaxSafe: boolean;
  isSpacingSafe: boolean;
  isOverallSafe: boolean;
  status: "safe" | "exceeded_vmax" | "spacing_too_dense";
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
    ) ||
    beamHeightCm * 10 <= coverMm + 20
  ) {
    return null;
  }

  const effectiveDepthCm = beamHeightCm - coverMm / 10;
  if (effectiveDepthCm <= 0) return null;

  const dMm = effectiveDepthCm * 10;
  const bwMm = beamWidthCm * 10;

  // 1. TS 500 Beton Kesme Dayanımı Vc = 0.8 * fctd * bw * d
  const vcN = 0.8 * fctdMpa * bwMm * dMm;
  const concreteShearResistanceKn = vcN / 1000;

  // 2. TS 500 Maksimum Kesme Sınırı (Gövde Basınç Ezilmesi) Vmax = 0.22 * fcd * bw * d
  const vmaxN = 0.22 * fcdMpa * bwMm * dMm;
  const maxShearLimitKn = vmaxN / 1000;

  // 3. Donatı Kesit Alanları (Asw)
  const singleLegAreaMm2 = (Math.PI * stirrupDiameterMm * stirrupDiameterMm) / 4;
  const totalStirrupAreaMm2 = singleLegAreaMm2 * stirrupLegCount;

  // 4. Etriyeye Kalan Kesme Talebi (Vw = Vd - Vc)
  const vdN = designShearKn * 1000;
  const vwNeededN = Math.max(0, vdN - vcN);
  const stirrupShearDemandKn = vwNeededN / 1000;

  // 5. Gerekli Asw / s oranı (mm2 / m)
  const aswPerSRequiredMm2PerM = (vwNeededN / (fywdMpa * dMm)) * 1000;

  // 6. Gerekli Etriye Aralığı s (cm)
  let rawSpacingMm: number;
  if (vwNeededN > 0) {
    rawSpacingMm = (totalStirrupAreaMm2 * fywdMpa * dMm) / vwNeededN;
  } else {
    // Minimum konstrüktif etriye şartı: ro_w >= 0.3 * fctd / fywd
    const minAswPerS = (0.3 * (fctdMpa / fywdMpa) * bwMm); // mm2 / mm
    rawSpacingMm = totalStirrupAreaMm2 / (minAswPerS || 1);
  }

  const calculatedSpacingCm = Number((rawSpacingMm / 10).toFixed(1));

  // 7. TBDY 2018 & TS 500 Yönetmelik Aralık Sınırları
  // Sarılma bölgesi: s <= min(h/4, 8*phi_boyuna, 10 cm)
  const confinedZoneSpacingLimitCm = Math.min(Math.floor(beamHeightCm / 4), 10);
  // Orta açıklık: s <= min(d/2, 20 cm)
  const spanZoneSpacingLimitCm = Math.min(Math.floor(effectiveDepthCm / 2), 20);

  // Uygulanabilir aralıklar (Min pratik sınır 5 cm)
  const isSpacingSafe = calculatedSpacingCm >= 5.0;
  const isVmaxSafe = designShearKn <= maxShearLimitKn;
  const isOverallSafe = isVmaxSafe && isSpacingSafe;

  const recommendedConfinedSpacingCm = Math.max(5, Math.min(Math.floor(calculatedSpacingCm), confinedZoneSpacingLimitCm));
  const recommendedSpanSpacingCm = Math.max(5, Math.min(Math.floor(calculatedSpacingCm), spanZoneSpacingLimitCm));

  let status: "safe" | "exceeded_vmax" | "spacing_too_dense";
  if (!isVmaxSafe) {
    status = "exceeded_vmax";
  } else if (!isSpacingSafe) {
    status = "spacing_too_dense";
  } else {
    status = "safe";
  }

  const notes: string[] = [
    `Beton kesme katkısı: Vc = ${concreteShearResistanceKn.toFixed(1)} kN, Kesit üst limiti: Vmax = ${maxShearLimitKn.toFixed(1)} kN.`,
  ];

  if (!isVmaxSafe) {
    notes.push(`UYARI: Tasarım kesme kuvveti Vd = ${designShearKn} kN > Vmax = ${maxShearLimitKn.toFixed(1)} kN gövde basınç ezilme sınırını aşıyor! Kiriş genişliği (bw) veya yüksekliği (h) büyütülmelidir.`);
  }

  if (!isSpacingSafe) {
    notes.push(`UYARI: Gerekli etriye aralığı s = ${calculatedSpacingCm} cm < 5 cm minimum sınırının altındadır! Donatı sıkışmasını önlemek için etriye çapı (Ø${stirrupDiameterMm} yerine Ø${stirrupDiameterMm + 2}), bacak sayısı veya kiriş kesiti artırılmalıdır.`);
  } else {
    notes.push(`Önerilen Etriye: Sarılma Bölgesinde Ø${stirrupDiameterMm}/${recommendedConfinedSpacingCm} cm, Orta Açıklıkta Ø${stirrupDiameterMm}/${recommendedSpanSpacingCm} cm (${stirrupLegCount} kollu).`);
  }

  return {
    effectiveDepthCm: Number(effectiveDepthCm.toFixed(1)),
    concreteShearResistanceKn: Number(concreteShearResistanceKn.toFixed(1)),
    maxShearLimitKn: Number(maxShearLimitKn.toFixed(1)),
    stirrupShearDemandKn: Number(stirrupShearDemandKn.toFixed(1)),
    singleLegAreaMm2: Number(singleLegAreaMm2.toFixed(1)),
    totalStirrupAreaMm2: Number(totalStirrupAreaMm2.toFixed(1)),
    aswPerSRequiredMm2PerM: Number(aswPerSRequiredMm2PerM.toFixed(1)),
    calculatedSpacingCm,
    confinedZoneSpacingLimitCm,
    spanZoneSpacingLimitCm,
    recommendedConfinedSpacingCm,
    recommendedSpanSpacingCm,
    isVmaxSafe,
    isSpacingSafe,
    isOverallSafe,
    status,
    notes,
  };
}
