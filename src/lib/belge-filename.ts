// ============================================================================
// BELGE AKILLI DOSYA ADI ÇEKİRDEĞİ (STANDART DOSYA ADI SÖZLEŞMESİ)
// ============================================================================

export type SupportedBelgeDocId =
  | "beton-dokum-tutanagi"
  | "santiye-sefi-taahhutnamesi"
  | "santiye-sefi-istifa-dilekcesi"
  | "insaat-ruhsati-dilekcesi"
  | "santiye-sefi-sozlesmesi";

interface DocNamingConfig {
  prefix: string;
  nameField: string;
  dateField: string;
  isYibf?: boolean;
}

const DOC_NAMING_CONFIGS: Record<string, DocNamingConfig> = {
  "beton-dokum-tutanagi": {
    prefix: "Beton-Tutanagi",
    nameField: "yibf",
    dateField: "tarih",
    isYibf: true,
  },
  "santiye-sefi-taahhutnamesi": {
    prefix: "Taahhutname",
    nameField: "santiye_sefi_ad_soyad",
    dateField: "tarih",
  },
  "santiye-sefi-istifa-dilekcesi": {
    prefix: "Istifa-Dilekcesi",
    nameField: "ad_soyad",
    dateField: "tarih",
  },
  "insaat-ruhsati-dilekcesi": {
    prefix: "Ruhsat-Dilekcesi",
    nameField: "ad_soyad",
    dateField: "tarih",
  },
  "santiye-sefi-sozlesmesi": {
    prefix: "Hizmet-Sozlesmesi",
    nameField: "santiye_sefi_ad",
    dateField: "sozlesme_tarihi",
  },
};

/**
 * Türkçe harfleri ASCII Latin karşılıklarına dönüştürür.
 * İ/ı, ğ/Ğ, ü/Ü, ş/Ş, ö/Ö, ç/Ç dönüşümleri harf bazında korunur.
 */
export function turkishToAscii(str: string): string {
  return str
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Takvim geçerliliğini kontrol eder (artık yıllar ve ay gün sınırları dahil).
 */
export function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Europe/Istanbul saat diliminde YYYY-MM-DD tarih string'i döner.
 */
export function getIstanbulDateIso(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/**
 * GG.AA.YYYY, GG/AA/YYYY, GG-AA-YYYY veya YYYY-AA-GG (ve YYYY-MM-DD) tarih formatlarını ISO (YYYY-MM-DD)'ya çevirir.
 * Geçersiz, takvim dışı veya boş ise fallback olarak Europe/Istanbul'daki güncel/enjekte tarihi kullanır.
 */
export function parseBelgeDateToIso(rawDate: string | undefined | null, now: Date = new Date()): string {
  if (!rawDate || typeof rawDate !== "string") {
    return getIstanbulDateIso(now);
  }

  const trimmed = rawDate.trim();
  if (!trimmed) {
    return getIstanbulDateIso(now);
  }

  // 1. Format: GG.AA.YYYY, GG/AA/YYYY, GG-AA-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      const padM = String(month).padStart(2, "0");
      const padD = String(day).padStart(2, "0");
      return `${year}-${padM}-${padD}`;
    }
    return getIstanbulDateIso(now);
  }

  // 2. Format: YYYY-AA-GG, YYYY/AA/GG, YYYY.AA.GG
  const ymdMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (isValidCalendarDate(year, month, day)) {
      const padM = String(month).padStart(2, "0");
      const padD = String(day).padStart(2, "0");
      return `${year}-${padM}-${padD}`;
    }
    return getIstanbulDateIso(now);
  }

  // Tanınmayan format -> Europe/Istanbul fallback
  return getIstanbulDateIso(now);
}

/**
 * Ad veya tanımlayıcı parçasını temizler:
 * - Türkçe -> ASCII
 * - Kelimeler '-' ile birleştirilir
 * - Yalnızca alfanümerik ASCII ve '-' kalır
 * - En fazla 40 karakterle sınırlandırılır
 */
