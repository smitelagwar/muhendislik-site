import fs from "node:fs";
import path from "node:path";
import { getArticleList, type ArticleData } from "../src/lib/articles-data";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleAuthorPresentation } from "../src/lib/content-author";
import { DEPREM_PILOT_ARTICLES, DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import {
  DEPREM_ROLLOUT_ARTICLES,
  DEPREM_ROLLOUT_BATCH_1,
  DEPREM_ROLLOUT_BATCH_1_SLUGS,
  DEPREM_ROLLOUT_BATCH_2,
  DEPREM_ROLLOUT_BATCH_2_SLUGS,
  DEPREM_ROLLOUT_SLUGS,
  getDepremRolloutSpec,
} from "../src/lib/deprem-rollout";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { SITE_SECTIONS } from "../src/lib/site-sections";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_ARTICLES, TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const RUNTIME_ASSEMBLER = "src/lib/articles-data.ts";
const DATA_PATH = "src/lib/data.json";
const PILOT_PATH = "src/lib/deprem-pilot-articles.ts";
const ROLLOUT_PATH = "src/lib/deprem-rollout.ts";
const TOPIC_PATH = "src/lib/deprem-topic-articles.ts";
const NORMALIZER_PATH = "src/lib/deprem-existing-overrides.ts";
const TS500_DIR = "src/lib/ts500-content";
const TARGET_AUTHOR = "İnşaat Mühendisi Hüseyin GÜNAYDIN";
const TARGET_INITIALS = "HG";
const OLD_TOOL_PREFIX = "/deprem-yonetmelik/araclar/";
const GENERIC_IMAGE_PATTERN = /\/covers\/yonetmelik\.svg$|generic|placeholder|default/i;

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function walk(relativePath: string): string[] {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relativePath, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function ts500SourceFile(slug: string) {
  return walk(TS500_DIR)
    .filter((file) => file.endsWith(".ts") && !file.endsWith("/index.ts"))
    .find((file) => {
      const source = read(file);
      return source.includes(`slug: "${slug}"`) || source.includes(`slug: '${slug}'`);
    }) ?? null;
}

function extractInternalLinks(text: string) {
  const result = new Set<string>();
  for (const pattern of [/(?<!!)\[[^\]]+\]\((\/[^)\s]+)\)/g, /href=["'](\/[^"']+)["']/g]) {
    for (const match of text.matchAll(pattern)) result.add(match[1]);
  }
  return [...result];
}

function hasEncodingSuspicion(value: unknown) {
  return typeof value === "string" && (/[�ÃÄÅÂ]/.test(value) || /\p{L}\?\p{L}/u.test(value));
}

const rawText = read(DATA_PATH);
const rawArticles = JSON.parse(rawText) as Record<string, ArticleData>;
const rawDepremArticles = Object.values(rawArticles).filter((article) => article.sectionId === "deprem-yonetmelik");
const rawDepremBySlug = new Map(rawDepremArticles.map((article) => [article.slug, article]));
const topicBySlug = new Map(DEPREM_TOPIC_ARTICLES.map((article) => [article.slug, article]));

const allArticles = getArticleList();
const allArticleSlugs = new Set(allArticles.map((article) => article.slug));
const depremArticles = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik");

const knownRoutes = new Set(SITE_SECTIONS.map((section) => section.href.replace(/\/$/, "") || "/"));
for (const tool of TOOLS) knownRoutes.add(tool.href.replace(/\/$/, "") || "/");
for (const pageFile of walk("src/app").filter((file) => file === "src/app/page.tsx" || file.endsWith("/page.tsx"))) {
  const route = pageFile.replace(/^src\/app\/?/, "").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (!route.includes("[")) knownRoutes.add(route ? `/${route}` : "/");
}

function routeExists(href: string) {
  if (!href.trim()) return true;
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return knownRoutes.has(clean) || (/^\/[^/]+$/.test(clean) && allArticleSlugs.has(clean.slice(1)));
}

const coverUsage = new Map<string, string[]>();
for (const article of depremArticles) {
  const image = article.image ?? "";
  coverUsage.set(image, [...(coverUsage.get(image) ?? []), article.slug]);
}

