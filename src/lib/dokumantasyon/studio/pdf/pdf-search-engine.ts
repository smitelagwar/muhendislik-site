// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SEARCH ENGINE (FAZ E)
// ============================================================================

export interface TextItemLike {
  str: string;
  hasEOL?: boolean;
}

export interface PageSearchIndex {
  pageNumber: number;
  text: string;                 // Orijinal birleştirilmiş metin
  folded: string;               // Arama için katlanmış metin
  toOrig: Int32Array;           // folded[i] -> text içindeki indeks
  items: { start: number; end: number; itemIndex: number }[];
}

export interface SearchMatch {
  pageNumber: number;
  start: number;                // text içinde [start, end)
  end: number;
  itemStartIndex: number;       // İlk kesişen textContent.items indeksi
  itemEndIndex: number;         // Son kesişen textContent.items indeksi
  snippet: { before: string; hit: string; after: string };
  matchIndexInPage: number;
  globalIndex: number;
}

export interface SearchOpts {
  caseSensitive?: boolean;
  matchDiacritics?: boolean;   // false (varsayılan) -> gevşek katlama (arastirma == araştırma), true -> yalnız büyük/küçük harf
  wholeWord?: boolean;
}

export interface SearchProgress {
  query: string;
  totalMatches: number;
  matches: SearchMatch[];
  pageMatchCounts: Record<number, number>;
  scannedPages: number;
  totalPages: number;
  isComplete: boolean;
  isScannedPdf?: boolean;
  overflow?: boolean;
}

/**
 * Türkçe karakter ve diakritik katlama (NFC normalizasyonu ve toOrig indeks eşleme tablosu)
 */
export function foldTurkish(
  input: string,
  opts?: { diacritics?: boolean; caseSensitive?: boolean }
): { folded: string; toOrig: Int32Array } {
  if (!input) {
    return { folded: "", toOrig: new Int32Array(0) };
  }

  // Standart Unicode NFC normalizasyonu (ayrık diakritikleri birleştirir)
  const normalized = input.normalize("NFC");
  const matchDiacritics = opts?.diacritics ?? false;
  const caseSensitive = opts?.caseSensitive ?? false;

  const toOrigArray: number[] = [];
  let folded = "";

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    // Satır sonu tire birleştirme: '-' karakterinden hemen sonra (veya boşluk/satır sonu sonrası) küçük harf geliyorsa
    // tire atlanır ve toOrig haritası bir sonraki karaktere bağlanır
    if (ch === "-") {
      const rest = normalized.slice(i + 1);
      const match = rest.match(/^(\s*)([a-zğüşıöç])/);
      if (match) {
        // Tire ve aradaki boşluk atlanır, kelime birleştirilir
        const skipLen = 1 + match[1].length;
        i += skipLen - 1; // loop increment ile tam match[2]'ye geçer
        continue;
      }
    }

    toOrigArray.push(i);

    if (caseSensitive) {
      if (!matchDiacritics) {
        // Gevşek diakritik ama case-sensitive
        switch (ch) {
          case "İ":
          case "I":
            folded += "I";
            break;
          case "ı":
          case "i":
            folded += "i";
            break;
          case "Ş":
            folded += "S";
            break;
          case "ş":
            folded += "s";
            break;
          case "Ğ":
            folded += "G";
            break;
          case "ğ":
            folded += "g";
            break;
          case "Ü":
            folded += "U";
            break;
          case "ü":
            folded += "u";
            break;
          case "Ö":
            folded += "O";
            break;
          case "ö":
            folded += "o";
            break;
          case "Ç":
            folded += "C";
            break;
          case "ç":
            folded += "c";
            break;
          default:
            folded += ch;
            break;
        }
      } else {
        folded += ch;
      }
      continue;
    }

    // Varsayılan: Case-insensitive
    if (matchDiacritics) {
      // Türkçe harflere duyarlı (I != İ), yalnız büyük/küçük harf katlanır
      switch (ch) {
        case "İ":
          folded += "i";
          break;
        case "I":
          folded += "ı";
          break;
        case "Ş":
          folded += "ş";
          break;
        case "Ğ":
          folded += "ğ";
          break;
        case "Ü":
          folded += "ü";
          break;
        case "Ö":
          folded += "ö";
          break;
        case "Ç":
          folded += "ç";
          break;
        default:
          folded += ch.toLowerCase();
          break;
      }
    } else {
      // Varsayılan Gevşek Katlama (Loose):
      // I, ı, İ, i -> i; Ş, ş -> s; Ğ, ğ -> g; Ü, ü -> u; Ö, ö -> o; Ç, ç -> c
      switch (ch) {
        case "İ":
        case "I":
        case "ı":
        case "i":
          folded += "i";
          break;
        case "Ş":
        case "ş":
          folded += "s";
          break;
        case "Ğ":
        case "ğ":
          folded += "g";
          break;
        case "Ü":
        case "ü":
          folded += "u";
          break;
        case "Ö":
        case "ö":
          folded += "o";
          break;
        case "Ç":
        case "ç":
          folded += "c";
          break;
        default:
          folded += ch.toLowerCase();
          break;
      }
    }
  }

  return {
    folded,
    toOrig: new Int32Array(toOrigArray),
  };
}

