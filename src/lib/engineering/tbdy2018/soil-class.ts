import { calculateDesignSpectrumParameters } from "./horizontal-spectrum";
import type { SoilClass } from "./types";

export interface SoilClassEvaluationInput {
  vs30Ms?: number; // Üst 30 m ortalama kayma dalgası hızı (m/s)
  sptN60?: number; // Üst 30 m ortalama SPT-N60 darbe sayısı
  cuKpa?: number; // Drenajsız kayma mukavemeti (kPa)
  isSpecialSoilCondition?: boolean; // Sıvılaşabilir, turba vb. ZF kriteri
  ss?: number; // Opsiyonel: Spektral katsayı hesabı için
  s1?: number; // Opsiyonel: Spektral katsayı hesabı için
}

export interface SoilParameterResult {
  parameter: "vs30" | "sptN60" | "cu";
  label: string;
  value: number;
  unit: string;
  resultClass: SoilClass;
}

export interface SoilClassEvaluationResult {
  soilClass: SoilClass;
  className: string;
  description: string;
  parameterResults: SoilParameterResult[];
  hasConflict: boolean;
  conflictDescription?: string;
  spectralCoefficients?: {
    fs: number;
    f1: number;
    sds: number;
    sd1: number;
    ta: number;
    tb: number;
  };
  criteriaSummary: string[];
  notes: string[];
}

export const SOIL_CLASS_DESCRIPTIONS: Record<SoilClass, { name: string; desc: string }> = {
  ZA: {
    name: "ZA — Sağlam, Sert Kayalar",
    desc: "Masif, taze kayaçlar; çatlak ve ayrışma içermeyen sert formasyonlar (Vs30 > 1500 m/s).",
  },
  ZB: {
    name: "ZB — Az Ayrışmış, Orta Sağlam Kayalar",
    desc: "Az ayrışmış, orta derecede süreksizlik içeren kaya formasyonları (760 < Vs30 ≤ 1500 m/s).",
  },
  ZC: {
    name: "ZC — Çok Sıkı Kum/Çakıl ve Sert Kil Tabakaları",
    desc: "Yoğun granüler veya aşırı konsolide olmuş sert kohezyonlu zeminler (360 < Vs30 ≤ 760 m/s, N60 > 50, cu > 250 kPa).",
  },
  ZD: {
    name: "ZD — Orta Sıkı Kum/Çakıl ve Katı Kil Tabakaları",
    desc: "Orta sıkılıkta kumlular veya orta-katı kıvamdaki killi zeminler (180 ≤ Vs30 ≤ 360 m/s, 15 ≤ N60 ≤ 50, 70 ≤ cu ≤ 250 kPa).",
  },
  ZE: {
    name: "ZE — Gevşek Kum/Çakıl veya Yumuşak Kil Tabakaları",
    desc: "Düşük mukavemetli gevşek kohezyonsuz veya yüksek plastisiteli yumuşak killi zeminler (Vs30 < 180 m/s, N60 < 15, cu < 70 kPa).",
  },
  ZF: {
    name: "ZF — Sahaya Özel Değerlendirme Gerektiren Zemin",
    desc: "Sıvılaşma riski yüksek zeminler, kalın turba/organik zeminler veya özel fay zonu zeminleri (TBDY 2018 Madde 16.5).",
  },
};

