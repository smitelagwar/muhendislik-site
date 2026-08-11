import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tool-icon";
import { getFeaturedTool, getLiveTools } from "@/lib/tools-data";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata: Metadata = buildSeoMetadata({
  title: "Araçlar",
  description: "Betonarme, şantiye, ısı yalıtımı ve imar ön değerlendirme araçlarına tek merkezden erişin.",
  pathname: "/kategori/araclar",
});

export default function ToolsCategoryPage() {
  const tools = getLiveTools();
  const featuredTool = getFeaturedTool();

  return (
    <div className="tool-page-shell py-8 md:py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <section className="tool-panel relative overflow-hidden rounded-xl px-6 py-8 md:px-8 md:py-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(37,99,235,0.11),_transparent_38%)]" />

          <div className="relative grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="max-w-3xl">
              <Badge className="mb-4 bg-amber-500/10 px-4 py-1 text-[11px] text-amber-800 hover:bg-amber-500/15 dark:text-amber-300">
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
                <div className="min-w-[156px] rounded-md border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-amber-950 dark:text-amber-50">
                  <p className="font-mono text-3xl font-black tabular-nums text-amber-700 dark:text-amber-300">{tools.length}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-200/70">Araç sayısı</p>
                </div>
              </div>
            </div>

            {featuredTool ? (
              <div className="rounded-xl border border-amber-400/30 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.25),_transparent_42%),linear-gradient(135deg,#171717,#0a0a0a)] p-6 text-white shadow-[0_28px_90px_-48px_rgba(0,0,0,0.72)] md:p-7">
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
                    <p className="mt-4 text-sm leading-7 text-zinc-300 md:text-base">{featuredTool.description}</p>
                    <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300/80">
                      {featuredTool.discipline}
                    </p>
                  </div>

                  <Button asChild className="h-12 px-7 text-sm font-black">
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

        <section className="tool-panel rounded-xl p-6 md:p-8">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Yeni yüzey</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white md:text-3xl">
                Gelişmiş hesaplamalar dünyasına geçin
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Yeni hesaplamalar yüzeyinde Hızlı Metraj Hesaplayıcı, detaylı inşaat maliyet analizi
                ve 2026 resmî birim maliyet karşılaştırması birlikte yer alıyor. Bu sayfa klasik araç
                listesi olarak kalırken, yeni akışın merkezi artık{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">/hesaplamalar</span>.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="h-12 px-7 text-sm font-black">
                  <Link href="/hesaplamalar">
                    <Calculator className="mr-2 h-4 w-4" />
                    Hesaplamaları aç
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 px-7 text-sm font-black"
                >
                  <Link href="/hesaplamalar/hizli-metraj">Hızlı Metrajı aç</Link>
                </Button>
              </div>
            </div>

            <Link
              href="/hesaplamalar/hizli-metraj"
              className="group site-link-card rounded-xl border border-blue-500/25 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.09),_transparent_45%),var(--site-surface)] p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge className="bg-amber-500/10 px-3 py-1 text-[11px] text-amber-800 hover:bg-amber-500/15 dark:text-amber-300">
                  Öne çıkan yeni araç
                </Badge>
                <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                  Ön keşif
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight text-zinc-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                Hızlı Metraj Hesaplayıcı
              </h3>
              <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Girilen kat alanı, kat adedi, temel tipi ve zemin sınıfına göre yaklaşık beton,
                donatı, kalıp ve kaba taşıyıcı maliyet bandını üretir. Sonuç ekranı resmî toplam
                yaklaşık maliyeti de aynı anda kıyaslar.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-300">
                Hızlı Metrajı aç
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>

        <section className="tool-panel rounded-xl p-6 md:p-8">
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
                className="group site-link-card site-panel relative overflow-hidden rounded-xl p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.1),_transparent_52%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="rounded-md bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                    <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-md border-zinc-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                  >
                    {tool.discipline}
                  </Badge>
                </div>

                <div className="relative">
                  <h3 className="mt-5 text-xl font-black text-zinc-950 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                    {tool.name}
                  </h3>
                  <p className="mt-3 min-h-[84px] text-sm leading-7 text-zinc-600 dark:text-zinc-400">{tool.description}</p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-300">
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



