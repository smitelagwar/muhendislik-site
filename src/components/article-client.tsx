"use client";

import { memo, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
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
import { ScrollProgress } from "@/components/scroll-progress";
import { type ArticleData } from "@/lib/articles-data";
import { type ParsedBlock } from "@/lib/article-blocks";
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
}

type ParsedSection = ArticleData["sections"][number] & { blocks: ParsedBlock[] };

const ARTICLE_PROSE_CLASS =
  "prose prose-zinc max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-16 prose-h2:border-b-2 prose-h2:border-zinc-100 prose-h2:pb-4 prose-h2:text-3xl dark:prose-h2:border-zinc-800 prose-h3:mt-10 prose-h3:text-2xl prose-p:mb-8 prose-p:max-w-[72ch] prose-p:text-[1.02em] prose-p:leading-[1.72] prose-li:leading-[1.72] prose-li:marker:text-blue-600 prose-a:font-bold prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400 prose-strong:font-black prose-strong:text-zinc-900 dark:prose-strong:text-zinc-50";
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
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="font-bold text-blue-700 underline-offset-4 hover:underline dark:text-blue-400">$1</a>')
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

function CalloutBox({ content, tone }: { content: string; tone: string }) {
  const isWarning = /(uyari|warning|important)/i.test(tone);
  const isTip = /(ipucu|tip)/i.test(tone);
  const icon = isWarning ? (
    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
  ) : isTip ? (
    <Lightbulb className="h-5 w-5 flex-shrink-0 text-purple-500" />
  ) : (
    <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-300" />
  );
  const classes = isWarning
    ? "border-amber-500 bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"
    : isTip
      ? "border-purple-500 bg-purple-50/70 text-purple-950 dark:bg-purple-950/20 dark:text-purple-100"
      : "border-blue-600 bg-blue-50/70 text-blue-950 dark:bg-blue-950/20 dark:text-blue-100";

  return (
    <div className={`not-prose my-8 flex gap-4 rounded-r-2xl border-l-4 p-6 shadow-sm ${classes}`}>
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm font-medium leading-7 md:text-base" dangerouslySetInnerHTML={renderInlineMarkdown(content)} />
    </div>
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
    <div className="not-prose my-12 rounded-[28px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm dark:border-blue-900/40 dark:from-blue-950/30 dark:via-zinc-950 dark:to-indigo-950/30 md:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">Araç kısayolu</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        {articleSlug === "kalip-sokumu-rehberi"
          ? "Şantiye koşullarına göre tahmini bekleme süresini araç üzerinden hemen karşılaştırın."
          : "İhtiyacınız olan mühendislik aracına tek kategori üzerinden hızlıca geçin."}
      </p>
      <Button asChild className="mt-6 h-12 rounded-full bg-blue-700 px-8 text-sm font-black text-white hover:bg-blue-800">
        <Link href={href} prefetch={false}>
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
    <div className="not-prose my-12 rounded-[28px] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:via-zinc-950 dark:to-orange-950/20 md:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">İlgili araç önerisi</p>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">{series.label}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        Bu makale {series.label} serisine ait. Hızlı ön kontrol için {series.description.toLowerCase()} temelli araca geçin.
      </p>
      <Button asChild className="mt-6 h-12 rounded-full bg-amber-500 px-8 text-sm font-black text-zinc-950 hover:bg-amber-400">
        <Link href={href} prefetch={false}>
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
    <div className="mb-10 overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">
          <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
          İçindekiler
        </h2>
      </div>
      <div className="grid gap-2 p-6 md:grid-cols-2">
        {parsedSections.map((sectionItem, index) => (
          <a
            key={sectionItem.id}
            href={`#${sectionItem.id}`}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-sm font-bold text-zinc-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20 dark:hover:text-blue-300"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-500 transition group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-300">
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
}

const ArticleBody = memo(function ArticleBody({ article, relatedArticles, parsedSections, hideToolPromos }: ArticleBodyProps) {
  const firstRelatedArticle = relatedArticles[0];

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
              if (block.type === "callout") return <CalloutBox key={`${sectionItem.id}-${blockIndex}`} content={block.content} tone={block.tone} />;
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
                return (
                  <figure key={`${sectionItem.id}-${blockIndex}`} className="not-prose my-10 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="relative aspect-[16/9]">
                      <Image src={block.src} alt={block.alt || article.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" />
                    </div>
                    {block.caption ? <figcaption className="border-t border-zinc-200 px-5 py-4 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">{block.caption}</figcaption> : null}
                  </figure>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={`${sectionItem.id}-${blockIndex}`} className="border-l-4 border-blue-600 bg-blue-50/40 px-6 py-4 italic dark:bg-blue-950/10">
                    <div dangerouslySetInnerHTML={renderInlineMarkdown(block.content)} />
                  </blockquote>
                );
              }
              if (block.type === "divider") return <Separator key={`${sectionItem.id}-${blockIndex}`} className="my-10 dark:bg-zinc-800" />;
              return <p key={`${sectionItem.id}-${blockIndex}`} dangerouslySetInnerHTML={renderInlineMarkdown(block.content)} />;
            })}
            {sectionIndex === 0 && article.quote ? (
              <div className="not-prose relative my-12 overflow-hidden rounded-r-3xl border-l-8 border-blue-600 bg-blue-50/60 p-8 shadow-sm dark:bg-blue-950/20 sm:p-10">
                <Quote className="absolute right-4 top-4 -z-10 h-20 w-20 rotate-12 text-blue-100 dark:text-blue-900/20" />
                <p className="m-0 text-xl font-extrabold italic leading-relaxed text-blue-900 dark:text-blue-100 sm:text-2xl">&ldquo;{article.quote.text}&rdquo;</p>
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

        <div className="not-prose mb-20 flex flex-col items-start gap-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-xl shadow-blue-500/20 dark:bg-blue-600">
            <span className="text-2xl font-black">{article.author.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-xl font-black text-zinc-900 dark:text-zinc-100">{article.author}</h3>
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{article.authorTitle}</p>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">Bu içerik, saha pratiği ile teknik referansları birlikte düşünen hızlı okuma düzeniyle sunuldu.</p>
          </div>
        </div>


        {article.references && article.references.length > 0 ? (
          <div className="not-prose mb-16 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-zinc-900 dark:text-zinc-100">
              <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
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
                      className="flex items-start justify-between gap-4 text-sm font-bold text-blue-700 hover:underline dark:text-blue-400"
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
              prefetch={false}
              className="group block overflow-hidden rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 dark:border-blue-800/30 dark:from-blue-950/40 dark:to-indigo-950/40"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-video w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-48 sm:aspect-auto">
                  <Image src={firstRelatedArticle.image} alt={firstRelatedArticle.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 640px) 100vw, 200px" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6">
                  <Badge variant="outline" className={`${firstRelatedArticle.categoryColor} mb-2 w-fit border-none text-[9px] font-black uppercase`}>
                    {firstRelatedArticle.category}
                  </Badge>
                  <h4 className="mb-2 text-lg font-black leading-snug text-zinc-900 transition-colors group-hover:text-blue-700 dark:text-zinc-100 dark:group-hover:text-blue-400">
                    {firstRelatedArticle.title}
                  </h4>
                  <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{firstRelatedArticle.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
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
}: ArticleClientProps) {
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeId, setActiveId] = useState(parsedSections[0]?.id || "");
  const section = getSiteSectionForArticle(article);
  const sectionHref = getSiteSectionHrefForArticle(article);

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

  return (
    <div className="relative flex flex-col">
      <ScrollProgress />
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:flex-row lg:px-8 md:py-12">
        <article className="mx-auto w-full max-w-3xl lg:w-8/12 xl:mx-0">
          <PageContextNavigation
            className="mb-8 flex flex-col gap-4"
            breadcrumbs={breadcrumbItems}
            backHref={backLink?.href}
            backLabel={backLink?.title}
          />

          <header className="mb-10">
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
            <h1 className="mb-6 text-4xl font-black leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl lg:text-6xl">{article.title}</h1>
            <div className="mb-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                <span className="h-4 w-1.5 rounded-full bg-blue-600" />
                Hızlı özet
              </h2>
              <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">{article.description}</p>
            </div>
            <div className="flex flex-col justify-between gap-6 border-y border-zinc-100 py-6 dark:border-zinc-800 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-500/20 dark:bg-blue-600">
                  <span className="text-lg font-black">{article.author.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-950 dark:text-zinc-100">{article.author}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{article.authorTitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
                <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">{article.date}</span>
                {article.updatedAt ? (
                  <span className="rounded-full bg-zinc-100 px-4 py-2 dark:bg-zinc-900">Güncelleme: {article.updatedAt}</span>
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
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-[32px] border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Image src={article.image} alt={article.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" />
            </div>
          ) : null}

          <ArticleBody article={article} relatedArticles={relatedArticles} parsedSections={parsedSections} hideToolPromos={hideToolPromos} />
        </article>

        <aside className="hidden w-4/12 max-w-[320px] shrink-0 border-l border-dashed border-zinc-100 pl-4 dark:border-zinc-800/50 lg:block xl:max-w-xs">
          <div className="sticky top-24 flex flex-col gap-8 pt-4">
            <div>
              <div className="mb-6 flex items-center gap-2 border-b border-zinc-200 pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                <BookOpen className="h-3.5 w-3.5 text-blue-700 dark:text-blue-500" />
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
                          isActive ? "-ml-[18px] border-l-2 border-blue-700 pl-4 text-blue-700 dark:border-blue-500 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
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
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h4 className="mb-3 text-[10px] font-black uppercase tracking-wider text-zinc-400">İşinize yarayabilir</h4>
                <p className="mb-6 text-sm font-bold leading-relaxed text-zinc-900 dark:text-zinc-100">
                  {article.slug === "kalip-sokumu-rehberi" ? "Kalıp söküm süresi hesabını araç üzerinden hemen açın." : "Tüm hesap araçlarını tek kategoride açıp ihtiyacınız olan araca geçin."}
                </p>
                <Button asChild size="sm" className="h-10 w-full rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800">
                  <Link href={article.slug === "kalip-sokumu-rehberi" ? "/kategori/araclar/kalip-sokum-suresi" : TOOLS_HUB_HREF} prefetch={false}>
                    {article.slug === "kalip-sokumu-rehberi" ? "Kalıp söküm süresini hesapla" : "Tüm araçları aç"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </main>

      <Button type="button" size="sm" onClick={() => setMobileTocOpen(true)} className="fixed bottom-24 right-4 z-40 rounded-full px-4 shadow-lg shadow-blue-600/20 lg:hidden">
        <List className="mr-2 h-4 w-4" />
        İçindekiler
      </Button>

      {mobileTocOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileTocOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] flex max-h-[85vh] flex-col rounded-t-3xl border-t border-zinc-200 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 text-lg font-black">
                <BookOpen className="h-5 w-5 text-blue-600" /> İçindekiler
              </h3>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMobileTocOpen(false)} className="rounded-full bg-zinc-100 dark:bg-zinc-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              <nav className="overflow-hidden rounded-2xl border border-zinc-100 text-sm dark:border-zinc-800">
                {parsedSections.map((sectionItem, index) => (
                  <a
                    key={sectionItem.id}
                    href={`#${sectionItem.id}`}
                    onClick={() => setMobileTocOpen(false)}
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
        </>
      ) : null}
    </div>
  );
}
