// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — OBSİDİAN TARZI MARKDOWN GÖRÜNTÜLEYİCİ
// Başlıklar, tablolar, kod blokları, callout'lar, görev listeleri, TOC
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  FileText,
  Code2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  BookOpen,
  Edit3,
  List,
  Info,
  AlertTriangle,
  Lightbulb,
  Flame,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioCommandButton } from "../studio/studio-command-button";

interface DokMarkdownViewerProps {
  accessUrl: string;
  displayName: string;
  onContentChange?: (newContent: string) => void;
}

// Başlıktan anchor ID üretir
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface TocItem { level: number; text: string; id: string; }

function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  for (const line of markdown.split("\n")) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`~]/g, "").trim();
      toc.push({ level: m[1].length, text, id: slugify(text) });
    }
  }
  return toc;
}

// Kod Bloğu Bileşeni
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

// Özel render bileşenleri
function buildComponents(): Components {
  return {
    h1: ({ children }) => { const id = slugify(String(children)); return <h1 id={id} className="group mt-8 mb-4 scroll-mt-20 border-b border-border/60 pb-3 text-3xl font-bold tracking-tight text-foreground"><a href={`#${id}`} className="no-underline">{children}</a></h1>; },
    h2: ({ children }) => { const id = slugify(String(children)); return <h2 id={id} className="group mt-7 mb-3 scroll-mt-20 border-b border-border/40 pb-2 text-2xl font-bold tracking-tight text-foreground"><a href={`#${id}`} className="no-underline">{children}</a></h2>; },
    h3: ({ children }) => { const id = slugify(String(children)); return <h3 id={id} className="mt-6 mb-2 scroll-mt-20 text-xl font-bold text-foreground">{children}</h3>; },
    h4: ({ children }) => { const id = slugify(String(children)); return <h4 id={id} className="mt-5 mb-2 scroll-mt-20 text-lg font-semibold text-foreground">{children}</h4>; },
    h5: ({ children }) => <h5 className="mt-4 mb-1 text-base font-semibold text-muted-foreground">{children}</h5>,
    h6: ({ children }) => <h6 className="mt-3 mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h6>,
    p: ({ children }) => <p className="my-3.5 leading-7 text-foreground/90">{children}</p>,
    a: ({ href, children }) => <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined} className="font-medium text-amber-600 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-500 dark:text-amber-400">{children}</a>,
    code: ({ children, className }) => {
      if (className?.startsWith("language-")) return <CodeBlock className={className}>{children}</CodeBlock>;
      return <code className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-amber-600 dark:text-amber-400">{children}</code>;
    },
    pre: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <blockquote className="my-5 border-l-4 border-amber-500/60 bg-amber-500/5 py-3 pl-5 pr-4 rounded-r-xl italic text-muted-foreground">{children}</blockquote>,
    ul: ({ children }) => <ul className="my-3.5 ml-2 space-y-2 list-none">{children}</ul>,
    ol: ({ children }) => <ol className="my-3.5 ml-6 list-decimal space-y-2">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-2.5 leading-6 text-foreground/90">
        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
        <span className="flex-1 min-w-0">{children}</span>
      </li>
    ),
    input: ({ type, checked }) => {
      if (type !== "checkbox") return null;
      return <span className={`mr-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border align-middle ${checked ? "border-amber-500 bg-amber-500 text-zinc-950" : "border-border/70 bg-secondary/30"}`}>{checked && <Check className="h-3 w-3" />}</span>;
    },
    hr: () => <hr className="my-8 border-0 border-t border-border/60" />,
    table: ({ children }) => <div className="my-6 overflow-x-auto rounded-xl border border-border/60 shadow-sm"><table className="w-full border-collapse text-sm">{children}</table></div>,
    thead: ({ children }) => <thead className="border-b border-border/60 bg-secondary/60 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</thead>,
    tbody: ({ children }) => <tbody className="divide-y divide-border/40">{children}</tbody>,
    tr: ({ children }) => <tr className="transition-colors hover:bg-amber-500/5">{children}</tr>,
    th: ({ children }) => <th className="px-4 py-3 text-left font-bold">{children}</th>,
    td: ({ children }) => <td className="px-4 py-3 text-foreground/85">{children}</td>,
    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
    em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
    del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
    img: ({ src, alt }) => (
      <span className="my-5 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="max-w-full rounded-xl border border-border/60 shadow-md" loading="lazy" />
        {alt && <span className="mt-2 block text-center text-xs italic text-muted-foreground">{alt}</span>}
      </span>
    ),
  };
}

// TOC Paneli
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

// Ana Bileşen
export function DokMarkdownViewer({ accessUrl, displayName, onContentChange }: DokMarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"preview" | "raw" | "edit">("preview");
  const [copied, setCopied] = useState<boolean>(false);
  const [showToc, setShowToc] = useState<boolean>(true);

  const components = useCallback(() => buildComponents(), []);
  const toc = extractToc(content);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    let isMounted = true;
    setLoading(true); setError(null);
    fetch(accessUrl)
      .then((res) => { if (!res.ok) throw new Error("İndirilemedi."); return res.text(); })
      .then((text) => { if (!isMounted) return; setContent(text); setLoading(false); })
      .catch(() => { if (!isMounted) return; setError("Markdown yüklenirken hata oluştu."); setLoading(false); });
    return () => { isMounted = false; };
  }, [accessUrl]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* no-op */ }
  };

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
          {mode === "preview" && toc.length > 0 && (
            <button onClick={() => setShowToc((v) => !v)}
              className={`hidden xl:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold transition-all ${showToc ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
              <List className="h-3.5 w-3.5" /><span>İçindekiler</span>
            </button>
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
              <pre className="mx-auto max-w-4xl whitespace-pre-wrap rounded-xl border border-border/60 bg-zinc-950/50 p-6 font-mono text-xs leading-relaxed text-zinc-300">{content}</pre>
            </div>
          )}
          {!loading && !error && mode === "preview" && (
            <div className="px-5 py-8 sm:px-10 sm:py-10">
              <article className="mx-auto max-w-3xl">
                {/* Dosya meta kartı */}
                <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-3.5">
                  <FileText className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {wordCount} kelime · {toc.length > 0 ? `${toc.length} başlık` : "başlık yok"} · {content.length} karakter
                    </p>
                  </div>
                </div>
                {/* Markdown render */}
                <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true} components={components()}>
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </div>
        {mode === "preview" && showToc && <TocPanel items={toc} />}
      </div>
    </div>
  );
}