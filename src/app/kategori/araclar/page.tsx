import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tool-icon";
import { getFeaturedTool, getLiveTools } from "@/lib/tools-data";

export const metadata: Metadata = {
  title: "Araçlar",
  description: "Betonarme, şantiye, ısı yalıtımı ve imar ön değerlendirme araçlarına tek merkezden erişin.",
  alternates: {
    canonical: "/kategori/araclar",
  },
};

export default function ToolsCategoryPage() {
  const tools = getLiveTools();
  const featuredTool = getFeaturedTool();

  return (
    <div className="tool-page-shell py-8 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section className="tool-panel relative overflow-hidden rounded-[36px] px-6 py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_38%)]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <Badge className="mb-4 rounded-full bg-blue-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                Araçlar
              </Badge>
              <h1 className="max-w-2xl text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                Hesap araçlarını sade, hızlı ve tek merkezden yönetin
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
                Betonarme, şantiye, ısı yalıtımı ve imar ön değerlendirme araçları bu sayfada tek akışta toplandı. Yardımcı
                metin yükünü azaltıp doğrudan kullanılabilir araçlara odaklanan daha temiz bir vitrin kurgusu kullanıyoruz.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="min-w-[156px] rounded-[28px] border border-blue-200/80 bg-blue-50/90 px-5 py-4 text-blue-950 shadow-[0_18px_46px_-34px_rgba(37,99,235,0.34)] dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-50">
                  <p className="font-mono text-3xl font-black tabular-nums text-blue-700 dark:text-sky-200">{tools.length}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700/70 dark:text-sky-200/70">Araç sayısı</p>
                </div>
              </div>
            </div>

            {featuredTool ? (
              <div className="rounded-[30px] border border-blue-200/80 bg-gradient-to-br from-blue-600 via-blue-700 to-sky-700 p-6 text-white shadow-[0_28px_90px_-42px_rgba(37,99,235,0.65)] dark:border-blue-900/60 md:p-7">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                        <ToolIcon iconKey={featuredTool.iconKey} className="h-6 w-6" />
                      </div>
                      <Badge className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/15">
                        Öne çıkan araç
                      </Badge>
                    </div>

                    <h2 className="text-3xl font-black tracking-tight md:text-4xl">{featuredTool.name}</h2>
                    <p className="mt-4 text-sm leading-7 text-blue-100 md:text-base">{featuredTool.description}</p>
                    <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-blue-100/70">
                      {featuredTool.discipline}
                    </p>
                  </div>

                  <Button asChild className="h-12 rounded-full bg-white px-7 text-sm font-black text-blue-700 hover:bg-blue-50">
                    <Link href={featuredTool.href}>
                      Aracı aç
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="tool-panel rounded-[32px] p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Canlı liste</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white md:text-3xl">Tüm hesap araçları</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              Araç kartları artık doğrudan kullanım kararına hizmet ediyor: net başlık, kısa teknik özet ve tek tıkla açılan
              rota.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative overflow-hidden rounded-[30px] border border-zinc-200 bg-zinc-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_24px_70px_-38px_rgba(37,99,235,0.4)] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-800 dark:hover:bg-zinc-900"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_52%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.12),_transparent_52%)]" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-zinc-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    {tool.discipline}
                  </Badge>
                </div>

                <div className="relative">
                  <h3 className="mt-5 text-xl font-black text-zinc-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {tool.name}
                  </h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-300">
                    Aracı aç
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
