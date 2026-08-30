import { calculateDesignSpectrumParameters, calculateHorizontalElasticSpectrum } from "./horizontal-spectrum";
import type { SoilClass } from "./types";

export type StructuralSystemType = "concrete_frame" | "steel_frame" | "shear_wall_other";

export interface FloorInputData {
  floorNumber: number;
  floorHeightM: number; // Kümülatif veya kat yüksekliği
  floorWeightKn: number;
}

export interface EquivalentBaseShearInput {
  ss: number;
  s1: number;
  soilClass: SoilClass;
  importanceFactorI: number; // I: 1.0, 1.2, 1.5
  behaviorFactorR: number; // R
  overstrengthFactorD?: number; // D: Varsayılan 2.5 - 3.0
  totalWeightKn?: number;
  numFloors: number;
  buildingHeightM: number;
  systemType?: StructuralSystemType;
  ctFactor?: number;
  floors?: FloorInputData[];
}

export interface FloorLateralForce {
  floorNumber: number;
  floorHeightM: number;
  floorWeightKn: number;
  lateralForceKn: number;
  storyShearKn: number;
}

export interface EquivalentBaseShearResult {
  fs: number;
  f1: number;
  sds: number;
  sd1: number;
  ta: number;
  tb: number;
  tl: number;
  empiricalPeriodTp: number;
  elasticSpectralAccelerationSae: number;
  raFactor: number;
  reducedDesignSpectralAccelerationSar: number;
  calculatedBaseShearKn: number;
  minimumBaseShearKn: number;
  designBaseShearKn: number;
  isMinimumControlled: boolean;
  deltaFnE: number;
  floorForces: FloorLateralForce[];
  notes: string[];
}

