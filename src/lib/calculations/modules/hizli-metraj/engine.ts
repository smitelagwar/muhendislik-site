import {
  calculateOfficialUnitCost,
  getOfficialCostRow,
  type OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";
import {
  getQuickQuantityDefaultPreset,
  getQuickQuantityPreset,
  isQuickQuantityOfficialSelectionSupported,
} from "./presets";
import { getRoughStructureUnitPriceBook } from "./rough-structure-unit-prices";
import type {
  QuickQuantityAppliedFactor,
  QuickQuantityAuxiliaryCostItem,
  QuickQuantityBenchmarkItem,
  QuickQuantityBenchmarkStatus,
  QuickQuantityBreakdown,
  QuickQuantityBreakdownId,
  QuickQuantityCoefficientSet,
  QuickQuantityFactorSet,
  QuickQuantityFoundationType,
  QuickQuantityInput,
  QuickQuantityInsight,
  QuickQuantityPlanCompactness,
  QuickQuantityPreset,
  QuickQuantityResult,
  QuickQuantitySeismicDemand,
  QuickQuantitySiteDifficulty,
  QuickQuantitySlabSystem,
  QuickQuantitySoilClass,
  QuickQuantitySpanClass,
  QuickQuantityStructuralSystem,
  QuickQuantityValueBand,
  QuickQuantityWarning,
} from "./types";

type BreakdownFactorMap = Record<QuickQuantityBreakdownId, QuickQuantityFactorSet>;

function createNeutralFactors(): BreakdownFactorMap {
  return {
    temel: { beton: 1, donati: 1, kalip: 1 },
    kolonPerde: { beton: 1, donati: 1, kalip: 1 },
    kirisDoseme: { beton: 1, donati: 1, kalip: 1 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  };
}

const STRUCTURAL_SYSTEM_FACTORS: Record<QuickQuantityStructuralSystem, BreakdownFactorMap> = {
  cerceve: {
    temel: { beton: 0.96, donati: 0.95, kalip: 0.97 },
    kolonPerde: { beton: 0.92, donati: 0.92, kalip: 0.95 },
    kirisDoseme: { beton: 1.02, donati: 1, kalip: 1.02 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  },
  cercevePerde: createNeutralFactors(),
  perdeAgirlikli: {
    temel: { beton: 1.1, donati: 1.12, kalip: 1.04 },
    kolonPerde: { beton: 1.18, donati: 1.2, kalip: 1.08 },
    kirisDoseme: { beton: 0.96, donati: 0.98, kalip: 0.95 },
    merdivenCekirdek: { beton: 1.04, donati: 1.05, kalip: 1.02 },
  },
};

const SLAB_SYSTEM_FACTORS: Record<QuickQuantitySlabSystem, BreakdownFactorMap> = {
  kirisli: createNeutralFactors(),
  asmolen: {
    temel: { beton: 1, donati: 1, kalip: 1 },
    kolonPerde: { beton: 0.98, donati: 0.97, kalip: 0.98 },
    kirisDoseme: { beton: 0.94, donati: 0.95, kalip: 0.9 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  },
  duzPlak: {
    temel: { beton: 1, donati: 1, kalip: 1 },
    kolonPerde: { beton: 1.03, donati: 1.05, kalip: 0.97 },
    kirisDoseme: { beton: 0.99, donati: 1.08, kalip: 0.86 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  },
};

const FOUNDATION_FACTORS: Record<QuickQuantityFoundationType, QuickQuantityFactorSet> = {
  radye: { beton: 1.08, donati: 1.1, kalip: 0.98 },
  surekli: { beton: 0.94, donati: 0.92, kalip: 1 },
  tekil: { beton: 0.82, donati: 0.78, kalip: 0.92 },
};

const SOIL_FACTORS: Record<QuickQuantitySoilClass, QuickQuantityFactorSet> = {
  ZA: { beton: 0.92, donati: 0.9, kalip: 0.96 },
  ZB: { beton: 0.97, donati: 0.97, kalip: 0.98 },
  ZC: { beton: 1, donati: 1, kalip: 1 },
  ZD: { beton: 1.08, donati: 1.1, kalip: 1.03 },
  ZE: { beton: 1.18, donati: 1.22, kalip: 1.06 },
};

const SEISMIC_FACTORS: Record<QuickQuantitySeismicDemand, BreakdownFactorMap> = {
  dusuk: {
    temel: { beton: 0.96, donati: 0.95, kalip: 0.98 },
    kolonPerde: { beton: 0.94, donati: 0.93, kalip: 0.97 },
    kirisDoseme: { beton: 0.98, donati: 0.97, kalip: 1 },
    merdivenCekirdek: { beton: 0.97, donati: 0.97, kalip: 0.99 },
  },
  orta: createNeutralFactors(),
  yuksek: {
    temel: { beton: 1.08, donati: 1.12, kalip: 1.01 },
    kolonPerde: { beton: 1.14, donati: 1.18, kalip: 1.05 },
    kirisDoseme: { beton: 1.03, donati: 1.06, kalip: 1.01 },
    merdivenCekirdek: { beton: 1.04, donati: 1.05, kalip: 1.01 },
  },
};

const PLAN_FACTORS: Record<QuickQuantityPlanCompactness, BreakdownFactorMap> = {
  kompakt: {
    temel: { beton: 0.95, donati: 0.96, kalip: 0.94 },
    kolonPerde: { beton: 0.97, donati: 0.98, kalip: 0.95 },
    kirisDoseme: { beton: 0.99, donati: 0.99, kalip: 0.98 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  },
  standart: createNeutralFactors(),
  girintili: {
    temel: { beton: 1.08, donati: 1.06, kalip: 1.08 },
    kolonPerde: { beton: 1.06, donati: 1.04, kalip: 1.1 },
    kirisDoseme: { beton: 1.02, donati: 1.01, kalip: 1.05 },
    merdivenCekirdek: { beton: 1.02, donati: 1.01, kalip: 1.03 },
  },
};

const SPAN_FACTORS: Record<QuickQuantitySpanClass, BreakdownFactorMap> = {
  dar: {
    temel: { beton: 0.98, donati: 1, kalip: 0.98 },
    kolonPerde: { beton: 1.06, donati: 1.04, kalip: 1.05 },
    kirisDoseme: { beton: 0.94, donati: 0.93, kalip: 0.95 },
    merdivenCekirdek: { beton: 1, donati: 1, kalip: 1 },
  },
  standart: createNeutralFactors(),
  genis: {
    temel: { beton: 1.05, donati: 1.06, kalip: 1.01 },
    kolonPerde: { beton: 0.97, donati: 0.99, kalip: 0.96 },
    kirisDoseme: { beton: 1.08, donati: 1.12, kalip: 1.06 },
    merdivenCekirdek: { beton: 1.02, donati: 1.03, kalip: 1.01 },
  },
};

const RETAINING_FACTORS = {
  yok: {
    temel: { beton: 1, donati: 1, kalip: 1 },
    kolonPerde: { beton: 1, donati: 1, kalip: 1 },
  },
  kismi: {
    temel: { beton: 1.04, donati: 1.05, kalip: 1.02 },
    kolonPerde: { beton: 1.05, donati: 1.08, kalip: 1.04 },
  },
  tam: {
    temel: { beton: 1.1, donati: 1.12, kalip: 1.04 },
    kolonPerde: { beton: 1.12, donati: 1.16, kalip: 1.08 },
  },
} as const;

const PLAN_PERIMETER_MULTIPLIER: Record<QuickQuantityPlanCompactness, number> = {
  kompakt: 1.02,
  standart: 1.14,
  girintili: 1.3,
};

const BREAKDOWN_LABELS: Record<QuickQuantityBreakdownId, string> = {
  temel: "Temel",
  kolonPerde: "Kolon ve Perde",
  kirisDoseme: "Kiriş ve Döşeme",
  merdivenCekirdek: "Merdiven ve Çekirdek",
};

const STRUCTURAL_SYSTEM_LABELS: Record<QuickQuantityStructuralSystem, string> = {
  cerceve: "Çerçeve",
  cercevePerde: "Çerçeve + Perde",
  perdeAgirlikli: "Perde Ağırlıklı",
};

const SLAB_SYSTEM_LABELS: Record<QuickQuantitySlabSystem, string> = {
  kirisli: "Kirişli Döşeme",
  asmolen: "Asmolen Döşeme",
  duzPlak: "Düz Plak",
};

const FOUNDATION_TYPE_LABELS: Record<QuickQuantityFoundationType, string> = {
  radye: "Radye Temel",
  surekli: "Sürekli Temel",
  tekil: "Tekil Temel",
};

const SOIL_CLASS_LABELS: Record<QuickQuantitySoilClass, string> = {
  ZA: "ZA",
  ZB: "ZB",
  ZC: "ZC",
  ZD: "ZD",
  ZE: "ZE",
};

const SEISMIC_LABELS: Record<QuickQuantitySeismicDemand, string> = {
  dusuk: "Düşük Deprem Talebi",
  orta: "Standart Deprem Talebi",
  yuksek: "Yüksek Deprem Talebi",
};

const PLAN_LABELS: Record<QuickQuantityPlanCompactness, string> = {
  kompakt: "Kompakt Plan",
  standart: "Standart Plan",
  girintili: "Girintili / Çıkıntılı Plan",
};

const SPAN_LABELS: Record<QuickQuantitySpanClass, string> = {
  dar: "Dar Açıklık",
  standart: "Standart Açıklık",
  genis: "Geniş Açıklık",
};

const RETAINING_LABELS = {
  yok: "Çevre Perdesi Yok",
  kismi: "Kısmi Çevre Perdesi",
  tam: "Tam Çevre Perdesi",
} as const;

const SITE_DIFFICULTY_LABELS: Record<QuickQuantitySiteDifficulty, string> = {
  dusuk: "Düşük saha zorluğu",
  orta: "Orta saha zorluğu",
  yuksek: "Yüksek saha zorluğu",
};

function multiplyFactors(
  base: QuickQuantityFactorSet,
  extra: QuickQuantityFactorSet
): QuickQuantityFactorSet {
  return {
    beton: base.beton * extra.beton,
    donati: base.donati * extra.donati,
    kalip: base.kalip * extra.kalip,
  };
}

function applyFactorMap(target: BreakdownFactorMap, factors: BreakdownFactorMap) {
  for (const key of Object.keys(target) as QuickQuantityBreakdownId[]) {
    target[key] = multiplyFactors(target[key], factors[key]);
  }
}

function isNeutralFactorSet(factor: QuickQuantityFactorSet): boolean {
  return factor.beton === 1 && factor.donati === 1 && factor.kalip === 1;
}

function createAppliedFactorEntries(
  prefix: string,
  label: string,
  factors: Partial<BreakdownFactorMap>,
  note?: string
): QuickQuantityAppliedFactor[] {
  return (Object.keys(factors) as QuickQuantityBreakdownId[])
    .filter((target) => {
      const factor = factors[target];
      return factor !== undefined && !isNeutralFactorSet(factor);
    })
    .map((target) =>
      createAppliedFactor(
        `${prefix}-${target}`,
        label,
        target,
        factors[target] as QuickQuantityFactorSet,
        note
      )
    );
}

function normalizeQuickQuantityInput(rawInput: QuickQuantityInput): QuickQuantityInput {
  if (rawInput.bodrumKatSayisi <= 0) {
    return {
      ...rawInput,
      bodrumKatAlaniM2: null,
      bodrumCevrePerdesi: "yok",
    };
  }

  return rawInput;
}

function safePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function basisAreaForBreakdown(
  breakdownId: QuickQuantityBreakdownId,
  totalArea: number,
  foundationArea: number
) {
  if (breakdownId === "temel") {
    return {
      basisAreaM2: foundationArea,
      basisLabel: "Temel izi",
    };
  }

  return {
    basisAreaM2: totalArea,
    basisLabel: "Toplam inşaat alanı",
  };
}

function applyFactorsToCoefficients(
  base: QuickQuantityCoefficientSet,
  factors: QuickQuantityFactorSet
): QuickQuantityCoefficientSet {
  return {
    betonM3PerM2: base.betonM3PerM2 * factors.beton,
    donatiKgPerM2: base.donatiKgPerM2 * factors.donati,
    kalipM2PerM2: base.kalipM2PerM2 * factors.kalip,
  };
}

function createAppliedFactor(
  id: string,
  label: string,
  target: QuickQuantityAppliedFactor["target"],
  factor: QuickQuantityFactorSet,
  note?: string
): QuickQuantityAppliedFactor {
  return {
    id,
    label,
    target,
    betonFactor: factor.beton,
    donatiFactor: factor.donati,
    kalipFactor: factor.kalip,
    note,
  };
}

function getBasementAppliedFactors(
  basementCount: number,
  basementAreaRatio: number
): QuickQuantityAppliedFactor[] {
  if (basementCount <= 0) {
    return [];
  }

  const temelFactor = {
    beton: Math.min(1.18, 1 + basementCount * 0.04),
    donati: Math.min(1.2, 1 + basementCount * 0.05),
    kalip: Math.min(1.24, 1 + basementCount * 0.06),
  };

  const kolonPerdeFactor = {
    beton: 1 + basementAreaRatio * 0.14,
    donati: 1 + basementAreaRatio * 0.18,
    kalip: 1 + basementAreaRatio * 0.08,
  };

  return [
    createAppliedFactor(
      "bodrum-temel",
      `Bodrum etkisi (${basementCount} kat)`,
      "temel",
      temelFactor,
      "Bodrum adedi arttıkça temel kalınlığı, perde ayakları ve kalıp ihtiyacı birlikte yükselir."
    ),
    createAppliedFactor(
      "bodrum-kolon-perde",
      "Bodrum perde yoğunluğu",
      "kolonPerde",
      kolonPerdeFactor,
      "Bodrum oranı yükseldikçe çevre perdesi ve çekirdek duvarları daha baskın hale gelir."
    ),
  ];
}

function getResolvedOfficialSelection(input: QuickQuantityInput): OfficialCostSelection {
  const preset = getQuickQuantityPreset(input.yapiArketipi) ?? getQuickQuantityDefaultPreset();
  return input.resmiSinif ?? preset.officialSelection;
}

function getBasementStoreyHeightM(preset: QuickQuantityPreset): number {
  if (preset.id === "ofis-banka-idari") {
    return 3.8;
  }

  if (preset.id === "otopark-akaryakit") {
    return 3.6;
  }

  if (preset.id === "karma-kullanim") {
    return 3.9;
  }

  return 3.4;
}

function getRetainingRatio(
  input: QuickQuantityInput
): number {
  if (input.bodrumKatSayisi <= 0) {
    return 0;
  }

  switch (input.bodrumCevrePerdesi) {
    case "kismi":
      return 0.55;
    case "tam":
      return 0.95;
    case "yok":
    default:
      return 0;
  }
}

function getReferenceBand(expected: number, lowFactor = 0.9, highFactor = 1.15): QuickQuantityValueBand {
  return {
    low: expected * lowFactor,
    expected,
    high: expected * highFactor,
  };
}

function resolveBenchmarkStatus(
  value: number,
  band: QuickQuantityValueBand
): QuickQuantityBenchmarkStatus {
  if (value < band.low) {
    return "dusuk";
  }

  if (value > band.high) {
    return "yuksek";
  }

  return "beklenen";
}

function getAuxiliaryRatioBand(input: QuickQuantityInput): QuickQuantityValueBand {
  let expected = 0.045;

  if (input.temelTipi === "radye") {
    expected += 0.012;
  } else if (input.temelTipi === "surekli") {
    expected += 0.006;
  }

  expected += input.bodrumKatSayisi * 0.018;

  if (input.bodrumCevrePerdesi === "kismi") {
    expected += 0.02;
  } else if (input.bodrumCevrePerdesi === "tam") {
    expected += 0.045;
  }

  if (input.zeminSinifi === "ZD") {
    expected += 0.012;
  } else if (input.zeminSinifi === "ZE") {
    expected += 0.024;
  } else if (input.zeminSinifi === "ZA") {
    expected -= 0.008;
  }

  if (input.planKompaktligi === "girintili") {
    expected += 0.01;
  } else if (input.planKompaktligi === "kompakt") {
    expected -= 0.004;
  }

  if (input.tipikAciklik === "genis") {
    expected += 0.006;
  }

  const boundedExpected = Math.min(0.26, Math.max(0.035, expected));
  return {
    low: boundedExpected * 0.78,
    expected: boundedExpected,
    high: boundedExpected * 1.28,
  };
}

function getPresetExpectedIntensities(preset: QuickQuantityPreset) {
  const expected = (Object.keys(preset.baseBreakdown) as QuickQuantityBreakdownId[]).reduce(
    (accumulator, key) => ({
      betonM3PerM2: accumulator.betonM3PerM2 + preset.baseBreakdown[key].betonM3PerM2,
      donatiKgPerM2: accumulator.donatiKgPerM2 + preset.baseBreakdown[key].donatiKgPerM2,
      kalipM2PerM2: accumulator.kalipM2PerM2 + preset.baseBreakdown[key].kalipM2PerM2,
    }),
    { betonM3PerM2: 0, donatiKgPerM2: 0, kalipM2PerM2: 0 }
  );

  return {
    betonM3PerM2: getReferenceBand(expected.betonM3PerM2, 0.9, 1.18),
    donatiKgPerM2: getReferenceBand(expected.donatiKgPerM2, 0.88, 1.18),
    kalipM2PerM2: getReferenceBand(expected.kalipM2PerM2, 0.9, 1.15),
  };
}

function getSiteDifficulty(input: QuickQuantityInput): QuickQuantitySiteDifficulty {
  let score = 0;

  if (input.bodrumKatSayisi > 0) {
    score += 1 + input.bodrumKatSayisi * 0.8;
  }

  if (input.bodrumCevrePerdesi === "kismi") {
    score += 1;
  } else if (input.bodrumCevrePerdesi === "tam") {
    score += 2;
  }

  if (input.zeminSinifi === "ZD") {
    score += 1;
  } else if (input.zeminSinifi === "ZE") {
    score += 2;
  }

  if (input.planKompaktligi === "girintili") {
    score += 1;
  }

  if (input.depremTalebi === "yuksek") {
    score += 1;
  }

  if (input.tipikAciklik === "genis") {
    score += 0.8;
  }

  if (score >= 5) {
    return "yuksek";
  }

  if (score >= 2.5) {
    return "orta";
  }

  return "dusuk";
}

function buildAuxiliaryCostDistribution(
  input: QuickQuantityInput,
  geometry: QuickQuantityResult["geometriOzet"],
  expectedAmount: number
): QuickQuantityAuxiliaryCostItem[] {
  const items = [
    {
      id: "kazi",
      label: "Kazı, nakliye ve geri dolgu",
      score: geometry.excavationVolumeM3 * (input.bodrumKatSayisi > 0 ? 1.15 : 0.85),
      note: "Kazı derinliği, çalışma payı ve bodrum adedi arttıkça ilk baskın yardımcı iş kalemi haline gelir.",
    },
    {
      id: "grobeton",
      label: "Grobeton ve alt hazırlık",
      score: geometry.leanConcreteM3 * 6.5,
      note: "Radye ve geniş temel izinde grobeton alt hazırlığı daha görünür hale gelir.",
    },
    {
      id: "yalitim",
      label: "Bohçalama ve su yalıtımı",
      score:
        geometry.waterproofingAreaM2 *
        (input.bodrumCevrePerdesi === "tam"
          ? 1.55
          : input.bodrumCevrePerdesi === "kismi"
            ? 1.15
            : 0.22),
      note: "Tam bodrum ve çevre perdesi arttıkça bohçalama ile koruma katmanları maliyetin önüne geçer.",
    },
    {
      id: "drenaj",
      label: "Drenaj ve koruma katmanları",
      score: geometry.drainageLengthM * 3.4 + geometry.basementWallAreaM2 * 0.12,
      note: "Bodrumlu şehir içi yapılarda drenaj hattı ve koruma tabakaları ihmal edilmemelidir.",
    },
    {
      id: "saha",
      label: "İksa / çalışma payı / saha organizasyonu",
      score:
        geometry.perimeterM * (input.bodrumKatSayisi > 0 ? 1.3 : 0.45) +
        input.bodrumKatSayisi * 25 +
        (input.planKompaktligi === "girintili" ? 18 : 0),
      note: "Dar parsel, girintili plan ve çok bodrumlu çözüm saha organizasyonu yükünü büyütür.",
    },
  ].filter((item) => item.score > 0.01);

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  if (totalScore <= 0 || expectedAmount <= 0) {
    return [];
  }

  return items
    .map((item) => ({
      id: item.id,
      label: item.label,
      share: item.score / totalScore,
      amount: expectedAmount * (item.score / totalScore),
      note: item.note,
    }))
    .sort((left, right) => right.amount - left.amount);
}

function buildControlPriority(
  input: QuickQuantityInput,
  siteDifficulty: QuickQuantitySiteDifficulty
): Pick<QuickQuantityInsight, "value" | "tone" | "note"> {
  if (input.bodrumKatSayisi > 0 && input.bodrumCevrePerdesi !== "yok") {
    return {
      value: "Geoteknik rapor + iksa + su yalıtımı",
      tone: "warning",
      note: "Bodrumlu ve çevre perdeli çözümde hafriyat, iksa, su yalıtımı ve drenaj paketi statik kadar kritiktir.",
    };
  }

  if (input.depremTalebi === "yuksek" || input.tasiyiciSistem !== "cerceve") {
    return {
      value: "Perde sürekliliği ve düğüm bölgeleri",
      tone: "warning",
      note: "Yüksek deprem talebinde perde yerleşimi, rijitlik sürekliliği ve düğüm bölgeleri öncelikli kontroldür.",
    };
  }

  if (input.tipikAciklik === "genis" || input.dosemeSistemi === "duzPlak") {
    return {
      value: "Döşeme sehim / punch kontrolü",
      tone: "info",
      note: "Geniş açıklık veya düz plak tercihinde sehim, punch ve kalınlık optimizasyonu erken aşamada netleşmelidir.",
    };
  }

  return {
    value: siteDifficulty === "yuksek" ? "Saha lojistiği ve temel altı hazırlık" : "Aks düzeni ve kat tekrarı",
    tone: "info",
    note:
      siteDifficulty === "yuksek"
        ? "Saha zorluğu yüksek olduğunda temel altı hazırlık ve şantiye lojistiği kaba yapı verimini belirler."
        : "Düzenli aks ve tekrarlı kat çözümü ön keşif sapmasını aşağı çeker.",
  };
}

export function validateQuickQuantityInput(rawInput: QuickQuantityInput): string | null {
  const input = normalizeQuickQuantityInput(rawInput);
  if (safePositive(input.katAlaniM2) <= 0) {
    return "Kat alanı sıfırdan büyük olmalıdır.";
  }

  if (!Number.isInteger(input.normalKatSayisi) || input.normalKatSayisi < 1) {
    return "Normal kat sayısı en az 1 olmalıdır.";
  }

  if (!Number.isInteger(input.bodrumKatSayisi) || input.bodrumKatSayisi < 0) {
    return "Bodrum kat sayısı negatif olamaz.";
  }

  if (input.bodrumKatAlaniM2 !== null && safePositive(input.bodrumKatAlaniM2) <= 0) {
    return "Bodrum kat alanı girildiyse sıfırdan büyük olmalıdır.";
  }

  const resolvedSelection = getResolvedOfficialSelection(input);
  if (!getOfficialCostRow(resolvedSelection)) {
    return "Seçilen resmî sınıf 2026 tablosunda bulunamadı.";
  }

  if (!isQuickQuantityOfficialSelectionSupported(resolvedSelection)) {
    return "Seçilen resmî sınıf bu v1 metraj aracında desteklenmiyor. Resmî Birim Maliyet aracına geçerek toplam yaklaşık maliyeti inceleyin.";
  }

  return null;
}

export function calculateQuickQuantity(rawInput: QuickQuantityInput): QuickQuantityResult | null {
  const input = normalizeQuickQuantityInput(rawInput);
  const validationError = validateQuickQuantityInput(input);
  if (validationError) {
    return null;
  }

  const preset = getQuickQuantityPreset(input.yapiArketipi) ?? getQuickQuantityDefaultPreset();
  const priceBook = getRoughStructureUnitPriceBook();
  const resolvedOfficialSelection = getResolvedOfficialSelection(input);
  const officialResult = calculateOfficialUnitCost(
    resolvedOfficialSelection,
    input.katAlaniM2 * input.normalKatSayisi +
      (input.bodrumKatSayisi > 0
        ? input.bodrumKatSayisi * (input.bodrumKatAlaniM2 ?? input.katAlaniM2)
        : 0)
  );

  if (!officialResult) {
    return null;
  }

  const resolvedBodrumKatAlaniM2 =
    input.bodrumKatSayisi > 0 ? input.bodrumKatAlaniM2 ?? input.katAlaniM2 : 0;
  const toplamNormalAlanM2 = input.katAlaniM2 * input.normalKatSayisi;
  const toplamBodrumAlanM2 = input.bodrumKatSayisi * resolvedBodrumKatAlaniM2;
  const toplamInsaatAlaniM2 = toplamNormalAlanM2 + toplamBodrumAlanM2;
  const temelIziAlaniM2 = Math.max(input.katAlaniM2, resolvedBodrumKatAlaniM2 || 0);
  const basementAreaRatio =
    toplamInsaatAlaniM2 > 0 ? toplamBodrumAlanM2 / toplamInsaatAlaniM2 : 0;
  const basementStoreyHeightM = getBasementStoreyHeightM(preset);
  const retainingRatio = getRetainingRatio(input);

  const structuralFactors = STRUCTURAL_SYSTEM_FACTORS[input.tasiyiciSistem];
  const slabFactors = SLAB_SYSTEM_FACTORS[input.dosemeSistemi];
  const foundationFactors = FOUNDATION_FACTORS[input.temelTipi];
  const soilFactors = SOIL_FACTORS[input.zeminSinifi];
  const seismicFactors = SEISMIC_FACTORS[input.depremTalebi];
  const planFactors = PLAN_FACTORS[input.planKompaktligi];
  const spanFactors = SPAN_FACTORS[input.tipikAciklik];
  const retainingFactors =
    input.bodrumKatSayisi > 0
      ? RETAINING_FACTORS[input.bodrumCevrePerdesi]
      : RETAINING_FACTORS.yok;
  const basementFactors = getBasementAppliedFactors(input.bodrumKatSayisi, basementAreaRatio);

  const appliedFactors: QuickQuantityAppliedFactor[] = [
    ...createAppliedFactorEntries(
      "tasiyici-sistem",
      `Taşıyıcı sistem: ${STRUCTURAL_SYSTEM_LABELS[input.tasiyiciSistem]}`,
      structuralFactors,
      "Seçilen taşıyıcı sistem yalnız bir grubu değil, temelden döşemeye tüm kaba taşıyıcı paketi etkiler."
    ),
    ...createAppliedFactorEntries(
      "doseme-sistemi",
      `Döşeme sistemi: ${SLAB_SYSTEM_LABELS[input.dosemeSistemi]}`,
      slabFactors,
      "Döşeme sistemi özellikle kiriş-döşeme grubunu değiştirir; kolon-perde ve çekirdek üzerinde de dolaylı etkiler oluşturur."
    ),
    ...createAppliedFactorEntries(
      "deprem-talebi",
      `Deprem talebi: ${SEISMIC_LABELS[input.depremTalebi]}`,
      seismicFactors,
      "TBDY pratiğinde deprem talebi yükseldikçe perde, düğüm ve temel donatısı birlikte büyür."
    ),
    ...createAppliedFactorEntries(
      "plan-kompaktligi",
      `Plan kompaktlığı: ${PLAN_LABELS[input.planKompaktligi]}`,
      planFactors,
      "Girintili planlar çevre uzunluğu, kalıp yüzeyi ve temel karmaşıklığını yükseltir."
    ),
    ...createAppliedFactorEntries(
      "tipik-aciklik",
      `Tipik açıklık: ${SPAN_LABELS[input.tipikAciklik]}`,
      spanFactors,
      "Geniş açıklık döşeme ve kiriş grubunda beton ve donatı yoğunluğunu yükseltir."
    ),
    ...(!isNeutralFactorSet(foundationFactors)
      ? [
          createAppliedFactor(
            "temel-tipi",
            `Temel tipi: ${FOUNDATION_TYPE_LABELS[input.temelTipi]}`,
            "temel",
            foundationFactors,
            "Temel tipi yalnız temel grubuna uygulanır."
          ),
        ]
      : []),
    ...(!isNeutralFactorSet(soilFactors)
      ? [
          createAppliedFactor(
            "zemin-sinifi",
            `Zemin sınıfı: ${SOIL_CLASS_LABELS[input.zeminSinifi]}`,
            "temel",
            soilFactors,
            "Zemin sınıfı çarpanı yalnız temel grubuna uygulanır; üst yapı kör çarpanla büyütülmez."
          ),
        ]
      : []),
    ...(input.bodrumKatSayisi > 0
      ? [
          ...createAppliedFactorEntries(
            "bodrum-cevre-perdesi",
            `Bodrum çevre perdesi: ${RETAINING_LABELS[input.bodrumCevrePerdesi]}`,
            {
              temel: retainingFactors.temel,
              kolonPerde: retainingFactors.kolonPerde,
            },
            "Şehir içi tam bodrum kurgusunda çevre perdesi, su yalıtımı ve temel kalınlığı birlikte büyür."
          ),
        ]
      : []),
    ...basementFactors,
  ];

  const factorMap = createNeutralFactors();
  applyFactorMap(factorMap, structuralFactors);
  applyFactorMap(factorMap, slabFactors);
  applyFactorMap(factorMap, seismicFactors);
  applyFactorMap(factorMap, planFactors);
  applyFactorMap(factorMap, spanFactors);

  factorMap.temel = multiplyFactors(factorMap.temel, foundationFactors);
  factorMap.temel = multiplyFactors(factorMap.temel, soilFactors);
  factorMap.temel = multiplyFactors(factorMap.temel, retainingFactors.temel);
  factorMap.kolonPerde = multiplyFactors(factorMap.kolonPerde, retainingFactors.kolonPerde);

  for (const factor of basementFactors) {
    if (factor.target === "genel") {
      continue;
    }

    factorMap[factor.target] = multiplyFactors(factorMap[factor.target], {
      beton: factor.betonFactor,
      donati: factor.donatiFactor,
      kalip: factor.kalipFactor,
    });
  }

  const breakdowns = (Object.keys(BREAKDOWN_LABELS) as QuickQuantityBreakdownId[]).map(
    (breakdownId) => {
      const { basisAreaM2, basisLabel } = basisAreaForBreakdown(
        breakdownId,
        toplamInsaatAlaniM2,
        temelIziAlaniM2
      );
      const base = preset.baseBreakdown[breakdownId];
      const resolved = applyFactorsToCoefficients(base, factorMap[breakdownId]);
      const betonM3 = basisAreaM2 * resolved.betonM3PerM2;
      const donatiKg = basisAreaM2 * resolved.donatiKgPerM2;
      const kalipM2 = basisAreaM2 * resolved.kalipM2PerM2;
      const directCost =
        betonM3 * priceBook.entries.concreteC30_37.unitPrice +
        (donatiKg / 1000) * priceBook.weightedRebarUnitPrice +
        kalipM2 * priceBook.entries.formworkPlywood.unitPrice;

      return {
        id: breakdownId,
        label: BREAKDOWN_LABELS[breakdownId],
        basisAreaM2,
        basisLabel,
        betonM3PerM2: resolved.betonM3PerM2,
        donatiKgPerM2: resolved.donatiKgPerM2,
        kalipM2PerM2: resolved.kalipM2PerM2,
        betonM3,
        donatiKg,
        donatiTon: donatiKg / 1000,
        kalipM2,
        directCost,
        directCostShare: 0,
        notes: [
          `${basisLabel} üzerinden hesaplandı.`,
          breakdownId === "temel"
            ? "Temel grubu yalnız temel izi alanını baz alır."
            : "Üst yapı alanı ile birlikte bodrum alanını da taşır.",
        ],
      } satisfies QuickQuantityBreakdown;
    }
  );

  const betonM3 = breakdowns.reduce((sum, item) => sum + item.betonM3, 0);
  const donatiKg = breakdowns.reduce((sum, item) => sum + item.donatiKg, 0);
  const kalipM2 = breakdowns.reduce((sum, item) => sum + item.kalipM2, 0);
  const betonMaliyeti = betonM3 * priceBook.entries.concreteC30_37.unitPrice;
  const donatiMaliyeti = (donatiKg / 1000) * priceBook.weightedRebarUnitPrice;
  const kalipMaliyeti = kalipM2 * priceBook.entries.formworkPlywood.unitPrice;
  const dogrudanTasiyiciMaliyet = betonMaliyeti + donatiMaliyeti + kalipMaliyeti;

  const normalizedBreakdowns = breakdowns.map((item) => ({
    ...item,
    directCostShare:
      dogrudanTasiyiciMaliyet > 0 ? item.directCost / dogrudanTasiyiciMaliyet : 0,
  }));

  const actualShare =
    officialResult.resmiToplamMaliyet > 0
      ? dogrudanTasiyiciMaliyet / officialResult.resmiToplamMaliyet
      : 0;

  const yogunlukOzet = {
    betonM3PerM2: toplamInsaatAlaniM2 > 0 ? betonM3 / toplamInsaatAlaniM2 : 0,
    donatiKgPerM2: toplamInsaatAlaniM2 > 0 ? donatiKg / toplamInsaatAlaniM2 : 0,
    kalipM2PerM2: toplamInsaatAlaniM2 > 0 ? kalipM2 / toplamInsaatAlaniM2 : 0,
    directCostPerM2:
      toplamInsaatAlaniM2 > 0 ? dogrudanTasiyiciMaliyet / toplamInsaatAlaniM2 : 0,
  };

  const expectedReference = getPresetExpectedIntensities(preset);
  const referenceDirectCostExpected =
    expectedReference.betonM3PerM2.expected * priceBook.entries.concreteC30_37.unitPrice +
    (expectedReference.donatiKgPerM2.expected / 1000) * priceBook.weightedRebarUnitPrice +
    expectedReference.kalipM2PerM2.expected * priceBook.entries.formworkPlywood.unitPrice;
  const referansBantlar = {
    ...expectedReference,
    directCostPerM2: getReferenceBand(referenceDirectCostExpected, 0.88, 1.2),
  };

  const perimeterM =
    temelIziAlaniM2 > 0
      ? 4 * Math.sqrt(temelIziAlaniM2) * PLAN_PERIMETER_MULTIPLIER[input.planKompaktligi]
      : 0;
  const excavationDepthM =
    input.bodrumKatSayisi > 0
      ? input.bodrumKatSayisi * basementStoreyHeightM + 1.15
      : input.temelTipi === "radye"
        ? 1.8
        : input.temelTipi === "surekli"
          ? 1.45
          : 1.25;
  const excavationWorkingSpaceFactor =
    input.bodrumKatSayisi > 0
      ? input.planKompaktligi === "kompakt"
        ? 1.18
        : input.planKompaktligi === "girintili"
          ? 1.32
          : 1.24
      : input.planKompaktligi === "kompakt"
        ? 1.08
        : input.planKompaktligi === "girintili"
          ? 1.16
          : 1.12;
  const basementWallAreaM2 =
    input.bodrumKatSayisi > 0 ? perimeterM * basementStoreyHeightM * input.bodrumKatSayisi * retainingRatio : 0;
  const excavationVolumeM3 = temelIziAlaniM2 * excavationDepthM * excavationWorkingSpaceFactor;
  const leanConcreteM3 = temelIziAlaniM2 * (input.temelTipi === "radye" ? 0.1 : 0.08);
  const waterproofingAreaM2 =
    input.bodrumKatSayisi > 0
      ? temelIziAlaniM2 * (input.temelTipi === "radye" ? 1.08 : 0.72) +
        basementWallAreaM2 * 1.05
      : 0;
  const drainageLengthM = input.bodrumKatSayisi > 0 ? perimeterM * retainingRatio : 0;
  const geometriOzet = {
    footprintAreaM2: temelIziAlaniM2,
    perimeterM,
    basementWallAreaM2,
    excavationDepthM,
    excavationVolumeM3,
    leanConcreteM3,
    waterproofingAreaM2,
    drainageLengthM,
  };

  const auxiliaryRatioBand = getAuxiliaryRatioBand(input);
  const yardimciKabaIsBandi = {
    ...auxiliaryRatioBand,
    lowAmount: dogrudanTasiyiciMaliyet * auxiliaryRatioBand.low,
    expectedAmount: dogrudanTasiyiciMaliyet * auxiliaryRatioBand.expected,
    highAmount: dogrudanTasiyiciMaliyet * auxiliaryRatioBand.high,
    note:
      "Kazı, grobeton, bohçalama, drenaj ve geri dolgu gibi kalemler için poz-bazlı değil, Türkiye uygulama pratiğine göre oransal bir ön keşif bandıdır.",
  };
  const sahaZorlugu = getSiteDifficulty(input);
  const yardimciKabaIsDagilimi = buildAuxiliaryCostDistribution(
    input,
    geometriOzet,
    yardimciKabaIsBandi.expectedAmount
  );

  const yardimciMetrajlar: QuickQuantityResult["yardimciMetrajlar"] = [
    {
      id: "kazi",
      label: "Yaklaşık kazı hacmi",
      quantity: excavationVolumeM3,
      unit: "m3",
      basis: `Temel izi × ${excavationDepthM.toFixed(2)} m derinlik × ${excavationWorkingSpaceFactor.toFixed(2)} çalışma payı`,
      note: "İksa ve ulaşım kısıtları bu hacmi gerçek projede ayrıca büyütebilir.",
    },
    {
      id: "grobeton",
      label: "Yaklaşık grobeton",
      quantity: leanConcreteM3,
      unit: "m3",
      basis: `Temel izi × ${input.temelTipi === "radye" ? "0,10" : "0,08"} m`,
      note: "Radye temelde grobeton etkisi sürekli/tekil temele göre daha yüksek kabul edildi.",
    },
    {
      id: "bodrum-perdesi",
      label: "Yaklaşık bodrum perde alanı",
      quantity: basementWallAreaM2,
      unit: "m2",
      basis: "Çevre uzunluğu × bodrum yüksekliği × çevre perde oranı",
      note: "Tam bodrum çevre perdesi şehir içi parseller için kritik sürücüdür.",
    },
    {
      id: "bohcalama",
      label: "Yaklaşık bohçalama / su yalıtımı",
      quantity: waterproofingAreaM2,
      unit: "m2",
      basis: "Taban alanı ve bodrum perde yüzeyi üzerinden çözülür",
      note: "Membran kat sayısı, koruma betonu ve drenaj levhası dahil değildir; yalnız metraj yüzeyi verir.",
    },
    {
      id: "drenaj",
      label: "Yaklaşık drenaj hattı",
      quantity: drainageLengthM,
      unit: "m",
      basis: "Perimetre × çevre perde oranı",
      note: "Çevresel drenaj yalnız bodrumlu ve perde etkili senaryolarda anlamlıdır.",
    },
  ];

  const benchmarklar: QuickQuantityBenchmarkItem[] = [
    {
      id: "beton",
      label: "Beton yoğunluğu",
      value: yogunlukOzet.betonM3PerM2,
      unit: "m³/m²",
      band: referansBantlar.betonM3PerM2,
      status: resolveBenchmarkStatus(yogunlukOzet.betonM3PerM2, referansBantlar.betonM3PerM2),
      helper: "Seçilen arketip için toplam beton yoğunluğunun tipik bandı ile kıyaslanır.",
    },
    {
      id: "donati",
      label: "Donatı yoğunluğu",
      value: yogunlukOzet.donatiKgPerM2,
      unit: "kg/m²",
      band: referansBantlar.donatiKgPerM2,
      status: resolveBenchmarkStatus(yogunlukOzet.donatiKgPerM2, referansBantlar.donatiKgPerM2),
      helper: "Türkiye betonarme pratiğinde seçilen arketipin beklenen kg/m² bandı ile kıyaslanır.",
    },
    {
      id: "kalip",
      label: "Kalıp yoğunluğu",
      value: yogunlukOzet.kalipM2PerM2,
      unit: "m²/m²",
      band: referansBantlar.kalipM2PerM2,
      status: resolveBenchmarkStatus(yogunlukOzet.kalipM2PerM2, referansBantlar.kalipM2PerM2),
      helper: "Plan kompaktlığı ve kat düzeni kalıp yoğunluğunu ciddi etkiler.",
    },
    {
      id: "maliyet",
      label: "Doğrudan maliyet yoğunluğu",
      value: yogunlukOzet.directCostPerM2,
      unit: "TL/m²",
      band: referansBantlar.directCostPerM2,
      status: resolveBenchmarkStatus(yogunlukOzet.directCostPerM2, referansBantlar.directCostPerM2),
      helper: "Beton + donatı + kalıp maliyetinin brüt alana oranıdır.",
    },
  ];

  const baskinTasiyiciGrup = normalizedBreakdowns.reduce((current, item) =>
    item.directCostShare > current.directCostShare ? item : current
  );
  const baskinYardimciKalem = yardimciKabaIsDagilimi[0] ?? null;
  const kontrolOnceligi = buildControlPriority(input, sahaZorlugu);
  const genisletilmisKabaYapiBandi = {
    lowAmount: dogrudanTasiyiciMaliyet + yardimciKabaIsBandi.lowAmount,
    expectedAmount: dogrudanTasiyiciMaliyet + yardimciKabaIsBandi.expectedAmount,
    highAmount: dogrudanTasiyiciMaliyet + yardimciKabaIsBandi.highAmount,
  };
  const genisletilmisKabaYapiPayi =
    officialResult.resmiToplamMaliyet > 0
      ? genisletilmisKabaYapiBandi.expectedAmount / officialResult.resmiToplamMaliyet
      : 0;
  const kararOzetleri: QuickQuantityInsight[] = [
    {
      id: "tasiyici-surucu",
      title: "Baskın taşıyıcı grup",
      value: `${baskinTasiyiciGrup.label} (${Math.round(baskinTasiyiciGrup.directCostShare * 100)}%)`,
      tone:
        baskinTasiyiciGrup.id === "temel" || baskinTasiyiciGrup.id === "kolonPerde"
          ? "warning"
          : "info",
      note:
        baskinTasiyiciGrup.id === "temel"
          ? "Temel baskınlığı çoğunlukla bodrum, zemin sınıfı ve temel tipinin toplam etkisini gösterir."
          : "Bu grup kaba taşıyıcı muhasebesinde ilk odak kalemidir.",
    },
    {
      id: "saha-zorlugu",
      title: "Saha zorluğu",
      value: SITE_DIFFICULTY_LABELS[sahaZorlugu],
      tone: sahaZorlugu === "yuksek" ? "warning" : "info",
      note:
        sahaZorlugu === "yuksek"
          ? "Bodrum, çevre perdesi, zemin ve plan karmaşıklığı birlikte yüksek saha yükü üretir."
          : sahaZorlugu === "orta"
            ? "Yardımcı kaba işler ihmal edilemez; özellikle kazı ve su yalıtımı kalemleri kontrol edilmelidir."
            : "Saha etkisi sınırlı olsa da temel altı hazırlık ve drenaj kabulleri yine doğrulanmalıdır.",
    },
    {
      id: "yardimci-surucu",
      title: "Yardımcı iş baskını",
      value: baskinYardimciKalem
        ? `${baskinYardimciKalem.label} (${Math.round(baskinYardimciKalem.share * 100)}%)`
        : "Yardımcı iş bandı sınırlı",
      tone:
        baskinYardimciKalem && baskinYardimciKalem.share >= 0.32 ? "warning" : "info",
      note:
        baskinYardimciKalem?.note ??
        "Bu senaryoda yardımcı kaba işler toplam doğrudan taşıyıcı maliyete göre sınırlı kalmaktadır.",
    },
    {
      id: "muhasebe-odagi",
      title: "Muhasebe odağı",
      value: `${Math.round(genisletilmisKabaYapiPayi * 100)}% resmî toplam oranı`,
      tone: genisletilmisKabaYapiPayi >= 0.38 ? "warning" : "info",
      note:
        "Doğrudan taşıyıcı maliyet ile yardımcı kaba iş bandı birlikte okunduğunda genişletilmiş kaba yapı paketi oluşur.",
    },
    {
      id: "kontrol-onceligi",
      title: "Kontrol önceliği",
      value: kontrolOnceligi.value,
      tone: kontrolOnceligi.tone,
      note: kontrolOnceligi.note,
    },
  ];

  const warnings: QuickQuantityWarning[] = [
    {
      tone: preset.warningTone,
      message:
        "Bu araç ön keşif ve ön boyutlandırma amaçlıdır; uygulama projesi, statik model ve gerçek keşif yerine geçmez.",
    },
  ];

  if (input.resmiSinif) {
    warnings.push({
      tone: "info",
      message: `Resmî sınıf otomatik bant yerine ${input.resmiSinif.grup}-${input.resmiSinif.sinif} olarak elle sabitlendi.`,
    });
  }

  if (
    input.resmiSinif &&
    (input.resmiSinif.grup !== preset.officialSelection.grup ||
      input.resmiSinif.sinif !== preset.officialSelection.sinif)
  ) {
    warnings.push({
      tone: "warning",
      message:
        "Elle seçilen resmî sınıf, arketipin önerilen bandından farklı. Taşıyıcı payı kıyasını yorumlarken bu farkı dikkate alın.",
    });
  }

  if (actualShare < preset.carryingShareBand.low) {
    warnings.push({
      tone: "warning",
      message:
        "Hesaplanan taşıyıcı payı, bu arketip için beklenen alt bandın altında kaldı. Resmî sınıf veya sistem seçimini yeniden kontrol edin.",
    });
  } else if (actualShare > preset.carryingShareBand.high) {
    warnings.push({
      tone: "warning",
      message:
        "Hesaplanan taşıyıcı payı, bu arketip için beklenen üst bandın üzerine çıktı. Bodrum, zemin veya perde yoğunluğu gerçek projede ayrıca teyit edilmelidir.",
    });
  }

  if (
    input.depremTalebi === "yuksek" &&
    input.tipikAciklik === "genis" &&
    input.tasiyiciSistem === "cerceve"
  ) {
    warnings.push({
      tone: "warning",
      message:
        "Yüksek deprem talebi ve geniş açıklık birlikte seçildi; yalnız çerçeve sistem birçok gerçek projede düşük iyimserlik üretir. Perde katkısını ayrıca değerlendirin.",
    });
  }

  if (input.bodrumKatSayisi > 0 && input.bodrumCevrePerdesi === "tam") {
    warnings.push({
      tone: "info",
      message:
        "Tam çevre bodrum perdesi seçildi. Yardımcı kaba iş bandındaki kazı, bohçalama ve drenaj kalemleri bu senaryoda kritik önemdedir.",
    });
  }

  if (
    input.planKompaktligi === "girintili" &&
    (input.yapiArketipi === "apartman-11-17-kat" || input.yapiArketipi === "apartman-18-kat-uzeri")
  ) {
    warnings.push({
      tone: "warning",
      message:
        "Girintili plan ile yüksek yapı birlikte seçildi. Gerçek projede perde sürekliliği, torsiyon ve kalıp lojistiği ayrıca kontrol edilmelidir.",
    });
  }

  if (sahaZorlugu === "yuksek") {
    warnings.push({
      tone: "warning",
      message:
        "Saha zorluğu yüksek görünüyor. Geoteknik rapor, iksa yaklaşımı, temel altı su etkisi ve yardımcı kaba işler birlikte değerlendirilmelidir.",
    });
  }

  return {
    input,
    preset,
    priceBook,
    resolvedOfficialSelection,
    officialSelectionOverridden: Boolean(input.resmiSinif),
    officialResult,
    toplamInsaatAlaniM2,
    toplamNormalAlanM2,
    toplamBodrumAlanM2,
    resolvedBodrumKatAlaniM2,
    temelIziAlaniM2,
    betonM3,
    donatiKg,
    donatiTon: donatiKg / 1000,
    kalipM2,
    betonBirimFiyat: priceBook.entries.concreteC30_37.unitPrice,
    donatiBirimFiyat: priceBook.weightedRebarUnitPrice,
    kalipBirimFiyat: priceBook.entries.formworkPlywood.unitPrice,
    dogrudanTasiyiciMaliyet,
    dogrudanTasiyiciMaliyetKalemleri: {
      beton: betonMaliyeti,
      donati: donatiMaliyeti,
      kalip: kalipMaliyeti,
    },
    tasiyiciPayi: {
      actual: actualShare,
      low: preset.carryingShareBand.low,
      expected: preset.carryingShareBand.expected,
      high: preset.carryingShareBand.high,
      lowAmount: officialResult.resmiToplamMaliyet * preset.carryingShareBand.low,
      expectedAmount: officialResult.resmiToplamMaliyet * preset.carryingShareBand.expected,
      highAmount: officialResult.resmiToplamMaliyet * preset.carryingShareBand.high,
    },
    yogunlukOzet,
    referansBantlar,
    geometriOzet,
    yardimciMetrajlar,
    yardimciKabaIsBandi,
    yardimciKabaIsDagilimi,
    genisletilmisKabaYapiBandi,
    sahaZorlugu,
    kararOzetleri,
    benchmarklar,
    breakdowns: normalizedBreakdowns,
    appliedFactors,
    warnings,
    notes: [
      preset.applicationNote,
      priceBook.weightedRebarNote,
      "Zemin sınıfı çarpanı yalnız temel grubuna uygulanır; üst yapı kalemleri kör çarpanla büyütülmez.",
      yardimciKabaIsBandi.note,
    ],
  };
}
