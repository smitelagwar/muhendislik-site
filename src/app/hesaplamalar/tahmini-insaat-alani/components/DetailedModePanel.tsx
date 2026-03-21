"use client";

import type { ReactNode } from "react";
import { Info, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DetailedDraftState } from "../client-state";
import { FloorProgramBlockCard } from "./FloorProgramBlockCard";

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="tool-panel rounded-[32px] p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function DetailedModePanel({
  draft,
  suggestedFootprintM2,
  onIdentityChange,
  onBlockFieldChange,
  onAddCustomBlock,
  onRemoveBlock,
  onAddTechnicalLine,
  onTechnicalLineChange,
  onRemoveTechnicalLine,
}: {
  draft: DetailedDraftState;
  suggestedFootprintM2: number | null;
  onIdentityChange: (
    key: keyof DetailedDraftState["projectIdentity"],
    value: string
  ) => void;
  onBlockFieldChange: (
    blockId: string,
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
  onAddCustomBlock: () => void;
  onRemoveBlock: (blockId: string) => void;
  onAddTechnicalLine: (blockId: string) => void;
  onTechnicalLineChange: (
    blockId: string,
    lineId: string,
    key: "label" | "areaM2",
    value: string
  ) => void;
  onRemoveTechnicalLine: (blockId: string, lineId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionCard
        eyebrow="1. Proje kimligi"
        title="Opsiyonel proje bilgileri"
        description="Bu alanlar hesap formulune girmez; rapor, taslak ve ileride export senaryolari icin tutulur."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["il", "Il"],
            ["ilce", "Ilce"],
            ["mahalle", "Mahalle"],
            ["ada", "Ada"],
            ["parsel", "Parsel"],
            ["kullanimAmaci", "Kullanim amaci"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {label}
              </p>
              <Input
                value={draft.projectIdentity[key as keyof DetailedDraftState["projectIdentity"]]}
                onChange={(event) =>
                  onIdentityChange(
                    key as keyof DetailedDraftState["projectIdentity"],
                    event.target.value
                  )
                }
                className="tool-input h-11"
                data-testid={`estimated-area-project-${key}`}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="2. Kat programi"
        title="Kat bazli alan kurgusunu kurun"
        description="Brut bagimsiz bolum, ortak alan, asansor ve teknik hacimleri kat bloklari uzerinden girin. Daireleri tek tek listelemek zorunda degilsiniz."
      >
        <div className="rounded-[24px] border border-blue-200/70 bg-blue-50/80 p-4 dark:border-blue-950/40 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-300" />
            <p className="text-sm leading-7 text-blue-900 dark:text-blue-100">
              Hedeflenen taban oturumu yaklasik olarak{" "}
              <strong>
                {suggestedFootprintM2
                  ? suggestedFootprintM2.toLocaleString("tr-TR", {
                      maximumFractionDigits: 2,
                    })
                  : "-"}
              </strong>{" "}
              m2 civarinda. Bu deger sadece hizli mod referansidir; alanlar otomatik
              doldurulmaz.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4" data-testid="estimated-area-detailed-blocks">
          {draft.blocks.map((block, index) => (
            <FloorProgramBlockCard
              key={block.id}
              block={block}
              index={index}
              disableRemove={draft.blocks.length === 1}
              onFieldChange={(key, value) => onBlockFieldChange(block.id, key, value)}
              onAddTechnicalLine={() => onAddTechnicalLine(block.id)}
              onTechnicalLineChange={(lineId, key, value) =>
                onTechnicalLineChange(block.id, lineId, key, value)
              }
              onRemoveTechnicalLine={(lineId) => onRemoveTechnicalLine(block.id, lineId)}
              onRemove={() => onRemoveBlock(block.id)}
            />
          ))}
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onAddCustomBlock}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-black text-zinc-700 transition-colors hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:text-white"
            data-testid="estimated-area-add-custom-block"
          >
            <Plus className="h-4 w-4" />
            Ozel kat blogu ekle
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
