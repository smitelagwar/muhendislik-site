import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, FileWarning, FileText } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { SitePageShell } from "@/components/site-page";
import { TbdyChapterNav } from "@/components/regulations/TbdyChapterNav";
import { TbdyMarkdown } from "@/components/regulations/TbdyMarkdown";
import { TbdySearchForm } from "@/components/regulations/TbdySearchForm";
import {
  TBDY_BASE_ROUTE, TBDY_MANIFEST, getTbdyChapterHref, getTbdyMarkdown,
  getTbdyPdfUrl, getTbdySection, isTbdyDraftVisible,
} from "@/lib/regulations/tbdy-reader";
import { buildSeoMetadata } from "@/lib/seo";

type Props = { params: Promise<{ chapter: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return TBDY_MANIFEST.sections.map((section) => ({ chapter: section.sectionId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter } = await params;
  const item = getTbdySection(chapter);
  if (!item) return { title: "Bölüm bulunamadı", robots: { index: false } };
  return {
    ...buildSeoMetadata({
      title: `TBDY 2018 — Bölüm ${Number(chapter.slice(-2))}: ${item.title}`,
      description: `TBDY 2018 kaynak metin taslağı, PDF sayfaları ${item.pdfPageStart}–${item.pdfPageEnd}.`,
      pathname: getTbdyChapterHref(chapter),
    }),
    robots: { index: false, follow: true },
  };
}

export default async function TbdyChapterPage({ params }: Props) {
  const { chapter } = await params;
  const section = getTbdySection(chapter);
  if (!section) notFound();

  const number = Number(chapter.slice(-2));
  const index = TBDY_MANIFEST.sections.findIndex((entry) => entry.sectionId === chapter);
  const previous = TBDY_MANIFEST.sections[index - 1];
  const next = TBDY_MANIFEST.sections[index + 1];
  const draftVisible = isTbdyDraftVisible();
  const markdown = draftVisible ? getTbdyMarkdown(section) : "";

  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <PageContextNavigation
          breadcrumbs={[
            { title: "Mevzuat", href: "/kategori/deprem-yonetmelik" },
            { title: "Kaynak arşivi", href: "/mevzuat/arsiv" },
            { title: "TBDY 2018", href: TBDY_BASE_ROUTE },
            { title: `Bölüm ${number}`, href: getTbdyChapterHref(chapter) },
          ]}
          backHref={TBDY_BASE_ROUTE} backLabel="Bölüm listesi"
          className="mb-6 flex flex-col gap-3"
        />

        <header className="mb-6 max-w-5xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            TBDY 2018 / BÖLÜM {number}
          </p>
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-[var(--home-fg)] sm:text-4xl">{section.title}</h1>
          <p className="mt-3 text-sm text-[var(--home-muted)]">
            PDF sayfaları {section.pdfPageStart}–{section.pdfPageEnd} · Otomatik çıkarım · Teknik doğrulama bekleniyor
          </p>
        </header>

        <div className="mb-5 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4">
          <TbdySearchForm />
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(215px,245px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(225px,270px)_minmax(0,1fr)_minmax(190px,220px)]">
          <TbdyChapterNav active={number} />

          <main className="min-w-0">
            <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
              <div>
                <p className="text-sm font-black text-[var(--home-fg)]">Doğrulanmamış kaynak metin taslağı</p>
                <p className="mt-1 text-xs leading-6 text-[var(--home-muted)]">
                  Metin PDF'den otomatik çıkarılmıştır. Denklem, alt/üst indis, tablo ve şekiller hatalı görünebilir.
                  Proje, hesap ve güvenlik kararlarında kaynak PDF'yi kontrol edin.
                </p>
              </div>
            </div>
            {draftVisible ? (
              <div className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] px-4 py-5 sm:px-7 sm:py-8">
                <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[var(--home-border)] pb-4 text-xs">
                  <span className="rounded-md bg-amber-500/10 px-2.5 py-1.5 font-bold text-amber-700 dark:text-amber-400">Okunabilir görünüm</span>
                  <Link href={`${getTbdyChapterHref(chapter)}/ham`} prefetch={false} className="inline-flex min-h-10 items-center rounded-md px-2 text-[var(--home-muted)] hover:text-[var(--home-fg)] hover:underline">Ham Markdown</Link>
                  <a href={getTbdyPdfUrl(section.pdfPageStart)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 font-semibold text-[var(--home-fg)] hover:underline">
                    PDF'de aç <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
                <TbdyMarkdown raw={markdown} />
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-7 text-sm leading-7 text-[var(--home-muted)]" data-testid="tbdy-reader-publication-gate">
                Kaynak metnin doğrulaması ve yayın onayı tamamlanmadığından bu bölümün ham metni henüz erişime açık değildir.
                Resmî PDF bağlantısından kaynağı inceleyebilirsiniz.
              </div>
            )}

            <nav aria-label="Bölüm değiştir" className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {previous ? <Link href={getTbdyChapterHref(previous.sectionId)} prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-4 text-sm font-bold text-[var(--home-fg)] hover:border-amber-500"><ArrowLeft className="h-4 w-4" aria-hidden /> Önceki bölüm</Link> : <span />}
              {next ? <Link href={getTbdyChapterHref(next.sectionId)} prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-4 text-sm font-bold text-[var(--home-fg)] hover:border-amber-500">Sonraki bölüm <ArrowRight className="h-4 w-4" aria-hidden /></Link> : null}
            </nav>
          </main>

          <aside className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 xl:sticky xl:top-24">
            <h2 className="flex items-center gap-2 text-sm font-black text-[var(--home-fg)]"><FileText className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden /> Kaynak bilgisi</h2>
            <dl className="mt-4 space-y-3 text-xs leading-5">
              <div><dt className="text-[var(--home-muted)]">Yönetmelik</dt><dd className="mt-1 font-semibold">TBDY 2018</dd></div>
              <div><dt className="text-[var(--home-muted)]">Sürüm</dt><dd className="mt-1 break-all font-mono">{TBDY_MANIFEST.version}</dd></div>
              <div><dt className="text-[var(--home-muted)]">Kaynak</dt><dd className="mt-1">{section.pdfPageStart}–{section.pdfPageEnd} / {TBDY_MANIFEST.sourcePdfPages} sayfa</dd></div>
              <div><dt className="text-[var(--home-muted)]">Doğrulama</dt><dd className="mt-1 font-bold text-amber-700 dark:text-amber-400">Bekliyor</dd></div>
            </dl>
            <a href={getTbdyPdfUrl(section.pdfPageStart)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--home-border)] px-3 text-sm font-bold text-[var(--home-fg)] hover:border-amber-500">
              PDF sayfasını aç <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <p className="mt-2 text-xs leading-5 text-[var(--home-muted)]">AFAD bağlantısındaki sürümün yüklenen PDF ile birebir eşitliği ayrıca doğrulanacaktır.</p>
          </aside>
        </div>
      </SitePageShell>
    </div>
  );
}
