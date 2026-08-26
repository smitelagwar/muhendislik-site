export const DEPREM_TECHNICAL_VISUAL_STYLE = {
  navy: "#123B63",
  cyan: "#12A9C6",
  paper: "#F8FBFC",
  white: "#FFFFFF",
  neutral: "#DCE6EB",
} as const;

export type DepremTechnicalVisualStatus = "complete" | "pending";

export interface DepremTechnicalVisualRolloutItem {
  slug: string;
  series: string;
  status: DepremTechnicalVisualStatus;
  assets: readonly ["cover.svg", "diagram.svg"];
  designNotes: readonly string[];
}

/**
 * Source of truth for topics already migrated to the approved navy/cyan
 * technical-drawing visual system. A topic enters this list only when both
 * cover.svg and diagram.svg are genuinely different, technically reviewed
 * compositions.
 */
export const DEPREM_TECHNICAL_VISUAL_ROLLOUT: readonly DepremTechnicalVisualRolloutItem[] = [
  {
    slug: "bodrum-perdesi-statik-dinamik-zemin-basinci",
    series: "su-zemin",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Tek bodrum perdesi ve tek zemin kesiti",
      "Statik basınç ile dinamik ek etki aynı teknik sahnede ayrıştırılır",
      "Gereksiz dekorasyon ve yinelenen yapı kullanılmaz",
    ],
  },
  {
    slug: "temel-kayma-devrilme-guvenligi",
    series: "su-zemin",
    status: "complete",
    assets: ["cover.svg", "diagram.svg"],
    designNotes: [
      "Tek temel-kolon kesiti üzerinde yük ve dirençler",
      "İkinci görsel taban basıncı, bileşke ve eksantrisiteyi açıklar",
      "Aynı temel bir görsel içinde ikinci kez çizilmez",
    ],
  },
] as const;

export const DEPREM_TECHNICAL_VISUAL_SLUGS = new Set(
  DEPREM_TECHNICAL_VISUAL_ROLLOUT.filter((item) => item.status === "complete").map((item) => item.slug),
);

export const DEPREM_TECHNICAL_VISUAL_TARGET_TOPIC_COUNT = 164;
export const DEPREM_TECHNICAL_VISUAL_MIN_ASSET_COUNT = 328;