export function sanitizeBelgeNamePart(rawName: string | undefined | null, maxLen = 40): string {
  if (!rawName || typeof rawName !== "string") return "";

  // Uzantı benzeri sızıntıları temizle
  const withoutPdf = rawName.replace(/\.pdf$/i, "");
  const ascii = turkishToAscii(withoutPdf);

  // Alfanümerik kelimeleri çıkar
  const words = ascii.match(/[a-zA-Z0-9]+/g);
  if (!words || words.length === 0) return "";

  const joined = words.join("-");
  const sliced = joined.slice(0, maxLen).replace(/-+$/, "");
  return sliced;
}

/**
 * Şablonların varsayılan örnek kişi adını tespit eder.
 * Şablon kişi adı: "Hüseyin GÜNAYDIN"
 */
function isSamplePersonName(namePart: string): boolean {
  const normalized = namePart.toLowerCase();
  return normalized === "huseyin-gunaydin";
}

/**
 * Beton Döküm Tutanağı için YİBF değerini temizler ve formatlar:
 * "YIBF-1234567"
 */
export function formatYibfPart(rawYibf: string | undefined | null, maxLen = 40): string {
  if (!rawYibf || typeof rawYibf !== "string") return "";

  const ascii = turkishToAscii(rawYibf);
  // Kullanıcı zaten "YIBF" veya "YIBF-" yazmış olabilir
  const strippedPrefix = ascii.replace(/^yibf[-_\s]*/i, "");
  const clean = strippedPrefix.replace(/[^a-zA-Z0-9]/g, "");
  if (!clean) return "";

  const result = `YIBF-${clean}`.slice(0, maxLen).replace(/-+$/, "");
  return result;
}

/**
 * Beş belge tipi için akıllı PDF dosya adı üretir.
 *
 * Sözleşme:
 * - Taahhütname: Taahhutname_Ad-Soyad_YYYY-MM-DD.pdf
 * - İstifa Dilekçesi: Istifa-Dilekcesi_Ad-Soyad_YYYY-MM-DD.pdf
 * - İnşaat Ruhsatı: Ruhsat-Dilekcesi_Ad-Soyad_YYYY-MM-DD.pdf
 * - Hizmet Sözleşmesi: Hizmet-Sozlesmesi_Ad-Soyad_YYYY-MM-DD.pdf
 * - Beton Döküm: Beton-Tutanagi_YIBF-1234567_YYYY-MM-DD.pdf
 *
 * Ad boşsa veya örnek kişi adının aynısıysa ad parçası tamamen atlanır:
 * Taahhutname_YYYY-MM-DD.pdf
 *
 * Toplam uzunluk azami 100 karakterdir (.pdf dahil).
 */
export function buildBelgeFilename(
  documentId: string,
  values: Record<string, unknown> | object = {},
  now: Date = new Date()
): string {
  const config = DOC_NAMING_CONFIGS[documentId] || {
    prefix: sanitizeBelgeNamePart(documentId, 30) || "Belge",
    nameField: "ad_soyad",
    dateField: "tarih",
  };

  const valMap = values as Record<string, unknown>;
  const rawDate = typeof valMap[config.dateField] === "string" ? (valMap[config.dateField] as string) : undefined;
  const dateIso = parseBelgeDateToIso(rawDate, now);

  let middlePart = "";

  if (config.isYibf) {
    const rawYibf = typeof valMap[config.nameField] === "string" ? (valMap[config.nameField] as string) : undefined;
    middlePart = formatYibfPart(rawYibf, 40);
  } else {
    const rawName = typeof valMap[config.nameField] === "string" ? (valMap[config.nameField] as string) : undefined;
    const cleaned = sanitizeBelgeNamePart(rawName, 40);
    // Örnek kişi adı dosya adına taşınmaz
    if (cleaned && !isSamplePersonName(cleaned)) {
      middlePart = cleaned;
    }
  }

  const parts = [config.prefix];
  if (middlePart) {
    parts.push(middlePart);
  }
  parts.push(dateIso);

  const baseName = parts.join("_");
  const fullName = `${baseName}.pdf`;

  // Toplam 100 karakter sınırı (.pdf dahil = 96 karakter taban adı)
  if (fullName.length > 100) {
    const truncatedBase = baseName.slice(0, 96).replace(/[-_]+$/, "");
    return `${truncatedBase}.pdf`;
  }

  return fullName;
}
