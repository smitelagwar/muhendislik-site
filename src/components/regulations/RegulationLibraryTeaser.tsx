import Link from "next/link";
import { ArrowRight, BookOpenText, ChevronRight, FileText } from "lucide-react";
import { TBDY_ARCHIVE, TS500_ARCHIVE } from "@/lib/regulations/catalog";

/** Mevzuat sayfasında, editoryal makale kataloğundan ayrı kaynak arşivi girişi. */
export function RegulationLibraryTeaser() {
  return (
    <section
      data-testid="regulations-library-teaser"
      aria-labelledby="regulations-library-teaser-title"
      className="mb-4 min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <BookOpenText className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--home-muted)]">
            Kaynak arşivi
          </p>
          <h2 id="regulations-library-teaser-title" className="mt-0.5 text-base font-black tracking-tight text-[var(--home-fg)]">
            Yönetmelik kütüphanesi
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--home-muted)]">
            Madde ve bölüm bazlı Markdown arşivi
          </p>
        </div>
      </div>

      <nav aria-label="Yönetmelik kaynakları" className="mt-4 space-y-2">
        <Link
          data-testid="regulations-library-tbdy-link"
          href={TBDY_ARCHIVE.href}
          className="group flex min-h-12 items-center gap-3 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] px-3 py-2 transition-colors hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          <FileText className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[var(--home-fg)]">{TBDY_ARCHIVE.title}</span>
            <span className="block text-[11px] text-[var(--home-muted)]">{TBDY_ARCHIVE.statusLabel} · MD hazırlanacak</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--home-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Link
          data-testid="regulations-library-ts500-link"
          href={TS500_ARCHIVE.href}
          className="group flex min-h-12 items-center gap-3 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] px-3 py-2 transition-colors hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[var(--home-fg)]">{TS500_ARCHIVE.title}</span>
            <span className="block text-[11px] text-[var(--home-muted)]">{TS500_ARCHIVE.statusLabel}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--home-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </nav>
      <Link
        href="/mevzuat/arsiv"
        data-testid="regulations-library-open"
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md text-xs font-bold text-[var(--home-fg)] underline-offset-4 transition-colors hover:text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-300"
      >
        Kütüphaneyi aç <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
