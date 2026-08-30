export type InfillJointType = "flexible" | "brittle";

export interface StoryDisplacementInput {
  floorNumber: number;
  floorHeightM: number; // Kat yüksekliği hi (m)
  displacementMm: number; // Tabana göre mutlak yatay kat deplasmanı ui (mm)
  floorWeightKn?: number; // İkinci mertebe hesabı için kat ağırlığı wj (kN)
  storyShearKn?: number; // İkinci mertebe hesabı için kat kesme kuvveti Vti (kN)
}

export interface DriftCheckInput {
  infillJointType: InfillJointType; // flexible: 0.016, brittle: 0.008 (TBDY 2018 Tablo 4.3)
  behaviorFactorR?: number; // R: Taşıyıcı sistem katsayısı (Etkin öteleme Delta_i için)
  importanceFactorI?: number; // I: Bina önem katsayısı
  lambdaFactor?: number; // Mod birleştirme katsayısı (varsayılan 1.0)
  floors: StoryDisplacementInput[];
}

export interface StoryDriftResult {
  floorNumber: number;
  floorHeightM: number;
  displacementMm: number;
  interstoryDriftDeltaMm: number; // delta_i = u_i - u_(i-1)
  effectiveDriftCapitalDeltaMm: number; // Delta_i = (R / I) * delta_i
  driftRatio: number; // lambda * delta_i / h_i
  driftPercent: number;
  isSafe: boolean;
  secondOrderThetaII?: number; // theta_II <= 0.12
  isSecondOrderSafe?: boolean;
}

export interface DriftCheckResult {
  limitRatio: number;
  maxDriftRatio: number;
  maxDriftFloorNumber: number;
  isOverallSafe: boolean;
  maxThetaII?: number;
  isSecondOrderOverallSafe: boolean;
  status: "safe" | "exceeded";
  stories: StoryDriftResult[];
  notes: string[];
}

