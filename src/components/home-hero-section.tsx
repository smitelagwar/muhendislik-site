import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeHeroVisual } from "@/components/home-hero-visual";
import { HomeSearchTrigger } from "@/components/home-search-trigger";

const HERO_CALLOUTS = [
  {
    code: "TBDY 2018",
    detail: "DEPREM VE TASARIM",
    positionClass: "left-[7%] top-[47%] xl:left-[12%]",
  },
  {
    code: "TS 500",
    detail: "BETONARME HESAPLAMA",
    positionClass: "right-[11%] top-[16%] xl:right-[15%]",
  },
  {
    code: "CAD · 3B",
    detail: "DOKÜMANTASYON VE SİMÜLASYON",
    positionClass: "right-[6%] top-[42%] xl:right-[10%]",
  },
] as const;

export function HomeHeroSection() {
  return (
    <section
      data-testid="home-hero"
      aria-labelledby="home-hero-title"
      className="home-crimson-hero relative isolate overflow-hidden border-b border-white/10"
    >
      {/* Çok hafif teknik ızgara ve müze galerisi vinyet katmanı */}
      <div className="home-crimson-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-crimson-vignette pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto flex max-w-[1520px] flex-col px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10 lg:min-h-[min(86svh,820px)] lg:justify-between lg:px-12 lg:pb-11 lg:pt-11 xl:px-16">
        {/* Üst-sol anıtsal ana başlık */}
        <div className="relative z-10 lg:pointer-events-none lg:max-w-[27rem]">
          <p className="home-crimson-kicker">
            <span className="home-amber-dot" aria-hidden />
            Mühendislik ve mimarlık çalışma alanı
          </p>
          <h1
            id="home-hero-title"
            className="mt-4 text-[clamp(2.55rem,5.5vw,5.15rem)] font-bold leading-[0.94] tracking-[-0.048em] text-[#fff8f2]"
          >
            Kalıcı olan
            <span className="block text-[#ffe5cb]">hesaptır.</span>
          </h1>
        </div>

        {/* Tek etkileşimli filozof heykel hologramı: mobilde akışta, masaüstünde tam sahne */}
        <div className="relative my-3 h-[330px] w-full sm:h-[430px] lg:pointer-events-auto lg:absolute lg:inset-0 lg:my-0 lg:h-full">
          <HomeHeroVisual />
        </div>

        {/* Masaüstünde heykel çevresinde süzülen teknik telemetri işaretçileri */}
        {HERO_CALLOUTS.map((callout) => (
          <div
            key={callout.code}
            aria-hidden
            className={`home-hero-callout pointer-events-none absolute z-10 hidden items-start gap-2.5 lg:flex ${callout.positionClass}`}
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.75)]" />
            <div className="font-mono text-[10px] leading-4 tracking-[0.14em] uppercase">
              <div className="font-bold text-[#fff5ea]">{callout.code}</div>
              <div className="text-[#f5d2be]/78">{callout.detail}</div>
            </div>
          </div>
        ))}

        {/* Alt şerit: sol manifesto + arama + aksiyonlar | sağ karşı-başlık */}
        <div className="relative z-10 mt-2 flex flex-col gap-6 lg:pointer-events-none lg:mt-auto lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[22rem] xl:max-w-[24rem] lg:pointer-events-auto">
            <p className="text-[13px] leading-6 text-[#fae6d7]/88 sm:text-sm sm:leading-6">
              Kadim yapı aklının çağdaş disiplini. Klasik mühendislik mantığının TS 500 ve TBDY 2018 hassasiyetiyle
              buluştuğu teknik çalışma alanı.
            </p>

            <HomeSearchTrigger
              variant="crimson"
              className="home-crimson-search mt-4 w-full"
            />

            <div className="mt-4 flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <Link href="/hesaplamalar" className="home-crimson-cta whitespace-nowrap">
                Hesaplamalar
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link href="/kategori/araclar" className="home-crimson-link whitespace-nowrap">
                Yapısal araçlar
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end lg:text-right">
            <p
              aria-hidden
              className="text-[clamp(2rem,3.9vw,3.75rem)] font-bold leading-[0.96] tracking-[-0.042em] text-[#fff8f2]"
            >
              Dayanmak için
              <span className="block text-[#ffd8b0]">akıl.</span>
            </p>
            <span className="home-hologram-hint mt-3 hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#f6d5c0]/70 lg:inline-flex lg:items-center lg:gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" aria-hidden />
              İmleci heykel üzerinde gezdirin
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
