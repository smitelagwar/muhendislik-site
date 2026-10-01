// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF METİN VE KARAKTER ONARIM MOTORU (FAZ R3)
// ============================================================================

export interface MappingRule {
  from: string;
  to: string;
}

/**
 * Belgedeki ToUnicode CMap bozukluk imzasını saptar.
 * İmza: İlk 3 sayfa veya örnek metinde U+011C ('Ĝ') oranı >= %1.0 VE ASCII 'i' oranı < %0.5
 * (Türkçe dilde 'i' sıklığı yaklaşık %8'dir. Eğer 'i' yerine font glyph 'Ĝ' koduna bağlanmışsa
 * metinde hiç veya neredeyse hiç 'i' bulunmazken yüksek oranda 'Ĝ' bulunur).
 */
export function detectBrokenMapping(sampleText: string): MappingRule[] {
  if (!sampleText || sampleText.length < 50) {
    return [];
  }

  let totalChars = 0;
  let gCount = 0;
  let iCount = 0;

  for (let idx = 0; idx < sampleText.length; idx++) {
    const ch = sampleText[idx];
    if (ch.trim()) {
      totalChars++;
      if (ch === "\u011c") gCount++; // Ĝ
      if (ch === "i") iCount++;
    }
  }

  if (totalChars < 50) return [];

  const gRatio = (gCount / totalChars) * 100;
  const iRatio = (iCount / totalChars) * 100;

  // Bozuk ToUnicode İmza Kuralı (Durum B):
  // Ĝ >= %1.0 VE i < %0.5
  if (gRatio >= 1.0 && iRatio < 0.5) {
    return [
      {
        from: "\u011c",
        to: "i",
      },
    ];
  }

  return [];
}

/**
 * Çıkarılan veya kopyalanan metindeki bozuk karakterleri 1:1 onarır.
 * 1:1 karakter onarımı sayesinde:
 * - Metin uzunluğu (length) ASLA değişmez.
 * - Karakter ofsetleri ve arama indeksi span sınırları ile 100% senkron kalır.
 */
export function repairExtractedText(text: string, rules?: MappingRule[]): string {
  if (!text) return "";
  const effectiveRules = rules && rules.length > 0 ? rules : [];
  if (effectiveRules.length === 0) return text;

  let result = text;
  for (const rule of effectiveRules) {
    if (rule.from && rule.to) {
      result = result.replaceAll(rule.from, rule.to);
    }
  }

  return result;
}

/**
 * PDF.js dokümanının ilk sayfalarından örnek metin çekerek bozuk harf eşlemesini tespit eder
 */
export async function detectBrokenMappingFromDoc(
  pdfDoc: { numPages: number; getPage(n: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }> } | null | undefined
): Promise<MappingRule[]> {
  if (!pdfDoc || typeof pdfDoc.getPage !== "function") return [];

  try {
    let sampleText = "";
    const pagesToCheck = Math.min(pdfDoc.numPages || 1, 3);
    for (let p = 1; p <= pagesToCheck; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      for (const item of (textContent.items || []) as { str?: string }[]) {
        if (typeof item.str === "string") {
          sampleText += item.str + " ";
        }
      }
      if (sampleText.length > 3000) break;
    }

    return detectBrokenMapping(sampleText);
  } catch (err) {
    console.warn("[pdf-text-repair] Bozuk harf eşleme tespiti başarısız:", err);
    return [];
  }
}
