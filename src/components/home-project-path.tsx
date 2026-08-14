import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeProjectPhase } from "@/lib/home-content";

interface PhaseFrameStyle extends CSSProperties {
  "--phase-frame-position": string;
}

function getPhaseFrameStyle(frameIndex: number): PhaseFrameStyle {
  const position = `${(frameIndex / 5) * 100}%`;
  return { "--phase-frame-position": position };
}

export function HomeProjectPath({ phases }: { phases: HomeProjectPhase[] }) {
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
            <h2 id="home-phases-title" className="mt-5 max-w-4xl text-3xl font-bold tracking-[-0.035em] text-white sm:text-5xl">
              Aynı yapının, projeden teslime altı hâli.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-400 lg:col-span-4 lg:justify-self-end">
            Tasarım kararını, saha uygulamasını ve teslim sürecini aynı yapı geometrisi üzerinden kesintisiz izleyin.
          </p>
        </div>

        <div className="home-phase-list mt-10" role="list">
          {phases.map((phase, index) => (
            <article key={phase.id} role="listitem" className="home-phase-item">
              <Link
                href={phase.href}
                data-testid="home-phase-link"
                className="group grid h-full grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5 sm:py-5 xl:block xl:py-0"
              >
                <div
                  style={getPhaseFrameStyle(phase.frameIndex)}
                  className="home-phase-frame aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-[#0b0d10]"
                  aria-hidden
                />
                <div className="flex min-w-0 flex-col xl:min-h-56 xl:pt-5">
                  <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-amber-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-base font-bold leading-tight text-white transition-colors group-hover:text-amber-200">
                    {phase.title}
                  </h3>
                  <p className="mt-3 hidden line-clamp-3 text-xs leading-5 text-slate-400 sm:block">{phase.summary}</p>
                  <span className="mt-auto hidden items-center gap-2 pt-4 text-xs font-bold text-slate-200 sm:inline-flex">
                    Fazı incele
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-end">
          <Link href="/kategori/bina-asamalari" className="home-button-primary justify-center">
            Tüm bina aşamalarını aç
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
