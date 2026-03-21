// ============================================================
// src/lib/calculations/types.ts
// Domain type system for the İnşaat Hesaplamaları module
// ============================================================

// ─────────────────────────────────────────────
// TEMEL ENUMlar
// ─────────────────────────────────────────────

export type YapiTuru = "villa" | "mustakil" | "apartman" | "ticari";
export type KaliteSeviyesi = "ekonomik" | "orta" | "ust" | "luks";
export type BetonSinifi = "C25" | "C30" | "C35";
export type TemelTuru = "radye" | "surekli" | "tekil" | "kuyu";
export type DosemeTipi = "kirisli" | "asmolen" | "nervurlu" | "flat_slab";
export type IsitmaSistemi = "yerden" | "radyator" | "fan_coil";
export type IsitmaCihazi = "kombi" | "kazan" | "vrf";
export type DogramaTipi = "pvc" | "aluminyum" | "ahsap";
export type CamTuru = "isicam" | "cift" | "tek";
export type ParkeTuru = "laminant" | "masif" | "spc" | "lamine";
export type KaplamaTipi = "osb_singil" | "membran" | "kiremit" | "teras";
export type IsiYalitimTipu = "tas_yunu" | "xps" | "eps";
export type IcDuvarMalzeme = "tugla10" | "tugla85" | "gazbeton";
export type DisDuvarMalzeme = "gazbeton15" | "gazbeton135" | "tugla";
export type SicakSuYontemi = "kombi" | "boyler" | "gunes";
export type CatiTipi = "celik" | "betonarme" | "duz_teras";
export type MembranKatSayisi = 1 | 2;

// ─────────────────────────────────────────────
// PROJE PROFİLİ — Giriş formu ana verisi
// ─────────────────────────────────────────────

export interface ProjectProfile {
  yapiTuru: YapiTuru;
  insaatAlani: number;        // m² — toplam brüt inşaat alanı
  katAdedi: number;           // 1–20
  bagimsizBolumSayisi: number;
  kaliteSeviyesi: KaliteSeviyesi;
  presetId?: string;          // hangi preset uygulandıysa
}

// ─────────────────────────────────────────────
// FİYAT KATMANI — PriceLayer zinciri
// sistem → bölge → kalite → manuel override
// ─────────────────────────────────────────────

export interface PriceBook {
  // Beton & Demir
  c25Beton: number;           // TL/m³
  c30Beton: number;
  c35Beton: number;
  demir: number;              // TL/ton
  kalipIscilik: number;       // TL/m²
  demirIscilik: number;       // TL/m²

  // Duvar
  tugla10: number;            // TL/adet
  tugla85: number;
  gazbeton: number;           // TL/m³
  tuglaIscilik: number;       // TL/m²
  gazbetonIscilik: number;

  // Çatı
  celik: number;              // TL/ton
  singil: number;             // TL/m²
  membran: number;            // TL/top (1 top ≈ 8m²)
  tasYunu: number;            // TL/m²
  xps: number;                // TL/m²

  // Su yalıtımı
  membranIscilik: number;     // TL/m²
  drenaj: number;             // TL/mt

  // Dış cephe
  kompozit: number;           // TL/m²
  sove: number;               // TL/m²
  soveMtul: number;           // TL/mtül
  cepheBoya: number;          // TL/m²
  mantolama5cm: number;       // TL/m²

  // Isıtma & soğutma
  yerdenIsitma: number;       // TL/m²
  radyator: number;           // TL/mtül
  kombi: number;              // TL/adet
  kazan: number;              // TL/adet
  klima: number;              // TL/adet

  // Seramik & mermer
  banyoDuvarSeramik: number;  // TL/m²
  banyoYerSeramik: number;
  mutfakYerSeramik: number;
  holYerSeramik: number;
  seramikIscilik: number;     // TL/m²
  mermerBasamak: number;      // TL/mtül
  mermerIscilik: number;
  seramikYapistirici: number; // TL/torba

  // Sıva & boya
  makineAlcisi: number;       // TL/torba
  alciIscilik: number;        // TL/m²
  karaSivaIscilik: number;
  boyaMalzemeIscilik: number; // TL/m² (malzeme + işçilik birlikte)

  // Pencere & kapı
  pvcProfil: number;          // TL/mtül
  aluminyumProfil: number;
  isicam: number;             // TL/m²
  celikKapi: number;          // TL/adet
  ahsapKapi: number;
  binaGirisKapisi: number;

  // Parke
  laminantParke: number;      // TL/m²
  masifParke: number;
  spcParke: number;
  lamineParke: number;
  ahsapSupurgelik: number;    // TL/mtül

  // Elektrik & alçıpan
  elektrikBolumBasi: number;  // TL/bölüm
  kartonpiyer: number;        // TL/mtül
  alcipan: number;            // TL/m²