/**
 * Sayfadaki textContent.items öğelerinden birleştirilmiş metin ve arama indeksi üretir
 */
export function buildPageIndex(items: TextItemLike[], pageNumber: number): PageSearchIndex {
  let fullText = "";
  const itemMap: { start: number; end: number; itemIndex: number }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawStr = item.str || "";
    // NBSP -> normal boşluk
    const str = rawStr.replace(/\u00A0/g, " ");

    const start = fullText.length;
    fullText += str;
    const end = fullText.length;

    itemMap.push({ start, end, itemIndex: i });

    // Satır sonunda tire yoksa ve hasEOL varsa tek bir boşluk ekle
    const isHyphenated = str.endsWith("-") && i + 1 < items.length;
    if (item.hasEOL && !isHyphenated) {
      fullText += " ";
    }
  }

  // Varsayılan gevşek katlama ile indeks oluştur
  const { folded, toOrig } = foldTurkish(fullText, { diacritics: false, caseSensitive: false });

  return {
    pageNumber,
    text: fullText,
    folded,
    toOrig,
    items: itemMap,
  };
}

/**
 * Sayfa indeksinde verilen sorguyu arar (span sınırlarını aşan eşleşmeler dâhil)
 */
export function findInPage(
  index: PageSearchIndex,
  query: string,
  opts?: SearchOpts,
  startingGlobalIndex = 0
): SearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed || !index.folded) return [];

  const { folded: foldedQuery } = foldTurkish(trimmed, {
    diacritics: opts?.matchDiacritics ?? false,
    caseSensitive: opts?.caseSensitive ?? false,
  });

  if (!foldedQuery) return [];

  // Eğer sayfa varsayılan moddan farklı bir modda aranıyorsa geçici katlama yap
  let searchFolded = index.folded;
  let searchToOrig = index.toOrig;
  if (opts?.matchDiacritics || opts?.caseSensitive) {
    const custom = foldTurkish(index.text, {
      diacritics: opts?.matchDiacritics,
      caseSensitive: opts?.caseSensitive,
    });
    searchFolded = custom.folded;
    searchToOrig = custom.toOrig;
  }

  const matches: SearchMatch[] = [];
  const qLen = foldedQuery.length;
  let startIndex = 0;
  let matchIndexInPage = 0;

  const isWordBoundary = (idx: number, len: number) => {
    if (!opts?.wholeWord) return true;
    const prev = idx > 0 ? searchFolded[idx - 1] : " ";
    const next = idx + len < searchFolded.length ? searchFolded[idx + len] : " ";
    const isWordChar = (c: string) => /[a-z0-9_ğüşıöç]/i.test(c);
    return !isWordChar(prev) && !isWordChar(next);
  };

  while (startIndex < searchFolded.length) {
    const foundIdx = searchFolded.indexOf(foldedQuery, startIndex);
    if (foundIdx === -1) break;

    if (isWordBoundary(foundIdx, qLen)) {
      const origStart = searchToOrig[foundIdx];
      const origEnd = searchToOrig[foundIdx + qLen - 1] + 1;

      // Hangi span/item'larla kesiştiğini tespit et
      let itemStart = -1;
      let itemEnd = -1;
      for (let i = 0; i < index.items.length; i++) {
        const it = index.items[i];
        if (it.start < origEnd && it.end > origStart) {
          if (itemStart === -1) itemStart = it.itemIndex;
          itemEnd = it.itemIndex;
        }
      }

      if (itemStart === -1) itemStart = 0;
      if (itemEnd === -1) itemEnd = itemStart;

      const hit = index.text.slice(origStart, origEnd);
      const snippetStart = Math.max(0, origStart - 25);
      const snippetEnd = Math.min(index.text.length, origEnd + 25);
      const before = index.text.slice(snippetStart, origStart);
      const after = index.text.slice(origEnd, snippetEnd);

      matches.push({
        pageNumber: index.pageNumber,
        start: origStart,
        end: origEnd,
        itemStartIndex: itemStart,
        itemEndIndex: itemEnd,
        snippet: { before, hit, after },
        matchIndexInPage,
        globalIndex: startingGlobalIndex + matches.length,
      });

      matchIndexInPage++;
    }

    startIndex = foundIdx + qLen;
  }

  return matches;
}

