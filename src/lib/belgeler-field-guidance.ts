/**
 * Belgeler Field Guidance & Semantic Quality Engine
 *
 * ASAMA_05 Sözleşmesi:
 * - 56/56 AcroForm düzenlenebilir alanının saf, seçici ve esnek kalite politikası.
 * - Yalnızca F (Tarih), K (T.C. Kimlik No), T (Telefon), Y (YİBF) ve P (Para/Ücret) semantik türlerinde validasyon.
 * - N (Nominal/serbest metin) alanlarında kısıtlayıcı regex veya keyfî biçim uyarısı ÜRETİLMEZ.
 * - Boş ve '-' nötr değerler için uyarı üretilmez.
 * - Saf fonksiyondur: Sıfır DOM bağımlılığı, sıfır değer mutasyonu, PII sızıntısı yok.
 * - Kontrat dışı alan anahtarları için belirgin hata/uyarı nesnesi döner.
 */

import { DOCUMENT_EDITABLE_FIELDS } from "./document-field-contracts";
import type { BelgeDocumentId } from "./belge-studio-inline-field-map";

export type FieldSemanticPolicyType =
  | "F" // Takvim tarihi (GG.AA.YYYY)
  | "K" // T.C. Kimlik No (11 hane, ilk rakam 0 olamaz, d10/d11 checksum)
  | "T" // Telefon (Ulusal 10 hane, 0 ile 11 hane, +90 ile 12 hane)
  | "Y" // YİBF (Yumuşak 7 hane sistem kodu önerisi)
  | "P" // Para / Ücret (Türkçe para formatı)
  | "N"; // Serbest nominal / teknik metin (kısıtlayıcı regex yok)

export interface FieldSemanticDefinition {
  type: FieldSemanticPolicyType;
  label: string;
  multiline?: boolean;
  linkedSignature?: boolean;
}

export type FieldGuidanceSeverity = "info" | "warning" | "printRisk";
export type FieldGuidanceKind = "format" | "print";

export interface FieldGuidanceResult {
  code: string;
  severity: FieldGuidanceSeverity;
  message: string;
  kind: FieldGuidanceKind;
}

/**
 * 56/56 Alanın Eksiksiz Semantik Politikaları Kayıt Defteri.
 * Belge sözleşmesindeki 5 belge ve 56 alan ile birebir eşlenir.
 */
