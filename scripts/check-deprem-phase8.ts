import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_TOTAL = 175;
const EXPECTED_TARGET = 154;
const OLD_TOOL_PREFIX = "/deprem-yonetmelik/araclar/";
const GENERIC_COVER_PATTERNS = [/\/covers\/yonetmelik\.svg$/i, /placeholder/i, /generic/i, /default/i];
const BANNED_EDITORIAL_PHRASES = [
  "bu yazÄ±mÄ±zda",
  "gelin birlikte inceleyelim",
  "oldukÃ§a Ã¶nemlidir",
  "mÃ¼hendislerin dikkat etmesi gerekir",
];
const errors: string[] = [];
const warnings: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();
}

function duplicateGroups(entries: Array<{ slug: string; value: string }>) {
  const groups = new Map<string, string[]>();
  for (const entry of entries) {
    const key = normalize(entry.value);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), entry.slug]);
  }
  return [...groups.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([value, slugs]) => ({ value, slugs }));
}

function editorialParagra¶»§q«^