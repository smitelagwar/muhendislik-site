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
  BookOpen, Edit3, List, ChevronRight, ChevronDown, Minus, Plus, RotateCcw,
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

function normalizeReaderFontScale(value: number): number {
  const clamped = Math.min(READER_FONT_SCALE_MAX, Math.max(READER_FONT_SCALE_MIN, value));
  return Math.round(clamped * 100) / 100;
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
    const fenceMatch = /^ {0,3}(`{3,}|~{3,})/.exec(line);

    if (fenceMatch) {
      const fence = fenceMatch[1];
      const marker = fence[0] as "`" | "~";
      if (!activeFence) {
        activeFence = { marker, length: fence.length };
      } else if (activeFence.marker === marker && fence.length >= activeFence.length) {
        activeFence = null;
      }
      continue;
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

function extractToc(markdown: string): TocItem[] {
  return scanMarkdownHeadings(markdown).map(({ level, text, id }) => ({ level, text, id }));
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

function splitSections(markdown: string): { preamble: string; sections: MdSection[] } {
  const lines = markdown.split("\n");
  const headings = scanMarkdownHeadings(markdown);
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
function computeParentIds(sections: MdSection[]): (string | null)[] {
  return sections.map((sec, i) => {
    for (let j = i - 1; j >= 0; j--) {
      if (sections[j].level < sec.level) return sections[j].id;
    }
    return null;
  });
}

function isAncestorCollapsed(
  sectionId: string,
  sections: MdSection[],
  parentIds: (string | null)[],
  collapsed: Set<string>
): boolean {
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return false;
  const parentId = parentIds[idx];
  if (!parentId) return false;
  if (collapsed.has(parentId)) return true;
  return isAncestorCollapsed(parentId, sections, parentIds, collapsed);
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
    <div className={`${styles.codeBlock} group relative overflow-hidden rounded-xl border border-border/60 bg-zinc-950/80 shadow-md dark:bg-zinc-900/80`}>
      <div className="flex items-center justify-between border-b border-border/40 bg-zinc-900/60 px-4 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{lang || "kod"}</span>
        <button type="button" onClick={handleCopy} aria-label="Kod bloğunu kopyala" className={`${styles.codeCopyButton} flex items-center gap-1.5 rounded-lg border border-border/40 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 transition-all hover:border-amber-500/40 hover:text-amber-400`}>
          {copied ? <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Kopyalandı</span></> : <><Copy className="h-3 w-3" /><span>Kopyala</span></>}
        </button>
      </div>
      <pre className={`${styles.codePre} overflow-x-auto p-4`}><code className="font-mono text-sm leading-relaxed text-zinc-100">{code}</code></pre>
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
function buildComponents(): Components {
  return {
    // Body içindeki başlıklar (iç içe markdown varsa — normalde body'de heading olmaz ama fallback)
    h1: ({ children }) => <h1 className={`${styles.fallbackHeading} ${styles.headingLevel1}`}>{children}</h1>,
    h2: ({ children }) => <h2 className={`${styles.fallbackHeading} ${styles.headingLevel2}`}>{children}</h2>,
    h3: ({ children }) => <h3 className={`${styles.fallbackHeading} ${styles.headingLevel3}`}>{children}</h3>,
    h4: ({ children }) => <h4 className={`${styles.fallbackHeading} ${styles.headingLevel4}`}>{children}</h4>,
    h5: ({ children }) => <h5 className={`${styles.fallbackHeading} ${styles.headingLevel5}`}>{children}</h5>,
    h6: ({ children }) => <h6 className={`${styles.fallbackHeading} ${styles.headingLevel6}`}>{children}</h6>,
    p: ({ children }) => <p className={`${styles.paragraph} text-foreground/90`}>{children}</p>,
    a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="font-medium text-amber-600 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-500 dark:text-amber-400">{children}</a>,
    code: ({ children, className }) => {
      if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
      return <code className={`${styles.inlineCode} rounded-md border border-amber-500/20 bg-amber-500/10 font-mono font-medium text-amber-600 dark:text-amber-400`}>{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <blockquote className={`${styles.blockquote} border-l-4 border-amber-500/60 bg-amber-500/5 rounded-r-xl italic text-muted-foreground`}>{children}</blockquote>,
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
      return <span className={`mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border align-middle ${checked ? "border-amber-500 bg-amber-500 text-zinc-950" : "border-border/70 bg-secondary/30"}`}>{checked && <Check className="h-3 w-3" />}</span>;
    },
    hr: () => <hr className={`${styles.rule} border-0 border-t border-border/60`} />,
    table: ({ children }) => <div className={`${styles.tableWrap} overflow-x-auto rounded-xl border border-border/60 shadow-sm`}><table className={`${styles.table} w-full border-collapse`}>{children}</table></div>,
    thead: ({ children }) => <thead className={`${styles.tableHead} border-b border-border/60 bg-secondary/60 font-bold uppercase text-muted-foreground`}>{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border/40">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-amber-500/5">{children}</tr>,
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
          <span className={`${styles.headingChevron} flex shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 group-hover:bg-secondary/60 group-hover:text-amber-500`}>
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
    <aside className="hidden xl:flex xl:flex-col w-60 shrink-0 border-l border-border/60 bg-card/60 backdrop-blur-md overflow-y-auto">
      <div className="sticky top-0 border-b border-border/40 bg-card/80 px-4 py-3 backdrop-blur-md">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">İçindekiler</span>
      </div>
      <nav className="space-y-0.5 p-3">
        {items.map((item, i) => (
          <a key={i} href={`#${item.id}`}
            className="block truncate rounded-lg py-1 text-xs text-muted-foreground transition-colors hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
            style={{ paddingLeft: `${(item.level - 1) * 10 + 8}px` }}>
            {item.level <= 2 && <span className="mr-1 font-bold text-amber-500/50">#</span>}
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
  const [fontPrefsReady, setFontPrefsReady] = useState<boolean>(false);
  const [showReaderSettings, setShowReaderSettings] = useState<boolean>(false);

  const components = useCallback(() => buildComponents(), []);
  const toc = useMemo(() => extractToc(content), [content]);
  const { preamble, sections } = useMemo(() => splitSections(content), [content]);
  const parentIds = useMemo(() => computeParentIds(sections), [sections]);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const fontScalePercent = Math.round(fontScale * 100);
  const canDecreaseFont = fontScale > READER_FONT_SCALE_MIN;
  const canIncreaseFont = fontScale < READER_FONT_SCALE_MAX;
  const readerStyle = useMemo(
    () => ({ "--md-font-scale": String(fontScale) } as React.CSSProperties),
    [fontScale]
  );

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
        const parsed = JSON.parse(raw) as { fontScale?: unknown };
        if (typeof parsed.fontScale === "number" && Number.isFinite(parsed.fontScale)) {
          setFontScale(normalizeReaderFontScale(parsed.fontScale));
        }
      }
    } catch {
      // Geçersiz/eski preference okuyucuyu bozmamalı.
    } finally {
      setFontPrefsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!fontPrefsReady) return;
    try {
      window.localStorage.setItem(
        READER_PREFS_STORAGE_KEY,
        JSON.stringify({ fontScale: normalizeReaderFontScale(fontScale) })
      );
    } catch {
      // Private mode / storage engeli okuyucuyu bozmamalı.
    }
  }, [fontPrefsReady, fontScale]);

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

        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {!loading && content && (
            <span className="hidden xl:block font-mono text-[11px] text-muted-foreground">
              {wordCount} kelime · {toc.length} başlık
            </span>
          )}

          {mode === "preview" && (
            <>
              {/* Telefon/tablet: tek Aa düğmesi; panel içinde A− / A+ / reset. */}
              <button
                type="button"
                onClick={() => setShowReaderSettings((value) => !value)}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border/80 bg-background/80 px-2 text-[13px] font-bold text-foreground shadow-sm transition-colors hover:bg-secondary lg:hidden"
                aria-label="Yazı boyutu ayarları"
                aria-expanded={showReaderSettings}
                aria-controls="markdown-reader-font-settings"
              >
                Aa
              </button>

              {showReaderSettings && (
                <div
                  id="markdown-reader-font-settings"
                  role="dialog"
                  aria-label="Markdown yazı boyutu"
                  className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border/80 bg-card p-3 shadow-2xl lg:hidden"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setShowReaderSettings(false);
                  }}
                >
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
                  <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                    Tercih bu cihazda hatırlanır.
                  </p>
                </div>
              )}

              {/* Geniş ekran: kontroller toolbar üzerinde doğrudan görünür. */}
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
      <div className="flex min-h-0 flex-1">
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
              <article className={styles.reader} style={readerStyle}>
                {/* Dosya meta kartı */}
                <div className={`${styles.metaCard} flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5`}>
                  <FileText className="h-5 w-5 shrink-0 text-amber-500" />
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
                    <MarkdownContent markdown={preamble} components={components()} />
                  </div>
                )}

                {/* Collapsible bölümler */}
                <div className="space-y-0">
                  {sections.map((section, i) => (
                    <CollapsibleSection
                      key={section.id}
                      section={section}
                      isCollapsed={collapsed.has(section.id)}
                      isHidden={isAncestorCollapsed(section.id, sections, parentIds, collapsed)}
                      onToggle={() => toggleSection(section.id)}
                      components={components()}
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