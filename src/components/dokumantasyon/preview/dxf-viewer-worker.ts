// dxf-viewer does not publish types for its worker internals, but the package ships the source and
// has no package "exports" barrier. We intentionally use the same worker/scene implementation that
// upstream uses; only the temporary parsed DXF is normalized before scene preparation.
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfWorker } from "dxf-viewer/src/DxfWorker.js";
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfScene } from "dxf-viewer/src/DxfScene.js";
// @ts-expect-error dxf-viewer internal module has no declaration file
import { BatchingKey } from "dxf-viewer/src/BatchingKey.js";
// @ts-expect-error dxf-viewer internal module has no declaration file
import DxfParser from "dxf-viewer/src/parser/DxfParser.js";
import { normalizeParsedDxfDimensionColors } from "../../../lib/dokumantasyon/dxf-dimension-color-normalization";
import {
  DXF_LINETYPE_BY_BLOCK,
  DXF_LINETYPE_BY_LAYER,
  DXF_LINETYPE_CONTINUOUS,
  DXF_LINETYPE_MAX_RENDER_PRIMITIVES,
  auditDxfLinetypeSource,
  collectDxfSimpleLinetypes,
  enrichParsedDxfLinetypes,
  expandDxfSimpleLinetypePath,
  normalizeDxfLinetypeName,
  resolveDxfLayerLinetype,
  resolveDxfLinetypeScale,
  type DxfLinetypeParsedDxf,
  type DxfLinetypePoint,
  type DxfSimpleLinetypeDefinition,
} from "../../../lib/dokumantasyon/dxf-linetype-rendering";
import {
  auditDxfLineweightSource,
  DXF_LINEWEIGHT_BY_BLOCK,
  DXF_LINEWEIGHT_BY_LAYER,
  enrichParsedDxfLineweights,
  normalizeDxfLineweight,
  type DxfLineweightParsedDxf,
  type DxfLineweightSourceAudit,
} from "../../../lib/dokumantasyon/dxf-lineweight-source";
import {
  auditDxfPolylineWidthSource,
  enrichParsedDxfPolylineWidths,
  normalizeParsedDxfWidePolylines,
  type DxfPolylineWidthParsedDxf,
  type DxfPolylineWidthRenderAudit,
} from "../../../lib/dokumantasyon/dxf-polyline-width-rendering";
import {
  dxfTextStage2ReportKey,
  normalizeParsedDxfTextStage2,
  originalDxfTextType,
  type DxfTextStage2Entity,
  type DxfTextStage2ParsedDxf,
  type DxfTextStage2Report,
} from "../../../lib/dokumantasyon/dxf-text-stage2";
import {
  auditParsedDxfTextStage3Layout,
  dxfTextStage3LayoutReportKey,
  type DxfTextStage3LayoutParsedDxf,
  type DxfTextStage3LayoutReport,
} from "../../../lib/dokumantasyon/dxf-text-stage3-layout";

type DxfLineEntity = DxfTextStage2Entity & {
  color?: number;
  layer?: string | null;
  lineType?: string | number | null;
  lineTypeScale?: number | null;
  lineweight?: number;
  shape?: boolean;
  vertices?: DxfLinetypePoint[];
};
type ParsedBlock = { entities?: DxfTextStage2Entity[] };
type WorkerParsedDxf = DxfTextStage2ParsedDxf & DxfLineweightParsedDxf & DxfLinetypeParsedDxf & DxfPolylineWidthParsedDxf;
type CompactParsedDxf = {
  entities?: DxfTextStage2Entity[];
  blocks?: Record<string, ParsedBlock>;
  __dxfTextStage2?: DxfTextStage2Report;
  __dxfTextStage3Layout?: DxfTextStage3LayoutReport;
};
type WorkerLoadResult = { scene: unknown; dxf?: WorkerParsedDxf };
type WorkerOptions = { retainParsedDxf?: boolean } & Record<string, unknown>;

type InternalDxfWorker = {
  _Load: (
    url: string,
    fonts: string[] | null,
    options: WorkerOptions,
    progressCbk: ((phase: string, processedSize: number, totalSize: number | null) => void) | null
  ) => Promise<WorkerLoadResult>;
};

