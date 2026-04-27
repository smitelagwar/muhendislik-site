import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { TiltCard } from "@/components/tilt-card";
import { ToolIcon } from "@/components/tool-icon";
import { Button } from "@/components/ui/button";
import type { ToolDefinition } from "@/lib/tools-data";

const BENTO_LAYOUT = [
  "col-span-1 sm:col-span-2 lg:col-span-5 lg:row-span-2",
  "col-span-1 sm:col-span-1 lg:col-span-3",
  "col-span-1 sm:col-span-1 lg:col-span-4",
  "col-span-1 sm:col-span-2 lg:col-span-4",
  "col-span-1 sm:col-span-1 lg:col-span-3",
  "col-span-1 sm:col-span-1 lg:col-span-3",
  "col-span-1 sm:col-span-2 lg:col-span-2",
  "col-span-1 sm:col-span-1 lg:col-span-3",
  "col-span-1 sm:col-span-1 lg:col-span-5",
];

export function HomeToolsBento({ tools }: { tools: ToolDefinition[] }) {
  return (
    <section id="home-tools" className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="home-section-kicker">Araç yüzeyi</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Günlük kararlar için kurgulanmış araç workbench’i
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Araçlar artık sidebar içinde kaybolmuyor. Her biri kendi disiplin sinyaliyle görünür, hızlı açılır ve
            teknik akışa doğrudan girer.
          </p>
        </div>
        <Button asChild variant="outline" className="home-button-secondary self-start">
          <Link href="/kategori/araclar">Tüm araç merkezi</Link>
        </Button>
      </div>

      <div className="mt-10 grid auto-rows-[minmax(180px,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {tools.map((tool, index) => {
          const layoutClass = BENTO_LAYOUT[index] ?? "col-span-1";
          const isPrimary = index === 0;

          return (
            <AnimatedSection
              key={tool.id}
              animation="fade-up"
              delay={index * 90}
              className={layoutClass}
            >
              <TiltCard
                intensity={isPrimary ? 5 : 4}
                className={`h-full rounded-lg border ${
                  isPrimary
                    ? "border-amber-400/35 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(7,11,18,0.92))]"
                    : "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(7,11,18,0.92))]"
                }`}
              >
                <Link
                  href={tool.href}
                  className="group animate-tool-shimmer flex h-full flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/5 text-amber-200">
                        <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                      </div>
                      <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {tool.discipline}
                      </span>
                    </div>
                    <h3 className={`mt-6 font-black text-white ${isPrimary ? "text-2xl" : "text-xl"}`}>{tool.name}</h3>
                    <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">{tool.description}</p>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 transition-colors group-hover:text-white">
                    Aracı aç
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </TiltCard>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
