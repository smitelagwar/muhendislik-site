"use client";

import { ArrowUpRight, BookOpen, FileText } from "lucide-react";
import { TBDY_ARTICLE_INDEX, TBDY_CHAPTERS, TBDY_OFFICIAL_PDF, TBDY_TOPICS } from "@/lib/tbdy-guide";
import type { DepremArticleSummary } from "@/lib/deprem-series";

interface TBDYGuideProps {
  articles: DepremArticleSummary[];
  activeTopic: string;
  activeChapter: number | null;
  onTopicChange: (topic: string) => void;
  onChapterChange: (chapter: number | null) => void;
}

export default function TBDYGuide({
  articles, activeTopic, activeChapter, onTopicChange, onChapterChange,
}: TBDYGuideProps) {
  const existing = new Set(articles.map((article) => article.slug));
  const topicCounts = new Map<string, number>(TBDY_TOPICS.map((topic) => [topic.id, 0] as const));
  const chapterCounts = new Map<number, number>(TBDY_CHAPTERS.map((chapter) => [chapter.number, 0] as const));

  for (const [slug, meta] of Object.entries(TBDY_ARTICLE_INDEX)) {
    if (!existing.has(slug)) continue;
    if (topicCounts.has(meta.topic as (typeof TBDY_TOPICS)[number]["id"])) {
      const id = meta.topic as (typeof TBDY_TOPICS)[number]["id"];
      topicCounts.set(id, (topicCounts.get(id) ?? 0) + 1);
    }
    for (const chapter of meta.chapters) {
      chapterCounts.set(chapter, (chapterCounts.get(chapter) ?? 0) + 1);
    }
  }

  return (
    <section aria-label="TBDY 2018 konu ve bölüm dizini" className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--home-accent)]" aria-hidden />
            <h3 className="text-base font-black text-[var(--home-fg)]">TBDY 2018 · hızlı erişim</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--home-muted)]">Konuya veya yönetmelik bölümüne göre doğrudan ilerleyin.</p>
        </div>
        <a href={TBDY_OFFICIAL_PDF} target="_blank" rel="noopener noreferrer"
           className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[var(--home-border)] px-3 text-xs font-bold text-[var(--home-fg)] hover:border-amber-500/50">
          <FileText className="h-4 w-4" aria-hidden /> Resmî metin <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      <div aria-label="TBDY teknik konu grupları" className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap">
        {TBDY_TOPICS.map((topic) => {
          const selected = activeTopic === topic.id;
          return (
            <button key={topic.id} type="button" aria-pressed={selected} onClick={() => onTopicChange(selected ? "all" : topic.id)}
              className={[
                "min-h-11 shrink-0 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]",
                selected ? "border-amber-500 bg-amber-500/10 text-[var(--home-fg)]" : "border-[var(--home-border)] text-[var(--home-fg)] hover:border-amber-500/50"
              ].join(" ")}>
              <span className="block text-xs font-bold">{topic.label} <span className="font-mono text-[10px] text-[var(--home-muted)]">{topicCounts.get(topic.id) ?? 0}</span></span>
              <span className="mt-0.5 block text-[10px] text-[var(--home-muted)]">{topic.description}</span>
            </button>
          );
        })}
      </div>

      <details className="mt-2 rounded-lg border border-[var(--home-border)]">
        <summary className="cursor-pointer select-none px-3 py-3 text-sm font-bold text-[var(--home-fg)]">
          Bölüm 1–17 dizinini aç
          {activeChapter ? <span className="ml-2 font-normal text-[var(--home-muted)]">· Bölüm {activeChapter} seçili</span> : null}
        </summary>
        <div className="grid grid-cols-1 gap-2 border-t border-[var(--home-border)] p-3 sm:grid-cols-2 lg:grid-cols-3">
          {TBDY_CHAPTERS.map((chapter) => {
            const count = chapterCounts.get(chapter.number) ?? 0;
            const item = (
              <>
                <span className="block text-xs font-black">Bölüm {chapter.number} · {chapter.title}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[var(--home-muted)]">
                  {count ? chapter.detail + " · " + count + " ilgili yazı" : "İlgili rehber hazırlanıyor · resmî metin"}
                </span>
              </>
            );
            const cls = [
              "min-h-16 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]",
              activeChapter === chapter.number ? "border-amber-500 bg-amber-500/10 text-[var(--home-fg)]" : "border-[var(--home-border)] text-[var(--home-fg)] hover:border-amber-500/50"
            ].join(" ");
            return count ? (
              <button type="button" key={chapter.number} aria-pressed={activeChapter === chapter.number}
                onClick={() => onChapterChange(activeChapter === chapter.number ? null : chapter.number)} className={cls}>
                {item}
              </button>
            ) : (
              <a key={chapter.number} href={TBDY_OFFICIAL_PDF} target="_blank" rel="noopener noreferrer"
                className={cls} aria-label={"Bölüm " + chapter.number + " - resmî metinde aç"}>{item}</a>
            );
          })}
        </div>
      </details>
    </section>
  );
}
