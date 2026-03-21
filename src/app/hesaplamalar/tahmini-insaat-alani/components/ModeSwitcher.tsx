import { cn } from "@/lib/utils";
import type { AreaEstimationMode } from "@/lib/calculations/modules/tahmini-insaat-alani/types";

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: AreaEstimationMode;
  onChange: (mode: AreaEstimationMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-200/80 bg-white/80 p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      {[
        { id: "quick" as const, label: "Hizli Mod" },
        { id: "detailed" as const, label: "Detayli Mod" },
      ].map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          data-testid={`estimated-area-mode-${item.id}`}
          aria-pressed={mode === item.id}
          className={cn(
            "min-h-11 rounded-full px-4 py-2 text-sm font-black transition-colors",
            mode === item.id
              ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
              : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
