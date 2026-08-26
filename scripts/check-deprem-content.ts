import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import {
  DEPREM_SERIES,
  getDepremSeriesIdForArticle,
  type DepremSeriesId,
} from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_TOTAL = 164;
const EXPECTED_TOPIC_COUNT = 56;
const EXPECTED_TS500_COUNT = 21;
const EXPECTED_TARGET_COUNT = 143;
const OLD_TOOL_ROUTE = "/deprem-yonetmelik/araclar/";
const GENERIC_COVER_PATTERNS = [/\/covers\/yonetmelik\.svg$/i, /placeholder/i, /generic/i, /default/i];

const EXPECTED_SERIES_COUNTS: Record<DepremSeriesId, number> = {
  tbdy: 36,
  "tbdy-betonarme": 22,
  ts500: 21,
  "mevcut-guclendirme": 13,
  "yapi-denetimi": 8,
  yangin: 10,
  otopark: 5,
  imar: 9,
  bep: 6,
  "su-zemin": 11,
  engelsiz: 4,
  eurocode: 5,
  akustik: 1,
  asansor: 4,
  isg: 5,
  cevre: 4,
};

const articles = getArticleList();
const depremArticles = articles.filter((article) => article.sectionId === "deprem-yonetmelik");
const targetArticles = depremArticles.filter((article) => !TS500_SLUGS.has(article.slug));
const structuralErrors: string[] = [];
const warnings: string[] = [];
const allSlugs = new Set(articles.map((article) => article.slug));
const validToolHrefs = new Set(TOOLS.map((tool) => tool.href));

function summarize(label: string, slugs: string[]) {
  if (slugs.length === 0) return;
  structuralErrors.push(`${label}: ${slugs.length} makale (${slugs.slice(0, 12).join(", ")}${slugs.length > 12 ? ", ..." : ""})`);
}

function isGenericCover(image: string) {
  return GENERIC_COVER_PATTERNS.some((pattern) => pattern.test(image));
}

function walkSourceFiles(dir: string): string[] {
  const absolute = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(absolute)) return [];

  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) return walkSourceFiles(relative);
    return /\.(?:ts|tsx|js|jsx|mjs|md|json)$/.test(entry.name) ? [relative] : [];
  });
}

if (depremArticles.length !== EXPECTED_TOTAL) {
  structuralErrors.push(`Deprem içerik sayısı ${EXPECTED_TOTAL} olmalı; bulunan: ${depremArticles.length}`);
}
if (DEPREM_TOPIC_ARTICLES.length !== EXPECTED_TOPIC_COUNT) {
  structuralErrors.push(`Deprem konu makalesi sayısı ${EXPECTED_TOPIC_COUNT} olmalı; bulunan: ${DEPREM_TOPIC_ARTICLES.length}`);
}
if ([...TS500_SLUGS].filter((slug) => depremArticles.some((article) => article.slug === slug)).length !== EXPECTED_TS500_COUNT) {
  structuralErrors.push(`Etkin TS 500 makale sayısı ${EXPECTED_TS500_COUNT} olmalı.`);
}
if (targetArticles.length !== EXPECTED_TARGET_COUNT) {
  structuralErrors.push(`TS 500 dışı hedef makale sayısı ${EXPECTED_TARGET_COUNT} olmalı; bulunan: ${targetArticles.length}`);
}

const slugSeen = new Set<string>();
const authorMismatch: string[] = [];
const monogramMismatch: string[] = [];
const duplicateCredential: string[] = [];
const referenceMissing: string[] = [];
const genericCover: string[] = [];
const belowTwoVisuals: string[] = [];
const imageAltMissing: string[] = [];
const imageCaptionMissing: string[] = [];
const formulaSemanticErrors: string[] = [];
const placeholderContent: string[] = [];
const sectionStructureErrors: string[] = [];
const relatedStructureErrors: string[] = [];

const coverToSlugs = new Map<string, string[]>();

