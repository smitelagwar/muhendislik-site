import { readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "../../../content/regulations/tbdy-2018/manifest.json";

/** Source-linked, automatically extracted text. Not a verified engineering reference. */
export const TBDY_MANIFEST = manifest;
export const TBDY_BASE_ROUTE = "/mevzuat/arsiv/tbdy-2018";

export type TbdySection = (typeof manifest.sections)[number];

export function tbdySectionSlug(number: number): string {
  return `bolum-${String(number).padStart(2, "0")}`;
}

export function getTbdySection(slug: string): TbdySection | null {
  if (!/^bolum-(?:0[1-9]|1[0-7])$/.test(slug)) return null;
  return manifest.sections.find((section) => section.sectionId === slug) ?? null;
}

export function getTbdyChapterHref(slug: string): string {
  return `${TBDY_BASE_ROUTE}/bolum/${slug}`;
}

/**
 * In preview/local builds the unverified draft is inspectable.
 * Production is locked until the manifest is explicitly approved.
 * Static chapter routes are generated at build time, not per request.
 */
export function isTbdyDraftVisible(): boolean {
  return process.env.VERCEL_ENV !== "production" || manifest.published === true;
}

export function getTbdyMarkdown(section: TbdySection): string {
  const base = join(process.cwd(), "content", "regulations", "tbdy-2018", "sections");
  const filename = `${section.sectionId}.md`;
  const text = readFileSync(join(base, filename), "utf8");
  if (!text.includes("validationStatus: extracted-unverified")) {
    throw new Error(`Unexpected TBDY extraction metadata: ${filename}`);
  }
  return text;
}

export function stripTbdyFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
}

/** Reading-layer headings do not alter the stored source extraction. */
export function addTbdyClauseAnchors(markdown: string): string {
  const unique = new Set<string>();
  return markdown.split("\n").map((line) => {
    const plain = line.replace(/\s+$/, "");
    const match = plain.match(/^(\d{1,2}(?:\.\d{1,2}){1,3})\.\s+(.{4,140})$/u);
    if (!match || unique.has(match[1])) return line;
    unique.add(match[1]);
    return `### ${match[1]}. ${match[2]}`;
  }).join("\n");
}

export function getTbdyPdfUrl(page: number): string {
  const bounded = Math.max(1, Math.min(manifest.sourcePdfPages, Math.floor(page)));
  return `${manifest.sourceUrl}#page=${bounded}`;
}
