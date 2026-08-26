"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  Clock,
  Copy,
  Info,
  Lightbulb,
  List,
  Maximize2,
  Quote,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FontSizeControl } from "@/components/font-size-control";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { PortalOverlay } from "@/components/portal-overlay";
import { ScrollProgress } from "@/components/scroll-progress";
import { type ArticleData } from "@/lib/articles-data";
import { type CalloutTone, type ParsedBlock } from "@/lib/article-blocks";
import { getArticleAuthorPresentation } from "@/lib/content-author";
import { getDepremSeriesForArticle } from "@/lib/deprem-series";
import { getSiteSectionForArticle, getSiteSectionHrefForArticle } from "@/lib/site-sections";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";

interface ArticleClientProps {
  article: ArticleData;
  relatedArticles: ArticleData[];
  parsedSections: ParsedSection[];
  breadcrumbs?: { title: string; href: string }[];
  backLink?: { title: string; href: string };
  hideToolPromos?: boolean;
  suggestedTool?: { title: string; description: string; href: string; cta: string };
}

type ParsedSection = ArticleData["sections"][number] & { blocks: ParsedBlock[] };

const ARTICLE_PROSE_CLASS =
  "prose prose-zinc max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-16 prose-h2:border-b prose-h2:border-border prose-h2:pb-4 prose-h2:text-3xl prose-h3:mt-10 prose-h3:text-2xl prose-p:mb-8 prose-p:max-w-[72ch] prose-p:text-[1.02em] prose-p:leading-[1.72] prose-li:leading-[1.72] prose-li:marker:text-amber-600 prose-a:font-bold prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-300 prose-strong:font-black prose-strong:text-foreground";

const DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto" as const,
  containIntrinsicSize: "900px",
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(text: string) {
  const safe = escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-bold text-blue-700 underline-offset-4 hover:underline dark:text-blue-300">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");

  return { __html: safe };
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{lang || "Kod"}</span>
        <button type="button" onClick={copy} className="text-zinc-400 transition-colors hover:text-white">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CALLOUT_PRESENTATION: Record<CalloutTone, { label: string; classes: string; icon: "warning" | "tip" | "regulation" | "engineering" | "field" | "info" }> = {
  info: {
    label: "Bilgi",
    classes: "border-blue-600 bg-blue-50/75 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100",
    icon: "info",
  },
  warning: {
    label: "Uyarı",
    classes: "border-amber-500 bg-amber-50/75 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100",
    icon: "warning",
  },
  tip: {
    label: "İpucu",
    classes: "border-blue-500 bg-blue-50/75 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100",
    icon: "tip",
  },
  regulation: {
    label: "Yönetmelik",
    classes: "border-violet-500 bg-violet-50/75 text-violet-950 dark:bg-violet-950/20 dark:text-violet-100",
    icon: "regulation",
  },
  engineering: {
    label: "Mühendislik Notu",
    classes: "border-emerald-600 bg-emerald-50/75 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100",
    icon: "engineering",
  },
  field: {
    label: "Saha Notu",
    classes: "border-orange-600 bg-orange-50/75 text-orange-950 dark:bg-orange-950/20 dark:text-orange-100",
    icon: "field",
  },
  check: {
    label: "Kontrol",
    classes: "border-cyan-600 bg-cyan-50/75 text-cyan-950 dark:bg-cyan-950/20 dark:text-cyan-100",
    icon: "field",
  },
};

function CalloutBox({ content, tone, title }: { content: string; tone: CalloutTone; title: string }) {
  const presentation = CALLOUT_PRESENTATION[tone];
  const icon =
    presentation.icon === "warning" ? (
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
    ) : presentation.icon === "tip" ? (
      <Lightbulb className="h-5 w-5 flex-shrink-0" />
    ) : presentation.icon === "regulation" ? (
      <BookOpen className="h-5 w-5 flex-shrink-0" />
    ) : presentation.icon === "engineering" ? (
      <Calculator className="h-5 w-5 flex-shrink-0" />
    ) : presentation.icon === "field" ? (
      <Check className="h-5 w-5 flex-shrink-0" />
    ) : (
      <Info className="h-5 w-5 flex-shrink-0" />
    );

  return (
    <aside className={`not-prose my-8 rounded-r-2xl border-l-4 p-6 shadow-sm ${presentation.classes}`} aria-label={title || presentation.label}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.16em]">{title || presentation.label}</p>
          <div className="text-sm font-medium leading-7 md:text-base" dangerouslySetInnerHTML={renderInlineMarkdown(content)} />
        </div>
      </div>
    </aside>
  );
}