export const DOCUMENT_FIELD_POLICIES = {
  "beton-dokum-tutanagi": {
    tutanak_alt_baslik: { type: "N", label: "Tutanak Alt Başlığı" },
    tarih: { type: "F", label: "Tarih" },
    yer: { type: "N", label: "Beton Döküm Yeri" },
    yibf: { type: "Y", label: "YİBF No" },
    olay_aciklamasi: { type: "N", multiline: true, label: "Olay Açıklaması" },
    gozlem_notlar: { type: "N", multiline: true, label: "Gözlem ve Notlar" },
    laboratuvar: { type: "N", label: "Laboratuvar Kuruluşu" },
    muteahhit: { type: "N", label: "Yapı Müteahhidi" },
    santiye_sefi: { type: "N", label: "Şantiye Şefi" },
    yapi_denetim: { type: "N", label: "Yapı Denetim Kuruluşu" },
  },
  "insaat-ruhsati-dilekcesi": {
    tarih: { type: "F", label: "Tarih" },
    belediye_adi: { type: "N", label: "Belediye Adı" },
    mudurluk_adi: { type: "N", label: "Müdürlük Adı" },
    ana_metin: { type: "N", multiline: true, label: "Dilekçe Metni" },
    ad_soyad: { type: "N", label: "Adı Soyadı" },
    unvan: { type: "N", label: "Unvanı" },
    adres: { type: "N", multiline: true, label: "Adres" },
    tel: { type: "T", label: "Telefon" },
  },
  "santiye-sefi-istifa-dilekcesi": {
    hitap_1: { type: "N", label: "Hitap Başlığı 1" },
    hitap_2: { type: "N", label: "Hitap Başlığı 2" },
    ana_paragraf: { type: "N", multiline: true, label: "İstifa Gerekçesi Metni" },
    sonuc_cumlesi: { type: "N", label: "Sonuç Cümlesi" },
    tarih: { type: "F", label: "Tarih" },
    unvan: { type: "N", label: "Unvan" },
    ad_soyad: { type: "N", label: "Adı Soyadı" },
    tc_deger: { type: "K", label: "T.C. Kimlik No" },
    iletisim_deger: { type: "T", label: "İletişim / Telefon" },
    adres_deger: { type: "N", label: "Adres" },
  },
  "santiye-sefi-sozlesmesi": {
    muteahhit_unvan: { type: "N", linkedSignature: true, label: "Yapı Müteahhidi Unvanı" },
    santiye_sefi_ad: { type: "N", linkedSignature: true, label: "Şantiye Şefi Adı Soyadı" },
    il: { type: "N", label: "İl" },
    ilce: { type: "N", label: "İlçe" },
    adres: { type: "N", label: "Açık Adres" },
    yibf: { type: "Y", label: "YİBF No" },
    pafta: { type: "N", label: "Pafta" },
    mahalle: { type: "N", label: "Mahalle" },
    ada: { type: "N", label: "Ada" },
    parsel: { type: "N", label: "Parsel" },
    ucret: { type: "P", label: "Aylık Brüt Ücret" },
    sozlesme_tarihi: { type: "F", label: "Sözleşme Tarihi" },
    santiye_sefi_imza_adi: { type: "N", linkedSignature: true, label: "Şantiye Şefi İmza Adı" },
    muteahhit_imza_unvan: { type: "N", linkedSignature: true, label: "Müteahhit İmza Unvanı" },
  },
  "santiye-sefi-taahhutnamesi": {
    santiye_sefi_ad_soyad: { type: "N", label: "Şantiye Şefi Adı Soyadı" },
    unvan: { type: "N", linkedSignature: true, label: "Unvanı" },
    oda_sicil_no: { type: "N", label: "Oda Sicil No" },
    tc_kimlik_no: { type: "K", label: "T.C. Kimlik No" },
    telefon: { type: "T", label: "Telefon No" },
    adres: { type: "N", label: "İkametgah Adresi" },
    il_ilce: { type: "N", label: "İl / İlçe" },
    ilgili_idare: { type: "N", label: "İlgili İdare" },
    pafta_ada_parsel: { type: "N", label: "Pafta / Ada / Parsel" },
    yapi_adresi: { type: "N", label: "Yapı Adresi" },
    yapi_sahibi: { type: "N", label: "Yapı Sahibi Adı" },
    yapi_sahibi_adresi: { type: "N", label: "Yapı Sahibi Adresi" },
    tarih: { type: "F", label: "Taahhütname Tarihi" },
    unvan_imza: { type: "N", linkedSignature: true, label: "İmza Üstü Unvan" },
  },
} as const satisfies Record<
  BelgeDocumentId,
  Record<string, FieldSemanticDefinition>
>;