export function calculateEquivalentBaseShear(input: EquivalentBaseShearInput): EquivalentBaseShearResult | null {
  const {
    ss,
    s1,
    soilClass,
    importanceFactorI: I,
    behaviorFactorR: R,
    overstrengthFactorD: D = 2.5,
    totalWeightKn,
    numFloors,
    buildingHeightM: HN,
    systemType = "concrete_frame",
    ctFactor: customCt,
    floors: inputFloors,
  } = input;

  if (
    [ss, s1, I, R, D, numFloors, HN].some((val) => !Number.isFinite(val) || val <= 0) ||
    (soilClass === "ZF")
  ) {
    return null;
  }

  // 1. Zemin ve Tasarım Spektrumu Parametreleri (TBDY 2018 §2.3)
  const spectrumParams = calculateDesignSpectrumParameters(soilClass, ss, s1);
  if (!spectrumParams) return null;

  const { fs, f1, sds, sd1, ta, tb, tl } = spectrumParams;

  // 2. Taşıyıcı Sistem Ct Katsayısı (TBDY 2018 §4.7.3)
  let ct = customCt;
  if (!ct || ct <= 0) {
    if (systemType === "steel_frame") ct = 0.08;
    else if (systemType === "shear_wall_other") ct = 0.05;
    else ct = 0.07; // concrete_frame
  }

  // 3. Hakim Doğal Titreşim Periyodu TpA = Ct * HN^(3/4)
  const empiricalPeriodTp = ct * Math.pow(HN, 0.75);

  // 4. Yatay Elastik Tasarım Spektrumu Sae(Tp)
  const elasticSpectralAccelerationSae = calculateHorizontalElasticSpectrum(empiricalPeriodTp, {
    sds,
    sd1,
    ta,
    tb,
    tl,
  });

  if (!Number.isFinite(elasticSpectralAccelerationSae) || elasticSpectralAccelerationSae <= 0) {
    return null;
  }

  // 5. Deprem Yükü Azaltma Katsayısı Ra(T) (TBDY 2018 §4.2.1, Denklem 4.1)
  let raFactor: number;
  if (empiricalPeriodTp <= tb) {
    raFactor = D + (R / I - D) * (empiricalPeriodTp / tb);
  } else {
    raFactor = R / I;
  }

  // 6. Azaltılmış Tasarım Spektral İvmesi SaR(Tp)
  const reducedDesignSpectralAccelerationSar = elasticSpectralAccelerationSae / raFactor;

  // 7. Katların Ağırlık ve Yüksekliklerinin Belirlenmesi
  const notes: string[] = [];
  const resolvedFloors: Array<{ floorNumber: number; floorHeightM: number; floorWeightKn: number }> = [];
  let totalW = 0;

  if (inputFloors && inputFloors.length === numFloors) {
    let cumH = 0;
    for (const f of inputFloors) {
      cumH = f.floorHeightM; // Kümülatif yükseklik
      totalW += f.floorWeightKn;
      resolvedFloors.push({
        floorNumber: f.floorNumber,
        floorHeightM: cumH,
        floorWeightKn: f.floorWeightKn,
      });
    }
  } else {
    totalW = totalWeightKn ?? 1000 * numFloors;
    const avgFloorWeight = totalW / numFloors;
    const avgFloorHeight = HN / numFloors;
    for (let i = 1; i <= numFloors; i++) {
      resolvedFloors.push({
        floorNumber: i,
        floorHeightM: i * avgFloorHeight,
        floorWeightKn: avgFloorWeight,
      });
    }
  }

  // 8. Taban Kesme Kuvveti VtE = Wt * SaR(Tp) (TBDY 2018 Denklem 4.22)
  const calculatedBaseShearKn = totalW * reducedDesignSpectralAccelerationSar;

  // Minimum Taban Kesme Sınırı (TBDY 2018 Denklem 4.23: VtE >= 0.04 * Wt * I * SDS)
  const minimumBaseShearKn = 0.04 * totalW * I * sds;
  const isMinimumControlled = calculatedBaseShearKn < minimumBaseShearKn;
  const designBaseShearKn = Math.max(calculatedBaseShearKn, minimumBaseShearKn);

  if (isMinimumControlled) {
    notes.push("Hesaplanan taban kesme kuvveti TBDY Denklem 4.23 minimum sınırından küçük olduğu için minimum taban kesme uygulandı.");
  }

  // 9. Ek Tepe Kuvveti Delta FnE (TBDY 2018 §4.7.2)
  let deltaFnE = 0;
  if (HN > 25) {
    deltaFnE = Math.min(0.0075 * numFloors * designBaseShearKn, 0.2 * designBaseShearKn);
  }

  // 10. Kat Deprem Kuvvetlerinin Dağıtımı Fi (TBDY 2018 Denklem 4.24)
  const sumWiHi = resolvedFloors.reduce((sum, f) => sum + f.floorWeightKn * f.floorHeightM, 0);
  const remainingBaseShear = designBaseShearKn - deltaFnE;

  const floorForces: FloorLateralForce[] = [];
  let cumulativeStoryShear = 0;

  // Üstten alta doğru kat kesmelerini topluyoruz
  for (let i = resolvedFloors.length - 1; i >= 0; i--) {
    const f = resolvedFloors[i];
    let lateralForce = (remainingBaseShear * (f.floorWeightKn * f.floorHeightM)) / (sumWiHi || 1);
    if (f.floorNumber === numFloors) {
      lateralForce += deltaFnE;
    }
    cumulativeStoryShear += lateralForce;

    floorForces.unshift({
      floorNumber: f.floorNumber,
      floorHeightM: Number(f.floorHeightM.toFixed(2)),
      floorWeightKn: Number(f.floorWeightKn.toFixed(1)),
      lateralForceKn: Number(lateralForce.toFixed(2)),
      storyShearKn: Number(cumulativeStoryShear.toFixed(2)),
    });
  }

  return {
    fs: Number(fs.toFixed(3)),
    f1: Number(f1.toFixed(3)),
    sds: Number(sds.toFixed(3)),
    sd1: Number(sd1.toFixed(3)),
    ta: Number(ta.toFixed(3)),
    tb: Number(tb.toFixed(3)),
    tl,
    empiricalPeriodTp: Number(empiricalPeriodTp.toFixed(3)),
    elasticSpectralAccelerationSae: Number(elasticSpectralAccelerationSae.toFixed(4)),
    raFactor: Number(raFactor.toFixed(3)),
    reducedDesignSpectralAccelerationSar: Number(reducedDesignSpectralAccelerationSar.toFixed(4)),
    calculatedBaseShearKn: Number(calculatedBaseShearKn.toFixed(2)),
    minimumBaseShearKn: Number(minimumBaseShearKn.toFixed(2)),
    designBaseShearKn: Number(designBaseShearKn.toFixed(2)),
    isMinimumControlled,
    deltaFnE: Number(deltaFnE.toFixed(2)),
    floorForces,
    notes,
  };
}