type InternalBatchKey = {
  geometryType?: number | null;
  layerName?: string | null;
  blockName?: string | null;
  lineweight?: number;
  __dxfLineweightKey?: boolean;
  Compare: (other: InternalBatchKey) => number;
};
type InternalBatch = { key: InternalBatchKey };
type ActiveLinetypePattern = {
  definition: DxfSimpleLinetypeDefinition;
  scale: number;
};
type InternalDxfScene = {
  __dxfLineweightContext?: number;
  __dxfLineweightDefault?: number;
  __dxfLineweightLayers?: Record<string, number>;
  __dxfLinetypeDefinitions?: Record<string, DxfSimpleLinetypeDefinition>;
  __dxfLinetypeLayers?: Record<string, string>;
  __dxfLinetypeGlobalScale?: number;
  __dxfLinetypePatternIds?: Map<string, number>;
  __dxfLinetypePatterns?: Map<number, ActiveLinetypePattern>;
  __dxfLinetypeNextId?: number;
  __dxfLinetypePrimitiveCount?: number;
  __dxfLinetypePatternedEntityCount?: number;
  __dxfLinetypeWarnings?: string[];
  scene?: {
    layers?: Array<{ name: string; lineweight?: number }>;
    lineweightDefault?: number;
    lineweightLayers?: Record<string, number>;
    lineweightSourceAudit?: DxfLineweightSourceAudit;
    linetypeRenderAudit?: {
      definitions: string[];
      patternedEntityCount: number;
      generatedPrimitiveCount: number;
      warnings: string[];
    };
    polylineWidthRenderAudit?: DxfPolylineWidthRenderAudit;
  };
};
type InternalDxfScenePrototype = {
  Build: (
    this: InternalDxfScene,
    dxf: WorkerParsedDxf,
    fontFetchers: unknown[]
  ) => Promise<void>;
  _ProcessDxfEntity: (
    this: InternalDxfScene,
    entity: DxfLineEntity,
    blockCtx?: unknown
  ) => unknown;
  _GetBatch: (this: InternalDxfScene, key: InternalBatchKey) => unknown;
  _FlattenBatch: (
    this: InternalDxfScene,
    blockBatch: InternalBatch,
    layerName: string | null,
    blockColor: number,
    blockLineType: number,
    transform: unknown
  ) => unknown;
  _GetLineType: (
    this: InternalDxfScene,
    entity: DxfLineEntity,
    vertex?: DxfLineEntity | DxfLinetypePoint | null,
    blockCtx?: unknown
  ) => number;
  _ProcessLineSegments: (
    this: InternalDxfScene,
    entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
    blockCtx?: unknown
  ) => unknown;
  _ProcessPolyline: (
    this: InternalDxfScene,
    entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
    blockCtx?: unknown
  ) => unknown;
  _ProcessPoints: (
    this: InternalDxfScene,
    entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
    blockCtx?: unknown
  ) => unknown;
};
type InternalDxfParserPrototype = {
  parseSync: (source: string) => WorkerParsedDxf;
};

type WorkerFetchScope = {
  fetch: typeof fetch;
  location: Location;
};

const TEXT_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
const STAGE2_REPORT_KEY = dxfTextStage2ReportKey();
const STAGE3_LAYOUT_REPORT_KEY = dxfTextStage3LayoutReportKey();
const LINES = 1;
const INDEXED_LINES = 2;
const BLOCK_INSTANCE = 5;
const POINT_INSTANCE = 6;

function textType(entity: DxfTextStage2Entity): string | null {
  const type = originalDxfTextType(entity);
  return TEXT_TYPES.has(type) ? type : null;
}

function compactParsedTextEvidence(dxf: WorkerParsedDxf | undefined): CompactParsedDxf | undefined {
  if (!dxf) return undefined;

  const entities = (dxf.entities ?? [])
    .map((entity) => textType(entity))
    .filter((type): type is string => Boolean(type))
    .map((type) => ({ type }));

  const blocks: Record<string, ParsedBlock> = {};
  for (const [name, block] of Object.entries(dxf.blocks ?? {})) {
    const textEntities = (block?.entities ?? [])
      .map((entity) => textType(entity))
      .filter((type): type is string => Boolean(type))
      .map((type) => ({ type }));
    if (textEntities.length > 0) blocks[name] = { entities: textEntities };
  }

  const stage2Report = dxf[STAGE2_REPORT_KEY] as DxfTextStage2Report | undefined;
  const stage3Report = (dxf as DxfTextStage3LayoutParsedDxf)[STAGE3_LAYOUT_REPORT_KEY] as
    | DxfTextStage3LayoutReport
    | undefined;
  return {
    entities,
    blocks,
    ...(stage2Report ? { __dxfTextStage2: stage2Report } : {}),
    ...(stage3Report ? { __dxfTextStage3Layout: stage3Report } : {}),
  };
}