// Tip güvenliği doğrulaması: DOCUMENT_EDITABLE_FIELDS anahtarları ile birebir örtüşmelidir
type ValidateContractCoverage = {
  [D in BelgeDocumentId]: {
    [K in (typeof DOCUMENT_EDITABLE_FIELDS)[D][number]]: FieldSemanticDefinition;
  };
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AssertExactCoverage = typeof DOCUMENT_FIELD_POLICIES extends ValidateContractCoverage
  ? true
  : never;

/**
 * T.C. Kimlik Numarası Algoritmik Doğrulama (K Tipi)
 *
 * Kurallar:
 * 1. 11 rakam olmalı, ilk rakam 0 olamaz.
 * 2. d10 = (7*(d1+d3+d5+d7+d9) - (d2+d4+d6+d8)) mod 10
 * 3. d11 = sum(d1..d10) mod 10
 *
 * Gizlilik:
 * - Ham TCKN hiçbir loglama veya dış servise iletilmez.
 * - Geçerli olduğunda "resmî doğrulandı" iddiası üretilmez, null döner.
 */
export function validateTcKimlikNo(value: string): FieldGuidanceResult | null {
  const trimmed = value.trim();
  // Boş veya nötr '-' değerleri için uyarı gösterilmez
  if (!trimmed || trimmed === "-") {
    return null;
  }

  // Yalnız rakam kontrolü
  if (!/^\d+$/.test(trimmed)) {
    return {
      code: "tckn-non-digit",
      severity: "warning",
      message: "T.C. Kimlik Numarası yalnızca rakamlardan oluşmalıdır.",
      kind: "format",
    };
  }

  // 11 hane kontrolü
  if (trimmed.length !== 11) {
    return {
      code: "tckn-length",
      severity: "warning",
      message: "T.C. Kimlik Numarası 11 haneli olmalıdır.",
      kind: "format",
    };
  }

  // İlk rakam 0 olamaz
  if (trimmed[0] === "0") {
    return {
      code: "tckn-first-zero",
      severity: "warning",
      message: "T.C. Kimlik Numarası 0 ile başlayamaz.",
      kind: "format",
    };
  }

  const digits = trimmed.split("").map(Number);
  const d1 = digits[0];
  const d2 = digits[1];
  const d3 = digits[2];
  const d4 = digits[3];
  const d5 = digits[4];
  const d6 = digits[5];
  const d7 = digits[6];
  const d8 = digits[7];
  const d9 = digits[8];
  const d10 = digits[9];
  const d11 = digits[10];

  const oddSum = d1 + d3 + d5 + d7 + d9;
  const evenSum = d2 + d4 + d6 + d8;
  const calcD10 = (((7 * oddSum - evenSum) % 10) + 10) % 10;

  if (calcD10 !== d10) {
    return {
      code: "tckn-checksum",
      severity: "warning",
      message: "T.C. Kimlik Numarası kontrol basamakları tutarsız görünüyor.",
      kind: "format",
    };
  }

  const sum10 = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const calcD11 = sum10 % 10;

  if (calcD11 !== d11) {
    return {
      code: "tckn-checksum",
      severity: "warning",
      message: "T.C. Kimlik Numarası kontrol basamakları tutarsız görünüyor.",
      kind: "format",
    };
  }

  return null;
}

/**
 * Takvim Tarihi Doğrulama (F Tipi)
 *
 * Kurallar:
 * 1. GG.AA.YYYY veya GG/AA/YYYY veya GG-AA-YYYY biçimi
 * 2. new Date() yerine saf takvim aritmetiği ve artık yıl (leap year) kontrolü
 * 3. 29.02.2024 geçerli; 29.02.2025, 31.04.2026, 00.01.2026 uyarır
 * 4. Geçmiş/gelecek tarih kendiliğinden hata değildir.
 */
export function validateDate(value: string): FieldGuidanceResult | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  const match = trimmed.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (!match) {
    return {
      code: "date-format",
      severity: "warning",
      message: "Tarih GG.AA.YYYY biçiminde olmalıdır (ör. 01.05.2026).",
      kind: "format",
    };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) {
    return {
      code: "date-year-range",
      severity: "warning",
      message: "Yıl 1900 ile 2100 arasında olmalıdır.",
      kind: "format",
    };
  }

  if (month < 1 || month > 12) {
    return {
      code: "date-month-range",
      severity: "warning",
      message: "Ay 1 ile 12 arasında olmalıdır.",
      kind: "format",
    };
  }

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonths = [0, 31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDays = daysInMonths[month];

  if (day < 1 || day > maxDays) {
    if (month === 2 && day === 29 && !isLeapYear) {
      return {
        code: "date-leap-year",
        severity: "warning",
        message: `${year} artık yıl olmadığı için Şubat ayı 28 gündür.`,
        kind: "format",
      };
    }
    const monthNames = [
      "",
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];
    return {
      code: "date-day-range",
      severity: "warning",
      message: `${monthNames[month]} ayı ${maxDays} gündür; girilen gün (${day}) geçersizdir.`,
      kind: "format",
    };
  }

  return null;
}

/**
 * Telefon Numarası Doğrulama (T Tipi)
 *
 * Kurallar:
 * 1. 'Tel:', 'tel:', 'Telefon:', 'GSM:', '+90', boşluk ve parantez varyantlarını doğrulamada ayıklar.
 * 2. 10 haneli ulusal (5XX XXX XX XX), 11 haneli (05XX...) veya 12 haneli (+90 5XX...) biçimleri geçerlidir.
 * 3. Sabit hatlar da desteklenir.
 * 4. Sabit/cep operatörünü kesin doğrulama iddiası yapmaz.
 */
export function validatePhone(value: string): FieldGuidanceResult | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  const cleaned = trimmed.replace(/^(tel|telefon|gsm)\s*:\s*/i, "").trim();

  // Harf kontrolü
  if (/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(cleaned)) {
    return {
      code: "phone-invalid-characters",
      severity: "warning",
      message: "Telefon numarası harf içermemelidir.",
      kind: "format",
    };
  }

  const digitsOnly = cleaned.replace(/\D/g, "");

  const isValidLength =
    (digitsOnly.length === 10) ||
    (digitsOnly.length === 11 && digitsOnly.startsWith("0")) ||
    (digitsOnly.length === 12 && digitsOnly.startsWith("90"));

  if (!isValidLength || digitsOnly.length < 10 || digitsOnly.length > 12) {
    return {
      code: "phone-length",
      severity: "warning",
      message: "Telefon numarası 10 veya 11 haneli olmalıdır (ör. 05XX XXX XX XX).",
      kind: "format",
    };
  }

  return null;
}