  // Kamu & sabit giderler
  bayindirlikBirimM2: number; // TL/m²
  yapiDenetimOrani: number;   // oran (ör: 0.0158)
  santiyeAylikMaliyet: number;// TL/ay
}

export interface PriceLayer {
  systemDefault: PriceBook;
  regionalCoefficient?: number;  // çarpan, ör: 1.10 for İstanbul
  qualityFactor: number;         // KALITE_KATSAYILARI[kalite]
  manualOverrides?: Partial<PriceBook>; // kullanıcı override'ları
}

/** Fiyat zincirini çözümle: override varsa onu kullan, yoksa sistem × bölge */
export type ResolvedPrice = number;

// ─────────────────────────────────────────────
// KATEGORİ ANAHTARLARI
// 28 tam domain — 12 UI ailesi (fazlara göre açılacak)
// ─────────────────────────────────────────────

/** 28 tam kategori (domain modeli — ileride tüm kategoriler buradan yönetilecek) */
export type CategoryKey =
  // Kaba işler
  | "betonDemir"
  | "duvar"
  | "cati"
  | "suYalitimi"
  | "hafriyat"
  | "isMakineleri"
  | "iskele"
  // İnce işler
  | "disCephe"
  | "isitmaSogutma"
  | "seramikMermer"
  | "sivaBoya"
  | "pencereKapi"
  | "parkeKaplama"
  | "elektrikAlcipan"
  | "sap"
  | "asansor"
  | "alcipanDetay"
  | "ahsapDolap"
  | "ankastre"
  | "balkonKorkuluk"
  // Diğer giderler
  | "kamuOdemeleri"
  | "projelendirme"
  | "ilkOdemeler"
  | "santiyeKurulumu"
  | "aylikOdemeler"
  | "ortakAlanlar"
  | "peyzaj"
  | "diger";

/** Faz 1'de UI'da gösterilecek 12 birleşik aile */
export type CompositeCategoryKey =
  | "betonDemir"
  | "duvar"
  | "cati"
  | "suYalitimi"
  | "disCephe"
  | "isitmaSogutma"
  | "seramikMermer"
  | "sivaBoya"
  | "pencereKapi"
  | "parkeKaplama"
  | "elektrikAlcipan"
  | "kamuSabit";

export type CategoryGroup = "kabaIs" | "inceIs" | "diger";

export const CATEGORY_GROUP_MAP: Record<CompositeCategoryKey, CategoryGroup> = {
  betonDemir:   "kabaIs",
  duvar:        "kabaIs",
  cati:         "kabaIs",
  suYalitimi:   "kabaIs",
  disCephe:     "inceIs",
  isitmaSogutma:"inceIs",
  seramikMermer:"inceIs",
  sivaBoya:     "inceIs",
  pencereKapi:  "inceIs",
  parkeKaplama: "inceIs",
  elektrikAlcipan:"inceIs",
  kamuSabit:    "diger",
};

export const CATEGORY_LABELS: Record<CompositeCategoryKey, string> = {
  betonDemir:   "Beton ve Demir",
  duvar:        "Duvar",
  cati:         "Çatı",
  suYalitimi:   "Su Yalıtımı ve Drenaj",
  disCephe:     "Dış Cephe",
  isitmaSogutma:"Isıtma ve Soğutma",
  seramikMermer:"Seramik ve Mermer",
  sivaBoya:     "Sıva ve Boya",
  pencereKapi:  "Pencere ve Kapı",
  parkeKaplama: "Parke ve Kaplama",
  elektrikAlcipan:"Elektrik ve Alçıpan",
  kamuSabit:    "Kamu Ödemeleri ve Sabit Giderler",
};

// ─────────────────────────────────────────────
// MİKTAR VE MALİYET SATIRLARI
// ─────────────────────────────────────────────

export type BirimTuru = "m2" | "m3" | "ton" | "adet" | "mtul" | "torba" | "top" | "ay" | "pct" | "sabit";

export interface QuantityLine {
  id: string;
  label: string;
  birim: BirimTuru;
  miktar: number;
  kaynak: "otomatik" | "manuel";  // otomatik = proje verisinden türetildi
  varsayim?: string;              // kısa açıklama, ör: "İnşaat alanı × 2.5"
}

export interface CostLine {
  id: string;
  label: string;
  malzemeMaliyeti: number;
  iscilikMaliyeti: number;
  yardimciMalzeme?: number;
  altToplam: number;
  kaynak: "otomatik" | "manuel";
}

// ─────────────────────────────────────────────
// KATEGORİ SONUÇLARI
// ─────────────────────────────────────────────

export interface CategoryResult {
  key: CompositeCategoryKey;
  label: string;
  group: CategoryGroup;
  altToplam: number;           // TL
  quantities: QuantityLine[];
  costLines: CostLine[];
  varsayimlar: string[];       // kullanıcıya gösterilecek açıklamalar
}

