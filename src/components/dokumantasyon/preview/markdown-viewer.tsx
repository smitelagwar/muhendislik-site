// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — OBSİDİAN TARZI MARKDOWN GÖRÜNTÜLEYİCİ
// Collapsible headings, tablolar, kod blokları, TOC, görev listeleri
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Components } from "react-markdown";
import {
  FileText, Code2, Copy, Check, Loader2, AlertCircle,
  BookOpen, Edit3, List, ChevronRight, ChevronDown, Minus, Plus, RotateCcw, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioCommandButton } from "../studio/studio-command-button";
import styles from "./markdown-reader.module.css";

interface DokMarkdownViewerProps {
  accessUrl: string;
  displayName: string;
  onContentChange?: (newContent: string) => void;
}

const READER_PREFS_STORAGE_KEY = "dok-markdown-reader:v1";
const READER_FONT_SCALE_MIN = 0.85;
const READER_FONT_SCALE_MAX = 1.3;
const READER_FONT_SCALE_STEP = 0.05;
const READER_FONT_SCALE_DEFAULT = 1;

type ReaderBackground = "system" | "black" | "white" | "sepia" | "autocad";
type ReaderAccent = "amber" | "blue" | "green" | "violet" | "cyan" | "pink" | `#${string}`;

const READER_BACKGROUND_OPTIONS: Array<{ id: ReaderBackground; label: string }> = [
  { id: "system", label: "Sistem" },
  { id: "black", label: "Siyah" },
  { id: "white", label: "Beyaz" },
  { id: "sepia", label: "Sepya" },
  { id: "autocad", label: "Teknik Lacivert" },
];

const READER_ACCENT_OPTIONS: Array<{ id: Exclude<ReaderAccent, `#${string}`>; label: string; hex: string }> = [
  { id: "amber", label: "Turuncu", hex: "#F59E0B" },
  { id: "blue", label: "Mavi", hex: "#3B82F6" },
  { id: "green", label: "Yeşil", hex: "#10B981" },
  { id: "violet", label: "Mor", hex: "#8B5CF6" },
  { id: "cyan", label: "Turkuaz", hex: "#06B6D4" },
  { id: "pink", label: "Pembe", hex: "#F43F5E" },
];

const READER_BACKGROUND_DEFAULT: ReaderBackground = "system";
const READER_ACCENT_DEFAULT: ReaderAccent = "amber";

function normalizeReaderBackground(value: unknown): ReaderBackground {
  return READER_BACKGROUND_OPTIONS.some((option) => option.id === value)
    ? value as ReaderBackground
    : READER_BACKGROUND_DEFAULT;
}

function normalizeReaderAccent(value: unknown): ReaderAccent {
  if (typeof value !== "string") return READER_ACCENT_DEFAULT;
  if (READER_ACCENT_OPTIONS.some((option) => option.id === value)) return value as ReaderAccent;
  if (/^#[\da-f]{6}$/i.test(value)) return value.toUpperCase() as ReaderAccent;
  return READER_ACCENT_DEFAULT;
}

function resolveReaderAccentHex(accent: ReaderAccent): string {
  if (accent.startsWith("#")) return accent;
  return READER_ACCENT_OPTIONS.find((option) => option.id === accent)?.hex ?? "#F59E0B";
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [0, 2, 4].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16)) as [number, number, number];
}

