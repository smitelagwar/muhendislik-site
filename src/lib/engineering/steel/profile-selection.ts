// ÇYTHYE 2018 / TS EN 1993-1-1 Çelik Profil Seçimi, Çift Eksenli Narinlik ve Burkulma Kapasitesi Hesap Motoru

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
  wplZCm3: number;
  welYCm3: number;
  welZCm3: number;
  weightKgM: number;
}

export const STEEL_PROFILES_DATABASE: SteelSectionData[] = [
  { name: "IPE 140", family: "IPE", hMm: 140, bMm: 73, tfMm: 6.9, twMm: 4.7, areaCm2: 16.4, iyCm: 5.74, izCm: 1.65, wplYCm3: 88.3, wplZCm3: 19.2, welYCm3: 77.3, welZCm3: 12.3, weightKgM: 12.9 },
  { name: "IPE 160", family: "IPE", hMm: 160, bMm: 82, tfMm: 7.4, twMm: 5.0, areaCm2: 20.1, iyCm: 6.58, izCm: 1.84, wplYCm3: 123.9, wplZCm3: 26.1, welYCm3: 109.0, welZCm3: 16.7, weightKgM: 15.8 },
  { name: "IPE 180", family: "IPE", hMm: 180, bMm: 91, tfMm: 8.0, twMm: 5.3, areaCm2: 23.9, iyCm: 7.42, izCm: 2.05, wplYCm3: 166.4, wplZCm3: 34.6, welYCm3: 146.0, welZCm3: 22.2, weightKgM: 18.8 },
  { name: "IPE 200", family: "IPE", hMm: 200, bMm: 100, tfMm: 8.5, twMm: 5.6, areaCm2: 28.5, iyCm: 8.26, izCm: 2.24, wplYCm3: 220.6, wplZCm3: 44.6, welYCm3: 194.0, welZCm3: 28.5, weightKgM: 22.4 },
  { name: "IPE 220", family: "IPE", hMm: 220, bMm: 110, tfMm: 9.2, twMm: 5.9, areaCm2: 33.4, iyCm: 9.11, izCm: 2.48, wplYCm3: 285.4, wplZCm3: 56.8, welYCm3: 252.0, welZCm3: 37.3, weightKgM: 26.2 },
  { name: "IPE 240", family: "IPE", hMm: 240, bMm: 120, tfMm: 9.8, twMm: 6.2, areaCm2: 39.1, iyCm: 9.97, izCm: 2.69, wplYCm3: 366.6, wplZCm3: 72.3, welYCm3: 324.0, welZCm3: 47.3, weightKgM: 30.7 },
  { name: "IPE 270", family: "IPE", hMm: 270, bMm: 135, tfMm: 10.2, twMm: 6.6, areaCm2: 45.9, iyCm: 11.2, izCm: 3.02, wplYCm3: 484.0, wplZCm3: 94.2, welYCm3: 429.0, welZCm3: 62.2, weightKgM: 36.1 },
  { name: "IPE 300", family: "IPE", hMm: 300, bMm: 150, tfMm: 10.7, twMm: 7.1, areaCm2: 53.8, iyCm: 12.5, izCm: 3.35, wplYCm3: 628.4, wplZCm3: 125.0, welYCm3: 557.0, welZCm3: 80.5, weightKgM: 42.2 },
  { name: "HEA 160", family: "HEA", hMm: 152, bMm: 160, tfMm: 9.0, twMm: 6.0, areaCm2: 38.8, iyCm: 6.57, izCm: 3.98, wplYCm3: 245.2, wplZCm3: 92.5, welYCm3: 220.0, welZCm3: 61.5, weightKgM: 30.4 },
  { name: "HEA 200", family: "HEA", hMm: 190, bMm: 200, tfMm: 10.0, twMm: 6.5, areaCm2: 53.8, iyCm: 8.28, izCm: 4.98, wplYCm3: 429.5, wplZCm3: 153.6, welYCm3: 389.0, welZCm3: 102.3, weightKgM: 42.3 },
  { name: "HEA 240", family: "HEA", hMm: 230, bMm: 240, tfMm: 12.0, twMm: 7.5, areaCm2: 76.8, iyCm: 10.1, izCm: 6.00, wplYCm3: 744.6, wplZCm3: 263.8, welYCm3: 675.0, welZCm3: 178.0, weightKgM: 60.3 },
  { name: "HEB 200", family: "HEB", hMm: 200, bMm: 200, tfMm: 15.0, twMm: 9.0, areaCm2: 78.1, iyCm: 8.54, izCm: 5.07, wplYCm3: 642.5, wplZCm3: 235.8, welYCm3: 570.0, welZCm3: 158.0, weightKgM: 61.3 },
];

