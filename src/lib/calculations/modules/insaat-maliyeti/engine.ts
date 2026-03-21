// ============================================================
// src/lib/calculations/modules/insaat-maliyeti/engine.ts
// İnşaat Maliyet Hesap Motoru — 12 Kategori + Snapshot
// Referans: insaathesabi.com örnek proje verileri (2023-2026)
// ============================================================

import {
  applyKalite,
  betonHacmiKatsayisi,
  binaDisCepheAlani,
  demirKatsayisi,
  katAlaniHesapla,
  kareBinaKenar,
  resolvePrice,
  safePositive,
} from "../../core";

import { DEFAULT_PRICE_BOOK } from "../../price-books";

import type {
  BetonDemirInput,
  CalculationResultSnapshot,
  CategoryInputs,
  CategoryResult,
  CatiInput,
  CompositeCategoryKey,
  DisCepheInput,
  DuvarInput,
  ElektrikAlcipanInput,
  IsitmaSogutmaInput,
  KamuSabitInput,
  ParkKaplamaInput,
  PencereKapiInput,
  PriceBook,
  PriceLayer,
  ProjectProfile,
  SeramikMermerInput,
  SivaBoyaInput,
  SuYalitimInput,
} from "../../types";

// ─────────────────────────────────────────────
// YARDIMCI: PriceLayer oluştur
// ─────────────────────────────────────────────

