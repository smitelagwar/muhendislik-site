import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeWorkflowStep } from "@/lib/home-content";

export function HomeWorkflowBand({ steps }: { steps: HomeWorkflowStep[] }) {
  return (
    <section
      data-testid="home-workflow"
      aria-labelledby="home-workflow-title"
      className="border-b border-[var(--home-border)] bg-[var(--home-bg)]"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16">
        <div className="home-workflow-frame grid overflow-hidden rounded-lg border border-[var(--home-border)] lg:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
          <div className="border-b border-[var(--home-border)] bg-[var(--home-surface-raised)] p-6 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--home-accent)]">
              Örnek karar yolu
            </p>
            <h2 id="home-workflow-title" className="mt-3 text-xl font-bold tracking-[-0.025em] text-[var(--home-fg)]">
              Arsadan ön fizibiliteye
            </h2>
            <p className="mt-3 text-xs leading-6 text-[var(--home-muted)]">
              Dört kopuk araç değil, birbirini tamamlayan tek proje başlangıcı.
            </p>
          </div>

          {steps.map((step, index) => (
            <Link
              key={step.href}
              href={step.href}
              data-testid="home-workflow-step"
              className={`group relative flex min-h-32 flex-col justify-between border-b border-[var(--home-border)] p-5 transition-colors duration-200 hover:bg-[var(--home-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] sm:min-h-40 lg:border-b-0 ${
                index > 0 ? "lg:border-l" : ""
              }`}
            >
              <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-[var(--home-info)]">{step.number}</span>
              <span className="mt-5 sm:mt-8">
                <strong className="block text-sm font-bold text-[var(--home-fg)]">{step.title}</strong>
                <span className="mt-2 block text-xs leading-5 text-[var(--home-muted)]">{step.description}</span>
              </span>
              <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--home-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-accent)]" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
