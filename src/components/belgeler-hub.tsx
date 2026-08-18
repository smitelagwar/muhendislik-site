"use client";

import { useId, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FilePenLine,
  FileSignature,
  FileText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { BetonDokumStudio } from "@/components/beton-dokum-studio";
import { InsaatRuhsatiStudio } from "@/components/insaat-ruhsati-studio";
import { IstifaStudio } from "@/components/istifa-studio";
import { SozlesmeStudio } from "@/components/sozlesme-studio";
import { TaahhutnameStudio } from "@/components/taahhutname-studio";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DOCUMENT_CATEGORIES,
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
  onPreview,
}: {
  document: DocumentItem;
  onPreview: (document: DocumentItem) => void;
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
      <div className="relative z-10 mt-auto grid grid-cols-[minmax(0,1fr)_48px] gap-2.5">
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

        <button
          type="button"
          onClick={() => onPreview(document)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] text-muted-foreground shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-blue-400/40 dark:hover:bg-blue-500/20 dark:hover:text-blue-300 motion-reduce:transform-none"
          aria-label={`${document.title} için hızlı önizlemeyi aç`}
          title="Hızlı önizle"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function StudioPreview({
  document,
  onClose,
}: {
  document: DocumentItem;
  onClose?: () => void;
}) {
  if (document.id === "beton-dokum-tutanagi") {
    return <BetonDokumStudio isModal onClose={onClose} />;
  }

  if (document.id === "santiye-sefi-taahhutnamesi") {
    return <TaahhutnameStudio isModal onClose={onClose} />;
  }

  if (document.id === "insaat-ruhsati-dilekcesi") {
    return <InsaatRuhsatiStudio isModal onClose={onClose} />;
  }

  if (document.id === "santiye-sefi-sozlesmesi") {
    return <SozlesmeStudio isModal onClose={onClose} />;
  }

  return <IstifaStudio isModal onClose={onClose} />;
}

export function BelgelerHub() {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFormDoc, setActiveFormDoc] = useState<DocumentItem | null>(null);
  const searchInputId = useId();

  const categoryCounts = useMemo(() => {
    return DOCUMENT_CATEGORIES.reduce<Record<DocumentCategory, number>>(
      (counts, category) => {
        counts[category.id] =
          category.id === "all"
            ? DOCUMENTS.length
            : DOCUMENTS.filter((document) => document.category === category.id).length;
        return counts;
      },
      { all: 0, "santiye-tutanak": 0, taahhutname: 0, dilekce: 0, sozlesme: 0 },
    );
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("tr-TR");

    return DOCUMENTS.filter((document) => {
      const categoryMatches =
        selectedCategory === "all" || document.category === selectedCategory;

      if (!categoryMatches) return false;
      if (!query) return true;

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
  }, [searchQuery, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <>
      <section
        id="belge-arsivi"
        aria-labelledby="belge-arsivi-baslik"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20 xl:px-16">
          {/* Section Header */}
          <div className="flex flex-col gap-5 border-b border-black/5 pb-8 dark:border-white/[0.08] lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 shadow-sm backdrop-blur-md dark:border-amber-400/35 dark:bg-white/[0.08]"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                  Belge Kütüphanesi
                </span>
              </div>
              <h2
                id="belge-arsivi-baslik"
                className="mt-4 text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl"
              >
                İhtiyacınız olan belgeyi bulun
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Şablonu doğrudan indirebilir veya canlı stüdyoda doldurarak resmi belgeyi imza ve teslim sürecine saniyeler içinde hazırlayabilirsiniz.
            </p>
          </div>

          {/* ─── Search + Filter Panel ─── */}
          <div className="mt-8 rounded-[28px] border border-black/5 bg-white/75 p-5 shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
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
                  className="h-13 w-full rounded-2xl border border-black/10 bg-black/[0.03] pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-xl transition-all focus:border-amber-500/60 focus:bg-white focus:shadow-md dark:border-white/15 dark:bg-white/[0.06] dark:focus:bg-white/[0.1] dark:focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span aria-live="polite">{filteredDocuments.length} belge listeleniyor</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-5 flex gap-2.5 overflow-x-auto border-t border-black/5 pt-4 dark:border-white/[0.08] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {DOCUMENT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isSelected
                        ? "border border-amber-500/50 bg-amber-500/15 text-amber-700 shadow-sm dark:border-amber-400/50 dark:bg-amber-500/20 dark:text-amber-300"
                        : "border border-black/5 bg-black/[0.03] text-muted-foreground hover:border-black/15 hover:bg-black/[0.06] hover:text-foreground dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/[0.1] dark:hover:text-white"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-800 dark:bg-amber-400/30 dark:text-amber-200"
                          : "bg-black/5 text-muted-foreground dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {categoryCounts[category.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Document Cards Grid ─── */}
          {filteredDocuments.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} onPreview={setActiveFormDoc} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-black/5 bg-white/75 px-6 py-16 text-center shadow-lg backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl">
              <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-5 text-xl font-black text-foreground">Eşleşen belge bulunamadı</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Arama ifadenizi değiştirin veya tüm belge kategorilerini görüntüleyin.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-5 py-2.5 text-sm font-bold text-foreground shadow-sm backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-amber-400/40 dark:hover:bg-amber-500/20 dark:hover:text-amber-300"
              >
                Filtreleri Temizle
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Live Studio Modal Dialog */}
      <Dialog open={Boolean(activeFormDoc)} onOpenChange={(open) => !open && setActiveFormDoc(null)}>
        {activeFormDoc ? (
          <DialogContent
            showCloseButton={false}
            className="block h-[100dvh] w-full max-w-full gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl sm:h-[94dvh] sm:w-[calc(100%-2rem)] sm:max-w-7xl sm:rounded-3xl sm:border sm:border-border sm:bg-background/95 sm:backdrop-blur-2xl"
            overlayClassName="bg-black/60 backdrop-blur-sm"
          >
            <DialogTitle className="sr-only">{activeFormDoc.title} hızlı önizleme</DialogTitle>
            <DialogDescription className="sr-only">
              Belgeyi canlı stüdyoda düzenleyin ve PDF önizlemesini kontrol edin.
            </DialogDescription>
            <StudioPreview
              document={activeFormDoc}
              onClose={() => setActiveFormDoc(null)}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
