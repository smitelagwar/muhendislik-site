import fs from "node:fs";
import path from "node:path";
import { getArticleList, type ArticleData } from "../src/lib/articles-data";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleAuthorPresentation } from "../src/lib/content-author";
import { normalizeExistingDepremArticle } from "../src/lib/deprem-existing-overrides";
import { DEPREM_PHASE3_ARTICLES, DEPREM_PHASE3_SLUGS } from "../src/lib/deprem-phase3-articles";
import { DEPREM_PHASE4_ARTICLES, DEPREM_PHASE4_SLUGS } from "../src/lib/deprem-phase4-articles";
import { DEPREM_PHASE5_ARTICLES, DEPREM_PHASE5_SLUGS } from "../src/lib/deprem-phase5-articles";
import { DEPREM_PHASE6_ARTICLES, DEPREM_PHASE6_SLUGS } from "../src/lib/deprem-phase6-articles";
import { DEPREM_PHASE7_ARTICLES, DEPREM_PHASE7_SLUGS, PHASE7_C1_VISUAL_CARRY_FORWARD } from "../src/lib/deprem-phase7-articles";
import { DEPREM_PILOT_ARTICLES, DEPREM_PILOT_SLUGS } from "../src/lib/deprem-pilot-articles";
import {
  DEPREM_ROLLOUT_ARTICLES,
  DEPREM_ROLLOUT_BATCHES,
  DEPREM_ROLLOUT_SLUGS,
  getDepremRolloutSpec,
  type DepremRolloutBatch,
} from "../src/lib/deprem-rollout";
import { DEPREM_TOPIC_ARTICLES } from "../src/lib/deprem-topic-articles";
import { DEPREM_SERIES, getDepremSeriesForArticle } from "../src/lib/deprem-series";
import { SITE_SECTIONS } from "../src/lib/site-sections";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_ARTICLES, TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const RUNTIME_ASSEMBLER = "src/lib/articles-data.ts";
const DATA_PATH = "src/lib/data.json";
const PHASE3_PATH = "src/lib/deprem-phase3-articles.ts";
const PHASE4_PATH = "src/lib/deprem-phase4-articles.ts";
const PHASE5_PATH = "src/lib/deprem-phase5-articles.ts";
const PHASE6_PATH = "src/lib/deprem-phase6-articles.ts";
const PHASE7_PATH = "src/lib/deprem-phase7-articles.ts";
const PILOT_PATH = "src/lib/deprem-pilot-articles.ts";
const ROLLOUT_PATH = "src/lib/deprem-rollout.ts";
const TOPIC_PATH = "src/lib/deprem-topic-articles.ts";
const NORMALIZER_PATH = "src/lib/deprem-existing-overrides.ts";
const TS500_DIR = "src/lib/ts500-content";
const TARGET_AUTHOR = "İnşaat Mühendisi Hüseyin GÜNAYDIN";
const TARGET_INITIALS = "HG";
const OLD_TOOL_PREFIX = "/deprem-yonetmelik/araclar/";
const GENERIC_IMAGE_PATTERN = /\/covers\/yonetmelik\.svg$|generic|placeholder|default/i;
const PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS = new Set<string>([PHASE7_C1_VISUAL_CARRY_FORWARD.slug]);

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
  const isPhase3 = DEPREM_PHASE3_SLUGS.has(article.slug);
  const isPhase4 = DEPREM_PHASE4_SLUGS.has(article.slug);
  const isPhase5 = DEPREM_PHASE5_SLUGS.has(article.slug);
  const isPhase6 = DEPREM_PHASE6_SLUGS.has(article.slug);
  const isPhase7 = DEPREM_PHASE7_SLUGS.has(article.slug);
  const isPhase7PilotVisualCarryForward = isPilot && isPhase7 && PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.has(article.slug);
  const rolloutSpec = getDepremRolloutSpec(article.slug);
  const isRollout = DEPREM_ROLLOUT_SLUGS.has(article.slug);
  const isTopic = topicBySlug.has(article.slug);
  const bodyChangedByNormalizer = Boolean(
    rawArticle && JSON.stringify(rawArticle.sections) !== JSON.stringify(normalizeExistingDepremArticle(rawArticle).sections),
  );

  let sourceOfTruth: {
    kind: "ts500-content" | "deprem-pilot-articles" | "deprem-phase3-articles" | "deprem-phase4-articles" | "deprem-phase5-articles" | "deprem-phase6-articles" | "deprem-phase7-articles" | "deprem-topic-articles" | "legacy-normalized" | "unknown";
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
  } else if (isPhase7PilotVisualCarryForward) {
    sourceOfTruth = {
      kind: "deprem-phase7-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE7_PATH,
      metadata: PHASE7_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
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
  } else if (isPhase3) {
    sourceOfTruth = {
      kind: "deprem-phase3-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE3_PATH,
      metadata: PHASE3_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else if (isPhase4) {
    sourceOfTruth = {
      kind: "deprem-phase4-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE4_PATH,
      metadata: PHASE4_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else if (isPhase5) {
    sourceOfTruth = {
      kind: "deprem-phase5-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE5_PATH,
      metadata: PHASE5_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else if (isPhase6) {
    sourceOfTruth = {
      kind: "deprem-phase6-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE6_PATH,
      metadata: PHASE6_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
    };
  } else if (isPhase7) {
    sourceOfTruth = {
      kind: "deprem-phase7-articles",
      runtimeAssembler: RUNTIME_ASSEMBLER,
      seed: isTopic ? TOPIC_PATH : rawArticle ? DATA_PATH : null,
      body: PHASE7_PATH,
      metadata: PHASE7_PATH,
      enhancement: isRollout ? ROLLOUT_PATH : null,
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
const pilotPrimarySourceInventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-pilot-articles");
const pilotVisualCarryForwardInventory = inventory.filter((item) => PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.has(item.slug));
const pilotInventory = inventory.filter((item) =>
  item.sourceOfTruth.kind === "deprem-pilot-articles" || PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.has(item.slug),
);
const phase3Inventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-phase3-articles");
const phase4Inventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-phase4-articles");
const phase5Inventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-phase5-articles");
const phase6Inventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-phase6-articles");
const phase7Inventory = inventory.filter((item) => item.sourceOfTruth.kind === "deprem-phase7-articles");
const rolloutInventory = inventory.filter((item) => item.rolloutBatch !== null);
const rolloutBatchIds = Object.keys(DEPREM_ROLLOUT_BATCHES).map(Number) as DepremRolloutBatch[];
const rolloutBatchAudit = Object.fromEntries(
  rolloutBatchIds.map((batch) => {
    const configuredSpecs = DEPREM_ROLLOUT_BATCHES[batch];
    const configuredSlugs = new Set(configuredSpecs.map((spec) => spec.slug));
    const enhanced = rolloutInventory.filter((item) => item.rolloutBatch === batch);
    const missingRuntimeSlugs = [...configuredSlugs].filter((slug) => !allArticleSlugs.has(slug));
    return [`batch${batch}`, {
      configured: configuredSpecs.length,
      enhanced: enhanced.length,
      missingRuntimeSlugs,
    }];
  }),
);

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
const missingPhase3RuntimeSlugs = [...DEPREM_PHASE3_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingPhase4RuntimeSlugs = [...DEPREM_PHASE4_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingPhase5RuntimeSlugs = [...DEPREM_PHASE5_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingPhase6RuntimeSlugs = [...DEPREM_PHASE6_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const missingPhase7RuntimeSlugs = [...DEPREM_PHASE7_SLUGS].filter((slug) => !allArticleSlugs.has(slug));
const phase7PilotOverlapSlugs = [...DEPREM_PHASE7_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug));
const phase7AllowedPilotVisualCarryForwardSlugs = phase7PilotOverlapSlugs.filter((slug) => PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.has(slug));
const phase7UnexpectedPilotCollisionSlugs = phase7PilotOverlapSlugs.filter((slug) => !PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.has(slug));
const canonicalAuthorPresentation = getArticleAuthorPresentation({
  sectionId: "deprem-yonetmelik",
  author: TARGET_AUTHOR,
  authorTitle: "",
});
const allConfiguredRolloutResolved =
  Object.values(rolloutBatchAudit).every((batch) => batch.missingRuntimeSlugs.length === 0 && batch.configured === batch.enhanced) &&
  rolloutInventory.length === DEPREM_ROLLOUT_ARTICLES.length;
const allConfiguredPilotsResolved =
  missingPilotRuntimeSlugs.length === 0 && pilotInventory.length === DEPREM_PILOT_ARTICLES.length;
const allConfiguredPhase3Resolved =
  missingPhase3RuntimeSlugs.length === 0 && phase3Inventory.length === DEPREM_PHASE3_ARTICLES.length;
const allConfiguredPhase4Resolved =
  missingPhase4RuntimeSlugs.length === 0 && phase4Inventory.length === DEPREM_PHASE4_ARTICLES.length;
const allConfiguredPhase5Resolved =
  missingPhase5RuntimeSlugs.length === 0 && phase5Inventory.length === DEPREM_PHASE5_ARTICLES.length;
const allConfiguredPhase6Resolved =
  missingPhase6RuntimeSlugs.length === 0 && phase6Inventory.length === DEPREM_PHASE6_ARTICLES.length;
const allConfiguredPhase7Resolved =
  missingPhase7RuntimeSlugs.length === 0 &&
  phase7Inventory.length === DEPREM_PHASE7_ARTICLES.length &&
  phase7UnexpectedPilotCollisionSlugs.length === 0 &&
  phase7AllowedPilotVisualCarryForwardSlugs.length === PHASE7_PILOT_VISUAL_CARRY_FORWARD_SLUGS.size;

const report = {
  schemaVersion: 14,
  generatedAt: new Date().toISOString(),
  repo: "smitelagwar/muhendislik-site",
  scope: "FAZ 0/2 envanteri + FAZ 3/4/5/6/7 teknik source-of-truth + rollout enhancement",
  invariants: {
    targetAuthor: TARGET_AUTHOR,
    targetInitials: TARGET_INITIALS,
    runtimePresentedInitialsForTargetAuthor: canonicalAuthorPresentation.monogram,
    registeredToolRouteCount: TOOLS.length,
    phase7PilotVisualCarryForwardSlug: PHASE7_C1_VISUAL_CARRY_FORWARD.slug,
  },
  counts: {
    totalDepremYonetmelik: inventory.length,
    ts500: inventory.filter((item) => item.seriesId === "ts500").length,
    nonTs500Target: nonTs500.length,
    rawDataDepremRecords: rawDepremArticles.length,
    depremTopicArticles: DEPREM_TOPIC_ARTICLES.length,
    depremPilotArticles: DEPREM_PILOT_ARTICLES.length,
    pilotInventoryArticles: pilotInventory.length,
    pilotPrimarySourceArticles: pilotPrimarySourceInventory.length,
    pilotVisualCarryForwardArticles: pilotVisualCarryForwardInventory.length,
    depremPhase3Articles: DEPREM_PHASE3_ARTICLES.length,
    phase3InventoryArticles: phase3Inventory.length,
    depremPhase4Articles: DEPREM_PHASE4_ARTICLES.length,
    phase4InventoryArticles: phase4Inventory.length,
    depremPhase5Articles: DEPREM_PHASE5_ARTICLES.length,
    phase5InventoryArticles: phase5Inventory.length,
    depremPhase6Articles: DEPREM_PHASE6_ARTICLES.length,
    phase6InventoryArticles: phase6Inventory.length,
    depremPhase7Articles: DEPREM_PHASE7_ARTICLES.length,
    phase7InventoryArticles: phase7Inventory.length,
    rolloutArticles: DEPREM_ROLLOUT_ARTICLES.length,
    rolloutInventoryArticles: rolloutInventory.length,
    rolloutBatches: Object.fromEntries(
      rolloutBatchIds.map((batch) => [batch, {
        configured: DEPREM_ROLLOUT_BATCHES[batch].length,
        enhanced: rolloutInventory.filter((item) => item.rolloutBatch === batch).length,
      }]),
    ),
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
    phase3VsTs500: [...DEPREM_PHASE3_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    phase3VsPilot: [...DEPREM_PHASE3_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
    phase4VsTs500: [...DEPREM_PHASE4_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    phase4VsPilot: [...DEPREM_PHASE4_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
    phase4VsPhase3: [...DEPREM_PHASE4_SLUGS].filter((slug) => DEPREM_PHASE3_SLUGS.has(slug)),
    phase5VsTs500: [...DEPREM_PHASE5_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    phase5VsPilot: [...DEPREM_PHASE5_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
    phase5VsPhase3: [...DEPREM_PHASE5_SLUGS].filter((slug) => DEPREM_PHASE3_SLUGS.has(slug)),
    phase5VsPhase4: [...DEPREM_PHASE5_SLUGS].filter((slug) => DEPREM_PHASE4_SLUGS.has(slug)),
    phase6VsTs500: [...DEPREM_PHASE6_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    phase6VsPilot: [...DEPREM_PHASE6_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
    phase6VsPhase3: [...DEPREM_PHASE6_SLUGS].filter((slug) => DEPREM_PHASE3_SLUGS.has(slug)),
    phase6VsPhase4: [...DEPREM_PHASE6_SLUGS].filter((slug) => DEPREM_PHASE4_SLUGS.has(slug)),
    phase6VsPhase5: [...DEPREM_PHASE6_SLUGS].filter((slug) => DEPREM_PHASE5_SLUGS.has(slug)),
    phase7VsTs500: [...DEPREM_PHASE7_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    phase7VsPilot: phase7UnexpectedPilotCollisionSlugs,
    phase7VsPilotAllowedVisualCarryForward: phase7AllowedPilotVisualCarryForwardSlugs,
    phase7VsPhase3: [...DEPREM_PHASE7_SLUGS].filter((slug) => DEPREM_PHASE3_SLUGS.has(slug)),
    phase7VsPhase4: [...DEPREM_PHASE7_SLUGS].filter((slug) => DEPREM_PHASE4_SLUGS.has(slug)),
    phase7VsPhase5: [...DEPREM_PHASE7_SLUGS].filter((slug) => DEPREM_PHASE5_SLUGS.has(slug)),
    phase7VsPhase6: [...DEPREM_PHASE7_SLUGS].filter((slug) => DEPREM_PHASE6_SLUGS.has(slug)),
    rolloutVsTs500: [...DEPREM_ROLLOUT_SLUGS].filter((slug) => TS500_SLUGS.has(slug)),
    rolloutVsPilot: [...DEPREM_ROLLOUT_SLUGS].filter((slug) => DEPREM_PILOT_SLUGS.has(slug)),
  },
  pilotAudit: {
    configuredSlugs: [...DEPREM_PILOT_SLUGS],
    sourceOfTruthSlugs: pilotInventory.map((item) => item.slug),
    primarySourceSlugs: pilotPrimarySourceInventory.map((item) => item.slug),
    phase7VisualCarryForwardSlugs: pilotVisualCarryForwardInventory.map((item) => item.slug),
    expectedVisualCarryForwardPath: PILOT_PATH,
    missingRuntimeSlugs: missingPilotRuntimeSlugs,
    allConfiguredPilotsResolved,
  },
  phase3Audit: {
    configuredSlugs: [...DEPREM_PHASE3_SLUGS],
    sourceOfTruthSlugs: phase3Inventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPhase3RuntimeSlugs,
    expectedBodyPath: PHASE3_PATH,
    expectedSeedPath: TOPIC_PATH,
    expectedEnhancementPath: ROLLOUT_PATH,
    allConfiguredPhase3Resolved,
  },
  phase4Audit: {
    configuredSlugs: [...DEPREM_PHASE4_SLUGS],
    sourceOfTruthSlugs: phase4Inventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPhase4RuntimeSlugs,
    expectedBodyPath: PHASE4_PATH,
    expectedSeedPath: TOPIC_PATH,
    expectedEnhancementPath: ROLLOUT_PATH,
    allConfiguredPhase4Resolved,
  },
  phase5Audit: {
    configuredSlugs: [...DEPREM_PHASE5_SLUGS],
    sourceOfTruthSlugs: phase5Inventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPhase5RuntimeSlugs,
    expectedBodyPath: PHASE5_PATH,
    expectedSeedPath: DATA_PATH,
    expectedEnhancementPath: ROLLOUT_PATH,
    allConfiguredPhase5Resolved,
  },
  phase6Audit: {
    configuredSlugs: [...DEPREM_PHASE6_SLUGS],
    sourceOfTruthSlugs: phase6Inventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPhase6RuntimeSlugs,
    expectedBodyPath: PHASE6_PATH,
    expectedSeedPath: DATA_PATH,
    expectedEnhancementPath: ROLLOUT_PATH,
    allConfiguredPhase6Resolved,
  },
  phase7Audit: {
    configuredSlugs: [...DEPREM_PHASE7_SLUGS],
    sourceOfTruthSlugs: phase7Inventory.map((item) => item.slug),
    missingRuntimeSlugs: missingPhase7RuntimeSlugs,
    expectedBodyPath: PHASE7_PATH,
    expectedSeedPaths: [DATA_PATH, TOPIC_PATH],
    expectedEnhancementPath: ROLLOUT_PATH,
    allowedPilotVisualCarryForwardSlugs: phase7AllowedPilotVisualCarryForwardSlugs,
    unexpectedPilotCollisionSlugs: phase7UnexpectedPilotCollisionSlugs,
    allConfiguredPhase7Resolved,
  },
  rolloutAudit: {
    configuredSlugs: [...DEPREM_ROLLOUT_SLUGS],
    enhancedSlugs: rolloutInventory.map((item) => item.slug),
    batches: rolloutBatchAudit,
    allConfiguredRolloutResolved,
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
  phase3Audit: report.phase3Audit,
  phase4Audit: report.phase4Audit,
  phase5Audit: report.phase5Audit,
  phase6Audit: report.phase6Audit,
  phase7Audit: report.phase7Audit,
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
  !report.phase3Audit.allConfiguredPhase3Resolved ||
  !report.phase4Audit.allConfiguredPhase4Resolved ||
  !report.phase5Audit.allConfiguredPhase5Resolved ||
  !report.phase6Audit.allConfiguredPhase6Resolved ||
  !report.phase7Audit.allConfiguredPhase7Resolved ||
  !report.rolloutAudit.allConfiguredRolloutResolved
) process.exitCode = 2;
