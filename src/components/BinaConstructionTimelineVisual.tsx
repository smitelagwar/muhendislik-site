"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  Layers,
  Search,
  Wrench,
  X,
} from "lucide-react";
import {
  BINA_BRANCH_COLORS,
  BINA_MINDMAP_DATA,
  type BinaMindMapNode,
} from "@/lib/bina-asamalari";
import { getBinaVisual } from "@/lib/bina-asamalari-visuals";


const PHASE_META: Record<
  string,
  { icon: React.ReactNode; shortLabel: string }
> = {
  "proje-hazirlik": {
    icon: <BookOpen className="h-4 w-4" />,
    shortLabel: "Proje",
  },
  "kazi-temel": {
    icon: <Layers className="h-4 w-4" />,
    shortLabel: "Kazı",
  },
  "kaba-insaat": {
    icon: <Building2 className="h-4 w-4" />,
    shortLabel: "Kaba",
  },
  "ince-isler": {
    icon: <Wrench className="h-4 w-4" />,
    shortLabel: "İnce",
  },
  "tesisat-isleri": {
    icon: <Layers className="h-4 w-4" />,
    shortLabel: "Tesisat",
  },
  "peyzaj-teslim": {
    icon: <Layers className="h-4 w-4" />,
    shortLabel: "Peyzaj",
  },
};

interface FlatTopic {
  id: string;
  label: string;
  url: string;
  summary: string;
  phaseId: string;
  phaseLabel: string;
  phaseColor: string;
}

function getTopicImageUrl(nodeId: string): string {
  const visual = getBinaVisual(nodeId);
  return visual?.primary?.src || visual?.card || `/bina-asamalari/topics/${nodeId}.webp`;
}

