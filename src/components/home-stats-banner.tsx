import { AnimatedSection } from "@/components/animated-section";
import { AnimatedCounter } from "@/components/animated-counter";
import type { HomeMetric } from "@/components/home-types";

export function HomeStatsBanner({ metrics }: { metrics: HomeMetric[] }) {
  return (
    <section className="border-b border-slate-900/80 bg-[#05070c]">
      <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-16">
        <AnimatedSection animation="fade-up">
          <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-[#070b12] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                  <metric.icon className="h-4 w-4 text-amber-300" />
                </div>
                <AnimatedCounter
                  end={metric.value}
                  prefix={metric.prefix ?? ""}
                  suffix={metric.suffix ?? ""}
                  duration={1800}
                  className="mt-4 block font-mono text-3xl font-black text-white"
                />
                <p className="mt-2 text-sm leading-6 text-slate-400">{metric.note}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
