import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Calculator,
  ChevronRight,
  Clock3,
  FileText,
  GitBranchPlus,
  HardHat,
  Layers3,
  Mail,
  Shield,
} from "lucide-react";
import { HomeFeed } from "@/components/home-feed";
import type { HomeArticle } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tool-icon";
import { TOOLS_HUB_HREF, getLiveTools } from "@/lib/tools-data";

type QuickPath = {
  title: string;
  description: string;
  href: string;
  icon: typeof Shield;
  count?: (depremArticleCount: number, toolCount: number, articleCount: number) => string | null;
};

type StandardReference = {
  code: string;
  title: string;
  description: string;
  href: string;
};

const QUICK_PATHS: QuickPath[] = [
  {
    title: "Deprem ve Mevzuat",
    description: "TBDY 2018, TS 500 ve uygulama notlarını aynı kümeye toplayan merkez.",
    href: "/kategori/deprem-yonetmelik",
    icon: Shield,
    count: (depremArticleCount) => `${depremArticleCount} içerik`,
  },
  {
    title: "Hesaplamalar",
    description: "Maliyet, metraj ve alan tahminlerini tek akışta karşılaştırın.",
    href: "/hesaplamalar",
    icon: Calculator,
  },
  {
    title: "Araçlar",
    description: "Betonarme, imar ve deprem araçlarına doğrudan erişin.",
    href: TOOLS_HUB_HREF,
    icon: FileText,
    count: (_depremArticleCount, toolCount) => `${toolCount} araç`,
  },
  {
    title: "Bina Aşamaları",
    description: "Kazı-temelden ince işlere kadar saha akışını adım adım izleyin.",
    href: "/kategori/bina-asamalari",
    icon: GitBranchPlus,
  },
  {
    title: "Konu Haritası",
    description: "Tüm içerik kümelerini ve ilişkili öğrenme yollarını geniş görünümde açın.",
    href: "/konu-haritasi",
    icon: Layers3,
    count: (_depremArticleCount, _toolCount, articleCount) => `${articleCount}+ kayıt`,
  },
];

const STANDARD_REFERENCES: StandardReference[] = [
  {
    code: "TS 500",
    title: "Betonarme ön boyutlandırma ve donatı mantığı",
    description: "Kolon, kiriş, döşeme ve genel betonarme kontrol akışlarında temel referans.",
    href: TOOLS_HUB_HREF,
  },
  {
    code: "TBDY 2018",
    title: "Deprem etkisi ve düzensizlik kararları",
    description: "Deprem kategori sayfaları ve taban kesme araçları için ana mevzuat omurgası.",
    href: "/kategori/deprem-yonetmelik",
  },
  {
    code: "TS EN 1992-1-1",
    title: "Pas payı ve dayanıklılık yaklaşımı",
    description: "Beton örtüsü, çevresel sınıf ve dayanıklılık kararlarında kullanılan teknik çerçeve.",
    href: "/kategori/araclar/pas-payi",
  },
  {
    code: "TS 825:2024",
    title: "Isı yalıtımı ve cephe kalınlık seçimi",
    description: "Yalıtım kalınlığı aracında hızlı ön karar üretmek için kullanılan güncel doğrultu.",
    href: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
  },
];

