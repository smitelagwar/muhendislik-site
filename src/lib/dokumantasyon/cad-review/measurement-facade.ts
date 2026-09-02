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
  bounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
}

export class CadMeasurementFacade {
  constructor(
    private readonly store: CadReviewStore,
    private readonly unit: CadUnit = "m",
    private readonly precision: number = 2,
    private readonly calibration?: CadCalibrationState | null
  ) {}

  /**
   * Returns all measurements in the current document as ViewModels.
   */
  listMeasurements(): CadMeasurementViewModel[] {
    const items = this.store.getItems();
    const session = this.store.getSession();
    const result: CadMeasurementViewModel[] = [];

    for (const item of items) {
      if (item.type === "distance") {
        const title = item.label || `Mesafe ${result.length + 1}`;
        const formattedValue = formatCadDistance(
          item.measuredLength,
          this.unit,
          this.precision,
          this.calibration
        );
        const minX = Math.min(item.start.x, item.end.x);
        const minY = Math.min(item.start.y, item.end.y);
        const maxX = Math.max(item.start.x, item.end.x);
        const maxY = Math.max(item.start.y, item.end.y);

        result.push({
          id: item.id,
          type: "distance",
          title,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue,
          rawPrimaryValue: item.measuredLength,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: true,
          bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } },
        });
      } else if (item.type === "chain_distance") {
        const title = `Zincir Mesafe ${result.length + 1} (${item.points.length} nokta)`;
        const formattedValue = formatCadDistance(
          item.totalDistance,
          this.unit,
          this.precision,
          this.calibration
        );
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const pt of item.points) {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        }

        result.push({
          id: item.id,
          type: "chain_distance",
          title,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue,
          rawPrimaryValue: item.totalDistance,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: true,
          bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } },
        });
      } else if (item.type === "area") {
        const title = `Alan ${result.length + 1}`;
        const formattedValue = formatCadArea(
          item.measuredArea,
          this.unit,
          this.precision,
          this.calibration
        );
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const pt of item.points) {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        }

        result.push({
          id: item.id,
          type: "area",
          title,
          author: item.author,
          createdAt: item.createdAt,
          formattedValue,
          rawPrimaryValue: item.measuredArea,
          isSelected: session.selectedItemIds.has(item.id),
          isVisible: true,
          bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } },
        });
      }
    }

    return result;
  }

  renameMeasurement(id: string, newTitle: string): void {
    const item = this.store.getItems().find((i) => i.id === id);
    if (!item) return;

    if (item.type === "distance") {
      this.store.updateItem(id, { label: newTitle });
    } else {
      this.store.updateItem(id, { comment: newTitle });
    }
  }

  selectMeasurement(id: string): void {
    this.store.setSelectedItems([id]);
  }

  deleteMeasurement(id: string): void {
    this.store.removeItem(id);
  }
}