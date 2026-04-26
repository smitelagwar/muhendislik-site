import { getArticleList } from "../src/lib/articles-data";
import {
  DEPREM_SERIES,
  getDepremSeriesIdForArticle,
  type DepremSeriesId,
} from "../src/lib/deprem-series";

const articles = getArticleList();
const depremArticles = articles.filter((article) => article.sectionId === "deprem-yonetmelik");

const structuralErrors: string[] = [];
const warnings: string[] = [];
const slugSeen = new Set<string>();

for (const article of depremArticles) {
  if (slugSeen.has(article.slug)) {
    structuralErrors.push(`Çift slug bulundu: ${article.slug}`);
  }
  slugSeen.add(article.slug);

  if (!article.category?.trim()) {
    structuralErrors.push(`Kategori eksik: ${article.slug}`);
  }

  if (!article.badgeLabel?.trim()) {
    structuralErrors.push(`Rozet eksik: ${article.slug}`);
  }

  if (!article.keywords || article.keywords.length === 0) {
    structuralErrors.push(`Etiket eksik: ${article.slug}`);
  }

  const mojibakeFields = [
    article.title,
    article.description,
    article.category,
    article.badgeLabel,
    article.author,
    article.authorTitle,
    ...(article.keywords ?? []),
  ];
  if (mojibakeFields.some((field) => /[ÃÄÅÂ�]/.test(field))) {
    warnings.push(`Bozuk karakter olasılığı: ${article.slug}`);
  }
}

const seriesCounts = new Map<DepremSeriesId, number>(
  DEPREM_SERIES.map((series) => [series.id, 0] as [DepremSeriesId, number]),
);
for (const article of depremArticles) {
  const seriesId = getDepremSeriesIdForArticle(article);
  seriesCounts.set(seriesId, (seriesCounts.get(seriesId) ?? 0) + 1);
}

for (const series of DEPREM_SERIES) {
  const count = seriesCounts.get(series.id) ?? 0;
  if (count === 0) {
    warnings.push(`Boş seri: ${series.label}`);
  }
}

if (warnings.length > 0) {
  console.warn("[deprem içerik kontrolü] Uyarılar:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (structuralErrors.length > 0) {
  console.error("[deprem içerik kontrolü] Hatalar:");
  for (const error of structuralErrors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`[deprem içerik kontrolü] ${depremArticles.length} makale kontrol edildi.`);
