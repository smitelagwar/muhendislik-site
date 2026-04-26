import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RouteFeedbackActionVariant = "default" | "outline" | "ghost";

interface RouteFeedbackAction {
  href: string;
  label: string;
  icon?: ReactNode;
  variant?: RouteFeedbackActionVariant;
}

interface RouteFeedbackProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: RouteFeedbackAction[];
  children?: ReactNode;
  className?: string;
}

export function RouteFeedback({
  eyebrow,
  title,
  description,
  actions = [],
  children,
  className,
}: RouteFeedbackProps) {
  return (
    <main className={cn("min-h-[72vh] px-4 py-16 sm:px-6 lg:px-8", className)}>
      <section
        aria-labelledby="route-feedback-title"
        className="relative mx-auto max-w-4xl overflow-hidden rounded-[36px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/25 sm:p-8 md:p-10"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13, 148, 136,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_32%)]" />
        <div className="relative">
          <div className="mb-8 inline-flex rounded-full border border-teal-400/25 bg-teal-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">
            {eyebrow}
          </div>

          <h1 id="route-feedback-title" className="max-w-3xl text-3xl font-black tracking-tight text-zinc-100 sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            {description}
          </p>

          {children ? <div className="mt-7">{children}</div> : null}

          {actions.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => (
                <Button
                  key={action.href}
                  asChild
                  variant={action.variant ?? (index === 0 ? "default" : "outline")}
                  className="h-11 rounded-full px-5 text-sm font-black"
                >
                  <Link href={action.href}>
                    {action.icon}
                    <span>{action.label}</span>
                    {index === 0 ? <ArrowRight className="h-4 w-4" /> : null}
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
