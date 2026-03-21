import { Building2, ChevronRight, Layers3, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FloorProgramRole } from "@/lib/calculations/modules/tahmini-insaat-alani/types";
import type { FloorProgramBlockState } from "../client-state";
import { TechnicalAreaRows } from "./TechnicalAreaRows";

function roleLabel(role: FloorProgramRole) {
  switch (role) {
    case "basement":
      return "Bodrum";
    case "ground":
      return "Zemin";
    case "typicalResidential":
      return "Tip kat";
    case "roofTechnical":
      return "Cati";
    default:
      return "Ozel";
  }
}

export function FloorProgramBlockCard({
  block,
  index,
  disableRemove,
  onFieldChange,
  onAddTechnicalLine,
  onTechnicalLineChange,
  onRemoveTechnicalLine,
  onRemove,
}: {
  block: FloorProgramBlockState;
  index: number;
  disableRemove?: boolean;
  onFieldChange: (
    key:
      | "label"
      | "repeatCount"
      | "grossIndependentAreaM2"
      | "netIndependentAreaM2"
      | "balconyTerraceAreaM2"
      | "commonCirculationAreaM2"
      | "elevatorShaftAreaM2"
      | "notes",
    value: string
  ) => void;
  onAddTechnicalLine: () => void;
  onTechnicalLineChange: (lineId: string, key: "label" | "areaM2", value: string) => void;
  onRemoveTechnicalLine: (lineId: string) => void;
  onRemove: () => void;
}) {
  const testPrefix = `estimated-area-detailed-block-${block.id}`;

  return (
    <div className="tool-panel rounded-[30px] p-5" data-testid={`${testPrefix}-card`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-blue-200">
            <Layers3 className="h-3.5 w-3.5" />
            {index + 1}. {roleLabel(block.role)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">
              {block.label || "Kat blogu"}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disableRemove}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition-colors",
            disableRemove
              ? "cursor-not-allowed border-zinc-200/70 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600"
              : "border-zinc-200 bg-white text-zinc-700 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
          )}
        >
          <Trash2 className="h-4 w-4" />
          Sil
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Kat etiketi
          </p>
          <Input
            value={block.label}
            onChange={(event) => onFieldChange("label", event.target.value)}
            className="tool-input h-11"
            data-testid={`${testPrefix}-label`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Tekrar sayisi
          </p>
          <Input
            value={block.repeatCount}
            onChange={(event) => onFieldChange("repeatCount", event.target.value)}
            inputMode="numeric"
            className="tool-input h-11"
            data-testid={`${testPrefix}-repeat`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["grossIndependentAreaM2", "Brut bagimsiz bolum", "Ornek: 762.16"],
          ["netIndependentAreaM2", "Net alan", "Opsiyonel"],
          ["balconyTerraceAreaM2", "Balkon / teras", "Opsiyonel"],
          ["commonCirculationAreaM2", "Kat holu / ortak alan", "Ornek: 29.26"],
          ["elevatorShaftAreaM2", "Asansor / saft", "Ornek: 7.28"],
        ].map(([key, label, placeholder]) => (
          <div key={key} className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
              {label}
            </p>
            <Input
              value={block[key as keyof FloorProgramBlockState] as string}
              onChange={(event) =>
                onFieldChange(
                  key as
                    | "grossIndependentAreaM2"
                    | "netIndependentAreaM2"
                    | "balconyTerraceAreaM2"
                    | "commonCirculationAreaM2"
                    | "elevatorShaftAreaM2",
                  event.target.value
                )
              }
              inputMode="decimal"
              className="tool-input h-11"
              placeholder={placeholder}
              data-testid={`${testPrefix}-${key}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[24px] border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-zinc-500" />
          <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Teknik hacimler</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Siginak, su deposu, enerji odasi, depo veya teknik alanlari satir olarak ekleyin.
        </p>
        <div className="mt-4">
          <TechnicalAreaRows
            blockId={block.id}
            technicalLines={block.technicalLines}
            onAdd={onAddTechnicalLine}
            onChange={onTechnicalLineChange}
            onRemove={onRemoveTechnicalLine}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Not</p>
        <textarea
          value={block.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          className="tool-input min-h-24 w-full resize-y px-4 py-3 text-sm leading-6"
          placeholder="Bu katla ilgili ek notlar"
          data-testid={`${testPrefix}-notes`}
        />
      </div>
    </div>
  );
}
