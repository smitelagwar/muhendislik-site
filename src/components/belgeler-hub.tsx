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
  if (category === "santiye-tutanak") return <ClipboardCheck className="h-7 w-7" />;
  if (category === "taahhutname") return <FileSignature className="h-7 w-7" />;
  if (category === "sozlesme") return <FileCheck2 className="h-7 w-7" />;
  return <FilePenLine className="h-7 w-7" />;
}

const DOCUMENT_CARD_THEMES = {
  "santiye-tutanak": {
    surface: "bg-[linear-gradient(145deg,#15120c_0%,#2f2413_52%,#101010_100%)]",
    icon: "border-amber-300/25 bg-amber-300/15 text-amber-200",
    glow: "bg-amber-400/25",
    line: "bg-amber-300/60",
  },
  taahhutname: {
    surface: "bg-[linear-gradient(145deg,#0b1220_0%,#132746_52%,#0a0d13_100%)]",
    icon: "border-blue-300/25 bg-blue-300/15 text-blue-200",
    glow: "bg-blue-400/25",
    line: "bg-blue-300/60",
  },
  dilekce: {
    surface: "bg-[linear-gradient(145deg,#111114_0%,#282130_52%,#0c0c0f_100%)]",
    icon: "border-violet-300/25 bg-violet-300/15 text-violet-200",
    glow: "bg-violet-400/25",
    line: "bg-violet-300/60",
  },
  sozlesme: {
    surface: "bg-[linear-gradient(145deg,#0b1a12_0%,#132b1e_52%,#0a100d_100%)]",
    icon: "border-emerald-300/25 bg-emerald-300/15 text-emerald-200",
    glow: "bg-emerald-400/25",
    line: "bg-emerald-300/60",
  },
} as const;

function DocumentVisual({ document }: { document: DocumentItem }) {
  const theme = DOCUMENT_CARD_THEMES[document.category as keyof typeof DOCUMENT_CARD_THEMES];

  return (
    <div className={`relative h-56 overflow-hidden ${theme.surface}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125 ${theme.glow}`} />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle 280px at var(--pointer-x) var(--pointer-y), rgba(255,255,255,0.16), transparent 65%)" }}
      />

      <div className="relative flex h-full flex-col justify-between p-6 text-white sm:p-7">
        <div className="flex justify-end gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/35" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
        </div>

        <div className="flex items-end justify-between gap-6">
          <span className={`home-resource-icon flex h-16 w-16 items-center justify-center rounded-2xl border backdrop-blur-md ${theme.icon}`}>
            <DocumentCategoryIcon category={document.category} />
          </span>

          <div className="flex items-end gap-1.5 pb-1" aria-hidden="true">
            <span className={`h-8 w-1 rounded-full opacity-30 ${theme.line}`} />
            <span className={`h-12 w-1 rounded-full opacity-45 ${theme.line}`} />
            <span className={`h-16 w-1 rounded-full opacity-60 ${theme.line}`} />
            <span className={`h-10 w-1 rounded-full opacity-35 ${theme.line}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function handleCardPointerMove(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const rotateY = ((x / rect.width) - 0.5) * 4;
  const rotateX = -((y / rect.height) - 0.5) * 4;

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
  return (
    <article
      id={document.id}
      onMouseMove={handleCardPointerMove}
      onMouseLeave={handleCardPointerLeave}
      className="home-interactive-card group relative flex min-h-full flex-col overflow-hidden rounded-[24px] border border-border bg-[var(--site-surface)] shadow-[0_24px_70px_-52px_rgba(23,26,25,0.72)] transition-[border-color,box-shadow] duration-300 hover:border-amber-500/45 hover:shadow-[0_30px_80px_-48px_rgba(180,83,9,0.38)] dark:shadow-none"
    >
      <DocumentVisual document={document} />

      <div className="relative z-[2] flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-2xl font-black leading-tight tracking-[-0.035em] text-foreground">
          <Link
            href={document.studioUrl}
            className="transition-colors hover:text-amber-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-400"
          >
            {document.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{document.description}</p>

        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_48px] gap-2 pt-7">
          <Link
            href={document.studioUrl}
            className="group/link flex min-h-12 w-full items-center justify-between rounded-xl border border-foreground bg-foreground px-4 py-3 text-sm font-black text-background transition hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-500 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
          >
            <span className="inline-flex items-center gap-2">
              <FilePenLine className="h-4 w-4" />
              Stüdyoda doldur
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5 motion-reduce:transform-none" />
          </Link>
          <button
            type="button"
            onClick={() => onPreview(document)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:-translate-y-0.5 hover:border-blue-500/45 hover:bg-blue-500/10 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transform-none dark:hover:text-blue-300"
            aria-label={`${document.title} için hızlı önizlemeyi aç`}
            title="Hızlı önizle"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
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
        className="scroll-mt-24 border-b border-border/80"
      >
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20 xl:px-16">
          <div className="flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="site-kicker">Belge kütüphanesi</p>
              <h2
                id="belge-arsivi-baslik"
                className="mt-4 text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl"
              >
                İhtiyacınız olan belgeyi bulun
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Şablonu doğrudan indirebilir veya canlı stüdyoda doldurarak belgeyi imza ve teslim sürecine hazırlayabilirsiniz.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-[var(--site-surface-raised)] p-4 sm:p-5">
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
                  placeholder="Belge adı, tutanak, dilekçe veya anahtar kelime ara"
                  className="h-12 w-full rounded-md border border-border bg-[var(--site-surface)] pl-11 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span aria-live="polite">{filteredDocuments.length} belge gösteriliyor</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto border-t border-border pt-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {DOCUMENT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-[var(--site-surface)] text-muted-foreground hover:border-amber-500/40 hover:text-foreground"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] ${
                        isSelected ? "bg-background/15 text-background" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {categoryCounts[category.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} onPreview={setActiveFormDoc} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-border bg-[var(--site-surface)] px-6 py-16 text-center">
              <Search className="mx-auto h-9 w-9 text-muted-foreground/55" />
              <h3 className="mt-5 text-xl font-black text-foreground">Eşleşen belge bulunamadı</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Arama ifadenizi değiştirin veya tüm belge kategorilerine geri dönün.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:border-amber-500/45 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Filtreleri temizle
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(activeFormDoc)} onOpenChange={(open) => !open && setActiveFormDoc(null)}>
        {activeFormDoc ? (
          <DialogContent
            showCloseButton={false}
            className="block h-[100dvh] w-full max-w-full gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl sm:h-[94dvh] sm:w-[calc(100%-2rem)] sm:max-w-7xl sm:rounded-xl sm:border sm:border-border sm:bg-transparent"
            overlayClassName="bg-black/80"
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
