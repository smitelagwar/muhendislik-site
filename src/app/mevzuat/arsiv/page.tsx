import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, FileText, ShieldAlert } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { SitePageShell } from "@/components/site-page";
import { REGULATION_ARCHIVE } from "@/lib/regulations/catalog";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildSeoMetadata({
    title: "Yönetmelik Kaynak Arşivi",
    description: "TBDY 2018 ve diğer yapı standartları için kaynaklı, madde bazlı Markdown arşivi.",
    pathname: "/mevzuat/arsiv",
  }),
  robots: { index: false, follow: true }, // Kaynak metinleri yayımlanana kadar arama motoru indeksi kapalı.
};

const crumbs = [
  { title: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
  { title: "Kaynak arşivi", href: "/mevzuat/arsiv" },
];

export default function RegulationArchivePage() {
  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <PageContextNavigation
          breadcrumbs={crumbs}
          backHref="/kategori/deprem-yonetmelik"
          backLabel="Mevzuat"
          className="mb-8 flex flex-col gap-4"
        />

        <header className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-400">
            <BookOpenText className="h-4 w-4" aria-hidden /> Kaynak arşivi
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-[-0.04em] text-[var(--home-fg)] sm:text-5xl">
            Yönetmelik kütüphanesi
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--home-muted)] sm:text-base">
            Bu alanda yönetmeliklerin kaynaklarına izlenebilir şekilde bağlı Markdown belgeleri yer alacak.
            Aşağıdaki kaynakların dönüşüm ve yayın durumlarını görebilirsiniz.
          </p>
        </header>

        <section aria-labelledby="archive-documents" className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--home-border)] pb-5">
            <h2 id="archive-documents" className="text-xl font-black text-[var(--home-fg)]">Kaynak belgeler</h2>
            <p className="text-xs text-[var(--home-muted)]">Kaynak metinleri henüz yayımlanmadı</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {REGULATION_ARCHIVE.map((item) => (
              <article
                key={item.id}
                id={item.id}
                data-testid={`regulations-archive-${item.id}`}
                className="flex min-w-0 flex-col rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="rounded-full border border-[var(--home-border)] bg-[var(--home-surface-raised)] px-3 py-1.5 text-[11px] font-bold text-[var(--home-muted)]">
                    {item.statusLabel}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-black text-[var(--home-fg)]">{item.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-[var(--home-fg)]">{item.longTitle}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--home-muted)]">{item.description}</p>
                <p className="mt-4 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-3 text-xs leading-5 text-[var(--home-muted)]">
                  {item.statusDetail}
                </p>
                {item.chapterCount ? (
                  <p className="mt-3 text-xs font-medium text-[var(--home-muted)]">
                    {item.chapterCount} bölüm · {item.pdfPageCount} PDF sayfası (sağlanan dosya)
                  </p>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6">
                  {item.availability === "source-received" ? (
                    <Link
                      href={item.href}
                      data-testid="regulations-archive-open-tbdy"
                      className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--home-fg)] underline-offset-4 hover:text-amber-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-amber-300"
                    >
                      Bölümleri incele <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                  <Link
                    href={item.relatedArticlesHref}
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--home-muted)] underline-offset-4 hover:text-[var(--home-fg)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    İlgili teknik yazılar <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="mt-9 grid gap-4 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 sm:grid-cols-[auto_1fr] sm:items-start">
          <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden />
          <div>
            <h2 className="text-sm font-bold text-[var(--home-fg)]">Kaynak metin ile teknik yazı farklıdır</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--home-muted)]">
              Bu kütüphane orijinal yönetmelik kaynaklarının doğrulanmış dönüşümleri için ayrılmıştır.
              Mevzuat merkezindeki makaleler mühendislik anlatımlarıdır; resmî madde metni olarak sunulmaz.
              Özellikle TS 500'ün tam metni, kullanım hakkı doğrulanmadan yayımlanmayacaktır.
            </p>
            <Link href="/kategori/deprem-yonetmelik" className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[var(--home-fg)] hover:underline">
              Mevzuat içeriklerine dön <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </aside>
      </SitePageShell>
    </div>
  );
}
