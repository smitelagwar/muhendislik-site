// ============================================================
// hesaplamalar.ts
// İnşaat Maliyet Hesaplama — Pure TypeScript Utility Functions
// Referans: insaathesabi.com örnek proje verileri (2023-2026)
// ============================================================

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type YapiTuru = 'villa' | 'mustakil' | 'apartman' | 'ticari';
export type KaliteSeviyesi = 'ekonomik' | 'orta' | 'ust' | 'luks';
export type BetonSinifi = 'C25' | 'C30' | 'C35';
export type TemelTuru = 'radye' | 'surekli' | 'tekil' | 'kuyu';
export type DosemeTipi = 'kirisli' | 'asmolen' | 'nervurlu' | 'flat_slab';
export type IsitmaSistemi = 'yerden' | 'radyator' | 'fan_coil';
export type IsitmaCihazi = 'kombi' | 'kazan' | 'vrf';
export type DogramaTipi = 'pvc' | 'aluminyum' | 'ahsap';
export type CamTuru = 'isicam' | 'cift' | 'tek';
export type ParkeTuru = 'laminant' | 'masif' | 'spc' | 'lamine';
export type KaplamaTipi = 'osb_singil' | 'membran' | 'kiremit' | 'teras';
export type IsiYalitimTipu = 'tas_yunu' | 'xps' | 'eps';

export interface ProjeGenelBilgiler {
  yapiTuru: YapiTuru;
  insaatAlani: number;       // m²
  katAdedi: number;
  bagimsizBolumSayisi: number;
  kaliteSeviyesi: KaliteSeviyesi;
}

export interface BirimFiyatlar {
  // Beton & Demir
  c25BetonFiyati: number;    // TL/m³
  c30BetonFiyati: number;
  c35BetonFiyati: number;
  demirFiyati: number;       // TL/ton
  kalipIscilik: number;      // TL/m²
  demirIscilik: number;      // TL/m²
  // Duvar
  tugla10Fiyati: number;     // TL/adet
  tugla85Fiyati: number;
  gazbetonFiyati: number;    // TL/m³
  tuglaIscilik: number;      // TL/m²
  gazbetonIscilik: number;
  // Çatı
  celikFiyati: number;       // TL/ton
  singilFiyati: number;      // TL/m²
  membranFiyati: number;     // TL/top (1 top ≈ 10m²)
  tasYunuFiyati: number;     // TL/m²
  xpsFiyati: number;         // TL/m²
  // Su yalıtımı
  membranIscilik: number;    // TL/m²
  drenajFiyati: number;      // TL/mt
  // Dış cephe
  kompozitFiyati: number;    // TL/m²
  soveFiyati: number;        // TL/m²
  soveMtulFiyati: number;    // TL/mtül
  cepheBoyaFiyati: number;   // TL/m²
  mantolama5cmFiyati: number;// TL/m²
  // Isıtma & soğutma
  yerdenIsitmaFiyati: number;// TL/m²
  radyatorFiyati: number;    // TL/mtül
  kombiFiyati: number;       // TL/adet
  kazanFiyati: number;       // TL/adet (yoğuşmalı, büyük bina)
  klimaFiyati: number;       // TL/adet
  // Seramik & mermer
  banyoDuvarSeramik: number; // TL/m² (malzeme)
  banyoYerSeramik: number;
  mutfakYerSeramik: number;
  holYerSeramik: number;
  seramikIscilik: number;    // TL/m²
  mermerBasamak: number;     // TL/mtül
  mermerIscilik: number;
  seramikYapistirici: number;// TL/torba
  // Sıva & boya
  makineAlcisi: number;      // TL/torba
  alciIscilik: number;       // TL/m²
  karaSivaIscilik: number;   // TL/m²
  boyaMalzemeIscilik: number;// TL/m² (toplam)
  // Pencere & kapı
  pvcProfil: number;         // TL/mtül
  aluminyumProfil: number;
  isicamFiyati: number;      // TL/m²
  celikKapiFiyati: number;   // TL/adet
  ahsapKapiFiyati: number;
  binaGirisKapisi: number;
  // Parke
  laminantParke: number;     // TL/m²
  masifParke: number;
  spcParke: number;
  lamineParke: number;
  ahsapSupurgelik: number;   // TL/mtül
  // Elektrik & alçıpan
  elektrikBolumBasi: number; // TL/bağımsız bölüm
  kartonpiyerFiyati: number; // TL/mtül
  alcipanFiyati: number;     // TL/m²
  // Kamu ödemeleri
  bayindirlikBirimM2: number;// TL/m² (Bayındırlık birim fiyatı)
  yapiDenetimOrani: number;  // % (ör: 1.58)
  // Şantiye kurulumu
  santiyeAylikMaliyet: number; // TL/ay
}

// ─────────────────────────────────────────────
// DEFAULT BIRIM FİYATLAR (2024-2025 ortalama piyasa)
// ─────────────────────────────────────────────