/**
 * YİBF Numarası Doğrulama (Y Tipi)
 *
 * Kurallar:
 * 1. Yumuşak rehberlik sunar (info seviyesinde).
 * 2. 7 haneli sistem kodları tam geçerlidir.
 * 3. Boş, '-', '1234567', 'AB-123/45' değerleri silinmez veya kesilmez.
 */
export function validateYibf(value: string): FieldGuidanceResult | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  if (/^\d{7}$/.test(trimmed)) {
    return null;
  }

  return {
    code: "yibf-format-info",
    severity: "info",
    message: "YİBF numarası genellikle 7 haneli bir sistem kodudur.",
    kind: "format",
  };
}

/**
 * Para / Aylık Brüt Ücret Doğrulama (P Tipi)
 *
 * Kurallar:
 * 1. '40.000,00 TL', '40000', '40.000 TL', '40000,00' serbest ayrıştırma.
 * 2. Negatif değerler uyarır.
 * 3. Çoklu virgül/anlamsız ayraç uyarır.
 * 4. Otomatik kuruş hesabı veya sessiz düzeltme yapılmaz.
 */
export function validatePrice(value: string): FieldGuidanceResult | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") {
    return null;
  }

  if (trimmed.startsWith("-")) {
    return {
      code: "price-negative",
      severity: "warning",
      message: "Ücret tutarı negatif olamaz.",
      kind: "format",
    };
  }

  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount > 1) {
    return {
      code: "price-format",
      severity: "warning",
      message: "Ücret geçerli bir para tutarı biçiminde olmalıdır (ör. 40.000,00 TL).",
      kind: "format",
    };
  }

  if (!/\d/.test(trimmed)) {
    return {
      code: "price-no-digits",
      severity: "warning",
      message: "Ücret geçerli bir para tutarı biçiminde olmalıdır (ör. 40.000,00 TL).",
      kind: "format",
    };
  }

  return null;
}

/**
 * 56 Alan İçin Evrensel Alan Rehberlik Değerlendiricisi
 *
 * @param documentId Beş resmî stüdyo belgesinden biri
 * @param fieldKey İlgili belgedeki AcroForm alan anahtarı
 * @param rawValue Kullanıcının girdiği ham metin
 * @returns FieldGuidanceResult veya null (geçerli/uyarısız)
 */
export function getFieldGuidance(
  documentId: BelgeDocumentId,
  fieldKey: string,
  rawValue: string
): FieldGuidanceResult | null {
  const docFields = DOCUMENT_FIELD_POLICIES[documentId];
  if (!docFields) {
    return {
      code: "unknown-document",
      severity: "warning",
      message: `"${documentId}" kimlikli belge sözleşmede tanımlı değildir.`,
      kind: "format",
    };
  }

  const policy = (docFields as Record<string, FieldSemanticDefinition | undefined>)[fieldKey];
  if (!policy) {
    return {
      code: "unknown-field",
      severity: "warning",
      message: `"${fieldKey}" alanı "${documentId}" sözleşmesinde tanımlı değildir.`,
      kind: "format",
    };
  }

  switch (policy.type) {
    case "K":
      return validateTcKimlikNo(rawValue);
    case "F":
      return validateDate(rawValue);
    case "T":
      return validatePhone(rawValue);
    case "Y":
      return validateYibf(rawValue);
    case "P":
      return validatePrice(rawValue);
    case "N":
      // N alanları için format validasyonu yapılmaz (saf nominal metin serbesttir).
      return null;
    default:
      return null;
  }
}
