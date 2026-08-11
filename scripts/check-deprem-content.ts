import { getArticleList } from "../src/lib/articles-data";
import {
  DEPREM_SERIES,
  getDepremSeriesIdForArticle,
  type DepremSeriesId,
} from "../src/lib/deprem-series";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";

const articles = getArticleList();
const depremArticles = articles.filter((article) => article.sectionId === "deprem-yonetmelik");

const structuralErrors: string[] = [];
const warnings: string[] = [];
const slugSeen = new Set<string>();
const allSlugs = new Set(articles.map((article) => article.slug));

if (depremArticles.length !== 164) {
  structuralErrors.push(`Deprem içerik sayısı 164 olmalı; bulunan: ${depremArticles.length}`);
}

if (DEPREM_TOPIC_ARTICLES.length !== 64) {
  structuralErrors.push(`Yeni deprem konu sayısı 64 olmalı; bulunan: ${DEPREM_TOPIC_ARTICLES.length}`);
}

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

  if (!article.seriesId) {
    structuralErrors.push(`Açık seri eşlemesi eksik: ${article.slug}`);
  }

  for (const relatedSlug of article.relatedSlugs) {
    if (!allSlugs.has(relatedSlug)) {
      structuralErrors.push(`Geçersiz ilişkili içerik: ${article.slug} -> ${relatedSlug}`);
    }
  }

  const mojibakeFields = [
    article.title,
    article.description,
    article.category,
    article.badgeLabel,
    article.author,
    article.authorTitle,
    ...(article.keywords ?? []),
    ...article.sections.flatMap((section) => [section.title, section.content]),
  ];
  if (mojibakeFields.some((field) => /[ÃÄÅÂ�]|\p{L}\?\p{L}/u.test(field))) {
    structuralErrors.push(`Bozuk karakter olasılığı: ${article.slug}`);
  }
}

for (const article of DEPREM_TOPIC_ARTICLES) {
  if (!article.references?.some((reference) => reference.href?.startsWith("https://"))) {
    structuralErrors.push(`Yeni içerikte resmî kaynak eksik: ${article.slug}`);
  }
  if (article.sections.length < 3) {
    structuralErrors.push(`Yeni içerikte bölüm sayısı yetersiz: ${article.slug}`);
  }
}

const draftArticle = depremArticles.find((article) => article.slug === "tbdy-uygulama-esaslari-taslak-statusu");
if (draftArticle?.regulationStatus !== "draft" || !draftArticle.badgeLabel.toLocaleLowerCase("tr-TR").includes("taslak")) {
  structuralErrors.push("TBDY uygulama esasları taslak içeriği açık biçimde taslak olarak işaretlenmeli.");
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
    structuralErrors.push(`Boş seri: ${series.label}`);
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