export function buildPriceLayer(
  overrides?: Partial<PriceBook>,
  regionalCoeff?: number
): PriceLayer {
  return {
    systemDefault: DEFAULT_PRICE_BOOK,
    regionalCoefficient: regionalCoeff,
    qualityFactor: 1.0,          // kalite engine içinde ayrıca uygulanır
    manualOverrides: overrides,
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 1 — BETON VE DEMİR
// ─────────────────────────────────────────────

export function calcBetonDemir(
  input: BetonDemirInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const katAlani   = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);
  const temelAlani = input.temelAlani ?? katAlani;

  // Beton
  const temelHacim  = temelAlani * input.temelKalinligi;
  const kolonHacim  = input.kolonPerdeBetonHacmi ?? proj.insaatAlani * 0.065;
  const dosemeHacim = proj.insaatAlani * betonHacmiKatsayisi(input.dosemeTipi);
  const toplamBeton = temelHacim + kolonHacim + dosemeHacim;

  const betonBirimFiyat =
    input.betonSinifi === "C25" ? resolvePrice("c25Beton", layer) :
    input.betonSinifi === "C30" ? resolvePrice("c30Beton", layer) :
    resolvePrice("c35Beton", layer);

  const betonMalz = toplamBeton * betonBirimFiyat;

  // Demir
  const demirTon   = proj.insaatAlani * demirKatsayisi(input.dosemeTipi);
  const demirMalz  = demirTon * resolvePrice("demir", layer);

  // İşçilik
  const kalipAlani = proj.insaatAlani * 1.85;
  const kalipIsc   = kalipAlani * resolvePrice("kalipIscilik", layer);
  const demirIsc   = kalipAlani * resolvePrice("demirIscilik", layer);

  const ham = betonMalz + demirMalz + kalipIsc + demirIsc;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key:   "betonDemir",
    label: "Beton ve Demir",
    group: "kabaIs",
    altToplam,
    quantities: [
      { id: "beton-hacim", label: "Toplam Beton Hacmi",  birim: "m3",  miktar: toplamBeton, kaynak: "otomatik", varsayim: "Temel + Kolon/Perde + Döşeme" },
      { id: "demir-ton",   label: "Toplam Demir Tonajı", birim: "ton", miktar: demirTon,    kaynak: "otomatik", varsayim: `İnşaat alanı × ${demirKatsayisi(input.dosemeTipi)} ton/m²` },
      { id: "kalip-alan",  label: "Kalıp Alanı",         birim: "m2",  miktar: kalipAlani,  kaynak: "otomatik", varsayim: "İnşaat alanı × 1.85" },
    ],
    costLines: [
      { id: "beton-malz",   label: "Beton Malzemesi",   malzemeMaliyeti: betonMalz, iscilikMaliyeti: 0,       altToplam: betonMalz, kaynak: "otomatik" },
      { id: "demir-malz",   label: "Demir Malzemesi",   malzemeMaliyeti: demirMalz, iscilikMaliyeti: 0,       altToplam: demirMalz,  kaynak: "otomatik" },
      { id: "kalip-isc",    label: "Kalıp İşçiliği",    malzemeMaliyeti: 0,         iscilikMaliyeti: kalipIsc, altToplam: kalipIsc,  kaynak: "otomatik" },
      { id: "demir-isc",    label: "Demir İşçiliği",    malzemeMaliyeti: 0,         iscilikMaliyeti: demirIsc, altToplam: demirIsc,  kaynak: "otomatik" },
    ],
    varsayimlar: [
      `Beton sınıfı: ${input.betonSinifi}`,
      `Döşeme tipi: ${input.dosemeTipi}`,
      `Kolon/perde hacmi: toplam alanın ~%6.5'i olarak tahmin edildi`,
      "Kalıp alanı: inşaat alanı × 1.85 katsayısıyla hesaplandı",
    ],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 2 — DUVAR
// ─────────────────────────────────────────────

export function calcDuvar(
  input: DuvarInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const katAlani       = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);
  const binaYuksekligi = proj.katAdedi * 3.0;
  const binaKenar      = kareBinaKenar(katAlani);

  const icAlani  = input.icDuvarAlani  ?? proj.insaatAlani * 2.5;
  const disAlani = input.disDuvarAlani ?? binaKenar * binaYuksekligi;

  // İç duvar malzeme
  let icMalz = 0;
  if (input.icDuvarMalzeme === "tugla10") {
    icMalz = icAlani * 25 * resolvePrice("tugla10", layer);
  } else if (input.icDuvarMalzeme === "tugla85") {
    icMalz = icAlani * 25 * resolvePrice("tugla85", layer);
  } else {
    icMalz = icAlani * 0.10 * resolvePrice("gazbeton", layer);
  }

  // Dış duvar malzeme
  let disMalz = 0;
  if (input.disDuvarMalzeme !== "tugla") {
    const kalinlik = input.disDuvarMalzeme === "gazbeton15" ? 0.15 : 0.135;
    disMalz = disAlani * kalinlik * resolvePrice("gazbeton", layer);
  } else {
    disMalz = disAlani * 25 * resolvePrice("tugla10", layer);
  }

  const icIsc  = icAlani  * resolvePrice("tuglaIscilik",    layer);
  const disIsc = disAlani * resolvePrice("gazbetonIscilik", layer);
  const harc   = (icMalz + disMalz) * 0.08; // harç %8

  const ham = icMalz + disMalz + icIsc + disIsc + harc;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "duvar", label: "Duvar", group: "kabaIs", altToplam,
    quantities: [
      { id: "ic-alan",  label: "İç Duvar Alanı",  birim: "m2", miktar: icAlani,  kaynak: input.icDuvarAlani  ? "manuel" : "otomatik", varsayim: "İnşaat alanı × 2.5" },
      { id: "dis-alan", label: "Dış Duvar Alanı", birim: "m2", miktar: disAlani, kaynak: input.disDuvarAlani ? "manuel" : "otomatik", varsayim: "Çevre × bina yüksekliği" },
    ],
    costLines: [
      { id: "ic-malz",  label: "İç Duvar Malzeme", malzemeMaliyeti: icMalz,  iscilikMaliyeti: icIsc,  altToplam: icMalz + icIsc,   kaynak: "otomatik" },
      { id: "dis-malz", label: "Dış Duvar Malzeme", malzemeMaliyeti: disMalz, iscilikMaliyeti: disIsc, altToplam: disMalz + disIsc, kaynak: "otomatik" },
      { id: "harc",     label: "Harç (kum+çimento)", malzemeMaliyeti: harc,   iscilikMaliyeti: 0,      altToplam: harc,              kaynak: "otomatik" },
    ],
    varsayimlar: [
      `İç duvar: ${input.icDuvarMalzeme === "tugla10" ? "Tuğla 10cm" : input.icDuvarMalzeme === "tugla85" ? "Tuğla 8.5cm" : "Gazbeton"}`,
      `Dış duvar: ${input.disDuvarMalzeme}`,
      "İç duvar alanı: inşaat alanı × 2.5 katsayısı (boş değilse)",
      "Harç maliyeti: malzeme toplamının %8'i",
    ],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 3 — ÇATI
// ─────────────────────────────────────────────

export function calcCati(
  input: CatiInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const katAlani = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);
  const catiAlani = input.catiAlani ?? katAlani * 1.15;

  let karkasMalz = 0;
  let karkasKg = 0;
  if (input.catiTipi === "celik") {
    karkasKg = catiAlani * 0.024;
    karkasMalz = karkasKg * resolvePrice("celik", layer) + catiAlani * 225;
  } else if (input.catiTipi === "betonarme") {
    karkasMalz = catiAlani * 650;
  } else {
    karkasMalz = catiAlani * 280;
  }

  let kaplamaMalz = 0;
  if (input.kaplama === "osb_singil") {
    kaplamaMalz = catiAlani * 0.67 * 2 * 250; // OSB plakaları
  } else if (input.kaplama === "kiremit") {
    kaplamaMalz = catiAlani * 280;
  } else if (input.kaplama === "membran") {
    kaplamaMalz = catiAlani * resolvePrice("singil", layer);
  } else {
    kaplamaMalz = catiAlani * 350;
  }

  const isiYalitim = input.isiYalitim === "tas_yunu"
    ? catiAlani * resolvePrice("tasYunu", layer)
    : catiAlani * resolvePrice("xps", layer);

  const membranTop  = input.suYalitimMembranTop ?? Math.ceil(catiAlani / 8);
  const suYalitim   = membranTop * resolvePrice("membran", layer)
    + catiAlani * resolvePrice("singil", layer) * 1.1
    + catiAlani * resolvePrice("membranIscilik", layer);

  const dereUzun  = kareBinaKenar(katAlani) * 0.6;
  const dereMalz  = dereUzun * 900;

  const ham = karkasMalz + kaplamaMalz + isiYalitim + suYalitim + dereMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "cati", label: "Çatı", group: "kabaIs", altToplam,
    quantities: [
      { id: "cati-alan", label: "Çatı Alanı",       birim: "m2",  miktar: catiAlani, kaynak: input.catiAlani ? "manuel" : "otomatik", varsayim: "Kat alanı × 1.15" },
      { id: "celik-ton", label: "Çelik Karkas",     birim: "ton", miktar: karkasKg,  kaynak: "otomatik",  varsayim: "Çatı alanı × 0.024 ton/m²" },
      { id: "dere-uzun", label: "Sac Dere Uzunluğu",birim: "mtul", miktar: dereUzun, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "karkas",    label: "Çatı Karkası",    malzemeMaliyeti: karkasMalz,  iscilikMaliyeti: 0, altToplam: karkasMalz,  kaynak: "otomatik" },
      { id: "kaplama",   label: "Kaplama",          malzemeMaliyeti: kaplamaMalz, iscilikMaliyeti: 0, altToplam: kaplamaMalz, kaynak: "otomatik" },
      { id: "isi-yal",   label: "Isı Yalıtımı",    malzemeMaliyeti: isiYalitim,  iscilikMaliyeti: 0, altToplam: isiYalitim,  kaynak: "otomatik" },
      { id: "su-yal",    label: "Su Yalıtımı",     malzemeMaliyeti: suYalitim,   iscilikMaliyeti: 0, altToplam: suYalitim,   kaynak: "otomatik" },
      { id: "dere",      label: "Sac Dere",         malzemeMaliyeti: dereMalz,    iscilikMaliyeti: 0, altToplam: dereMalz,    kaynak: "otomatik" },
    ],
    varsayimlar: [`Çatı tipi: ${input.catiTipi}`, `Kaplama: ${input.kaplama}`, `Isı yalıtımı: ${input.isiYalitim}`],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 4 — SU YALITIMI VE DRENAJ
// ─────────────────────────────────────────────

export function calcSuYalitim(
  input: SuYalitimInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const katAlani   = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);
  const temelAlani = input.temelSuYalitimAlani ?? katAlani * 1.30;
  const drenajUzun = input.drenajUzunlugu      ?? kareBinaKenar(katAlani);

  const membranM2  = temelAlani * input.membranKatSayisi;
  const topSayisi  = Math.ceil(membranM2 / 8);
  const membranMalz = topSayisi * resolvePrice("membran", layer);
  const membranIsc  = temelAlani * resolvePrice("membranIscilik", layer);
  const drenajMalz  = drenajUzun * resolvePrice("drenaj", layer);

  const balkonAlani = input.balkonTerasAlani ?? proj.bagimsizBolumSayisi * 8;
  const balkonMalz  = input.balkonTerasSuYalitim ? balkonAlani * 85 : 0;

  const ham = membranMalz + membranIsc + drenajMalz + balkonMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "suYalitimi", label: "Su Yalıtımı ve Drenaj", group: "kabaIs", altToplam,
    quantities: [
      { id: "temel-alan", label: "Temel Yalıtım Alanı", birim: "m2",  miktar: temelAlani, kaynak: "otomatik", varsayim: "Kat alanı × 1.30" },
      { id: "membran-top",label: "Membran Top Sayısı",   birim: "adet", miktar: topSayisi,  kaynak: "otomatik" },
      { id: "drenaj-uzun",label: "Drenaj Uzunluğu",     birim: "mtul", miktar: drenajUzun, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "membran",   label: "Membran Malzeme", malzemeMaliyeti: membranMalz, iscilikMaliyeti: membranIsc, altToplam: membranMalz + membranIsc, kaynak: "otomatik" },
      { id: "drenaj",    label: "Drenaj Hattı",    malzemeMaliyeti: drenajMalz,  iscilikMaliyeti: 0,          altToplam: drenajMalz,               kaynak: "otomatik" },
      { id: "balkon-yal",label: "Balkon/Teras Yalıtımı", malzemeMaliyeti: balkonMalz, iscilikMaliyeti: 0,   altToplam: balkonMalz,               kaynak: "otomatik" },
    ],
    varsayimlar: [`Membran kat sayısı: ${input.membranKatSayisi}`, "1 top membran ≈ 8 m²", "Drenaj: kare bina çevresi kadar"],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 5 — DIŞ CEPHE
// ─────────────────────────────────────────────

export function calcDisCephe(
  input: DisCepheInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const katAlani  = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);
  const cepheAlani = input.cepheAlani ?? binaDisCepheAlani(katAlani, proj.katAdedi);
  const soveOrani  = Math.max(0, 1 - input.kompozitOrani - input.boyaOrani);

  const kompAlani = cepheAlani * input.kompozitOrani;
  const boyAlani  = cepheAlani * input.boyaOrani;
  const soveAlani = cepheAlani * soveOrani;

  const kompMalz  = kompAlani  * resolvePrice("kompozit",   layer);
  const boyMalz   = boyAlani   * resolvePrice("cepheBoya",  layer);
  const soveMtul  = Math.sqrt(Math.max(soveAlani, 0)) * 8;
  const soveMalz  = soveAlani  * resolvePrice("sove",       layer) + soveMtul * resolvePrice("soveMtul", layer);
  const mantoAlani = input.mantolamaAlani ?? cepheAlani * 0.85;
  const mantoMalz  = input.mantolama ? mantoAlani * resolvePrice("mantolama5cm", layer) : 0;
  const iskele     = cepheAlani * 35;

  const ham = kompMalz + boyMalz + soveMalz + mantoMalz + iskele;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "disCephe", label: "Dış Cephe", group: "inceIs", altToplam,
    quantities: [
      { id: "cephe-alan",  label: "Toplam Cephe Alanı", birim: "m2", miktar: cepheAlani, kaynak: "otomatik" },
      { id: "kompozit-alan",label: "Kompozit Alanı",    birim: "m2", miktar: kompAlani,  kaynak: "otomatik", varsayim: `Cephe × %${Math.round(input.kompozitOrani * 100)}` },
      { id: "manto-alan",  label: "Mantolama Alanı",    birim: "m2", miktar: mantoAlani, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "kompozit", label: "Kompozit Kaplama", malzemeMaliyeti: kompMalz, iscilikMaliyeti: 0,   altToplam: kompMalz,  kaynak: "otomatik" },
      { id: "boya",     label: "Cephe Boyası",     malzemeMaliyeti: boyMalz,  iscilikMaliyeti: 0,   altToplam: boyMalz,   kaynak: "otomatik" },
      { id: "sove",     label: "Söve",             malzemeMaliyeti: soveMalz, iscilikMaliyeti: 0,   altToplam: soveMalz,  kaynak: "otomatik" },
      { id: "manto",    label: "Mantolama (XPS)",  malzemeMaliyeti: mantoMalz,iscilikMaliyeti: 0,   altToplam: mantoMalz, kaynak: "otomatik" },
      { id: "iskele",   label: "İskele İşçiliği",  malzemeMaliyeti: 0,        iscilikMaliyeti: iskele, altToplam: iskele, kaynak: "otomatik" },
    ],
    varsayimlar: [
      `Kompozit: %${Math.round(input.kompozitOrani * 100)} | Boya: %${Math.round(input.boyaOrani * 100)} | Söve: %${Math.round(soveOrani * 100)}`,
      input.mantolama ? "Mantolama: XPS 5cm dahil" : "Mantolama dahil değil",
    ],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 6 — ISITMA VE SOĞUTMA
// ─────────────────────────────────────────────

export function calcIsitmaSogutma(
  input: IsitmaSogutmaInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  let tesisatMalz = 0;
  if (input.isitmaSistemi === "yerden") {
    tesisatMalz = proj.insaatAlani * resolvePrice("yerdenIsitma", layer);
  } else if (input.isitmaSistemi === "radyator") {
    tesisatMalz = proj.insaatAlani * 0.70 * resolvePrice("radyator", layer);
  } else {
    tesisatMalz = proj.insaatAlani * 220;
  }

  let cihazMalz = 0;
  if (input.isitmaCihazi === "kombi") {
    cihazMalz = proj.bagimsizBolumSayisi * resolvePrice("kombi", layer);
  } else if (input.isitmaCihazi === "kazan") {
    cihazMalz = resolvePrice("kazan", layer) + proj.bagimsizBolumSayisi * 4_500;
  } else {
    cihazMalz = proj.insaatAlani * 380;
  }

  const klimaMalz = proj.bagimsizBolumSayisi * input.klimaBolumBasi * resolvePrice("klima", layer);
  const sihhi     = proj.bagimsizBolumSayisi * 14_500; // sıhhi tesisat

  const ham = tesisatMalz + cihazMalz + klimaMalz + sihhi;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "isitmaSogutma", label: "Isıtma ve Soğutma", group: "inceIs", altToplam,
    quantities: [
      { id: "klima-adet", label: "Klima Adedi", birim: "adet", miktar: proj.bagimsizBolumSayisi * input.klimaBolumBasi, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "tesisat", label: "Isıtma Tesisatı",  malzemeMaliyeti: tesisatMalz, iscilikMaliyeti: 0, altToplam: tesisatMalz, kaynak: "otomatik" },
      { id: "cihaz",   label: "Isıtma Cihazı",    malzemeMaliyeti: cihazMalz,   iscilikMaliyeti: 0, altToplam: cihazMalz,   kaynak: "otomatik" },
      { id: "klima",   label: "Klima",             malzemeMaliyeti: klimaMalz,   iscilikMaliyeti: 0, altToplam: klimaMalz,   kaynak: "otomatik" },
      { id: "sihhi",   label: "Sıhhi Tesisat",     malzemeMaliyeti: sihhi,       iscilikMaliyeti: 0, altToplam: sihhi,       kaynak: "otomatik" },
    ],
    varsayimlar: [
      `Isıtma sistemi: ${input.isitmaSistemi}`,
      `Kalorifer cihazı: ${input.isitmaCihazi}`,
      "Sıhhi tesisat: bölüm başına 14.500 TL sabit",
    ],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 7 — SERAMİK VE MERMER
// ─────────────────────────────────────────────

export function calcSeramikMermer(
  input: SeramikMermerInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const bb = proj.bagimsizBolumSayisi;

  const banyoDuvar = input.banyoDuvarSeramikAlani ?? bb * 28;
  const banyoYer   = input.banyoYerSeramikAlani   ?? bb * 7;
  const mutfak     = input.mutfakZeminAlani        ?? bb * 15;
  const hol        = input.holZeminAlani           ?? bb * 9;
  const balkon     = input.balkonTerasAlani        ?? bb * 8;
  const toplamAlan = banyoDuvar + banyoYer + mutfak + hol + balkon;

  const seramikMalz =
    banyoDuvar * resolvePrice("banyoDuvarSeramik", layer) +
    banyoYer   * resolvePrice("banyoYerSeramik",   layer) +
    mutfak     * resolvePrice("mutfakYerSeramik",  layer) +
    (hol + balkon) * resolvePrice("holYerSeramik", layer);
  const seramikIsc  = toplamAlan * resolvePrice("seramikIscilik", layer);
  const yapist      = seramikMalz * 0.07;

  const basamakSayisi = input.merdivenBasamakSayisi ?? proj.katAdedi * 18;
  const basamakMtul   = basamakSayisi * 1.30;
  const mermerMalz    = input.merdivenMermer
    ? basamakMtul * (resolvePrice("mermerBasamak", layer) + resolvePrice("mermerIscilik", layer) * 0.8) + proj.katAdedi * 8 * 1_600
    : 0;

  const ham = seramikMalz + seramikIsc + yapist + mermerMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "seramikMermer", label: "Seramik ve Mermer", group: "inceIs", altToplam,
    quantities: [
      { id: "seramik-alan", label: "Toplam Seramik Alanı", birim: "m2",  miktar: toplamAlan, kaynak: "otomatik" },
      { id: "basamak",      label: "Mermer Basamak",       birim: "mtul", miktar: basamakMtul, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "seramik-malz", label: "Seramik Malzeme", malzemeMaliyeti: seramikMalz, iscilikMaliyeti: seramikIsc, altToplam: seramikMalz + seramikIsc, kaynak: "otomatik" },
      { id: "yapist",       label: "Yapıştırıcı/Derz", malzemeMaliyeti: yapist,      iscilikMaliyeti: 0,          altToplam: yapist,                    kaynak: "otomatik" },
      { id: "mermer",       label: "Merdiven Mermer",  malzemeMaliyeti: mermerMalz,  iscilikMaliyeti: 0,          altToplam: mermerMalz,                 kaynak: "otomatik" },
    ],
    varsayimlar: [
      "Banyo duvar: bölüm başına 28 m²",
      "Yapıştırıcı/derz: malzeme toplamının %7'si",
      input.merdivenMermer ? "Merdiven mermeri dahil" : "Merdiven mermeri hariç",
    ],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 8 — SIVA VE BOYA
// ─────────────────────────────────────────────

export function calcSivaBoya(
  input: SivaBoyaInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const inceSivaAlani = input.inceSivaAlani ?? proj.insaatAlani * 3.5;
  const karaSivaAlani = input.karaSivaAlani ?? proj.bagimsizBolumSayisi * 45;

  const torba = Math.ceil(inceSivaAlani / 2.5);
  const alcimalz = torba * resolvePrice("makineAlcisi", layer);
  const alciIsc  = inceSivaAlani * resolvePrice("alciIscilik", layer);
  const inceSivaMaliyeti = alcimalz + alciIsc;

  const karaSivaMaliyeti = karaSivaAlani * (resolvePrice("karaSivaIscilik", layer) + 18);
  const boyaAlani  = inceSivaAlani + karaSivaAlani;
  const boyaMaliyeti = boyaAlani * resolvePrice("boyaMalzemeIscilik", layer);

  const ham = inceSivaMaliyeti + karaSivaMaliyeti + boyaMaliyeti;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "sivaBoya", label: "Sıva ve Boya", group: "inceIs", altToplam,
    quantities: [
      { id: "ince-siva", label: "İnce Sıva Alanı", birim: "m2",    miktar: inceSivaAlani, kaynak: "otomatik", varsayim: "İnşaat alanı × 3.5" },
      { id: "kara-siva", label: "Kara Sıva Alanı", birim: "m2",    miktar: karaSivaAlani, kaynak: "otomatik", varsayim: "Bölüm × 45" },
      { id: "alci-torba",label: "Makine Alçısı",   birim: "torba", miktar: torba,          kaynak: "otomatik" },
    ],
    costLines: [
      { id: "ince-siva", label: "İnce Sıva (Alçı)", malzemeMaliyeti: alcimalz, iscilikMaliyeti: alciIsc, altToplam: inceSivaMaliyeti,  kaynak: "otomatik" },
      { id: "kara-siva", label: "Kara Sıva",         malzemeMaliyeti: karaSivaMaliyeti * 0.3, iscilikMaliyeti: karaSivaMaliyeti * 0.7, altToplam: karaSivaMaliyeti, kaynak: "otomatik" },
      { id: "boya",      label: "Boya",               malzemeMaliyeti: boyaMaliyeti * 0.4, iscilikMaliyeti: boyaMaliyeti * 0.6, altToplam: boyaMaliyeti, kaynak: "otomatik" },
    ],
    varsayimlar: ["1 torba makine alçısı ≈ 2.5 m²", "Kara sıva: ıslak hacimler (bölüm × 45 m²)"],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 9 — PENCERE VE KAPI
// ─────────────────────────────────────────────

export function calcPencereKapi(
  input: PencereKapiInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const dogramaMtul = input.toplamDogramaMtul ?? proj.insaatAlani * 0.55;
  const camAlani    = dogramaMtul * 0.62;

  const profilFiyat =
    input.dogramaTipi === "pvc"       ? resolvePrice("pvcProfil",        layer) :
    input.dogramaTipi === "aluminyum" ? resolvePrice("aluminyumProfil",  layer) : 1_400;

  const dogramaMalz  = dogramaMtul * profilFiyat;
  const camBirim     = input.camTuru === "isicam" ? resolvePrice("isicam", layer)
                     : input.camTuru === "cift"   ? 850 : 550;
  const camMalz      = camAlani * camBirim;
  const aksesuarMalz = dogramaMtul * 185;

  const daireKapiMalz = proj.bagimsizBolumSayisi *
    (input.daireDiskKapiTipi === "celik" ? resolvePrice("celikKapi", layer) : resolvePrice("celikKapi", layer) * 1.3);
  const odaKapiAdet   = proj.bagimsizBolumSayisi * input.odaKapiBolumBasi;
  const odaKapiMalz   = odaKapiAdet * resolvePrice("ahsapKapi", layer);
  const girisKapiMalz = input.binaGirisKapisi ? resolvePrice("binaGirisKapisi", layer) : 0;
  const pervazMalz    = dogramaMtul * 280;

  const ham = dogramaMalz + camMalz + aksesuarMalz + daireKapiMalz + odaKapiMalz + girisKapiMalz + pervazMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "pencereKapi", label: "Pencere ve Kapı", group: "inceIs", altToplam,
    quantities: [
      { id: "dograma-mtul", label: "Doğrama Profil Uzunluğu", birim: "mtul", miktar: dogramaMtul, kaynak: "otomatik", varsayim: "İnşaat alanı × 0.55" },
      { id: "cam-alan",     label: "Cam Alanı",               birim: "m2",   miktar: camAlani,    kaynak: "otomatik" },
      { id: "oda-kapi",     label: "Oda Kapısı Adedi",        birim: "adet", miktar: odaKapiAdet, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "dograma",    label: "Doğrama",           malzemeMaliyeti: dogramaMalz,  iscilikMaliyeti: 0, altToplam: dogramaMalz,  kaynak: "otomatik" },
      { id: "cam",        label: "Cam",               malzemeMaliyeti: camMalz,      iscilikMaliyeti: 0, altToplam: camMalz,      kaynak: "otomatik" },
      { id: "daire-kapi", label: "Daire Kapısı",      malzemeMaliyeti: daireKapiMalz,iscilikMaliyeti: 0, altToplam: daireKapiMalz, kaynak: "otomatik" },
      { id: "oda-kapi",   label: "Oda Kapısı",        malzemeMaliyeti: odaKapiMalz,  iscilikMaliyeti: 0, altToplam: odaKapiMalz,  kaynak: "otomatik" },
      { id: "aksesuar",   label: "Aksesuar + Pervaz", malzemeMaliyeti: aksesuarMalz + pervazMalz, iscilikMaliyeti: 0, altToplam: aksesuarMalz + pervazMalz, kaynak: "otomatik" },
    ],
    varsayimlar: [`Doğrama: ${input.dogramaTipi.toUpperCase()}`, `Cam: ${input.camTuru}`, `Daire kapı: ${input.daireDiskKapiTipi}`],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 10 — PARKE VE KAPLAMA
// ─────────────────────────────────────────────

export function calcParkeKaplama(
  input: ParkKaplamaInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const parkeAlani = input.parkeAlani ?? proj.insaatAlani * 0.45;

  const parkeBirim =
    input.parkeTuru === "laminant" ? resolvePrice("laminantParke", layer) :
    input.parkeTuru === "masif"    ? resolvePrice("masifParke",    layer) :
    input.parkeTuru === "spc"      ? resolvePrice("spcParke",      layer) :
    resolvePrice("lamineParke", layer);

  const parkeMalz      = parkeAlani * parkeBirim;
  const supurgelikMtul = Math.sqrt(parkeAlani) * 8;
  const supurgelikMalz = input.supurgelik ? supurgelikMtul * resolvePrice("ahsapSupurgelik", layer) : 0;

  const ham = parkeMalz + supurgelikMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "parkeKaplama", label: "Parke ve Kaplama", group: "inceIs", altToplam,
    quantities: [
      { id: "parke-alan",    label: "Parke Alanı",         birim: "m2",   miktar: parkeAlani,     kaynak: "otomatik", varsayim: "İnşaat alanı × 0.45" },
      { id: "supurgelik",    label: "Süpürgelik",          birim: "mtul", miktar: supurgelikMtul, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "parke",      label: `${input.parkeTuru} Parke`, malzemeMaliyeti: parkeMalz,      iscilikMaliyeti: 0, altToplam: parkeMalz,      kaynak: "otomatik" },
      { id: "supurgelik", label: "Ahşap Süpürgelik",        malzemeMaliyeti: supurgelikMalz, iscilikMaliyeti: 0, altToplam: supurgelikMalz, kaynak: "otomatik" },
    ],
    varsayimlar: [`Parke türü: ${input.parkeTuru}`, "Parke alanı: inşaat alanının %45'i tahminidir"],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 11 — ELEKTRİK VE ALÇIPAN
// ─────────────────────────────────────────────

export function calcElektrikAlcipan(
  input: ElektrikAlcipanInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const elektrikMalz = proj.bagimsizBolumSayisi * resolvePrice("elektrikBolumBasi", layer);

  const ktpMtul  = input.kartonpiyerMtul ?? proj.insaatAlani * 0.55;
  const ktpMalz  = ktpMtul * resolvePrice("kartonpiyer", layer);

  const alpAlani = input.alcipanAlani ?? proj.insaatAlani * 0.42;
  const alpMalz  = alpAlani * resolvePrice("alcipan", layer);

  const diyafonMalz = input.goruntuluyDiyafon ? proj.bagimsizBolumSayisi * 1_800 : 0;
  const kameraMalz  = input.kameraSistemi ? 6_500 : 0;

  let jeneratorMalz = 0;
  if (input.jenerator === "ortak")          jeneratorMalz = 85_000;
  else if (input.jenerator === "baginmsizBolum") jeneratorMalz = proj.bagimsizBolumSayisi * 22_000;

  const ham = elektrikMalz + ktpMalz + alpMalz + diyafonMalz + kameraMalz + jeneratorMalz;
  const altToplam = applyKalite(ham, proj.kaliteSeviyesi);

  return {
    key: "elektrikAlcipan", label: "Elektrik ve Alçıpan", group: "inceIs", altToplam,
    quantities: [
      { id: "alcipan-alan", label: "Alçıpan Alanı",      birim: "m2",   miktar: alpAlani, kaynak: "otomatik" },
      { id: "ktp-mtul",     label: "Kartonpiyer Uzunluğu",birim: "mtul", miktar: ktpMtul,  kaynak: "otomatik" },
    ],
    costLines: [
      { id: "elektrik",  label: "Elektrik Tesisatı", malzemeMaliyeti: elektrikMalz, iscilikMaliyeti: 0, altToplam: elektrikMalz, kaynak: "otomatik" },
      { id: "karton",    label: "Kartonpiyer",        malzemeMaliyeti: ktpMalz,      iscilikMaliyeti: 0, altToplam: ktpMalz,      kaynak: "otomatik" },
      { id: "alcipan",   label: "Alçıpan",            malzemeMaliyeti: alpMalz,      iscilikMaliyeti: 0, altToplam: alpMalz,      kaynak: "otomatik" },
      { id: "diyafon",   label: "Görüntülü Diyafon",  malzemeMaliyeti: diyafonMalz,  iscilikMaliyeti: 0, altToplam: diyafonMalz, kaynak: "otomatik" },
      { id: "kamera",    label: "Kamera Sistemi",      malzemeMaliyeti: kameraMalz,   iscilikMaliyeti: 0, altToplam: kameraMalz,  kaynak: "otomatik" },
      { id: "jenerator", label: "Jeneratör",           malzemeMaliyeti: jeneratorMalz,iscilikMaliyeti: 0, altToplam: jeneratorMalz, kaynak: "otomatik" },
    ],
    varsayimlar: ["Elektrik: bölüm başına 12.000 TL (malzeme + işçilik)", "Alçıpan: inşaat alanının %42'si"],
  };
}

// ─────────────────────────────────────────────
// KATEGORİ 12 — KAMU ÖDEMELERİ VE SABİT GİDERLER
// ─────────────────────────────────────────────

export function calcKamuSabit(
  input: KamuSabitInput,
  proj: ProjectProfile,
  layer: PriceLayer
): CategoryResult {
  const bayindirlik = input.bayindirlikBirimM2 ?? resolvePrice("bayindirlikBirimM2", layer);
  const denetimOrani = input.yapiDenetimOrani ?? resolvePrice("yapiDenetimOrani", layer);
  const denetimBedeli = proj.insaatAlani * bayindirlik * denetimOrani;
  const ruhsatHarci  = proj.insaatAlani * bayindirlik * 0.0015;

  const enerjiBelgesi = input.enerjiBelgesi ? 3_500    : 0;
  const zeminEtudu    = input.zeminEtudu    ? 28_000   : 0;
  const akustikRapor  = input.akustikRapor  ? 11_000   : 0;

  const santiyeKurulum  = safePositive(proj.insaatAlani * 280);
  const santiyeAylik    = input.santiyeAylari * resolvePrice("santiyeAylikMaliyet", layer);

  // Kamu ödemelerine kalite katsayısı uygulanmaz
  const altToplam = denetimBedeli + ruhsatHarci + enerjiBelgesi + zeminEtudu + akustikRapor + santiyeKurulum + santiyeAylik;

  return {
    key: "kamuSabit", label: "Kamu Ödemeleri ve Sabit Giderler", group: "diger", altToplam,
    quantities: [
      { id: "santiye-ay", label: "Şantiye Süresi", birim: "ay", miktar: input.santiyeAylari, kaynak: "otomatik" },
    ],
    costLines: [
      { id: "denetim",    label: "Yapı Denetim Bedeli",  malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: denetimBedeli, kaynak: "otomatik" },
      { id: "ruhsat",     label: "Ruhsat Harcı",         malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: ruhsatHarci,   kaynak: "otomatik" },
      { id: "enerji",     label: "Enerji Kimlik Belgesi",malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: enerjiBelgesi, kaynak: "otomatik" },
      { id: "zemin",      label: "Zemin Etüdü",          malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: zeminEtudu,    kaynak: "otomatik" },
      { id: "akustik",    label: "Akustik Rapor",        malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: akustikRapor,  kaynak: "otomatik" },
      { id: "kurulum",    label: "Şantiye Kurulumu",     malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: santiyeKurulum,kaynak: "otomatik" },
      { id: "aylik",      label: "Şantiye Aylık Gideri", malzemeMaliyeti: 0, iscilikMaliyeti: 0, altToplam: santiyeAylik,  kaynak: "otomatik" },
    ],
    varsayimlar: [
      `Yapı denetim oranı: %${(denetimOrani * 100).toFixed(2)}`,
      `Bayındırlık birim fiyatı: ${bayindirlik.toLocaleString("tr-TR")} TL/m²`,
      `Şantiye süresi: ${input.santiyeAylari} ay`,
      "Kamu kalemleri kalite katsayısından etkilenmez",
    ],
  };
}

// ─────────────────────────────────────────────
// ANA SNAPSHOT ÜRETİCİ
// ─────────────────────────────────────────────

export function buildSnapshot(
  proj: ProjectProfile,
  inputs: CategoryInputs,
  layer: PriceLayer
): CalculationResultSnapshot {
  const categories: CategoryResult[] = [
    calcBetonDemir(inputs.betonDemir, proj, layer),
    calcDuvar(inputs.duvar, proj, layer),
    calcCati(inputs.cati, proj, layer),
    calcSuYalitim(inputs.suYalitimi, proj, layer),
    calcDisCephe(inputs.disCephe, proj, layer),
    calcIsitmaSogutma(inputs.isitmaSogutma, proj, layer),
    calcSeramikMermer(inputs.seramikMermer, proj, layer),
    calcSivaBoya(inputs.sivaBoya, proj, layer),
    calcPencereKapi(inputs.pencereKapi, proj, layer),
    calcParkeKaplama(inputs.parkeKaplama, proj, layer),
    calcElektrikAlcipan(inputs.elektrikAlcipan, proj, layer),
    calcKamuSabit(inputs.kamuSabit, proj, layer),
  ];

  const kabaIsToplamı = categories.filter(c => c.group === "kabaIs").reduce((s, c) => s + c.altToplam, 0);
  const inceIsToplamı = categories.filter(c => c.group === "inceIs").reduce((s, c) => s + c.altToplam, 0);
  const digerToplamı  = categories.filter(c => c.group === "diger").reduce((s, c) => s + c.altToplam, 0);
  const genelToplam   = kabaIsToplamı + inceIsToplamı + digerToplamı;
  const safe          = genelToplam > 0 ? genelToplam : 1;

  return {
    timestamp:       new Date().toISOString(),
    priceDate:       "Mart 2025",
    presetId:        proj.presetId,
    project:         proj,
    categories,
    kabaIsToplamı,
    inceIsToplamı,
    digerToplamı,
    genelToplam,
    m2BasinaFiyat:     genelToplam / Math.max(proj.insaatAlani, 1),
    bolumBasinaFiyat:  proj.bagimsizBolumSayisi > 0 ? genelToplam / proj.bagimsizBolumSayisi : genelToplam,
    kabaIsPct:  kabaIsToplamı / safe,
    inceIsPct:  inceIsToplamı / safe,
    digerPct:   digerToplamı  / safe,
  };
}

// ─────────────────────────────────────────────
// OTO-DOLDUR — Proje verisinden varsayılan inputlar
// ─────────────────────────────────────────────

export function buildDefaultInputs(proj: ProjectProfile): CategoryInputs {
  const isApartman = proj.yapiTuru === "apartman" || proj.bagimsizBolumSayisi > 2;
  const katAlani   = katAlaniHesapla(proj.insaatAlani, proj.katAdedi);

  return {
    betonDemir: {
      temelTuru:       "radye",
      temelAlani:      katAlani,
      temelKalinligi:  isApartman ? 0.60 : 0.40,
      betonSinifi:     isApartman ? "C35" : "C30",
      dosemeTipi:      "kirisli",
      dosemeKalinligi: 12,
    },
    duvar: {
      icDuvarMalzeme:  "tugla10",
      disDuvarMalzeme: isApartman ? "gazbeton135" : "gazbeton15",
    },
    cati: {
      catiTipi:   "celik",
      kaplama:    "kiremit",
      isiYalitim: "xps",
    },
    suYalitimi: {
      membranKatSayisi:     2,
      balkonTerasSuYalitim: true,
    },
    disCephe: {
      kompozitOrani: isApartman ? 0.20 : 0.30,
      boyaOrani:     0.50,
      mantolama:     true,
    },
    isitmaSogutma: {
      isitmaSistemi:  isApartman ? "radyator" : "yerden",
      isitmaCihazi:   isApartman && proj.katAdedi >= 6 ? "kazan" : "kombi",
      klimaBolumBasi: 2,
      sicakSuYontemi: isApartman && proj.katAdedi >= 6 ? "boyler" : "kombi",
    },
    seramikMermer: {
      merdivenMermer: true,
    },
    sivaBoya: {},
    pencereKapi: {
      dogramaTipi:       isApartman ? "pvc" : "aluminyum",
      camTuru:           "isicam",
      daireDiskKapiTipi: "celik",
      odaKapiBolumBasi:  3,
      binaGirisKapisi:   true,
    },
    parkeKaplama: {
      parkeTuru:  "laminant",
      supurgelik: true,
    },
    elektrikAlcipan: {
      goruntuluyDiyafon: true,
      kameraSistemi:     isApartman,
      jenerator:        "yok",
    },
    kamuSabit: {
      enerjiBelgesi: true,
      zeminEtudu:    true,
      akustikRapor:  isApartman && proj.katAdedi >= 6,
      santiyeAylari: Math.max(6, Math.ceil(proj.insaatAlani / 280)),
    },
  };
}
