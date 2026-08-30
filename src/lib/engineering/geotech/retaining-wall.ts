export interface EarthPressureInput {
  wallHeightM: number;
  soilUnitWeightKnM3: number;
  internalFrictionAngleDeg: number;
  cohesionKpa?: number;
  surchargeKpa?: number;
  seismicCoeffKh?: number;
}

export interface EarthPressureResult {
  ka: number;
  kp: number;
  k0: number;
  staticActiveThrustKnM: number; // Pa,soil (kN/m)
  surchargeThrustKnM: number; // Pa,q (kN/m)
  totalActiveThrustKnM: number; // Pa,total (kN/m)
  applicationPointHeightM: number; // Taban seviyesinden yükseklik (m)
  overturningMomentKnMPerM: number; // Devirici moment (kNm/m)
  dynamicSeismicThrustKnM?: number; // Mononobe-Okabe dinamik ilave (kN/m)
  totalSeismicThrustKnM?: number; // Pae,total (kN/m)
  notes: string[];
}

export function calculateEarthPressure(input: EarthPressureInput): EarthPressureResult | null {
  const {
    wallHeightM: H,
    soilUnitWeightKnM3: gamma,
    internalFrictionAngleDeg: phiDeg,
    cohesionKpa: c = 0,
    surchargeKpa: q = 0,
    seismicCoeffKh: kh = 0,
  } = input;

  if (
    [H, gamma, phiDeg].some((val) => !Number.isFinite(val) || val <= 0) ||
    phiDeg >= 90 ||
    c < 0 ||
    q < 0 ||
    kh < 0
  ) {
    return null;
  }

  const phiRad = (phiDeg * Math.PI) / 180;
  const sinPhi = Math.sin(phiRad);

  // Rankine Basınç Katsayıları
  const ka = (1 - sinPhi) / (1 + sinPhi);
  const kp = (1 + sinPhi) / (1 - sinPhi);
  const k0 = 1 - sinPhi;

  // 1. Statik Toprak İtkisi
  // Pa,soil = 0.5 * Ka * gamma * H^2 - 2 * c * sqrt(Ka) * H
  const cohesionReduction = 2 * c * Math.sqrt(ka) * H;
  const rawSoilThrust = 0.5 * ka * gamma * H * H - cohesionReduction;
  const staticActiveThrustKnM = Math.max(0, rawSoilThrust);

  // 2. Sürşarj İtkisi
  const surchargeThrustKnM = ka * q * H;

  // 3. Toplam Aktif İtki
  const totalActiveThrustKnM = staticActiveThrustKnM + surchargeThrustKnM;

  // 4. Bileşke Uygulama Noktası (Tabandan yükseklik y)
  // Üçgen dağılım için H/3, dikdörtgen sürşarj için H/2
  let applicationPointHeightM = H / 3;
  if (totalActiveThrustKnM > 0) {
    const soilMoment = staticActiveThrustKnM * (H / 3);
    const surchargeMoment = surchargeThrustKnM * (H / 2);
    applicationPointHeightM = (soilMoment + surchargeMoment) / totalActiveThrustKnM;
  }

  const overturningMomentKnMPerM = totalActiveThrustKnM * applicationPointHeightM;

  // 5. Mononobe-Okabe Sismik İtki (TBDY 2018 Bölüm 16)
  let dynamicSeismicThrustKnM: number | undefined;
  let totalSeismicThrustKnM: number | undefined;

  if (kh > 0) {
    const thetaRad = Math.atan(kh);
    // Basitleştirilmiş Mononobe-Okabe: Kae ≈ Ka * (1 + 1.5 * kh)
    const kae = ka * (1 + 1.5 * kh);
    const totalPae = 0.5 * kae * gamma * H * H + kae * q * H;
    dynamicSeismicThrustKnM = Math.max(0, totalPae - totalActiveThrustKnM);
    totalSeismicThrustKnM = totalPae;
  }

  const notes: string[] = [
    `Rankine aktif katsayısı: Ka = ${ka.toFixed(3)}, pasif katsayısı: Kp = ${kp.toFixed(3)}, sükunet: K0 = ${k0.toFixed(3)}.`,
    `Toplam statik aktif itki: Pa = ${totalActiveThrustKnM.toFixed(1)} kN/m (Bileşke tabandan ${applicationPointHeightM.toFixed(2)} m yukarıda).`,
    c > 0
      ? `Kohezyon (c = ${c} kPa) çekme çatlağı etkisi itkiyi ${cohesionReduction.toFixed(1)} kN/m azaltmıştır.`
      : "Zemin kohezyonsuz kabul edilmiştir.",
    kh > 0 && totalSeismicThrustKnM !== undefined
      ? `TBDY 2018 Mononobe-Okabe depremli toplam itki (kh=${kh}): Pae = ${totalSeismicThrustKnM.toFixed(1)} kN/m.`
      : "Statik yükleme analizi yapılmıştır.",
  ];

  return {
    ka,
    kp,
    k0,
    staticActiveThrustKnM,
    surchargeThrustKnM,
    totalActiveThrustKnM,
    applicationPointHeightM,
    overturningMomentKnMPerM,
    dynamicSeismicThrustKnM,
    totalSeismicThrustKnM,
    notes,
  };
}