function addLinetypeWarning(scene: InternalDxfScene, warning: string): void {
  scene.__dxfLinetypeWarnings ??= [];
  if (!scene.__dxfLinetypeWarnings.includes(warning)) scene.__dxfLinetypeWarnings.push(warning);
}

function registerLinetypePattern(
  scene: InternalDxfScene,
  definition: DxfSimpleLinetypeDefinition,
  scale: number
): number {
  scene.__dxfLinetypePatternIds ??= new Map();
  scene.__dxfLinetypePatterns ??= new Map();
  scene.__dxfLinetypeNextId ??= 1;
  const key = `${definition.name}|${scale.toPrecision(12)}`;
  const existing = scene.__dxfLinetypePatternIds.get(key);
  if (existing !== undefined) return existing;
  const id = scene.__dxfLinetypeNextId++;
  scene.__dxfLinetypePatternIds.set(key, id);
  scene.__dxfLinetypePatterns.set(id, { definition, scale });
  return id;
}

function activeLinetypePattern(scene: InternalDxfScene, lineType: unknown): ActiveLinetypePattern | null {
  const id = typeof lineType === "number" && Number.isFinite(lineType) ? Math.trunc(lineType) : 0;
  if (id <= 0) return null;
  return scene.__dxfLinetypePatterns?.get(id) ?? null;
}

function renderExpandedPattern(
  scene: InternalDxfScene,
  entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
  vertices: readonly DxfLinetypePoint[],
  closed: boolean,
  blockCtx: unknown,
  processLineSegments: InternalDxfScenePrototype["_ProcessLineSegments"],
  processPoints: InternalDxfScenePrototype["_ProcessPoints"]
): boolean {
  const activePattern = activeLinetypePattern(scene, entity.lineType);
  if (!activePattern) return false;

  const used = scene.__dxfLinetypePrimitiveCount ?? 0;
  const remainingBudget = DXF_LINETYPE_MAX_RENDER_PRIMITIVES - used;
  const expanded = expandDxfSimpleLinetypePath({
    vertices,
    closed,
    pattern: activePattern.definition.pattern,
    scale: activePattern.scale,
    maxPrimitives: remainingBudget,
  });

  scene.__dxfLinetypePrimitiveCount = used + expanded.primitiveCount;
  scene.__dxfLinetypePatternedEntityCount = (scene.__dxfLinetypePatternedEntityCount ?? 0) + 1;

  if (expanded.lineVertices.length > 0) {
    processLineSegments.call(scene, { ...entity, lineType: 0, shape: false, vertices: expanded.lineVertices }, blockCtx);
  }
  if (expanded.dotVertices.length > 0) {
    processPoints.call(scene, { ...entity, lineType: null, shape: false, vertices: expanded.dotVertices }, blockCtx);
  }
  return true;
}

// Upstream parses entity group 370 but drops group 370 in the LAYER table. It also parses the LTYPE
// table and entity group 6/48, but drops LAYER group 6 and legacy POLYLINE/VERTEX group 40/41 widths.
// Enrich only the worker-owned representation from exact source text. Uploaded/downloadable bytes
// remain unchanged.
const parserPrototype = (DxfParser as unknown as { prototype: InternalDxfParserPrototype }).prototype;
const upstreamParseSync = parserPrototype.parseSync;
parserPrototype.parseSync = function (source: string) {
  const dxf = upstreamParseSync.call(this, source);
  enrichParsedDxfLineweights(dxf, auditDxfLineweightSource(source));
  enrichParsedDxfLinetypes(dxf, auditDxfLinetypeSource(source));
  enrichParsedDxfPolylineWidths(dxf, auditDxfPolylineWidthSource(source));
  return dxf as WorkerParsedDxf;
};

