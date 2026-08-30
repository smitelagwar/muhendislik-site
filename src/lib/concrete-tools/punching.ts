// TS 500 / TBDY 2018 Döşeme ve Plak Zımbalama Kontrolü ve Zımbalama Donatısı Hesap Motoru

export type ColumnPunchingLocation = "inner" | "edge" | "corner";

export interface PunchingInput {
  fckMpa: number; // Karakteristik beton basınç dayanımı (MPa)
  fctdMpa?: number; // Tasarım çekme dayanımı (MPa)
  fywdMpa?: number; // Zımbalama donatısı akma dayanımı (MPa, varsayılan 365)
  slabThicknessCm: number; // Plak kalınlığı h (cm)
  coverMm: number; // Pas payı (mm)
  columnBxCm: number; // Kolon genişliği bx (cm)
  columnByCm: number; // Kolon derinliği by (cm)
  location: ColumnPunchingLocation;
  axialPunchingLoadKn: number; // Zımbalama yükü Vpd (kN)
}

export interface PunchingReinforcementProposal {
  requiredAswMm2: number; // Gerekli zımbalama donatısı alanı (mm2)
  studDiameterMm: number;
  studCount: number;
  providedAswMm2: number;
  description: string;
}

export interface PunchingResult {
  effectiveDepthCm: number;
  punchingPerimeterCm: number;
  shearAreaMm2: number;
  punchingStressMpa: number;
  concreteTensileStrengthFctd: number;
  maxPunchingCapacityMpa: number;
  punchingCapacityVprKn: number; // Donatısız zımbalama kapasitesi
  utilizationRatio: number;
  status: "safe" | "needs_reinforcement" | "exceeded_capacity";
  gammaFactor: number;
  reinforcement?: PunchingReinforcementProposal;
  recommendedAction: string;
  notes: string[];
}

export const PUNCHING_LOCATION_FACTORS: Record<ColumnPunchingLocation, { label: string; gamma: number }> = {
  inner: { label: "İç Kolon (Dört Tarafı Açık)", gamma: 1.0 },
  edge: { label: "Kenar Kolon (Üç Tarafı Açık)", gamma: 1.15 },
  corner: { label: "Köşe Kolon (İki Tarafı Açık)", gamma: 1.4 },
};

