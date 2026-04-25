// Tekil Temel Hesap Motoru
// Standart referanslar:
//   TS 500:2000 — Betonarme Yapıların Tasarım ve Yapım Kuralları
//   TS EN 1992-1-1 — Eurocode 2 (bilgi amaçlı)
//
// Tasarım adımları:
//   1. Temel boyutlandırma (zemin emniyet gerilmesinden)
//   2. Zemin gerilmesi kontrolü (eksantrisite dahil)
//   3. Delme kesme kontrolü (TS 500 Md. 8.4)
//   4. Eğilme donatısı hesabı (her iki yön)

import type {
  BetonSinifi,
  CelikSinifi,
  DelmeKesmeKontrol,
  EgilmeDonatiSonuc,
  TekilTemelInput,
  TekilTemelSonuc,
  TekilTemelValidasyon,
  TemelBoyutu,
  ZeminGerilmesiSonuc,
} from "./types";

// ---------------------------------------------------------------------------
// Malzeme Karakteristik Değerleri
// TS 500 Çizelge 3.1 ve Çizelge 3.2
// ---------------------------------------------------------------------------

/** Karakteristik beton basınç dayanımı fck (MPa) */
const FCK: Record<BetonSinifi, number> = {
  C20: 20,
  C25: 25,
  C30: 30,
  C35: 35,
  C40: 40,
};

/** Tasarım beton basınç dayanımı fcd = fck / 1.5 (MPa) — TS 500 Md. 6.2.2 */
function fcd(sinif: BetonSinifi): number {
  return FCK[sinif] / 1.5;
}

/** Tasarım çekme dayanımı fctd (MPa) — TS 500 Çizelge 3.1 */
const FCTD: Record<BetonSinifi, number> = {
  C20: 0.85,
  C25: 1.0,
  C30: 1.15,
  C35: 1.3,
  C40: 1.45,
};

/** Tasarım çelik akma dayanımı fyd (MPa) — TS 500 Md. 6.2.3 */
const FYD: Record<CelikSinifi, number> = {
  B420C: 420 / 1.15,
  B500C: 500 / 1.15,
};

/** Karakteristik akma dayanımı fyk (MPa) */
const FYK: Record<CelikSinifi, number> = {
  B420C: 420,
  B500C: 500,
};

// ---------------------------------------------------------------------------
// Yardımcı Fonksiyonlar
// ---------------------------------------------------------------------------

/** Standart donatı çap listesi (mm) */
const REBAR_DIAMETERS = [10, 12, 14, 16, 18, 20, 22, 25, 28, 32] as const;

/**
 * Donatı alanına göre en uygun adet×çap kombinasyonunu önerir.
 * @param as_gerekli Gerekli donatı alanı (cm²)
 * @returns "n×ΦXX" formatında öneri
 */
function oneriDonatí(as_gerekli: number): string {
  const as_mm2 = as_gerekli * 100; // cm² → mm²
  for (const cap of [...REBAR_DIAMETERS].reverse()) {
    const tek_as = Math.PI * cap * cap / 4; // mm²
    const adet = Math.ceil(as_mm2 / tek_as);
    if (adet <= 20) {
      const saglanân = (adet * tek_as / 100).toFixed(2); // cm²
      return `${adet}×Φ${cap} (As=${saglanân} cm²)`;
    }
  }
  return `${Math.ceil(as_gerekli / 5)}×Φ32`;
}

/**
 * Tasarım momentinden donatı hesabı.
 * Tek kiriş gibi hesap, TS 500 Md. 7.1
 * @param Md Tasarım momenti (kNm)
 * @param b Kesit genişliği (m)
 * @param d Faydalı yükseklik (m)
 * @param betonSinifi Beton sınıfı
 * @param celikSinifi Çelik sınıfı
 */
