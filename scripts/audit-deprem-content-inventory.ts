import fs from "node:fs";
import path from "node:path";
import { getArticleList, type ArticleData } from "../src/lib/articles-data";
import { parseBlocks } from "../src/lib/article-blocks";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { TS500_ARTICLES, TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const DATA_PATH = "src/lib/data.json";
const TOPIC_PATH = "src/lib/deprem-topic-articles.ts";
const LEGACY_NORMALIZER_PATH = "src/lib/deprem-existing-overrides.ts";
const TS500_DIR = "src/lib/ts500-content";
const TARGET_AUTHOR = "İnşaat Mühendisi Hüseyin GÜNAYDIN";
const TARGET_INITIALS = "HG";
const OLD_TOOL_ROUTE = "/deprem-yonetmelik/araclar/";
const GENERIC_COVER_PATTERNS = [/\/covers\/yonetmelik\.svg$/i, /generic/i, /placeholder/i, /default/i];

function read(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectInitials(author: string) {
  return author
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2);
}

function sourceFileForTs500Slug(slug: string) {
  const matcher = new RegExp(`slug\\s*:\\s*["']${escapeRegExp(slug)}["']`);
  return walk(TS500_DIR)
    .filter((file) => file.endsWith(".ts") && !file.endsWith("/index.ts"))
    .find((file) => matcher.test(read(file))) ?? null;
}

function extractInternalLinks(text: string) {
  const links = new Set<string>();
  const patterns = [
    /\]\((\/[^)\s#]+(?:#[^)\s]+)?)\)/g,
    /href=["'](\/[^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) links.add(match[1]);
  }
  return [...links];
}

function hasEncodingSuspicion(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /[�ÃÄÅÂ]/.test(value) || /\p{L}\?\p{L}/u.test(value);
}

function routeExists(href: string, articleSlugs: Set<string>, staticRoutes: Set<string>) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  if (clean === "/") return true;
  if (staticRoutes.has(clean)) return true;
  if (/^\/[^/]+$/.test(clean) && articleSlugs.has(clean.slice(1))) return true;
  return false;
}

const dataRawText = read(DATA_PATH);
const parsedData = JSON.parse(dataRawText) as Record<string, ArticleData>;
const rawDepremArticles = Object.values(parsedData).filter((article) => article.sectionId === "deprem-yonetmelik");
const rawDepremBySlug = new Map(rawDepremArticles.map((article) => [article.slug, article]));
const topicBySlug = new Map(DEPREM_TOPIC_ARTICLES.map((article) => [article.slug, article]));
const ts500BySlug = new Map(TS500_ARTICLES.map((article) => [article.slug, article]));

const rawTopLevelKeys = [...dataRawText.matchAll(/^\s{2}"([^"]+)"\s*:\s*\{/gm)].map((match) => match[1]);
const rawKeyCounts = new Map<string, number>();
for (const key of rawTopLevelKeys) rawKeyCounts.set(key, (rawKeyCounts.get(key) ?? 0) + 1);
const duplicateRawJsonKeys = [...rawKeyCounts.entries()].filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));

const allArticles = getArticleList();
const articles = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik");
const articleSlugs = new Set(articles.map((article) => article.slug));
const effectiveCounts = new Map<string, number>();
for (const article of articles) effectiveCounts.set(article.slug, (effectiveCounts.get(article.slug) ?? 0) + 1);
const duplicateEffectiveSlugs = [...effectiveCounts.entries()].filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));

const staticRoutes = new Set<string>();
for (const file of walk("src/app").filter((file) => file.endsWith("/page.tsx") || file === "src/app/page.tsx")) {
  const rel = file.replace(/^src\/app\/?/, "").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (rel.includes("[")) continue;
  staticRoutes.add(rel ? `/${rel}` : "/");
}

const coverReuse = new Map<string, string[]>();
for (const article of articles) {
  const image = article.image ?? "";
  if (!coverReuse.has(image)) coverReuse.set(image, []);
  coverReuse.get(image)!.push(article.slug);
}

