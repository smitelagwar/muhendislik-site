export interface SteelSectionData {
  name: string;
  family: "IPE" | "HEA" | "HEB";
  hMm: number;
  bMm: number;
  tfMm: number;
  twMm: number;
  areaCm2: number;
  iyCm: number;
  izCm: number;
  wplYCm3: number;
  welYCm3: number;
  weightKgM: number;
}

export const STEEL_PROFILES_DATABASE: SteelSectionData[] = [
  { name: "IPE 140", family: "IPE", hMm: 140, bMm: 73, tfMm: 6.9, twMm: 4.7, areaCm2: 16.4, iyCm: 5.74, izCm: 1.65, wplYCm3: 88.3, welYCm3: 77.3, weightKgM: 12.9 },
  { name: "IPE 160", family: "IPE", hMm: 160, bMm: 82, tfMm: 7.4, twMm: 5.0, areaCm2: 20.1, iyCm: 6.58, izCm: 1.84, wplYCm3: 123.9, welYCm3: 109.0, weightKgM: 15.8 },
  { name: "IPE 180", family: "IPE", hMm: 180, bMm: 91, tfMm: 8.0, twMm: 5.3, areaCm2: 23.9, iyCm: 7.42, izCm: 2.05, wplYCm3: 166.4, welYCm3: 146.0, weightKgM: 18.8 },
  { name: "IPE 200", family: "IPE", hMm: 200, bMm: 100, tfMm: 8.5, twMm: 5.6, areaCm2: 28.5, iyCm: 8.26, izCm: 2.24, wplYCm3: 220.6, welYCm3: 194.0, weightKgM: 22.4 },
  { name: "IPE 220", family: "IPE", hMm: 220, bMm: 110, tfMm: 9.2, twMm: 5.9, areaCm2: 33.4, iyCm: 9.11, izCm: 2.48, wplYCm3: 285.4, welYCm3: 252.0, weightKgM: 26.2 },
  { name: "IPE 240", family: "IPE", hMm: 240, bMm: 120, tfMm: 9.8, twMm: 6.2, areaCm2: 39.1, iyCm: 9.97, izCm: 2.69, wplYCm3: 366.6, welYCm3: 324.0, weightKgM: 30.7 },
  { name: "IPE 270", family: "IPE", hMm: 270, bMm: 135, tfMm: 10.2, twMm: 6.6, areaCm2: 45.9, iyCm: 11.2, izCm: 3.02, wplYCm3: 484.0, welYCm3: 429.0, weightKgM: 36.1 },
  { name: "IPE 300", family: "IPE", hMm: 300, bMm: 150, tfMm: 10.7, twMm: 7.1, areaCm2: 53.8, iyCm: 12.5, izCm: 3.35, wplYCm3: 628.4, welYCm3: 557.0, weightKgM: 42.2 },
  { name: "HEA 160", family: "HEA", hMm: 152, bMm: 160, tfMm: 9.0, twMm: 6.0, areaCm2: 38.8, iyCm: 6.57, izCm: 3.98, wplYCm3: 245.2, welYCm3: 220.0, weightKgM: 30.4 },
  { name: "HEA 200", family: "HEA", hMm: 190, bMm: 200, tfMm: 10.0, twMm: 6.5, areaCm2: 53.8, iyCm: 8.28, izCm: 4.98, wplYCm3: 429.5, welYCm3: 389.0, weightKgM: 42.3 },
  { name: "HEA 240", family: "HEA", hMm: 230, bMm: 240, tfMm: 12.0, twMm: 7.5, areaCm2: 76.8, iyCm: 10.1, izCm: 6.00, wplYCm3: 744.6, welYCm3: 675.0, weightKgM: 60.3 },
  { name: "HEB 200", family: "HEB", hMm: 200, bMm: 200, tfMm: 15.0, twMm: 9.0, areaCm2: 78.1, iyCm: 8.54, izCm: 5.07, wplYCm3: 642.5, welYCm3: 570.0, weightKgM: 61.3 },
];

export interface SteelProfileInput {
  profileName: string;
  steelYieldFyMpa: number; // S235=235, S275=275, S355=355
  bucklingLengthM: number;
  axialCompressionNdKn?: number;
  bendingMomentMdKnm?: number;
  shearForceVdKn?: number;
}

export interface SteelProfileResult {
  profile: SteelSectionData;
  slendernessLambda: number;
  isSlendernessSafe: boolean;
  bucklingReductionFactorChi: number;
  compressionCapacityNbRdKn: number;
  bendingCapacityMcRdKnm: number;
  shearCapacityVcRdKn: number;
  utilizationCompression: number;
  utilizationBending: number;
  utilizationShear: number;
  utilizationCombined: number;
  isOverallSafe: boolean;
  status: "safe" | "exceeded";
  notes: string[];
}

