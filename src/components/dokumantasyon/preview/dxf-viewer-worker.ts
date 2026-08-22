// dxf-viewer does not publish types for its worker internals, but the package ships the source and
// has no package "exports" barrier. We intentionally use the same worker/scene implementation that
// upstream uses; only the temporary parsed DXF is normalized before scene preparation.
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfWorker } from "dxf-viewer/src/DxfWorker.js";
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfScene } from "dxf-viewer/src/DxfScene.js";
import {
  dxfTextStage2ReportKey,
  normalizeParsedDxfTextStage2,
  originalDxfTextType,
  type DxfTextStage2Entity,
  type DxfTextStage2ParsedDxf,
  type DxfTextStage2Report,
} from "../../../lib/dokumantasyon/dxf-text-stage2";

type ParsedBlock = { entities?: DxfTextStage2Entity[] };
type CompactParsedDxf = {
  entities?: DxfTextStage2Entity[];
  blocks?: Record<string, ParsedBlock>;
  __dxfTextStage2?: DxfTextStage2Report;
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

const TEXT_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
const REPORT_KEY = dxfTextStage2ReportKey();

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

  const stage2Report = dxf[REPORT_KEY] as DxfTextStage2Report | undefined;
  return {
    entities,
    blocks,
    ...(stage2Report ? { __dxfTextStage2: stage2Report } : {}),
  };
}

// Normalize only the worker-owned parsed representation. The original uploaded/downloadable DXF and
// the UTF-8 render Blob on the main thread remain unchanged. This fixes two upstream annotation
// gaps before DxfScene consumes the entities:
// 1) ATTRIB group 41 is an X width factor, not a multiplier for text height.
// 2) constant ATTDEF has no per-INSERT ATTRIB and must be rendered from the block definition.
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
  return upstreamBuild.call(this, dxf, fontFetchers);
};

const workerScope = self as unknown as Worker;
const worker = new DxfWorker(workerScope, true) as InternalDxfWorker;
const upstreamLoad = worker._Load.bind(worker);

// `retainParsedDxf=true` normally sends the entire parsed DXF back through structured clone after
// scene preparation. For real engineering drawings that duplicates megabytes of parsed state on the
// main thread. Keep parsing/render preparation in the exact upstream worker, then replace the return
// value with a clone-safe text census + Stage 2 annotation report before postMessage.
worker._Load = async (url, fonts, options, progressCbk) => {
  const result = await upstreamLoad(url, fonts, options, progressCbk);
  if (options.retainParsedDxf === true) {
    result.dxf = compactParsedTextEvidence(result.dxf) as DxfTextStage2ParsedDxf | undefined;
  }
  return result;
};