const inventory = articles.map((article) => {
  const series = getDepremSeriesForArticle(article);
  const fromTs500 = TS500_SLUGS.has(article.slug);
  const fromTopic = topicBySlug.has(article.slug);
  const fromRaw = rawDepremBySlug.has(article.slug);

  let primarySource: string | null = null;
  const overlays: string[] = [];
  let sourceKind = "unknown";
  if (fromTs500) {
    primarySource = sourceFileForTs500Slug(article.slug);
    sourceKind = "ts500-content";
  } else if (fromTopic) {
    primarySource = TOPIC_PATH;
    sourceKind = "deprem-topic-articles";
  } else if (fromRaw) {
    primarySource = DATA_PATH;
    overlays.push(LEGACY_NORMALIZER_PATH);
    sourceKind = "data.json+legacy-normalizer";
  }

  const bodyImages = article.sections.flatMap((section) => parseBlocks(section.content).filter((block) => block.type === "image"));
  const bodyImageSources = bodyImages.map((block) => block.type === "image" ? block.src : "").filter(Boolean);
  const distinctBodyImages = [...new Set(bodyImageSources)];
  const image = article.image ?? "";
  const reusedBy = coverReuse.get(image) ?? [];
  const genericPattern = GENERIC_COVER_PATTERNS.some((pattern) => pattern.test(image));
  const reusedCover = Boolean(image) && reusedBy.length > 1;
  const genericOrReusedCover = !image || genericPattern || reusedCover;
  const meaningfulCoverCount = image && !genericOrReusedCover ? 1 : 0;
  const meaningfulBodyImageCount = distinctBodyImages.filter((src) => !GENERIC_COVER_PATTERNS.some((pattern) => pattern.test(src))).length;
  const realVisualCount = meaningfulCoverCount + meaningfulBodyImageCount;

  const serialized = JSON.stringify(article);
  const internalLinks = extractInternalLinks(article.sections.map((section) => section.content).join("\n"));
  const invalidRelatedSlugs = (article.relatedSlugs ?? []).filter((slug) => !articleSlugs.has(slug));
  const suspiciousInternalLinks = internalLinks.filter((href) => !routeExists(href, articleSlugs, staticRoutes));
  const oldRouteLinks = [...new Set([
    ...internalLinks.filter((href) => href.includes(OLD_TOOL_ROUTE)),
    ...(serialized.includes(OLD_TOOL_ROUTE) ? [OLD_TOOL_ROUTE] : []),
    ...(series.relatedToolHref.includes(OLD_TOOL_ROUTE) ? [series.relatedToolHref] : []),
  ])];

  const generatedInitials = detectInitials(article.author ?? "");
  const encodingSuspicion = [article.slug, article.title, article.description, article.author, article.authorTitle, ...article.sections.map((section) => `${section.title}\n${section.content}`)].some(hasEncodingSuspicion);

  return {
    slug: article.slug,
    title: article.title,
    seriesId: article.seriesId ?? series.id,
    sourceOfTruth: {
      kind: sourceKind,
      primary: primarySource,
      overlays,
      rawDataRecordPresent: fromRaw,
      topicRecordPresent: fromTopic,
      ts500RichRecordPresent: fromTs500,
    },
    author: article.author ?? null,
    authorTitle: article.authorTitle ?? null,
    generatedInitials,
    targetAuthorMatches: article.author === TARGET_AUTHOR,
    targetInitialsMatch: generatedInitials === TARGET_INITIALS,
    image: image || null,
    coverReuseCount: reusedBy.length,
    coverReusedBy: reusedCover ? reusedBy : [],
    genericOrReusedCover,
    bodyImageCount: bodyImages.length,
    distinctBodyImageCount: distinctBodyImages.length,
    realVisualCount,
    belowTwoRealVisuals: article.seriesId !== "ts500" && series.id !== "ts500" && realVisualCount < 2,
    date: article.date ?? null,
    updatedAt: article.updatedAt ?? null,
    readTime: article.readTime ?? null,
    relatedSlugs: article.relatedSlugs ?? [],
    invalidRelatedSlugs,
    references: article.references ?? [],
    relatedTool: {
      href: series.relatedToolHref,
      label: series.label,
      routeExists: routeExists(series.relatedToolHref, articleSlugs, staticRoutes),
    },
    internalLinks,
    suspiciousInternalLinks,
    oldRouteLinks,
    encodingSuspicion,
  };
});

const seriesCounts = Object.fromEntries(
  DEPREM_SERIES.map((series) => [series.id, inventory.filter((item) => item.seriesId === series.id).length]),
);
const ts500Count = inventory.filter((item) => item.seriesId === "ts500").length;
const nonTs500 = inventory.filter((item) => item.seriesId !== "ts500");

const sourceFiles = walk("src").filter((file) => /\.(?:ts|tsx|json|md|mdx)$/.test(file));
const oldRouteSourceHits: { file: string; line: number; text: string }[] = [];
for (const file of sourceFiles) {
  const lines = read(file).split("\n");
  lines.forEach((line, index) => {
    if (line.includes(OLD_TOOL_ROUTE)) oldRouteSourceHits.push({ file, line: index + 1, text: line.trim().slice(0, 240) });
  });
}

