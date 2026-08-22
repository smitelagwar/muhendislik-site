import type { DxfStage4Audit } from "./dxf-stage4-fidelity";

export type DxfLayerBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type DxfLayerRuntimeItem = {
  name: string;
  displayName: string;
  color: number;
  sourceOff: boolean;
  sourceFrozen: boolean;
  visible: boolean;
  objectCount: number;
  bounds: DxfLayerBounds | null;
};

export type DxfLayerRuntimeSnapshot = {
  layers: DxfLayerRuntimeItem[];
  visibleLayerNames: string[];
  hiddenLayerNames: string[];
  visibleBounds: DxfLayerBounds | null;
  allHidden: boolean;
};

type DxfLayerInfo = { name: string; displayName: string; color: number };
type NumericAttribute = {
  count: number;
  getX: (index: number) => number;
  getY: (index: number) => number;
  getZ?: (index: number) => number;
};
type GeometryLike = {
  attributes?: Record<string, NumericAttribute | undefined>;
};
type SceneObjectLike = {
  visible?: boolean;
  geometry?: GeometryLike;
};
type InternalLayerLike = {
  objects?: SceneObjectLike[] | null;
};

export type DxfLayerRuntimeViewer = {
  GetLayers: (nonEmptyOnly?: boolean) => Iterable<DxfLayerInfo>;
  ShowLayer: (name: string, show: boolean) => void;
  FitView: (minX: number, maxX: number, minY: number, maxY: number, padding?: number) => void;
  layers?: Map<string, InternalLayerLike>;
};

export interface DxfInteractiveLayerNormalizationResult {
  text: string;
  unfrozenLayerCount: number;
}

type Pair = { code: number; value: string };

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1] });
  }
  return pairs;
}

/**
 * The upstream renderer excludes frozen layers while building the scene. For interactive layer
 * control we must retain those objects in the temporary render copy, then apply source visibility
 * with ShowLayer after Load(). The uploaded/downloadable DXF is never modified.
 */
export function normalizeDxfLayersForInteractiveControl(text: string): DxfInteractiveLayerNormalizationResult {
  const pairs = parsePairs(text);
  const output: Pair[] = [];
  let section: string | null = null;
  let index = 0;
  let unfrozenLayerCount = 0;

  while (index < pairs.length) {
    if (pairs[index].code !== 0) {
      output.push(pairs[index]);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < pairs.length && pairs[end].code !== 0) end += 1;
    const record = pairs.slice(index, end).map((pair) => ({ ...pair }));
    const type = record[0].value.trim().toUpperCase();

    if (type === "SECTION") {
      section = record.find((pair) => pair.code === 2)?.value.trim().toUpperCase() ?? null;
    } else if (section === "TABLES" && type === "LAYER") {
      const flagsPair = record.find((pair) => pair.code === 70);
      if (flagsPair) {
        const flags = Number.parseInt(flagsPair.value.trim(), 10) || 0;
        const interactiveFlags = flags & ~3;
        if (interactiveFlags !== flags) {
          flagsPair.value = String(interactiveFlags);
          unfrozenLayerCount += 1;
        }
      }
    }

    output.push(...record);
    if (type === "ENDSEC") section = null;
    index = end;
  }

  return {
    text: output.map((pair) => `${pair.code}\n${pair.value}`).join("\n") + "\n",
    unfrozenLayerCount,
  };
}

function includePoint(bounds: DxfLayerBounds | null, x: number, y: number): DxfLayerBounds | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return bounds;
  if (!bounds) return { minX: x, maxX: x, minY: y, maxY: y };
  bounds.minX = Math.min(bounds.minX, x);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxY = Math.max(bounds.maxY, y);
  return bounds;
}

function mergeBounds(target: DxfLayerBounds | null, source: DxfLayerBounds | null): DxfLayerBounds | null {
  if (!source) return target;
  if (!target) return { ...source };
  target.minX = Math.min(target.minX, source.minX);
  target.maxX = Math.max(target.maxX, source.maxX);
  target.minY = Math.min(target.minY, source.minY);
  target.maxY = Math.max(target.maxY, source.maxY);
  return target;
}

function baseBounds(position: NumericAttribute | undefined): DxfLayerBounds | null {
  if (!position || !Number.isFinite(position.count) || position.count <= 0) return null;
  let bounds: DxfLayerBounds | null = null;
  for (let index = 0; index < position.count; index += 1) {
    bounds = includePoint(bounds, position.getX(index), position.getY(index));
  }
  return bounds;
}

function transformBounds(base: DxfLayerBounds, t0: NumericAttribute, t1: NumericAttribute): DxfLayerBounds | null {
  const count = Math.min(t0.count, t1.count);
  if (count <= 0) return null;
  const corners = [
    [base.minX, base.minY],
    [base.minX, base.maxY],
    [base.maxX, base.minY],
    [base.maxX, base.maxY],
  ] as const;
  let bounds: DxfLayerBounds | null = null;
  for (let index = 0; index < count; index += 1) {
    const a = t0.getX(index);
    const b = t0.getY(index);
    const tx = t0.getZ?.(index) ?? 0;
    const c = t1.getX(index);
    const d = t1.getY(index);
    const ty = t1.getZ?.(index) ?? 0;
    for (const [x, y] of corners) {
      bounds = includePoint(bounds, a * x + b * y + tx, c * x + d * y + ty);
    }
  }
  return bounds;
}

