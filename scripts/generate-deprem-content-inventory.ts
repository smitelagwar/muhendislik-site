import fs from "node:fs";
import path from "node:path";
import { getArticleList, type ArticleData } from "../src/lib/articles-data";
import { parseBlocks } from "../src/lib/article-blocks";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { SITE_SECTIONS } from "../src/lib/site-sections";
import { TS500_ARTICLES, TS500_SLUGS } from "../src/lib/ts500-content";

const root = process.cwd();
const dataPath = "src/lib/data.json";
const topicPath = "src/lib/deprem-topic-articles.ts";
const normalizerPath = "src/lib/deprem-existing-overrides.ts";
const oldToolPrefix = "/deprem-yonetmelik/araclar/";
const targetAuthor = "İnşaat Mühendisi Hüseyin GÜNAYDIN";
const targetInitials = "HG";
const genericImage = /\/covers\/yonetmelik\.svg$|generic|placeholder|default/i;

const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
function walk(rel: string): string[] {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(rel, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}
function initials(author: string) {
  return author.split(/\s+/).filter(Boolean).map((part) => part[0] ?? "").join("").slice(0, 2);
}
function links(text: string) {
  const found = new Set<string>();
  for (const rx of [/\]\((\/[^)\s]+)\)/g, /href=["'](\/[^"']+)["']/g]) {
    for (const match of text.matchAll(rx)) found.add(match[1]);
  }
  return [...found];
}
function ts500File(slug: string) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(`slug\\s*:\\s*["']${escaped}["']`);
  return walk("src/lib/ts500-content")
    .filter((file) => file.endsWith(".ts") && !file.endsWith("/index.ts"))
    .find((file) => rx.test(read(file))) ?? null;
}

const rawText = read(dataPath);
const raw = JSON.parse(rawText) as Record<string, ArticleData>;
const rawDeprem = Object.values(raw).filter((article) => article.sectionId === "deprem-yonetmelik");
const rawBySlug = new Map(rawDeprem.map((article) => [article.slug, article]));
const topicBySlug = new Map(DEPREM_TOPIC_ARTICLES.map((article) => [article.slug, article]));
const allArticles = getArticleList();
const allSlugs = new Set(allArticles.map((article) => article.slug));
const articles = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik");

const routes = new Set(SITE_SECTIONS.map((section) => section.href.replace(/\/$/, "") || "/"));
for (const file of walk("src/app").filter((file) => file.endsWith("/page.tsx") || file === "src/app/page.tsx")) {
  const route = file.replace(/^src\/app\/?/, "").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (!route.includes("[")) routes.add(route ? `/${route}` : "/");
}
const routeExists = (href: string) => {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return routes.has(clean) || (/^\/[^/]+$/.test(clean) && allSlugs.has(clean.slice(1)));
};

const coverUse = new Map<string, string[]>();
for (const article of articles) {
  const image = article.image ?? "";
  coverUse.set(image, [...(coverUse.get(image) ?? []), article.slug]);
}

const inventory = articles.map((article) => {
  const series = getDepremSeriesForArticle(article);
  const isTs500 = TS500_SLUGS.has(article.slug);
  const isTopic = topicBySlug.has(article.slug);
  const isRaw = rawBySlug.has(article.slug);
  let sourceOfTruth: { kind: string; seed: string | null; effective: string | null };
  if (isTs500) {
    sourceOfTruth = { kind: "ts500-content", seed: isRaw ? dataPath : null, effective: ts500File(article.slug) };
  } else if (isTopic) {
    sourceOfTruth = { kind: "deprem-topic-articles", seed: null, effective: topicPath };
  } else if (isRaw) {
    sourceOfTruth = { kind: "legacy-normalized", seed: dataPath, effective: normalizerPath };
  } else {
    sourceOfTruth = { kind: "unknown", seed: null, effective: null };
  }

  const bodyImages = article.sections.flatMap((section) => parseBlocks(section.content).filter((block) => block.type === "image"));
  const bodySources = [...new Set(bodyImages.map((block) => block.type === "image" ? block.src : "").filter(Boolean))];
  const image = article.image ?? "";
  const reusedBy = coverUse.get(image) ?? [];
  const genericOrReusedCover = !image || genericImage.test(image) || reusedBy.length > 1;
  const meaningfulBodyCount = bodySources.filter((src) => !genericImage.test(src)).length;
  const realVisualCount = (image && !genericOrReusedCover ? 1 : 0) + meaningfulBodyCount;
  const sectionText = article.sections.map((section) => section.content).join("\n");
  const internalLinks = links(sectionText);
  const generatedInitials = initials(article.author ?? "");

  return {
    slug: article.slug,
    title: article.title,
    seriesId: article.seriesId ?? series.id,
    sourceOfTruth,
    author: article.author ?? null,
    authorTitle: article.authorTitle ?? null,
    generatedInitials,
    targetAuthorMatches: article.author === targetAuthor,
    targetInitialsMatch: generatedInitials === targetInitials,
    image: image || null,
    coverReuseCount: reusedBy.length,
    coverReusedBy: reusedBy.length > 1 ? reusedBy : [],
    genericOrReusedCover,
    bodyImageCount: bodyImages.length,
    distinctBodyImageCount: bodySources.length,
    realVisualCount,
    belowTwoRealVisuals: series.id !== "ts500" && realVisualCount < 2,
    date: article.date ?? null,
    updatedAt: article.updatedAt ?? null,
    readTime: article.readTime ?? null,
    relatedSlugs: article.relatedSlugs ?? [],
    invalidRelatedSlugs: (article.relatedSlugs ?? []).filter((slug) => !allSlugs.has(slug)),
    references: article.references ?? [],
    relatedTool: { href: series.relatedToolHref, label: series.label, routeExists: routeExists(series.relatedToolHref) },
    internalLinks,
    suspiciousInternalLinks: internalLinks.filter((href) => !routeExists(href)),
    oldRouteLinks: [...new Set([
      ...internalLinks.filter((href) => href.includes(oldToolPrefix)),
      ...(JSON.stringify(article).includes(oldToolPrefix) ? [oldToolPrefix] : []),
      ...(series.relatedToolHref.includes(oldToolPrefix) ? [series.relatedToolHref] : []),
    ])],
    encodingSuspicion: [article.title, article.description, article.author, article.authorTitle, ...article.sections.flatMap((s) => [s.title, s.content])]
      .some((value) => typeof value === "string" && (/[�ÃÄÅÂ]/.test(value) || /\p{L}\?\p{L}/u.test(value))),
  };
});

