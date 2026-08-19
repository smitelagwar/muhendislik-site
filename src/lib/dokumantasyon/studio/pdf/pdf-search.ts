// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF DOKÜMAN İÇİ ANLIK ARAMA MOTORU
// ============================================================================

export interface PdfSearchMatch {
  pageNumber: number;
  matchIndexInPage: number;
  textSnippet: string;
}

export interface PdfSearchResult {
  query: string;
  totalMatches: number;
  matches: PdfSearchMatch[];
  pageMatchCounts: Record<number, number>;
}

/**
 * Türkçe karakter uyumlu normalizasyon
 */
export function normalizeTurkishText(str: string): string {
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .replace(/Ğ/g, "ğ")
    .replace(/Ü/g, "ü")
    .replace(/Ş/g, "ş")
    .replace(/Ö/g, "ö")
    .replace(/Ç/g, "ç")
    .toLowerCase()
    .trim();
}

/**
 * Tüm sayfalarda metin araması yapar ve eşleşme konumlarını indeksler
 */
export async function searchInPdfDocument(
  pdfDoc: any,
  query: string
): Promise<PdfSearchResult> {
  const normalizedQuery = normalizeTurkishText(query);
  if (!pdfDoc || !normalizedQuery) {
    return { query, totalMatches: 0, matches: [], pageMatchCounts: {} };
  }

  const matches: PdfSearchMatch[] = [];
  const pageMatchCounts: Record<number, number> = {};

  const numPages = pdfDoc.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");

      const normalizedPageText = normalizeTurkishText(pageText);
      let startIndex = 0;
      let countForPage = 0;

      while (startIndex < normalizedPageText.length) {
        const foundIdx = normalizedPageText.indexOf(normalizedQuery, startIndex);
        if (foundIdx === -1) break;

        const snippetStart = Math.max(0, foundIdx - 20);
        const snippetEnd = Math.min(pageText.length, foundIdx + normalizedQuery.length + 20);
        const snippet = pageText.substring(snippetStart, snippetEnd);

        matches.push({
          pageNumber: pageNum,
          matchIndexInPage: countForPage,
          textSnippet: snippet,
        });

        countForPage++;
        startIndex = foundIdx + normalizedQuery.length;
      }

      if (countForPage > 0) {
        pageMatchCounts[pageNum] = countForPage;
      }
    } catch (err) {
      console.warn(`Sayfa ${pageNum} arama hatası:`, err);
    }
  }

  return {
    query,
    totalMatches: matches.length,
    matches,
    pageMatchCounts,
  };
}
