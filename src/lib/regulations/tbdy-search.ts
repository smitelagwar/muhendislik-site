import searchIndex from "../../../content/regulations/tbdy-2018/search-index.json";
import { normalizeSearchValue } from "@/lib/search-utils";
import { getTbdyChapterHref, tbdySectionSlug } from "./tbdy-reader";

type PageRecord = (typeof searchIndex.pages)[number];

export interface TbdySearchResult {
  chapter: number;
  pdfPage: number;
  printedPage: number;
  heading: string;
  excerpt: string;
  href: string;
  matchType: "madde" | "icerik";
}

export function searchTbdy(rawQuery: string, limit = 35): TbdySearchResult[] {
  const query = normalizeSearchValue(rawQuery).slice(0, 100);
  if (query.length < 2) return [];
  const exactClause = /^\d{1,2}(?:\.\d{1,2}){1,3}$/.test(query);
  const found: Array<TbdySearchResult & { rank: number }> = [];

  for (const page of searchIndex.pages as PageRecord[]) {
    const matchingClause = page.clauses.find((item) => {
      const clause = normalizeSearchValue(item.id);
      const title = normalizeSearchValue(item.title);
      return exactClause ? clause === query : title.includes(query);
    });
    const contentMatches = page.normalizedText.includes(query);
    if (!matchingClause && !contentMatches) continue;

    const slug = tbdySectionSlug(page.chapter);
    const anchor = matchingClause ? `madde-${matchingClause.id.replace(/\./g, "-")}` : `pdf-page-${page.pdfPage}`;
    found.push({
      chapter: page.chapter,
      pdfPage: page.pdfPage,
      printedPage: page.printedPage,
      heading: matchingClause?.title ?? `Bölüm ${page.chapter} · PDF sayfa ${page.pdfPage}`,
      excerpt: page.preview.slice(0, 245),
      href: `${getTbdyChapterHref(slug)}#${anchor}`,
      matchType: matchingClause ? "madde" : "icerik",
      rank: matchingClause ? (exactClause ? 110 : 95) : 20,
    });
  }
  return found
    .sort((a, b) => b.rank - a.rank || a.pdfPage - b.pdfPage)
    .slice(0, Math.max(1, Math.min(limit, 50)))
    .map(({ rank: _rank, ...result }) => result);
}
