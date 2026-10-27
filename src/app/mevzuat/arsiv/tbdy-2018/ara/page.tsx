import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, FileWarning } from "lucide-react";
import { SitePageShell } from "@/components/site-page";
import { TbdySearchForm } from "@/components/regulations/TbdySearchForm";
import { TBDY_BASE_ROUTE, getTbdyPdfUrl, isTbdyDraftVisible } from "@/lib/regulations/tbdy-reader";
import { searchTbdy } from "@/lib/regulations/tbdy-search";

export const metadata: Metadata = {
  title: "TBDY 2018 — Madde ve Metin Arama",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function TbdySearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? "").slice(0, 100).trim();
  const visible = isTbdyDraftVisible();
  const results = visible && query.length >= 2 ? searchTbdy(query) : [];

  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <Link href={TBDY_BASE_ROUTE} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-4 text-sm font-bold text-[var(--home-fg)] hover:border-amber-500">
          <ArrowLeft className="h-4 w-4" aria-hidden /> TBDY bölüm listesi
        </Link>

        <header className="mt-8">
          <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"><Search className="h-4 w-4" aria-hidden /> Kaynak arşivi</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--home-fg)] sm:text-4xl">TBDY 2018 içinde ara</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">Madde, tablo numarası veya metin içindeki terimleri arayın. Sonuçlar otomatik çıkarılan PDF metni üzerinden eşleşir.</p>
        </header>

        <section className="mt-6 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4">
          <TbdySearchForm query={query} />
        </section>

        {!visible ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-[var(--home-muted)]">
            <FileWarning className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
            Kaynak metin için doğrulama ve yayın onayı bekleniyor. Arama sonuçları henüz kamuya açık değildir.
          </div>
        ) : query.length < 2 ? (
          <p className="mt-7 text-sm text-[var(--home-muted)]">Arama yapmak için en az iki karakter girin.</p>
        ) : (
          <section aria-live="polite" className="mt-7">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--home-border)] pb-4">
              <h2 className="text-lg font-black text-[var(--home-fg)]">Arama sonuçları</h2>
              <span className="text-xs text-[var(--home-muted)]">{results.length} sonuç{results.length === 35 ? " (ilk 35)" : ""}</span>
            </div>
            {results.length === 0 ? (
              <p className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 text-sm text-[var(--home-muted)]">Bu ifadeyle eşleşen kaynak sayfası bulunamadı. Daha kısa bir terim veya madde numarası deneyin.</p>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <article key={`${result.chapter}-${result.pdfPage}`} className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 sm:p-5" data-testid="tbdy-search-result">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Bölüm {result.chapter} · PDF sayfa {result.pdfPage} · Basılı sayfa {result.printedPage}
                    </p>
                    <h3 className="mt-2 text-base font-black leading-snug text-[var(--home-fg)]">{result.heading}</h3>
                    <p className="mt-2 line-clamp-3 break-words text-xs leading-6 text-[var(--home-muted)]">{result.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      <Link href={result.href} className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--home-fg)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                        {result.matchType === "madde" ? "Maddeye git" : "Sayfayı aç"}
                      </Link>
                      <a href={getTbdyPdfUrl(result.pdfPage)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--home-muted)] hover:text-[var(--home-fg)] hover:underline">
                        PDF'de karşılaştır <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-5 text-xs leading-6 text-[var(--home-muted)]">Arama sonuçları doğrulama anlamına gelmez; özel sembol ve tablo değerlerini PDF üzerinde kontrol edin.</p>
          </section>
        )}
      </SitePageShell>
    </div>
  );
}
