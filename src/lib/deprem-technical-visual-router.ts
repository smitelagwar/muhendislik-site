import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_SLUGS } from "./deprem-visual-rollout";
import { renderDepremTechnicalVisualSvg as renderGeotechnicalPilot } from "./deprem-technical-visual";
import { renderTbdyTechnicalVisualSvg, TBDY_TECHNICAL_VISUAL_SLUGS } from "./deprem-technical-visual-tbdy";

export type DepremTechnicalVisualAsset = "cover" | "diagram";

const GEOTECHNICAL_PILOT_SLUGS = new Set([
  "bodrum-perdesi-statik-dinamik-zemin-basinci",
  "temel-kayma-devrilme-guvenligi",
]);

export function hasDepremTechnicalVisual(slug: string) {
  return DEPREM_TECHNICAL_VISUAL_SLUGS.has(slug);
}

export function renderDepremTechnicalVisualSvg(spec: DepremRolloutSpec, asset: DepremTechnicalVisualAsset) {
  if (GEOTECHNICAL_PILOT_SLUGS.has(spec.slug)) return renderGeotechnicalPilot(spec, asset);
  if (TBDY_TECHNICAL_VISUAL_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisualSvg(spec, asset);
  throw new Error(`Teknik görsel router eşleşmesi yok: ${spec.slug}`);
}
