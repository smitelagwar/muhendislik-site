"use client";

import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FilePenLine,
  FileSignature,
  Search,
  X,
} from "lucide-react";
import { AmbientOceanCanvas } from "@/components/ambient-ocean-canvas";
import { BelgelerGlassBg } from "@/components/belgeler-glass-bg";
import { BelgelerOfflinePrepare } from "@/components/belgeler-offline-prepare";
import { OceanEcosystemIcon } from "@/components/icons/ocean-ecosystem-icon";
import {
  DOCUMENTS,
  type DocumentCategory,
  type DocumentItem,
} from "@/lib/documents-data";
import { normalizeBelgelerSearchText } from "@/lib/belgeler-search";

const OCEAN_STORAGE_KEY = "muhendis_ocean_ambient_enabled";
let oceanListeners: Array<() => void> = [];

function subscribeOcean(listener: () => void) {
  oceanListeners.push(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === OCEAN_STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    oceanListeners = oceanListeners.filter((l) => l !== listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getOceanSnapshot() {
  try {
    const saved = localStorage.getItem(OCEAN_STORAGE_KEY);
    return saved !== null ? saved === "true" : true;
  } catch {
    return true;
  }
}

function getOceanServerSnapshot() {
  return true;
}

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

const cardRafMap = new WeakMap<HTMLElement, number>();

function handleCardPointerMove(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const clientX = event.clientX;
  const clientY = event.clientY;

  const existingRaf = cardRafMap.get(card);
  if (existingRaf) {
    cancelAnimationFrame(existingRaf);
  }

  const rafId = requestAnimationFrame(() => {
    cardRafMap.delete(card);
    const rect = card.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 3;
    const rotateX = -((y / rect.height) - 0.5) * 3;

    card.style.setProperty("--pointer-x", `${x}px`);
    card.style.setProperty("--pointer-y", `${y}px`);
    card.style.setProperty("--rotate-x", `${rotateX.toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${rotateY.toFixed(2)}deg`);
  });

  cardRafMap.set(card, rafId);
}

function handleCardPointerLeave(event: MouseEvent<HTMLElement>) {
  const card = event.currentTarget;
  const existingRaf = cardRafMap.get(card);
  if (existingRaf) {
    cancelAnimationFrame(existingRaf);
    cardRafMap.delete(card);
  }
  card.style.setProperty("--rotate-x", "0deg");
  card.style.setProperty("--rotate-y", "0deg");
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
      data-whale-card
      data-whale-protect
      className="group relative flex min-h-full flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white/75 p-6 shadow-md backdrop-blur-2xl transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1.5 hover:border-amber-500/30 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-2xl dark:hover:border-white/20 sm:p-7"
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
        <h2 className="text-xl font-black leading-snug tracking-[-0.03em] text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400 sm:text-2xl">
          <Link
            href={document.studioUrl}
            className="focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {document.title}
          </Link>
        </h2>
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
          Düzenlenebilir PDF
        </span>
      </div>

      {/* ─── Bottom Actions ─── */}
      <div className="relative z-10 mt-auto">
        <Link
          href={document.studioUrl}
          className="group/btn relative inline-flex min-h-12 w-full items-center justify-between overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-black text-zinc-950 shadow-[0_6px_20px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-[0_10px_28px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none"
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

const PRECOMPUTED_DOCUMENTS = DOCUMENTS.map((document) => {
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
  ].join(" ");

  return {
    document,
    normalizedText: normalizeBelgelerSearchText(searchableText),
  };
});

export function BelgelerHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const isOceanEnabled = useSyncExternalStore(
    subscribeOcean,
    getOceanSnapshot,
    getOceanServerSnapshot
  );
  const searchInputId = useId();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const toggleOcean = () => {
    try {
      const next = !isOceanEnabled;
      localStorage.setItem(OCEAN_STORAGE_KEY, String(next));
      oceanListeners.forEach((l) => l());
    } catch {
      // ignore
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const filteredDocuments = useMemo(() => {
    const query = normalizeBelgelerSearchText(searchQuery.trim());

    if (!query) return DOCUMENTS;

    return PRECOMPUTED_DOCUMENTS
      .filter((item) => item.normalizedText.includes(query))
      .map((item) => item.document);
  }, [searchQuery]);

  return (
    <section aria-label="Belge arama ve listesi" className="relative min-h-[calc(100vh-140px)]">
      <BelgelerGlassBg />
      <AmbientOceanCanvas enabled={isOceanEnabled} />

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12 xl:px-16">
        <div data-whale-protect className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Belgeler ve Şablonlar</h1>
            <p className="mt-1 text-sm text-muted-foreground">Doldurulabilir PDF belgelerini arayın ve önizleyin.</p>
            <div className="mt-3"><BelgelerOfflinePrepare /></div>
          </div>

          <div className="hidden flex-wrap items-center gap-2.5 self-start sm:self-center [@media(min-width:768px)_and_(hover:hover)_and_(pointer:fine)]:inline-flex">
            <button
              type="button"
              onClick={toggleOcean}
              aria-pressed={isOceanEnabled}
              aria-label={isOceanEnabled ? "Okyanus yaşamı animasyonunu kapat" : "Okyanus yaşamı animasyonunu aç"}
              title={isOceanEnabled ? "Okyanus yaşamı (balık sürüleri, deniz canlıları ve deniz bitkileri) animasyonunu gizle" : "Okyanus yaşamı animasyonunu aç"}
              data-testid="ocean-ambient-toggle"
              className="inline-flex items-center gap-2.5 rounded-2xl border border-black/10 bg-white/80 px-3.5 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-cyan-400/40 dark:hover:bg-white/[0.09] dark:hover:shadow-cyan-950/30"
            >
              <OceanEcosystemIcon
                size={18}
                active={isOceanEnabled}
                className={`transition-colors duration-200 ${
                  isOceanEnabled ? "text-emerald-600 dark:text-cyan-400" : "text-muted-foreground"
                }`}
              />
              <span className="flex items-center gap-1.5 font-medium">
                <span>Okyanus Yaşamı</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                    isOceanEnabled
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-cyan-400/30 dark:bg-cyan-500/15 dark:text-cyan-300"
                      : "border border-black/10 bg-black/5 text-muted-foreground dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-transform duration-200 ${
                      isOceanEnabled
                        ? "bg-emerald-500 shadow-[0_0_6px_currentColor] dark:bg-cyan-400"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  {isOceanEnabled ? "Açık" : "Kapalı"}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
        <div data-whale-protect className="relative">
          <label htmlFor={searchInputId} className="sr-only">
            Belge veya şablon ara
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            id={searchInputId}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Belge adı, tutanak, taahhütname veya anahtar kelime ara..."
            className="h-13 w-full rounded-2xl border border-black/10 bg-white/75 pl-11 pr-14 text-base text-foreground shadow-sm placeholder:text-muted-foreground outline-none backdrop-blur-xl transition-[background-color] focus:border-amber-500 focus:bg-white focus:shadow-md focus:ring-2 focus:ring-amber-500/40 dark:border-white/15 dark:bg-white/[0.06] dark:focus:border-amber-400 dark:focus:bg-white/[0.1] dark:focus:ring-2 dark:focus:ring-amber-400/40 sm:text-sm"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {searchQuery.trim() && (
          <p role="status" aria-live="polite" className="sr-only">
            {filteredDocuments.length === 1
              ? "1 belge bulundu."
              : `${filteredDocuments.length} belge bulundu.`}
          </p>
        )}

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
              onClick={clearSearch}
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
