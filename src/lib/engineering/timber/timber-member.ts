// TS EN 1995-1-1 (Eurocode 5) / TS 647 Ahşap Kiriş ve Dikme (Kolon) Hesap Motoru

export type TimberGrade = "C18" | "C24" | "C30" | "GL24h";
export type LoadDurationClass = "permanent" | "medium" | "short";
export type TimberMemberType = "beam" | "post";

export interface TimberProperties {
  fmkMpa: number; // Karakteristik eğilme dayanımı fm,k
  fc0kMpa: number; // Karakteristik liflere paralel basınç dayanımı fc,0,k
  fvkMpa: number; // Karakteristik kayma dayanımı fv,k
  e0meanMpa: number; // Ortalama elastisite modülü E0,mean
  e005Mpa: number; // %5 karakteristik elastisite modülü E0,05
  gammaM: number; // Malzeme güvenlik katsayısı
}

export const TIMBER_DATA: Record<TimberGrade, TimberProperties> = {
  C18: { fmkMpa: 18, fc0kMpa: 18, fvkMpa: 3.4, e0meanMpa: 9000, e005Mpa: 6000, gammaM: 1.3 },
  C24: { fmkMpa: 24, fc0kMpa: 21, fvkMpa: 4.0, e0meanMpa: 11000, e005Mpa: 7400, gammaM: 1.3 },
  C30: { fmkMpa: 30, fc0kMpa: 24, fvkMpa: 4.0, e0meanMpa: 12000, e005Mpa: 8000, gammaM: 1.3 },
  GL24h: { fmkMpa: 24, fc0kMpa: 24, fvkMpa: 3.5, e0meanMpa: 11500, e005Mpa: 9600, gammaM: 1.25 },
};

export interface TimberMemberInput {
  grade: TimberGrade;
  durationClass: LoadDurationClass;
  memberType?: TimberMemberType;
  widthMm: number; // b (mm)
  heightMm: number; // h (mm)
  lengthM: number; // L (m)
  uniformLoadKnM?: number; // q (kN/m)
  axialLoadKn?: number; // Ned (kN)
}

export interface TimberMemberResult {
  memberType: TimberMemberType;
  fmdMpa: number;
  fc0dMpa: number;
  fvdMpa: number;
  sectionModulusWcm3: number;
  momentOfInertiaIcm4: number;
  slendernessLambda: number;
  relativeSlendernessLambdaRel: number;
  bucklingKcFactor: number;
  designBendingMomentMedKnm: number;
  bendingStressSigmaMDMpa: number;
  bendingUtilization: number;
  designShearVedKn: number;
  shearStressTauDMpa: number;
  shearUtilization: number;
  axialCompressionCapacityNcRdKn: number;
  axialUtilization: number;
  combinedUtilization: number;
  instantaneousDeflectionMm: number;
  deflectionLimitMm: number;
  isDeflectionSafe: boolean;
  isOverallSafe: boolean;
  status: "safe" | "exceeded";
  notes: string[];
}