function translateBounds(base: DxfLayerBounds, transform: NumericAttribute): DxfLayerBounds | null {
  if (transform.count <= 0) return null;
  let bounds: DxfLayerBounds | null = null;
  for (let index = 0; index < transform.count; index += 1) {
    const tx = transform.getX(index);
    const ty = transform.getY(index);
    bounds = includePoint(bounds, base.minX + tx, base.minY + ty);
    bounds = includePoint(bounds, base.maxX + tx, base.maxY + ty);
  }
  return bounds;
}

function objectBounds(object: SceneObjectLike): DxfLayerBounds | null {
  const attributes = object.geometry?.attributes;
  const position = attributes?.position;
  const base = baseBounds(position);
  if (!base) return null;

  const transform0 = attributes?.instanceTransform0;
  const transform1 = attributes?.instanceTransform1;
  if (transform0 && transform1) return transformBounds(base, transform0, transform1);

  const pointTransform = attributes?.instanceTransform;
  if (pointTransform) return translateBounds(base, pointTransform);

  return base;
}

function layerBounds(layer: InternalLayerLike | undefined): DxfLayerBounds | null {
  let bounds: DxfLayerBounds | null = null;
  for (const object of layer?.objects ?? []) {
    bounds = mergeBounds(bounds, objectBounds(object));
  }
  return bounds;
}

function sourceState(audit: DxfStage4Audit, name: string): { sourceOff: boolean; sourceFrozen: boolean } {
  return {
    sourceOff: audit.offLayers.includes(name),
    sourceFrozen: audit.frozenLayers.includes(name),
  };
}

export function initializeDxfLayerRuntime(
  viewer: DxfLayerRuntimeViewer,
  audit: DxfStage4Audit
): DxfLayerRuntimeItem[] {
  const internalLayers = viewer.layers;
  const items = [...viewer.GetLayers(false)].map((layer) => {
    const source = sourceState(audit, layer.name);
    const visible = !source.sourceOff && !source.sourceFrozen;
    const internalLayer = internalLayers?.get(layer.name);
    return {
      name: layer.name,
      displayName: layer.displayName || layer.name,
      color: layer.color,
      sourceOff: source.sourceOff,
      sourceFrozen: source.sourceFrozen,
      visible,
      objectCount: internalLayer?.objects?.length ?? 0,
      bounds: layerBounds(internalLayer),
    } satisfies DxfLayerRuntimeItem;
  });

  for (const item of items) {
    if (!item.visible) viewer.ShowLayer(item.name, false);
  }
  return items.sort((a, b) => a.displayName.localeCompare(b.displayName, "tr"));
}

export function visibleDxfLayerBounds(layers: DxfLayerRuntimeItem[]): DxfLayerBounds | null {
  let bounds: DxfLayerBounds | null = null;
  for (const layer of layers) {
    if (!layer.visible) continue;
    bounds = mergeBounds(bounds, layer.bounds);
  }
  return bounds;
}

export function fitVisibleDxfLayers(
  viewer: DxfLayerRuntimeViewer,
  layers: DxfLayerRuntimeItem[],
  padding = 0.1
): DxfLayerBounds | null {
  const bounds = visibleDxfLayerBounds(layers);
  if (!bounds) return null;
  viewer.FitView(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, padding);
  return bounds;
}

export function setDxfLayerVisible(
  viewer: DxfLayerRuntimeViewer,
  layers: DxfLayerRuntimeItem[],
  name: string,
  visible: boolean
): DxfLayerRuntimeItem[] {
  viewer.ShowLayer(name, visible);
  return layers.map((layer) => (layer.name === name ? { ...layer, visible } : layer));
}

export function setAllDxfLayersVisible(
  viewer: DxfLayerRuntimeViewer,
  layers: DxfLayerRuntimeItem[],
  visible: boolean
): DxfLayerRuntimeItem[] {
  for (const layer of layers) viewer.ShowLayer(layer.name, visible);
  return layers.map((layer) => ({ ...layer, visible }));
}

export function resetDxfLayersToSource(
  viewer: DxfLayerRuntimeViewer,
  layers: DxfLayerRuntimeItem[]
): DxfLayerRuntimeItem[] {
  return layers.map((layer) => {
    const visible = !layer.sourceOff && !layer.sourceFrozen;
    viewer.ShowLayer(layer.name, visible);
    return { ...layer, visible };
  });
}

export function buildDxfLayerRuntimeSnapshot(layers: DxfLayerRuntimeItem[]): DxfLayerRuntimeSnapshot {
  const visibleLayerNames = layers.filter((layer) => layer.visible).map((layer) => layer.name);
  const hiddenLayerNames = layers.filter((layer) => !layer.visible).map((layer) => layer.name);
  return {
    layers,
    visibleLayerNames,
    hiddenLayerNames,
    visibleBounds: visibleDxfLayerBounds(layers),
    allHidden: layers.length > 0 && visibleLayerNames.length === 0,
  };
}
