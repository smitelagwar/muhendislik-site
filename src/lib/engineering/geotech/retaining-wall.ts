// Geoteknik İksa ve Toprak Basıncı Hesap Motoru (Rankine, Coulomb & Mononobe-Okabe)

export type EarthPressureMethod = "rankine" | "coulomb" | "mononobe_okabe";

export interface EarthPressureInput {
  wallHeightM: number; // H (m)
  soilUnitWeightKnM3: number; // gamma (kN/m3)
  internalFrictionAngleDeg: number; // phi (derece)
  cohesionKpa?: number; // c (kPa)
  surchargeKpa?: number; // q (kPa)
  method?: EarthPressureMethod;
  backfillSlopeBetaDeg?: number; // beta: Dolgu eğim açısı (derece)
  wallFrictionDeltaDeg?: number; // delta: Duvar-zemin sürtünme açısı (derece, Coulomb/MO için)
  wallBackAngleThetaDeg?: number; // theta: Duvar arka yüzünün düşeyle açısı (derece)
  seismicCoeffKh?: number; // kh: Yatay sismik katsayı
  seismicCoeffKv?: number; // kv: Düşey sismik katsayı
  waterTableDepthM?: number; // Yeraltı su seviyesi derinliği (m)
}

export interface EarthPressureResult {
  method: EarthPressureMethod;
  ka: number;
  kp: number;
  k0: number;
  staticActiveThrustKnM: number; // Pa,soil (kN/m)
  surchargeThrustKnM: number; // Pa,q (kN/m)
  waterThrustKnM: number; // Pw (kN/m)
  totalActiveThrustKnM: number; // Pa,total (kN/m)
  applicationPointHeightM: number; // Taban seviyesinden bileşke yüksekliği (m)
  overturningMomentKnMPerM: number; // Devirici moment (kNm/m)
  dynamicSeismicThrustKnM?: number; // Sismik ilave itki (kN/m)
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
    method = "rankine",
    backfillSlopeBetaDeg: betaDeg = 0,
    wallFrictionDeltaDeg: deltaDeg = 0,
    wallBackAngleThetaDeg: thetaDeg = 0,
    seismicCoeffKh: kh = 0,
    seismicCoeffKv: kv = 0,
    waterTableDepthM,
  } = input;

  if (
    [H, gamma, phiDeg].some((val) => !Number.isFinite(val) || val <= 0) ||
    phiDeg >= 90 ||
    c < 0 ||
    q < 0 ||
    kh < 0 ||
    kv < 0 ||
    betaDeg < 0 ||
    deltaDeg < 0
  ) {
    return null;
  }

  const degToRad = Math.PI / 180;
  const phiRad = phiDeg * degToRad;
  const betaRad = betaDeg * degToRad;
  const deltaRad = deltaDeg * degToRad;
  const thetaRad = thetaDeg * degToRad;

  // Rankine Basınç Katsayıları
  const sinPhi = Math.sin(phiRad);
  const k0 = 1 - sinPhi;

  let ka = 0;
  let kp = 0;

  if (method === "rankine") {
    if (betaDeg === 0) {
      ka = (1 - sinPhi) / (1 + sinPhi);
      kp = (1 + sinPhi) / (1 - sinPhi);
    } else {
      // Eğimli dolgu Rankine formülü
      const cosBeta = Math.cos(betaRad);
      const radSqrt = Math.sqrt(Math.max(0, cosBeta * cosBeta - Math.cos(phiRad) * Math.cos(phiRad)));
      ka = cosBeta * ((cosBeta - radSqrt) / (cosBeta + radSqrt));
      kp = cosBeta * ((cosBeta + radSqrt) / (cosBeta - radSqrt));
    }
  } else if (method === "coulomb") {
    // Coulomb Aktif Katsayısı
    const numeratorKa = Math.pow(Math.cos(phiRad - thetaRad), 2);
    const denominatorKaPart1 = Math.pow(Math.cos(thetaRad), 2) * Math.cos(deltaRad + thetaRad);
    const sqrtKa = Math.sqrt(
      Math.max(0, (Math.sin(phiRad + deltaRad) * Math.sin(phiRad - betaRad)) / (Math.cos(deltaRad + thetaRad) * Math.cos(betaRad - thetaRad)))
    );
    ka = numeratorKa / (denominatorKaPart1 * Math.pow(1 + sqrtKa, 2));

    // Coulomb Pasif Katsayısı
    const numeratorKp = Math.pow(Math.cos(phiRad + thetaRad), 2);
    const denominatorKpPart1 = Math.pow(Math.cos(thetaRad), 2) * Math.cos(deltaRad - thetaRad);
    const sqrtKp = Math.sqrt(
      Math.max(0, (Math.sin(phiRad + deltaRad) * Math.sin(phiRad + betaRad)) / (Math.cos(deltaRad - thetaRad) * Math.cos(betaRad - thetaRad)))
    );
    kp = numeratorKp / (denominatorKpPart1 * Math.pow(1 - sqrtKp, 2));
  } else if (method === "mononobe_okabe") {
    // Mononobe-Okabe Depremli Toprak Basıncı (TBDY 2018 Bölüm 16.6)
    const thetaERad = Math.atan(kh / (1 - kv || 1));
    const numeratorKae = Math.pow(Math.cos(phiRad - thetaERad - thetaRad), 2);
    const denominatorKaePart1 = Math.cos(thetaERad) * Math.pow(Math.cos(thetaRad), 2) * Math.cos(deltaRad + thetaRad + thetaERad);
    const sqrtKae = Math.sqrt(
      Math.max(
        0,
        (Math.sin(phiRad + deltaRad) * Math.sin(phiRad - betaRad - thetaERad)) /
          (Math.cos(deltaRad + thetaRad + thetaERad) * Math.cos(betaRad - thetaRad))
      )
    );
    ka = numeratorKae / (denominatorKaePart1 * Math.pow(1 + sqrtKae, 2));
    kp = (1 + sinPhi) / (1 - sinPhi); // Statik referans
  }

  if (!Number.isFinite(ka) || ka <= 0) ka = (1 - sinPhi) / (1 + sinPhi);
  if (!Number.isFinite(kp) || kp <= 0) kp = (1 + sinPhi) / (1 - sinPhi);

  // 1. Statik Toprak İtkisi
  const cohesionReduction = 2 * c * Math.sqrt(ka) * H;
  const rawSoilThrust = 0.5 * ka * gamma * H * H - cohesionReduction;
  const staticActiveThrustKnM = Math.max(0, rawSoilThrust);

  // 2. Sürşarj İtkisi
  const surchargeThrustKnM = ka * q * H;

  // 3. Su Basıncı İtkisi (YASS varsa)
  let waterThrustKnM = 0;
  if (waterTableDepthM !== undefined && Number.isFinite(waterTableDepthM) && waterTableDepthM < H) {
    const waterHeight = H - Math.max(0, waterTableDepthM);
    const gammaW = 9.81; // kN/m3
    waterThrustKnM = 0.5 * gammaW * waterHeight * waterHeight;
  }

  // 4. Toplam Aktif İtki
  const totalActiveThrustKnM = staticActiveThrustKnM + surchargeThrustKnM + waterThrustKnM;

  // 5. Bileşke Uygulama Noktası (Tabandan yükseklik y)
  let applicationPointHeightM = H / 3;
  if (totalActiveThrustKnM > 0) {
    const soilMoment = staticActiveThrustKnM * (H / 3);
    const surchargeMoment = surchargeThrustKnM * (H / 2);
    const waterHeight = waterTableDepthM !== undefined && waterTableDepthM < H ? H - Math.max(0, waterTableDepthM) : 0;
    const waterMoment = waterThrustKnM * (waterHeight / 3);
    applicationPointHeightM = (soilMoment + surchargeMoment + waterMoment) / totalActiveThrustKnM;
  }

  const overturningMomentKnMPerM = totalActiveThrustKnM * applicationPointHeightM;

  // 6. Mononobe-Okabe Sismik İtki
  let dynamicSeismicThrustKnM: number | undefined;
  let totalSeismicThrustKnM: number | undefined;

  if (kh > 0) {
    const thetaERad = Math.atan(kh / (1 - kv || 1));
    const numeratorKae = Math.pow(Math.cos(phiRad - thetaERad - thetaRad), 2);
    const denominatorKaePart1 = Math.cos(thetaERad) * Math.pow(Math.cos(thetaRad), 2) * Math.cos(deltaRad + thetaRad + thetaERad);
    const sqrtKae = Math.sqrt(
      Math.max(
        0,
        (Math.sin(phiRad + deltaRad) * Math.sin(phiRad - betaRad - thetaERad)) /
          (Math.cos(deltaRad + thetaRad + thetaERad) * Math.cos(betaRad - thetaRad))
      )
    );
    const kaeExact = numeratorKae / (denominatorKaePart1 * Math.pow(1 + sqrtKae, 2));
    const kaeVal = Number.isFinite(kaeExact) && kaeExact > 0 ? kaeExact : ka * (1 + 1.5 * kh);

    const totalPae = 0.5 * (1 - kv) * kaeVal * gamma * H * H + kaeVal * q * H + waterThrustKnM;
    dynamicSeismicThrustKnM = Math.max(0, totalPae - totalActiveThrustKnM);
    totalSeismicThrustKnM = totalPae;
  }

  const notes: string[] = [
    `Hesap Yöntemi: ${method === "rankine" ? "Rankine Teorisi" : method === "coulomb" ? "Coulomb Kama Teorisi" : "Mononobe-Okabe Depremli Teori"}.`,
    `Aktif Basınç Katsayısı: Ka = ${ka.toFixed(3)}, Pasif: Kp = ${kp.toFixed(3)}, Sükunet: K0 = ${k0.toFixed(3)}.`,
    `Toplam aktif itki: Pa = ${totalActiveThrustKnM.toFixed(1)} kN/m (Bileşke uygulama noktası tabandan ${applicationPointHeightM.toFixed(2)} m yukarıda).`,
  ];

  if (c > 0) {
    notes.push(`Kohezyon etkisi (c = ${c} kPa) itkiyi ${cohesionReduction.toFixed(1)} kN/m azaltmıştır.`);
  }
  if (waterThrustKnM > 0) {
    notes.push(`Yeraltı suyu hidrostatik itkisi: Pw = ${waterThrustKnM.toFixed(1)} kN/m.`);
  }
  if (kh > 0 && totalSeismicThrustKnM !== undefined) {
    notes.push(`TBDY 2018 Sismik itki (kh=${kh}, kv=${kv}): Pae = ${totalSeismicThrustKnM.toFixed(1)} kN/m.`);
  }

  return {
    method,
    ka: Number(ka.toFixed(4)),
    kp: Number(kp.toFixed(4)),
    k0: Number(k0.toFixed(4)),
    staticActiveThrustKnM: Number(staticActiveThrustKnM.toFixed(2)),
    surchargeThrustKnM: Number(surchargeThrustKnM.toFixed(2)),
    waterThrustKnM: Number(waterThrustKnM.toFixed(2)),
    totalActiveThrustKnM: Number(totalActiveThrustKnM.toFixed(2)),
    applicationPointHeightM: Number(applicationPointHeightM.toFixed(2)),
    overturningMomentKnMPerM: Number(overturningMomentKnMPerM.toFixed(2)),
    dynamicSeismicThrustKnM: dynamicSeismicThrustKnM !== undefined ? Number(dynamicSeismicThrustKnM.toFixed(2)) : undefined,
    totalSeismicThrustKnM: totalSeismicThrustKnM !== undefined ? Number(totalSeismicThrustKnM.toFixed(2)) : undefined,
    notes,
  };
}

export const calculateRetainingWallPressures = calculateEarthPressure;
