import { Badge } from "@/components/ui/badge";

interface DepremKategoriHeroProps {
  articleCount: number;
  seriesCount: number;
}

export default function DepremKategoriHero({ articleCount, seriesCount }: DepremKategoriHeroProps) {
  return (
    <section className="border-b border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-none bg-red-600/15 text-red-300">Deprem ve Yönetmelikler</Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            {articleCount} içerik
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
            {seriesCount} alt dal
          </Badge>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
            Deprem, Yönetmelik ve Tasarım Rehberleri
          </h1>
          <p className="max-w-4xl text-base leading-8 text-zinc-400 md:text-lg">
            TBDY 2018, TS 500, yangın, imar, otopark, enerji, zemin, erişilebilirlik, Eurocode, akustik, asansör, İSG ve çevre başlıklarını aynı merkezde takip edin.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Odak</p>
            <p className="mt-2 text-sm font-bold text-white">Tek merkez, çok alt dal</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Yapı</p>
            <p className="mt-2 text-sm font-bold text-white">Filtre, arama ve seri sıralaması</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Çıktı</p>
            <p className="mt-2 text-sm font-bold text-white">İlgili araç ve referans bağlantıları</p>
          </div>
        </div>
      </div>
    </section>
  );
}

