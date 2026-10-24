// ============================================================================
// BELGELER PAYLAŞIM — GÜVENLİ İNDİRME İSTEMCİSİ (DOWNLOAD CLIENT V4)
// ============================================================================

import { sanitizePdfFilename } from "./document-labels";

const inFlightDownloads = new Set<string>();

export interface DownloadResult {
  ok: boolean;
  filename?: string;
  error?: string;
}

/**
 * Belirli bir paylaşım viewToken'ı için güvenli indirme URL'sini döndürür.
 * Her zaman aynı-origin authorized `?download=1` endpoint'ini hedefler.
 */
export function getSharedPdfDownloadUrl(viewToken: string): string {
  return `/api/belgeler/paylasim/${encodeURIComponent(viewToken)}/pdf?download=1`;
}

/**
 * Content-Disposition başlığından güvenli dosya adını ayıklar.
 */
export function parseContentDispositionFilename(header: string | null | undefined): string | null {
  if (!header) return null;

  // 1. filename* = UTF-8''encoded_name
  const starMatch = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (starMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(starMatch[1].trim());
      return sanitizePdfFilename(decoded);
    } catch {
      // Decode hatasında devam et
    }
  }

  // 2. filename = "quoted_name" veya filename = unquoted_name
  const match = /filename\s*=\s*(?:"([^"]+)"|([^;,\s]+))/i.exec(header);
  const raw = match?.[1] || match?.[2];
  if (raw) {
    return sanitizePdfFilename(raw.trim());
  }

  return null;
}

/**
 * Paylaşılan PDF belgesini istemci tarafında güvenle indirir.
 * - Çift indirme önleme (in-flight guard)
 * - 410 / 404 / 425 hata yakalama
 * - application/pdf içerik ve bayt boyutu denetimi (HTML/JSON hata gövdesi indirilmez)
 * - Güvenli dosya adı ve Blob URL yaşam döngüsü
 */
export async function downloadSharedPdf(
  viewToken: string,
  options?: { fallbackFilename?: string }
): Promise<DownloadResult> {
  if (!viewToken) {
    return { ok: false, error: "Geçersiz paylaşım belirteci." };
  }

  if (inFlightDownloads.has(viewToken)) {
    return { ok: false, error: "İndirme işlemi zaten devam ediyor." };
  }

  inFlightDownloads.add(viewToken);
  const downloadUrl = getSharedPdfDownloadUrl(viewToken);

  try {
    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });

    if (response.status === 410) {
      return {
        ok: false,
        error: "Bağlantının geçerlilik süresi dolmuş veya bağlantı iptal edilmiş.",
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        error: "Paylaşılan belge bulunamadı.",
      };
    }

    if (response.status === 425) {
      return {
        ok: false,
        error: "Belge henüz hazırlanıyor, lütfen birkaç saniye sonra tekrar deneyin.",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `Belge indirilemedi (HTTP ${response.status}).`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/pdf")) {
      return {
        ok: false,
        error: "Sunucudan geçerli bir PDF yanıtı alınamadı.",
      };
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return {
        ok: false,
        error: "İndirilen PDF dosyası boş.",
      };
    }

    const headerFilename = parseContentDispositionFilename(
      response.headers.get("content-disposition")
    );
    const resolvedFilename =
      headerFilename ||
      sanitizePdfFilename(options?.fallbackFilename || "Paylasilan-Belge.pdf");

    // Tarayıcı indirmesini tetikle
    if (typeof window !== "undefined") {
      try {
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = resolvedFilename;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // 60 saniye sonra bellek temizliği
        setTimeout(() => {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch {
            // sessizce geç
          }
        }, 60_000);
      } catch {
        // Blob URL desteklenmeyen kısıtlı ortamlarda doğrudan tarayıcı yönlendirmesi
        window.location.assign(downloadUrl);
      }
    }

    return { ok: true, filename: resolvedFilename };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "İndirme sırasında bir ağ hatası oluştu.";
    return { ok: false, error: message };
  } finally {
    inFlightDownloads.delete(viewToken);
  }
}
