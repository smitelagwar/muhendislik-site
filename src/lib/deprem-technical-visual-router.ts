import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_SLUGS } from "./deprem-visual-rollout";
import { renderDepremTechnicalVisualSvg as renderGeotechnicalPilot } from "./deprem-technical-visual";
import { renderTbdyTechnicalVisualSvg, TBDY_TECHNICAL_VISUAL_SLUGS } from "./deprem-technical-visual-tbdy";
import { renderTbdyTechnicalVisual2Svg, TBDY_TECHNICAL_VISUAL_2_SLUGS } from "./deprem-technical-visual-tbdy-2";
import { renderTbdyTechnicalVisual3Svg, TBDY_TECHNICAL_VISUAL_3_SLUGS } from "./deprem-technical-visual-tbdy-3";
import { renderTbdyTechnicalVisual4Svg, TBDY_TECHNICAL_VISUAL_4_SLUGS } from "./deprem-technical-visual-tbdy-4";
import { renderTbdyTechnicalVisual5Svg, TBDY_TECHNICAL_VISUAL_5_SLUGS } from "./deprem-technical-visual-tbdy-5";
import { renderTbdyTechnicalVisual6Svg, TBDY_TECHNICAL_VISUAL_6_SLUGS } from "./deprem-technical-visual-tbdy-6";

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
  if (TBDY_TECHNICAL_VISUAL_2_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisual2Svg(spec, asset);
  if (TBDY_TECHNICAL_VISUAL_3_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisual3Svg(spec, asset);
  if (TBDY_TECHNICAL_VISUAL_4_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisual4Svg(spec, asset);
  if (TBDY_TECHNICAL_VISUAL_5_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisual5Svg(spec, asset);
  if (TBDY_TECHNICAL_VISUAL_6_SLUGS.has(spec.slug)) return renderTbdyTechnicalVisual6Svg(spec, asset);
  throw new Error(`Teknik görsel router eşleşmesi yok: ${spec.slug}`);
}
