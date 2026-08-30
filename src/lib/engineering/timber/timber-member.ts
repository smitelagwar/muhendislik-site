export type TimberGrade = "C18" | "C24" | "C30" | "GL24h";
export type LoadDurationClass = "permanent" | "medium" | "short";

export interface TimberProperties {
  fmkMpa: number; // Eğilme dayanımı
  fc0kMpa: number; // Eksenel basınç dayanımı
  fvkMpa: number; // Kayma dayanımı
  e0meanMpa: number; // Elastisite modülü
  gammaM: number;
}

export const TIMBER_DATA: Record<TimberGrade, TimberProperties> = {
  C18: { fmkMpa: 18, fc0kMpa: 18, fvkMpa: 3.4, e0meanMpa: 9000, gammaM: 1.3 },
  C24: { fmkMpa: 24, fc0kMpa: 21, fvkMpa: 4.0, e0meanMpa: 11000, gammaM: 1.3 },
  C30: { fmkMpa: 30, fc0kMpa: 24, fvkMpa: 4.0, e0meanMpa: 12000, gammaM: 1.3 },
  GL24h: { fmkMpa: 24, fc0kMpa: 24, fvkMpa: 3.5, e0meanMpa: 11500, gammaM: 1.25 },
};

export interface TimberMemberInput {
  grade: TimberGrade;
  durationClass: LoadDurationClass;
  widthMm: number; // b
  heightMm: number; // h
  lengthM: number; // L
  uniformLoadKnM?: number; // q (kN/m)
  axialLoadKn?: number; // N (kN)
}

export interface TimberMemberResult {
  fmdMpa: number;
  fc0dMpa: number;
  fvdMpa: number;
  sectionModulusWcm3: number;
  momentOfInertiaIcm4: number;
  designBendingMomentMedKnm: number;
  bendingStressSigmaMDMpa: number;
  bendingUtilization: number;
  designShearVedKn: number;
  shearStressTauDMpa: number;
  shearUtilization: number;
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
    widthMm: b,
    heightMm: h,
    lengthM: L,
    uniformLoadKnM: q = 0,
    axialLoadKn: N = 0,
  } = input;

  if (b <= 0 || h <= 0 || L <= 0 || !TIMBER_DATA[grade]) {
    return null;
  }

  const prop = TIMBER_DATA[grade];
  const kmod = durationClass === "permanent" ? 0.6 : durationClass === "medium" ? 0.8 : 0.9;

  // Tasarım dayanımları (TS EN 1995-1-1 / TS 647)
  const fmdMpa = (kmod * prop.fmkMpa) / prop.gammaM;
  const fc0dMpa = (kmod * prop.fc0kMpa) / prop.gammaM;
  const fvdMpa = (kmod * prop.fvkMpa) / prop.gammaM;

  // Kesit Geometrisi
  const areaMm2 = b * h;
  const sectionModulusWMm3 = (b * h * h) / 6;
  const momentOfInertiaIMm4 = (b * h * h * h) / 12;

  const sectionModulusWcm3 = sectionModulusWMm3 / 1000;
  const momentOfInertiaIcm4 = momentOfInertiaIMm4 / 10000;

  // Eğilme Momenti ve Kesme Kuvveti (Basit mesnetli kiriş)
  const designBendingMomentMedKnm = (q * L * L) / 8;
  const designShearVedKn = (q * L) / 2;

  // Eğilme Gerilmesi: sigma_m = Med / W
  const bendingStressSigmaMDMpa = (designBendingMomentMedKnm * 1e6) / sectionModulusWMm3;
  const bendingUtilization = bendingStressSigmaMDMpa / fmdMpa;

  // Kayma Gerilmesi: tau = 1.5 * Ved / A
  const shearStressTauDMpa = (1.5 * designShearVedKn * 1000) / areaMm2;
  const shearUtilization = shearStressTauDMpa / fvdMpa;

  // Sehim Hesabı: w = 5 * q * L^4 / (384 * E * I)
  const qNPerMm = q; // kN/m === N/mm
  const LMm = L * 1000;
  const instantaneousDeflectionMm =
    q > 0
      ? (5 * qNPerMm * Math.pow(LMm, 4)) / (384 * prop.e0meanMpa * momentOfInertiaIMm4)
      : 0;

  // Sehim Sınırı: L / 300
  const deflectionLimitMm = LMm / 300;
  const isDeflectionSafe = instantaneousDeflectionMm <= deflectionLimitMm;

  const isOverallSafe =
    bendingUtilization <= 1.0 && shearUtilization <= 1.0 && isDeflectionSafe;

  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `Ahşap Sınıfı: ${grade} (fmd = ${fmdMpa.toFixed(1)} MPa, fvd = ${fvdMpa.toFixed(1)} MPa, kmod = ${kmod}).`,
    `Kesit: ${b}x${h} mm (W = ${sectionModulusWcm3.toFixed(0)} cm³, I = ${momentOfInertiaIcm4.toFixed(0)} cm⁴).`,
    `Eğilme Gerilmesi: ${bendingStressSigmaMDMpa.toFixed(2)} MPa / ${fmdMpa.toFixed(2)} MPa (%${(bendingUtilization * 100).toFixed(0)}).`,
    `Anlık Sehim: ${instantaneousDeflectionMm.toFixed(1)} mm (Sınır L/300 = ${deflectionLimitMm.toFixed(1)} mm - ${isDeflectionSafe ? "UYGUN" : "SEHİM AŞIMI!"}).`,
  ];

  return {
    fmdMpa,
    fc0dMpa,
    fvdMpa,
    sectionModulusWcm3,
    momentOfInertiaIcm4,
    designBendingMomentMedKnm,
    bendingStressSigmaMDMpa,
    bendingUtilization,
    designShearVedKn,
    shearStressTauDMpa,
    shearUtilization,
    instantaneousDeflectionMm,
    deflectionLimitMm,
    isDeflectionSafe,
    isOverallSafe,
    status,
    notes,
  };
}
