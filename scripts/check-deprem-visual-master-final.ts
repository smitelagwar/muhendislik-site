import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseBlocks } from "../src/lib/article-blocks";
import { getArticleList } from "../src/lib/articles-data";
import { TS500_SLUGS } from "../src/lib/ts500-content";

const ROOT = process.cwd();
const EXPECTED_TOPICS = 164;
const EXPECTED_TS500 = 21;
const EXPECTED_ASSETS = 328;
const errors: string[] = [];

function fail(message: string) { errors.push(message); }
function assetPath(slug: string, kind: "cover" | "diagram") { return `/deprem-visual/${slug}/${kind}.svg`; }
function diskPath(src: string) { return path.resolve(ROOT, "public", src.replace(/^\//, "")); }
function readAsset(src: string) {
  const p = diskPath(src);
  if (!fs.existsSync(p)) { fail(`Asset yok: ${src}`); return ""; }
  return fs.readFileSync(p, "utf8");
}

const deprem = getArticleList().filter((article) => article.sectionId === "deprem-yonetmelik");
if (deprem.length !== EXPECTED_TOPICS) fail(`Konu sayısı ${EXPECTED_TOPICS} olmalı; bulunan ${deprem.length}.`);
const ts500 = deprem.filter((article) => TS500_SLUGS.has(article.slug));
if (ts500.length !== EXPECTED_TS500) fail(`TS500 konu sayısı ${EXPECTED_TS500} olmalı; bulunan ${ts500.length}.`);

const hashes = new Map<string, string[]>();
const covers = new Set<string>();
let checkedAssets = 0;
for (const article of deprem) {
  const cover = assetPath(article.slug, "cover");
  const diagram = assetPath(article.slug, "diagram");
  if (article.image !== cover) fail(`Hero cover master path değil: ${article.slug} -> ${article.image}`);
  if (covers.has(article.image)) fail(`Cover tekrar kullanılıyor: ${article.image}`);
  covers.add(article.image);

  const blocks = article.sections.flatMap((section) => parseBlocks(section.content));
  const bodyImages = blocks.filter((block) => block.type === "image");
  const diagramBlock = bodyImages.find((block) => block.type === "image" && block.src === diagram);
  if (!diagramBlock || diagramBlock.type !== "image") fail(`Makale içi diagram bağlı değil: ${article.slug}`);
  else {
    if (!diagramBlock.alt.trim()) fail(`Diagram alt boş: ${article.slug}`);
    if (!diagramBlock.caption.trim()) fail(`Diagram caption boş: ${article.slug}`);
    if (diagramBlock.src === article.image) fail(`Cover ve diagram aynı path: ${article.slug}`);
  }

  for (const src of [cover, diagram]) {
    const content = readAsset(src);
    if (!content) continue;
    checkedAssets += 1;
    if (!/<svg\b/.test(content) || !/width="1600"/.test(content) || !/height="900"/.test(content) || !/viewBox="0 0 1600 900"/.test(content)) fail(`SVG 1600x900 / 16:9 kontratı bozuk: ${src}`);
    if (/\{[A-Z][A-Z_]*\}/.test(content) || /\b(?:TODO|LOREM|PLACEHOLDER)\b/i.test(content)) fail(`Placeholder token bulundu: ${src}`);
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    hashes.set(hash, [...(hashes.get(hash) ?? []), src]);
  }
}
if (checkedAssets !== EXPECTED_ASSETS) fail(`Gerçek hedef asset sayısı ${EXPECTED_ASSETS} olmalı; çözümlenen ${checkedAssets}.`);
for (const [hash, paths] of hashes) if (paths.length > 1) fail(`Exact duplicate asset: ${hash.slice(0, 12)} -> ${paths.join(", ")}`);
if (errors.length) {
  console.error("[master görsel QA] FAIL");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}
console.log(JSON.stringify({ status: "ok", topics: deprem.length, ts500Topics: ts500.length, assets: checkedAssets, uniqueCovers: covers.size, exactDuplicateHashes: 0, dimensions: "1600x900", articleIntegration: "hero cover + body diagram + alt + caption" }, null, 2));
