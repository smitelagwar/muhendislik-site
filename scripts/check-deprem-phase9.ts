import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { getDepremRolloutSpec, getDepremRolloutVisualPath } from "../src/lib/deprem-rollout";
import { SITE_SECTIONS } from "../src/lib/site-sections";
import { TOOLS } from "../src/lib/tools-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const OLD_TOOL_PREFIX = "/deprem-yonetmelik/araclar/";
const errors: string[] = [];
const assert = (condition: unknown, message: string) => { if (!condition) errors.push(message); };

function read(relativePath: string) {
  return fs.readFileSync(path.resolve(ROOT, relativePath), "utf8");
}

function walk(relativePath: string): string[] {
  const absolute = path.resolve(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relativePath, entry.name).replaceAll("\\", "/");
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function extractInternalLinks(text: string) {
  const links = new Set<string>();
  for (const pattern of [/(?<!!)\[[^\]]+\]\((\/[^)\s]+)\)/g, /href=["'](\/[^"']+)["']/g]) {
    for (const match of text.matchAll(pattern)) links.add(match[1]);
  }
  return [...links];
}

const articles = getArticleList();
const depremArticles = articles.filter((article) => article.sectionId === "deprem-yonetmelik");
const targets = depremArticles.filter((article) => !TS500_SLUGS.has(article.slug));
const articleSlugs = new Set(articles.map((article) => article.slug));
const knownRoutes = new Set(SITE_SECTIONS.map((section) => section.href.replace(/\/$/, "") || "/"));
for (const tool of TOOLS) knownRoutes.add(tool.href.replace(/\/$/, "") || "/");
for (const pageFile of walk("src/app").filter((file) => file === "src/app/page.tsx" || file.endsWith("/page.tsx"))) {
  const route = pageFile.replace(/^src\/app\/?/, "").replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  if (!route.includes("[")) knownRoutes.add(route ? `/${route}` : "/");
}

function routeExists(href: string) {
  const clean = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  return knownRoutes.has(clean) || (/^\/[^/]+$/.test(clean) && articleSlugs.has(clean.slice(1)));
}

function localAssetExists(src: string, slug: string) {
  if (!src.startsWith("/")) return true;
  if (src.startsWith("/deprem-visual/")) {
    const spec = getDepremRolloutSpec(slug);
    if (!spec) return false;
    return src === getDepremRolloutVisualPath(slug, "cover") || src === getDepremRolloutVisualPath(slug, "diagram");
  }
  const clean = src.split(/[?#]/)[0];
  return fs.existsSync(path.resolve(ROOT, "public", clean.replace(/^\//, "")));
}

assert(depremArticles.length === 164, `FAZ 9 deprem makale sayısı 164 değil: ${depremArticles.length}`);
assert(targets.length === 143, `FAZ 9 TS500 dışı hedef sayısı 143 değil: ${targets.length}`);

for (const article of targets) {
  assert(localAssetExists(article.image, article.slug), `Cover asset çözümlenemiyor: ${article.slug} -> ${article.image}`);
  const text = article.sections.map((section) => section.content).join("\n");
  assert(!text.includes(OLD_TOOL_PREFIX), `Eski araç route'u makale gövdesinde kaldı: ${article.slug}`);

  for (const href of extractInternalLinks(text)) {
    assert(routeExists(href), `İç link route'u çözümlenemiyor: ${article.slug} -> ${href}`);
  }
  for (const relatedSlug of article.relatedSlugs) {
    assert(articleSlugs.has(relatedSlug), `Related slug çözümlenemiyor: ${article.slug} -> ${relatedSlug}`);
  }

  const images = article.sections.flatMap((section) => parseBlocks(section.content)).filter((block) => block.type === "image");
  for (const image of images) {
    if (image.type !== "image") continue;
    assert(localAssetExists(image.src, article.slug), `Body image asset çözümlenemiyor: ${article.slug} -> ${image.src}`);
    assert(Boolean(image.alt.trim()), `Body image alt eksik: ${article.slug}`);
    assert(Boolean(image.caption.trim()), `Body image caption eksik: ${article.slug}`);
  }
}

const articleClientSource = read("src/components/article-client.tsx");
assert(articleClientSource.includes("function TableViewer"), "TableViewer renderer bulunamadı.");
assert(articleClientSource.includes('className="overflow-x-auto"'), "Tablo/formül yatay taşma koruması görünmüyor.");
assert(articleClientSource.includes("dark:"), "Makale renderer dark-mode sınıfları içermiyor.");
assert(articleClientSource.includes("ArticleFigure"), "Makale görsel renderer bulunamadı.");

const smokeSource = read("scripts/site-smoke-test.mjs");
assert(smokeSource.includes("process.exit(1)"), "Sitemap smoke testi hata halinde non-zero çıkmıyor.");
assert(smokeSource.includes("failedStatuses") && smokeSource.includes("pagesWithErrors"), "Sitemap smoke testi HTTP/runtime hata kümelerini denetlemiyor.");

const workflowSource = read(".github/workflows/deprem-content-infrastructure.yml");
for (const command of [
  "npm run check:deprem-content",
  "npm run check:content-quality",
  "npm run check:site-quality",
  "npm run check:navigation",
  "npm run check:visual-system",
  "npx tsc --noEmit",
  "npm run build",
  "npm run check:smoke",
]) {
  assert(workflowSource.includes(command), `FAZ 9 workflow komutu eksik: ${command}`);
}

// The master plan requires a lint release gate. A clean repository may use the
// full `npm run lint` command. While unrelated historical lint debt exists, the
// PR workflow may instead lint every JS/TS file changed against the real base.
// Accept the scoped form only when the complete baseline/diff/eslint contract
// is present; a label or comment alone is not sufficient to satisfy FAZ 9.
const hasFullLintGate = workflowSource.includes("npm run lint");
const hasChangedFileLintGate = [
  "Resolve lint baseline",
  "Lint changed source files",
  "git diff --name-only --diff-filter=ACMR",
  'npx eslint "${FILES[@]}"',
].every((token) => workflowSource.includes(token));
assert(hasFullLintGate || hasChangedFileLintGate, "FAZ 9 workflow lint kalite kapısı eksik.");

for (const gate of [
  "FAZ 7 responsive render QA",
  "FAZ 8 global editorial and IA contract",
  "FAZ 9 release contract",
  "Sitemap smoke crawl",
]) {
  assert(workflowSource.includes(gate), `FAZ 9 workflow kalite kapısı eksik: ${gate}`);
}
assert(/timeout-minutes:\s*(?:6[0-9]|[7-9][0-9]|[1-9][0-9]{2,})/.test(workflowSource), "Release workflow timeout en az 60 dakika olmalı.");

if (errors.length > 0) {
  console.error("FAZ 9 release kalite kapısı başarısız:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  status: "ok",
  phase: "FAZ 9 — Release kalite kapısı",
  depremArticles: depremArticles.length,
  targetArticles: targets.length,
  assetCheck: "cover + body figures",
  linkCheck: "relatedSlugs + inline internal routes",
  smokeCheck: "sitemap HTTP + browser runtime failures",
  layoutContracts: ["responsive overflow", "dark mode", "figure renderer"],
  lintGate: hasFullLintGate ? "full repository lint" : "changed JS/TS files against actual base",
  requiredReleaseCommands: 9,
}, null, 2));