function hesaplaEgilmeDonati(
  Md: number,
  b: number,
  d: number,
  betonSinifi: BetonSinifi,
  celikSinifi: CelikSinifi
): number {
  // TS 500 Denklem 7.1
  // Md = fcd × b × d² × (ξ - ξ²/2) × 1000   [kNm → kN·m]
  // Basitleştirilmiş: As = Md / (fyd × 0.9 × d)
  const _fyd = FYD[celikSinifi] * 1000; // MPa → kN/m²
  const _fcd = fcd(betonSinifi) * 1000; // MPa → kN/m²
  const Md_knm = Md; // kNm

  // İteratif çözüm yerine yaklaşık formül — TS 500 7.1 yaklaşımı
  const kappa = Md_knm / (_fcd * b * d * d);
  const alpha = 1 - Math.sqrt(Math.max(0, 1 - 2 * kappa));
  const as_m2 = (_fcd * b * alpha * d) / _fyd; // m²
  return as_m2 * 10000; // m² → cm²
}

// ---------------------------------------------------------------------------
// Doğrulama
// ---------------------------------------------------------------------------

export function validaTekilTemel(input: TekilTemelInput): TekilTemelValidasyon[] {
  const hatalar: TekilTemelValidasyon[] = [];

  if (!Number.isFinite(input.eksenelYukNd) || input.eksenelYukNd <= 0) {
    hatalar.push({ alan: "eksenelYukNd", mesaj: "Eksenel yük Nd sıfırdan büyük olmalıdır (kN)." });
  }
  if (!Number.isFinite(input.zeminEmniyetGerilmesi) || input.zeminEmniyetGerilmesi <= 0) {
    hatalar.push({
      alan: "zeminEmniyetGerilmesi",
      mesaj: "Zemin emniyet gerilmesi sıfırdan büyük olmalıdır (kN/m²).",
    });
  }
  if (!Number.isFinite(input.temelDerinligi) || input.temelDerinligi <= 0) {
    hatalar.push({ alan: "temelDerinligi", mesaj: "Temel derinliği Df sıfırdan büyük olmalıdır (m)." });
  }
  if (!Number.isFinite(input.kolonBoyutuA) || input.kolonBoyutuA <= 0) {
    hatalar.push({ alan: "kolonBoyutuA", mesaj: "Kolon boyutu a sıfırdan büyük olmalıdır (m)." });
  }
  if (!Number.isFinite(input.kolonBoyutuB) || input.kolonBoyutuB <= 0) {
    hatalar.push({ alan: "kolonBoyutuB", mesaj: "Kolon boyutu b sıfırdan büyük olmalıdır (m)." });
  }
  if (!Number.isFinite(input.pasPayi) || input.pasPayi < 30 || input.pasPayi > 100) {
    hatalar.push({ alan: "pasPayi", mesaj: "Pas payı 30–100 mm aralığında olmalıdır." });
  }
  if (
    !Number.isFinite(input.zeminBirimHacimAgirligi) ||
    input.zeminBirimHacimAgirligi <= 0 ||
    input.zeminBirimHacimAgirligi > 25
  ) {
    hatalar.push({
      alan: "zeminBirimHacimAgirligi",
      mesaj: "Zemin birim hacim ağırlığı 0–25 kN/m³ aralığında olmalıdır.",
    });
  }

  return hatalar;
}

// ---------------------------------------------------------------------------
// Ana Hesap Fonksiyonu
// ---------------------------------------------------------------------------

/**
 * Tekil temel boyutlandırma ve donatı hesabı.
 *
 * Adımlar:
 *  1. Net zemin gerilmesi hesabı (zemin ağırlığı düşülerek)
 *  2. Temel boyutu belirleme (A_temel ≥ (Nd + W_temel) / σ_em)
 *  3. Eksantrisite ve gerilme dağılımı kontrolü
 *  4. Delme kesme kontrolü (TS 500 Md. 8.4)
 *  5. Eğilme donatısı (her iki yön, TS 500 Md. 7.1)
 *
 * @param input Giriş parametreleri
 * @returns Tam hesap sonucu
 */