const countMap = (values: string[]) => Object.fromEntries([...new Set(values)].map((value) => [value, values.filter((item) => item === value).length]));
const rawKeys = [...rawText.matchAll(/^\s{2}"([^"]+)"\s*:\s*\{/gm)].map((match) => match[1]);
const rawKeyCounts = countMap(rawKeys);
const duplicateRawJsonKeys = Object.entries(rawKeyCounts).filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));
const effectiveCounts = countMap(articles.map((article) => article.slug));
const duplicateEffectiveSlugs = Object.entries(effectiveCounts).filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));

const oldRouteSourceHits: { file: string; line: number; text: string }[] = [];
for (const file of walk("src").filter((file) => /\.(?:ts|tsx|json|md|mdx)$/.test(file))) {
  read(file).split("\n").forEach((line, index) => {
    if (line.includes(oldToolPrefix)) oldRouteSourceHits.push({ file, line: index + 1, text: line.trim().slice(0, 240) });
  });
}

const bySeries = Object.fromEntries(DEPREM_SERIES.map((series) => [series.id, inventory.filter((item) => item.seriesId === series.id).length]));
const nonTs500 = inventory.filter((item) => item.seriesId !== "ts500");
const legacyNormalizedSlugs = inventory.filter((item) => item.sourceOfTruth.kind === "legacy-normalized").map((item) => item.slug);
const unknownSourceSlugs = inventory.filter((item) => !item.sourceOfTruth.effective).map((item) => item.slug);

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  repo: "smitelagwar/muhendislik-site",
  scope: "FAZ 0 — Freeze, envanter ve kaynak haritası",
  invariants: {
    targetAuthor,
    targetInitials,
    currentArticleClientWouldGenerateForTargetAuthor: initials(targetAuthor),
  },
  counts: {
    totalDepremYonetmelik: inventory.length,
    ts500: inventory.filter((item) => item.seriesId === "ts500").length,
    nonTs500Target: nonTs500.length,
    rawDataDepremRecords: rawDeprem.length,
    legacyNormalizedArticles: legacyNormalizedSlugs.length,
    depremTopicArticles: DEPREM_TOPIC_ARTICLES.length,
    ts500RichArticles: TS500_ARTICLES.length,
    bySeries,
  },
  collisions: {
    duplicateRawJsonKeys,
    duplicateEffectiveSlugs,
    rawVsTopic: [...topicBySlug.keys()].filter((slug) => rawBySlug.has(slug)),
    rawTs500RecordsShadowedByRichTs500: [...TS500_SLUGS].filter((slug) => rawBySlug.has(slug)),
    topicVsTs500: [...topicBySlug.keys()].filter((slug) => TS500_SLUGS.has(slug)),
    legacyNormalizedSlugs,
  },
  visualAudit: {
    genericOrReusedCoverSlugs: inventory.filter((item) => item.genericOrReusedCover).map((item) => item.slug),
    nonTs500BelowTwoRealVisuals: nonTs500.filter((item) => item.belowTwoRealVisuals).map((item) => item.slug),
    coverReuseGroups: [...coverUse.entries()].filter(([image, slugs]) => image && slugs.length > 1).map(([image, slugs]) => ({ image, slugs })),
  },
  linkAudit: {
    oldRoutePattern: oldToolPrefix,
    oldRouteSourceHits,
    articleOldRouteSlugs: inventory.filter((item) => item.oldRouteLinks.length).map((item) => item.slug),
    invalidRelatedSlugArticles: inventory.filter((item) => item.invalidRelatedSlugs.length).map((item) => ({ slug: item.slug, invalidRelatedSlugs: item.invalidRelatedSlugs })),
    suspiciousInternalLinkArticles: inventory.filter((item) => item.suspiciousInternalLinks.length).map((item) => ({ slug: item.slug, links: item.suspiciousInternalLinks })),
    suspiciousRelatedTools: inventory.filter((item) => !item.relatedTool.routeExists).map((item) => ({ slug: item.slug, seriesId: item.seriesId, href: item.relatedTool.href })),
  },
  authorAudit: {
    uniqueAuthors: [...new Set(inventory.map((item) => item.author))],
    uniqueAuthorTitles: [...new Set(inventory.map((item) => item.authorTitle))],
    targetAuthorMismatchCount: inventory.filter((item) => !item.targetAuthorMatches).length,
    targetInitialsMismatchCount: inventory.filter((item) => !item.targetInitialsMatch).length,
  },
  encodingAudit: { suspiciousSlugs: inventory.filter((item) => item.encodingSuspicion).map((item) => item.slug) },
  sourceAudit: { unknownSourceSlugs, allSourcesResolved: unknownSourceSlugs.length === 0 },
  inventory,
};

const outArg = process.argv.find((arg) => arg.startsWith("--out="));
const out = outArg?.slice(6) || "deprem-content-inventory.json";
fs.writeFileSync(path.join(root, out), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
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
