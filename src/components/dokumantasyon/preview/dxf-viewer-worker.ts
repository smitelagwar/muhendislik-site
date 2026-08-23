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
  auditDxfLineweightSource,
  DXF_LINEWEIGHT_BY_BLOCK,
  DXF_LINEWEIGHT_BY_LAYER,
  enrichParsedDxfLineweights,
  normalizeDxfLineweight,
  type DxfLineweightParsedDxf,
  type DxfLineweightSourceAudit,
} from "../../../lib/dokumantasyon/dxf-lineweight-source";
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

type ParsedBlock = { entities?: DxfTextStage2Entity[] };
type WorkerParsedDxf = DxfTextStage2ParsedDxf & DxfLineweightParsedDxf;
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
type InternalDxfScene = {
  __dxfLineweightContext?: number;
  __dxfLineweightDefault?: number;
  __dxfLineweightLayers?: Record<string, number>;
  scene?: {
    layers?: Array<{ name: string; lineweight?: number }>;
    lineweightDefault?: number;
    lineweightLayers?: Record<string, number>;
    lineweightSourceAudit?: DxfLineweightSourceAudit;
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
    entity: DxfTextStage2Entity & { lineweight?: number },
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

// Upstream parses entity group 370, but drops group 370 in the LAYER table. Enrich only the
// worker-owned parsed representation from the exact source text. Uploaded/downloadable bytes remain
// unchanged, so source fidelity and later re-download are independent from rendering metadata.
const parserPrototype = (DxfParser as unknown as { prototype: InternalDxfParserPrototype }).prototype;
const upstreamParseSync = parserPrototype.parseSync;
parserPrototype.parseSync = function (source: string) {
  const dxf = upstreamParseSync.call(this, source);
  return enrichParsedDxfLineweights(dxf, auditDxfLineweightSource(source)) as WorkerParsedDxf;
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

// Keep raw inheritance semantics (-1 BYBLOCK, -2 BYLAYER, -3 DEFAULT, or explicit 1/100 mm) while
// DxfScene decomposes a parsed entity into render entities.
scenePrototype._ProcessDxfEntity = function (
  this: InternalDxfScene,
  entity: DxfTextStage2Entity & { lineweight?: number },
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

// Block flattening replaces the child batch key upstream. Preserve child lineweight semantics and
// substitute only BYBLOCK with the current INSERT lineweight. Final layer/default resolution is
// deliberately deferred to the main-thread viewer where the actual instance layer is known.
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

// Keep all existing text/dimension fidelity gates, then append lineweight metadata to the serialized
// scene. Geometry is never deduplicated or rewritten here.
const upstreamBuild = scenePrototype.Build;
scenePrototype.Build = async function (
  this: InternalDxfScene,
  dxf: WorkerParsedDxf,
  fontFetchers: unknown[]
) {
  const lineweightAudit = dxf.__dxfLineweightSourceAudit ?? auditDxfLineweightSource("");
  this.__dxfLineweightDefault = lineweightAudit.defaultLineweight;
  this.__dxfLineweightLayers = lineweightAudit.layers;

  const stage2Report = normalizeParsedDxfTextStage2(dxf);
  if (stage2Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 2 fidelity engeli: ${stage2Report.blockingIssues.join(" ")}`);
  }

  const stage3Report = auditParsedDxfTextStage3Layout(dxf as DxfTextStage3LayoutParsedDxf);
  if (stage3Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 3 fidelity engeli: ${stage3Report.blockingIssues.join(" ")}`);
  }

  normalizeParsedDxfDimensionColors(dxf);
  await upstreamBuild.call(this, dxf, fontFetchers);

  const serializedScene = this.scene;
  if (serializedScene) {
    serializedScene.lineweightDefault = lineweightAudit.defaultLineweight;
    serializedScene.lineweightLayers = { ...lineweightAudit.layers };
    serializedScene.lineweightSourceAudit = lineweightAudit;
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
// existing compact text evidence after scene preparation; lineweight data already lives in scene
// metadata, so large engineering drawings do not duplicate parsed state.
worker._Load = async (url, fonts, options, progressCbk) => {
  const result = await upstreamLoad(url, fonts, options, progressCbk);
  if (options.retainParsedDxf === true) {
    result.dxf = compactParsedTextEvidence(result.dxf) as WorkerParsedDxf | undefined;
  }
  return result;
};
