"use client";

import type { CadSnapMode } from "@/lib/dokumantasyon/cad-upstream/snap-engine";

const SNAP_MODE_LABELS_TR: Readonly<Record<CadSnapMode, string>> = {
  endpoint: "Uç nokta", midpoint: "Orta nokta", intersection: "Kesişim",
  center: "Merkez", nearest: "En yakın", perpendicular: "Dik",
};

const TOOL_LABELS: Readonly<Record<string, string>> = {
  select: "Seçim", pan: "Gezinme", distance: "Mesafe", chain_distance: "Zincir mesafe",
  area: "Alan", comment_pin: "Yorum", text: "Metin", callout: "Ok ve not",
  shape_rect: "Dikdörtgen", shape_circle: "Daire", shape_cloud: "Revizyon bulutu",
  stroke: "Serbest çizim", eraser: "Silgi",
};

export function cadReviewStatusCopy(
  tool: string | null, sourceUnit: string, displayUnit: string,
  snapEnabled: boolean, snapMode?: CadSnapMode | null
): { tool: string; units: string; snap: string } {
  return {
    tool: TOOL_LABELS[tool ?? ""] ?? "Gezinme",
    units: sourceUnit === "unitless"
      ? `Kaynak birim belirsiz · gösterim ${displayUnit}`
      : `Kaynak ${sourceUnit} · gösterim ${displayUnit}`,
    snap: !snapEnabled ? "OSNAP kapalı" : snapMode
      ? `OSNAP: ${SNAP_MODE_LABELS_TR[snapMode]}` : "OSNAP açık",
  };
}

export function CadReviewStatusLine({
  tool, sourceUnit, displayUnit, snapEnabled, snapMode, compactWhenMeasuring,
}: {
  tool: string | null;
  sourceUnit: string;
  displayUnit: string;
  snapEnabled: boolean;
  snapMode?: CadSnapMode | null;
  compactWhenMeasuring?: boolean;
}) {
  const copy = cadReviewStatusCopy(tool, sourceUnit, displayUnit, snapEnabled, snapMode);
  return (
    <div
      data-testid="cad-stage09-status"
      data-cad-stage09-tool={tool ?? "pan"}
      data-cad-stage09-snap={snapEnabled ? snapMode ?? "none" : "off"}
      className={`pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] items-center gap-1.5 overflow-hidden rounded-lg border border-foreground/30 bg-background/95 px-2.5 py-1.5 text-[11px] text-foreground shadow-md backdrop-blur ${compactWhenMeasuring ? "hidden sm:flex" : "flex"}`}
      aria-label={`${copy.tool}; ${copy.units}; ${copy.snap}`}
    >
      <span className="shrink-0 font-semibold" role="status" aria-live="polite">{copy.tool}</span>
      <span aria-hidden="true" className="text-muted-foreground">·</span>
      <span className="truncate text-muted-foreground" title={copy.units}>{copy.units}</span>
      <span aria-hidden="true" className="text-muted-foreground">·</span>
      <span className="shrink-0 font-medium" data-testid="cad-stage09-snap-indicator">{copy.snap}</span>
    </div>
  );
}
