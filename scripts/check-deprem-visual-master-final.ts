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

const deprem = getArticleList().filter((article) => article.sectionId === "deprem-yonetmelik" && article.image.startsWith("/deprem-visual/"));
if (deprem.length !== EXPECTED_TOPICS) fail(`Konu say覺s覺 ${EXPECTED_TOPICS} olmal覺; bulunan ${deprem.length}.`);
const ts500 = deprem.filter((article) => TS500_SLUGS.has(article.slug));
if (ts500.length !== EXPECTED_TS500) fail(`TS500 konu say覺s覺 ${EXPECTED_TS500} olmal覺; bulunan ${ts500.length}.`);

const hashes = new Map<string, string[]>();
const covers = new Set<string>();
let checkedAssets = 0;
for (const article of deprem) {
  const cover = assetPath(article.slug, "cover");
  const diagram = assetPath(ar飩吼兗