function relativeLuminance(hex: string): number {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function mixHex(first: string, second: string, amount: number): string {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  const channels = firstRgb.map((channel, index) =>
    Math.round(channel * (1 - amount) + secondRgb[index] * amount)
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function contrastRatio(first: string, second: string): number {
  const luminance = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminance[0] + 0.05) / (luminance[1] + 0.05);
}

function getReadableAccent(accentHex: string, backgroundHexes: string[]): string {
  const hasReadableContrast = (color: string) => backgroundHexes.every((background) => contrastRatio(color, background) >= 4.5);
  if (hasReadableContrast(accentHex)) return accentHex;

  const target = relativeLuminance(backgroundHexes[0]) > 0.5 ? "#000000" : "#FFFFFF";
  let low = 0;
  let high = 1;
  for (let step = 0; step < 24; step++) {
    const middle = (low + high) / 2;
    if (hasReadableContrast(mixHex(accentHex, target, middle))) high = middle;
    else low = middle;
  }
  return mixHex(accentHex, target, high);
}

function getReadableForeground(backgroundHex: string): string {
  return contrastRatio("#000000", backgroundHex) >= contrastRatio("#FFFFFF", backgroundHex)
    ? "#000000"
    : "#FFFFFF";
}

function getReaderCanvasHex(background: ReaderBackground, systemDark: boolean): string {
  switch (background) {
    case "black": return "#0B0D10";
    case "white": return "#FFFFFF";
    case "sepia": return "#F4ECD8";
    case "autocad": return "#101A2A";
    default: return systemDark ? "#0A0A0A" : "#F4F2EC";
  }
}

function getReaderContrastBackgrounds(background: ReaderBackground, systemDark: boolean, accentHex: string): string[] {
  const canvas = getReaderCanvasHex(background, systemDark);
  const surfaces: Record<ReaderBackground, string[]> = {
    system: systemDark ? ["#111111", "#1A1A1A"] : ["#FFFFFF", "#EBE8E0", "#F0EFEB"],
    black: ["#11161C", "#171E27", "#10151B"],
    white: ["#FFFFFF", "#F3F5F7", "#F1F4F7"],
    sepia: ["#FBF7EC", "#EEE4CE", "#E5D9BE"],
    autocad: ["#152235", "#1C2C43", "#142137"],
  };
  return [canvas, ...surfaces[background], mixHex(canvas, accentHex, 0.12)];
}

function normalizeReaderFontScale(value: number): number {
  const clamped = Math.min(READER_FONT_SCALE_MAX, Math.max(READER_FONT_SCALE_MIN, value));
  return Math.round(clamped * 100) / 100;
}

function ReaderAppearanceSettings({
  background,
  accent,
  onBackgroundChange,
  onAccentChange,
}: {
  background: ReaderBackground;
  accent: ReaderAccent;
  onBackgroundChange: (value: ReaderBackground) => void;
  onAccentChange: (value: ReaderAccent) => void;
}) {
  return (
    <div className="mt-3 space-y-4 border-t border-border/60 pt-3">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-foreground">Arka plan</legend>
        <div className={styles.backgroundOptions} role="radiogroup" aria-label="Okuma arka planı">
          {READER_BACKGROUND_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={background === option.id}
              tabIndex={background === option.id ? 0 : -1}
              aria-label={option.label}
              data-testid={`markdown-background-${option.id}`}
              onClick={() => onBackgroundChange(option.id)}
              onKeyDown={(event) => {
                const lastIndex = READER_BACKGROUND_OPTIONS.length - 1;
                let nextIndex: number | null = null;
                if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % READER_BACKGROUND_OPTIONS.length;
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + READER_BACKGROUND_OPTIONS.length) % READER_BACKGROUND_OPTIONS.length;
                if (event.key === "Home") nextIndex = 0;
                if (event.key === "End") nextIndex = lastIndex;
                if (nextIndex === null) return;
                event.preventDefault();
                onBackgroundChange(READER_BACKGROUND_OPTIONS[nextIndex].id);
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='radio']")[nextIndex]?.focus();
              }}
              className={`${styles.backgroundOption} ${background === option.id ? styles.backgroundOptionSelected : ""}`}
            >
              <span className={`${styles.backgroundSample} ${styles[`backgroundSample_${option.id}`]}`} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-foreground">Vurgu rengi</legend>
        <div className={styles.accentOptions} role="group" aria-label="Hazır vurgu renkleri">
          {READER_ACCENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={`Vurgu rengi: ${option.label}`}
              aria-pressed={accent === option.id}
              data-testid={`markdown-accent-${option.id}`}
              onClick={() => onAccentChange(option.id)}
              className={`${styles.accentOption} ${accent === option.id ? styles.accentOptionSelected : ""}`}
              style={{
                "--md-swatch": option.hex,
                "--md-swatch-foreground": getReadableForeground(option.hex),
              } as React.CSSProperties}
            >
              {accent === option.id && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <label className={`${styles.customAccent} mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-foreground`}>
          <span>Özel renk</span>
          <input
            type="color"
            aria-label="Özel vurgu rengi"
            data-testid="markdown-custom-accent"
            value={resolveReaderAccentHex(accent)}
            onChange={(event) => onAccentChange(event.currentTarget.value.toUpperCase() as ReaderAccent)}
            className="h-9 w-12 cursor-pointer rounded-lg border border-border/70 bg-transparent p-1"
          />
        </label>
      </fieldset>
    </div>
  );
}

// ─── Başlıktan anchor ID ──────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── TOC / section heading tarayıcı ───────────────────────────────────────────
interface TocItem { level: number; text: string; id: string; }
interface ParsedHeading extends TocItem {
  lineIndex: number;
  inlineMd: string;
  sourceLine: string;
}

function headingPlainText(inlineMd: string): string {
  return inlineMd
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/[$\\{}]/g, "")
    .trim();
}

function scanMarkdownHeadings(markdown: string): ParsedHeading[] {
  const headings: ParsedHeading[] = [];
  const ids = new Map<string, number>();
  const lines = markdown.split("\n");
  let activeFence: { marker: "`" | "~"; length: number } | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);

    if (fenceMatch) {
      const fence = fenceMatch[1];
      const marker = fence[0] as "`" | "~";
      const suffix = fenceMatch[2];

      if (!activeFence) {
        activeFence = { marker, length: fence.length };
        continue;
      }

      const isClosingFence =
        activeFence.marker === marker &&
        fence.length >= activeFence.length &&
        /^[ \t]*$/.test(suffix);

      if (isClosingFence) {
        activeFence = null;
        continue;
      }
    }

    if (activeFence) continue;

    const headingMatch = /^ {0,3}(#{1,6})[ \t]+(.+?)\s*$/.exec(line);
    if (!headingMatch) continue;

    const level = headingMatch[1].length;
    const inlineMd = headingMatch[2].replace(/[ \t]+#+[ \t]*$/, "").trim();
    const text = headingPlainText(inlineMd);
    const base = slugify(text) || "section";
    const count = (ids.get(base) ?? 0) + 1;
    ids.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;

    headings.push({ lineIndex, level, inlineMd, text, id, sourceLine: line });
  }

  return headings;
}

function extractToc(headings: ParsedHeading[]): TocItem[] {
  return headings.map(({ level, text, id }) => ({ level, text, id }));
}

// ─── Markdown'ı bölümlere ayır ────────────────────────────────────────────────
interface MdSection {
  id: string;
  level: number;        // 1-6
  headingText: string;      // TOC/slug/accessibility için plain text
  headingInlineMd: string;  // başlığın # işaretleri hariç orijinal inline Markdown içeriği
  headingMd: string;        // orijinal #...# satırı
  body: string;         // bu başlıktan sonraki, bir sonraki başlığa kadar olan içerik
}

function splitSections(markdown: string, headings: ParsedHeading[]): { preamble: string; sections: MdSection[] } {
  const lines = markdown.split("\n");
  const headingByLine = new Map(headings.map((heading) => [heading.lineIndex, heading]));
  const sections: MdSection[] = [];
  let preamble = "";
  let current: MdSection | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const heading = headingByLine.get(lineIndex);

    if (heading) {
      if (current) sections.push(current);
      current = {
        id: heading.id,
        level: heading.level,
        headingText: heading.text,
        headingInlineMd: heading.inlineMd,
        headingMd: heading.sourceLine,
        body: "",
      };
    } else {
      if (current) current.body += line + "\n";
      else preamble += line + "\n";
    }
  }

  if (current) sections.push(current);
  return { preamble, sections };
}

// ─── Parent zinciri hesapla ───────────────────────────────────────────────────
function computeParentMap(sections: MdSection[]): Map<string, string | null> {
  const parentMap = new Map<string, string | null>();
  const stack: MdSection[] = [];

  for (const section of sections) {
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    parentMap.set(section.id, stack.length > 0 ? stack[stack.length - 1].id : null);
    stack.push(section);
  }

  return parentMap;
}

function isAncestorCollapsed(
  sectionId: string,
  parentMap: Map<string, string | null>,
  collapsed: Set<string>
): boolean {
  let parentId = parentMap.get(sectionId) ?? null;

  while (parentId) {
    if (collapsed.has(parentId)) return true;
    parentId = parentMap.get(parentId) ?? null;
  }

  return false;
}

// ─── Kod Bloğu ───────────────────────────────────────────────────────────────
function CodeBlock({ children, className }: { children?: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const code = typeof children === "string" ? children : String(children ?? "");
  const lang = className?.replace("language-", "") ?? "";
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no-op */ }
  };
  return (
    <div className={`${styles.codeBlock} group relative overflow-hidden rounded-xl shadow-md`} data-testid="markdown-code-block">
      <div className={`${styles.codeHeader} flex items-center justify-between px-4 py-2`}>
        <span className={`${styles.codeLanguage} font-mono text-[11px] font-semibold uppercase tracking-widest`}>{lang || "kod"}</span>
        <button type="button" onClick={handleCopy} aria-label="Kod bloğunu kopyala" className={`${styles.codeCopyButton} flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all`}>
          {copied ? <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Kopyalandı</span></> : <><Copy className="h-3 w-3" /><span>Kopyala</span></>}
        </button>
      </div>
      <pre className={`${styles.codePre} overflow-x-auto p-4`}><code className={`${styles.codeText} font-mono text-sm leading-relaxed`}>{code}</code></pre>
    </div>
  );
}