// Upstream batch identity does not include lineweight. Keep otherwise identical/coincident entities
// with different 370 semantics in distinct render batches. Prefix/range lookups remain compatible
// because lineweight participates only when both keys were created through our render seam.
const batchingKeyPrototype = (BatchingKey as unknown as { prototype: InternalBatchKey }).prototype;
const upstreamBatchCompare = batchingKeyPrototype.Compare;
batchingKeyPrototype.Compare = function (other: InternalBatchKey) {
  const upstream = upstreamBatchCompare.call(this, other);
  if (upstream !== 0) return upstream;
  if (!this.__dxfLineweightKey || !other.__dxfLineweightKey) return 0;
  const left = normalizeDxfLineweight(this.lineweight, DXF_LINEWEIGHT_BY_LAYER);
  const right = normalizeDxfLineweight(other.lineweight, DXF_LINEWEIGHT_BY_LAYER);
  return left < right ? -1 : left > right ? 1 : 0;
};

const scenePrototype = (DxfScene as unknown as { prototype: InternalDxfScenePrototype }).prototype;
const upstreamProcessDxfEntity = scenePrototype._ProcessDxfEntity;
const upstreamGetBatch = scenePrototype._GetBatch;
const upstreamFlattenBatch = scenePrototype._FlattenBatch;
const upstreamProcessLineSegments = scenePrototype._ProcessLineSegments;
const upstreamProcessPolyline = scenePrototype._ProcessPolyline;
const upstreamProcessPoints = scenePrototype._ProcessPoints;

// Keep raw inheritance semantics (-1 BYBLOCK, -2 BYLAYER, -3 DEFAULT, or explicit 1/100 mm) while
// DxfScene decomposes a parsed entity into render entities.
scenePrototype._ProcessDxfEntity = function (
  this: InternalDxfScene,
  entity: DxfLineEntity,
  blockCtx?: unknown
) {
  const previous = this.__dxfLineweightContext;
  this.__dxfLineweightContext = normalizeDxfLineweight(entity.lineweight, DXF_LINEWEIGHT_BY_LAYER);
  try {
    return upstreamProcessDxfEntity.call(this, entity, blockCtx);
  } finally {
    this.__dxfLineweightContext = previous;
  }
};

scenePrototype._GetBatch = function (this: InternalDxfScene, key: InternalBatchKey) {
  const geometryType = key.geometryType;
  const carriesLineweight = geometryType === LINES ||
    geometryType === INDEXED_LINES ||
    geometryType === BLOCK_INSTANCE ||
    geometryType === POINT_INSTANCE;
  if (carriesLineweight) {
    key.__dxfLineweightKey = true;
    key.lineweight = normalizeDxfLineweight(this.__dxfLineweightContext, DXF_LINEWEIGHT_BY_LAYER);
  }
  return upstreamGetBatch.call(this, key);
};

// dxf-viewer currently hardcodes `_GetLineType()` to 0 even though its parser already understands
// entity group 6/48 and the LTYPE table. Resolve the common simple-linetype path here. BYBLOCK and
// layer-0 inheritance inside block definitions stay solid rather than fabricating an incorrect
// pattern; they are recorded as warnings for later fidelity work.
scenePrototype._GetLineType = function (
  this: InternalDxfScene,
  entity: DxfLineEntity,
  vertex?: DxfLineEntity | DxfLinetypePoint | null,
  blockCtx?: unknown
): number {
  const vertexLineType = (vertex as DxfLineEntity | null | undefined)?.lineType;
  const requested = normalizeDxfLinetypeName(vertexLineType ?? entity.lineType ?? DXF_LINETYPE_BY_LAYER) || DXF_LINETYPE_BY_LAYER;
  let resolved = requested;

  if (requested === DXF_LINETYPE_BY_LAYER) {
    const layerName = typeof entity.layer === "string" && entity.layer ? entity.layer : blockCtx ? null : "0";
    if (blockCtx && (!layerName || layerName === "0")) {
      addLinetypeWarning(this, "BYLAYER linetype on block layer 0 requires INSERT-layer inheritance; rendered solid.");
      return 0;
    }
    resolved = resolveDxfLayerLinetype(layerName, this.__dxfLinetypeLayers ?? {});
  }

  if (resolved === DXF_LINETYPE_BY_BLOCK) {
    if (blockCtx) addLinetypeWarning(this, "BYBLOCK linetype inheritance is not resolved in CAD Stage 2; rendered solid.");
    return 0;
  }
  if (!resolved || resolved === DXF_LINETYPE_CONTINUOUS || resolved === DXF_LINETYPE_BY_LAYER) return 0;

  const definition = this.__dxfLinetypeDefinitions?.[resolved];
  if (!definition) {
    addLinetypeWarning(this, `Linetype ${resolved} has no simple LTYPE pattern; rendered solid.`);
    return 0;
  }

  const scale = resolveDxfLinetypeScale(this.__dxfLinetypeGlobalScale ?? 1, entity.lineTypeScale ?? 1);
  return registerLinetypePattern(this, definition, scale);
};

