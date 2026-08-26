import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { DEPREM_CONTENT_AUTHOR, getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const EXPECTED_TOTAL = 164;
const EXPECTED_TARGET = 143;
const OLD_TOOL_PREFIX = "/deprem-yonetmelik/araclar/";
const GENERIC_COVER_PATTERNS = [/\/covers\/yonetmelik\.svg$/i, /placeholder/i, /generic/i, /default/i];
const BANNED_EDITORIAL_PHRASES = [
  "bu yazımızda",
  "gelin birlikte inceleyelim",
  "oldukça önemlidir",
  "mühendislerin dikkat etmesi gerekir",
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

function editorialParagraphs(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block.length >= 140)
    .filter((block) => !block.startsWith("|"))
    .filter((block) => !block.startsWith("!["))
    .filter((block) => !block.startsWith("```"))
    .filter((block) => !block.startsWith("- ["));
}

const allArticles = getArticleList();
const depremArticles = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik");
const targetArticles = depremArticles.filter((article) => !TS500_SLUGS.has(article.slug));
const allSlugs = new Set(allArticles.map((article) => article.slug));
const toolHrefs = new Set(TOOLS.map((tool) => tool.href));

assert(depremArticles.length === EXPECTED_TOTAL, `FAZ 8 deprem makale sayısı ${EXPECTED_TOTAL} olmalı; bulunan ${depremArticles.length}.`);
assert(targetArticles.length === EXPECTED_TARGET, `FAZ 8 TS500 dışı hedef ${EXPECTED_TARGET} olmalı; bulunan ${targetArticles.length}.`);

const seriesIds = new Set<string>();
const seriesPriorities = new Set<number>();
let previousPriority = -Infinity;
for (const series of DEPREM_SERIES) {
  assert(!seriesIds.has(series.id), `Seri kimliği tekrar ediyor: ${series.id}`);
  assert(!seriesPriorities.has(series.priority), `Seri önceliği tekrar ediyor: ${series.priority}`);
  assert(series.priority > previousPriority, `Seri sıralaması priority alanıyla tutarlı değil: ${series.id}`);
  assert(!series.relatedToolHref || toolHrefs.has(series.relatedToolHref), `Seri CTA gerçek araç rotasına bağlı değil: ${series.id} -> ${series.relatedToolHref}`);
  seriesIds.add(series.id);
  seriesPriorities.add(series.priority);
  previousPriority = series.priority;
}

const coverOwners = new Map<string, string[]>();
const paragraphOwners = new Map<string, { text: string; slugs: Set<string> }>();

for (const article of targetArticles) {
  assert(article.title === article.title.trim(), `Başlıkta baş/son boşluk var: ${article.slug}`);
  assert(!/\s{2,}/.test(article.title), `Başlıkta tekrar boşluk var: ${article.slug}`);
  assert(Boolean(article.description.trim()), `Description boş: ${article.slug}`);
  assert(/^\d+\s*dk(?:\s+okuma)?$/i.test(article.readTime.trim()), `readTime formatı tutarsız: ${article.slug} -> ${article.readTime}`);
  assert(Boolean(article.updatedAt?.trim()), `updatedAt eksik: ${article.slug}`);

  const presentation = getArticleAuthorPresentation(article);
  assert(article.author === DEPREM_CONTENT_AUTHOR.name, `Canonical author eşleşmiyor: ${article.slug}`);
  assert(article.authorTitle === "", `authorTitle tekrar unvan riski taşıyor: ${article.slug}`);
  assert(presentation.monogram === DEPREM_CONTENT_AUTHOR.monogram, `HG monogram eşleşmiyor: ${article.slug}`);

  const series = getDepremSeriesForArticle(article);
  assert(series.id === article.seriesId, `Runtime seri eşlemesi açık seriesId ile uyuşmuyor: ${article.slug}`);
  assert(!series.relatedToolHref || toolHrefs.has(series.relatedToolHref), `Makale CTA rotası geçersiz: ${article.slug} -> ${series.relatedToolHref}`);

  assert(article.relatedSlugs.length >= 1, `Sonraki okuma zinciri boş: ${article.slug}`);
  const seenRelated = new Set<string>();
  for (const relatedSlug of article.relatedSlugs) {
    assert(relatedSlug !== article.slug, `Makale kendisini relatedSlugs içinde gösteriyor: ${article.slug}`);
    assert(!seenRelated.has(relatedSlug), `relatedSlugs tekrarı: ${article.slug} -> ${relatedSlug}`);
    assert(allSlugs.has(relatedSlug), `Geçersiz related slug: ${article.slug} -> ${relatedSlug}`);
    seenRelated.add(relatedSlug);
  }

  assert(Boolean(article.image.trim()), `Cover eksik: ${article.slug}`);
  assert(!GENERIC_COVER_PATTERNS.some((pattern) => pattern.test(article.image)), `Generic cover kaldı: ${article.slug} -> ${article.image}`);
  coverOwners.set(article.image, [...(coverOwners.get(article.image) ?? []), article.slug]);

  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const bodyImages = blocks.filter((block) => block.type === "image");
  assert(bodyImages.length >= 1, `Teknik body figure eksik: ${article.slug}`);
  for (const image of bodyImages) {
    if (image.type !== "image") continue;
    assert(Boolean(image.src.trim()), `Body figure src eksik: ${article.slug}`);
    assert(Boolean(image.alt.trim()), `Body figure alt eksik: ${article.slug}`);
    assert(Boolean(image.caption.trim()), `Body figure caption eksik: ${article.slug}`);
    assert(image.src !== article.image, `Cover ile body figure aynı asset'i kullanıyor: ${article.slug}`);
    assert(normalize(image.caption) !== normalize(article.title), `Figure caption makale başlığını aynen tekrar ediyor: ${article.slug}`);
  }

  assert((article.references?.length ?? 0) >= 1, `Kaynakça eksik: ${article.slug}`);
  const referenceHrefs = new Set<string>();
  const referenceLabels = new Set<string>();
  for (const reference of article.references ?? []) {
    const normalizedLabel = normalize(reference.label);
    assert(Boolean(normalizedLabel), `Kaynak etiketi boş: ${article.slug}`);
    assert(!referenceLabels.has(normalizedLabel), `Aynı kaynak etiketi makalede tekrar ediyor: ${article.slug} -> ${reference.label}`);
    referenceLabels.add(normalizedLabel);
    if (!reference.href) continue;
    assert(/^https?:\/\//.test(reference.href), `Kaynak URL biçimi geçersiz: ${article.slug} -> ${reference.href}`);
    assert(!referenceHrefs.has(reference.href), `Aynı kaynak URL'si makalede tekrar ediyor: ${article.slug} -> ${reference.href}`);
    referenceHrefs.add(reference.href);
  }

  assert(!JSON.stringify(article).includes(OLD_TOOL_PREFIX), `Eski araç route kalıbı makalede kaldı: ${article.slug}`);

  const mergedEditorialText = normalize([
    article.title,
    article.description,
    article.seoDescription ?? "",
    ...article.sections.map((section) => `${section.title}\n${section.content}`),
  ].join("\n"));
  for (const phrase of BANNED_EDITORIAL_PHRASES) {
    assert(!mergedEditorialText.includes(phrase), `Profesyonel redaksiyon klişesi kaldı (${phrase}): ${article.slug}`);
  }
  if (mergedEditorialText.includes("hayati önem taşır")) {
    warnings.push(`"Hayati önem taşır" ifadesi teknik gerekçe açısından manuel kontrol edilmeli: ${article.slug}`);
  }

  const sectionIds = new Set<string>();
  const sectionTitles = new Set<string>();
  for (const section of article.sections) {
    const normalizedTitle = normalize(section.title);
    assert(!sectionIds.has(section.id), `Section id tekrar ediyor: ${article.slug} -> ${section.id}`);
    assert(!sectionTitles.has(normalizedTitle), `Section başlığı tekrar ediyor: ${article.slug} -> ${section.title}`);
    sectionIds.add(section.id);
    sectionTitles.add(normalizedTitle);

    for (const paragraph of editorialParagraphs(section.content)) {
      const key = normalize(paragraph);
      const current = paragraphOwners.get(key) ?? { text: paragraph, slugs: new Set<string>() };
      current.slugs.add(article.slug);
      paragraphOwners.set(key, current);
    }
  }
}

for (const [cover, slugs] of coverOwners) {
  assert(slugs.length === 1, `Cover tekrar kullanılıyor: ${cover} -> ${slugs.join(", ")}`);
}

const duplicateTitles = duplicateGroups(targetArticles.map((article) => ({ slug: article.slug, value: article.title })));
for (const group of duplicateTitles) errors.push(`Aynı makale başlığı tekrar ediyor: ${group.slugs.join(", ")}`);

const duplicateDescriptions = duplicateGroups(targetArticles.map((article) => ({ slug: article.slug, value: article.description })));
for (const group of duplicateDescriptions) errors.push(`Aynı description tekrar ediyor: ${group.slugs.join(", ")}`);

const duplicateSeoDescriptions = duplicateGroups(
  targetArticles
    .filter((article) => Boolean(article.seoDescription?.trim()))
    .map((article) => ({ slug: article.slug, value: article.seoDescription ?? "" })),
);
for (const group of duplicateSeoDescriptions) errors.push(`Aynı meta description tekrar ediyor: ${group.slugs.join(", ")}`);

const repeatedParagraphs = [...paragraphOwners.values()]
  .filter((entry) => entry.slugs.size >= 8)
  .sort((a, b) => b.slugs.size - a.slugs.size);
for (const entry of repeatedParagraphs) {
  const sample = entry.text.length > 140 ? `${entry.text.slice(0, 137)}...` : entry.text;
  const message = `Tekrarlanan paragraf ${entry.slugs.size} makalede: ${sample}`;
  if (entry.slugs.size >= 30) errors.push(message);
  else warnings.push(message);
}

if (warnings.length > 0) {
  console.warn("FAZ 8 redaksiyon uyarıları:\n");
  for (const warning of warnings.slice(0, 20)) console.warn(`- ${warning}`);
  if (warnings.length > 20) console.warn(`- ... ${warnings.length - 20} ek uyarı`);
}

if (errors.length > 0) {
  console.error("FAZ 8 global redaksiyon / bilgi mimarisi kontrolü başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 8 — Global redaksiyon ve bilgi mimarisi",
  articles: depremArticles.length,
  targetArticles: targetArticles.length,
  series: DEPREM_SERIES.length,
  uniqueCovers: coverOwners.size,
  duplicateTitles: duplicateTitles.length,
  duplicateDescriptions: duplicateDescriptions.length,
  duplicateSeoDescriptions: duplicateSeoDescriptions.length,
  repeatedParagraphWarnings: repeatedParagraphs.filter((entry) => entry.slugs.size < 30).length,
  manualEditorialWarnings: warnings.length,
  author: DEPREM_CONTENT_AUTHOR.name,
  monogram: DEPREM_CONTENT_AUTHOR.monogram,
}, null, 2));
