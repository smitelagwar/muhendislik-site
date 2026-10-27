import Link from "next/link";
import { BookOpenText, ChevronDown } from "lucide-react";
import { TBDY_CHAPTERS } from "@/lib/regulations/catalog";
import { getTbdyChapterHref, tbdySectionSlug } from "@/lib/regulations/tbdy-reader";

function ChapterLinks({ active }: { active?: number }) {
  return (
    <nav aria-label="TBDY bölüm listesi" className="max-h-[min(62vh,640px)] space-y-1 overflow-y-auto">
      {TBDY_CHAPTERS.map((chapter) => (
        <Link
          key={chapter.number}
          href={getTbdyChapterHref(tbdySectionSlug(chapter.number))}
          prefetch={false}
          aria-current={active === chapter.number ? "page" : undefined}
          className={`flex min-h-11 items-start gap-3 rounded-lg px-3 py-2.5 text-xs leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${active === chapter.number
            ? "bg-amber-500/10 font-bold text-[var(--home-fg)]"
            : "text-[var(--home-muted)] hover:bg-[var(--home-surface-raised)] hover:text-[var(--home-fg)]"}`}
        >
          <span className="w-6 shrink-0 font-mono font-bold text-amber-700 dark:text-amber-400">
            {String(chapter.number).padStart(2, "0")}
          </span>
          <span className="min-w-0">{chapter.title}</span>
        </Link>
      ))}
    </nav>
  );
}

export function TbdyChapterNav({ active }: { active?: number }) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <details className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-3 lg:hidden">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-2 text-sm font-bold text-[var(--home-fg)]">
          <span className="inline-flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
            Bölümler {active ? `· ${active}` : ""}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--home-muted)]" aria-hidden />
        </summary>
        <div className="mt-3 border-t border-[var(--home-border)] pt-3"><ChapterLinks active={active} /></div>
      </details>
      <div className="hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-3 lg:block">
        <h2 className="flex items-center gap-2 px-3 pb-3 pt-2 text-sm font-black text-[var(--home-fg)]">
          <BookOpenText className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden /> Bölümler
        </h2>
        <ChapterLinks active={active} />
      </div>
    </aside>
  );
}
