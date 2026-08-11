import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { HomeProjectPhase, HomeStandard } from "@/components/home-types";

interface HomeProjectPathProps {
  phases: HomeProjectPhase[];
  standards: HomeStandard[];
}

export function HomeProjectPath({ phases, standards }: HomeProjectPathProps) {
  return (
    <section
      data-testid="home-phase-path"
      aria-labelledby="home-phases-title"
      className="home-process-shell relative isolate overflow-hidden"
    >
      <div className="home-process-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
        <div className="grid gap-8 border-b border-white/10 pb-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="home-section-kicker home-section-kicker-inverse">03 / Uygula</p>
            <h2 id="home-phases-title" className="mt-5 max-w-4xl text-3xl font-black tracking-[-0.035em] text-white sm:text-5xl">
              Bir binayı, projeden teslime adım adım izleyin.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400 lg:col-span-4 lg:justify-self-end">
            Tasarım kararından saha kabulüne uzanan altı ana fazı inceleyin; ihtiyaç duyduğunuz uygulama rehberine doğrudan geçin.
          </p>
        </div>

        <div className="home-phase-rail relative mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-6" role="list">
          {phases.map((phase, index) => (
            <article key={phase.id} className="relative" role="listitem">
              <Link
                href={phase.href}
                className="group relative flex h-full min-h-72 flex-col border border-white/10 bg-[#111111]/90 p-5 backdrop-blur-sm transition-colors duration-200 hover:border-amber-400/45 hover:bg-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-bold tracking-[0.18em] text-amber-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-16 w-16 overflow-hidden rounded-md border border-white/10 bg-white/5">
                    <Image src={phase.image} alt="" fill loading="eager" sizes="64px" className="object-cover opacity-90" aria-hidden />
                  </div>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-lg font-black leading-tight text-white transition-colors group-hover:text-amber-200">
                    {phase.title}
                  </h3>
                  <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-400">{phase.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-slate-200">
                    Fazı incele
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/kategori/bina-asamalari" className="home-button-primary justify-center">
            İnteraktif bina haritasını aç
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-16 border border-white/10 bg-black/25">
          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {standards.map((standard) => (
              <Link
                key={standard.code}
                href={standard.href}
                className="group flex min-h-24 items-center justify-between gap-4 bg-[#0d0d0d] px-5 py-4 transition-colors duration-200 hover:bg-[#171717] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <span>
                  <span className="block font-mono text-xs font-bold tracking-[0.12em] text-amber-400">{standard.code}</span>
                  <span className="mt-2 block text-xs text-slate-400">{standard.label}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-400" aria-hidden />
              </Link>
            ))}
          </div>
          <div className="flex items-start gap-3 border-t border-white/10 px-5 py-4 text-xs leading-6 text-slate-400 sm:items-center">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400 sm:mt-0" aria-hidden />
            <p>
              Hesap araçları ön boyutlandırma ve karşılaştırma amaçlıdır. Nihai mühendislik kararı, proje verileri ve yürürlükteki mevzuat birlikte değerlendirilerek yetkili uzman tarafından verilmelidir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