const inventory = depremArticles.map((article) => {
  const series = getDepremSeriesForArticle(article);
  const rawArticle = rawDepremBySlug.get(article.slug);
  const isTs500 = TS500_SLUGS.has(article.slug);
  const isPilot = DEPREM_PILOT_SLUGS.has(article.slug);
  const rolloutSpec = getDepremRolloutSpec(article.slug);
  const isRollout = DEPREM_ROLLOUT_SLUGS.has(article.slug);
  const isTopic = topicBySlug.has(article.slug);
  const bodyChangedByNormalizer = Boolean(
    rawArticle && JSON.stringify(rawArticle.sections) !== JSON.stringify(article.sections),
  );

  let sourceOfTruth: {
    kind: "ts500-content" | "deprem-pilot-articles" | "deprem-topic-articles" | "legacy-normalized" | "unknown";
    runtimeAssembler: string;
    seed: string | null;
    body: string | null;
    metadata: string | null;
    enhancement: string | null;
  };

  if (isTs500) {
    const ts500File = ts500SourceFile(article.slug);
    sourceOfTruth = {
      kind: "ts500-content",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: rawArticle ? DATA_PATH : null,
      body: ts500File,
      metadata: ts500File,
      enhancement: null,
    };
  } else if (isPilot) {
    sourceOfTruth = {
      kind: "deprem-pilot-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: rawArticle ? DATA_PATH : isTopic ? TOPIC_PATH : null,
      body: PILOT_PATH,
      metadata: PILOT_PATH,
      enhancement: null,
    };
  } else if (isTopic) {
    sourceOfTruth = {
      kind: "deprem-topic-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: null,
      body: TOPIC_PATH,
      metadata: TOPIC_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else if (rawArticle) {
    sourceOfTruth = {
      kind: "legacy-normalized",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: DATA_PATH,
      body: bodyChangedByNormalizer ? NORMALIZER_PATH : DATA_PATH,
      metadata: NORMALIZER_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else {
    sourceOfTruth = {
      kind: "unknown",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: null,
      body: null,
      metadata: null,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  }

  const bodyImages = article.sections.flatMap((section) =>
    parseBlocks(section.content).filter((block) => block.type === "image"),
  );
  const distinctBodyImages = [...new Set(
    bodyImages.map((block) => block.type === "image" ? block.src : "").filter(Boolean),
  )];
  const image = article.image ?? "";
  const coverReuseCount = (coverUsage.get(image) ?? []).length;
  const genericOrReusedCover = !image || GENERIC_IMAGE_PATTERN.test(image) || coverReuseCount > 1;
  const meaningfulBodyImageCount = distinctBodyImages.filter((src) => !GENERIC_IMAGE_PATTERN.test(src)).length;
  const realVisualCount = (image && !genericOrReusedCover ? 1 : 0) + meaningfulBodyImageCount;

  const sectionText = article.sections.map((section) => section.content).join("\n");
  const internalLinks = extractInternalLinks(sectionText);
  const authorPresentation = getArticleAuthorPresentation(article);
  const initials = authorPresentation.monogram;

  return {
    slug: article.slug,
    title: article.title,
    seriesId: article.seriesId ?? series.id,
    excludedFromRewriteScope: series.id === "ts500",
    rolloutBatch: rolloutSpec?.batch ?? null,
    sourceOfTruth,
    author: article.author ?? null,
    authorTitle: article.authorTitle ?? null,
    presentedInitials: initials,
    targetAuthorMatches: article.author === TARGET_AUTHOR,
    targetInitialsMatch: initials === TARGET_INITIALS,
    image: image || null,
    coverReuseCount,
    genericOrReusedCover,
    bodyImageCount: bodyImages.length,
    distinctBodyImageCount: distinctBodyImages.length,
    realVisualCount,
    belowTwoRealVisuals: series.id !== "ts500" && realVisualCount < 2,
    date: article.date ?? null,
    updatedAt: article.updatedAt ?? null,
    readTime: article.readTime ?? null,
    relatedSlugs: article.relatedSlugs ?? [],
    invalidRelatedSlugs: (article.relatedSlugs ?? []).filter((slug) => !allArticleSlugs.has(slug)),
    references: article.references ?? [],
    relatedTool: {
      label: series.label,
      href: series.relatedToolHref,
      routeExists: routeExists(series.relatedToolHref),
    },
    internalLinks,
    suspiciousInternalLinks: internalLinks.filter((href) => !routeExists(href)),
    oldRouteLinks: [...new Set([
      ...internalLinks.filter((href) => href.includes(OLD_TOOL_PREFIX)),
      ...(JSON.stringify(article).includes(OLD_TOOL_PREFIX) ? [OLD_TOOL_PREFIX] : []),
      ...(series.relatedToolHref.includes(OLD_TOOL_PREFIX) ? [series.relatedToolHref] : []),
    ])],
    encodingSuspicion: [
      article.slug,
      article.title,
      article.description,
      article.author,
      article.authorTitle,
      ...article.sections.flatMap((section) => [section.title, section.content]),
    ].some(hasEncodingSuspicion),
  };
});

function duplicateCounts(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([slug, count]) => ({ slug, count }));
}

const rawTopLevelKeys = [...rawText.matchAll(/^\s{2}"([^"]+)"\s*:\s*\{/gm)].map((match) => match[1]);
const duplicateRawJsonKeys = duplicateCounts(rawTopLevelKeys);
const duplicateEffectiveSlugs = duplicateCounts(depremArticles.map((article) => article.slug));
const nonTs500 = inventory.filter((item) => item.seriesId !== "ts500");
const legacyNormalized = inventory.filter((item) => item.sourceOfTruth.kind === "legacy-normalized");
const legacyBodyRecovered = legacyNormalized.filter((item) => item.sourceOfTruth.body === NORMALIZER_PATH);
const legacyBodyPreserved = legacyNormalized.filter((item) => item.sourceOfTruth.body === DATA_PATH);
const pilotInventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-pilot-articles");
const rolloutBatch1Inventory = inventory.filter((item) => item.rolloutBatch === 1);
const rolloutBatch2Inventory = inventory.filter((item) => item.rolloutBatch === 2);
const rolloutInventory = inventory.filter((item) => item.rolloutBatch !== null);

const oldRouteSourceHits: Array<{ file: string; line: number; text: string }> = [];
for (const file of walk("src").filter((item) => /\.(?:ts|tsx|json|md|mdx)$/.test(item))) {
  read(file).split("\n").forEach((line, index) => {
    if (line.includes(OLD_TOOL_PREFIX)) {
      oldRouteSourceHits.push({ file, line: index + 1, text: line.trim().slice(0, 240) });
    }
  });
}

const bySeries = Object.fromEntries(
  DEPREM_SERIES.map((series) => [series.id, inventory.filter((item) => item.seriesId === series.id).length]),
);
const unknownSourceSlugs = inventory
  .filter((item) => !item.sourceOfTruth.body || !item.sourceOfTruth.metadata)
  .map((item) => item.slug);
const missingPilotRuntimeSlugs = [...DEPREM_PILOT_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingRolloutBatch1RuntimeSlugs = [...DEPREM_ROLLOUT_BATCH_1_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingRolloutBatch2RuntimeSlugs = [...DEPREM_ROLLOUT_BATCH_2_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const canonicalAuthorPresentation = getArticleAuthorPresentation({
  sectionId: "deprem-yonetmelik",
  author: TARGET_AUTHOR,
  authorTitle: "",
});

const report = {
  schemaVersion: 7,
  generatedAt: new Date().toISOString(),
  repo: "smitelagwar/muhendislik-site",
  scope: "FAZ 0/2 + rollout Batch 1/2 — Envanter, kaynak haritası ve kontrollü enhancement",
  invariants: {
    targetAuthor: TARGET_AUTHOR,
    targetInitials: TARGET_INITIALS,
    runtimePresentedInitialsForTargetAuthor: canonicalAuthorPresentation.monogram,
    registeredToolRouteCount: TOOLS.length,
  },
  counts: {
    totalDepremYonetmelik: inventory.length,
    ts500: inventory.filter((item) => item.seriesId === "ts500").length,
    nonTs500Target: nonTs500.length,
    rawDataDepremRecords: rawDepremArticles.length,
    depremTopicArticles: DEPREM_TOPIC_ARTICLES.length,
    depremPilotArticles: DEPREM_PILOT_ARTICLES.length,
    pilotInventoryArticles: pilotInventory.length,
    rolloutArticles: DEPREM_ROLLOUT_ARTICLES.length,
    rolloutInventoryArticles: rolloutInventory.length,
    rolloutBatch1Articles: DEPREM_ROLLOUT_BATCH_1.length,
    rolloutBatch1InventoryArticles: rolloutBatch1Inventory.length,
    rolloutBatch2Articles: DEPREM_ROLLOUT_BATCH_2.length,
    rolloutBatch2InventoryArticles: rolloutBatch2Inventory.length,
    ts500RichArticles: TS500_ARTICLES.length,
    legacyNormalizedArticles: legacyNormalized.length,
    legacyBodyRecovered: legacyBodyRecovered.length,
    legacyBodyPreserved: legacyBodyPreserved.length,
    bySeries,
  },
  collisions: {
    duplicateRawJsonKeys,
    duplicateEffectiveSlugs,
    rawVsTopic: [...topicBySlug.keys()].filter((slug) => rawDepremBySlug.has(slug)),
    rawTs500RecordsShadowedByRichTs500: [...TS500_SLUGS].filter((slug) => rawDepremBySlug.has(slug)),
    topicVsTs500: [...topicBySlug.keys()].filter((slug) => TS500_SLUGS.has(slug)),
    pilotVsTs500: [...DEPREM_PILOT_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    rolloutVsTs500: [...DEPREM_ROLLOUT_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    rolloutVsPilot: [...DEPREM_ROLLOUT_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
  },
  pilotAudit: {
    configuredSlugs: [...DEPREM_PILOT_SLUGS],
    sourceOfTruthSlugs: pilotInventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPilotRuntimeSlugs,
    allConfiguredPilotsResolved: missingPilotRuntimeSlugs.length === 0 && pilotInventory.length === DEPREM_PILOT_ARTICLES.length,
  },
  rolloutAudit: {
    configuredSlugs: [...DEPREM_ROLLOUT_SLUGS],
    enhancedSlugs: rolloutInventory.map((item) => item.slug),
    batches: {
      batch1: {
        configured: DEPREM_ROLLOUT_BATCH_1.length,
        enhanced: rolloutBatch1Inventory.length,
        missingRuntimeSlugs: missingRolloutBatch1RuntimeSlugs,
      },
      batch2: {
        configured: DEPREM_ROLLOUT_BATCH_2.length,
        enhanced: rolloutBatch2Inventory.length,
        missingRuntimeSlugs: missingRolloutBatch2RuntimeSlugs,
      },
    },
    allConfiguredRolloutResolved:
      missingRolloutBatch1RuntimeSlugs.length === 0 &&
      missingRolloutBatch2RuntimeSlugs.length === 0 &&
      rolloutInventory.length === DEPREM_ROLLOUT_ARTICLES.length,
  },
  visualAudit: {
    genericOrReusedCoverSlugs: inventory.filter((item) => item.genericOrReusedCover).map((item) => item.slug),
    nonTs500BelowTwoRealVisuals: nonTs500.filter((item) => item.belowTwoRealVisuals).map((item) => item.slug),
    coverReuseGroups: [...coverUsage.entries()]
      .filter(([image, slugs]) => Boolean(image) && slugs.length > 1)
      .map(([image, slugs]) => ({ image, slugs })),
  },
  linkAudit: {
    oldRoutePattern: OLD_TOOL_PREFIX,
    oldRouteSourceHits,
    articleOldRouteSlugs: inventory.filter((item) => item.oldRouteLinks.length > 0).map((item) => item.slug),
    invalidRelatedSlugArticles: inventory
      .filter((item) => item.invalidRelatedSlugs.length > 0)
      .map((item) => ({ slug: item.slug, invalidRelatedSlugs: item.invalidRelatedSlugs })),
    suspiciousInternalLinkArticles: inventory
      .filter((item) => item.suspiciousInternalLinks.length > 0)
      .map((item) => ({ slug: item.slug, links: item.suspiciousInternalLinks })),
    suspiciousRelatedTools: inventory
      .filter((item) => !item.relatedTool.routeExists)
      .map((item) => ({ slug: item.slug, seriesId: item.seriesId, href: item.relatedTool.href })),
  },
  metadataAudit: {
    missingUpdatedAtSlugs: inventory.filter((item) => !item.updatedAt).map((item) => item.slug),
    missingReferencesSlugs: inventory.filter((item) => item.references.length === 0).map((item) => item.slug),
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
    unknownSourceSlugs,
    allSourcesResolved: unknownSourceSlugs.length === 0,
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
  pilotAudit: report.pilotAudit,
  rolloutAudit: report.rolloutAudit,
  collisionCounts: Object.fromEntries(
    Object.entries(report.collisions).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
  ),
  genericOrReusedCovers: report.visualAudit.genericOrReusedCoverSlugs.length,
  nonTs500BelowTwoRealVisuals: report.visualAudit.nonTs500BelowTwoRealVisuals.length,
  oldRouteSourceHits: report.linkAudit.oldRouteSourceHits.length,
  invalidRelatedSlugArticles: report.linkAudit.invalidRelatedSlugArticles.length,
  suspiciousInternalLinkArticles: report.linkAudit.suspiciousInternalLinkArticles.length,
  suspiciousInternalLinkDetails: report.linkAudit.suspiciousInternalLinkArticles,
  suspiciousRelatedTools: report.linkAudit.suspiciousRelatedTools.length,
  missingUpdatedAt: report.metadataAudit.missingUpdatedAtSlugs.length,
  missingReferences: report.metadataAudit.missingReferencesSlugs.length,
  authorAudit: report.authorAudit,
  encodingSuspicionCount: report.encodingAudit.suspiciousSlugs.length,
}, null, 2));

if (
  !report.sourceAudit.allSourcesResolved ||
  !report.pilotAudit.allConfiguredPilotsResolved ||
  !report.rolloutAudit.allConfiguredRolloutResolved
) process.exitCode = 2;
