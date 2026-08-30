export type InfillJointType = "flexible" | "brittle";

export interface StoryDisplacementInput {
  floorNumber: number;
  floorHeightM: number;
  displacementMm: number; // Çatıdan tabana mutlak veya rölatif öteleme
}

export interface DriftCheckInput {
  infillJointType: InfillJointType; // flexible: 0.016, brittle: 0.008 (TBDY 2018 Tablo 4.3)
  lambdaFactor?: number; // Mod birleştirme katsayısı (varsayılan 1.0)
  floors: StoryDisplacementInput[];
}

export interface StoryDriftResult {
  floorNumber: number;
  floorHeightM: number;
  interstoryDriftMm: number; // delta_i
  driftRatio: number; // lambda * delta_i / h_i
  driftPercent: number;
  isSafe: boolean;
}

export interface DriftCheckResult {
  limitRatio: number;
  maxDriftRatio: number;
  maxDriftFloorNumber: number;
  isOverallSafe: boolean;
  status: "safe" | "exceeded";
  stories: StoryDriftResult[];
  notes: string[];
}

export function calculateStoryDrift(input: DriftCheckInput): DriftCheckResult | null {
  const { infillJointType, lambdaFactor = 1.0, floors } = input;

  if (!floors || floors.length === 0) {
    return null;
  }

  // TBDY 2018 Tablo 4.3 Sınır Değerleri
  const limitRatio = infillJointType === "flexible" ? 0.016 : 0.008;

  let maxDriftRatio = 0;
  let maxDriftFloorNumber = 1;
  let prevDisplacementMm = 0;

  const stories: StoryDriftResult[] = [];

  for (const floor of floors) {
    const { floorNumber, floorHeightM, displacementMm } = floor;
    if (floorHeightM <= 0) return null;

    const hiMm = floorHeightM * 1000;
    // Eğer girdi rölatif verilmişse veya kümülatif verilmişse:
    const interstoryDriftMm = Math.max(0, displacementMm - prevDisplacementMm);
    prevDisplacementMm = displacementMm;

    const driftRatio = (lambdaFactor * interstoryDriftMm) / hiMm;
    const driftPercent = driftRatio * 100;
    const isSafe = driftRatio <= limitRatio;

    if (driftRatio > maxDriftRatio) {
      maxDriftRatio = driftRatio;
      maxDriftFloorNumber = floorNumber;
    }

    stories.push({
      floorNumber,
      floorHeightM,
      interstoryDriftMm,
      driftRatio,
      driftPercent,
      isSafe,
    });
  }

  const isOverallSafe = maxDriftRatio <= limitRatio;
  const status: "safe" | "exceeded" = isOverallSafe ? "safe" : "exceeded";

  const notes: string[] = [
    `TBDY 2018 Tablo 4.3 Sınırı: λ · Δi / hi ≤ ${limitRatio} (${infillJointType === "flexible" ? "Esnek derzli dolgu / YDKT" : "Gevrek dolgu duvar"}).`,
    isOverallSafe
      ? `Maksimum göreli kat ötelemesi Kat ${maxDriftFloorNumber}'de %${(maxDriftRatio * 100).toFixed(3)} olarak hesaplandı (Sınır sağlandı).`
      : `UYARI: Kat ${maxDriftFloorNumber}'de göreli öteleme sınırı aşıldı (%${(maxDriftRatio * 100).toFixed(3)} > %${(limitRatio * 100).toFixed(3)})! Taşıyıcı sistem rijitliği (perde ilavesi veya kolon kesitleri) artırılmalıdır.`,
  ];

  return {
    limitRatio,
    maxDriftRatio,
    maxDriftFloorNumber,
    isOverallSafe,
    status,
    stories,
    notes,
  };
}
