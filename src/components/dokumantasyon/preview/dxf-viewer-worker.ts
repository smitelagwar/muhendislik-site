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
  _ProcessDxfEntity: (this: InternalDxfScene, entity: DxfTextStage2Entity & { lineweight?: number }, blockCtx?: unknown) => unknown;
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

// dxf-viewer already parses entity group 370 but its LAYER table parser drops layer group 370.
// Enrich only the worker-owned parsed object from the exact fetched source text so BYLAYER
// lineweights can be resolved without touching the uploaded/downloadable DXF.
const parserPrototype = (DxfParser as unknown as { prototype: InternalDxfParserPrototype }).prototype;
const upstreamParseSync = parserPrototype.parseSync;
parserPrototype.parseSync = function (source: string) {
  const dxf = upstreamParseSync.call(this, source);
  return enrichParsedDxfLineweights(dxf, auditDxfLineweightSource(source)) as WorkerParsedDxf;
};

// Batch keys upstream distinguish layer/block/geometry/color/linetype but not lineweight, so two
// otherwise identical lines with different group-370 values collapse into one WebGL batch. Add a
// comparator component only to keys explicitly marked by our _GetBatch seam. Prefix/range lookups
// without the marker keep upstream comparison semantics.
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

// Keep the raw source inheritance value (-1 BYBLOCK, -2 BYLAYER, -3 DEFAULT, or explicit 1/100 mm)
// alive while DxfScene decomposes one parsed entity into render entities.
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

// Flattening a block would otherwise replace the child batch key and lose its lineweight. Preserve
// explicit/BYLAYER values and substitute only BYBLOCK with the current INSERT lineweight. The final
// layer/default resolution is intentionally deferred until the serialized scene reaches the viewer.
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

// Normalize only the worker-owned parsed representation. The original uploaded/downloadable DXF and
// the UTF-8 render Blob on the main thread remain unchanged. Stage 2 repairs ATTRIB/ATTDEF semantics;
// Stage 3 rejects text layout transforms the glyph renderer cannot reproduce. Dimension ACI colors
// are converted after those gates. Lineweight metadata is appended to the serialized worker scene;
// geometry remains the exact upstream scene until the user enables LWT on the main thread.
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
// `fetch("/fonts/...")` call cannot derive a hierarchical base URL and fails before glyph parsing.
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

// `retainParsedDxf=true` normally sends the entire parsed DXF back through structured clone after
// scene preparation. For real engineering drawings that duplicates megabytes of parsed state on the
// main thread. Keep parsing/render preparation in the exact upstream worker, then replace the return
// value with a clone-safe text census + Stage 2/3 annotation reports before postMessage.
worker._Load = async (url, fonts, options, progressCbk) => {
  const result = await upstreamLoad(url, fonts, options, progressCbk);
  if (options.retainParsedDxf === true) {
    result.dxf = compactParsedTextEvidence(result.dxf) as WorkerParsedDxf | undefined;
  }
  return result;
};