// ─────────────────────────────────────────────
// HESAPLAMA SONUÇ SNAPSHOT'I
// Ekranda, raporda ve PDF motorunda aynı veri
// ─────────────────────────────────────────────

export interface CalculationResultSnapshot {
  // Meta
  timestamp: string;
  priceDate: string;          // ör: "Mart 2025"
  presetId?: string;

  // Proje
  project: ProjectProfile;

  // Kategori sonuçları
  categories: CategoryResult[];

  // Toplamlar
  kabaIsToplamı: number;
  inceIsToplamı: number;
  digerToplamı: number;
  genelToplam: number;

  // Türetilmiş metrikler
  m2BasinaFiyat: number;
  bolumBasinaFiyat: number;

  // Yüzdeler
  kabaIsPct: number;
  inceIsPct: number;
  digerPct: number;
}

// ─────────────────────────────────────────────
// KATEGORİ INPUT'LARI
// Her kategori için kullanıcıdan alınan girdiler
// ─────────────────────────────────────────────

export interface BetonDemirInput {
  temelTuru: TemelTuru;
  temelAlani?: number;            // m², boş = katAlani * 1.0
  temelKalinligi: number;         // m, default 0.40
  betonSinifi: BetonSinifi;
  kolonPerdeBetonHacmi?: number;  // m³, opsiyonel
  dosemeTipi: DosemeTipi;
  dosemeKalinligi: number;        // cm, default 12
}

export interface DuvarInput {
  icDuvarMalzeme: IcDuvarMalzeme;
  icDuvarAlani?: number;
  disDuvarMalzeme: DisDuvarMalzeme;
  disDuvarAlani?: number;
}

export interface CatiInput {
  catiTipi: CatiTipi;
  catiAlani?: number;
  kaplama: KaplamaTipi;
  isiYalitim: IsiYalitimTipu;
  suYalitimMembranTop?: number;
}

export interface SuYalitimInput {
  temelSuYalitimAlani?: number;
  membranKatSayisi: MembranKatSayisi;
  drenajUzunlugu?: number;
  balkonTerasSuYalitim: boolean;
  balkonTerasAlani?: number;
}

export interface DisCepheInput {
  cepheAlani?: number;
  kompozitOrani: number;    // 0-1
  boyaOrani: number;        // 0-1
  mantolama: boolean;
  mantolamaAlani?: number;
}

export interface IsitmaSogutmaInput {
  isitmaSistemi: IsitmaSistemi;
  isitmaCihazi: IsitmaCihazi;
  klimaBolumBasi: number;
  sicakSuYontemi: SicakSuYontemi;
}

export interface SeramikMermerInput {
  banyoDuvarSeramikAlani?: number;
  banyoYerSeramikAlani?: number;
  mutfakZeminAlani?: number;
  holZeminAlani?: number;
  balkonTerasAlani?: number;
  merdivenMermer: boolean;
  merdivenBasamakSayisi?: number;
}

export interface SivaBoyaInput {
  inceSivaAlani?: number;
  karaSivaAlani?: number;
}

export interface PencereKapiInput {
  dogramaTipi: DogramaTipi;
  toplamDogramaMtul?: number;
  camTuru: CamTuru;
  daireDiskKapiTipi: "celik" | "ahsapKapliCelik";
  odaKapiBolumBasi: number;
  binaGirisKapisi: boolean;
}

export interface ParkKaplamaInput {
  parkeAlani?: number;
  parkeTuru: ParkeTuru;
  supurgelik: boolean;
}

export interface ElektrikAlcipanInput {
  kartonpiyerMtul?: number;
  alcipanAlani?: number;
  goruntuluyDiyafon: boolean;
  kameraSistemi: boolean;
  jenerator: "yok" | "ortak" | "baginmsizBolum";
}

export interface KamuSabitInput {
  bayindirlikBirimM2?: number;   // default: fiyat kitabındaki değer
  yapiDenetimOrani?: number;     // default: 0.0158
  enerjiBelgesi: boolean;
  zeminEtudu: boolean;
  akustikRapor: boolean;
  santiyeAylari: number;         // kaç ay
}

/** Tüm kategori inputlarını bir arada tutan state yapısı */
export interface CategoryInputs {
  betonDemir: BetonDemirInput;
  duvar: DuvarInput;
  cati: CatiInput;
  suYalitimi: SuYalitimInput;
  disCephe: DisCepheInput;
  isitmaSogutma: IsitmaSogutmaInput;
  seramikMermer: SeramikMermerInput;
  sivaBoya: SivaBoyaInput;
  pencereKapi: PencereKapiInput;
  parkeKaplama: ParkKaplamaInput;
  elektrikAlcipan: ElektrikAlcipanInput;
  kamuSabit: KamuSabitInput;
}
