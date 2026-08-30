import type {
  AreaBandKey,
  DurationRateBand,
  InspectionBuildingClassGroup,
  InspectionClassGroupOption,
  InstallmentStage,
  ProjectDurationYears,
  RegionalDiscountOption,
  YapiDenetimSourceMetadata,
} from "./types";

export const YAPI_DENETIM_EFFECTIVE_YEAR = 2026 as const;
export const YAPI_DENETIM_VAT_RATE = 0.20 as const; // %20 KDV
export const SMALL_BUILDING_MAX_RATE = 0.035 as const; // %3,50
export const SMALL_BUILDING_AREA_THRESHOLD = 500 as const; // 500 m²
export const SCOPE_REVIEW_AREA_THRESHOLD = 200 as const; // 200 m²
export const INSTALLMENT_AREA_THRESHOLD = 3000 as const; // 3.000 m²
export const FIRST_AREA_BAND_MAX = 1000 as const; // 1.000 m²
export const SECOND_AREA_BAND_MAX = 50000 as const; // 50.000 m²

// 2026 Yapı Denetimi Hizmet Bedeline Esas Birim Maliyetler (TL/m²)
// Grup I: 6.464 TL/m²
// Grup II: 19.392 TL/m²
// Grup III: 32.320 TL/m²
export const YAPI_DENETIM_UNIT_COSTS: Record<InspectionBuildingClassGroup, number> = {
  I_II: 6464,
  III: 19392,
  IV_V: 32320,
} as const;

export const INSPECTION_CLASS_GROUP_OPTIONS: readonly InspectionClassGroupOption[] = [
  {
    id: "I_II",
    groupCode: "Grup I",
    title: "I–II. Sınıf Yapılar",
    shortLabel: "I–II. Sınıf · Grup I",
    unitCostTL: 6464,
    description: "Tarım, depo, basit imalathane ve düşük karmaşıklıklı yapılar",
    officialClasses: ["I-A", "I-B", "I-C", "I-D", "II-A", "II-B", "II-C"],
  },
  {
    id: "III",
    groupCode: "Grup II",
    title: "III. Sınıf Yapılar",
    shortLabel: "III. Sınıf · Grup II",
    unitCostTL: 19392,
    description: "Standart konutlar (apartman/villa), okullar, oteller ve iş yerleri",
    officialClasses: ["III-A", "III-B", "III-C"],
  },
  {
    id: "IV_V",
    groupCode: "Grup III",
    title: "IV–V. Sınıf Yapılar",
    shortLabel: "IV–V. Sınıf · Grup III",
    unitCostTL: 32320,
    description: "Yüksek yapılar, hastaneler, AVM'ler, kamu binaları ve özellikli yapılar",
    officialClasses: ["IV-A", "IV-B", "IV-C", "V-A", "V-B", "V-C", "V-D", "V-E"],
  },
] as const;

// Hizmet bedeline esas oran cetveli (Yapı Denetimi Uygulama Yönetmeliği Madde 26 / Ek Cetvel)
// A <= 1.000 m² | 1.000 < A <= 50.000 m² | A > 50.000 m²
export const YAPI_DENETIM_RATE_TABLE: Record<ProjectDurationYears, DurationRateBand> = {
  1: {
    years: 1,
    upTo1000: 0.0175,
    from1000To50000: 0.0150,
    over50000: 0.0125,
  },
  2: {
    years: 2,
    upTo1000: 0.0184,
    from1000To50000: 0.0158,
    over50000: 0.0131,
  },
  3: {
    years: 3,
    upTo1000: 0.0193,
    from1000To50000: 0.0165,
    over50000: 0.0138,
  },
  4: {
    years: 4,
    upTo1000: 0.0203,
    from1000To50000: 0.0174,
    over50000: 0.0145,
  },
  5: {
    years: 5,
    upTo1000: 0.0213,
    from1000To50000: 0.0182,
    over50000: 0.0152,
  },
} as const;

// Bölgesel İndirimler (Yapı Denetimi Uygulama Yönetmeliği Madde 26/8)
export const REGIONAL_DISCOUNT_OPTIONS: readonly RegionalDiscountOption[] = [
  {
    id: "normal",
    label: "Normal Bölge",
    discountRate: 0.0,
    percentText: "%0",
    description: "Özel teşvik veya indirim kapsamı dışında kalan yerler",
  },
  {
    id: "endustri",
    label: "Endüstri Bölgesi",
    discountRate: 0.20,
    percentText: "%20",
    description: "Endüstri bölgelerinde uygulanan yasal indirim (%20)",
  },
  {
    id: "osb",
    label: "Organize Sanayi Bölgesi (OSB)",
    discountRate: 0.35,
    percentText: "%35",
    description: "Organize sanayi bölgelerinde uygulanan yasal indirim (%35)",
  },
  {
    id: "tgb",
    label: "Teknoloji Geliştirme Bölgesi (TGB)",
    discountRate: 0.35,
    percentText: "%35",
    description: "Teknoloji geliştirme bölgelerinde uygulanan yasal indirim (%35)",
  },
  {
    id: "serbest",
    label: "Serbest Bölge",
    discountRate: 0.35,
    percentText: "%35",
    description: "Serbest bölgelerde uygulanan yasal indirim (%35)",
  },
  {
    id: "sanayi_sitesi",
    label: "Sanayi Sitesi",
    discountRate: 0.35,
    percentText: "%35",
    description: "Sanayi sitelerinde uygulanan yasal indirim (%35)",
  },
] as const;