// Convert patterned lines to ordinary visible line/point primitives before upstream batching. The
// main-thread dxf-viewer currently ignores BatchingKey.lineType, so geometry expansion is the only
// deterministic path that preserves the existing viewer, layer controls, color modes and lineweight
// batching without a parallel renderer.
scenePrototype._ProcessLineSegments = function (
  this: InternalDxfScene,
  entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
  blockCtx?: unknown
) {
  const pattern = activeLinetypePattern(this, entity.lineType);
  if (!pattern) return upstreamProcessLineSegments.call(this, entity, blockCtx);
  if (entity.vertices.length % 2 !== 0) return upstreamProcessLineSegments.call(this, entity, blockCtx);

  const expandedLines: DxfLinetypePoint[] = [];
  const expandedDots: DxfLinetypePoint[] = [];
  let primitiveCount = 0;
  for (let index = 0; index < entity.vertices.length; index += 2) {
    const used = (this.__dxfLinetypePrimitiveCount ?? 0) + primitiveCount;
    const expanded = expandDxfSimpleLinetypePath({
      vertices: [entity.vertices[index], entity.vertices[index + 1]],
      pattern: pattern.definition.pattern,
      scale: pattern.scale,
      maxPrimitives: DXF_LINETYPE_MAX_RENDER_PRIMITIVES - used,
    });
    expandedLines.push(...expanded.lineVertices);
    expandedDots.push(...expanded.dotVertices);
    primitiveCount += expanded.primitiveCount;
  }
  this.__dxfLinetypePrimitiveCount = (this.__dxfLinetypePrimitiveCount ?? 0) + primitiveCount;
  this.__dxfLinetypePatternedEntityCount = (this.__dxfLinetypePatternedEntityCount ?? 0) + 1;
  if (expandedLines.length > 0) {
    upstreamProcessLineSegments.call(this, { ...entity, lineType: 0, vertices: expandedLines }, blockCtx);
  }
  if (expandedDots.length > 0) {
    upstreamProcessPoints.call(this, { ...entity, lineType: null, vertices: expandedDots }, blockCtx);
  }
};

scenePrototype._ProcessPolyline = function (
  this: InternalDxfScene,
  entity: DxfLineEntity & { vertices: DxfLinetypePoint[] },
  blockCtx?: unknown
) {
  if (renderExpandedPattern(
    this,
    entity,
    entity.vertices,
    Boolean(entity.shape),
    blockCtx,
    upstreamProcessLineSegments,
    upstreamProcessPoints
  )) return;
  return upstreamProcessPolyline.call(this, entity, blockCtx);
};

// Block flattening replaces the child batch key upstream. Preserve child lineweight semantics and
// substitute only BYBLOCK with the current INSERT lineweight. Patterned geometry is already split
// into ordinary line primitives before it reaches a block batch, so no lineType material support is
// needed during flattening.
scenePrototype._FlattenBatch = function (
  this: InternalDxfScene,
  blockBatch: InternalBatch,
  layerName: string | null,
  blockColor: number,
  blockLineType: number,
  transform: unknown
) {
  const previous = this.__dxfLineweightContext;
  const childLineweight = normalizeDxfLineweight(blockBatch.key.lineweight, DXF_LINEWEIGHT_BY_LAYER);
  const insertLineweight = normalizeDxfLineweight(previous, DXF_LINEWEIGHT_BY_LAYER);
  this.__dxfLineweightContext = childLineweight === DXF_LINEWEIGHT_BY_BLOCK
    ? insertLineweight
    : childLineweight;
  try {
    return upstreamFlattenBatch.call(this, blockBatch, layerName, blockColor, blockLineType, transform);
  } finally {
    this.__dxfLineweightContext = previous;
  }
};

