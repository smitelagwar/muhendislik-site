// dxf-viewer does not publish types for its worker internals, but the package ships the source and
// has no package "exports" barrier. We intentionally use the same worker/scene implementation that
// upstream uses; only the temporary parsed DXF is normalized before scene preparation.
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfWorker } from "dxf-viewer/src/DxfWorker.js";
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfScene } from "dxf-viewer/src/DxfScene.js";
import { normalizeParsedDxfDimensionColors } from "../../../lib/dokumantasyon/dxf-dimension-color-normalization";
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
type CompactParsedDxf = {
  entities?: DxfTextStage2Entity[];
  blocks?: Record<string, ParsedBlock>;
  __dxfTextStage2?: DxfTextStage2Report;
  __dxfTextStage3Layout?: DxfTextStage3LayoutReport;
};
type WorkerLoadResult = { scene: unknown; dxf?: DxfTextStage2ParsedDxf };
type WorkerOptions = { retainParsedDxf?: boolean } & Record<string, unknown>;

type InternalDxfWorker = {
  _Load: (
    url: string,
    fonts: string[] | null,
    options: WorkerOptions,
    progressCbk: ((phase: string, processedSize: number, totalSize: number | null) => void) | null
  ) => Promise<WorkerLoadResult>;
};

type InternalDxfScenePrototype = {
  Build: (
    this: unknown,
    dxf: DxfTextStage2ParsedDxf,
    fontFetchers: unknown[]
  ) => Promise<void>;
};

type WorkerFetchScope = {
  fetch: typeof fetch;
  location: Location;
};

const TEXT_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
const STAGE2_REPORT_KEY = dxfTextStage2ReportKey();
const STAGE3_LAYOUT_REPORT_KEY = dxfTextStage3LayoutReportKey();

function textType(entity: DxfTextStage2Entity): string | null {
  const type = originalDxfTextType(entity);
  return TEXT_TYPES.has(type) ? type : null;
}

function compactParsedTextEvidence(dxf: DxfTextStage2ParsedDxf | undefined): CompactParsedDxf | undefined {
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

// Normalize only the worker-owned parsed representation. The original uploaded/downloadable DXF and
// the UTF-8 render Blob on the main thread remain unchanged. Stage 2 repairs ATTRIB/ATTDEF semantics;
// Stage 3 then rejects text layout transforms which the upstream glyph renderer cannot reproduce
// reliably instead of silently showing an approximate engineering annotation. Dimension ACI colors
// are converted after those gates because upstream parses DIMCLRD/DIMCLRE/DIMCLRT as ACI indices but
// later consumes the same numbers as RGB values.
const scenePrototype = (DxfScene as unknown as { prototype: InternalDxfScenePrototype }).prototype;
const upstreamBuild = scenePrototype.Build;
scenePrototype.Build = async function (
  this: unknown,
  dxf: DxfTextStage2ParsedDxf,
  fontFetchers: unknown[]
) {
  const stage2Report = normalizeParsedDxfTextStage2(dxf);
  if (stage2Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 2 fidelity engeli: ${stage2Report.blockingIssues.join(" ")}`);
  }

  const stage3Report = auditParsedDxfTextStage3Layout(dxf as DxfTextStage3LayoutParsedDxf);
  if (stage3Report.blockingIssues.length > 0) {
    throw new Error(`DXF text Stage 3 fidelity engeli: ${stage3Report.blockingIssues.join(" ")}`);
  }

  normalizeParsedDxfDimensionColors(dxf);
  return upstreamBuild.call(this, dxf, fontFetchers);
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
    result.dxf = compactParsedTextEvidence(result.dxf) as DxfTextStage2ParsedDxf | undefined;
  }
  return result;
};