export function determineSoilClass(input: SoilClassEvaluationInput): SoilClassEvaluationResult | null {
  const { vs30Ms, sptN60, cuKpa, isSpecialSoilCondition, ss, s1 } = input;

  if (isSpecialSoilCondition) {
    return {
      soilClass: "ZF",
      className: SOIL_CLASS_DESCRIPTIONS.ZF.name,
      description: SOIL_CLASS_DESCRIPTIONS.ZF.desc,
      parameterResults: [],
      hasConflict: false,
      criteriaSummary: ["Sahaya özel zemin davranışı analizi zorunludur (TBDY 2018 Madde 16.5)."],
      notes: [
        "ZF sınıfı zeminlerde standart spektrum parametreleri tanımlı değildir. Sahaya özel deprem tehlike analizi yapılması zorunludur.",
      ],
    };
  }

  const parameterResults: SoilParameterResult[] = [];
  const criteriaSummary: string[] = [];

  // 1. Vs30 Değerlendirmesi
  if (vs30Ms !== undefined && Number.isFinite(vs30Ms) && vs30Ms > 0) {
    let cls: SoilClass;
    if (vs30Ms > 1500) cls = "ZA";
    else if (vs30Ms > 760) cls = "ZB";
    else if (vs30Ms > 360) cls = "ZC";
    else if (vs30Ms >= 180) cls = "ZD";
    else cls = "ZE";

    parameterResults.push({
      parameter: "vs30",
      label: "Vs30 (Kayma Dalgası Hızı)",
      value: vs30Ms,
      unit: "m/s",
      resultClass: cls,
    });
    criteriaSummary.push(`Vs30 = ${vs30Ms.toFixed(0)} m/s → ${cls}`);
  }

  // 2. SPT-N60 Değerlendirmesi
  if (sptN60 !== undefined && Number.isFinite(sptN60) && sptN60 > 0) {
    let cls: SoilClass;
    if (sptN60 > 50) cls = "ZC";
    else if (sptN60 >= 15) cls = "ZD";
    else cls = "ZE";

    parameterResults.push({
      parameter: "sptN60",
      label: "SPT-N60 (Standart Penetrasyon)",
      value: sptN60,
      unit: "darbe/30cm",
      resultClass: cls,
    });
    criteriaSummary.push(`SPT N60 = ${sptN60.toFixed(0)} → ${cls}`);
  }

  // 3. cu Değerlendirmesi
  if (cuKpa !== undefined && Number.isFinite(cuKpa) && cuKpa > 0) {
    let cls: SoilClass;
    if (cuKpa > 250) cls = "ZC";
    else if (cuKpa >= 70) cls = "ZD";
    else cls = "ZE";

    parameterResults.push({
      parameter: "cu",
      label: "cu (Drenajsız Kayma Dayanımı)",
      value: cuKpa,
      unit: "kPa",
      resultClass: cls,
    });
    criteriaSummary.push(`cu = ${cuKpa.toFixed(0)} kPa → ${cls}`);
  }

  // Hiçbir geçerli parametre girilmemişse null dön (sessiz ZD varsayımı yasak)
  if (parameterResults.length === 0) {
    return null;
  }

  // Belirleyici zemin sınıfı: TBDY 2018 Tablo 16.1'e göre Vs30 önceliklidir
  const vsResult = parameterResults.find((p) => p.parameter === "vs30");
  const governingClass = vsResult ? vsResult.resultClass : parameterResults[0].resultClass;

  // Çelişki kontrolü
  const distinctClasses = Array.from(new Set(parameterResults.map((p) => p.resultClass)));
  const hasConflict = distinctClasses.length > 1;
  let conflictDescription: string | undefined;

  const notes: string[] = [];
  if (hasConflict) {
    conflictDescription = `Farklı parametreler farklı zemin sınıfları (${distinctClasses.join(", ")}) vermektedir. TBDY 2018 Madde 16.4 uyarınca Vs30 ölçümü belirleyicidir.`;
    notes.push(conflictDescription);
  }

  // Opsiyonel Spektral Katsayı Hesabı
  let spectralCoefficients: SoilClassEvaluationResult["spectralCoefficients"];
  if (ss !== undefined && s1 !== undefined && Number.isFinite(ss) && Number.isFinite(s1) && ss > 0 && s1 > 0) {
    const spec = calculateDesignSpectrumParameters(governingClass, ss, s1);
    if (spec) {
      spectralCoefficients = {
        fs: Number(spec.fs.toFixed(3)),
        f1: Number(spec.f1.toFixed(3)),
        sds: Number(spec.sds.toFixed(3)),
        sd1: Number(spec.sd1.toFixed(3)),
        ta: Number(spec.ta.toFixed(3)),
        tb: Number(spec.tb.toFixed(3)),
      };
    }
  }

  return {
    soilClass: governingClass,
    className: SOIL_CLASS_DESCRIPTIONS[governingClass].name,
    description: SOIL_CLASS_DESCRIPTIONS[governingClass].desc,
    parameterResults,
    hasConflict,
    conflictDescription,
    spectralCoefficients,
    criteriaSummary,
    notes,
  };
}