const MARKDOWN_REMARK_PLUGINS: NonNullable<React.ComponentProps<typeof ReactMarkdown>["remarkPlugins"]> = [
  remarkGfm,
  remarkMath,
];

const MARKDOWN_REHYPE_PLUGINS: NonNullable<React.ComponentProps<typeof ReactMarkdown>["rehypePlugins"]> = [
  [rehypeKatex, { throwOnError: false, strict: "warn" }],
];

function MarkdownContent({
  markdown,
  components,
  inline = false,
}: {
  markdown: string;
  components: Components;
  inline?: boolean;
}) {
  const renderComponents = inline
    ? { ...components, p: ({ children }: { children?: React.ReactNode }) => <>{children}</> }
    : components;

  return (
    <ReactMarkdown
      remarkPlugins={MARKDOWN_REMARK_PLUGINS}
      rehypePlugins={MARKDOWN_REHYPE_PLUGINS}
      skipHtml={true}
      components={renderComponents}
    >
      {markdown}
    </ReactMarkdown>
  );
}

// ─── Özel renderer bileşenleri (body için — başlıklar ayrı render edildiğinden dışarıda) ──
function buildComponents(accentColor: string): Components {
  return {
    // Body içindeki başlıklar (iç içe markdown varsa — normalde body'de heading olmaz ama fallback)
    h1: ({ children }) => <h1 className={`${styles.fallbackHeading} ${styles.headingLevel1}`}>{children}</h1>,
    h2: ({ children }) => <h2 className={`${styles.fallbackHeading} ${styles.headingLevel2}`}>{children}</h2>,
    h3: ({ children }) => <h3 className={`${styles.fallbackHeading} ${styles.headingLevel3}`}>{children}</h3>,
    h4: ({ children }) => <h4 className={`${styles.fallbackHeading} ${styles.headingLevel4}`}>{children}</h4>,
    h5: ({ children }) => <h5 className={`${styles.fallbackHeading} ${styles.headingLevel5}`}>{children}</h5>,
    h6: ({ children }) => <h6 className={`${styles.fallbackHeading} ${styles.headingLevel6}`}>{children}</h6>,
    p: ({ children }) => <p data-testid="markdown-paragraph" className={`${styles.paragraph} text-foreground/90`}>{children}</p>,
    a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} style={{ color: accentColor }} className={`${styles.markdownLink} font-medium underline underline-offset-2`}>{children}</a>,
    code: ({ children, className }) => {
      if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
      return <code data-testid="markdown-inline-code" style={{ color: accentColor }} className={`${styles.inlineCode} rounded-md font-mono font-medium`}>{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <blockquote className={`${styles.blockquote} rounded-r-xl border-l-4 italic text-muted-foreground`}>{children}</blockquote>,
    ul: ({ children }) => <ul className={`${styles.unorderedList} list-none`}>{children}</ul>,
    ol: ({ children }) => <ol className={`${styles.orderedList} list-none`}>{children}</ol>,
    li: ({ children }) => (
      <li className={`${styles.listItem} flex items-start text-foreground/90`}>
        <span className={styles.listMarker} aria-hidden="true" />
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    ),
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return <span data-checked={checked ? "true" : "false"} className={`${styles.taskCheckbox} mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border align-middle`}>{checked && <Check className="h-3 w-3" />}</span>;
    },
    hr: () => <hr className={`${styles.rule} border-0 border-t`} />,
    table: ({ children }) => <div className={`${styles.tableWrap} overflow-x-auto rounded-xl shadow-sm`}><table className={`${styles.table} w-full border-collapse`}>{children}</table></div>,
    thead: ({ children }) => <thead className={`${styles.tableHead} font-bold uppercase text-muted-foreground`}>{children}</thead>,
    tbody: ({ children }) => <tbody className={styles.tableBody}>{children}</tbody>,
    tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
    th: ({ children }) => <th className={`${styles.tableHeader} text-left font-bold`}>{children}</th>,
    td: ({ children }) => <td className={`${styles.tableCell} text-foreground/85`}>{children}</td>,
    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
    del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
    img: ({ src, alt }) => (
      <span className={`${styles.imageWrap} block`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="max-w-full rounded-xl border border-border/60 shadow-md" loading="lazy" />
        {alt && <span className="mt-2 block text-center text-xs italic text-muted-foreground">{alt}</span>}
      </span>
    ),
  };
}

// ─── Collapsible Heading başlık elemanı ──────────────────────────────────────
const HEADING_STYLES: Record<number, string> = {
  1: styles.headingLevel1,
  2: styles.headingLevel2,
  3: styles.headingLevel3,
  4: styles.headingLevel4,
  5: styles.headingLevel5,
  6: styles.headingLevel6,
};

function SectionHeadingText({
  level,
  children,
}: {
  level: number;
  children: React.ReactNode;
}) {
  const className = "min-w-0 flex-1 text-foreground";
  switch (level) {
    case 1: return <h1 className={className}>{children}</h1>;
    case 2: return <h2 className={className}>{children}</h2>;
    case 3: return <h3 className={className}>{children}</h3>;
    case 4: return <h4 className={className}>{children}</h4>;
    case 5: return <h5 className={className}>{children}</h5>;
    default: return <h6 className={className}>{children}</h6>;
  }
}

function CollapsibleSection({
  section,
  isCollapsed,
  isHidden,
  onToggle,
  components,
}: {
  section: MdSection;
  isCollapsed: boolean;
  isHidden: boolean;
  onToggle: () => void;
  components: Components;
}) {
  if (isHidden) return null;

  const headingStyle = HEADING_STYLES[section.level] ?? HEADING_STYLES[6];
  const hasBody = section.body.trim().length > 0;
  const bodyId = `${section.id}-content`;

  return (
    <section className={styles.section} data-md-section-level={section.level}>
      {/* Başlık + Chevron */}
      <div
        id={section.id}
        className={`${styles.heading} group scroll-mt-20 flex items-center gap-1.5 ${headingStyle} ${hasBody ? "cursor-pointer select-none" : ""}`}
        data-md-heading-level={section.level}
        onClick={hasBody ? onToggle : undefined}
        role={hasBody ? "button" : undefined}
        tabIndex={hasBody ? 0 : undefined}
        onKeyDown={hasBody ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } } : undefined}
        aria-expanded={hasBody ? !isCollapsed : undefined}
        aria-controls={hasBody ? bodyId : undefined}
      >
        {/* Chevron butonu */}
        {hasBody ? (
          <span className={`${styles.headingChevron} flex shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150`}>
            {isCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </span>
        ) : (
          <span className={styles.headingChevron} aria-hidden="true" />
        )}

        {/* Başlık metni — semantic heading + inline Markdown + matematik destekli */}
        <SectionHeadingText level={section.level}>
          <MarkdownContent markdown={section.headingInlineMd} components={components} inline />
        </SectionHeadingText>

        {/* Gizlendi etiketi */}
        {isCollapsed && hasBody && (
          <span className="ml-2 rounded-full border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            gizlendi
          </span>
        )}
      </div>

      {/* İçerik — sabit max-height yerine yalnızca açıkken DOM'a girer. */}
      {hasBody && !isCollapsed && (
        <div id={bodyId} className={styles.sectionBody}>
          <MarkdownContent markdown={section.body} components={components} />
        </div>
      )}
    </section>
  );
}

