// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF NAVIGATION UTILITIES (FAZ G)
// URL Güvenlik Doğrulaması, Hedef Çözümleme ve Gezinme Geçmişi
// ============================================================================

export interface NavigationHistoryEntry {
  page: number;
  scrollTop: number;
  timestamp?: number;
}

export interface OutlineItemNode {
  title: string;
  bold?: boolean;
  italic?: boolean;
  color?: Uint8ClampedArray;
  dest?: unknown;
  url?: string | null;
  items?: OutlineItemNode[];
}

/**
 * PDF dış bağlantı URL'sini güvenlik açısından doğrular.
 * Yalnızca http:, https: ve mailto: protokollerine izin verilir.
 * javascript:, data:, vbscript: vb. potansiyel XSS protokolleri reddedilir.
 */
export function isSafePdfUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  // Açıkça tehlikeli protokol öneklerini hemen engelle
  if (/^(?:javascript|data|vbscript|file):/i.test(trimmed)) {
    return false;
  }

  // Güvenli protokol desenini doğrula (http, https, mailto)
  try {
    // Relative URL kontrolü: Eğer göreli bir yol ise izin verme (harici bağlantı olmalı)
    const parsed = new URL(trimmed);
    const proto = parsed.protocol.toLowerCase();
    return proto === "http:" || proto === "https:" || proto === "mailto:";
  } catch {
    // URL parse edilemedi
    return false;
  }
}

/**
 * PDF.js dokümanı üzerinde verilen hedefi (named destination veya explicit array)
 * hedef sayfa numarasına (1-tabanlı) dönüştürür.
 */
export async function resolvePdfDestination(
  pdfDoc: unknown,
  dest: unknown
): Promise<number | null> {
  if (!pdfDoc || dest == null) return null;
  const doc = pdfDoc as {
    getDestination?: (name: string) => Promise<unknown>;
    getPageIndex?: (ref: unknown) => Promise<number>;
  };

  try {
    let explicitDest: unknown = dest;

    // 1. İsimlendirilmiş hedef ise (string): getDestination ile çöz
    if (typeof dest === "string" && typeof doc.getDestination === "function") {
      explicitDest = await doc.getDestination(dest);
    }

    if (!explicitDest) return null;

    // 2. Doğrudan sayfa indeksi sayısı ise:
    if (typeof explicitDest === "number") {
      return explicitDest + 1;
    }

    // 3. Explicit Dizi ise: [pageRef, { name: "XYZ" }, ... ]
    if (Array.isArray(explicitDest) && explicitDest.length > 0) {
      const pageRef = explicitDest[0];

      // Eğer dizi içindeki ilk eleman doğrudan bir sayı ise:
      if (typeof pageRef === "number") {
        return pageRef + 1;
      }

      // Eğer sayfa referans nesnesi ise: getPageIndex ile sayfa indeksini bul
      if (typeof pageRef === "object" && pageRef !== null) {
        if (typeof doc.getPageIndex === "function") {
          const pageIndex = await doc.getPageIndex(pageRef);
          if (typeof pageIndex === "number" && pageIndex >= 0) {
            return pageIndex + 1;
          }
        }
      }
    }
  } catch (err) {
    console.warn("[pdf-navigation] Hedef çözümlenemedi:", err);
  }

  return null;
}

/**
 * Sayfa etiketleri dizisi içinde arama yaparak girilen etikete ait sayfa numarasını döner (1-tabanlı).
 */
export function getPageFromLabel(
  labels: (string | null | undefined)[] | null | undefined,
  input: string
): number | null {
  if (!labels || !input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  const idx = labels.findIndex(
    (l) => l != null && l.trim().toLowerCase() === clean
  );
  return idx !== -1 ? idx + 1 : null;
}

/**
 * Gezinme geçmişine yeni konum ekler (aynı sayfa tekrarlarını önler, en fazla maxEntries tutar).
 */
export function pushNavigationHistory(
  stack: NavigationHistoryEntry[],
  newEntry: NavigationHistoryEntry,
  maxEntries = 10
): NavigationHistoryEntry[] {
  if (!newEntry || typeof newEntry.page !== "number" || newEntry.page <= 0) {
    return stack;
  }

  // Son kayıt ile aynı sayfaysa tekrar ekleme
  if (stack.length > 0 && stack[stack.length - 1].page === newEntry.page) {
    return stack;
  }

  const updated = [...stack, { ...newEntry, timestamp: Date.now() }];
  if (updated.length > maxEntries) {
    return updated.slice(updated.length - maxEntries);
  }
  return updated;
}
