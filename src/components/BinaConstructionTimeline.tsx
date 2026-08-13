"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowRight,
  ChevronDown,
  Layers,
  BookOpen,
  Wrench,
  Building2,
} from "lucide-react";
import {
  BINA_MINDMAP_DATA,
  BINA_BRANCH_COLORS,
  type BinaMindMapNode,
} from "@/lib/bina-asamalari";

/* ------------------------------------------------------------------ */
/*  Faz ikonları & etiketleri                                         */
/* ------------------------------------------------------------------ */

const PHASE_META: Record<
  string,
  { icon: React.ReactNode; shortLabel: string; order: number }
> = {
  "proje-hazirlik": {
    icon: <BookOpen className="h-5 w-5" />,
    shortLabel: "Proje",
    order: 1,
  },
  "kazi-temel": {
    icon: <Layers className="h-5 w-5" />,
    shortLabel: "Kazı",
    order: 2,
  },
  "kaba-insaat": {
    icon: <Building2 className="h-5 w-5" />,
    shortLabel: "Kaba",
    order: 3,
  },
  "ince-isler": {
    icon: <Wrench className="h-5 w-5" />,
    shortLabel: "İnce",
    order: 4,
  },
  "tesisat-isleri": {
    icon: <Layers className="h-5 w-5" />,
    shortLabel: "Tesisat",
    order: 5,
  },
  "peyzaj-teslim": {
    icon: <Layers className="h-5 w-5" />,
    shortLabel: "Peyzaj",
    order: 6,
  },
};

/* ------------------------------------------------------------------ */
/*  Yardımcı: Ağaçtaki tüm düğümleri düzleştir (arama için)          */
/* ------------------------------------------------------------------ */

interface FlatTopic {
  id: string;
  label: string;
  url: string;
  summary: string;
  phaseId: string;
  phaseLabel: string;
  phaseColor: string;
}