export interface SteelProfileInput {
  profileName: string;
  steelYieldFyMpa: number; // S235=235, S275=275, S355=355
  bucklingLengthYM?: number; // Güçlü eksen burkulma boyu Lky (m)
  bucklingLengthZM?: number; // Zayıf eksen burkulma boyu Lkz (m)
  bucklingLengthM?: number; // Her iki eksen eşit ise (m)
  axialCompressionNdKn?: number; // Eksenel basınç kuvveti Ned (kN)
  bendingMomentMdKnm?: number; // Eğilme momenti Med,y (kNm)
  shearForceVdKn?: number; // Kesme kuvveti Ved,z (kN)
}

export interface SteelProfileResult {
  profile: SteelSectionData;
  slendernessLambdaY: number;
  slendernessLambdaZ: number;
  governingSlenderness: number;
  isSlendernessSafe: boolean; // lambda <= 200
  bucklingCurveY: "a" | "b" | "c" | "d";
  bucklingCurveZ: "a" | "b" | "c" | "d";
  chiReductionFactorY: number;
  chiReductionFactorZ: number;
  governingChi: number;
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

function calculateChi(lambdaBar: number, curve: "a" | "b" | "c" | "d"): number {
  if (lambdaBar <= 0.2) return 1.0;
  const alphaMap: Record<"a" | "b" | "c" | "d", number> = {
    a: 0.21,
    b: 0.34,
    c: 0.49,
    d: 0.76,
  };
  const alpha = alphaMap[curve];
  const phi = 0.5 * (1 + alpha * (lambdaBar - 0.2) + lambdaBar * lambdaBar);
  const sqrtDisc = Math.sqrt(Math.max(0, phi * phi - lambdaBar * lambdaBar));
  const chi = 1 / (phi + sqrtDisc);
  return Math.min(1.0, Math.max(0, chi));
}

export function calculateSteelProfile(input: SteelProfileInput): SteelProfileResult | null {
  const {
    profileName,
    steelYieldFyMpa: fy,
    bucklingLengthYM: lkyInput,
    bucklingLengthZM: lkzInput,
    bucklingLengthM: lkSingle,
    axialCompressionNdKn: Ned = 0,
    bendingMomentMdKnm: Med = 0,
    shearForceVdKn: Ved = 0,
  } = input;

  const LkyM = lkyInput ?? lkSingle ?? 0;
  const LkzM = lkzInput ?? lkSingle ?? 0;

  if (LkyM <= 0 || LkzM <= 0 || fy <= 0 || Ned < 0 || Med < 0 || Ved < 0) {
    return null;
  }

  // Bilinmeyen profil varsa kesinlikle hata dön (sessiz fallback yasak)
  const profile = STEEL_PROFILES_DATABASE.find((p) => p.name === profileName);
  if (!profile) {
    return null;
  }

  const gammaM0 = 1.0;
  const gammaM1 = 1.0;
  const fyd = fy / gammaM0;
  const areaMm2 = profile.areaCm2 * 100;
  const iyMm = profile.iyCm * 10;
  const izMm = profile.izCm * 10;
  const wplYMm3 = profile.wplYCm3 * 1000;
  const E = 210000; // MPa

  // 1. Narinlikler: lambda = Lk / i
  const lambdaY = (LkyM * 1000) / iyMm;
  const lambdaZ = (LkzM * 1000) / izMm;
  const governingSlenderness = Math.max(lambdaY, lambdaZ);
  const isSlendernessSafe = governingSlenderness <= 200; // ÇYTHYE 2018 basınç çubuğu narinlik sınırı

  // Euler narinliği lambda_1 = pi * sqrt(E / fy)
  const lambda1 = Math.PI * Math.sqrt(E / fy);
  const lambdaBarY = lambdaY / lambda1;
  const lambdaBarZ = lambdaZ / lambda1;

  // 2. Burkulma Eğrileri Seçimi (ÇYTHYE 2018 Tablo 8.1)
  let curveY: "a" | "b" | "c" | "d" = "a";
  let curveZ: "a" | "b" | "c" | "d" = "b";

  if (profile.family === "HEA" || profile.family === "HEB") {
    const hbRatio = profile.hMm / profile.bMm;
    if (hbRatio > 1.2 && profile.tfMm <= 40) {
      curveY = "a";
      curveZ = "b";
    } else {
      curveY = "b";
      curveZ = "c";
    }
  } else {
    // IPE
    curveY = "a";
    curveZ = "b";
  }

  // 3. Burkulma Azaltma Katsayıları (chi)
  const chiY = calculateChi(lambdaBarY, curveY);
  const chiZ = calculateChi(lambdaBarZ, curveZ);
  const governingChi = Math.min(chiY, chiZ);

  // 4. Eksenel Basınç Kapasitesi Nb,Rd = chi * A * fy / gammaM1
  const nbRdN = (governingChi * areaMm2 * fy) / gammaM1;
  const compressionCapacityNbRdKn = nbRdN / 1000;

  // 5. Eğilme Kapasitesi Mc,Rd = Wpl,y * fy / gammaM0
  const mcRdNmm = (wplYMm3 * fyd);
  const bendingCapacityMcRdKnm = mcRdNmm / 1000000;

  // 6. Kesme Kapasitesi Vc,Rd = Av * (fy / sqrt(3)) / gammaM0
  // I kesit için gövde kesme alanı Av ≈ h * tw
  const avMm2 = profile.hMm * profile.twMm;
  const vcRdN = (avMm2 * (fy / Math.sqrt(3))) / gammaM0;
  const shearCapacityVcRdKn = vcRdN / 1000;

  // 7. Kapasite Kullanım Oranları
  const utilizationCompression = compressionCapacityNbRdKn > 0 ? Ned / compressionCapacityNbRdKn : 0;
  const utilizationBending = bendingCapacityMcRdKnm > 0 ? Med / bendingCapacityMcRdKnm : 0;
  const utilizationShear = shearCapacityVcRdKn > 0 ? Ved / shearCapacityVcRdKn : 0;

  // ÇYTHYE 2018 Basit Etkileşim (Eksenel Basınç + Eğilme)
  const utilizationCombined = utilizationCompression + utilizationBending;
  const isOverallSafe =
    isSlendernessSafe &&
    utilizationCompression <= 1.0 &&
    utilizationBending <= 1.0 &&
    utilizationShear <= 1.0 &&
    utilizationCombined <= 1.0;

  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `Profil: ${profile.name} (A = ${profile.areaCm2} cm², Ağırlık = ${profile.weightKgM} kg/m).`,
    `Narinlik: λy = ${lambdaY.toFixed(1)} (Eğri ${curveY}), λz = ${lambdaZ.toFixed(1)} (Eğri ${curveZ}). Belirleyici narinlik = ${governingSlenderness.toFixed(1)} ${isSlendernessSafe ? "≤ 200 (Güvenli)" : "> 200 (Narinlik Aşımı!)"}.`,
    `Burkulma İndirgeme Katsayısı: χ = ${governingChi.toFixed(3)} (Basınç Kapasitesi: Nb,Rd = ${compressionCapacityNbRdKn.toFixed(1)} kN).`,
  ];

