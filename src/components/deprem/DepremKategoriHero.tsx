import { Search } from "lucide-react";

interface DepremKategoriHeroProps {
  articleCount: number;
  seriesCount: number;
}

export default function DepremKategoriHero({ articleCount, seriesCount }: DepremKategoriHeroProps) {
  return (
    <section aria-labelledby="deprem-hero-title" className="border-b border-[var(--home-border)] bg-[var(--home-surface-raised)] px-5 py-12 sm:px-8 lg:px-12 lg:py-16 xl:px-16">
      <div className="mx-auto max-w-[1440px]">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--home-accent)]">
          Mevzuat merkezi
        </p>
        <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 id="deprem-hero-title" className="max-w-5xl text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[var(--home-fg)] sm:text-6xl">
              Deprem yönetmeliği ve yapı mevzuatı
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--home-muted)] sm:text-lg">
              TBDY 2018, TS 500, yangın, imar, enerji, erişilebilirlik ve diğer yapı standartlarına göre hazırlanmış teknik içerikler.
            </p>
          </div>
          <div className="lg:col-span-4">
            <form action="/kategori/deprem-yonetmelik#icerikler" className="relative">
              <label htmlFor="regulation-search" className="sr-only">Mevzuat ve teknik içerik ara</label>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-muted)]" aria-hidden />
              <input
                id="regulation-search"
                name="q"
                type="search"
                placeholder="Mevzuat veya konu ara"
                className="h-12 w-full rounded-md border border-[var(--home-border)] bg-[var(--home-surface)] pl-11 pr-4 text-sm text-[var(--home-fg)] outline-none placeholder:text-[var(--home-muted)] focus:border-[var(--home-accent-solid)] focus:ring-2 focus:ring-amber-500/15"
              />
            </form>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--home-muted)]">
              {seriesCount} mevzuat başlığı · {articleCount} teknik içerik
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
