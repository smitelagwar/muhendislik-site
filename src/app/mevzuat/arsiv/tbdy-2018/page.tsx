import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, FileWarning } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { SitePageShell } from "@/components/site-page";
import { TbdySearchForm } from "@/components/regulations/TbdySearchForm";
import { TBDY_CHAPTERS } from "@/lib/regulations/catalog";
import {
  TBDY_BASE_ROUTE, TBDY_MANIFEST, getTbdyChapterHref, getTbdyPdfUrl,
  isTbdyDraftVisible, tbdySectionSlug,
} from "@/lib/regulations/tbdy-reader";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: "TBDY 2018 — Kaynak ve Markdown Bölümleri",
    description: "Türkiye Bina Deprem Yönetmeliği 2018 kaynaklı bölüm dizini ve doğrulama durumu.",
    pathname: TBDY_BASE_ROUTE,
  }),
  robots: { index: false, follow: true },
};

export default function TbdyArchivePage() {
  const preview = isTbdyDraftVisible();
  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <PageContextNavigation
          breadcrumbs={[
            { title: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
            { title: "Kaynak arşivi", href: "/mevzuat/arsiv" },
            { title: "TBDY 2018", href: TBDY_BASE_ROUTE },
          ]}
          backHref="/mevzuat/arsiv"
          backLabel="Kaynak arşivi"
          className="mb-8 flex flex-col gap-4"
        />

        <header className="max-w-4xl">
          <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <BookOpenText className="h-4 w-4" aria-hidden /> Markdown kaynak arşivi
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--home-fg)] sm:text-5xl">TBDY 2018</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--home-muted)] sm:text-base">
            Türkiye Bina Deprem Yönetmeliği — Deprem Etkisi Altında Binaların Tasarımı İçin Esaslar.
            Bölüm ve madde bazlı arama yapabilir, kaynak PDF sayfasına ulaşabilirsiniz.
          </p>
          <p className="mt-3 text-xs font-semibold text-[var(--home-muted)]">
            {TBDY_MANIFEST.sections.length} bölüm · {TBDY_MANIFEST.bodyPdfPages} gövde sayfası · Otomatik çıkarım
          </p>
        </header>

        <section aria-label="Yönetmelik araması" className="mt-7 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-5">
          <TbdySearchForm />
          <p className="mt-3 text-xs text-[var(--home-muted)]">Örnek: 3.6.1, 4.7.2, burulma düzensizliği, göreli kat ötelemesi</p>
        </section>

        <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
          <div>
            <p className="text-sm font-black text-[var(--home-fg)]">Doğrulama bekleyen PDF → Markdown dökümü</p>
            <p className="mt-1 text-xs leading-6 text-[var(--home-muted)]">
              Bölüm ve sayfalar eşlenmiştir; denklemler, tablolar, şekiller ve özel semboller henüz teknik doğrulamadan geçmemiştir.
              {preview ? " Bu görünüm taslak inceleme amaçlıdır." : " Kaynak metin doğrulanıp yayın onayı verilene kadar tam metin kapalıdır."}
            </p>
          </div>
        </div>

        <section aria-labelledby="tbdy-chapter-list" className="mt-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--home-border)] pb-4">
            <h2 id="tbdy-chapter-list" className="text-xl font-black text-[var(--home-fg)] sm:text-2xl">Bölümler</h2>
            <a href={getTbdyPdfUrl(22)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--home-fg)] hover:underline">
              Kaynak PDF <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TBDY_CHAPTERS.map((chapter) => {
              const item = TBDY_MANIFEST.sections[chapter.number - 1];
              if (!item) return null;
              return (
                <Link
                  key={chapter.number}
                  href={getTbdyChapterHref(tbdySectionSlug(chapter.number))}
                  prefetch={false}
                  data-testid={`tbdy-open-chapter-${chapter.number}`}
                  className="group flex min-h-36 flex-col rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 transition-colors hover:border-amber-500/50 hover:bg-[var(--home-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-400">BÖLÜM {chapter.number}</span>
                  <h3 className="mt-2 text-base font-black leading-snug text-[var(--home-fg)]">{chapter.title}</h3>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-xs text-[var(--home-muted)]">
                    <span>PDF {item.pdfPageStart}–{item.pdfPageEnd}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--home-fg)]">
                      {preview ? "Taslağı incele" : "Durumu gör"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <p className="mt-8 text-xs leading-6 text-[var(--home-muted)]">
          Orijinal PDF ile sunulan AFAD bağlantısının aynı sürüm olduğu ve belgenin güncelliği ayrıca kontrol edilecektir.
          Bu arşiv mevcut teknik makalelerden ayrıdır ve resmî proje onayı yerine geçmez.
        </p>
      </SitePageShell>
    </div>
  );
}