export function calculatePunchingShear(input: PunchingInput): PunchingResult | null {
  const {
    fckMpa,
    fctdMpa,
    fywdMpa = 365,
    slabThicknessCm,
    coverMm,
    columnBxCm,
    columnByCm,
    location,
    axialPunchingLoadKn: vpdKn,
  } = input;

  if (
    [fckMpa, slabThicknessCm, coverMm, columnBxCm, columnByCm, vpdKn].some((val) => !Number.isFinite(val) || val <= 0) ||
    slabThicknessCm * 10 <= coverMm + 15 || // Plak kalınlığı pas payından küçük olamaz
    !PUNCHING_LOCATION_FACTORS[location]
  ) {
    return null;
  }

  // 1. Faydalı Derinlik d (cm)
  const effectiveDepthCm = slabThicknessCm - coverMm / 10 - 1.0;
  if (effectiveDepthCm <= 0) return null;

  const dMm = effectiveDepthCm * 10;
  const bxMm = columnBxCm * 10;
  const byMm = columnByCm * 10;

  // 2. TS 500 Zımbalama Çevresi (u_p)
  let upMm = 0;
  if (location === "inner") {
    upMm = 2 * (bxMm + byMm + 2 * dMm);
  } else if (location === "edge") {
    upMm = bxMm + 2 * (byMm + dMm);
  } else {
    // corner
    upMm = bxMm + byMm + dMm;
  }
  const punchingPerimeterCm = upMm / 10;

  // 3. Beton Çekme Dayanımı fctd (TS 500: fctd = 0.35 * sqrt(fck) / 1.5)
  const concreteTensileStrengthFctd = fctdMpa && fctdMpa > 0 ? fctdMpa : (0.35 * Math.sqrt(fckMpa)) / 1.5;

  const gammaFactor = PUNCHING_LOCATION_FACTORS[location].gamma;
  const shearAreaMm2 = upMm * dMm;
  const vpdN = vpdKn * 1000;
  const punchingStressMpa = (gammaFactor * vpdN) / shearAreaMm2;

  // Donatısız beton zımbalama kapasitesi Vpr (kN)
  const punchingCapacityVprKn = (concreteTensileStrengthFctd * shearAreaMm2) / (gammaFactor * 1000);
  const maxPunchingCapacityMpa = 1.5 * concreteTensileStrengthFctd;
  const utilizationRatio = punchingStressMpa / concreteTensileStrengthFctd;

  let status: "safe" | "needs_reinforcement" | "exceeded_capacity";
  let recommendedAction: string;
  let reinforcement: PunchingReinforcementProposal | undefined;
  const notes: string[] = [];

  if (punchingStressMpa <= concreteTensileStrengthFctd) {
    status = "safe";
    recommendedAction = "Donatısız beton kesiti zımbalama gerilmesini karşılıyor. İlave zımbalama donatısı zorunlu değildir.";
    notes.push(`Zımbalama gerilmesi v_pd = ${punchingStressMpa.toFixed(2)} MPa ≤ f_ctd = ${concreteTensileStrengthFctd.toFixed(2)} MPa (Güvenli).`);
  } else if (punchingStressMpa <= maxPunchingCapacityMpa) {
    status = "needs_reinforcement";
    recommendedAction = "Zımbalama gerilmesi beton çekme dayanımını aşıyor; zımbalama donatısı (çift başlı stud/çivi veya etriye sehpası) boyutlandırıldı.";

    // TS 500 Zımbalama Donatısı Hesabı:
    // V_s = gamma * V_pd - 0.5 * V_pr
    const vsN = gammaFactor * vpdN - 0.5 * (concreteTensileStrengthFctd * shearAreaMm2);
    const requiredAswMm2 = Math.max(0, vsN / fywdMpa);

    // Örnek stud seçimi: Ø10 veya Ø12 stud
    const studDiameter = 12;
    const singleStudArea = (Math.PI * studDiameter * studDiameter) / 4;
    const studCount = Math.max(8, Math.ceil(requiredAswMm2 / singleStudArea));
    const providedAswMm2 = studCount * singleStudArea;

    reinforcement = {
      requiredAswMm2: Number(requiredAswMm2.toFixed(1)),
      studDiameterMm: studDiameter,
      studCount,
      providedAswMm2: Number(providedAswMm2.toFixed(1)),
      description: `${studCount} adet Ø${studDiameter} Çift Başlı Zımbalama Stud'ı (Asw = ${providedAswMm2.toFixed(0)} mm² ≥ ${requiredAswMm2.toFixed(0)} mm²)`,
    };

    notes.push(`Zımbalama donatısı gereklidir: Gerekli Asw = ${requiredAswMm2.toFixed(0)} mm².`);
    notes.push(`Önerilen Donatı: ${reinforcement.description}. Kolon yüzünden 0.5d ve 1.5d mesafelerde dairesel/dikdörtgen hatlar halinde yerleştirilmelidir.`);
  } else {
    status = "exceeded_capacity";
    recommendedAction = "Zımbalama gerilmesi 1.5·fctd üst sınırını aşıyor! Plak kalınlığı, kolon başlığı (drop panel) veya kolon ebatları mutlaka büyütülmelidir.";
    notes.push(`UYARI: v_pd = ${punchingStressMpa.toFixed(2)} MPa > 1.5·f_ctd = ${maxPunchingCapacityMpa.toFixed(2)} MPa kesit üst sınırı aşıldı! Donatı tek başına yeterli değildir.`);
  }

  return {
    effectiveDepthCm: Number(effectiveDepthCm.toFixed(1)),
    punchingPerimeterCm: Number(punchingPerimeterCm.toFixed(1)),
    shearAreaMm2: Number(shearAreaMm2.toFixed(0)),
    punchingStressMpa: Number(punchingStressMpa.toFixed(3)),
    concreteTensileStrengthFctd: Number(concreteTensileStrengthFctd.toFixed(3)),
    maxPunchingCapacityMpa: Number(maxPunchingCapacityMpa.toFixed(3)),
    punchingCapacityVprKn: Number(punchingCapacityVprKn.toFixed(1)),
    utilizationRatio: Number(utilizationRatio.toFixed(3)),
    status,
    gammaFactor,
    reinforcement,
    recommendedAction,
    notes,
  };
}