  if (Ned > 0) notes.push(`Eksenel Basınç Kullanımı (Ned / Nb,Rd): %${(utilizationCompression * 100).toFixed(1)}.`);
  if (Med > 0) notes.push(`Eğilme Momenti Kullanımı (Med / Mc,Rd): %${(utilizationBending * 100).toFixed(1)}.`);
  if (Ved > 0) notes.push(`Kesme Kuvveti Kullanımı (Ved / Vc,Rd): %${(utilizationShear * 100).toFixed(1)}.`);

  return {
    profile,
    slendernessLambdaY: Number(lambdaY.toFixed(1)),
    slendernessLambdaZ: Number(lambdaZ.toFixed(1)),
    governingSlenderness: Number(governingSlenderness.toFixed(1)),
    isSlendernessSafe,
    bucklingCurveY: curveY,
    bucklingCurveZ: curveZ,
    chiReductionFactorY: Number(chiY.toFixed(3)),
    chiReductionFactorZ: Number(chiZ.toFixed(3)),
    governingChi: Number(governingChi.toFixed(3)),
    compressionCapacityNbRdKn: Number(compressionCapacityNbRdKn.toFixed(1)),
    bendingCapacityMcRdKnm: Number(bendingCapacityMcRdKnm.toFixed(1)),
    shearCapacityVcRdKn: Number(shearCapacityVcRdKn.toFixed(1)),
    utilizationCompression: Number(utilizationCompression.toFixed(3)),
    utilizationBending: Number(utilizationBending.toFixed(3)),
    utilizationShear: Number(utilizationShear.toFixed(3)),
    utilizationCombined: Number(utilizationCombined.toFixed(3)),
    isOverallSafe,
    status,
    notes,
  };
}