function flattenTree(root: BinaMindMapNode): FlatTopic[] {
  const result: FlatTopic[] = [];

  function walk(
    node: BinaMindMapNode,
    phaseId: string,
    phaseLabel: string,
    phaseColor: string,
  ) {
    if (node.id !== "root" && phaseId) {
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

    if (!node.children) return;

    for (const child of node.children) {
      const childPhaseId = phaseId || child.id;
      const childPhaseLabel =
        phaseLabel || child.label.replace(/\n/g, " ");
      const childPhaseColor =
        phaseColor ||
        BINA_BRANCH_COLORS[
          child.id as keyof typeof BINA_BRANCH_COLORS
        ] ||
        "#6366f1";

      walk(
        child,
        childPhaseId,
        childPhaseLabel,
        childPhaseColor,
      );
    }
  }

  walk(root, "", "", "");
  return result;
}

function countDescendants(node: BinaMindMapNode): number {
  if (!node.children) return 0;
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
}

function cardSpanClass(count: number, index: number): string {
  if (count === 2) return "md:col-span-6";
  if (count === 4) return "md:col-span-6 xl:col-span-6";
  if (count === 5) {
    return index < 3
      ? "md:col-span-6 xl:col-span-4"
      : "md:col-span-6 xl:col-span-6";
  }
  if (count === 6) return "md:col-span-6 xl:col-span-4";
  return "md:col-span-6 xl:col-span-4";
}

function TopicCard({
  node,
  color,
  className,
}: {
  node: BinaMindMapNode;
  color: string;
  className: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const initialImage = getTopicImageUrl(node.id);
  const [imageSrc, setImageSrc] = useState(initialImage);
  const hasChildren = !!node.children?.length;
  const label = node.label.replace(/\n/g, " ");

  useEffect(() => {
    setImageSrc(initialImage);
  }, [initialImage]);

  const visual = getBinaVisual(node.id);
  const badgeLabel =
    visual?.mode === "technical-cutaway"
      ? "Teknik Kesit"
      : visual?.mode === "installed-component"
      ? "Detay Görsel"
      : "Uygulama Görseli";
  const altText = visual?.primary?.altTr || visual?.altTr || label;

  return (
    <article className={`group/card col-span-12 min-w-0 flex flex-col ${className}`}>
      <Link
        href={node.url}
        className="relative flex flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.055] dark:hover:shadow-black/25"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
          <Image
            src={imageSrc}
            alt={altText}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 34vw"
            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.045]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/5 to-transparent" />
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ backgroundColor: color }}
          />
          <span
            className="absolute bottom-3 right-3 rounded-lg border border-white/15 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white shadow-lg backdrop-blur-md"
            style={{ backgroundColor: `${color}d8` }}
          >
            {badgeLabel}
          </span>
        </div>

        <div className="flex min-h-[170px] flex-col p-5 sm:p-5">
          <div className="flex items-start gap-3">
            <h4 className="min-w-0 flex-1 text-[16px] font-extrabold leading-snug tracking-tight text-slate-950 dark:text-white/95">
              {label}
            </h4>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition duration-300 group-hover/card:translate-x-1 group-hover/card:text-slate-700 dark:text-white/20 dark:group-hover/card:text-white/65" />
          </div>

          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-600 dark:text-white/45">
            {node.summary}
          </p>

          <div className="mt-auto pt-4">
            {hasChildren ? (
              <span
                className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: `${color}18`,
                  color,
                }}
              >
                {node.children!.length} alt konu
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/20">
                Ana konu
              </span>
            )}
          </div>
        </div>
      </Link>

      {hasChildren && (
        <>
          <div className="mt-3 pt-1">
            <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
            {expanded
              ? "Alt konuları gizle"
              : `${node.children!.length} alt konuyu göster`}
          </button>
        </div>

          {expanded && (
            <div
              className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.025]"
              style={{ boxShadow: `inset 2px 0 0 ${color}55` }}
            >
              <div className="space-y-1">
                {node.children!.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url}
                    className="group/sub flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                  >
                    <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 dark:border-white/10">
                      <Image
                        src={getTopicImageUrl(child.id)}
                        alt={child.label.replace(/\n/g, " ")}
                        fill
                        unoptimized
                        sizes="72px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold text-slate-800 dark:text-white/70">
                        {child.label.replace(/\n/g, " ")}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-white/25">
                        {child.summary}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover/sub:translate-x-0.5 dark:text-white/15" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function PhaseSection({
  phase,
  index,
  sectionRef,
}: {
  phase: BinaMindMapNode;
  index: number;
  sectionRef: (element: HTMLElement | null) => void;
}) {
  const color =
    BINA_BRANCH_COLORS[
      phase.id as keyof typeof BINA_BRANCH_COLORS
    ] || "#6366f1";
  const label = phase.label.replace(/\n/g, " ");
  const phaseImage = getTopicImageUrl(phase.id);
  const topicCount = countDescendants(phase);
  const topics = phase.children || [];
  const phaseMeta = PHASE_META[phase.id];

  return (
    <section
      ref={sectionRef}
      id={`phase-${phase.id}`}
      className="relative scroll-mt-28"
    >
      <Link
        href={phase.url}
        className="group/phase relative mb-5 block overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-sm transition duration-300 hover:border-slate-300 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-white/[0.14] dark:hover:shadow-black/25"
        style={{ boxShadow: `0 18px 70px -45px ${color}99` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background: `radial-gradient(circle at 10% 15%, ${color}18 0, transparent 42%), linear-gradient(110deg, ${color}0f 0%, transparent 55%)`,
          }}
        />

        <div className="relative grid min-h-[190px] lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.75fr)]">
          <div className="flex items-start gap-4 p-5 sm:gap-6 sm:p-6 lg:p-7">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-lg font-black text-slate-950 shadow-sm dark:text-white sm:h-14 sm:w-14 sm:text-xl"
              style={{
                borderColor: color,
                backgroundColor: `${color}18`,
              }}
            >
              {index + 1}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color }}
                >
                  {index + 1}. Aşama
                </span>
                <span className="text-slate-300 dark:text-white/20">•</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-white/30">
                  {topicCount} konu
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  {label}
                </h2>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover/phase:translate-x-1 dark:text-white/35" />
              </div>

              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-600 dark:text-white/45 sm:text-sm">
                {phase.summary}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 text-[10px] font-bold text-slate-600 backdrop-blur-md dark:border-white/[0.08] dark:bg-black/20 dark:text-white/40">
                <span style={{ color }}>{phaseMeta?.icon}</span>
                Ana dal rehberi
              </div>
            </div>
          </div>

          <div className="relative min-h-[180px] overflow-hidden border-t border-slate-200/80 bg-slate-950 lg:min-h-full lg:border-l lg:border-t-0 dark:border-white/[0.07]">
            <Image
              src={phaseImage}
              alt={`${label} görseli`}
              fill
              unoptimized
              sizes="(max-width: 1023px) 100vw, 36vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/phase:scale-[1.035]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/10 lg:from-slate-950/45 lg:via-transparent" />
            <div
              className="absolute inset-x-0 bottom-0 h-[3px]"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-12 gap-4 sm:ml-[4.75rem]">
        {topics.map((topic, topicIndex) => (
          <TopicCard
            key={topic.id}
            node={topic}
            color={color}
            className={cardSpanClass(topics.length, topicIndex)}
          />
        ))}
      </div>
    </section>
  );
}

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
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return topics.slice(0, 14);
    return topics.filter(
      (topic) =>
        topic.label.toLowerCase().includes(normalized) ||
        topic.summary.toLowerCase().includes(normalized) ||
        topic.phaseLabel.toLowerCase().includes(normalized),
    );
  }, [query, topics]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[9vh]">
      <button
        type="button"
        aria-label="Aramayı kapat"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b0b13]">
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.07]">
          <Search className="h-5 w-5 text-slate-400 dark:text-white/30" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Konu ara... (ör. kalıp, donatı, sıva)"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-white/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Aramayı temizle"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400 dark:text-white/25">
              Sonuç bulunamadı.
            </p>
          ) : (
            filtered.map((topic) => (
              <Link
                key={`${topic.phaseId}-${topic.id}`}
                href={topic.url}
                onClick={onClose}
                className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-white/[0.05]"
              >
                <div className="relative h-12 w-[72px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-white/10">
                  <Image
                    src={getTopicImageUrl(topic.id)}
                    alt={topic.label}
                    fill
                    unoptimized
                    sizes="72px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-slate-900 dark:text-white/80">
                    {topic.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-white/30">
                    {topic.phaseLabel} · {topic.summary}
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 dark:text-white/15" />
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-[10px] text-slate-500 dark:border-white/[0.07] dark:text-white/25">
          ESC ile kapat · {filtered.length} sonuç
        </div>
      </div>
    </div>
  );
}

function StickyPhaseNav({
  phases,
  activePhaseId,
}: {
  phases: readonly BinaMindMapNode[];
  activePhaseId: string | null;
}) {
  const scrollTo = useCallback((phaseId: string) => {
    document
      .getElementById(`phase-${phaseId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="sticky top-[68px] z-40 -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="border-y border-slate-200/80 bg-white/88 shadow-sm backdrop-blur-2xl dark:border-white/[0.06] dark:bg-[#0a0910]/85 dark:shadow-black/20">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 scrollbar-none sm:px-6 lg:px-8">
          <nav className="flex min-w-max items-center gap-1 py-2" aria-label="Bina aşamaları">
            {phases.map((phase, index) => {
              const color =
                BINA_BRANCH_COLORS[
                  phase.id as keyof typeof BINA_BRANCH_COLORS
                ] || "#6366f1";
              const active = activePhaseId === phase.id;
              const meta = PHASE_META[phase.id];

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => scrollTo(phase.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold transition ${
                    active
                      ? "text-slate-950 dark:text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/35 dark:hover:bg-white/[0.05] dark:hover:text-white/70"
                  }`}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-black"
                    style={
                      active
                        ? { backgroundColor: `${color}1f`, color }
                        : undefined
                    }
                  >
                    {index + 1}
                  </span>
                  <span>{meta?.shortLabel || phase.label}</span>
                  {active && (
                    <span
                      className="absolute inset-x-2 -bottom-2 h-[2px] rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function BinaConstructionTimelineVisual() {
  const phases = (BINA_MINDMAP_DATA.children || []) as BinaMindMapNode[];
  const allTopics = useMemo(() => flattenTree(BINA_MINDMAP_DATA), []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState<string | null>(
    phases[0]?.id || null,
  );
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setSectionRef = useCallback(
    (phaseId: string) => (element: HTMLElement | null) => {
      if (element) sectionRefs.current.set(phaseId, element);
      else sectionRefs.current.delete(phaseId);
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivePhaseId(entry.target.id.replace("phase-", ""));
          }
        }
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: 0 },
    );

    for (const element of sectionRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#0b0914] dark:shadow-black/25">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(99,102,241,0.17),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(245,158,11,0.11),transparent_34%)]" />

        <div className="relative grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-300">
              Bina Yapım Süreci
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">
              İnşaatın A&apos;dan Z&apos;ye
              <br />
              <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500 bg-clip-text text-transparent">
                Teknik Rehber Haritası
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate-600 dark:text-white/45 sm:text-[15px]">
              Proje kararından iskan ruhsatına kadar tüm yapım aşamalarını,
              görsel teknik kartlar üzerinden takip edin ve ilgili rehbere
              doğrudan geçin.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {[
                { value: "6", label: "Ana Faz" },
                { value: `${allTopics.length}`, label: "Konu" },
                { value: "12+", label: "Hesap Aracı" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200/90 bg-white/75 px-4 py-2.5 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.035]"
                >
                  <span className="text-base font-black text-slate-950 dark:text-white">
                    {stat.value}
                  </span>
                  <span className="ml-2 text-[11px] font-semibold text-slate-500 dark:text-white/30">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="mt-6 flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/85 px-4 py-3 text-left shadow-sm backdrop-blur-xl transition hover:border-slate-300 dark:border-white/[0.08] dark:bg-white/[0.035] dark:hover:border-white/[0.16]"
            >
              <Search className="h-4 w-4 text-slate-400 dark:text-white/25" />
              <span className="flex-1 text-[13px] text-slate-400 dark:text-white/25">
                Konu ara...
              </span>
              <kbd className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/25">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="relative hidden min-h-[360px] overflow-hidden border-l border-slate-200/70 bg-slate-950 lg:block dark:border-white/[0.07]">
            <div className="absolute inset-0 opacity-90">
              <Image
                src="/bina-asamalari/topics/proje-hazirlik.svg"
                alt="Bina yapım süreci teknik görseli"
                fill
                unoptimized
                priority
                sizes="40vw"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0914]/75 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2.5">
              {[
                {
                  src: "/bina-asamalari/images/mimari-proje-hero.jpg",
                  label: "Mimari",
                },
                {
                  src: "/bina-asamalari/topics/statik-proje.svg",
                  label: "Statik",
                },
                {
                  src: "/bina-asamalari/topics/kazi-temel.svg",
                  label: "Saha",
                },
              ].map((preview) => (
                <div
                  key={preview.label}
                  className="overflow-hidden rounded-xl border border-white/12 bg-black/30 shadow-xl backdrop-blur-md"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={preview.src}
                      alt={preview.label}
                      fill
                      unoptimized
                      sizes="120px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      {preview.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StickyPhaseNav phases={phases} activePhaseId={activePhaseId} />

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

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        topics={allTopics}
      />
    </>
  );
}