// Keep all existing text/dimension fidelity gates, then normalize physical wide-polylines into
// triangle SOLIDs before upstream scene preparation. The generated fill triangles intentionally do
// not carry lineweight: physical model-space width and print/display lineweight remain independent.
const upstreamBuild = scenePrototype.Build;
scenePrototype.Build = async function (
  this: InternalDxfScene,
  dxf: WorkerParsedDxf,
  fontFetchers: unknown[]
) {
  const lineweightAudit = dxf.__dxfLineweightSourceAudit ?? auditDxfLineweightSource("");
  this.__dxfLineweightDefault = lineweightAudit.defaultLineweight;
  this.__dxfLineweightLayers = lineweightAudit.layers;

  const linetypeAudit = dxf.__dxfLinetypeSourceAudit ?? auditDxfLinetypeSource("");
  this.__dxfLinetypeDefinitions = collectDxfSimpleLinetypes(dxf);
  this.__dxfLinetypeLayers = { ...linetypeAudit.layers };
  this.__dxfLinetypeGlobalScale = linetypeAudit.globalScale;
  this.__dxfLinetypePatternIds = new Map();
  this.__dxfLinetypePatterns = new Map();
  this.__dxfLinetypeNextId = 1;
  this.__dxfLinetypePrimitiveCount = 0;
  this.__dxfLinetypePatternedEntityCount = 0;
  this.__dxfLinetypeWarnings = [];

  const stage2Report = normalizeParsedDxfTextStage2(dxf);
  if (stage2Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 2 fidelity engeli: ${stage2Report.blockingIssues.join(" ")}`);
  }

  const stage3Report = auditParsedDxfTextStage3Layout(dxf as DxfTextStage3LayoutParsedDxf);
  if (stage3Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 3 fidelity engeli: ${stage3Report.blockingIssues.join(" ")}`);
  }

  normalizeParsedDxfDimensionColors(dxf);
  const polylineWidthAudit = normalizeParsedDxfWidePolylines(dxf);
  await upstreamBuild.call(this, dxf, fontFetchers);

  const serializedScene = this.scene;
  if (serializedScene) {
    serializedScene.lineweightDefault = lineweightAudit.defaultLineweight;
    serializedScene.lineweightLayers = { ...lineweightAudit.layers };
    serializedScene.lineweightSourceAudit = lineweightAudit;
    serializedScene.linetypeRenderAudit = {
      definitions: Object.keys(this.__dxfLinetypeDefinitions ?? {}).sort(),
      patternedEntityCount: this.__dxfLinetypePatternedEntityCount ?? 0,
      generatedPrimitiveCount: this.__dxfLinetypePrimitiveCount ?? 0,
      warnings: [...(this.__dxfLinetypeWarnings ?? [])],
    };
    serializedScene.polylineWidthRenderAudit = polylineWidthAudit;
    for (const layer of serializedScene.layers ?? []) {
      const sourceLineweight = lineweightAudit.layers[layer.name];
      if (sourceLineweight !== undefined) layer.lineweight = sourceLineweight;
    }
  }
};

// Chromium can execute a bundled module worker from a blob URL. In that case dxf-viewer's
// fetch("/fonts/...") call cannot derive a hierarchical base URL and fails before glyph parsing.
// Resolve only root-relative requests against the owning app origin. Absolute/blob URLs and Request
// objects keep the browser's native fetch semantics unchanged.
const workerFetchScope = self as unknown as WorkerFetchScope;
const upstreamFetch = workerFetchScope.fetch.bind(workerFetchScope);
workerFetchScope.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/")) {
    const origin = workerFetchScope.location.origin;
    if (origin && origin !== "null") {
      return upstreamFetch(new URL(input, `${origin}/`), init);
    }
  }
  return upstreamFetch(input, init);
}) as typeof fetch;

const workerScope = self as unknown as Worker;
const worker = new DxfWorker(workerScope, true) as InternalDxfWorker;
const upstreamLoad = worker._Load.bind(worker);

// retainParsedDxf=true normally clones the full parsed file back to the main thread. Keep only the
// existing compact text evidence after scene preparation; lineweight/linetype/wide-polyline evidence
// already lives in scene metadata, so large engineering drawings do not duplicate parsed state.
worker._Load = async (url, fonts, options, progressCbk) => {
  const result = await upstreamLoad(url, fonts, options, progressCbk);
  if (options.retainParsedDxf === true) {
    result.dxf = compactParsedTextEvidence(result.dxf) as WorkerParsedDxf | undefined;
  }
  return result;
};