function flattenTree(root: BinaMindMapNode): FlatTopic[] {
  const result: FlatTopic[] = [];

  function walk(
    node: BinaMindMapNode,
    phaseId: string,
    phaseLabel: string,
    phaseColor: string,
  ) {
    if (node.id !== "root" && phaseId !== "") {
      result.push({
        id: node.id,
        label: node.label.replace(/\n/g, " "),
        url: node.url,
        summary: node.summary,
        phaseId,
        phaseLabel,
        phaseColor,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        const pId = phaseId || child.id;
        const pLabel = phaseLabel || child.label.replace(/\n/g, " ");
        const pColor =
          phaseColor ||
          BINA_BRANCH_COLORS[child.id as keyof typeof BINA_BRANCH_COLORS] ||
          "#6c63ff";
        walk(child, pId, pLabel, pColor);
      }
    }
  }

  walk(root, "", "", "");
  return result;
}

function countDescendants(node: BinaMindMapNode): number {
  if (!node.children) return 0;
  let count = node.children.length;
  for (const c of node.children) {
    count += countDescendants(c);
  }
  return count;
}

/* ------------------------------------------------------------------ */
/*  TopicCard                                                         */
/* ------------------------------------------------------------------ */

function TopicCard({
  node,
  color,
}: {
  node: BinaMindMapNode;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = !!node.children && node.children.length > 0;
  const label = node.label.replace(/\n/g, " ");

  return (
    <div className="group/card relative">
      <Link
        href={node.url}
        className="relative block overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-300 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.06] dark:hover:shadow-lg dark:hover:shadow-black/20"
      >
        {/* Üst accent çizgi */}
        <div
          className="absolute inset-x-0 top-0 h-[2.5px] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ backgroundColor: color }}
        />

        <h4 className="text-[15px] font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover/card:text-slate-950 dark:text-white/90 dark:group-hover/card:text-white">
          {label}
        </h4>

        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-600 transition-colors group-hover/card:text-slate-700 dark:text-white/40 dark:group-hover/card:text-white/55">
          {node.summary}
        </p>

        <div className="mt-4 flex items-center justify-between">
          {hasChildren && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${color}18`,
                color: color,
              }}
            >
              {node.children!.length} alt konu
            </span>
          )}
          <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition-all duration-300 group-hover/card:translate-x-1 group-hover/card:text-slate-600 dark:text-white/20 dark:group-hover/card:text-white/60" />
        </div>
      </Link>

      {/* Alt konuları genişlet butonu */}
      {hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-white/30 dark:hover:bg-white/[0.04] dark:hover:text-white/50"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Gizle" : `${node.children!.length} alt konuyu göster`}
        </button>
      )}

      {/* Genişletilmiş alt konular */}
      {expanded && hasChildren && (
        <div className="mt-1 space-y-1 pl-3 border-l-2 border-slate-200 dark:border-white/[0.06]">
          {node.children!.map((child) => (
            <Link
              key={child.id}
              href={child.url}
              className="group/sub flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
            >
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-slate-700 transition-colors group-hover/sub:text-slate-900 dark:text-white/60 dark:group-hover/sub:text-white/85">
                  {child.label.replace(/\n/g, " ")}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 shrink-0 text-slate-300 transition-all group-hover/sub:translate-x-0.5 group-hover/sub:text-slate-600 dark:text-white/15 dark:group-hover/sub:text-white/40" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PhaseSection                                                      */
/* ------------------------------------------------------------------ */

function PhaseSection({
  phase,
  index,
  sectionRef,
}: {
  phase: BinaMindMapNode;
  index: number;
  sectionRef: (el: HTMLElement | null) => void;
}) {
  const color =
    BINA_BRANCH_COLORS[phase.id as keyof typeof BINA_BRANCH_COLORS] ||
    "#6c63ff";
  const label = phase.label.replace(/\n/g, " ");
  const topicCount = countDescendants(phase);

  return (
    <section
      ref={sectionRef}
      id={`phase-${phase.id}`}
      className="relative scroll-mt-24"
    >
      {/* Timeline connector */}
      {index > 0 && (
        <div className="absolute -top-8 left-6 h-8 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-white/10 sm:left-8" />
      )}

      {/* Phase header */}
      <div className="relative mb-6 flex items-start gap-4 sm:gap-6">
        {/* Numara dairesi */}
        <div
          className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-black text-slate-900 shadow-xs dark:text-white sm:h-14 sm:w-14 sm:text-xl"
          style={{
            borderColor: color,
            backgroundColor: `${color}15`,
          }}
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1 pt-1">
          {/* Faz etiketi */}
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-black uppercase tracking-[0.2em]"
              style={{ color }}
            >
              {index + 1}. Aşama
            </span>
            <span className="text-slate-300 dark:text-white/20">·</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-white/30">
              {topicCount} konu
            </span>
          </div>

          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {label}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/45">
            {phase.summary}
          </p>
        </div>
      </div>

      {/* Topic card grid */}
      <div className="ml-0 grid gap-3 sm:ml-[4.5rem] sm:grid-cols-2 lg:grid-cols-3">
        {phase.children?.map((topic) => (
          <TopicCard key={topic.id} node={topic} color={color} />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SearchOverlay                                                     */
/* ------------------------------------------------------------------ */

function SearchOverlay({
  open,
  onClose,
  topics,
}: {
  open: boolean;
  onClose: () => void;
  topics: FlatTopic[];
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!query.trim()) return topics.slice(0, 12);
    const q = query.toLowerCase();
    return topics.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.phaseLabel.toLowerCase().includes(q),
    );
  }, [query, topics]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.06]">
          <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Konu ara... (ör: kalıp, donatı, sıva)"
            className="flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-white/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/60"
              title="Aramayı temizle"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400 dark:text-white/25">
              Sonuç bulunamadı
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((topic) => (
                <Link
                  key={topic.id}
                  href={topic.url}
                  onClick={onClose}
                  className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: topic.phaseColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-white/75 dark:group-hover:text-white">
                      {topic.label}
                    </span>
                    <span className="block truncate text-[12px] text-slate-500 dark:text-white/30">
                      {topic.phaseLabel} · {topic.summary}
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-white/15 dark:group-hover:text-white/40" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-200 px-5 py-3 dark:border-white/[0.06]">
          <p className="text-[11px] text-slate-500 dark:text-white/20">
            <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
              ESC
            </kbd>{" "}
            ile kapat · {filtered.length} sonuç
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StickyPhaseNav                                                    */
/* ------------------------------------------------------------------ */

function StickyPhaseNav({
  phases,
  activePhaseId,
}: {
  phases: readonly BinaMindMapNode[];
  activePhaseId: string | null;
}) {
  const scrollTo = useCallback((phaseId: string) => {
    const el = document.getElementById(`phase-${phaseId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="sticky top-[68px] z-40 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="border-b border-slate-200/80 bg-white/85 shadow-xs backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80 dark:shadow-none">
        <div className="mx-auto max-w-7xl overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-2" aria-label="Faz navigasyonu">
            {phases.map((phase, i) => {
              const color =
                BINA_BRANCH_COLORS[
                  phase.id as keyof typeof BINA_BRANCH_COLORS
                ] || "#6c63ff";
              const isActive = activePhaseId === phase.id;
              const label = phase.label.replace(/\n/g, " ");
              const meta = PHASE_META[phase.id];

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => scrollTo(phase.id)}
                  className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/40 dark:hover:bg-white/[0.04] dark:hover:text-white"
                  }`}
                >
                  {/* Aktif göstergesi */}
                  {isActive && (
                    <div
                      className="absolute inset-x-2 -bottom-2 h-[2px] rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}

                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-black transition-colors"
                    style={
                      isActive
                        ? {
                            backgroundColor: `${color}18`,
                            color: color,
                          }
                        : {}
                    }
                  >
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">
                    {meta?.shortLabel || label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ANA BİLEŞEN                                                      */
/* ================================================================== */

export default function BinaConstructionTimeline() {
  const phases = (BINA_MINDMAP_DATA.children || []) as BinaMindMapNode[];

  // Flat topic list (arama için)
  const allTopics = useMemo(() => flattenTree(BINA_MINDMAP_DATA), []);

  // Toplam konu sayısı
  const totalTopics = allTopics.length;

  // Arama
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K kısayolu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // IntersectionObserver ile aktif faz takibi
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setSectionRef = useCallback(
    (phaseId: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionRefs.current.set(phaseId, el);
      } else {
        sectionRefs.current.delete(phaseId);
      }
    },
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const phaseId = entry.target.id.replace("phase-", "");
            setActivePhaseId(phaseId);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    for (const el of sectionRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8 md:p-10">
        {/* Background radials */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_50%)]" />

        <div className="relative">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Bina Yapım Süreci
          </p>

          <h1 className="mt-3 max-w-xl text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {"İnşaatın A'dan Z'ye"}
            <br />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-blue-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-amber-400 dark:to-blue-400">
              Teknik Rehber Haritası
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-white/45 sm:text-[15px]">
            Proje kararından iskan ruhsatına kadar tüm yapım aşamalarını
            keşfedin. Her konuya tıklayarak detaylı teknik rehbere ulaşın.
          </p>

          {/* Stat pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { value: "6", label: "Ana Faz" },
              { value: `${totalTopics}`, label: "Konu" },
              { value: "12+", label: "Hesap Aracı" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {stat.value}
                </span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-white/35">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Search trigger */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mt-6 flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 text-left shadow-xs transition-colors hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]"
          >
            <Search className="h-4 w-4 text-slate-400 dark:text-white/25" />
            <span className="flex-1 text-[14px] text-slate-400 dark:text-white/25">
              Konu ara...
            </span>
            <kbd className="hidden rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-500 sm:inline dark:border-white/10 dark:bg-white/5 dark:text-white/25">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </section>

      {/* ── Sticky Nav ── */}
      <StickyPhaseNav phases={phases} activePhaseId={activePhaseId} />

      {/* ── Phase Sections ── */}
      <div className="mt-8 space-y-16 pb-12 sm:mt-10 sm:space-y-20">
        {phases.map((phase, index) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            index={index}
            sectionRef={setSectionRef(phase.id)}
          />
        ))}
      </div>

      {/* ── Search Overlay ── */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        topics={allTopics}
      />
    </>
  );
}
