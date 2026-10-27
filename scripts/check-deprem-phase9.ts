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
const depremArticles = articles.filter((article) => article.sectionId === "depre¶»§q«^