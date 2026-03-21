import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TechnicalAreaLineState } from "../client-state";

export function TechnicalAreaRows({
  blockId,
  technicalLines,
  onAdd,
  onChange,
  onRemove,
}: {
  blockId: string;
  technicalLines: TechnicalAreaLineState[];
  onAdd: () => void;
  onChange: (lineId: string, key: "label" | "areaM2", value: string) => void;
  onRemove: (lineId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {technicalLines.map((line, index) => (
        <div
          key={line.id}
          className="grid gap-3 rounded-[22px] border border-zinc-200/80 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_44px]">
            <Input
              value={line.label}
              onChange={(event) => onChange(line.id, "label", event.target.value)}
              placeholder="Ornek: Su deposu"
              className="tool-input h-11"
              data-testid={`estimated-area-detailed-block-${blockId}-technical-${index}-label`}
            />
            <Input
              value={line.areaM2}
              onChange={(event) => onChange(line.id, "areaM2", event.target.value)}
              placeholder="m2"
              inputMode="decimal"
              className="tool-input h-11"
              data-testid={`estimated-area-detailed-block-${blockId}-technical-${index}-area`}
            />
            <button
              type="button"
              onClick={() => onRemove(line.id)}
              className="flex min-h-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              aria-label="Teknik alan satirini sil"
              data-testid={`estimated-area-detailed-block-${blockId}-technical-${index}-remove`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:text-white"
        data-testid={`estimated-area-detailed-block-${blockId}-add-technical`}
      >
        <Plus className="h-4 w-4" />
        Teknik alan ekle
      </button>
    </div>
  );
}
