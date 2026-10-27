import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, FileWarning } from "lucide-react";
import { SitePageShell } from "@/components/site-page";
import {
  TBDY_MANIFEST, getTbdyChapterHref, getTbdyMarkdown, getTbdyPdfUrl,
  getTbdySection, isTbdyDraftVisible,
} from "@/lib/regulations/tbdy-reader";

type Props = { params: Promise<{ chapter: string }> };
export const dynamicParams = false;
export const metadata: Metadata = { title: "TBDY 2018 — Ham Markdown Taslağı", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return TBDY_MANIFEST.sections.map((section) => ({ chapter: section.sectionId }));
}

export default async function TbdyRawMarkdownPage({ params }: Props) {
  const { chapter } = await params;
  const section = getTbdySection(chapter);
  if (!section) notFound();
  const visible = isTbdyDraftVisible();
  return (
    <div className="home-page min-h-screen">
      <SitePageShell width="full">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href={getTbdyChapterHref(chapter)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] px-4 text-sm font-bold hover:border-amber-500">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Okunabilir görünüme dön
          </Link>
          <a href={getTbdyPdfUrl(section.pdfPageStart)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold hover:underline">
            PDF'de aç <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <h1 className="text-2xl font-black text-[var(--home-fg)]">Bölüm {Number(chapter.slice(-2))} · Ham Markdown</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">{section.title}</p>
        <div role="status" className="my-6 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-6 text-[var(--home-muted)]">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
          Otomatik çıkarılan ham metin mühendislik açısından doğrulanmamıştır. Bu görünüm bir Markdown dosyası indirme/yayın onayı değildir.
        </div>
        {visible ? (
          <pre data-testid="tbdy-raw-markdown" className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-4 font-mono text-xs leading-6 text-[var(--home-fg)] sm:p-6">{getTbdyMarkdown(section)}</pre>
        ) : (
          <p className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 text-sm text-[var(--home-muted)]">
            Doğrulama ve yayın onayı tamamlanmadığı için ham Markdown şu anda kullanıma açık değil.
          </p>
        )}
      </SitePageShell>
    </div>
  );
}