export default function HomeClient({ allArticles }: { allArticles: HomeArticle[] }) {
  const liveTools = getLiveTools();
  const heroArticle = allArticles[0] ?? null;
  const featuredArticles = allArticles.slice(1, 3);
  const feedArticles = allArticles.slice(3);
  const depremArticleCount = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik").length;
  const highlightedTools = liveTools.slice(0, 5);
  const trustStats = [
    { label: "Canlı araç", value: `${liveTools.length}+`, icon: Calculator },
    { label: "Teknik içerik", value: `${allArticles.length}+`, icon: BookOpenText },
    { label: "Standart kümesi", value: "4 ana başlık", icon: BadgeCheck },
    { label: "Şantiye odağı", value: "Mobil uyumlu", icon: HardHat },
  ];

  return (
    <div className="pb-14">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {heroArticle ? (
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-[36px] border border-amber-500/20 bg-zinc-950 shadow-[0_36px_120px_-60px_rgba(245,158,11,0.45)] lg:col-span-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_34%),radial-gradient(circle_at_right,_rgba(59,130,246,0.14),_transparent_28%)]" />
              <div className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
                <div className="relative min-h-[420px]">
                  <Image
                    src={heroArticle.image}
                    alt={heroArticle.title}
                    fill
                    priority
                    className="object-cover opacity-45"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/80 to-zinc-950/20" />
                  <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
                        Editör seçimi
                      </span>
                      <Badge variant="outline" className={`${heroArticle.categoryColor} border-none`}>
                        {heroArticle.category}
                      </Badge>
                    </div>

                    <div className="max-w-2xl">
                      <p className="mb-3 text-sm font-semibold text-amber-100/85">Teknik portal, pratik saha akışı ve referans mevzuat</p>
                      <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
                        {heroArticle.title}
                      </h1>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">{heroArticle.description}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-300">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-amber-300" />
                          {heroArticle.readTime}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        <span>{heroArticle.author}</span>
                        <span className="h-1 w-1 rounded-full bg-zinc-600" />
                        <span>{heroArticle.date}</span>
                      </div>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-full px-7">
                          <Link href={`/${heroArticle.slug}`} prefetch={false}>
                            Makaleyi aç
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                          <Link href={TOOLS_HUB_HREF} prefetch={false}>
                            Araçlara geç
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-t border-zinc-800 bg-zinc-950/90 p-6 lg:border-l lg:border-t-0">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Portal özeti</p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Sahada işe yarayan kısa yol</h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      İçeriği yalnızca yayın listesi olarak değil, karar vermeyi hızlandıran bir teknik çalışma yüzeyi olarak kurguladık.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {trustStats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{stat.label}</p>
                          <stat.icon className="h-4 w-4 text-amber-300" />
                        </div>
                        <p className="mt-3 text-2xl font-black text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:col-span-4">
              {featuredArticles.map((article, index) => (
                <Link
                  key={article.slug}
                  href={`/${article.slug}`}
                  prefetch={false}
                  className="group flex flex-col justify-between rounded-[30px] border border-zinc-800 bg-zinc-950/85 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-[0_24px_60px_-36px_rgba(245,158,11,0.35)]"
                >
                  <div>
                    <span className="inline-flex rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {index === 0 ? "Öne çıkan" : "Hızlı okuma"}
                    </span>
                    <Badge variant="outline" className={`${article.categoryColor} mt-4 border-none font-bold`}>
                      {article.category}
                    </Badge>
                    <h2 className="mt-4 text-xl font-black leading-snug text-white transition-colors group-hover:text-amber-200">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{article.description}</p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{article.date}</div>
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
                      Aç
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[36px] border border-amber-500/15 bg-zinc-950/80 p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.75)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">Bilgi mimarisi</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Doğru merkeze tek adımda geçin</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              Uzun akış içinde kaybolmak yerine, mühendislik kararlarında en sık açılan kümeleri ana sayfada görünür hale getiriyoruz.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {QUICK_PATHS.map((path) => {
              const Icon = path.icon;
              const count = path.count?.(depremArticleCount, liveTools.length, allArticles.length) ?? null;

              return (
                <Link
                  key={path.href}
                  href={path.href}
                  prefetch={false}
                  className="group relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:bg-zinc-900"
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    {count ? (
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                        {count}
                      </span>
                    ) : null}
                  </div>
                  <div className="relative mt-5">
                    <h3 className="text-lg font-black text-white transition-colors group-hover:text-amber-200">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{path.description}</p>
                  </div>
                  <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-black text-amber-200">
                    Keşfet
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-6 shadow-[0_24px_70px_-44px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">Standart omurgası</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Kararları yöneten referans çerçeve</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">
                Portal içeriğini yalnızca başlıklarla değil, gerçek proje kararlarında açılan standart kümeleriyle eşliyoruz.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {STANDARD_REFERENCES.map((reference) => (
                <Link
                  key={reference.code}
                  href={reference.href}
                  prefetch={false}
                  className="group rounded-[26px] border border-zinc-800 bg-zinc-900/80 p-5 transition-all hover:border-amber-400/30 hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                      {reference.code}
                    </span>
                    <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-200" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-white transition-colors group-hover:text-amber-200">{reference.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{reference.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-800 bg-zinc-950/80 p-6 shadow-[0_24px_70px_-44px_rgba(0,0,0,0.7)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">Operasyon notu</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Hız, doğruluk ve saha okunabilirliği</h2>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-sm font-black text-white">Daha hafif ana sayfa</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Etkileşim gerektirmeyen bloklar server tarafında işlendi; filtreli akış ayrı istemci parçasına ayrıldı.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-sm font-black text-white">Türkçe ve mühendislik dili</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Ana kabukta görünen metinler ve gezinme yüzeyleri daha net, daha tutarlı ve daha az kırılgan hale getirildi.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                <p className="text-sm font-black text-white">Mobil odaklı gezinme</p>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Büyük kartlar, görünür filtre etiketleri ve kontrastlı aksiyon yüzeyleriyle mobil kullanım kolaylaştırıldı.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="lg:w-[68%]">
            <HomeFeed articles={feedArticles} />
          </div>

          <aside className="flex flex-col gap-6 lg:w-[32%]">
            <div className="relative overflow-hidden rounded-[30px] border border-amber-500/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(245,158,11,0.05)),linear-gradient(180deg,#1a1204,#100d08)] p-7 text-white shadow-[0_24px_70px_-42px_rgba(245,158,11,0.5)]">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <FileText className="h-28 w-28" />
              </div>
              <h3 className="relative z-10 text-2xl font-black">İletişim ve iş birliği</h3>
              <p className="relative z-10 mt-3 text-sm leading-7 text-amber-100/90">
                Yeni araç önerisi, içerik düzeltmesi veya proje iş birliği için doğrudan ulaşabilirsiniz.
              </p>
              <div className="relative z-10 mt-6 flex flex-col gap-3">
                <Button asChild className="h-12 w-full justify-center rounded-full">
                  <a href="mailto:info@insablog.com?subject=Muhendislik%20Portali%20Iletisim" aria-label="E-posta gönder">
                    <Mail className="h-4 w-4" />
                    E-posta gönder
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-12 w-full justify-center rounded-full">
                  <Link href="/iletisim" prefetch={false}>
                    İletişim sayfasını aç
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-zinc-800 bg-zinc-950/80 p-7 shadow-[0_24px_70px_-44px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">Canlı araçlar</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Pratik hesap akışları</h3>
                </div>
                <Calculator className="h-5 w-5 text-amber-200" />
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {highlightedTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    prefetch={false}
                    className="group flex gap-4 rounded-[22px] border border-transparent bg-zinc-900/75 p-4 transition-all hover:border-amber-400/25 hover:bg-zinc-900"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-200 transition-all group-hover:scale-[1.02]">
                      <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-100 transition-colors group-hover:text-amber-200">{tool.name}</h4>
                      <p className="mt-1 text-xs leading-6 text-zinc-400">{tool.description}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{tool.discipline}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <Button asChild variant="ghost" className="mt-6 w-full justify-center text-amber-200 hover:bg-amber-500/10">
                <Link href={TOOLS_HUB_HREF} prefetch={false}>
                  Tüm hesap araçları
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
