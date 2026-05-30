import { AnimatedSection } from "@/components/animated-section";
import { AnimatedCounter } from "@/components/animated-counter";
import type { HomeMetric } from "@/components/home-types";

// Her metriğin renk teması
const METRIC_THEMES = [
  { accent: "before:bg-amber-500", glow: "hover:shadow-[0_8px_32px_-8px_rgba(245,158,11,0.3)]", icon: "text-amber-500", iconBg: "bg-amber-500/10" },
  { accent: "before:bg-cyan-500", glow: "hover:shadow-[0_8px_32px_-8px_rgba(34,211,238,0.3)]", icon: "text-cyan-400", iconBg: "bg-cyan-500/10" },
  { accent: "before:bg-amber-500", glow: "hover:shadow-[0_8px_32px_-8px_rgba(245,158,11,0.3)]", icon: "text-amber-500", iconBg: "bg-amber-500/10" },
  { accent: "before:bg-cyan-500", glow: "hover:shadow-[0_8px_32px_-8px_rgba(34,211,238,0.3)]", icon: "text-cyan-400", iconBg: "bg-cyan-500/10" },
];

export function HomeStatsBanner({ metrics }: { metrics: HomeMetric[] }) {
  return (
    <section className="border-b border-slate-200 dark:border-white/5 bg-white/60 dark:bg-[#05070c]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-16">
        <AnimatedSection animation="fade-up">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, idx) => {
              const theme = METRIC_THEMES[idx % METRIC_THEMES.length];

              return (
                <div
                  key={metric.label}
                  className={`group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#070b12] px-6 py-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 dark:hover:border-white/10 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:w-full ${theme.accent} ${theme.glow}`}
                >
                  {/* Subtle grid arka plan */}
                  <div
                    className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />

                  {/* İkon + etiket */}
                  <div className="relative flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                      {metric.label}
                    </p>
                    <div className={`rounded-lg ${theme.iconBg} p-2 ${theme.icon} transition-transform duration-300 group-hover:scale-110`}>
                      <metric.icon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Büyük sayı */}
                  <div className="relative mt-5 flex items-baseline gap-1">
                    <AnimatedCounter
                      end={metric.value}
                      prefix={metric.prefix ?? ""}
                      suffix={metric.suffix ?? ""}
                      duration={1800}
                      className="font-mono text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-none"
                    />
                  </div>

                  <p className="relative mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
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