export function calculateStoryDrift(input: DriftCheckInput): DriftCheckResult | null {
  const {
    infillJointType,
    behaviorFactorR: R = 8.0,
    importanceFactorI: I = 1.0,
    lambdaFactor = 1.0,
    floors,
  } = input;

  if (!floors || floors.length === 0 || R <= 0 || I <= 0 || lambdaFactor <= 0) {
    return null;
  }

  // TBDY 2018 Tablo 4.3 Sınır Değerleri
  const limitRatio = infillJointType === "flexible" ? 0.016 : 0.008;

  let maxDriftRatio = 0;
  let maxDriftFloorNumber = 1;
  let prevDisplacementMm = 0;
  let maxThetaII = 0;
  let hasSecondOrderData = true;

  const sortedFloors = [...floors].sort((a, b) => a.floorNumber - b.floorNumber);

  // Toplam bina ağırlığını üstten alta kümülatif toplamak için
  const totalStoryWeights: number[] = new Array(sortedFloors.length).fill(0);
  let cumW = 0;
  for (let i = sortedFloors.length - 1; i >= 0; i--) {
    const fw = sortedFloors[i].floorWeightKn;
    if (fw === undefined || fw <= 0) {
      hasSecondOrderData = false;
    } else {
      cumW += fw;
      totalStoryWeights[i] = cumW;
    }
  }

  const stories: StoryDriftResult[] = [];

  for (let idx = 0; idx < sortedFloors.length; idx++) {
    const floor = sortedFloors[idx];
    const { floorNumber, floorHeightM, displacementMm, storyShearKn } = floor;

    if (!Number.isFinite(floorHeightM) || floorHeightM <= 0 || !Number.isFinite(displacementMm)) {
      return null;
    }

    const hiMm = floorHeightM * 1000;
    // İndirgenmiş göreli kat ötelemesi: delta_i = u_i - u_(i-1)
    const interstoryDriftDeltaMm = Math.abs(displacementMm - prevDisplacementMm);
    prevDisplacementMm = displacementMm;

    // Etkin göreli kat ötelemesi: Delta_i = (R / I) * delta_i (TBDY Denklem 4.29)
    const effectiveDriftCapitalDeltaMm = (R / I) * interstoryDriftDeltaMm;

    // Göreli öteleme oranı: lambda * delta_i / h_i (TBDY Denklem 4.30)
    const driftRatio = (lambdaFactor * interstoryDriftDeltaMm) / hiMm;
    const driftPercent = driftRatio * 100;
    const isSafe = driftRatio <= limitRatio;

    if (driftRatio > maxDriftRatio) {
      maxDriftRatio = driftRatio;
      maxDriftFloorNumber = floorNumber;
    }

    // İkinci Mertebe Göstergesi theta_II (TBDY Denklem 4.31)
    let secondOrderThetaII: number | undefined;
    let isSecondOrderSafe: boolean | undefined;

    if (hasSecondOrderData && storyShearKn && storyShearKn > 0) {
      const sumWj = totalStoryWeights[idx];
      // theta_II = (sum(w_j) * Delta_i) / (V_ti * h_i)
      const hiM = floorHeightM;
      secondOrderThetaII = (sumWj * (effectiveDriftCapitalDeltaMm / 1000)) / (storyShearKn * hiM);
      isSecondOrderSafe = secondOrderThetaII <= 0.12;

      if (secondOrderThetaII > maxThetaII) {
        maxThetaII = secondOrderThetaII;
      }
    }

    stories.push({
      floorNumber,
      floorHeightM,
      displacementMm,
      interstoryDriftDeltaMm: Number(interstoryDriftDeltaMm.toFixed(2)),
      effectiveDriftCapitalDeltaMm: Number(effectiveDriftCapitalDeltaMm.toFixed(2)),
      driftRatio: Number(driftRatio.toFixed(5)),
      driftPercent: Number(driftPercent.toFixed(3)),
      isSafe,
      secondOrderThetaII: secondOrderThetaII !== undefined ? Number(secondOrderThetaII.toFixed(4)) : undefined,
      isSecondOrderSafe,
    });
  }

  const isDriftSafe = maxDriftRatio <= limitRatio;
  const isSecondOrderOverallSafe = hasSecondOrderData ? maxThetaII <= 0.12 : true;
  const isOverallSafe = isDriftSafe && isSecondOrderOverallSafe;
  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `TBDY 2018 Tablo 4.3 Sınırı: λ · δi,max / hi ≤ ${limitRatio} (${infillJointType === "flexible" ? "Esnek derzli dolgu duvar / YDKT" : "Gevrek dolgu duvar"}).`,
  ];

  if (isDriftSafe) {
    notes.push(`Maksimum göreli kat ötelemesi Kat ${maxDriftFloorNumber}'de %${(maxDriftRatio * 100).toFixed(3)} (Limit: %${(limitRatio * 100).toFixed(2)}) sağlandı.`);
  } else {
    notes.push(`UYARI: Kat ${maxDriftFloorNumber}'de göreli öteleme sınırı aşıldı (%${(maxDriftRatio * 100).toFixed(3)} > %${(limitRatio * 100).toFixed(2)})! Taşıyıcı sistem rijitliği artırılmalıdır.`);
  }

  if (hasSecondOrderData) {
    if (isSecondOrderOverallSafe) {
      notes.push(`Maksimum ikinci mertebe gösterge değeri θ_II = ${maxThetaII.toFixed(4)} ≤ 0.12 (İkinci mertebe sınırları sağlandı).`);
    } else {
      notes.push(`UYARI: Maksimum ikinci mertebe gösterge değeri θ_II = ${maxThetaII.toFixed(4)} > 0.12 sınırını aştı!`);
    }
  }

  return {
    limitRatio,
    maxDriftRatio: Number(maxDriftRatio.toFixed(5)),
    maxDriftFloorNumber,
    isOverallSafe,
    maxThetaII: hasSecondOrderData ? Number(maxThetaII.toFixed(4)) : undefined,
    isSecondOrderOverallSafe,
    status,
    stories,
    notes,
  };
}
