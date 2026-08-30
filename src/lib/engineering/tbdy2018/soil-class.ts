import type { SoilClass } from "./types";
import { SOIL_SITE_COEFFICIENTS } from "./base-shear";

export interface SoilClassEvaluationInput {
  vs30Ms?: number; // Üst 30 m ortalama kayma dalgası hızı (m/s)
  sptN60?: number; // Üst 30 m ortalama SPT-N60 darbe sayısı
  cuKpa?: number; // Drenajsız kayma mukavemeti (kPa)
  isSpecialSoilCondition?: boolean; // Sıvılaşabilir, turba vb. ZF kriteri
}

export interface SoilClassEvaluationResult {
  soilClass: SoilClass;
  className: string;
  description: string;
  fsCoeff: { low: number; high: number; avg: number };
  f1Coeff: { low: number; high: number; avg: number };
  criteriaSummary: string[];
  notes: string[];
}

export function determineSoilClass(input: SoilClassEvaluationInput): SoilClassEvaluationResult {
  const { vs30Ms, sptN60, cuKpa, isSpecialSoilCondition } = input;

  if (isSpecialSoilCondition) {
    const coeffs = SOIL_SITE_COEFFICIENTS.ZF;
    return {
      soilClass: "ZF",
      className: "ZF — Sahaya Özel Değerlendirme Gerektiren Zemin",
      description: "Sıvılaşma riski yüksek zeminler, kalın turba/organik zeminler veya özel fay zonu zeminleri.",
      fsCoeff: { low: coeffs.fs_low, high: coeffs.fs_high, avg: (coeffs.fs_low + coeffs.fs_high) / 2 },
      f1Coeff: { low: coeffs.f1_low, high: coeffs.f1_high, avg: (coeffs.f1_low + coeffs.f1_high) / 2 },
      criteriaSummary: ["Sahaya özel zemin davranışı analizi zorunludur (TBDY 2018 Madde 16.5)."],
      notes: ["ZF sınıfı zeminlerde mikrobölgeleme veya sahaya özel deprem spektrum analizi yapılması zorunludur."],
    };
  }

  let determinedClass: SoilClass = "ZD";
  const criteriaSummary: string[] = [];

  if (vs30Ms !== undefined && Number.isFinite(vs30Ms) && vs30Ms > 0) {
    criteriaSummary.push(`Vs30 = ${vs30Ms.toFixed(0)} m/s`);
    if (vs30Ms > 1500) {
      determinedClass = "ZA";
    } else if (vs30Ms > 760) {
      determinedClass = "ZB";
    } else if (vs30Ms > 360) {
      determinedClass = "ZC";
    } else if (vs30Ms >= 180) {
      determinedClass = "ZD";
    } else {
      determinedClass = "ZE";
    }
  } else if (sptN60 !== undefined && Number.isFinite(sptN60) && sptN60 > 0) {
    criteriaSummary.push(`SPT N60 = ${sptN60.toFixed(0)}`);
    if (sptN60 > 50) {
      determinedClass = "ZC";
    } else if (sptN60 >= 15) {
      determinedClass = "ZD";
    } else {
      determinedClass = "ZE";
    }
  } else if (cuKpa !== undefined && Number.isFinite(cuKpa) && cuKpa > 0) {
    criteriaSummary.push(`cu = ${cuKpa.toFixed(0)} kPa`);
    if (cuKpa > 250) {
      determinedClass = "ZC";
    } else if (cuKpa >= 70) {
      determinedClass = "ZD";
    } else {
      determinedClass = "ZE";
    }
  }

  const classDescriptions: Record<SoilClass, { name: string; desc: string }> = {
    ZA: {
      name: "ZA — Sağlam, Sert Kayalar",
      desc: "Masif, taze kayaçlar; çatlak ve ayrışma içermeyen sert formasyonlar.",
    },
    ZB: {
      name: "ZB — Az Ayrışmış, Orta Sağlam Kayalar",
      desc: "Az ayrışmış, orta derecede süreksizlik içeren kaya formasyonları.",
    },
    ZC: {
      name: "ZC — Çok Sıkı Kum/Çakıl ve Sert Kil Tabakaları",
      desc: "Yoğun granüler veya aşırı konsolide olmuş sert kohezyonlu zeminler.",
    },
    ZD: {
      name: "ZD — Orta Sıkı Kum/Çakıl ve Katı Kil Tabakaları",
      desc: "Orta sıkılıkta kumlular veya orta-katı kıvamdaki killi zeminler.",
    },
    ZE: {
      name: "ZE — Gevşek Kum/Çakıl veya Yumuşak Kil Tabakaları",
      desc: "Düşük mukavemetli gevşek kohezyonsuz veya yüksek plastisiteli yumuşak killi zeminler.",
    },
    ZF: {
      name: "ZF — Sahaya Özel Değerlendirme Gerektiren Zemin",
      desc: "Sıvılaşma veya zemin göçmesi riski barındıran özel zeminler.",
    },
  };

  const coeffs = SOIL_SITE_COEFFICIENTS[determinedClass];
  const fsAvg = (coeffs.fs_low + coeffs.fs_high) / 2;
  const f1Avg = (coeffs.f1_low + coeffs.f1_high) / 2;

  const notes: string[] = [
    `TBDY 2018 Tablo 16.1 uyarınca yerel zemin sınıfı ${determinedClass} olarak belirlenmiştir.`,
    `Tasarım ivme spektrumu büyütme katsayıları: Fs ≈ ${fsAvg.toFixed(2)}, F1 ≈ ${f1Avg.toFixed(2)}.`,
  ];

  return {
    soilClass: determinedClass,
    className: classDescriptions[determinedClass].name,
    description: classDescriptions[determinedClass].desc,
    fsCoeff: { low: coeffs.fs_low, high: coeffs.fs_high, avg: fsAvg },
    f1Coeff: { low: coeffs.f1_low, high: coeffs.f1_high, avg: f1Avg },
    criteriaSummary,
    notes,
  };
}