export function hesaplaTekilTemel(input: TekilTemelInput): TekilTemelSonuc {
  const uyarilar: string[] = [];

  // ------------------------------------------------------------------
  // Adım 1: Malzeme değerleri
  // ------------------------------------------------------------------
  const _fcd = fcd(input.betonSinifi); // MPa
  const _fyd = FYD[input.celikSinifi]; // MPa
  const _fctd = FCTD[input.betonSinifi]; // MPa

  // ------------------------------------------------------------------
  // Adım 2: Net zemin emniyet gerilmesi
  // σ_net = σ_em - γ × Df   (TS 500 Md. 14.1)
  // ------------------------------------------------------------------
  const sigmaNet = input.zeminEmniyetGerilmesi - input.zeminBirimHacimAgirligi * input.temelDerinligi;

  if (sigmaNet <= 0) {
    uyarilar.push(
      "⚠ Net zemin gerilmesi sıfır veya negatif. Temel derinliği ve zemin emniyet gerilmesini kontrol edin."
    );
  }

  const sigmaNetPoz = Math.max(sigmaNet, 50); // minimum çalışma değeri

  // ------------------------------------------------------------------
  // Adım 3: Temel alanı ve boyutları
  // A_min = Nd / σ_net  — moment yükü için %20 artış
  // ------------------------------------------------------------------
  const momentEtkisi = (Math.abs(input.momentMx) + Math.abs(input.momentMy)) > 0 ? 1.2 : 1.0;
  const alanMin = (input.eksenelYukNd / sigmaNetPoz) * momentEtkisi;

  // Kare temel boyutu (yukarı yuvarlama, 0.1 m artışlarla)
  let temelKenar = Math.ceil(Math.sqrt(alanMin) * 10) / 10;

  // Minimum boyut kısıtı: kolon boyutundan en az 0.5 m fazla her yanda
  const minKenarA = input.kolonBoyutuA + 1.0; // her yanda 0.5 m
  const minKenarB = input.kolonBoyutuB + 1.0;
  temelKenar = Math.max(temelKenar, minKenarA, minKenarB);

  // 0.1 m adımlarına yuvarlama
  const boyutA = Math.ceil(temelKenar * 10) / 10;
  const boyutB = boyutA; // Kare temel (simetrik yükleme kabulü)
  const alan = boyutA * boyutB;

  // ------------------------------------------------------------------
  // Adım 4: Temel kalınlığı
  // h ≈ max(0.4m, boyut/5)  — ön boyutlandırma, delme kesme ile kontrol
  // ------------------------------------------------------------------
  let kalinlik = Math.max(0.4, boyutA / 5);
  kalinlik = Math.ceil(kalinlik * 20) / 20; // 5 cm adımlarına yuvarlama

  // Faydalı yükseklik d (m)
  const d = kalinlik - input.pasPayi / 1000 - 0.008; // pas payı + ortalama donatı yarıçapı

  if (d <= 0) {
    uyarilar.push("⚠ Faydalı yükseklik negatif. Temel kalınlığını artırın veya pas payını azaltın.");
  }

  // ------------------------------------------------------------------
  // Adım 5: Zemin gerilmesi kontrolü
  // σ = N/A ± Mx×b/(2×Ix) ± My×a/(2×Iy)
  // ------------------------------------------------------------------
  const Ix = (boyutA * boyutB * boyutB * boyutB) / 12; // m⁴
  const Iy = (boyutB * boyutA * boyutA * boyutA) / 12; // m⁴

  const sigmaOrt = input.eksenelYukNd / alan;
  const deltaSigmaX = (Math.abs(input.momentMx) * (boyutB / 2)) / Ix;
  const deltaSigmaY = (Math.abs(input.momentMy) * (boyutA / 2)) / Iy;

  const sigmaMax = sigmaOrt + deltaSigmaX + deltaSigmaY;
  const sigmaMin = sigmaOrt - deltaSigmaX - deltaSigmaY;

  const zeminKontrolGecti = sigmaMax <= input.zeminEmniyetGerilmesi && sigmaMin >= 0;
  const kullanimOraniZemin = (sigmaMax / input.zeminEmniyetGerilmesi) * 100;

  if (sigmaMin < 0) {
    uyarilar.push(
      "⚠ Köşede zemin gerilmesi sıfırın altında — temel boyutunu artırın veya momenti kontrol edin (TS 500 Md. 14.2)."
    );
  }
  if (kullanimOraniZemin > 100) {
    uyarilar.push(
      `⚠ Zemin emniyet gerilmesi aşıldı (kullanım oranı: %${kullanimOraniZemin.toFixed(0)}).`
    );
  }

  // ------------------------------------------------------------------
  // Adım 6: Delme kesme kontrolü (TS 500 Md. 8.4)
  // Kesme çevresi u = 4 × (a_kolon + d)  — d çevresinde
  // Vd = σ_max × (A_temel - A_kritik)
  // vRd = 0.65 × fctd  (MPa)
  // Vrd_kn = vRd × u × d × 1000  (kN)
  // ------------------------------------------------------------------
  const u = 2 * ((input.kolonBoyutuA + d) + (input.kolonBoyutuB + d)); // m
  const aKritik = (input.kolonBoyutuA + d) * (input.kolonBoyutuB + d); // m²
  const aDisKritik = Math.max(0, alan - aKritik);

  // Tasarım delme yükü — ortalama gerilme ile (muhafazakâr)
  const Vd = sigmaMax * aDisKritik; // kN

  // İzin verilen delme kapasitesi
  // TS 500 Denklem 8.13: vRd = 0.65 × fctd
  const vRd = 0.65 * _fctd; // MPa
  const Vrd = vRd * u * d * 1000; // MPa × m × m × 1000 → kN

  const delmeKontrolGecti = Vd <= Vrd;
  const delmeKullanimOrani = Vd / Vrd;

  // Delme kesme başarısız olursa kalınlık artır
  if (!delmeKontrolGecti) {
    uyarilar.push(
      `⚠ Delme kesme kapasitesi yetersiz (kullanım oranı: %${(delmeKullanimOrani * 100).toFixed(0)}). Temel kalınlığını artırmanız önerilir.`
    );
  }

  // ------------------------------------------------------------------
  // Adım 7: Eğilme donatısı (TS 500 Md. 7.1)
  // Kritik kesit kolon yüzünden geçer
  // Mx = σ_max × b × lx² / 2  (lx = (a_temel - a_kolon)/2)
  // ------------------------------------------------------------------
  const lx = (boyutA - input.kolonBoyutuA) / 2; // konsol uzunluğu — x yönü (m)
  const ly = (boyutB - input.kolonBoyutuB) / 2; // konsol uzunluğu — y yönü (m)

  // Tasarım momentleri (kNm/m × m = kNm)
  const MdX = sigmaMax * boyutB * lx * lx / 2; // kNm
  const MdY = sigmaMax * boyutA * ly * ly / 2; // kNm

  // X yönü donatısı
  const asX_gerekli = hesaplaEgilmeDonati(MdX, boyutB, d, input.betonSinifi, input.celikSinifi);

  // Minimum donatı oranı — TS 500 Md. 7.1.3
  // ρ_min = 0.003 için As_min = 0.003 × b × d × 10000
  const asX_min = 0.003 * boyutB * d * 10000; // cm²
  const asX_tasarim = Math.max(asX_gerekli, asX_min);

  // Y yönü donatısı
  const asY_gerekli = hesaplaEgilmeDonati(MdY, boyutA, d, input.betonSinifi, input.celikSinifi);
  const asY_min = 0.003 * boyutA * d * 10000; // cm²
  const asY_tasarim = Math.max(asY_gerekli, asY_min);

  // ------------------------------------------------------------------
  // Adım 8: Uyarılar ve kontrol özeti
  // ------------------------------------------------------------------
  if (input.eksenelYukNd > 5000) {
    uyarilar.push("ℹ Nd > 5000 kN: Bu araç ön boyutlandırma amaçlıdır. Yüksek yüklerde detaylı analiz yapılmasını öneririz.");
  }

  const _fyk = FYK[input.celikSinifi];
  if (_fck(input.betonSinifi) < 25 && input.temelDerinligi > 1.5) {
    uyarilar.push("ℹ Nemli zemin ortamında C25 ve üzeri beton kullanılması önerilir (TS EN 206).");
  }

  const tumKontrollerGecti = zeminKontrolGecti && delmeKontrolGecti;

  // Özet metin
  const ozetMetin =
    `Tekil temel boyutu: ${boyutA.toFixed(2)} m × ${boyutB.toFixed(2)} m × ${kalinlik.toFixed(2)} m. ` +
    `Zemin gerilmesi kontrolü: ${zeminKontrolGecti ? "✓ Geçti" : "✗ Başarısız"}. ` +
    `Delme kesme kontrolü: ${delmeKontrolGecti ? "✓ Geçti" : "✗ Başarısız"}.`;

  return {
    input,
    boyut: { a: boyutA, b: boyutB, alan, kalinlik },
    zeminGerilmesi: {
      ortGerilme: sigmaOrt,
      maxGerilme: sigmaMax,
      minGerilme: sigmaMin,
      kontrolGecti: zeminKontrolGecti,
      kullanimOrani: kullanimOraniZemin,
    },
    delmeKesme: {
      kesmecevresi: u,
      d,
      tasarimDelmeKuvveti: Vd,
      izinVerilenKapasite: Vrd,
      gecti: delmeKontrolGecti,
      kullanimOrani: delmeKullanimOrani,
    },
    donatiX: {
      tasarimMomenti: MdX,
      gerekliDonatíAlani: asX_gerekli,
      minDonatíAlani: asX_min,
      tasarimDonatíAlani: asX_tasarim,
      oneri: oneriDonatí(asX_tasarim),
    },
    donatiY: {
      tasarimMomenti: MdY,
      gerekliDonatíAlani: asY_gerekli,
      minDonatíAlani: asY_min,
      tasarimDonatíAlani: asY_tasarim,
      oneri: oneriDonatí(asY_tasarim),
    },
    uyarilar,
    tumKontrollerGecti,
    ozetMetin,
  };
}