for (const article of depremArticles) {
  if (slugSeen.has(article.slug)) structuralErrors.push(`Çift slug bulundu: ${article.slug}`);
  slugSeen.add(article.slug);

  if (!article.category?.trim()) structuralErrors.push(`Kategori eksik: ${article.slug}`);
  if (!article.badgeLabel?.trim()) structuralErrors.push(`Rozet eksik: ${article.slug}`);
  if (!article.keywords?.length) structuralErrors.push(`Etiket eksik: ${article.slug}`);
  if (!article.seriesId) structuralErrors.push(`Açık seri eşlemesi eksik: ${article.slug}`);
  if (!article.readTime?.trim()) structuralErrors.push(`Okuma süresi eksik: ${article.slug}`);

  if (article.author !== DEPREM_CONTENT_AUTHOR.name) authorMismatch.push(article.slug);
  const authorPresentation = getArticleAuthorPresentation(article);
  if (authorPresentation.monogram !== DEPREM_CONTENT_AUTHOR.monogram) monogramMismatch.push(article.slug);
  if (article.authorTitle.trim() && article.author.toLocaleLowerCase("tr-TR").startsWith(article.authorTitle.trim().toLocaleLowerCase("tr-TR"))) {
    duplicateCredential.push(article.slug);
  }

  const relatedSeen = new Set<string>();
  for (const relatedSlug of article.relatedSlugs) {
    if (!allSlugs.has(relatedSlug)) structuralErrors.push(`Geçersiz ilişkili içerik: ${article.slug} -> ${relatedSlug}`);
    if (relatedSlug === article.slug || relatedSeen.has(relatedSlug)) relatedStructureErrors.push(article.slug);
    relatedSeen.add(relatedSlug);
  }

  const sectionIds = new Set<string>();
  const sectionTitles = new Set<string>();
  for (const section of article.sections) {
    const normalizedTitle = section.title.trim().toLocaleLowerCase("tr-TR");
    if (!section.id.trim() || !section.title.trim() || !section.content.trim() || sectionIds.has(section.id) || sectionTitles.has(normalizedTitle)) {
      sectionStructureErrors.push(article.slug);
    }
    sectionIds.add(section.id);
    sectionTitles.add(normalizedTitle);
    if (/\b(?:TODO|TBD|LOREM IPSUM)\b|\[(?:SOURCE|SOURCES|ARTICLE|LINKS|KAYNAK)\]/i.test(section.content)) {
      placeholderContent.push(article.slug);
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

  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  for (const block of blocks) {
    if (!TS500_SLUGS.has(article.slug) && block.type === "image") {
      if (!block.src.trim() || !block.alt.trim()) imageAltMissing.push(article.slug);
      if (!block.caption.trim()) imageCaptionMissing.push(article.slug);
    }
    if (block.type === "formula") {
      if (!block.expression.trim() || block.symbols.length === 0 || block.symbols.some((item) => !item.symbol.trim() || !item.description.trim() || !item.unit.trim())) {
        formulaSemanticErrors.push(article.slug);
      }
    }
  }

  if (!TS500_SLUGS.has(article.slug)) {
    const bodyImageCount = blocks.filter((block) => block.type === "image" && block.src.trim()).length;
    const coverIsGeneric = isGenericCover(article.image);
    const realVisualCount = (article.image.trim() && !coverIsGeneric ? 1 : 0) + bodyImageCount;
    if (coverIsGeneric) genericCover.push(article.slug);
    if (realVisualCount < 2) belowTwoVisuals.push(article.slug);
    if (!article.references?.length) referenceMissing.push(article.slug);

    const coverSlugs = coverToSlugs.get(article.image) ?? [];
    coverSlugs.push(article.slug);
    coverToSlugs.set(article.image, coverSlugs);
  }
}

summarize("Canonical author eşleşmiyor", [...new Set(authorMismatch)]);
summarize("HG monogram eşleşmiyor", [...new Set(monogramMismatch)]);
summarize("Yazar unvanı iki kez görünme riski", [...new Set(duplicateCredential)]);
summarize("TS 500 dışı makalede reference eksik", [...new Set(referenceMissing)]);
summarize("TS 500 dışı makalede generic cover", [...new Set(genericCover)]);
summarize("TS 500 dışı makalede iki gerçek görsel standardı sağlanmıyor", [...new Set(belowTwoVisuals)]);
summarize("Makale içi görsel alt metni eksik", [...new Set(imageAltMissing)]);
summarize("Makale içi görsel caption eksik", [...new Set(imageCaptionMissing)]);
summarize("Formula sembol/birim semantiği eksik", [...new Set(formulaSemanticErrors)]);
summarize("Placeholder/taslak token bulundu", [...new Set(placeholderContent)]);
summarize("Section kimliği/başlığı/içeriği yapısal olarak sorunlu", [...new Set(sectionStructureErrors)]);
summarize("Related slug kendi kendine veya tekrar ediyor", [...new Set(relatedStructureErrors)]);

const reusedTargetCovers = [...coverToSlugs.entries()].filter(([image, slugs]) => image.trim() && !isGenericCover(image) && slugs.length > 1);
if (reusedTargetCovers.length > 0) {
  structuralErrors.push(`TS 500 dışı benzersiz cover kuralı ihlali: ${reusedTargetCovers.length} tekrar kullanılan cover.`);
}

const seriesCounts = new Map<DepremSeriesId, number>(
  DEPREM_SERIES.map((series) => [series.id, 0] as [DepremSeriesId, number]),
);
for (const article of depremArticles) {
  const seriesId = getDepremSeriesIdForArticle(article);
  seriesCounts.set(seriesId, (seriesCounts.get(seriesId) ?? 0) + 1);
}
for (const series of DEPREM_SERIES) {
  const actual = seriesCounts.get(series.id) ?? 0;
  const expected = EXPECTED_SERIES_COUNTS[series.id];
  if (actual !== expected) structuralErrors.push(`${series.id} seri sayısı ${expected} olmalı; bulunan: ${actual}`);
  if (series.relatedToolHref && !validToolHrefs.has(series.relatedToolHref)) {
    structuralErrors.push(`Seri CTA gerçek araç rotası değil: ${series.id} -> ${series.relatedToolHref}`);
  }
}

const draftArticle = depremArticles.find((article) => article.slug === "tbdy-uygulama-esaslari-taslak-statusu");
if (draftArticle?.regulationStatus !== "draft" || !draftArticle.badgeLabel.toLocaleLowerCase("tr-TR").includes("taslak")) {
  structuralErrors.push("TBDY uygulama esasları taslak içeriği açık biçimde taslak olarak işaretlenmeli.");
}

const oldRouteSourceHits = walkSourceFiles("src")
  .flatMap((file) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8").split("\n").map((line, index) => ({ file, line: index + 1, text: line.trim() })))
  .filter((hit) => hit.text.includes(OLD_TOOL_ROUTE));
if (oldRouteSourceHits.length > 0) {
  structuralErrors.push(`Eski araç route kalıbı kaldı: ${oldRouteSourceHits.slice(0, 8).map((hit) => `${hit.file}:${hit.line}`).join(", ")}`);
}

if (warnings.length > 0) {
  console.warn("[deprem içerik kontrolü] Uyarılar:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (structuralErrors.length > 0) {
  console.error("[deprem içerik kontrolü] Hatalar:");
  for (const error of structuralErrors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`[deprem içerik kontrolü] ${depremArticles.length} makale; ${targetArticles.length} TS500 dışı hedef strict kalite kapısından geçti.`);