export function calculateTimberMember(input: TimberMemberInput): TimberMemberResult | null {
  const {
    grade,
    durationClass,
    memberType = "beam",
    widthMm: b,
    heightMm: h,
    lengthM: L,
    uniformLoadKnM: q = 0,
    axialLoadKn: Ned = 0,
  } = input;

  if (b <= 0 || h <= 0 || L <= 0 || !TIMBER_DATA[grade] || q < 0 || Ned < 0) {
    return null;
  }

  const prop = TIMBER_DATA[grade];
  const kmod = durationClass === "permanent" ? 0.6 : durationClass === "medium" ? 0.8 : 0.9;

  // 1. Tasarım Dayanımları (Eurocode 5: fd = kmod * fk / gammaM)
  const fmdMpa = (kmod * prop.fmkMpa) / prop.gammaM;
  const fc0dMpa = (kmod * prop.fc0kMpa) / prop.gammaM;
  const fvdMpa = (kmod * prop.fvkMpa) / prop.gammaM;

  // 2. Kesit Geometrisi
  const areaMm2 = b * h;
  const sectionModulusWMm3 = (b * h * h) / 6;
  const momentOfInertiaIMm4 = (b * h * h * h) / 12;

  const sectionModulusWcm3 = sectionModulusWMm3 / 1000;
  const momentOfInertiaIcm4 = momentOfInertiaIMm4 / 10000;

  // 3. Narinlik ve Burkulma Hesabı (Eurocode 5 Madde 6.3.2)
  // Atalet yarıçapı i_min = min(b, h) / sqrt(12)
  const iMinMm = Math.min(b, h) / Math.sqrt(12);
  const slendernessLambda = (L * 1000) / iMinMm;

  // Göreli Narinlik lambda_rel = (lambda / pi) * sqrt(fc0k / E005)
  const lambdaRel = (slendernessLambda / Math.PI) * Math.sqrt(prop.fc0kMpa / prop.e005Mpa);

  // Burkulma katsayısı kc (Masif ahşap için beta_c = 0.2, lamine ahşap için 0.1)
  const betaC = grade === "GL24h" ? 0.1 : 0.2;
  let bucklingKcFactor = 1.0;
  if (lambdaRel > 0.3) {
    const k = 0.5 * (1 + betaC * (lambdaRel - 0.3) + lambdaRel * lambdaRel);
    bucklingKcFactor = 1 / (k + Math.sqrt(Math.max(0, k * k - lambdaRel * lambdaRel)));
    bucklingKcFactor = Math.min(1.0, Math.max(0, bucklingKcFactor));
  }

  // Eksenel Basınç Kapasitesi Nc,Rd = kc * A * fc,0,d
  const ncRdN = bucklingKcFactor * areaMm2 * fc0dMpa;
  const axialCompressionCapacityNcRdKn = ncRdN / 1000;
  const axialUtilization = axialCompressionCapacityNcRdKn > 0 ? Ned / axialCompressionCapacityNcRdKn : 0;

  // 4. Eğilme Momenti ve Kesme Kuvveti (Basit mesnetli kiriş modeli)
  const designBendingMomentMedKnm = (q * L * L) / 8;
  const designShearVedKn = (q * L) / 2;

  // Eğilme Gerilmesi: sigma_m = Med / W
  const bendingStressSigmaMDMpa = (designBendingMomentMedKnm * 1e6) / sectionModulusWMm3;
  const bendingUtilization = bendingStressSigmaMDMpa / fmdMpa;

  // Kayma Gerilmesi: tau = 1.5 * Ved / A (Dikdörtgen kesit)
  const shearStressTauDMpa = (1.5 * designShearVedKn * 1000) / areaMm2;
  const shearUtilization = shearStressTauDMpa / fvdMpa;

  // 5. Sehim Hesabı: w = 5 * q * L^4 / (384 * E * I)
  const qNPerMm = q; // 1 kN/m = 1 N/mm
  const LMm = L * 1000;
  const instantaneousDeflectionMm =
    q > 0 ? (5 * qNPerMm * Math.pow(LMm, 4)) / (384 * prop.e0meanMpa * momentOfInertiaIMm4) : 0;

  // Sehim Sınırı: L / 300
  const deflectionLimitMm = LMm / 300;
  const isDeflectionSafe = instantaneousDeflectionMm <= deflectionLimitMm;

  // 6. Birleşik Etkileşim (Eurocode 5 Denklem 6.23 & 6.24)
  const combinedUtilization = axialUtilization + bendingUtilization;
  const isOverallSafe =
    bendingUtilization <= 1.0 &&
    shearUtilization <= 1.0 &&
    axialUtilization <= 1.0 &&
    combinedUtilization <= 1.0 &&
    (memberType === "beam" ? isDeflectionSafe : true);

  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `Ahşap Sınıfı: ${grade} (${durationClass === "permanent" ? "Kalıcı Yük" : durationClass === "medium" ? "Orta Süreli Yük" : "Kısa Süreli / Deprem/Rüzgar Yükü"}, kmod = ${kmod}).`,
    `Tasarım Dayanımları: Eğilme fm,d = ${fmdMpa.toFixed(1)} MPa, Basınç fc,0,d = ${fc0dMpa.toFixed(1)} MPa, Kayma fv,d = ${fvdMpa.toFixed(2)} MPa.`,
    `Narinlik: λ = ${slendernessLambda.toFixed(1)} (Göreli Narinlik λrel = ${lambdaRel.toFixed(2)}, Burkulma Katsayısı kc = ${bucklingKcFactor.toFixed(3)}).`,
  ];

  if (Ned > 0) {
    notes.push(`Eksenel Basınç Kapasitesi: Nc,Rd = ${axialCompressionCapacityNcRdKn.toFixed(1)} kN (Kullanım: %${(axialUtilization * 100).toFixed(1)}).`);
  }
  if (q > 0) {
    notes.push(`Eğilme Kullanımı: %${(bendingUtilization * 100).toFixed(1)}, Kayma Kullanımı: %${(shearUtilization * 100).toFixed(1)}.`);
    notes.push(`Anlık Sehim: ${instantaneousDeflectionMm.toFixed(1)} mm (Sınır L/300 = ${deflectionLimitMm.toFixed(1)} mm, ${isDeflectionSafe ? "Güvenli" : "Sehim Sınırı Aşıldı!"}).`);
  }

  return {
    memberType,
    fmdMpa: Number(fmdMpa.toFixed(2)),
    fc0dMpa: Number(fc0dMpa.toFixed(2)),
    fvdMpa: Number(fvdMpa.toFixed(2)),
    sectionModulusWcm3: Number(sectionModulusWcm3.toFixed(1)),
    momentOfInertiaIcm4: Number(momentOfInertiaIcm4.toFixed(1)),
    slendernessLambda: Number(slendernessLambda.toFixed(1)),
    relativeSlendernessLambdaRel: Number(lambdaRel.toFixed(2)),
    bucklingKcFactor: Number(bucklingKcFactor.toFixed(3)),
    designBendingMomentMedKnm: Number(designBendingMomentMedKnm.toFixed(2)),
    bendingStressSigmaMDMpa: Number(bendingStressSigmaMDMpa.toFixed(2)),
    bendingUtilization: Number(bendingUtilization.toFixed(3)),
    designShearVedKn: Number(designShearVedKn.toFixed(2)),
    shearStressTauDMpa: Number(shearStressTauDMpa.toFixed(3)),
    shearUtilization: Number(shearUtilization.toFixed(3)),
    axialCompressionCapacityNcRdKn: Number(axialCompressionCapacityNcRdKn.toFixed(1)),
    axialUtilization: Number(axialUtilization.toFixed(3)),
    combinedUtilization: Number(combinedUtilization.toFixed(3)),
    instantaneousDeflectionMm: Number(instantaneousDeflectionMm.toFixed(1)),
    deflectionLimitMm: Number(deflectionLimitMm.toFixed(1)),
    isDeflectionSafe,
    isOverallSafe,
    status,
    notes,
  };
}