/** FCK değerini döndürür (iç kullanım için yardımcı) */
function _fck(sinif: BetonSinifi): number {
  return FCK[sinif];
}

/** Tüm beton sınıfları (select için) */
export const BETON_SINIFI_OPTIONS: { value: BetonSinifi; label: string }[] = [
  { value: "C20", label: "C20/25" },
  { value: "C25", label: "C25/30" },
  { value: "C30", label: "C30/37" },
  { value: "C35", label: "C35/45" },
  { value: "C40", label: "C40/50" },
];

/** Tüm çelik sınıfları */
export const CELIK_SINIFI_OPTIONS: { value: CelikSinifi; label: string }[] = [
  { value: "B420C", label: "B420C (fyk=420 MPa)" },
  { value: "B500C", label: "B500C (fyk=500 MPa)" },
];

/** Zemin türü seçenekleri */
export const ZEMIN_TURU_OPTIONS: {
  value: import("./types").ZeminTuru;
  label: string;
  sigma_em: number; // kN/m² tavsiye değer
}[] = [
  { value: "kum_cakil", label: "Kum-Çakıl", sigma_em: 250 },
  { value: "siltli_kum", label: "Siltli Kum", sigma_em: 150 },
  { value: "kil_orta", label: "Orta Kil", sigma_em: 100 },
  { value: "kil_sert", label: "Sert Kil", sigma_em: 200 },
  { value: "kaya", label: "Kaya", sigma_em: 600 },
];

/** Kolon tipi seçenekleri */
export const KOLON_TIPI_OPTIONS: { value: import("./types").KolonTipi; label: string }[] = [
  { value: "kare", label: "Kare" },
  { value: "dikdortgen", label: "Dikdörtgen" },
  { value: "daire", label: "Daire (çap)" },
];

/** Varsayılan giriş değerleri */
export const TEKIL_TEMEL_VARSAYILAN: TekilTemelInput = {
  eksenelYukNd: 800,
  momentMx: 0,
  momentMy: 0,
  zeminEmniyetGerilmesi: 150,
  zeminTuru: "kum_cakil",
  temelDerinligi: 1.5,
  zeminBirimHacimAgirligi: 18,
  kolonTipi: "kare",
  kolonBoyutuA: 0.5,
  kolonBoyutuB: 0.5,
  betonSinifi: "C25",
  celikSinifi: "B420C",
  pasPayi: 50,
};
