import type {
  CadReviewDocument,
  CadReviewItem,
  CadReviewLineDash,
  CadMeasurementContext,
} from "./schema";
import { cadReviewItemSchema, cadReviewDocumentSchema, MAX_REVIEW_ITEMS_PER_DRAWING } from "./schema";

export type CadReviewTool =
  | "select"
  | "distance"
  | "chain_distance"
  | "area"
  | "comment_pin"
  | "text"
  | "callout"
  | "shape_rect"
  | "shape_circle"
  | "shape_cloud"
  | "stroke"
  | "eraser";

export interface CadActiveMarkupStyle {
  color: string;
  strokeWidth: number;
  lineDash: CadReviewLineDash;
  fillColor?: string;
  opacity: number;
  fontSize?: number;
}

export interface CadMeasurementUnitSettings {
  unit: "m" | "cm" | "mm";
  areaUnit: "m2" | "cm2" | "mm2";
  precision: number;
  areaPrecision: number;
  color: string;
}

export const CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS: Readonly<CadMeasurementUnitSettings> = Object.freeze({
  unit: "m",
  areaUnit: "m2",
  precision: 2,
  areaPrecision: 2,
  color: "#3b82f6",
});

function isMeasurementItem(item: CadReviewItem): boolean {
  return item.type === "distance" || item.type === "chain_distance" || item.type === "area";
}

/** Deep-clone world geometry and freeze the per-measurement context. */
function copyItem(item: CadReviewItem): CadReviewItem {
  const clone = JSON.parse(JSON.stringify(item)) as CadReviewItem;
  if (isMeasurementItem(clone) && "measurementContext" in clone && clone.measurementContext) {
    Object.freeze(clone.measurementContext);
  }
  return clone;
}

expo¶»§q«^