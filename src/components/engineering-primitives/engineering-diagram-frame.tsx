import React from "react";

interface EngineeringDiagramFrameProps {
  title: string;
  subtitle?: string;
  legend?: React.ReactNode;
  accessibleFallbackText: string;
  children: React.ReactNode;
  className?: string;
}

export function EngineeringDiagramFrame({
  title,
  subtitle,
  legend,
  accessibleFallbackText,
  children,
  className = "",
}: EngineeringDiagramFrameProps) {
  return (
    <figure
      className={`rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-3 ${className}`}
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 dark:border-white/10 pb-2.5">
        <div>
          <figcaption className="text-xs font-black uppercase tracking-wider text-foreground dark:text-white">
            {title}
          </figcaption>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {legend && <div className="text-xs">{legend}</div>}
      </div>

      <div className="relative w-full overflow-hidden flex items-center justify-center min-h-[140px]">
        {children}
      </div>

      <div className="sr-only">
        <p>{accessibleFallbackText}</p>
      </div>
    </figure>
  );
}