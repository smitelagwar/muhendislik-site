import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  ChevronRight,
  Hammer,
  Layers,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "İnşaat Hesaplamaları",
  description:
    "İnşaat maliyeti, metraj ve yaklaşık keşif araçları. Kaba iş, ince iş ve diğer giderlerinizi kategoriler bazında hesaplayın.",
};

const TOOLS = [
  {
    id: "insaat-maliyeti",
    href: "/hesaplamalar/insaat-maliyeti",
    icon: Building2,
    label: "İnşaat Maliyet Hesaplama",
    description:
      "Kaba iş, ince iş ve diğer giderler bazında 12 kategoride tam proje maliyet tahmini.",
    badge: "Aktif",
    accent: "amber",
  },
];

const COMING_SOON = [
  {
    icon: Layers,
    label: "Beton Hacmi Hesabı",
    description: "Temel, perde, kolon ve döşeme için hızlı beton hacmi.",
  },
  {
    icon: Wrench,
    label: "Donatı Tonaj Hesabı",
    description: "İnşaat alanı ve döşeme tipine göre yaklaşık demir tonajı.",
  },
  {
    icon: Hammer,
    label: "Duvar Hesabı",
    description: "Tuğla, bims ve gazbeton duvar metraj ve maliyet hesabı.",
  },
  {
    icon: BarChart3,
    label: "Şap Hesabı",
    description: "Alan, kalınlık, malzeme ve işçilik bazında şap maliyeti.",
  },
];

export default function HesaplamalarPage() {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 py-12 sm:px-10 lg:px-16">
      {/* Hero */}
      <div className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
          <Calculator className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400">
            Mühendislik Hesap Araçları
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
          İnşaat Hesaplamaları
        </h1>
        <p className="max-w-2xl text-lg text-zinc-400">
          Maliyet, metraj ve yaklaşık keşif araçları. Gerçek projelerden
          kalibre edilmiş varsayılan değerler, kategori bazlı şeffaf hesap
          motoru.
        </p>
      </div>

      {/* Active tools */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Aktif Araçlar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group relative flex flex-col gap-4 rounded-xl border border-zinc-800 bg-[#111111] p-6 transition-all duration-200 hover:border-amber-500/40 hover:bg-[#141414]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
                  <tool.icon className="h-5 w-5 text-amber-400" />
                </div>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20">
                  {tool.badge}
                </span>
              </div>
              <div>
                <h3 className="mb-1.5 font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">
                  {tool.label}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-amber-500 opacity-0 transition-opacity group-hover:opacity-100">
                Hesaplamaya başla
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Yakında
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-3 rounded-xl border border-zinc-800/60 bg-[#0d0d0d] p-5 opacity-60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                <item.icon className="h-4 w-4 text-zinc-500" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-zinc-400">
                  {item.label}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info block */}
      <div className="mt-16 flex items-start gap-3 rounded-xl border border-zinc-800 bg-[#0d0d0d] p-5">
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed text-zinc-400">
          Tüm hesaplamalar referans amaçlıdır. Gerçek maliyetler bölgeye,
          müteahhite ve piyasa koşullarına göre değişir. Birim fiyatları kendi
          değerlerinizle güncelleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}
