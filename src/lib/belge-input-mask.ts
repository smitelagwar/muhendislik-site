/**
 * Belge Stüdyosu — Akıllı Telefon & Tarih Maskeleme Fonksiyonları
 *
 * Kurallar:
 * 1. Telefon: 05XX XXX XX XX (11 hane) biçiminde otomatik boşluklama.
 * 2. Tarih: GG.AA.YYYY (8 hane) biçiminde otomatik noktalama.
 * 3. Boş ve '-' nötr değerlerini korur.
 * 4. Kullanıcı deneyimini bozmaz (Backspace tuzağı yoktur).
 * 5. Saf fonksiyondur: Sıfır DOM bağımlılığı, deterministik ve test edilebilir.
 */

export interface MaskPhoneOptions {
  /** İnşaat Ruhsatı için "Tel: 05XX XXX XX XX" formatı */
  hasTelPrefix?: boolean;
}

/**
 * Telefon numarasını "05XX XXX XX XX" (veya opsiyonel "Tel: 05XX XXX XX XX") formatına maskeler.
 */
export function maskPhone(raw: string, options?: MaskPhoneOptions): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") {
    return trimmed;
  }

  // "Tel:", "telefon:", "gsm:" gibi olası önekleri ayıkla
  const cleaned = trimmed.replace(/^(tel|telefon|gsm)\s*:\s*/i, "");

  // Yalnızca rakamları al
  let digits = cleaned.replace(/\D/g, "");

  // +90 veya 90 ile yapıştırıldıysa baştaki 90'ı 0'a çevir
  if (digits.startsWith("90") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("5") && digits.length >= 10) {
    // 5XX... (10 hane) olarak girildiyse başına 0 ekle
    digits = "0" + digits;
  }

  // Maksimum 11 rakam (05XX XXX XX XX)
  digits = digits.slice(0, 11);

  if (!digits) {
    return "";
  }

  let formatted = "";
  if (digits.length <= 4) {
    formatted = digits;
  } else if (digits.length <= 7) {
    formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`;
  } else if (digits.length <= 9) {
    formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  } else {
    formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
  }

  if (options?.hasTelPrefix && formatted) {
    return `Tel: ${formatted}`;
  }

  return formatted;
}

/**
 * Takvim tarihini "GG.AA.YYYY" biçiminde maskeler.
 */
export function maskDate(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") {
    return trimmed;
  }

  // Kullanıcı "1." veya "5/" gibi tek haneden sonra ayraç girdiyse başına 0 ekle ("01.")
  let normalized = raw;
  if (/^\d[./\-]/.test(normalized)) {
    normalized = "0" + normalized;
  }
  // Ay için tek haneden sonra ayraç girildiyse (ör. "01.5.") başına 0 ekle ("01.05.")
  if (/^\d{2}[./\-]\d[./\-]/.test(normalized)) {
    const parts = normalized.split(/[./\-]/);
    if (parts[1] && parts[1].length === 1) {
      normalized = `${parts[0]}.0${parts[1]}.${parts.slice(2).join(".")}`;
    }
  }

  const digits = normalized.replace(/\D/g, "").slice(0, 8);
  if (!digits) {
    return "";
  }

  const hasExplicitFirstDot = /^\d{2}[./\-]/.test(normalized);
  const hasExplicitSecondDot = /^\d{2}[./\-]\d{2}[./\-]/.test(normalized);

  if (digits.length <= 2) {
    return hasExplicitFirstDot && digits.length === 2 ? `${digits}.` : digits;
  }

  const day = digits.slice(0, 2);

  if (digits.length <= 4) {
    const month = digits.slice(2);
    const trailingDot = hasExplicitSecondDot && digits.length === 4 ? "." : "";
    return `${day}.${month}${trailingDot}`;
  }

  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return `${day}.${month}.${year}`;
}
