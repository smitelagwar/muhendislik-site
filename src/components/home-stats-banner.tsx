import { AnimatedSection } from "@/components/animated-section";
import { AnimatedCounter } from "@/components/animated-counter";
import type { HomeMetric } from "@/components/home-types";

export function HomeStatsBanner({ metrics }: { metrics: HomeMetric[] }) {
  return (
    <section className="border-b border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-[#05070c]/60 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-16">
        <AnimatedSection animation="fade-up">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, idx) => {
              // Değişken renk tonları ve dekorasyonlar için indis bazlı seçim
              const isEven = idx % 2 === 0;
              const accentBorderClass = isEven 
                ? "before:bg-amber-500 dark:before:bg-amber-400/80" 
                : "before:bg-cyan-500 dark:before:bg-cyan-400/80";

              return (
                <div
                  key={metric.label}
                  className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#070b12] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:hover:border-white/10 before:absolute before:left-0 before:top-0 before:h-1 before:w-full ${accentBorderClass}`}
                >
                  {/* Grid arka plan çizgisi efekti */}
                  <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="relative flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {metric.label}
                    </p>
                    <div className="rounded-lg bg-slate-100 dark:bg-white/5 p-2 text-amber-600 dark:text-amber-300 transition-colors duration-300">
                      <metric.icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div className="relative mt-4 flex items-baseline">
                    <AnimatedCounter
                      end={metric.value}
                      prefix={metric.prefix ?? ""}
                      suffix={metric.suffix ?? ""}
                      duration={1800}
                      className="font-mono text-4xl font-black tracking-tight text-slate-900 dark:text-white"
                    />
                  </div>

                  <p className="relative mt-2.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {metric.note}
                  </p>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
