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
  BookOpen, Edit3, List, ChevronRight, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioCommandButton } from "../studio/studio-command-button";
import styles from "./markdown-reader.module.css";

interface DokMarkdownViewerProps {
  accessUrl: string;
  displayName: string;
  onContentChange?: (newContent: string) => void;
}

// ─── Başlıktan anchor ID ──────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── TOC öğesi ────────────────────────────────────────────────────────────────
interface TocItem { level: number; text: string; id: string; }
function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) { const text = m[2].replace(/[*_`~]/g, "").trim(); toc.push({ level: m[1].length, text, id: slugify(text) }); }
  }
  return toc;
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
  const sections: MdSection[] = [];
  let preamble = "";
  let current: MdSection | null = null;
  const ids = new Map<string, number>();

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      const level = m[1].length;
      const headingInlineMd = m[2].trim();
      const headingText = headingInlineMd.replace(/[*_`~[\]()$\\{}]/g, "").trim();
      const base = slugify(headingText) || "section";
      const count = (ids.get(base) ?? 0) + 1;
      ids.set(base, count);
      const id = count === 1 ? base : `${base}-${count}`;
      current = { id, level, headingText, headingInlineMd, headingMd: line, body: "" };
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
    <div className="group relative my-5 overflow-hidden rounded-xl border border-border/60 bg-zinc-950/80 shadow-md dark:bg-zinc-900/80">
      <div className="flex items-center justify-between border-b border-border/40 bg-zinc-900/60 px-4 py-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-400">{lang || "kod"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-zinc-400 opacity-0 transition-all hover:border-amber-500/40 hover:text-amber-400 group-hover:opacity-100">
          {copied ? <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Kopyalandı</span></> : <><Copy className="h-3 w-3" /><span>Kopyala</span></>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4"><code className="font-mono text-sm leading-relaxed text-zinc-100">{code}</code></pre>
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
    h1: ({ children }) => <p className={`${styles.fallbackHeading} ${styles.headingLevel1}`}>{children}</p>,
    h2: ({ children }) => <p className={`${styles.fallbackHeading} ${styles.headingLevel2}`}>{children}</p>,
    h3: ({ children }) => <p className={`${styles.fallbackHeading} ${styles.headingLevel3}`}>{children}</p>,
    h4: ({ children }) => <p className={`${styles.fallbackHeading} ${styles.headingLevel4}`}>{children}</p>,
    p: ({ children }) => <p className={`${styles.paragraph} text-foreground/90`}>{children}</p>,
    a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="font-medium text-amber-600 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-500 dark:text-amber-400">{children}</a>,
    code: ({ children, className }) => {
      if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
      return <code className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-amber-600 dark:text-amber-400">{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <blockquote className={`${styles.blockquote} border-l-4 border-amber-500/60 bg-amber-500/5 rounded-r-xl italic text-muted-foreground`}>{children}</blockquote>,
    ul: ({ children }) => <ul className={`${styles.unorderedList} list-none`}>{children}</ul>,
    ol: ({ children }) => <ol className={`${styles.orderedList} list-decimal`}>{children}</ol>,
    li: ({ children }) => (
      <li className={`${styles.listItem} flex items-start gap-2.5 text-foreground/90`}>
        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
        <span className="flex-1 min-w-0">{children}</span>
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
  const indent = (section.level - 1) * 12; // px, görsel hiyerarşi ipucu

  return (
    <div style={{ paddingLeft: section.level > 1 ? `${indent}px` : undefined }}>
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
      >
        {/* Chevron butonu */}
        {hasBody ? (
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-all duration-200 group-hover:bg-secondary/60 group-hover:text-amber-500 ${isCollapsed ? "" : "rotate-0"}`}>
            {isCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
            }
          </span>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}

        {/* Başlık metni — inline Markdown + matematik destekli */}
        <span className="flex-1 text-foreground">
          <MarkdownContent markdown={section.headingInlineMd} components={components} inline />
        </span>

        {/* Gizlendi etiketi */}
        {isCollapsed && hasBody && (
          <span className="ml-2 rounded-full border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            gizlendi
          </span>
        )}
      </div>

      {/* İçerik — collapse animasyonu */}
      {hasBody && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 opacity-0" : "max-h-[9999px] opacity-100"}`}
        >
          <div className={`pt-1 ${section.level > 1 ? "border-l-2 border-border/30 pl-4 ml-2" : ""}`}>
            <MarkdownContent markdown={section.body} components={components} />
          </div>
        </div>
      )}
    </div>
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

  const components = useCallback(() => buildComponents(), []);
  const toc = useMemo(() => extractToc(content), [content]);
  const { preamble, sections } = useMemo(() => splitSections(content), [content]);
  const parentIds = useMemo(() => computeParentIds(sections), [sections]);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(null);
    fetch(accessUrl)
      .then((res) => { if (!res.ok) throw new Error("İndirilemedi."); return res.text(); })
      .then((text) => { if (!isMounted) return; setContent(text); setCollapsed(new Set()); setLoading(false); })
      .catch(() => { if (!isMounted) return; setError("Markdown yüklenirken hata oluştu."); setLoading(false); });
    return () => { isMounted = false; };
  }, [accessUrl]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no-op */ }
  };

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
      <div className="z-30 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-card/85 px-4 py-1.5 text-xs backdrop-blur-md">
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

        <div className="flex items-center gap-2">
          {!loading && content && (
            <span className="hidden sm:block font-mono text-[11px] text-muted-foreground">
              {wordCount} kelime · {toc.length} başlık
            </span>
          )}
          <StudioCommandButton commandId="text.copy" onClick={handleCopy} disabled={loading || !content}
            size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-xs rounded-xl border-border/80 hover:bg-secondary"
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
              <article className={styles.reader}>
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