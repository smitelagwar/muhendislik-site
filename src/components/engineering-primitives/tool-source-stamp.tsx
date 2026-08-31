import React from "react";
import { BookOpen } from "lucide-react";

interface ToolSourceStampProps {
  sources: string[];
  tier?: "A" | "B" | "C";
  className?: string;
}

export function ToolSourceStamp({ sources, tier, className = "" }: ToolSourceStampProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded-md border border-border/80 dark:border-white/10 bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
        <BookOpen className="h-3 w-3 shrink-0 text-purple-400" />
        {sources.join(" • ")}
      </span>
      {tier && (
        <span className="rounded-md border border-border/60 dark:border-white/5 bg-background/50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground/80 dark:text-zinc-400">
          Tier {tier}
        </span>
      )}
    </div>
  );
}