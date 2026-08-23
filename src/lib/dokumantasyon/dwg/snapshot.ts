import type { CadDocument } from "@node-projects/acad-ts";
import type { DwgCadExtents, DwgStructuralSnapshot } from "./types";

const MODEL_SPACE = "*MODEL_SPACE";
const PAPER_SPACE = "*PAPER_SPACE";

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedRecord(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function normalizeName(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function finitePoint(point: { x: number; y: number; z: number }): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

function mergeExtents(current: DwgCadExtents | null, min: { x: number; y: number; z: number }, max: { x: number; y: number; z: number }): DwgCadExtents {
  if (!current) {
    return {
      min: [min.x, min.y, min.z],
      max: [max.x, max.y, max.z],
    };
  }
  return {
    min: [
      Math.min(current.min[0], min.x),
      Math.min(current.min[1], min.y),
      Math.min(current.min[2], min.z),
    ],
    max: [
      Math.max(current.max[0], max.x),
      Math.max(current.max[1], max.y),
      Math.max(current.max[2], max.z),
    ],
  };
}

export function createCadStructuralSnapshot(document: CadDocument): DwgStructuralSnapshot {
  const entityTypes = new Map<string, number>();
  const lineTypes = new Map<string, number>();
  const lineWeights = new Map<string, number>();
  const indexedColors = new Map<string, number>();
  const trueColors = new Map<string, number>();
  const layerNames: string[] = [];
  const blockNames: string[] = [];

  let entityCount = 0;
  let modelSpaceEntityCount = 0;
  let paperSpaceEntityCount = 0;
  let blockEntityCount = 0;
  let blockDefinitionCount = 0;
  let byLayerColorCount = 0;
  let byBlockColorCount = 0;
  let xDataEntityCount = 0;
  let proxyGeometryEntityCount = 0;
  let xrefBlockCount = 0;
  let boundingBoxUnavailableCount = 0;
  let extents: DwgCadExtents | null = null;

  for (const layer of document.layers ?? []) {
    layerNames.push(normalizeName(layer.name, "<unnamed-layer>"));
  }
  layerNames.sort((a, b) => a.localeCompare(b));

  for (const block of document.blockRecords ?? []) {
    const blockName = normalizeName(block.name, "<unnamed-block>");
    const normalizedBlockName = blockName.toUpperCase();
    const isModelSpace = normalizedBlockName === MODEL_SPACE;
    const isPaperSpace = normalizedBlockName === PAPER_SPACE;
    const isNamedDefinition = !isModelSpace && !isPaperSpace;

    if (isNamedDefinition) {
      blockDefinitionCount += 1;
      blockNames.push(blockName);
      if (typeof block.blockEntity?.xRefPath === "string" && block.blockEntity.xRefPath.trim()) {
        xrefBlockCount += 1;
      }
    }

    for (const entity of block.entities ?? []) {
      entityCount += 1;
      if (isModelSpace) modelSpaceEntityCount += 1;
      else if (isPaperSpace) paperSpaceEntityCount += 1;
      else blockEntityCount += 1;

      const entityType = normalizeName(entity.objectName, entity.constructor?.name ?? "UNKNOWN").toUpperCase();
      increment(entityTypes, entityType);

      const lineTypeName = normalizeName(entity.lineType?.name, "<none>").toUpperCase();
      increment(lineTypes, lineTypeName);
      increment(lineWeights, String(entity.lineWeight));

      const color = entity.color;
      if (color?.isByLayer) {
        byLayerColorCount += 1;
      } else if (color?.isByBlock) {
        byBlockColorCount += 1;
      } else if (color?.isTrueColor) {
        increment(trueColors, String(color.trueColor));
      } else {
        increment(indexedColors, String(color?.index ?? -1));
      }

      if ((entity.extendedData?.size ?? 0) > 0) xDataEntityCount += 1;
      const proxyGeometries = (entity as typeof entity & { proxyGeometries?: unknown[] }).proxyGeometries;
      if ((proxyGeometries?.length ?? 0) > 0) proxyGeometryEntityCount += 1;

      if (isModelSpace) {
        try {
          const bounds = entity.getBoundingBox();
          if (!bounds || !finitePoint(bounds.min) || !finitePoint(bounds.max)) {
            boundingBoxUnavailableCount += 1;
          } else {
            extents = mergeExtents(extents, bounds.min, bounds.max);
          }
        } catch {
          boundingBoxUnavailableCount += 1;
        }
      }
    }
  }

  blockNames.sort((a, b) => a.localeCompare(b));

  return {
    entityCount,
    modelSpaceEntityCount,
    paperSpaceEntityCount,
    blockEntityCount,
    blockDefinitionCount,
    layerCount: layerNames.length,
    entityTypes: sortedRecord(entityTypes),
    layerNames,
    blockNames,
    lineTypes: sortedRecord(lineTypes),
    lineWeights: sortedRecord(lineWeights),
    colors: {
      byLayer: byLayerColorCount,
      byBlock: byBlockColorCount,
      indexed: sortedRecord(indexedColors),
      trueColor: sortedRecord(trueColors),
    },
    xDataEntityCount,
    proxyGeometryEntityCount,
    xrefBlockCount,
    boundingBoxUnavailableCount,
    extents,
  };
}