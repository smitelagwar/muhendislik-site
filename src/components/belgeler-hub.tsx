"use client";

import { useId, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileSignature,
  Search,
  X,
} from "lucide-react";
import {
  DOCUMENTS,
  type DocumentCategory,
  type DocumentItem,
} from "@/lib/documents-data";

function DocumentCategoryIcon({ category }: { category: DocumentCategory }) {
  if (category === "santiye-tutanak") return <ClipboardCheck className="h-5 w-5" />;
  if (category === "taahhutname") return <FileSignature className="h-5 w-5" />;
  if (category === "sozlesme") return <FileCheck2 className="h-5 w-5" />;
  return <FilePenLine className="h-5 w-5" />;
}

const THEMES = {
  "santiye-tutanak": {
    spotlight: "radial-gradient(ellipse at 50% -10%, rgba(245,158,11,0.2) 0%, transparent 70%)",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300",
    iconBg: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  taahhutname: {
    spotlight: "radial-gradient(ellipse at 50% -10%, rgba(59,130,246,0.2) 0%, transparent 70%)",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300",
    iconBg: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:border-blue-400/35 dark:bg-blue-500/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  dilekce: {
    spotlight: "radial-gradient(ellipse at 50% -10%, rgba(139,92,246,0.2) 0%, transparent 70%)",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-300",
    iconBg: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  sozlesme: {
    spotlight: "radial-gradient(ellipse at 50% -10%, rgba(16,185,129,0.2) 0%, transparent 70%)",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    iconBg: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
} as const;

function handleCardPointerMove(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rotateY = ((x / rect.width) - 0.5) * 3;
  const rotateX = -((y / rect.height) - 0.5) * 3;

  card.style.setProperty("--pointer-x", `${x}px`);
  card.style.setProperty("--pointer-y", `${y}px`);
  card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
  card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
}

function handleCardPointerLeave(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--rotate-x", "0deg");
  event.currentTarget.style.setProperty("--rotate-y", "0deg");
}

function DocumentCard({
  document,
}: {
  document: DocumentItem;
}) {
  const theme = THEMES[document.category as keyof typeof THEMES];

  return (
    <article
      id={document.id}
      onMouseMove={handleCardPointerMove}
      onMouseLeave={handleCardPointerLeave}
      className="group relative flex min-h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white/75 p-6 shadow-md backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/30 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl dark:hover:border-white/20 sm:p-7"
      style={{
        boxShadow: "0 20px 50px -15px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.8)",
      }}
    >
      {/* Top Ambient Spotlight */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 h-44 opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: theme.spotlight }}
      />

      {/* Dynamic Cursor Light Flare */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(circle 260px at var(--pointer-x) var(--pointer-y), rgba(255,255,255,0.15), transparent 65%)",
        }}
      />

      {/* ─── Top Header: Category Tag & Icon ─── */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm backdrop-blur-md ${theme.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_6px_currentColor] ${theme.dot}`} />
          {document.categoryLabel}
        </span>

        {/* Category Avatar Icon */}
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-xl transition-transform duration-300 group-hover:scale-105 ${theme.iconBg}`}
        >
          <DocumentCategoryIcon category={document.category} />
        </span>
      </div>

      {/* ─── Title & Description ─── */}
      <div className="relative z-10 mt-5">
        <h3 className="text-xl font-black leading-snug tracking-[-0.03em] text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400 sm:text-2xl">
          <Link
            href={document.studioUrl}
            className="focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {document.title}
          </Link>
        </h3>
        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-muted-foreground">{document.description}</p>
      </div>

      {/* ─── Feature Chips ─── */}
      <div className="relative z-10 my-6 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4 dark:border-white/[0.08]">
        <span className="rounded-full border border-black/5 bg-black/[0.03] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
          PDF / A4 Çıktı
        </span>
        <span className="rounded-full border border-black/5 bg-black/[0.03] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
          Canlı Stüdyo
        </span>
        <span className="rounded-full border border-black/5 bg-black/[0.03] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70">
          Resmi Format
        </span>
      </div>

      {/* ─── Bottom Actions ─── */}
      <div className="relative z-10 mt-auto">
        <Link
          href={document.studioUrl}
          className="group/btn relative inline-flex min-h-12 w-full items-center justify-between overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-black text-zinc-950 shadow-[0_6px_20px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_28px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            <FilePenLine className="h-4 w-4" />
            Stüdyoda doldur
          </span>
          <ChevronRight className="relative z-10 h-4 w-4 transition-transform group-hover/btn:translate-x-1 motion-reduce:transform-none" />
        </Link>
      </div>
    </article>
  );
}

export function BelgelerHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputId = useId();

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

    if (!query) return DOCUMENTS;

    return DOCUMENTS.filter((document) => {
      const searchableText = [
        document.title,
        document.subtitle,
        document.description,
        document.categoryLabel,
        document.targetAudience,
        document.usageGuide,
        document.legalReference ?? "",
        ...document.tags,
        ...document.fields.map((field) => field.label),
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return searchableText.includes(query);
    });
  }, [searchQuery]);

  return (
    <section aria-label="Belge arama ve listesi">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
        <div className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            Belge veya şablon ara
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Belge adı, tutanak, taahhütname veya anahtar kelime ara..."
            className="h-13 w-full rounded-2xl border border-black/10 bg-white/75 pl-11 pr-11 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none backdrop-blur-xl transition-all focus:border-amber-500/60 focus:bg-white focus:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:focus:bg-white/[0.1] dark:focus:shadow-[0_0_24px_rgba(245,158,11,0.2)]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[24px] border border-black/5 bg-white/60 px-6 py-12 text-center dark:border-white/10 dark:bg-white/[0.03]">
            <Search className="mx-auto h-9 w-9 text-muted-foreground/50" />
            <h2 className="mt-4 text-lg font-black text-foreground">Eşleşen belge bulunamadı</h2>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-5 inline-flex min-h-10 items-center rounded-full border border-black/10 bg-black/[0.04] px-5 py-2.5 text-sm font-bold text-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-amber-400/40 dark:hover:bg-amber-500/20"
            >
              Aramayı temizle
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