// ─── TOC Paneli ───────────────────────────────────────────────────────────────
function TocPanel({ items }: { items: TocItem[] }) {
  if (!items.length) return null;
  return (
    <aside className={`${styles.tocPanel} hidden w-60 shrink-0 overflow-y-auto xl:flex xl:flex-col`}>
      <div className={`${styles.tocTitle} sticky top-0 px-4 py-3`}>
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">İçindekiler</span>
      </div>
      <nav className="space-y-0.5 p-3">
        {items.map((item, i) => (
          <a key={i} href={`#${item.id}`}
            className={`${styles.tocLink} block truncate rounded-lg py-1 text-xs text-muted-foreground transition-colors`}
            style={{ paddingLeft: `${(item.level - 1) * 10 + 8}px` }}>
            {item.level <= 2 && <span className={`${styles.tocHash} mr-1 font-bold`}>#</span>}
            {item.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function DokMarkdownViewer({ accessUrl, displayName, onContentChange }: DokMarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"preview" | "raw" | "edit">("preview");
  const [copied, setCopied] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [fontScale, setFontScale] = useState<number>(READER_FONT_SCALE_DEFAULT);
  const [readerBackground, setReaderBackground] = useState<ReaderBackground>(READER_BACKGROUND_DEFAULT);
  const [readerAccent, setReaderAccent] = useState<ReaderAccent>(READER_ACCENT_DEFAULT);
  const [systemDark, setSystemDark] = useState<boolean>(false);
  const [readerPrefsReady, setReaderPrefsReady] = useState<boolean>(false);
  const [showReaderSettings, setShowReaderSettings] = useState<boolean>(false);

  const accentBase = resolveReaderAccentHex(readerAccent);
  const readerAccentColor = getReadableAccent(
    accentBase,
    getReaderContrastBackgrounds(readerBackground, systemDark, accentBase)
  );
  const components = useMemo(() => buildComponents(readerAccentColor), [readerAccentColor]);
  const parsedHeadings = useMemo(() => scanMarkdownHeadings(content), [content]);
  const toc = useMemo(() => extractToc(parsedHeadings), [parsedHeadings]);
  const { preamble, sections } = useMemo(
    () => splitSections(content, parsedHeadings),
    [content, parsedHeadings]
  );
  const parentMap = useMemo(() => computeParentMap(sections), [sections]);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const fontScalePercent = Math.round(fontScale * 100);
  const canDecreaseFont = fontScale > READER_FONT_SCALE_MIN;
  const canIncreaseFont = fontScale < READER_FONT_SCALE_MAX;
  const readerStyle = useMemo(
    () => ({ "--md-font-scale": String(fontScale) } as React.CSSProperties),
    [fontScale]
  );
  const readerSurfaceStyle = useMemo(() => {
    return {
      "--md-accent-base": accentBase,
      "--md-accent": readerAccentColor,
      "--md-accent-foreground": getReadableForeground(readerAccentColor),
    } as React.CSSProperties;
  }, [accentBase, readerAccentColor]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(null);
    fetch(accessUrl)
      .then((res) => { if (!res.ok) throw new Error("İndirilemedi."); return res.text(); })
      .then((text) => { if (!isMounted) return; setContent(text); setCollapsed(new Set()); setLoading(false); })
      .catch(() => { if (!isMounted) return; setError("Markdown yüklenirken hata oluştu."); setLoading(false); });
    return () => { isMounted = false; };
  }, [accessUrl]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(READER_PREFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { fontScale?: unknown; background?: unknown; accent?: unknown };
        if (typeof parsed.fontScale === "number" && Number.isFinite(parsed.fontScale)) {
          setFontScale(normalizeReaderFontScale(parsed.fontScale));
        }
        setReaderBackground(normalizeReaderBackground(parsed.background));
        setReaderAccent(normalizeReaderAccent(parsed.accent));
      }
    } catch {
      // Geçersiz/eski preference okuyucuyu bozmamalı.
    } finally {
      setReaderPrefsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!readerPrefsReady) return;
    try {
      window.localStorage.setItem(
        READER_PREFS_STORAGE_KEY,
        JSON.stringify({
          fontScale: normalizeReaderFontScale(fontScale),
          background: readerBackground,
          accent: readerAccent,
        })
      );
    } catch {
      // Private mode / storage engeli okuyucuyu bozmamalı.
    }
  }, [readerPrefsReady, fontScale, readerBackground, readerAccent]);

  useEffect(() => {
    const updateSystemTheme = () => setSystemDark(document.documentElement.classList.contains("dark"));
    updateSystemTheme();
    const observer = new MutationObserver(updateSystemTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "preview") setShowReaderSettings(false);
  }, [mode]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no-op */ }
  };

  const changeFontScale = useCallback((delta: number) => {
    setFontScale((current) => normalizeReaderFontScale(current + delta));
  }, []);

  const resetFontScale = useCallback(() => {
    setFontScale(READER_FONT_SCALE_DEFAULT);
  }, []);

  const toggleSection = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleCollapseAll = () => setCollapsed(new Set(sections.map((s) => s.id)));
  const handleExpandAll = () => setCollapsed(new Set());

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Araç Çubuğu */}
      <div className="z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-card/85 px-3 py-1 text-xs backdrop-blur-md sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/80 bg-background/80 p-0.5 shadow-inner">
            {(["preview", "raw", ...(onContentChange ? ["edit"] : [])] as const).map((m) => (
              <Button key={m} size="sm" variant="ghost" onClick={() => setMode(m as typeof mode)}
                className={`h-7 gap-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all ${mode === m ? "bg-amber-500 text-zinc-950 font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "preview" && <><BookOpen className="h-3.5 w-3.5" /><span>Önizleme</span></>}
                {m === "raw" && <><Code2 className="h-3.5 w-3.5" /><span>Ham Kaynak</span></>}
                {m === "edit" && <><Edit3 className="h-3.5 w-3.5" /><span>Düzenle</span></>}
              </Button>
            ))}
          </div>

          {mode === "preview" && sections.length > 0 && (
            <>
              {/* Tümünü Küçült / Genişlet */}
              <button onClick={handleCollapseAll}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-amber-500/40 hover:bg-amber-500/8 hover:text-amber-600">
                <ChevronRight className="h-3.5 w-3.5" /><span>Tümünü Kapat</span>
              </button>
              <button onClick={handleExpandAll}
                className="hidden sm:flex items-center gap-1 rounded-xl border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-amber-500/40 hover:bg-amber-500/8 hover:text-amber-600">
                <ChevronDown className="h-3.5 w-3.5" /><span>Tümünü Aç</span>
              </button>
              {toc.length > 0 && (
                <button onClick={() => setShowToc((v) => !v)}
                  className={`hidden xl:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-all ${showToc ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
                  <List className="h-3.5 w-3.5" /><span>İçindekiler</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!loading && content && (
            <span className="hidden xl:block font-mono text-[11px] text-muted-foreground">
              {wordCount} kelime · {toc.length} başlık
            </span>
          )}

          {mode === "preview" && (
            <>
              {/* Geniş ekran: yazı boyutu araç çubuğunda görünür. */}
              <div className="hidden items-center rounded-xl border border-border/80 bg-background/80 p-0.5 shadow-inner lg:flex" aria-label="Yazı boyutu">
                <button
                  type="button"
                  onClick={() => changeFontScale(-READER_FONT_SCALE_STEP)}
                  disabled={!canDecreaseFont}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Yazıyı küçült"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetFontScale}
                  className="h-8 min-w-12 rounded-lg px-1.5 font-mono text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary"
                  aria-label="Yazı boyutunu yüzde 100 yap"
                  title="Varsayılan yazı boyutuna dön"
                >
                  {fontScalePercent}%
                </button>
                <button
                  type="button"
                  onClick={() => changeFontScale(READER_FONT_SCALE_STEP)}
                  disabled={!canIncreaseFont}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Yazıyı büyüt"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative">
                {/* Telefon/tablet: Aa düğmesi mevcut boyut ayarlarıyla birlikte görünüm panelini açar. */}
                <button
                  type="button"
                  onClick={() => setShowReaderSettings((value) => !value)}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 px-2 text-[13px] font-bold text-foreground shadow-sm transition-colors hover:bg-secondary lg:hidden"
                  aria-label="Okuma görünümü ayarları"
                  aria-expanded={showReaderSettings}
                  aria-controls="markdown-reader-settings"
                  data-testid="markdown-reader-settings-trigger"
                >
                  Aa
                </button>
                {/* Masaüstü: palet düğmesi yazı boyutu kontrollerinin yanında durur. */}
                <button
                  type="button"
                  onClick={() => setShowReaderSettings((value) => !value)}
                  className="hidden h-8 w-9 items-center justify-center rounded-lg border border-border/80 bg-background/80 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:inline-flex"
                  aria-label="Okuma görünümü ayarları"
                  aria-expanded={showReaderSettings}
                  aria-controls="markdown-reader-settings"
                  data-testid="markdown-reader-settings-trigger"
                >
                  <Palette className="h-4 w-4" aria-hidden="true" />
                </button>

                {showReaderSettings && (
                  <div
                    id="markdown-reader-settings"
                    data-testid="markdown-reader-settings"
                    role="dialog"
                    aria-label="Markdown okuma ayarları"
                    className={`${styles.settingsPopover} absolute right-0 top-11 z-50 rounded-2xl border border-border/80 bg-card p-3 shadow-2xl`}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setShowReaderSettings(false);
                    }}
                  >
                    <div className="mb-2 lg:hidden">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">Yazı Boyutu</span>
                        <span className="font-mono text-[11px] text-muted-foreground" aria-live="polite">
                          {fontScalePercent}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => changeFontScale(-READER_FONT_SCALE_STEP)}
                          disabled={!canDecreaseFont}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label="Yazıyı küçült"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={resetFontScale}
                          className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border/80 bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                          aria-label="Yazı boyutunu yüzde 100 yap"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          100%
                        </button>
                        <button
                          type="button"
                          onClick={() => changeFontScale(READER_FONT_SCALE_STEP)}
                          disabled={!canIncreaseFont}
                          className="inline-flex h-11 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label="Yazıyı büyüt"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <ReaderAppearanceSettings
                      background={readerBackground}
                      accent={readerAccent}
                      onBackgroundChange={setReaderBackground}
                      onAccentChange={setReaderAccent}
                    />
                    <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                      Tercihler bu tarayıcıdaki tüm Markdown dosyalarında hatırlanır.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobilde kopyala icon-only tutularak Aa için alan bırakılır. */}
          <StudioCommandButton commandId="text.copy" onClick={handleCopy} disabled={loading || !content}
            size="sm" variant="outline" className="h-10 min-w-10 gap-1.5 rounded-xl border-border/80 px-2 hover:bg-secondary sm:hidden"
            icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-amber-500" />}
            label={copied ? "Kopyalandı" : "Kopyala"} showLabel={false} />
          <StudioCommandButton commandId="text.copy" onClick={handleCopy} disabled={loading || !content}
            size="sm" variant="outline" className="hidden h-8 gap-1.5 rounded-xl border-border/80 px-3 text-xs hover:bg-secondary sm:inline-flex"
            icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-amber-500" />}
            label={copied ? "Kopyalandı" : "Kopyala"} showLabel={true} />
        </div>
      </div>

      {/* Gövde */}
      <div
        className={`${styles.readerSurface} flex min-h-0 flex-1`}
        data-md-background={mode === "preview" ? readerBackground : undefined}
        data-testid="markdown-reader-surface"
        style={readerSurfaceStyle}
      >
        <div className="relative min-h-0 flex-1 overflow-y-auto select-text">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
              <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
              <span className="text-sm font-medium">Markdown yükleniyor...</span>
            </div>
          )}
          {error && (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl backdrop-blur-md">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-300">Yüklenemedi</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
            </div>
          )}
          {!loading && !error && mode === "edit" && (
            <div className="h-full p-4">
              <textarea value={content} onChange={(e) => { setContent(e.target.value); onContentChange?.(e.target.value); }}
                className="h-full min-h-[500px] w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/80 p-6 font-mono text-sm leading-relaxed text-zinc-100 focus:border-amber-500 focus:outline-none select-text"
                placeholder="Markdown metnini düzenleyin..." spellCheck={false} />
            </div>
          )}
          {!loading && !error && mode === "raw" && (
            <div className="p-6">
              <pre className="mx-auto max-w-5xl whitespace-pre-wrap rounded-xl border border-border/60 bg-zinc-950/50 p-6 font-mono text-xs leading-relaxed text-zinc-300">{content}</pre>
            </div>
          )}
          {!loading && !error && mode === "preview" && (
            <div className={styles.readerViewport}>
              <article className={styles.reader} style={readerStyle} data-testid="markdown-reader" data-font-scale={fontScalePercent}>
                {/* Dosya meta kartı */}
                <div className={`${styles.metaCard} flex items-center gap-3 rounded-xl`}>
                  <FileText className={`${styles.accentIcon} h-5 w-5 shrink-0`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {wordCount} kelime · {toc.length > 0 ? `${toc.length} başlık` : "başlık yok"} · {content.length} karakter
                    </p>
                  </div>
                </div>

                {/* Başlık öncesi içerik (varsa) */}
                {preamble.trim() && (
                  <div className={styles.preamble}>
                    <MarkdownContent markdown={preamble} components={components} />
                  </div>
                )}

                {/* Collapsible bölümler */}
                <div className="space-y-0">
                  {sections.map((section) => (
                    <CollapsibleSection
                      key={section.id}
                      section={section}
                      isCollapsed={collapsed.has(section.id)}
                      isHidden={isAncestorCollapsed(section.id, parentMap, collapsed)}
                      onToggle={() => toggleSection(section.id)}
                      components={components}
                    />
                  ))}
                </div>
              </article>
            </div>
          )}
        </div>
        {mode === "preview" && showToc && <TocPanel items={toc} />}
      </div>
    </div>
  );
}