const rawTopicCollisions = [...topicBySlug.keys()].filter((slug) => rawDepremBySlug.has(slug));
const rawTs500Shadowed = [...TS500_SLUGS].filter((slug) => rawDepremBySlug.has(slug));
const topicTs500Collisions = [...topicBySlug.keys()].filter((slug) => TS500_SLUGS.has(slug));
const sourceUnknown = inventory.filter((item) => !item.sourceOfTruth.primary).map((item) => item.slug);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repo: "smitelagwar/muhendislik-site",
  scope: "FAZ 0 — Freeze, envanter ve kaynak haritası",
  invariants: {
    targetAuthor: TARGET_AUTHOR,
    targetInitials: TARGET_INITIALS,
    currentArticleClientWouldGenerateForTargetAuthor: detectInitials(TARGET_AUTHOR),
  },
  counts: {
    totalDepremYonetmelik: inventory.length,
    ts500: ts500Count,
    nonTs500Target: nonTs500.length,
    rawDataDepremRecords: rawDepremArticles.length,
    depremTopicArticles: DEPREM_TOPIC_ARTICLES.length,
    ts500RichArticles: TS500_ARTICLES.length,
    bySeries: seriesCounts,
  },
  collisions: {
    duplicateRawJsonKeys,
    duplicateEffectiveSlugs,
    rawVsTopic: rawTopicCollisions,
    rawTs500RecordsShadowedByRichTs500: rawTs500Shadowed,
    topicVsTs500: topicTs500Collisions,
  },
  visualAudit: {
    genericOrReusedCoverSlugs: inventory.filter((item) => item.genericOrReusedCover).map((item) => item.slug),
    nonTs500BelowTwoRealVisuals: nonTs500.filter((item) => item.belowTwoRealVisuals).map((item) => item.slug),
    coverReuseGroups: [...coverReuse.entries()].filter(([image, slugs]) => Boolean(image) && slugs.length > 1).map(([image, slugs]) => ({ image, slugs })),
  },
  linkAudit: {
    oldRoutePattern: OLD_TOOL_ROUTE,
    oldRouteSourceHits,
    articleOldRouteSlugs: inventory.filter((item) => item.oldRouteLinks.length > 0).map((item) => item.slug),
    invalidRelatedSlugArticles: inventory.filter((item) => item.invalidRelatedSlugs.length > 0).map((item) => ({ slug: item.slug, invalidRelatedSlugs: item.invalidRelatedSlugs })),
    suspiciousInternalLinkArticles: inventory.filter((item) => item.suspiciousInternalLinks.length > 0).map((item) => ({ slug: item.slug, links: item.suspiciousInternalLinks })),
    suspiciousRelatedTools: inventory.filter((item) => !item.relatedTool.routeExists).map((item) => ({ slug: item.slug, seriesId: item.seriesId, href: item.relatedTool.href })),
  },
  authorAudit: {
    uniqueAuthors: [...new Set(inventory.map((item) => item.author))],
    uniqueAuthorTitles: [...new Set(inventory.map((item) => item.authorTitle))],
    targetAuthorMismatchCount: inventory.filter((item) => !item.targetAuthorMatches).length,
    targetInitialsMismatchCount: inventory.filter((item) => !item.targetInitialsMatch).length,
  },
  encodingAudit: {
    suspiciousSlugs: inventory.filter((item) => item.encodingSuspicion).map((item) => item.slug),
  },
  sourceAudit: {
    unknownSourceSlugs: sourceUnknown,
    allSourcesResolved: sourceUnknown.length === 0,
  },
  inventory,
};

const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const outputPath = outArg?.slice("--out=".length) || "deprem-content-inventory.json";
fs.writeFileSync(path.join(ROOT, outputPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  outputPath,
  counts: report.counts,
  sourceAudit: report.sourceAudit,
  collisionCounts: Object.fromEntries(Object.entries(report.collisions).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])),
  genericOrReusedCovers: report.visualAudit.genericOrReusedCoverSlugs.length,
  nonTs500BelowTwoRealVisuals: report.visualAudit.nonTs500BelowTwoRealVisuals.length,
  oldRouteSourceHits: report.linkAudit.oldRouteSourceHits.length,
  invalidRelatedSlugArticles: report.linkAudit.invalidRelatedSlugArticles.length,
  suspiciousInternalLinkArticles: report.linkAudit.suspiciousInternalLinkArticles.length,
  suspiciousRelatedTools: report.linkAudit.suspiciousRelatedTools.length,
  authorAudit: report.authorAudit,
  encodingSuspicionCount: report.encodingAudit.suspiciousSlugs.length,
}, null, 2));

if (!report.sourceAudit.allSourcesResolved) process.exitCode = 2;