// Hakediş / Ödeme Etapları (Yapı Denetimi Uygulama Yönetmeliği Madde 27)
export const INSTALLMENT_STAGES: readonly InstallmentStage[] = [
  {
    stage: 1,
    name: "Ruhsat Öncesi / Başlangıç",
    description: "Ruhsat alınması ve hazırlık aşaması",
    percentage: 0.10,
    percentText: "%10",
  },
  {
    stage: 2,
    name: "Temel ve Bodrum Kat",
    description: "Temel ve subasman seviyesi tamamlanması",
    percentage: 0.10,
    percentText: "%10",
  },
  {
    stage: 3,
    name: "Taşıyıcı Sistem",
    description: "Kaba inşaat ve taşıyıcı karkas imalatı",
    percentage: 0.40,
    percentText: "%40",
  },
  {
    stage: 4,
    name: "Çatı ve Dolgu Duvarlar",
    description: "Çatı örtüsü ve iç/dış duvar imalatı",
    percentage: 0.20,
    percentText: "%20",
  },
  {
    stage: 5,
    name: "Tesisat ve İnce İşler",
    description: "Elektrik/mekanik tesisat ve sıva/kaplama işleri",
    percentage: 0.15,
    percentText: "%15",
  },
  {
    stage: 6,
    name: "İş Bitimi / Ruhsat Kapanışı",
    description: "Yapı kullanma izin belgesi aşaması ve dosya teslimi",
    percentage: 0.05,
    percentText: "%5",
  },
] as const;

// Kaynak Metadatası
export const YAPI_DENETIM_SOURCE_METADATA: YapiDenetimSourceMetadata = {
  effectiveYear: 2026,
  lawName: "4708 sayılı Yapı Denetimi Hakkında Kanun",
  lawNo: "4708",
  regulationName: "Yapı Denetimi Uygulama Yönetmeliği",
  article: "Madde 26 ve Hizmet Bedeli Oranları Cetveli",
  verificationDate: "2026-08-30",
  sourceUrl: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=4708&MevzuatTur=1&MevzuatTertip=5",
  yiUfeAnnualPercent: 27.67,
  tufeAnnualPercent: 30.89,
  averageIncreasePercent: 29.28,
  notes: [
    "Yapı denetim hizmet bedeline esas birim maliyetler, Tebliğdeki mimarlık-mühendislik yaklaşık maliyetlerinden farklı olup Denetim Grubu I/II/III bazında yayımlanır.",
    "2026 yılı birim maliyetleri, 2025 yılı tabanlarının Aralık 2025 Yİ-ÜFE (%27,67) ve TÜFE (%30,89) yıllık değişim ortalaması olan %29,28 ile güncellenmesiyle oluşturulmuştur.",
    "500 m² ve altındaki yapılarda hizmet bedeli oranı %3,50'ye kadar artırılabilir (Yönetmelik Madde 26/4).",
    "2–5 yıllık projelerde sonraki takvim yıllarına devreden iş kısmı, ilgili yılın birim maliyeti üzerinden değerlendirilir (Yönetmelik Madde 26/6). Sonuç 2026 fiyat seviyesinde tahmindir.",
    "Toplam inşaat alanı 3.000 m² ve altında olan işlerde bedel defaten; 3.000 m² üzerindeki işlerde defaten veya 6 etap halinde yatırılabilir (Yönetmelik Madde 27).",
    "200 m² ve altındaki bazı bağımsız küçük yapılar kat/kullanım şartlarına göre 4708 kapsamı dışında kalabilir.",
    "KDV (%20) yapı denetim bedeline hariçtir; alıcı statüsüne göre doğabilecek KDV tevkifatı bu tahmine dahil edilmemiştir.",
  ],
} as const;

// Alt Sınıf -> Denetim Grubu Eşleme Fonksiyonu
export function mapOfficialClassToInspectionGroup(
  classCodeOrGroupCode: string
): InspectionBuildingClassGroup {
  const normalized = classCodeOrGroupCode.trim().toUpperCase();
  const romanPart = normalized.split("-")[0].trim();
  if (romanPart === "IV" || romanPart === "V") {
    return "IV_V";
  }
  if (romanPart === "III") {
    return "III";
  }
  if (romanPart === "I" || romanPart === "II") {
    return "I_II";
  }
  return "I_II";
}

// Alan Bandı Tespit Fonksiyonu
export function resolveAreaBand(area: number): AreaBandKey {
  if (area <= FIRST_AREA_BAND_MAX) {
    return "upTo1000";
  }
  if (area <= SECOND_AREA_BAND_MAX) {
    return "from1000To50000";
  }
  return "over50000";
}

export function getAreaBandLabel(band: AreaBandKey): string {
  switch (band) {
    case "upTo1000":
      return "A ≤ 1.000 m²";
    case "from1000To50000":
      return "1.000 < A ≤ 50.000 m²";
    case "over50000":
      return "A > 50.000 m²";
  }
}