function FormulaBlock({ block }: { block: Extract<ParsedBlock, { type: "formula" }> }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(block.expression);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <figure className="not-prose my-10 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <figcaption className="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300">{block.label || "Denklem"}</figcaption>
        <Button type="button" variant="ghost" size="sm" onClick={copy} className="h-8 text-xs font-bold">
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      <div className="overflow-x-auto px-5 py-6" tabIndex={0} aria-label={`${block.label || "Denklem"} ifadesi`}>
        <pre className="m-0 min-w-max bg-transparent p-0 font-mono text-base font-bold leading-8 text-zinc-950 dark:text-zinc-100 md:text-lg"><code>{block.expression}</code></pre>
      </div>
      {block.symbols.length > 0 ? (
        <dl className="grid gap-px border-t border-zinc-200 bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 sm:grid-cols-2">
          {block.symbols.map((item) => (
            <div key={`${item.symbol}-${item.description}`} className="bg-white px-5 py-4 dark:bg-zinc-950">
              <dt className="font-mono text-sm font-black text-zinc-950 dark:text-zinc-100">{item.symbol}</dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.description}
                <span className="ml-2 whitespace-nowrap font-mono text-xs font-bold text-zinc-500">[{item.unit}]</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </figure>
  );
}

function ArticleFigure({
  block,
  articleTitle,
  figureNumber,
}: {
  block: Extract<ParsedBlock, { type: "image" }>;
  articleTitle: string;
  figureNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const isSvg = block.src.toLowerCase().includes(".svg");
  const label = `Şekil ${figureNumber}`;

  const image = (
    <Image
      src={block.src}
      alt={block.alt || articleTitle}
      fill
      unoptimized={isSvg}
      className="object-contain"
      sizes="(max-width: 1024px) 100vw, 900px"
    />
  );

  return (
    <>
      <figure className="not-prose site-panel my-10 overflow-hidden rounded-xl">
        <div className="relative aspect-[16/9] bg-zinc-950/5 dark:bg-zinc-900/40">
          {block.lightbox ? (
            <button type="button" onClick={() => setOpen(true)} className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset" aria-label={`${label} görselini büyüt`}>
              {image}
            </button>
          ) : (
            image
          )}
        </div>
        <figcaption className="border-t border-zinc-200 px-5 py-4 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            <strong className="text-zinc-900 dark:text-zinc-100">{label}.</strong>{block.caption ? ` ${block.caption}` : ""}
          </p>
          {block.note ? <p className="mt-2 text-xs"><strong>Not:</strong> {block.note}</p> : null}
          {block.sourceNote ? <p className="mt-1 text-xs"><strong>Kaynak:</strong> {block.sourceNote}</p> : null}
        </figcaption>
      </figure>

      <PortalOverlay isOpen={open} onClose={() => setOpen(false)}>
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`${label} büyütülmüş görünüm`} onClick={() => setOpen(false)}>
          <div className="relative h-[min(82vh,900px)] w-[min(94vw,1400px)]" onClick={(event) => event.stopPropagation()}>
            <Image src={block.src} alt={block.alt || articleTitle} fill unoptimized={isSvg} className="object-contain" sizes="94vw" priority />
            <Button type="button" variant="secondary" size="icon" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full" aria-label="Büyütülmüş görseli kapat">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </PortalOverlay>
    </>
  );
}

function TableViewer({ content }: { content: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rows = content.split("\n").filter((row) => row.trim() && !/^\|[-\s|]+\|$/.test(row.trim()));
  const headers = rows[0]?.split("|").map((cell) => cell.trim()).filter(Boolean) || [];
  const bodyRows = rows.slice(1).map((row) => row.split("|").map((cell) => cell.trim()).filter(Boolean));

  const copy = async () => {
    const tsv = [headers.join("\t"), ...bodyRows.map((row) => row.join("\t"))].join("\n");
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const table = (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[color:var(--table-border)]">
          {headers.map((header) => (
            <th key={header} className="bg-[var(--table-header)] px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--table-muted)]">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-[color:var(--table-border)] bg-[var(--table-surface)] text-[color:var(--table-text)] odd:bg-[var(--table-surface)] even:bg-[var(--table-surface-alt)] hover:bg-[var(--table-hover)]">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="whitespace-nowrap px-4 py-3 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div className="not-prose relative my-10 overflow-hidden rounded-2xl border border-[color:var(--table-border)] bg-[var(--table-surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[color:var(--table-border)] bg-[var(--table-surface-alt)] px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--table-muted)]">Veri tablosu</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-wider" onClick={copy}>
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setFullscreen(true)} title="Tabloyu büyüt">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">{table}</div>
      </div>

      {fullscreen ? (
        <div className="fixed inset-0 z-[130] flex flex-col bg-white p-4 dark:bg-zinc-950 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-black text-zinc-950 dark:text-white">Tablo görünümü</h3>
            <Button type="button" variant="ghost" size="icon" onClick={() => setFullscreen(false)} className="rounded-full bg-zinc-100 dark:bg-zinc-900">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto rounded-2xl border border-[color:var(--table-border)] bg-[var(--table-surface)]">{table}</div>
        </div>
      ) : null}
    </>
  );
}

function InFlowToolCta({ articleSlug }: { articleSlug: string }) {
  const href = articleSlug === "kalip-sokumu-rehberi" ? "/kategori/araclar/kalip-sokum-suresi" : TOOLS_HUB_HREF;
  const title = articleSlug === "kalip-sokumu-rehberi" ? "Kalıp söküm süresini hesapla" : "Tüm hesap araçlarını aç";
  return (
    <div className="not-prose my-12 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-6 shadow-sm dark:from-amber-950/20 dark:via-[#111111] dark:to-blue-950/20 md:p-8">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Araç kısayolu</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        {articleSlug === "kalip-sokumu-rehberi"
          ? "Şantiye koşullarına göre tahmini bekleme süresini araç üzerinden hemen karşılaştırın."
          : "İhtiyacınız olan mühendislik aracına tek kategori üzerinden hızlıca geçin."}
      </p>
      <Button asChild size="lg" className="mt-6 px-8">
        <Link href={href}>
          Aracı aç
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function DepremSeriesToolCta({ article }: { article: ArticleData }) {
  const series = getDepremSeriesForArticle(article);
  const href = series.relatedToolHref;

  if (!href) {
    return null;
  }

  const label =
    href === TOOLS_HUB_HREF
      ? "Araç merkezini aç"
      : series.id === "ts500"
        ? "Donatı hesabına git"
        : series.id === "tbdy"
          ? "Deprem araçlarını aç"
          : series.id === "imar"
            ? "İmar hesaplayıcıyı aç"
            : "İlgili aracı aç";

  return (
    <div className="not-prose my-12 rounded-xl border border-blue-500/25 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-sm dark:from-blue-950/20 dark:via-[#111111] dark:to-amber-950/20 md:p-8">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">İlgili araç önerisi</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{series.label}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        Bu makale {series.label} serisine ait. Hızlı ön kontrol için {series.description.toLowerCase()} temelli araca geçin.
      </p>
      <Button asChild size="lg" className="mt-6 px-8">
        <Link href={href}>
          {label}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function InlineToc({ parsedSections }: { parsedSections: ParsedSection[] }) {
  if (parsedSections.length === 0) {
    return null;
  }

  return (
    <div className="site-panel mb-10 overflow-hidden rounded-xl">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">
          <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          İçindekiler
        </h2>
      </div>
      <div className="grid gap-2 p-6 md:grid-cols-2">
        {parsedSections.map((sectionItem, index) => (
          <a
            key={sectionItem.id}
            href={`#${sectionItem.id}`}
            className="group flex items-start gap-3 rounded-md border border-border bg-card px-4 py-4 text-sm font-bold text-foreground transition-colors hover:border-blue-500/35 hover:bg-accent hover:text-blue-700 dark:hover:text-blue-300"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-black text-muted-foreground transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-700 dark:group-hover:text-blue-300">
              {index + 1}
            </span>
            <span className="leading-6">{sectionItem.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

interface ArticleBodyProps {
  article: ArticleData;
  relatedArticles: ArticleData[];
  parsedSections: ParsedSection[];
  hideToolPromos: boolean;
  suggestedTool?: { title: string; description: string; href: string; cta: string };
}

const ArticleBody = memo(function ArticleBody({ article, relatedArticles, parsedSections, hideToolPromos, suggestedTool }: ArticleBodyProps) {
  const firstRelatedArticle = relatedArticles[0];
  const authorPresentation = getArticleAuthorPresentation(article);
  let figureIndex = 0;

  return (
    <>
      <div className={ARTICLE_PROSE_CLASS} style={{ fontSize: "var(--article-font-size, 17px)" }}>
        {parsedSections.map((sectionItem, sectionIndex) => (
          <section key={sectionItem.id} style={sectionIndex > 1 ? DEFERRED_SECTION_STYLE : undefined}>
            <h2 id={sectionItem.id} className="scroll-m-32">
              {sectionItem.title}
            </h2>
            {sectionItem.blocks.map((block, blockIndex) => {
              if (block.type === "code") return <CodeBlock key={`${sectionItem.id}-${blockIndex}`} code={block.content} lang={block.lang} />;
              if (block.type === "formula") return <FormulaBlock key={`${sectionItem.id}-${blockIndex}`} block={block} />;
              if (block.type === "callout") return <CalloutBox key={`${sectionItem.id}-${blockIndex}`} content={block.content} tone={block.tone} title={block.title} />;
              if (block.type === "table") return <TableViewer key={`${sectionItem.id}-${blockIndex}`} content={block.content} />;
              if (block.type === "list") {
                const items = block.content.split("\n").filter(Boolean);
                const ordered = /^\d+\.\s/.test(items[0] || "");
                const ListTag = ordered ? "ol" : "ul";
                return (
                  <ListTag key={`${sectionItem.id}-${blockIndex}`} className={ordered ? "my-8 list-decimal space-y-3 pl-6" : "my-8 list-disc space-y-3 pl-6"}>
                    {items.map((item, itemIndex) => (
                      <li key={itemIndex} dangerouslySetInnerHTML={renderInlineMarkdown(item.replace(/^(?:- |\d+\.\s)/, ""))} />
                    ))}
                  </ListTag>
                );
              }
              if (block.type === "heading") {
                const HeadingTag = `h${Math.min(Math.max(block.level, 3), 4)}` as "h3" | "h4";
                return <HeadingTag key={`${sectionItem.id}-${blockIndex}`}>{block.content}</HeadingTag>;
              }
              if (block.type === "image") {
                figureIndex += 1;
                return (
                  <ArticleFigure
                    key={`${sectionItem.id}-${blockIndex}`}
                    block={block}
                    articleTitle={article.title}
                    figureNumber={block.figureNumber || String(figureIndex)}
                  />
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={`${sectionItem.id}-${blockIndex}`} className="border-l-4 border-blue-600 bg-blue-50/60 px-6 py-4 italic dark:bg-blue-950/15">
                    <div dangerouslySetInnerHTML={renderInlineMarkdown(block.content)} />
                  </blockquote>
                );
              }
              if (block.type === "divider") return <Separator key={`${sectionItem.id}-${blockIndex}`} className="my-10 dark:bg-zinc-800" />;
              return <p key={`${sectionItem.id}-${blockIndex}`} dangerouslySetInnerHTML={renderInlineMarkdown(block.content)} />;
            })}
            {sectionIndex === 0 && article.quote && article.sectionId !== "deprem-yonetmelik" ? (
              <div className="not-prose relative my-12 overflow-hidden rounded-r-xl border-l-8 border-amber-500 bg-amber-50/70 p-8 shadow-sm dark:bg-amber-950/20 sm:p-10">
                <Quote className="absolute right-4 top-4 -z-10 h-20 w-20 rotate-12 text-amber-100 dark:text-amber-900/20" />
                <p className="m-0 text-xl font-extrabold italic leading-relaxed text-amber-950 dark:text-amber-100 sm:text-2xl">&ldquo;{article.quote.text}&rdquo;</p>
              </div>
            ) : null}
            {!hideToolPromos && sectionIndex === 1 ? (
              article.sectionId === "deprem-yonetmelik" ? (
                <DepremSeriesToolCta article={article} />
              ) : (
                <InFlowToolCta articleSlug={article.slug} />
              )
            ) : null}
          </section>
        ))}

        <Separator className="my-16 dark:bg-zinc-800" />

        {/* İlişkili Hesaplama Modülü */}
        {suggestedTool && (
          <div className="not-prose my-12 rounded-[28px] border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-zinc-950/40 to-amber-500/10 p-6 shadow-md dark:border-amber-500/20 dark:from-zinc-900/60 dark:to-zinc-950 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-500 shadow-xl shadow-amber-500/5">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">İlişkili Hesaplama Modülü</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-white">{suggestedTool.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{suggestedTool.description}</p>
                <Button asChild className="mt-6 h-12 rounded-full bg-amber-500 px-8 text-sm font-black text-zinc-950 hover:bg-amber-400">
                  <Link href={suggestedTool.href}>
                    {suggestedTool.cta}
                    <ArrowRight className="ml-2 h-4 w-4 text-zinc-950" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

          <div className="not-prose site-panel mb-20 flex flex-col items-start gap-6 rounded-xl p-8 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-md border border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300">
            <span className="text-2xl font-black">{authorPresentation.monogram}</span>
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-xl font-black text-zinc-900 dark:text-zinc-100">{authorPresentation.name}</h3>
            {authorPresentation.title ? <p className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{authorPresentation.title}</p> : null}
            {article.sectionId !== "deprem-yonetmelik" ? (
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">Bu içerik, saha pratiği ile teknik referansları birlikte düşünen hızlı okuma düzeniyle sunuldu.</p>
            ) : null}
          </div>
        </div>


        {article.references && article.references.length > 0 ? (
          <div className="not-prose site-panel mb-16 rounded-xl p-8">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">
              <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              Kaynaklar / Yönetmelik Referansları
            </h3>
            <div className="space-y-3">
              {article.references.map((reference) => (
                <div key={reference.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                  {reference.href ? (
                    <a
                      href={reference.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-4 text-sm font-bold text-blue-700 hover:underline dark:text-blue-300"
                    >
                      <span>{reference.label}</span>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{reference.label}</p>
                  )}
                  {reference.note ? <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">{reference.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {firstRelatedArticle ? (
          <div className="not-prose mb-12 mt-4">
            <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sonraki okuma</h3>
            <Link
              href={`/${firstRelatedArticle.slug}`}
              className="site-link-card group block overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-50 to-amber-50 dark:from-blue-950/25 dark:to-amber-950/20"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-48 sm:aspect-auto">
                  <Image src={firstRelatedArticle.image} alt={firstRelatedArticle.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, 200px" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <Badge variant="outline" className={`${firstRelatedArticle.categoryColor} mb-2 w-fit border-none text-[9px] font-black uppercase`}>
                    {firstRelatedArticle.category}
                  </Badge>
                  <h4 className="mb-2 text-lg font-black leading-snug text-foreground transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    {firstRelatedArticle.title}
                  </h4>
                  <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{firstRelatedArticle.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
                    <span>Devam et</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
});

export default function ArticleClient({
  article,
  relatedArticles,
  parsedSections,
  breadcrumbs,
  backLink,
  hideToolPromos = false,
  suggestedTool,
}: ArticleClientProps) {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(parsedSections[0]?.id || "");
  const section = getSiteSectionForArticle(article);
  const sectionHref = getSiteSectionHrefForArticle(article);
  const authorPresentation = getArticleAuthorPresentation(article);

  useEffect(() => {
    const sectionElements = parsedSections
      .map((sectionItem) => document.getElementById(sectionItem.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (sectionElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

        if (visibleEntries.length > 0) {
          setActiveId((current) => (current === visibleEntries[0].target.id ? current : visibleEntries[0].target.id));
        }
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [parsedSections]);

  const breadcrumbItems = breadcrumbs ?? [
    { title: "Ana Sayfa", href: "/" },
    { title: section?.title || article.category, href: sectionHref },
    { title: article.title, href: `/${article.slug}` },
  ];

  const closeMobileToc = () => setMobileTocOpen(false);

  return (
    <div className="article-page site-page-shell relative flex flex-col">
      <ScrollProgress />
      <main className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-12 px-5 py-10 sm:px-8 md:py-14 lg:flex-row lg:px-12 xl:px-16">
        <article className="mx-auto w-full max-w-3xl lg:w-8/12 xl:mx-0">
          <PageContextNavigation
            className="mb-8 flex flex-col gap-4"
            breadcrumbs={breadcrumbItems}
            backHref={backLink?.href}
            backLabel={backLink?.title}
          />

          <header className="mb-10 border-b border-border pb-10">
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className={`${article.categoryColor} border-none px-3 py-1 text-[10px] font-black uppercase tracking-wider`}>{article.category}</Badge>
              <Badge variant="outline" className="border-zinc-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
                {article.badgeLabel}
              </Badge>
            </div>
            {article.tags && article.tags.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {article.tags.slice(0, 8).map((tag) => (
                  <Badge key={tag} variant="outline" className="border-zinc-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            <h1 className="mb-7 text-4xl font-black leading-[0.98] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">{article.title}</h1>
            <div className="site-panel mb-8 rounded-xl p-6 md:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                <span className="h-4 w-1 bg-amber-500" />
                Hızlı özet
              </h2>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">{article.description}</p>
            </div>
            <div className="flex flex-col justify-between gap-6 border-y border-zinc-100 py-6 dark:border-zinc-800 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300">
                  <span className="text-lg font-black">{authorPresentation.monogram}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">{authorPresentation.name}</p>
                  {authorPresentation.title ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{authorPresentation.title}</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
                <span className="rounded-md border border-border bg-card px-4 py-2">{article.date}</span>
                {article.updatedAt ? (
                  <span className="rounded-md border border-border bg-card px-4 py-2">Güncelleme: {article.updatedAt}</span>
                ) : null}
                <FontSizeControl />
                <Button type="button" variant="outline" size="sm" onClick={() => setMobileTocOpen(true)} className="lg:hidden">
                  <List className="mr-2 h-4 w-4" />
                  İçindekiler
                </Button>
              </div>
            </div>
          </header>

          <InlineToc parsedSections={parsedSections} />

          {article.image ? (
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <Image
                src={article.image}
                alt={article.title}
                fill
                unoptimized={article.image.toLowerCase().includes(".svg")}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>
          ) : null}

          <ArticleBody article={article} relatedArticles={relatedArticles} parsedSections={parsedSections} hideToolPromos={hideToolPromos} suggestedTool={suggestedTool} />
        </article>

        <aside className="hidden w-4/12 max-w-[320px] shrink-0 border-l border-border pl-6 lg:block xl:max-w-xs">
          <div className="sticky top-24 flex flex-col gap-8 pt-4">
            <div>
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-200 pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                <BookOpen className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                İçindekiler
              </div>
              <ScrollArea className="max-h-[360px] pr-4">
                <nav className="relative flex flex-col gap-1.5 border-l-2 border-zinc-100 pl-4 dark:border-zinc-800">
                  {parsedSections.map((sectionItem) => {
                    const isActive = sectionItem.id === activeId;
                    return (
                      <a
                        key={sectionItem.id}
                        href={`#${sectionItem.id}`}
                        className={`relative py-1.5 text-sm font-bold tracking-tight transition-all hover:translate-x-1 ${
                          isActive ? "-ml-[18px] border-l-2 border-blue-600 pl-4 text-blue-700 dark:border-blue-400 dark:text-blue-300" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {sectionItem.title}
                      </a>
                    );
                  })}
                </nav>
              </ScrollArea>
            </div>

            {!hideToolPromos ? (
              <div className="site-panel rounded-xl p-6">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">İşinize yarayabilir</h4>
                <p className="mb-6 text-sm font-bold leading-relaxed text-zinc-900 dark:text-zinc-100">
                  {article.slug === "kalip-sokumu-rehberi" ? "Kalıp söküm süresi hesabını araç üzerinden hemen açın." : "Tüm hesap araçlarını tek kategoride açıp ihtiyacınız olan araca geçin."}
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href={article.slug === "kalip-sokumu-rehberi" ? "/kategori/araclar/kalip-sokum-suresi" : TOOLS_HUB_HREF}>
                    {article.slug === "kalip-sokumu-rehberi" ? "Kalıp söküm süresini hesapla" : "Tüm araçları aç"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </main>

      <Button type="button" size="sm" onClick={() => setMobileTocOpen(true)} className="fixed bottom-24 right-4 z-40 px-4 shadow-lg lg:hidden">
        <List className="mr-2 h-4 w-4" />
        İçindekiler
      </Button>

      <PortalOverlay isOpen={mobileTocOpen} onClose={closeMobileToc}>
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden" onClick={closeMobileToc} />
        <div className="fixed bottom-0 left-0 right-0 z-[101] flex max-h-[85vh] flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
            <h3 className="flex items-center gap-2 text-lg font-black text-zinc-950 dark:text-white">
              <BookOpen className="h-5 w-5 text-amber-600" /> İçindekiler
            </h3>
            <Button type="button" variant="ghost" size="icon" onClick={closeMobileToc} className="rounded-full bg-zinc-100 dark:bg-zinc-800">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-6">
            <nav className="overflow-hidden rounded-2xl border border-zinc-100 text-sm dark:border-zinc-800">
              {parsedSections.map((sectionItem, index) => (
                <a
                  key={sectionItem.id}
                  href={`#${sectionItem.id}`}
                  onClick={closeMobileToc}
                  className="flex items-center border-b border-zinc-50 px-4 py-4 font-bold leading-snug text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 last:border-none"
                >
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-500 dark:bg-zinc-800">
                    {index + 1}
                  </span>
                  {sectionItem.title}
                </a>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </PortalOverlay>
    </div>
  );
}
