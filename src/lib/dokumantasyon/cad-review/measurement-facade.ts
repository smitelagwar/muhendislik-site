import { z } from "zod";
import type { CadReviewStore } from "./store";
import type {
  cadReviewDistanceItemSchema,
  cadReviewChainDistanceItemSchema,
  cadReviewAreaItemSchema,
} from "./schema";
import {
  formatCadDistance,
  formatCadArea,
  type CadUnit,
  type CadCalibrationState,
} from "./units";

export type CadMeasurementItem =
  | z.infer<typeof cadReviewDistanceItemSchema>
  | z.infer<typeof cadReviewChainDistanceItemSchema>
  | z.infer<typeof cadReviewAreaItemSchema>;

export interface CadMeasurementBounds {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface CadMeasurementViewModel {
  id: string;
  type: "distance" | "chain_distance" | "area";
  title: string;
  author: string;
  createdAt: string;
  formattedValue: string;
  rawPrimaryValue: number;
  isSelected: boolean;
  isVisible: boolean;
  bounds: CadMeasurementBounds;
  segmentValues?: string[];
  segmentDistances?: number[];
  segmentCount?: number;
}

function boundsFromPoints(points: readonly { x: number; y: number }[]): CadMeasurementBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }

  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

export function getMeasurementBounds(measurement: CadMeasurementItem): CadMeasurementBounds {
  if (measurement.type === "distance") {
    return boundsFromPoints([measurement.start, measurement.end]);
  }
  return boundsFromPoints(measurement.points);
}

function visibleFromMeasurement(item: CadMeasurementItem): boolean {
  return (item.style.opacity ?? 1) > 0;
}

export class CadMeasurementFacade {
  constructor(
    private readonly store: CadReviewStore,
    private readonly unit: CadUnit = "m",
    private readonly precision: number = 2,
    private readonly calibration?: CadCalibrationState | null
  ) {}

  /**
   * Distance, chain-distance ve area öğelerini aynı liste sözleşmesine dönüştürür.
   * Ham world değerleri yuvarlanmaz; yuvarlama yalnız format katmanında yapılır.
   */
  listMeasurements(): CadMeasurementViewModel[] {
    const items = this.store.getItems();
    const session = this.store.getSession();
    const result: CadMeasurementViewModel[] = [];
    let distanceIndex = 0;
    let chainIndex = 0;
    let areaIndex = 0;

    for (const item of items) {
      if (item.type === "distance") {
        distanceIndex += 1;
        result.push({
          id: item.id,
          type: "distance",
          title: item.label?.trim() || `Ölçü ${String(distanceIndex).padStart(2, "0")}`,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue: formatCadDistance(
            item.measuredLength,
            this.unit,
            this.precision,
            this.calibration
          ),
          rawPrimaryValue: item.measuredLength,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: visibleFromMeasurement(item),
          bounds: getMeasurementBounds(item),
        });
        continue;
      }

      if (item.type === "chain_distance") {
        chainIndex += 1;
        const segmentDistances = [...item.segmentDistances];
        result.push({
          id: item.id,
          type: "chain_distance",
          title: item.comment.trim() || `Sürekli Ölçü ${String(chainIndex).padStart(2, "0")}`,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue: formatCadDistance(
            item.totalDistance,
            this.unit,
            this.precision,
            this.calibration
          ),
          rawPrimaryValue: item.totalDistance,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: visibleFromMeasurement(item),
          bounds: getMeasurementBounds(item),
          segmentDistances,
          segmentValues: segmentDistances.map((value) =>
            formatCadDistance(value, this.unit, this.precision, this.calibration)
          ),
          segmentCount: segmentDistances.length,
        });
        continue;
      }

      if (item.type === "area") {
        areaIndex += 1;
        result.push({
          id: item.id,
          type: "area",
          title: item.comment.trim() || `Alan ${String(areaIndex).padStart(2, "0")}`,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue: formatCadArea(
            item.measuredArea,
            this.unit,
            this.precision,
            this.calibration
          ),
          rawPrimaryValue: item.measuredArea,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: visibleFromMeasurement(item),
          bounds: getMeasurementBounds(item),
        });
      }
    }

    return result;
  }

  renameMeasurement(id: string, newTitle: string): void {
    const title = newTitle.trim().slice(0, 128);
    if (!title) return;
    const item = this.store.getItems().find((candidate) => candidate.id === id);
    if (!item) return;

    if (item.type === "distance") {
      this.store.updateItem(id, { label: title } as never);
    } else if (item.type === "chain_distance" || item.type === "area") {
      // Base review contract already persists `comment`; Stage 4 reuses it as the
      // optional user-facing measurement name for these two measurement types.
      this.store.updateItem(id, { comment: title } as never);
    }
  }

  selectMeasurement(id: string): void {
    const exists = this.store.getItems().some((item) => item.id === id);
    this.store.setSelectedItems(exists ? [id] : []);
  }

  setMeasurementVisible(id: string, visible: boolean): void {
    const item = this.store.getItems().find((candidate) => candidate.id === id);
    if (!item || (item.type !== "distance" && item.type !== "chain_distance" && item.type !== "area")) {
      return;
    }
    // Measurement opacity is not otherwise editable in the current product.
    // Reusing persisted style.opacity keeps visibility schema-compatible and
    // survives reload without introducing a parallel visibility store.
    this.store.updateItemsStyle([id], { opacity: visible ? 1 : 0 });
  }

  toggleMeasurementVisible(id: string): void {
    const item = this.store.getItems().find((candidate) => candidate.id === id);
    if (!item || (item.type !== "distance" && item.type !== "chain_distance" && item.type !== "area")) {
      return;
    }
    this.setMeasurementVisible(id, !visibleFromMeasurement(item));
  }

  deleteMeasurement(id: string): void {
    const item = this.store.getItems().find((candidate) => candidate.id === id);
    if (!item || (item.type !== "distance" && item.type !== "chain_distance" && item.type !== "area")) {
      return;
    }
    this.store.removeItem(id);
  }
}