export const DEFAULT_BIRIM_FIYATLAR: BirimFiyatlar = {
  c25BetonFiyati: 2600,
  c30BetonFiyati: 2800,
  c35BetonFiyati: 3100,
  demirFiyati: 22000,
  kalipIscilik: 480,
  demirIscilik: 130,

  tugla10Fiyati: 6.5,
  tugla85Fiyati: 5.5,
  gazbetonFiyati: 2200,
  tuglaIscilik: 65,
  gazbetonIscilik: 60,

  celikFiyati: 24000,
  singilFiyati: 120,
  membranFiyati: 650,
  tasYunuFiyati: 60,
  xpsFiyati: 65,

  membranIscilik: 55,
  drenajFiyati: 45,

  kompozitFiyati: 2000,
  soveFiyati: 95,
  soveMtulFiyati: 490,
  cepheBoyaFiyati: 90,
  mantolama5cmFiyati: 380,

  yerdenIsitmaFiyati: 180,
  radyatorFiyati: 1350,
  kombiFiyati: 16000,
  kazanFiyati: 160000,
  klimaFiyati: 15000,

  banyoDuvarSeramik: 550,
  banyoYerSeramik: 530,
  mutfakYerSeramik: 550,
  holYerSeramik: 550,
  seramikIscilik: 140,
  mermerBasamak: 520,
  mermerIscilik: 150,
  seramikYapistirici: 150,

  makineAlcisi: 90,
  alciIscilik: 60,
  karaSivaIscilik: 80,
  boyaMalzemeIscilik: 55,

  pvcProfil: 1100,
  aluminyumProfil: 950,
  isicamFiyati: 1100,
  celikKapiFiyati: 9500,
  ahsapKapiFiyati: 15000,
  binaGirisKapisi: 45000,

  laminantParke: 950,
  masifParke: 2200,
  spcParke: 1200,
  lamineParke: 850,
  ahsapSupurgelik: 20,

  elektrikBolumBasi: 12000,
  kartonpiyerFiyati: 90,
  alcipanFiyati: 260,

  bayindirlikBirimM2: 6500,
  yapiDenetimOrani: 1.58,
  santiyeAylikMaliyet: 45000,
};

// ─────────────────────────────────────────────
// KALİTE KATSAYILARI
// ─────────────────────────────────────────────

export const KALITE_KATSAYILARI: Record<KaliteSeviyesi, number> = {
  ekonomik: 0.80,
  orta: 1.00,
  ust: 1.25,
  luks: 1.60,
};

// ─────────────────────────────────────────────
// YARDIMCI FONKSIYONLAR
// ─────────────────────────────────────────────

/** Türk formatında para birimi: 1234567 → "1.234.567 TL" */
export function formatTL(tutar: number): string {
  return (
    Math.round(tutar).toLocaleString('tr-TR') + ' TL'
  );
}

/** Yüzde formatı: 0.3985 → "%39,9" */
export function formatYuzde(oran: number): string {
  return '%' + (oran * 100).toFixed(1).replace('.', ',');
}

/** Kalite katsayısını uygula */
export function kaliteUygula(tutar: number, kalite: KaliteSeviyesi): number {
  return tutar * KALITE_KATSAYILARI[kalite];
}

/** m² başına beton hacmi katsayısı (tahmini) */
function betonHacmiKatsayisi(dosemeTipi: DosemeTipi): number {
  switch (dosemeTipi) {
    case 'kirisli':    return 0.22;  // m³/m²
    case 'asmolen':    return 0.18;
    case 'nervurlu':   return 0.20;
    case 'flat_slab':  return 0.25;
  }
}

/** m² başına demir tonu katsayısı */
function demirKatsayisi(dosemeTipi: DosemeTipi): number {
  switch (dosemeTipi) {
    case 'kirisli':    return 0.055;
    case 'asmolen':    return 0.045;
    case 'nervurlu':   return 0.050;
    case 'flat_slab':  return 0.060;
  }
}

// ─────────────────────────────────────────────
// KATEGORİ 1 — BETON VE DEMİR
// ─────────────────────────────────────────────

export interface BetonDemirInput {
  temelTuru: TemelTuru;
  temelAlani: number;        // m²
  temelKalinligi: number;    // m, default 0.40
  betonSinifi: BetonSinifi;
  kolonPerdBetonHacmi?: number; // m³, opsiyonel (otomatik hesaplanabilir)
  dosemeTipi: DosemeTipi;
  dosemeKalinligi: number;   // cm, default 12
}

export interface BetonDemirSonuc {
  temelBetonHacmi: number;   // m³
  kolonPerdeBetonHacmi: number;
  dosemeBetonHacmi: number;
  toplamBetonHacmi: number;
  toplamDemirTonu: number;
  kalipAlani: number;        // m²
  betonMaliyeti: number;     // TL
  demirMaliyeti: number;
  kalipIscilikMaliyeti: number;
  demirIscilikMaliyeti: number;
  altToplam: number;
}

