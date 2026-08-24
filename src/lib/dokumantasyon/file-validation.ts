// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOSYA İÇERİĞİ VE SİGNETÜR (MAGIC-BYTE) DOĞRULAMA
// ============================================================================

import { normalizeExtension, getDefaultMimeType } from "./preview-capabilities";

export interface ValidationResult {
  isValid: boolean;
  detectedMime: string;
  errorMessage?: string;
}

/**
 * Dosyanın ilk byte'larını inceleyerek uzantı ve içerik eşleşmesini doğrular
 */
export function validateFileContent(
  headerBuffer: Buffer | Uint8Array,
  filenameOrExt: string
): ValidationResult {
  const ext = normalizeExtension(
    filenameOrExt.includes(".") ? filenameOrExt.slice(filenameOrExt.lastIndexOf(".")) : filenameOrExt
  );
  const len = headerBuffer.length;

  if (len === 0) {
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Dosya içeriği boş.",
    };
  }

  // 1. PDF Doğrulaması (%PDF-)
  if (ext === ".pdf") {
    if (len >= 5) {
      const isPdf =
        headerBuffer[0] === 0x25 && // %
        headerBuffer[1] === 0x50 && // P
        headerBuffer[2] === 0x44 && // D
        headerBuffer[3] === 0x46 && // F
        headerBuffer[4] === 0x2d;   // -

      if (isPdf) {
        return { isValid: true, detectedMime: "application/pdf" };
      }
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz PDF dosya yapısı (%PDF- başlığı bulunamadı).",
    };
  }

  // 2. JPEG Doğrulaması (FF D8 FF)
  if (ext === ".jpg" || ext === ".jpeg") {
    if (len >= 3 && headerBuffer[0] === 0xff && headerBuffer[1] === 0xd8 && headerBuffer[2] === 0xff) {
      return { isValid: true, detectedMime: "image/jpeg" };
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz JPEG görsel yapısı.",
    };
  }

  // 3. PNG Doğrulaması (89 50 4E 47 0D 0A 1A 0A)
  if (ext === ".png") {
    if (
      len >= 8 &&
      headerBuffer[0] === 0x89 &&
      headerBuffer[1] === 0x50 &&
      headerBuffer[2] === 0x4e &&
      headerBuffer[3] === 0x47 &&
      headerBuffer[4] === 0x0d &&
      headerBuffer[5] === 0x0a &&
      headerBuffer[6] === 0x1a &&
      headerBuffer[7] === 0x0a
    ) {
      return { isValid: true, detectedMime: "image/png" };
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz PNG görsel yapısı.",
    };
  }

  // 4. WEBP Doğrulaması (RIFF .... WEBP)
  if (ext === ".webp") {
    if (len >= 12) {
      const isRiff =
        headerBuffer[0] === 0x52 && // R
        headerBuffer[1] === 0x49 && // I
        headerBuffer[2] === 0x46 && // F
        headerBuffer[3] === 0x46;   // F

      const isWebp =
        headerBuffer[8] === 0x57 && // W
        headerBuffer[9] === 0x45 && // E
        headerBuffer[10] === 0x42 && // B
        headerBuffer[11] === 0x50;  // P

      if (isRiff && isWebp) {
        return { isValid: true, detectedMime: "image/webp" };
      }
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz WEBP görsel yapısı.",
    };
  }

  // 5. AutoCAD DWG Doğrulaması (AC10xx başlığı)
  if (ext === ".dwg") {
    if (len >= 6) {
      const headerStr = Buffer.from(headerBuffer.slice(0, 6)).toString("ascii");
      if (headerStr.startsWith("AC10")) {
        return { isValid: true, detectedMime: "application/acad" };
      }
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz AutoCAD DWG dosya yapısı (AC10xx başlığı eksik).",
    };
  }

  // 6. DXF Doğrulaması (ASCII SECTION / 0 veya Binary DXF)
  if (ext === ".dxf") {
    const textSample = Buffer.from(headerBuffer.slice(0, Math.min(len, 256))).toString("ascii");
    if (
      textSample.includes("SECTION") ||
      textSample.includes("AutoCAD Binary DXF") ||
      textSample.startsWith("0\n") ||
      textSample.startsWith("0\r\n")
    ) {
      return { isValid: true, detectedMime: "application/dxf" };
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz DXF CAD format yapısı.",
    };
  }

  // 7. Autodesk DWF Doğrulaması ((DWF Vxx.xx) başlığı)
  if (ext === ".dwf") {
    if (len >= 6) {
      const headerStr = Buffer.from(headerBuffer.slice(0, Math.min(len, 32))).toString("ascii");
      if (headerStr.startsWith("(DWF V")) {
        return { isValid: true, detectedMime: "model/vnd.dwf" };
      }
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: "Geçersiz Autodesk DWF dosya yapısı ((DWF V...) başlığı eksik).",
    };
  }

  // 8. ZIP / DOCX / XLSX Doğrulaması (PK 03 04)
  if (ext === ".zip" || ext === ".docx" || ext === ".xlsx") {
    if (
      len >= 4 &&
      headerBuffer[0] === 0x50 && // P
      headerBuffer[1] === 0x4b && // K
      (headerBuffer[2] === 0x03 || headerBuffer[2] === 0x05 || headerBuffer[2] === 0x07)
    ) {
      return { isValid: true, detectedMime: getDefaultMimeType(ext) };
    }
    return {
      isValid: false,
      detectedMime: "application/octet-stream",
      errorMessage: `Geçersiz ${ext.toUpperCase()} paket yapısı.`,
    };
  }

  // 9. Düz Metin / Markdown / JSON / CSV / YAML Doğrulaması
  if (
    ext === ".txt" ||
    ext === ".md" ||
    ext === ".json" ||
    ext === ".csv" ||
    ext === ".log" ||
    ext === ".yml" ||
    ext === ".yaml"
  ) {
    // Binary NUL byte (0x00) kontrolü — Metin dosyalarında NUL bayt bulunamaz
    for (let i = 0; i < Math.min(len, 512); i++) {
      if (headerBuffer[i] === 0x00) {
        return {
          isValid: false,
          detectedMime: "application/octet-stream",
          errorMessage: "Metin dosyası içinde geçersiz ikili (binary NUL) karakter tespit edildi.",
        };
      }
    }

    // JSON spesifik syntax ön kontrolü
    if (ext === ".json") {
      const textSample = Buffer.from(headerBuffer.slice(0, Math.min(len, 1024))).toString("utf8").trim();
      if (!textSample.startsWith("{") && !textSample.startsWith("[")) {
        return {
          isValid: false,
          detectedMime: "application/json",
          errorMessage: "Geçersiz JSON formatı ({ veya [ ile başlamalıdır).",
        };
      }
    }

    return { isValid: true, detectedMime: getDefaultMimeType(ext) };
  }

  // 10. Diğer Desteklenen Uzantılar İçin Genel Kontrol
  return {
    isValid: true,
    detectedMime: getDefaultMimeType(ext),
  };
}
