import { RULE_SNAPSHOT_VERSION } from "./versions";

export const RULE_SOURCE_CHECK_DATE = "2026-08-20" as const;

export type OfficialSourceKind =
  | "CONSOLIDATED_REGULATION"
  | "OFFICIAL_GAZETTE"
  | "MINISTRY_GUIDANCE";

export type OfficialSourceCheckStatus =
  | "OFFICIAL_PAGE_CONFIRMED"
  | "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE";

export interface OfficialRuleSource {
  id: string;
  title: string;
  authority: string;
  kind: OfficialSourceKind;
  url: string;
  publishedOn: string | null;
  lastCheckedOn: typeof RULE_SOURCE_CHECK_DATE;
  checkStatus: OfficialSourceCheckStatus;
}

export const OFFICIAL_RULE_SOURCES = [
  {
    id: "PAIY_CONSOLIDATED",
    title: "Planlı Alanlar İmar Yönetmeliği — konsolide kayıt",
    authority: "Mevzuat Bilgi Sistemi",
    kind: "CONSOLIDATED_REGULATION",
    url: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=23722&MevzuatTur=7&MevzuatTertip=5",
    publishedOn: null,
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE",
  },
  {
    id: "PAIY_UPDATE_2026_07_01",
    title: "Planlı Alanlar İmar Yönetmeliği'nde 01.07.2026 değişikliği",
    authority: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı",
    kind: "MINISTRY_GUIDANCE",
    url: "https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960",
    publishedOn: "2026-07-01",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
  {
    id: "PAIY_UPDATE_2026_07_01_RG",
    title: "Planlı Alanlar İmar Yönetmeliğinde Değişiklik — 33297 sayılı Resmî Gazete",
    authority: "Resmî Gazete",
    kind: "OFFICIAL_GAZETTE",
    url: "https://www.resmigazete.gov.tr/eskiler/2026/07/20260701-7.htm",
    publishedOn: "2026-07-01",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE",
  },
  {
    id: "PARKING_CONSOLIDATED",
    title: "Otopark Yönetmeliği — konsolide kayıt",
    authority: "Mevzuat Bilgi Sistemi",
    kind: "CONSOLIDATED_REGULATION",
    url: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=24408&MevzuatTur=7&MevzuatTertip=5",
    publishedOn: null,
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE",
  },
  {
    id: "SHELTER_UPDATE_2025_11_07",
    title: "Sığınak Yönetmeliğinde Değişiklik — 33070 sayılı Resmî Gazete",
    authority: "Resmî Gazete",
    kind: "OFFICIAL_GAZETTE",
    url: "https://www.resmigazete.gov.tr/eskiler/2025/11/20251107-2.htm",
    publishedOn: "2025-11-07",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
  {
    id: "FIRE_CONSOLIDATED",
    title: "Binaların Yangından Korunması Hakkında Yönetmelik — konsolide kayıt",
    authority: "Mevzuat Bilgi Sistemi",
    kind: "CONSOLIDATED_REGULATION",
    url: "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=200712937&MevzuatTur=21&MevzuatTertip=5",
    publishedOn: null,
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE",
  },
  {
    id: "FIRE_GUIDE_2024_12_16",
    title: "Binaların Yangından Korunması Hakkında Yönetmelik Kılavuzu",
    authority: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı",
    kind: "MINISTRY_GUIDANCE",
    url: "https://meslekihizmetler.csb.gov.tr/haberler/binalarin-yangindan-korunmasi-hakkinda-yonetmelik-kilavuzu-yayimlandi-289797",
    publishedOn: "2024-12-16",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
  {
    id: "ENERGY_UPDATE_2025_06_24",
    title: "Binalarda Enerji Performansı Yönetmeliği güncellemesi",
    authority: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı",
    kind: "MINISTRY_GUIDANCE",
    url: "https://meslekihizmetler.csb.gov.tr/binalarda-enerji-performansi-yonetmeligi-guncellendi-haber-295212",
    publishedOn: "2025-06-24",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
  {
    id: "NSEB_UPDATE_2024_12_17",
    title: "Yeni binalarda 2025 nSEB ve yenilenebilir enerji eşikleri",
    authority: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı",
    kind: "MINISTRY_GUIDANCE",
    url: "https://meslekihizmetler.csb.gov.tr/haberler/yeni-binalarda-yenilenebilir-enerji-zorunlulugu-yuzde-10-olacak-289813",
    publishedOn: "2024-12-17",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
  {
    id: "RAIN_GREY_WATER_UPDATE_2024_12_23",
    title: "Planlı Alanlar İmar Yönetmeliği yağmur ve gri su güncellemesi",
    authority: "Çevre, Şehircilik ve İklim Değişikliği Bakanlığı",
    kind: "MINISTRY_GUIDANCE",
    url: "https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeligi-guncellendi-290883",
    publishedOn: "2024-12-23",
    lastCheckedOn: RULE_SOURCE_CHECK_DATE,
    checkStatus: "OFFICIAL_PAGE_CONFIRMED",
  },
] as const satisfies readonly OfficialRuleSource[];

export const RULE_AUTHORITY_ORDER = [
  "APPROVED_IMPLEMENTATION_PLAN",
  "PARCEL_PLAN_NOTES",
  "CURRENT_ZONING_STATUS",
  "LOCAL_AUTHORITY_RULE",
  "PAIY",
  "PARKING_REGULATION",
  "SHELTER_REGULATION",
  "FIRE_REGULATION",
  "ENERGY_REGULATION",
  "ACCESSIBILITY_RULES",
  "ELEVATOR_RULES",
  "USE_SPECIFIC_RULES",
] as const;

export type RuleVerificationStatus =
  | "SOURCE_INDEX_ONLY"
  | "VERIFIED_FOR_EXECUTION"
  | "REQUIRES_PROJECT_CONFIRMATION";

export interface RuleParameter {
  key: string;
  value: number | string;
  unit: string | null;
}

export interface RuleRecord {
  id: string;
  regulation: string;
  article: string | null;
  ruleDate: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  transitionRule: string | null;
  localOverride: boolean;
  sourceIds: readonly string[];
  verificationStatus: RuleVerificationStatus;
  parameters: readonly RuleParameter[];
}

export interface RuleSnapshot {
  id: typeof RULE_SNAPSHOT_VERSION;
  checkedOn: typeof RULE_SOURCE_CHECK_DATE;
  releaseStatus: "SOURCE_INDEX_ONLY" | "EXECUTABLE";
  projectApplicationDateRequired: true;
  localRuleConfirmationRequired: true;
  supportedPermitApplicationFrom: string;
  authorityOrder: typeof RULE_AUTHORITY_ORDER;
  sources: typeof OFFICIAL_RULE_SOURCES;
  executableRules: readonly RuleRecord[];
  limitations: readonly string[];
}

export const EXECUTABLE_RULE_VALUES = {
  supportedPermitApplicationFrom: "2026-07-01",
  lift: {
    shaftReservationFloorCount: 3,
    installationFloorCount: 4,
    secondLiftFloorCount: 10,
    secondLiftResidentialUnitsAboveGroundFloor: 20,
  },
  shelter: {
    effectiveFrom: "2025-11-07",
    residentialUnitCount: 10,
    personEquivalentByUnitType: {
      "1+1": 2,
      "2+1": 3,
      "3+1": 4,
      "4+1": 4,
    },
  },
  fireReview: {
    buildingHeightM: 21.5,
  },
  nseb: {
    effectiveFrom: "2025-01-01",
    totalBuildingConstructionAreaM2: 2_000,
  },
  rainWater: {
    effectiveFrom: "2026-01-01",
    parcelAreaM2Exclusive: 2_000,
    roofProjectionAreaM2Exclusive: 1_000,
  },
} as const;

const EXECUTABLE_RULES = [
  {
    id: "PAIY-TAKS-KAKS-THEORETICAL-LIMITS",
    regulation: "Planlı Alanlar İmar Yönetmeliği",
    article: "Madde 20–22 ve parsele özgü plan kararları",
    ruleDate: "2026-07-01",
    effectiveFrom: EXECUTABLE_RULE_VALUES.supportedPermitApplicationFrom,
    effectiveTo: null,
    transitionRule: "TAKS/KAKS değerleri parsele özgü güncel belge ve plan notundan gelmelidir.",
    localOverride: true,
    sourceIds: ["PAIY_CONSOLIDATED", "PAIY_UPDATE_2026_07_01", "PAIY_UPDATE_2026_07_01_RG"],
    verificationStatus: "VERIFIED_FOR_EXECUTION",
    parameters: [],
  },
  {
    id: "PAIY-34-LIFT-TRIGGERS",
    regulation: "Planlı Alanlar İmar Yönetmeliği",
    article: "Madde 34",
    ruleDate: "2026-07-01",
    effectiveFrom: EXECUTABLE_RULE_VALUES.supportedPermitApplicationFrom,
    effectiveTo: null,
    transitionRule: "Bodrum kat sayımı ve önceki başvurular için geçiş hükmü proje bazında kontrol edilir.",
    localOverride: true,
    sourceIds: ["PAIY_CONSOLIDATED", "PAIY_UPDATE_2026_07_01", "PAIY_UPDATE_2026_07_01_RG"],
    verificationStatus: "VERIFIED_FOR_EXECUTION",
    parameters: [
      { key: "shaftReservationFloorCount", value: 3, unit: "floor" },
      { key: "installationFloorCount", value: 4, unit: "floor" },
      { key: "secondLiftFloorCount", value: 10, unit: "floor" },
      { key: "secondLiftResidentialUnitsAboveGroundFloor", value: 20, unit: "unit" },
    ],
  },
  {
    id: "SHELTER-RESIDENTIAL-UNIT-TRIGGER",
    regulation: "Sığınak Yönetmeliği",
    article: "Madde 7",
    ruleDate: "2025-11-07",
    effectiveFrom: EXECUTABLE_RULE_VALUES.shelter.effectiveFrom,
    effectiveTo: null,
    transitionRule: "Eski başvurular için yürürlük ve geçiş hükümleri ayrıca kontrol edilir.",
    localOverride: false,
    sourceIds: ["SHELTER_UPDATE_2025_11_07"],
    verificationStatus: "VERIFIED_FOR_EXECUTION",
    parameters: [{ key: "residentialUnitCount", value: 10, unit: "unit" }],
  },
  {
    id: "FIRE-HEIGHT-21_50-REVIEW-GATE",
    regulation: "Binaların Yangından Korunması Hakkında Yönetmelik",
    article: null,
    ruleDate: "2024-12-16",
    effectiveFrom: null,
    effectiveTo: null,
    transitionRule: "21,50 m tek başına kesin kaçış çözümü üretmez; kullanım ve proje koşulları doğrulanır.",
    localOverride: false,
    sourceIds: ["FIRE_CONSOLIDATED", "FIRE_GUIDE_2024_12_16"],
    verificationStatus: "REQUIRES_PROJECT_CONFIRMATION",
    parameters: [{ key: "buildingHeightM", value: 21.5, unit: "m" }],
  },
  {
    id: "BEP-NSEB-2025-AREA-TRIGGER",
    regulation: "Binalarda Enerji Performansı Yönetmeliği",
    article: null,
    ruleDate: "2024-12-17",
    effectiveFrom: EXECUTABLE_RULE_VALUES.nseb.effectiveFrom,
    effectiveTo: null,
    transitionRule: "Yeni bina ve toplam yapı inşaat alanı kapsamı proje bazında doğrulanır.",
    localOverride: false,
    sourceIds: ["NSEB_UPDATE_2024_12_17", "ENERGY_UPDATE_2025_06_24"],
    verificationStatus: "VERIFIED_FOR_EXECUTION",
    parameters: [{ key: "totalBuildingConstructionAreaM2", value: 2_000, unit: "m2" }],
  },
  {
    id: "PAIY-57A-RAIN-WATER-REVIEW-GATES",
    regulation: "Planlı Alanlar İmar Yönetmeliği",
    article: "Madde 57/A",
    ruleDate: "2024-12-23",
    effectiveFrom: EXECUTABLE_RULE_VALUES.rainWater.effectiveFrom,
    effectiveTo: null,
    transitionRule: "Depo kapasitesi ve yapı türü görülmeden kesin zorunluluk sonucu üretilmez.",
    localOverride: true,
    sourceIds: ["RAIN_GREY_WATER_UPDATE_2024_12_23", "PAIY_CONSOLIDATED"],
    verificationStatus: "REQUIRES_PROJECT_CONFIRMATION",
    parameters: [
      { key: "parcelAreaM2Exclusive", value: 2_000, unit: "m2" },
      { key: "roofProjectionAreaM2Exclusive", value: 1_000, unit: "m2" },
    ],
  },
] as const satisfies readonly RuleRecord[];

export const CURRENT_RULE_SNAPSHOT = {
  id: RULE_SNAPSHOT_VERSION,
  checkedOn: RULE_SOURCE_CHECK_DATE,
  releaseStatus: "EXECUTABLE",
  projectApplicationDateRequired: true,
  localRuleConfirmationRequired: true,
  supportedPermitApplicationFrom: EXECUTABLE_RULE_VALUES.supportedPermitApplicationFrom,
  authorityOrder: RULE_AUTHORITY_ORDER,
  sources: OFFICIAL_RULE_SOURCES,
  executableRules: EXECUTABLE_RULES,
  limitations: [
    "Snapshot yalnız 01.07.2026 ve sonrası yeni başvurular için seçili genel ulusal tetikleri yürütür.",
    "Otopark, yangın çözümü, sığınak net alanı, merkezi ısıtma ve yerel kurallar proje verisi olmadan kesinleştirilmez.",
    "Senaryo alan rezervleri mevzuat değil, açıkça verilen HEURISTIC varsayım setidir.",
    "Doğrudan getirilemeyen resmî bağlantılar kaynak kaydı olarak korunmuş, doğrulanmış gibi işaretlenmemiştir.",
  ],
} as const satisfies RuleSnapshot;