export function hesaplaBetonDemir(
  input: BetonDemirInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): BetonDemirSonuc {
  const betonBirimFiyat =
    input.betonSinifi === 'C25' ? fiyatlar.c25BetonFiyati :
    input.betonSinifi === 'C30' ? fiyatlar.c30BetonFiyati :
    fiyatlar.c35BetonFiyati;

  const temelBetonHacmi = input.temelAlani * input.temelKalinligi;

  // Kolon+Perde: toplam inşaat alanının %13'ü hacim tahmini
  const kolonPerdeBetonHacmi =
    input.kolonPerdBetonHacmi ??
    proje.insaatAlani * proje.katAdedi * 0.065;

  const dosemeKatAlani = proje.insaatAlani / proje.katAdedi;
  const dosemeBetonHacmi =
    dosemeKatAlani * proje.katAdedi *
    betonHacmiKatsayisi(input.dosemeTipi);

  const toplamBetonHacmi =
    temelBetonHacmi + kolonPerdeBetonHacmi + dosemeBetonHacmi;

  const toplamDemirTonu =
    proje.insaatAlani * demirKatsayisi(input.dosemeTipi);

  const kalipAlani = proje.insaatAlani * 1.85; // tahmini kalıp alanı

  const betonMaliyeti = toplamBetonHacmi * betonBirimFiyat;
  const demirMaliyeti = toplamDemirTonu * fiyatlar.demirFiyati;
  const kalipIscilikMaliyeti = kalipAlani * fiyatlar.kalipIscilik;
  const demirIscilikMaliyeti = kalipAlani * fiyatlar.demirIscilik;

  const altToplam = kaliteUygula(
    betonMaliyeti + demirMaliyeti + kalipIscilikMaliyeti + demirIscilikMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    temelBetonHacmi,
    kolonPerdeBetonHacmi,
    dosemeBetonHacmi,
    toplamBetonHacmi,
    toplamDemirTonu,
    kalipAlani,
    betonMaliyeti,
    demirMaliyeti,
    kalipIscilikMaliyeti,
    demirIscilikMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 2 — DUVAR
// ─────────────────────────────────────────────

export interface DuvarInput {
  icDuvarMalzeme: 'tugla10' | 'tugla85' | 'gazbeton';
  icDuvarAlani?: number;     // m², boşsa otomatik
  disDuvarMalzeme: 'gazbeton15' | 'gazbeton135' | 'tugla';
  disDuvarAlani?: number;
}

export interface DuvarSonuc {
  icDuvarAlani: number;
  disDuvarAlani: number;
  toplamDuvarAlani: number;
  icDuvarMalzemeMaliyeti: number;
  disDuvarMalzemeMaliyeti: number;
  iscilikMaliyeti: number;
  harcMaliyeti: number;
  altToplam: number;
}

export function hesaplaDuvar(
  input: DuvarInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): DuvarSonuc {
  const icDuvarAlani = input.icDuvarAlani ?? proje.insaatAlani * 2.5;
  // Dış duvar: bina çevresi × bina yüksekliği (kat adedi × 3m)
  const binaYuksekligi = proje.katAdedi * 3;
  const katAlani = proje.insaatAlani / proje.katAdedi;
  const binaKenarOrt = Math.sqrt(katAlani) * 4;
  const disDuvarAlani = input.disDuvarAlani ?? binaKenarOrt * binaYuksekligi;
  const toplamDuvarAlani = icDuvarAlani + disDuvarAlani;

  // İç duvar malzeme maliyeti
  let icDuvarMalzemeMaliyeti = 0;
  if (input.icDuvarMalzeme === 'tugla10') {
    const adetSayisi = icDuvarAlani * 25; // ortalama 25 adet/m²
    icDuvarMalzemeMaliyeti = adetSayisi * fiyatlar.tugla10Fiyati;
  } else if (input.icDuvarMalzeme === 'tugla85') {
    const adetSayisi = icDuvarAlani * 25;
    icDuvarMalzemeMaliyeti = adetSayisi * fiyatlar.tugla85Fiyati;
  } else {
    const hacim = icDuvarAlani * 0.10;
    icDuvarMalzemeMaliyeti = hacim * fiyatlar.gazbetonFiyati;
  }

  // Dış duvar malzeme maliyeti
  let disDuvarMalzemeMaliyeti = 0;
  const disDuvarKalinligi =
    input.disDuvarMalzeme === 'gazbeton15' ? 0.15 : 0.135;
  if (input.disDuvarMalzeme !== 'tugla') {
    const hacim = disDuvarAlani * disDuvarKalinligi;
    disDuvarMalzemeMaliyeti = hacim * fiyatlar.gazbetonFiyati;
  } else {
    const adetSayisi = disDuvarAlani * 25;
    disDuvarMalzemeMaliyeti = adetSayisi * fiyatlar.tugla10Fiyati;
  }

  const icIscilik = icDuvarAlani * fiyatlar.tuglaIscilik;
  const disIscilik = disDuvarAlani * fiyatlar.gazbetonIscilik;
  const iscilikMaliyeti = icIscilik + disIscilik;
  // Harç maliyeti (kum + çimento + kireç): tahminen %8
  const harcMaliyeti = (icDuvarMalzemeMaliyeti + disDuvarMalzemeMaliyeti) * 0.08;

  const altToplam = kaliteUygula(
    icDuvarMalzemeMaliyeti + disDuvarMalzemeMaliyeti + iscilikMaliyeti + harcMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    icDuvarAlani,
    disDuvarAlani,
    toplamDuvarAlani,
    icDuvarMalzemeMaliyeti,
    disDuvarMalzemeMaliyeti,
    iscilikMaliyeti,
    harcMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 3 — ÇATI
// ─────────────────────────────────────────────

export interface CatiInput {
  catiTipi: 'celik' | 'betonarme' | 'duz_teras';
  catiAlani?: number;        // m², boşsa otomatik
  kaplama: KaplamaTipi;
  isiYalitim: IsiYalitimTipu;
  suYalitimMembranTop?: number;
}

export interface CatiSonuc {
  catiAlani: number;
  karkasKutlesi: number;     // ton (çelik için)
  karkasMaliyeti: number;
  kaplamaMaliyeti: number;
  isiYalitimMaliyeti: number;
  suYalitimMaliyeti: number;
  dereMaliyeti: number;
  altToplam: number;
}

export function hesaplaCati(
  input: CatiInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): CatiSonuc {
  const katAlani = proje.insaatAlani / proje.katAdedi;
  const catiAlani = input.catiAlani ?? katAlani * 1.15;

  let karkasMaliyeti = 0;
  let karkasKutlesi = 0;

  if (input.catiTipi === 'celik') {
    // Villa örneği: 286m² → 3.46 ton çelik + 64.4 TL/m² işçilik
    karkasKutlesi = catiAlani * 0.024;
    const celikMalzeme = karkasKutlesi * fiyatlar.celikFiyati;
    const iscilik = catiAlani * 225;
    karkasMaliyeti = celikMalzeme + iscilik;
  } else if (input.catiTipi === 'betonarme') {
    karkasMaliyeti = catiAlani * 650;
  } else {
    karkasMaliyeti = catiAlani * 280;
  }

  // Kaplama
  let kaplamaMaliyeti = 0;
  if (input.kaplama === 'osb_singil') {
    // Çift kat OSB: ~0.67 plaka/m², 1 plaka 250TL
    const osbMaliyet = catiAlani * 0.67 * 2 * 250;
    kaplamaMaliyeti = osbMaliyet;
  } else if (input.kaplama === 'singil' as KaplamaTipi || input.kaplama === 'membran') {
    kaplamaMaliyeti = catiAlani * fiyatlar.singilFiyati;
  } else if (input.kaplama === 'kiremit') {
    kaplamaMaliyeti = catiAlani * 280;
  } else {
    kaplamaMaliyeti = catiAlani * 350;
  }

  // Isı yalıtımı
  let isiYalitimMaliyeti = 0;
  if (input.isiYalitim === 'tas_yunu') {
    isiYalitimMaliyeti = catiAlani * fiyatlar.tasYunuFiyati;
  } else {
    isiYalitimMaliyeti = catiAlani * fiyatlar.xpsFiyati;
  }

  // Su yalıtımı (membran + şıngıl)
  const membranTopSayisi = input.suYalitimMembranTop ?? Math.ceil(catiAlani / 8);
  const suYalitimMaliyeti =
    membranTopSayisi * fiyatlar.membranFiyati +
    catiAlani * fiyatlar.singilFiyati * 1.1 +
    catiAlani * fiyatlar.membranIscilik;

  // Gizli sac dere: çatı çevresinin ~%60'ı
  const dereUzunlugu = Math.sqrt(catiAlani) * 4 * 0.6;
  const dereMaliyeti = dereUzunlugu * 900;

  const altToplam = kaliteUygula(
    karkasMaliyeti + kaplamaMaliyeti + isiYalitimMaliyeti +
    suYalitimMaliyeti + dereMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    catiAlani,
    karkasKutlesi,
    karkasMaliyeti,
    kaplamaMaliyeti,
    isiYalitimMaliyeti,
    suYalitimMaliyeti,
    dereMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 4 — SU YALITIMI
// ─────────────────────────────────────────────

export interface SuYalitimInput {
  temelSuYalitimAlani?: number; // m², boşsa otomatik
  membranKatSayisi: 1 | 2;
  drenajUzunlugu?: number;      // mt, boşsa otomatik
  balkonTerasSuYalitim: boolean;
  balkonTerasAlani?: number;
}

export interface SuYalitimSonuc {
  temelSuYalitimAlani: number;
  membranTopSayisi: number;
  drenajUzunlugu: number;
  membranMaliyeti: number;
  membranIscilikMaliyeti: number;
  drenajMaliyeti: number;
  balkonTerasMaliyeti: number;
  altToplam: number;
}

export function hesaplaSuYalitim(
  input: SuYalitimInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): SuYalitimSonuc {
  const katAlani = proje.insaatAlani / proje.katAdedi;
  const temelSuYalitimAlani = input.temelSuYalitimAlani ?? katAlani * 1.30;
  const drenajUzunlugu = input.drenajUzunlugu ?? Math.sqrt(katAlani) * 4;

  const membranM2 = temelSuYalitimAlani * input.membranKatSayisi;
  const membranTopSayisi = Math.ceil(membranM2 / 8);
  const membranMaliyeti = membranTopSayisi * fiyatlar.membranFiyati;
  const membranIscilikMaliyeti = temelSuYalitimAlani * fiyatlar.membranIscilik;

  const drenajMaliyeti = drenajUzunlugu * fiyatlar.drenajFiyati;

  const balkonTerasAlani = input.balkonTerasAlani ?? proje.bagimsizBolumSayisi * 8;
  const balkonTerasMaliyeti = input.balkonTerasSuYalitim
    ? balkonTerasAlani * 85
    : 0;

  const altToplam = kaliteUygula(
    membranMaliyeti + membranIscilikMaliyeti + drenajMaliyeti + balkonTerasMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    temelSuYalitimAlani,
    membranTopSayisi,
    drenajUzunlugu,
    membranMaliyeti,
    membranIscilikMaliyeti,
    drenajMaliyeti,
    balkonTerasMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 5 — DIŞ CEPHE
// ─────────────────────────────────────────────

export interface DisCepheInput {
  cepheAlani?: number;       // m², boşsa otomatik
  kompozitOrani: number;     // 0-1 (ör: 0.30)
  boyaOrani: number;         // 0-1
  // söve oranı = 1 - kompozit - boya
  mantolama: boolean;
  mantolamaAlani?: number;
}

export interface DisCepheSonuc {
  cepheAlani: number;
  kompozitAlani: number;
  boyaAlani: number;
  soveAlani: number;
  mantolamaAlani: number;
  kompozitMaliyeti: number;
  boyaMaliyeti: number;
  soveMaliyeti: number;
  mantolaMaliyeti: number;
  iskeleIscilikMaliyeti: number;
  altToplam: number;
}

export function hesaplaDisCephe(
  input: DisCepheInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): DisCepheSonuc {
  const katAlani = proje.insaatAlani / proje.katAdedi;
  const binaYuksekligi = proje.katAdedi * 3;
  const binaKenar = Math.sqrt(katAlani) * 4;
  const cepheAlani = input.cepheAlani ?? binaKenar * binaYuksekligi;

  const soveOrani = Math.max(0, 1 - input.kompozitOrani - input.boyaOrani);
  const kompozitAlani = cepheAlani * input.kompozitOrani;
  const boyaAlani = cepheAlani * input.boyaOrani;
  const soveAlani = cepheAlani * soveOrani;

  const kompozitMaliyeti = kompozitAlani * fiyatlar.kompozitFiyati;
  const boyaMaliyeti = boyaAlani * fiyatlar.cepheBoyaFiyati;
  const soveMtul = Math.sqrt(soveAlani) * 8;
  const soveMaliyeti =
    soveAlani * fiyatlar.soveFiyati +
    soveMtul * fiyatlar.soveMtulFiyati;

  const mantolamaAlani = input.mantolamaAlani ?? cepheAlani * 0.85;
  const mantolaMaliyeti = input.mantolama
    ? mantolamaAlani * fiyatlar.mantolama5cmFiyati
    : 0;

  // İskele: cephe alanı × 1 ay kiralama + kurulum
  const iskeleIscilikMaliyeti = cepheAlani * 35;

  const altToplam = kaliteUygula(
    kompozitMaliyeti + boyaMaliyeti + soveMaliyeti +
    mantolaMaliyeti + iskeleIscilikMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    cepheAlani,
    kompozitAlani,
    boyaAlani,
    soveAlani,
    mantolamaAlani,
    kompozitMaliyeti,
    boyaMaliyeti,
    soveMaliyeti,
    mantolaMaliyeti,
    iskeleIscilikMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 6 — ISITMA VE SOĞUTMA
// ─────────────────────────────────────────────

export interface IsitmaSogutmaInput {
  isitmaSistemi: IsitmaSistemi;
  isitmaCihazi: IsitmaCihazi;
  klimaBolumBasi: number;    // adet
  sicakSuYontemi: 'kombi' | 'boyler' | 'gunes';
}

export interface IsitmaSogutmaSonuc {
  isitmaTesisat: number;
  cihazMaliyeti: number;
  klimaMaliyeti: number;
  sihhi: number;             // sıhhi tesisat
  altToplam: number;
}

export function hesaplaIsitmaSogutma(
  input: IsitmaSogutmaInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): IsitmaSogutmaSonuc {
  let isitmaTesisat = 0;
  if (input.isitmaSistemi === 'yerden') {
    isitmaTesisat = proje.insaatAlani * fiyatlar.yerdenIsitmaFiyati;
  } else if (input.isitmaSistemi === 'radyator') {
    // Radyatör boyu: net alan × 0.7 mtül/m²
    const radyatorMtul = proje.insaatAlani * 0.70;
    isitmaTesisat = radyatorMtul * fiyatlar.radyatorFiyati;
  } else {
    isitmaTesisat = proje.insaatAlani * 220;
  }

  let cihazMaliyeti = 0;
  if (input.isitmaCihazi === 'kombi') {
    cihazMaliyeti = proje.bagimsizBolumSayisi * fiyatlar.kombiFiyati;
  } else if (input.isitmaCihazi === 'kazan') {
    // Tek merkezi kazan + doğalgaz hattı
    cihazMaliyeti = fiyatlar.kazanFiyati + proje.bagimsizBolumSayisi * 4500;
  } else {
    // VRF
    cihazMaliyeti = proje.insaatAlani * 380;
  }

  const klimaMaliyeti =
    proje.bagimsizBolumSayisi * input.klimaBolumBasi * fiyatlar.klimaFiyati;

  // Sıhhi tesisat (pissu + temizsu + işçilik)
  const sihhi = proje.bagimsizBolumSayisi * 14500;

  const altToplam = kaliteUygula(
    isitmaTesisat + cihazMaliyeti + klimaMaliyeti + sihhi,
    proje.kaliteSeviyesi
  );

  return { isitmaTesisat, cihazMaliyeti, klimaMaliyeti, sihhi, altToplam };
}

// ─────────────────────────────────────────────
// KATEGORİ 7 — SERAMİK VE MERMER
// ─────────────────────────────────────────────

export interface SeramikMermerInput {
  banyoDuvarSeramikAlani?: number;
  banyoYerSeramikAlani?: number;
  mutfakZeminAlani?: number;
  holZeminAlani?: number;
  balkonTerasAlani?: number;
  merdivenMermer: boolean;
  merdivenBasamakSayisi?: number;
}

export interface SeramikMermerSonuc {
  toplamSeramikAlani: number;
  seramikMalzeme: number;
  seramikIscilik: number;
  mermerMaliyeti: number;
  yapistiriciDerzMaliyeti: number;
  altToplam: number;
}

export function hesaplaSeramikMermer(
  input: SeramikMermerInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): SeramikMermerSonuc {
  const bb = proje.bagimsizBolumSayisi;

  const banyoDuvar = input.banyoDuvarSeramikAlani ?? bb * 28;
  const banyoYer   = input.banyoYerSeramikAlani   ?? bb * 7;
  const mutfak     = input.mutfakZeminAlani        ?? bb * 15;
  const hol        = input.holZeminAlani           ?? bb * 9;
  const balkon     = input.balkonTerasAlani        ?? bb * 8;

  const toplamSeramikAlani = banyoDuvar + banyoYer + mutfak + hol + balkon;

  const seramikMalzeme =
    banyoDuvar * fiyatlar.banyoDuvarSeramik +
    banyoYer   * fiyatlar.banyoYerSeramik   +
    mutfak     * fiyatlar.mutfakYerSeramik  +
    hol        * fiyatlar.holYerSeramik     +
    balkon     * fiyatlar.holYerSeramik;

  const seramikIscilik = toplamSeramikAlani * fiyatlar.seramikIscilik;

  // Yapıştırıcı + derz: toplamın ~%7'si
  const yapistiriciDerzMaliyeti = seramikMalzeme * 0.07;

  // Merdiven mermer
  const basamakSayisi = input.merdivenBasamakSayisi ?? proje.katAdedi * 18;
  const basamakMtul = basamakSayisi * 1.30; // ortalama 130cm genişlik
  const merdivenDosemeAlani = proje.katAdedi * 8;
  const mermerMaliyeti = input.merdivenMermer
    ? basamakMtul * (fiyatlar.mermerBasamak + fiyatlar.mermerIscilik * 0.8) +
      merdivenDosemeAlani * 1600
    : 0;

  const altToplam = kaliteUygula(
    seramikMalzeme + seramikIscilik + yapistiriciDerzMaliyeti + mermerMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    toplamSeramikAlani,
    seramikMalzeme,
    seramikIscilik,
    mermerMaliyeti,
    yapistiriciDerzMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 8 — SIVA VE BOYA
// ─────────────────────────────────────────────

export interface SivaBoyaInput {
  inceSivaAlani?: number;    // m², boşsa otomatik
  karaSivaAlani?: number;    // ıslak hacim, boşsa otomatik
}

export interface SivaBoyaSonuc {
  inceSivaAlani: number;
  karaSivaAlani: number;
  makineAlcisiSayisi: number; // torba
  inceSivaMaliyeti: number;
  karaSivaMaliyeti: number;
  boyaMaliyeti: number;
  altToplam: number;
}

export function hesaplaSivaBoya(
  input: SivaBoyaInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): SivaBoyaSonuc {
  const inceSivaAlani = input.inceSivaAlani ?? proje.insaatAlani * 3.5;
  const karaSivaAlani = input.karaSivaAlani ?? proje.bagimsizBolumSayisi * 45;

  // 1 torba makine alçısı ≈ 2.5 m²
  const makineAlcisiSayisi = Math.ceil(inceSivaAlani / 2.5);
  const alcimalzeme = makineAlcisiSayisi * fiyatlar.makineAlcisi;
  const alciIscilik = inceSivaAlani * fiyatlar.alciIscilik;
  const inceSivaMaliyeti = alcimalzeme + alciIscilik;

  const karaSivaMaliyeti =
    karaSivaAlani * (fiyatlar.karaSivaIscilik + 18); // 18 TL/m² malzeme

  const boyaAlani = inceSivaAlani + karaSivaAlani;
  const boyaMaliyeti = boyaAlani * fiyatlar.boyaMalzemeIscilik;

  const altToplam = kaliteUygula(
    inceSivaMaliyeti + karaSivaMaliyeti + boyaMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    inceSivaAlani,
    karaSivaAlani,
    makineAlcisiSayisi,
    inceSivaMaliyeti,
    karaSivaMaliyeti,
    boyaMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 9 — PENCERE VE KAPI
// ─────────────────────────────────────────────

export interface PencereKapiInput {
  dogramaTipi: DogramaTipi;
  camTuru: CamTuru;
  toplamDogramaProfil?: number; // mtül, boşsa otomatik
  odaKapiBolumBasi: number;     // adet, default 3
  binaGirisKapisi: boolean;
}

export interface PencereKapiSonuc {
  dogramaMtul: number;
  camAlani: number;
  dogramaMaliyeti: number;
  camMaliyeti: number;
  cerceveAksesuarMaliyeti: number;
  daireDisKapiMaliyeti: number;
  odaKapiMaliyeti: number;
  binaGirisMaliyeti: number;
  pervazDenizlik: number;
  altToplam: number;
}

export function hesaplaPencereKapi(
  input: PencereKapiInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): PencereKapiSonuc {
  const dogramaMtul = input.toplamDogramaProfil ?? proje.insaatAlani * 0.55;
  const camAlani = dogramaMtul * 0.62; // ortalama oran

  const profilFiyat =
    input.dogramaTipi === 'pvc' ? fiyatlar.pvcProfil :
    input.dogramaTipi === 'aluminyum' ? fiyatlar.aluminyumProfil :
    1400;

  const dogramaMaliyeti = dogramaMtul * profilFiyat;

  const camBirimFiyat =
    input.camTuru === 'isicam' ? fiyatlar.isicamFiyati :
    input.camTuru === 'cift' ? 850 : 550;
  const camMaliyeti = camAlani * camBirimFiyat;

  // Aksesuar + silikon
  const cerceveAksesuarMaliyeti = dogramaMtul * 185;

  const daireDisKapiMaliyeti =
    proje.bagimsizBolumSayisi * fiyatlar.celikKapiFiyati;

  const toplamOdaKapi =
    proje.bagimsizBolumSayisi * input.odaKapiBolumBasi;
  const odaKapiMaliyeti = toplamOdaKapi * fiyatlar.ahsapKapiFiyati;

  const binaGirisMaliyeti = input.binaGirisKapisi ? fiyatlar.binaGirisKapisi : 0;

  // Pervaz + denizlik: mtül başına 280 TL
  const pervazDenizlik = dogramaMtul * 280;

  const altToplam = kaliteUygula(
    dogramaMaliyeti + camMaliyeti + cerceveAksesuarMaliyeti +
    daireDisKapiMaliyeti + odaKapiMaliyeti +
    binaGirisMaliyeti + pervazDenizlik,
    proje.kaliteSeviyesi
  );

  return {
    dogramaMtul,
    camAlani,
    dogramaMaliyeti,
    camMaliyeti,
    cerceveAksesuarMaliyeti,
    daireDisKapiMaliyeti,
    odaKapiMaliyeti,
    binaGirisMaliyeti,
    pervazDenizlik,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 10 — PARKE VE KAPLAMA
// ─────────────────────────────────────────────

export interface ParkeKaplamaInput {
  parkeTuru: ParkeTuru;
  parkeAlani?: number;       // m², boşsa otomatik
  supurgelik: boolean;
}

export interface ParkeKaplamaSonuc {
  parkeAlani: number;
  supurgelikMtul: number;
  parkeMaliyeti: number;
  supurgelikMaliyeti: number;
  altToplam: number;
}

export function hesaplaParkeKaplama(
  input: ParkeKaplamaInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): ParkeKaplamaSonuc {
  const parkeAlani = input.parkeAlani ?? proje.insaatAlani * 0.45;

  const parkeBirimFiyat =
    input.parkeTuru === 'laminant' ? fiyatlar.laminantParke :
    input.parkeTuru === 'masif'    ? fiyatlar.masifParke :
    input.parkeTuru === 'spc'      ? fiyatlar.spcParke :
    fiyatlar.lamineParke;

  const parkeMaliyeti = parkeAlani * parkeBirimFiyat;

  const supurgelikMtul = Math.sqrt(parkeAlani) * 8;
  const supurgelikMaliyeti = input.supurgelik
    ? supurgelikMtul * fiyatlar.ahsapSupurgelik
    : 0;

  const altToplam = kaliteUygula(
    parkeMaliyeti + supurgelikMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    parkeAlani,
    supurgelikMtul,
    parkeMaliyeti,
    supurgelikMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 11 — ELEKTRİK VE ALÇIPAN
// ─────────────────────────────────────────────

export interface ElektrikAlcipanInput {
  kartonpiyerVarMi: boolean;
  kartonpiyerMtul?: number;
  duzAlcipanAlani?: number;
  goruntulDiyafon: boolean;
  kameraSistemi: boolean;
  jenerator: 'yok' | 'ortak' | 'daire_basi';
}

export interface ElektrikAlcipanSonuc {
  elektrikTesisatMaliyeti: number;
  kartonpiyerMaliyeti: number;
  alcipanMaliyeti: number;
  diyafonKameraMaliyeti: number;
  jeneratorMaliyeti: number;
  altToplam: number;
}

export function hesaplaElektrikAlcipan(
  input: ElektrikAlcipanInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): ElektrikAlcipanSonuc {
  const elektrikTesisatMaliyeti =
    proje.bagimsizBolumSayisi * fiyatlar.elektrikBolumBasi;

  const kartonpiyerMtul =
    input.kartonpiyerMtul ?? proje.insaatAlani * 0.55;
  const kartonpiyerMaliyeti = input.kartonpiyerVarMi
    ? kartonpiyerMtul * fiyatlar.kartonpiyerFiyati
    : 0;

  const duzAlcipanAlani = input.duzAlcipanAlani ?? proje.insaatAlani * 0.42;
  const alcipanMaliyeti = duzAlcipanAlani * fiyatlar.alcipanFiyati;

  const diyafonMaliyet = input.goruntulDiyafon
    ? proje.bagimsizBolumSayisi * 1800
    : 0;
  const kameraMaliyet = input.kameraSistemi ? 6500 : 0;
  const diyafonKameraMaliyeti = diyafonMaliyet + kameraMaliyet;

  let jeneratorMaliyeti = 0;
  if (input.jenerator === 'ortak') {
    jeneratorMaliyeti = 85000;
  } else if (input.jenerator === 'daire_basi') {
    jeneratorMaliyeti = proje.bagimsizBolumSayisi * 22000;
  }

  const altToplam = kaliteUygula(
    elektrikTesisatMaliyeti + kartonpiyerMaliyeti + alcipanMaliyeti +
    diyafonKameraMaliyeti + jeneratorMaliyeti,
    proje.kaliteSeviyesi
  );

  return {
    elektrikTesisatMaliyeti,
    kartonpiyerMaliyeti,
    alcipanMaliyeti,
    diyafonKameraMaliyeti,
    jeneratorMaliyeti,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 12 — KAMU ÖDEMELERİ VE DİĞER
// ─────────────────────────────────────────────

export interface KamuOdemeleriInput {
  bayindirlikBirimM2?: number;   // TL/m², default 6500
  yapiDenetimOrani?: number;     // %, default 1.58
  ruhsatHarci: boolean;
  enerjiKimlikBelgesi: boolean;
  zeminEtudu: boolean;
  akustikRapor: boolean;
  santiyeAySayisi?: number;      // kaç ay
}

export interface KamuOdemeleriSonuc {
  yapiDenetimBedeli: number;
  ruhsatHarci: number;
  enerjiKimlikBelgesi: number;
  zeminEtuduMaliyeti: number;
  akustikRaporMaliyeti: number;
  santiYeKurulumMaliyeti: number;
  santiyeAylikMaliyetToplam: number;
  altToplam: number;
}

export function hesaplaKamuOdemeleri(
  input: KamuOdemeleriInput,
  proje: ProjeGenelBilgiler,
  fiyatlar: BirimFiyatlar = DEFAULT_BIRIM_FIYATLAR
): KamuOdemeleriSonuc {
  const bayindirlik = input.bayindirlikBirimM2 ?? fiyatlar.bayindirlikBirimM2;
  const denetimOrani = (input.yapiDenetimOrani ?? fiyatlar.yapiDenetimOrani) / 100;
  const yapiDenetimBedeli = proje.insaatAlani * bayindirlik * denetimOrani;

  // Ruhsat harcı: Bayındırlık × İnşaat Alanı × ~%0.15
  const ruhsatHarci = input.ruhsatHarci
    ? proje.insaatAlani * bayindirlik * 0.0015
    : 0;

  const enerjiKimlikBelgesi = input.enerjiKimlikBelgesi ? 3500 : 0;
  const zeminEtuduMaliyeti = input.zeminEtudu ? 28000 : 0;
  const akustikRaporMaliyeti = input.akustikRapor ? 11000 : 0;

  // Şantiye kurulumu sabit
  const santiYeKurulumMaliyeti = proje.insaatAlani * 0.28 * 1000; // ~280 TL/m²

  const aySayisi = input.santiyeAySayisi ?? Math.ceil(proje.insaatAlani / 280);
  const santiyeAylikMaliyetToplam = aySayisi * fiyatlar.santiyeAylikMaliyet;

  const altToplam =
    yapiDenetimBedeli + ruhsatHarci + enerjiKimlikBelgesi +
    zeminEtuduMaliyeti + akustikRaporMaliyeti +
    santiYeKurulumMaliyeti + santiyeAylikMaliyetToplam;

  return {
    yapiDenetimBedeli,
    ruhsatHarci,
    enerjiKimlikBelgesi,
    zeminEtuduMaliyeti,
    akustikRaporMaliyeti,
    santiYeKurulumMaliyeti,
    santiyeAylikMaliyetToplam,
    altToplam,
  };
}

// ─────────────────────────────────────────────
// GENEL ÖZET HESAPLAMA
// ─────────────────────────────────────────────

export interface TumKategorilerSonuc {
  kabaIsler: {
    betonDemir: number;
    duvar: number;
    cati: number;
    suYalitim: number;
    toplamKabaIs: number;
  };
  inceIsler: {
    disCephe: number;
    isitmaSogutma: number;
    seramikMermer: number;
    sivaBoya: number;
    pencereKapi: number;
    parkeKaplama: number;
    elektrikAlcipan: number;
    toplamInceIs: number;
  };
  digerIsler: {
    kamuOdemeleri: number;
    toplamDiger: number;
  };
  genelToplam: number;
  m2BasinaMaliyet: number;
  bolumBasinaMaliyet: number;
  kabaIsYuzdesi: number;
  inceIsYuzdesi: number;
  digerYuzdesi: number;
}

export function hesaplaGenelOzet(
  kabaIsler: { betonDemir: number; duvar: number; cati: number; suYalitim: number },
  inceIsler: { disCephe: number; isitmaSogutma: number; seramikMermer: number; sivaBoya: number; pencereKapi: number; parkeKaplama: number; elektrikAlcipan: number },
  digerIsler: { kamuOdemeleri: number },
  proje: ProjeGenelBilgiler
): TumKategorilerSonuc {
  const toplamKabaIs =
    kabaIsler.betonDemir + kabaIsler.duvar +
    kabaIsler.cati + kabaIsler.suYalitim;

  const toplamInceIs =
    inceIsler.disCephe + inceIsler.isitmaSogutma +
    inceIsler.seramikMermer + inceIsler.sivaBoya +
    inceIsler.pencereKapi + inceIsler.parkeKaplama +
    inceIsler.elektrikAlcipan;

  const toplamDiger = digerIsler.kamuOdemeleri;

  const genelToplam = toplamKabaIs + toplamInceIs + toplamDiger;
  const m2BasinaMaliyet = genelToplam / proje.insaatAlani;
  const bolumBasinaMaliyet =
    proje.bagimsizBolumSayisi > 0
      ? genelToplam / proje.bagimsizBolumSayisi
      : genelToplam;

  const kabaIsYuzdesi = genelToplam > 0 ? toplamKabaIs / genelToplam : 0;
  const inceIsYuzdesi = genelToplam > 0 ? toplamInceIs / genelToplam : 0;
  const digerYuzdesi  = genelToplam > 0 ? toplamDiger  / genelToplam : 0;

  return {
    kabaIsler: { ...kabaIsler, toplamKabaIs },
    inceIsler: { ...inceIsler, toplamInceIs },
    digerIsler: { ...digerIsler, toplamDiger },
    genelToplam,
    m2BasinaMaliyet,
    bolumBasinaMaliyet,
    kabaIsYuzdesi,
    inceIsYuzdesi,
    digerYuzdesi,
  };
}

// ─────────────────────────────────────────────
// OTO-DOLDUR: Proje bilgilerinden tüm inputları tahmin et
// ─────────────────────────────────────────────

/**
 * Proje genel bilgilerine göre tüm kategori inputlarını
 * otomatik tahminle doldurur. Kullanıcı sonradan override yapabilir.
 */
export function otoDoldurInputlar(proje: ProjeGenelBilgiler): {
  betonDemir: BetonDemirInput;
  duvar: DuvarInput;
  cati: CatiInput;
  suYalitim: SuYalitimInput;
  disCephe: DisCepheInput;
  isitmaSogutma: IsitmaSogutmaInput;
  seramikMermer: SeramikMermerInput;
  sivaBoya: SivaBoyaInput;
  pencereKapi: PencereKapiInput;
  parkeKaplama: ParkeKaplamaInput;
  elektrikAlcipan: ElektrikAlcipanInput;
  kamuOdemeleri: KamuOdemeleriInput;
} {
  const katAlani = proje.insaatAlani / Math.max(proje.katAdedi, 1);
  const isApartman = proje.yapiTuru === 'apartman' || proje.bagimsizBolumSayisi > 2;

  return {
    betonDemir: {
      temelTuru: isApartman ? 'radye' : 'radye',
      temelAlani: katAlani,
      temelKalinligi: isApartman ? 0.60 : 0.40,
      betonSinifi: isApartman ? 'C35' : 'C30',
      dosemeTipi: 'kirisli',
      dosemeKalinligi: 12,
    },
    duvar: {
      icDuvarMalzeme: 'tugla85',
      disDuvarMalzeme: isApartman ? 'gazbeton135' : 'gazbeton15',
    },
    cati: {
      catiTipi: 'celik',
      kaplama: 'osb_singil',
      isiYalitim: 'tas_yunu',
    },
    suYalitim: {
      membranKatSayisi: 2,
      balkonTerasSuYalitim: true,
    },
    disCephe: {
      kompozitOrani: 0.30,
      boyaOrani: 0.50,
      mantolama: true,
    },
    isitmaSogutma: {
      isitmaSistemi: isApartman ? 'radyator' : 'yerden',
      isitmaCihazi: isApartman ? 'kazan' : 'kombi',
      klimaBolumBasi: 1,
      sicakSuYontemi: isApartman ? 'boyler' : 'kombi',
    },
    seramikMermer: {
      merdivenMermer: true,
    },
    sivaBoya: {},
    pencereKapi: {
      dogramaTipi: isApartman ? 'pvc' : 'aluminyum',
      camTuru: 'isicam',
      odaKapiBolumBasi: 3,
      binaGirisKapisi: true,
    },
    parkeKaplama: {
      parkeTuru: isApartman ? 'laminant' : 'laminant',
      supurgelik: true,
    },
    elektrikAlcipan: {
      kartonpiyerVarMi: true,
      goruntulDiyafon: true,
      kameraSistemi: isApartman,
      jenerator: 'yok',
    },
    kamuOdemeleri: {
      ruhsatHarci: true,
      enerjiKimlikBelgesi: true,
      zeminEtudu: true,
      akustikRapor: isApartman,
      santiyeAySayisi: Math.max(6, Math.ceil(proje.insaatAlani / 280)),
    },
  };
}