// ----------------------------------------------------------------------------
// ARTIRIMLI VE KESİNTİSİZ BELGE GENELİ ARAMA MOTORU (INCREMENTAL ENGINE)
// ----------------------------------------------------------------------------

export class PageIndexCache {
  private cache = new Map<number, PageSearchIndex>();
  private readonly maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  get(pageNumber: number): PageSearchIndex | undefined {
    const item = this.cache.get(pageNumber);
    if (item) {
      // LRU: En son erişileni sona taşı
      this.cache.delete(pageNumber);
      this.cache.set(pageNumber, item);
    }
    return item;
  }

  set(pageNumber: number, index: PageSearchIndex) {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(pageNumber, index);
  }

  clear() {
    this.cache.clear();
  }
}

export const globalPageIndexCache = new PageIndexCache(50);

export interface PdfDocumentLike {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: unknown[] }>;
  }>;
}

/**
 * Belge geneli aramayı idle/setTimeout dilimleriyle artımlı yürüten oturum
 */
export async function searchPdfDocumentIncremental(
  pdfDoc: PdfDocumentLike | null | undefined,
  query: string,
  startPage: number,
  options: SearchOpts,
  signal: AbortSignal,
  onProgress: (progress: SearchProgress) => void,
  cache = globalPageIndexCache
): Promise<SearchProgress> {
  const trimmed = query.trim();
  const numPages = pdfDoc?.numPages || 0;

  const result: SearchProgress = {
    query: trimmed,
    totalMatches: 0,
    matches: [],
    pageMatchCounts: {},
    scannedPages: 0,
    totalPages: numPages,
    isComplete: false,
    isScannedPdf: false,
    overflow: false,
  };

  if (!pdfDoc || !trimmed || trimmed.length < 2 || numPages === 0) {
    result.isComplete = true;
    onProgress(result);
    return result;
  }

  // Tarama öncelik sırası: Görünür sayfadan başla, sona kadar git, sonra 1'den startPage-1'e dön
  const pageOrder: number[] = [];
  const safeStart = Math.min(Math.max(startPage, 1), numPages);
  for (let p = safeStart; p <= numPages; p++) pageOrder.push(p);
  for (let p = 1; p < safeStart; p++) pageOrder.push(p);

  let totalCharsInFirstPages = 0;
  const scannedPagesToCheck = Math.min(5, numPages);
  let checkedScannedPages = 0;

  const MAX_MATCHES = 2000;

  for (let i = 0; i < pageOrder.length; i++) {
    if (signal.aborted) break;

    const pageNum = pageOrder[i];

    try {
      let pageIndex = cache.get(pageNum);
      if (!pageIndex) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        pageIndex = buildPageIndex((textContent.items || []) as TextItemLike[], pageNum);
        cache.set(pageNum, pageIndex);
      }

      if (checkedScannedPages < scannedPagesToCheck) {
        totalCharsInFirstPages += pageIndex.text.trim().length;
        checkedScannedPages++;
        if (checkedScannedPages === scannedPagesToCheck && totalCharsInFirstPages === 0) {
          result.isScannedPdf = true;
        }
      }

      const pageMatches = findInPage(pageIndex, trimmed, options, result.matches.length);

      if (pageMatches.length > 0) {
        for (const m of pageMatches) {
          if (result.matches.length < MAX_MATCHES) {
            result.matches.push(m);
          } else {
            result.overflow = true;
            break;
          }
        }
        result.totalMatches = result.matches.length;
        result.pageMatchCounts[pageNum] = pageMatches.length;
      }

      result.scannedPages = i + 1;
      onProgress({ ...result });

      if (result.overflow) break;

      // Ana iş parçacığını serbest bırakmak ve UI donmasını önlemek için dilimleme
      if (i % 2 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } catch (err) {
      console.warn(`Sayfa ${pageNum} arama hatası:`, err);
    }
  }

  result.isComplete = !signal.aborted;
  onProgress({ ...result });
  return result;
}
