import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { DEPREM_SERIES, type DepremArticleSummary, type DepremSeriesId } from "@/lib/deprem-series";

const SERIES_ACCENTS: Record<DepremSeriesId, string> = {
  tbdy: "bg-red-500",
  "tbdy-betonarme": "bg-orange-500",
  ts500: "bg-blue-500",
  "mevcut-guclendirme": "bg-fuchsia-500",
  "yapi-denetimi": "bg-amber-500",
  yangin: "bg-orange-500",
  otopark: "bg-slate-500",
  imar: "bg-emerald-500",
  bep: "bg-lime-500",
  "su-zemin": "bg-cyan-500",
  engelsiz: "bg-violet-500",
  eurocode: "bg-indigo-500",
  akustik: "bg-zinc-500",
  asansor: "bg-teal-500",
  isg: "bg-amber-500",
  cevre: "bg-green-500",
};

export default function DepremStandartKutuphanesi({ articles }: { articles: DepremArticleSummary[] }) {
  const counts = articles.reduce<Partial<Record<DepremSeriesId, number>>>((result, article) => {
    result[article.seriesId] = (result[article.seriesId] ?? 0) + 1;
    return result;
  }, {});

  return (
    <section aria-labelledby="regulations-title" className="border-b border-[var(--home-border)] px-5 py-12 sm:px-8 lg:px-12 lg:py-16 xl:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-3 border-b border-[var(--home-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="regulations-title" className="text-2xl font-black tracking-[-0.025em] text-[var(--home-fg)] sm:text-3xl">
              Yönetmelikler ve standartlar
            </h2>
            <p className="mt-2 text-sm text-[var(--home-muted)]">İlgilendiğiniz mevzuatı seçerek doğrudan konu listesine geçin.</p>
          </div>
          <Link href="#icerikler" className="home-inline-link">
            Tüm içerikleri göster <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <nav aria-label="Yönetmelik ve standart başlıkları" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DEPREM_SERIES.map((series) => (
            <Link
              key={series.id}
              href={`/kategori/deprem-yonetmelik?dal=${series.id}#icerikler`}
              prefetch={false}
              className="group flex min-h-36 flex-col rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] p-5 transition-colors hover:border-amber-500/55 hover:bg-[var(--home-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`h-2.5 w-2.5 rounded-full ${SERIES_ACCENTS[series.id]}`} aria-hidden />
                <span className="font-mono text-[10px] text-[var(--home-muted)]">{counts[series.id] ?? 0} içerik</span>
              </div>
              <h3 className="mt-5 text-base font-black text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">{series.label}</h3>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--home-muted)]">{series.description}</p>
              <span className="mt-auto flex items-center gap-2 pt-4 text-xs font-bold text-[var(--home-fg)]">
                İçerikleri aç <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          ))}
        </nav>

        <Link href="#icerikler" className="mt-3 flex min-h-16 items-center justify-between rounded-lg border border-dashed border-[var(--home-border)] px-5 text-sm font-bold text-[var(--home-fg)] transition-colors hover:border-amber-500/55 hover:bg-[var(--home-surface-raised)]">
          <span className="flex items-center gap-3"><FileText className="h-4 w-4 text-[var(--home-accent)]" aria-hidden />Tüm mevzuat içerikleri</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