export function calculateSteelProfile(input: SteelProfileInput): SteelProfileResult | null {
  const {
    profileName,
    steelYieldFyMpa: fy,
    bucklingLengthM: LkM,
    axialCompressionNdKn: NdKn = 0,
    bendingMomentMdKnm: MdKnm = 0,
    shearForceVdKn: VdKn = 0,
  } = input;

  const profile = STEEL_PROFILES_DATABASE.find((p) => p.name === profileName) ?? STEEL_PROFILES_DATABASE[6]; // default IPE 270

  if (LkM <= 0 || fy <= 0) return null;

  const gammaM0 = 1.0;
  const fyd = fy / gammaM0;
  const areaMm2 = profile.areaCm2 * 100;
  const izMm = profile.izCm * 10;
  const wplYMm3 = profile.wplYCm3 * 1000;

  // Narinlik: lambda = Lk / iz
  const LkMm = LkM * 1000;
  const slendernessLambda = LkMm / izMm;
  const isSlendernessSafe = slendernessLambda <= 150; // ÇYTHYE 2018 basınç çubuğu narinlik sınırı

  // ÇYTHYE 2018 / TS EN 1993-1-1 Eğrisi b (alpha=0.34)
  const lambda1 = Math.PI * Math.sqrt(210000 / fy);
  const lambdaRel = slendernessLambda / lambda1;
  const alpha = 0.34;
  const phi = 0.5 * (1 + alpha * (lambdaRel - 0.2) + lambdaRel * lambdaRel);
  const bucklingReductionFactorChi = Math.min(
    1.0,
    1 / (phi + Math.sqrt(Math.max(0, phi * phi - lambdaRel * lambdaRel)))
  );

  // Basınç Taşıma Gücü: Nb,Rd = chi * A * fyd
  const compressionCapacityNbRdKn = (bucklingReductionFactorChi * areaMm2 * fyd) / 1000;

  // Eğilme Momenti Taşıma Gücü: Mc,Rd = Wpl * fyd
  const bendingCapacityMcRdKnm = (wplYMm3 * fyd) / 1e6;

  // Kesme Kapasitesi (Gövde alanı üzerinden yaklaşık): Vc,Rd = (h * tw * fyd) / (sqrt(3))
  const webAreaMm2 = profile.hMm * profile.twMm;
  const shearCapacityVcRdKn = (webAreaMm2 * fyd) / (Math.sqrt(3) * 1000);

  const utilizationCompression = NdKn > 0 ? NdKn / compressionCapacityNbRdKn : 0;
  const utilizationBending = MdKnm > 0 ? MdKnm / bendingCapacityMcRdKnm : 0;
  const utilizationShear = VdKn > 0 ? VdKn / shearCapacityVcRdKn : 0;
  const utilizationCombined = utilizationCompression + utilizationBending;

  const isOverallSafe =
    isSlendernessSafe &&
    utilizationCompression <= 1.0 &&
    utilizationBending <= 1.0 &&
    utilizationShear <= 1.0 &&
    utilizationCombined <= 1.0;

  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `Profil: ${profile.name} (${profile.weightKgM} kg/m), Çelik Sınıfı: fy = ${fy} MPa.`,
    `Narinlik: λ = ${slendernessLambda.toFixed(1)} ${isSlendernessSafe ? "(≤ 150 Sağlandı)" : "(> 150 Aşım!)"}.`,
    `Tasarım Kapasiteleri: Nb,Rd = ${compressionCapacityNbRdKn.toFixed(1)} kN, Mc,Rd = ${bendingCapacityMcRdKnm.toFixed(1)} kNm, Vc,Rd = ${shearCapacityVcRdKn.toFixed(1)} kN.`,
    isOverallSafe
      ? `Bileşik eğilme ve eksenel basınç oranı: %${(utilizationCombined * 100).toFixed(1)} (Güvenli).`
      : `UYARI: Kapasite aşımı tespit edildi (Kombine: %${(utilizationCombined * 100).toFixed(1)})! Profil kesiti büyütülmelidir.`,
  ];

  return {
    profile,
    slendernessLambda,
    isSlendernessSafe,
    bucklingReductionFactorChi,
    compressionCapacityNbRdKn,
    bendingCapacityMcRdKnm,
    shearCapacityVcRdKn,
    utilizationCompression,
    utilizationBending,
    utilizationShear,
    utilizationCombined,
    isOverallSafe,
    status,
    notes,
  };
}
