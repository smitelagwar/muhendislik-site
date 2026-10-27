import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpenText, FileClock, FileText, ShieldAlert } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { SitePageShell } from "@/components/site-page";
import { TBDY_ARCHIVE, TBDY_CHAPTERS } from "@/lib/regulations/catalog";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: "TBDY 2018 — Kaynak ve Markdown Bölümleri",
    description: "Türkiye Bina Deprem Yönetmeliği 2018 için bölüm dizini ve doğrulama durumu.",
    pathname: "/mevzuat/arsiv/tbdy-2018",
  }),
  robots: { index: false, follow: true },
};

const crumbs = [
  { title: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
  { title: "Kaynak arşivi", href: "/mevzuat/arsiv" },
  { title: "TBDY 2018", href: "/mevzuat/arsiv/tbdy-2018" },
];

export default function TbdyArchivePage() {
  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <PageContextNavigation
          breadcrumbs={crumbs}
          backHref="/mevzuat/arsiv"
          backLabel="Kaynak arşivi"
          className="mb-8 flex flex-col gap-4"
        />

        <header className="mb-8 border-b border-[var(--home-border)] pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-400">
              <BookOpenText className="h-4 w-4" aria-hidden /> Kaynak arşivi
            </span>
            <span className="rounded-full border border-[var(--home-border)] bg-[var(--home-surface)] px-3 py-1 text-[11px] font-bold text-[var(--home-muted)]">
              {TBDY_ARCHIVE.statusLabel}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--home-fg)] sm:text-5xl">
            {TBDY_ARCHIVE.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--home-muted)]">
            {TBDY_ARCHIVE.longTitle} · {TBDY_ARCHIVE.description}.
          </p>
          <p className="mt-4 text-xs font-medium text-[var(--home-muted)]">
            17 bölüm · 416 sayfalık sağlanan PDF · Markdown henüz yayımlanmadı
          </p>
        </header>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(225px,290px)_minmax(0,1fr)] lg:items-start">
          <aside aria-labelledby="tbdy-chapters-nav" className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 lg:sticky lg:top-24">
            <h2 id="tbdy-chapters-nav" className="flex items-center gap-2 text-sm font-black text-[var(--home-fg)]">
              <BookOpenText className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden /> Bölüm dizini
            </h2>
            <p className="mt-1 text-xs text-[var(--home-muted)]">Kısa gezinme başlıkları</p>
            <nav aria-label="TBDY 2018 bölümleri" className="mt-4 max-h-[min(65vh,680px)] space-y-1 overflow-y-auto">
              {TBDY_CHAPTERS.map((chapter) => (
                <a
                  key={chapter.number}
                  href={`#bolum-${chapter.number}`}
                  className="flex min-h-10 items-start gap-3 rounded-md px-2 py-2 text-xs leading-5 text-[var(--home-muted)] transition-colors hover:bg-[var(--home-surface-raised)] hover:text-[var(--home-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="w-6 shrink-0 font-mono font-bold text-amber-700 dark:text-amber-400">{chapter.number.toString().padStart(2, "0")}</span>
                  <span>{chapter.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0">
            <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
              <FileClock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              <div>
                <h2 className="text-base font-black text-[var(--home-fg)]">Kaynak alındı; dönüşüm ve doğrulama bekliyor</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">
                  Aşağıdaki liste yönetmeliğin bölüm iskeletidir. Henüz Markdown dosyası,
                  doğrulanmış denklem veya indirilebilir tam metin bulunmuyor. Orijinal
                  PDF ile sayfa ve madde eşlemesi sonraki aşamada oluşturulacak.
                </p>
              </div>
            </div>

            <section aria-labelledby="tbdy-chapter-list" className="mt-8">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 id="tbdy-chapter-list" className="text-xl font-black text-[var(--home-fg)]">Yönetmelik bölümleri</h2>
                <span className="text-xs text-[var(--home-muted)]">17 başlık · tam metin bekleniyor</span>
              </div>
              <div className="space-y-3">
                {TBDY_CHAPTERS.map((chapter) => (
                  <article
                    key={chapter.number}
                    id={`bolum-${chapter.number}`}
                    data-testid={`tbdy-chapter-${chapter.number}`}
                    className="scroll-mt-24 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 font-mono text-sm font-bold text-amber-700 dark:text-amber-400">
                        {chapter.number.toString().padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--home-muted)]">Bölüm {chapter.number}</p>
                        <h3 className="mt-1 text-sm font-black leading-6 text-[var(--home-fg)] sm:text-base">{chapter.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--home-muted)]">
                          Kaynak metin ve madde bağlantıları henüz yayımlanmadı.
                        </p>
                      </div>
                      <FileText className="mt-1 h-4 w-4 shrink-0 text-[var(--home-muted)]" aria-hidden />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="mt-7 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
                <p className="text-sm leading-6 text-[var(--home-muted)]">
                  Buradaki bölüm başlıkları gezinme amaçlı kısaltılmıştır. Tasarım,
                  hesap ve uygunluk kararlarında yayımlanmış resmî yönetmelik metni esas alınmalıdır.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href="/mevzuat/arsiv" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--home-fg)] hover:underline">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Kütüphaneye dön
                </Link>
                <Link href={TBDY_ARCHIVE.relatedArticlesHref} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--home-fg)] hover:underline">
                  İlgili teknik yazılar <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </aside>
          </main>
        </div>
      </SitePageShell>
    </div>
  );
}
