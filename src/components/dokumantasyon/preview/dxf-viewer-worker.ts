// dxf-viewer does not publish types for its worker internals, but the package ships the source and
// has no package "exports" barrier. We intentionally use the same DxfWorker implementation that
// DxfViewer.SetupWorker() instantiates so parsing/render preparation stay identical to upstream.
// @ts-expect-error dxf-viewer internal module has no declaration file
import { DxfWorker } from "dxf-viewer/src/DxfWorker.js";

type ParsedEntity = { type?: unknown };
type ParsedBlock = { entities?: ParsedEntity[] };
type ParsedDxf = { entities?: ParsedEntity[]; blocks?: Record<string, ParsedBlock> };
type WorkerLoadResult = { scene: unknown; dxf?: ParsedDxf };
type WorkerOptions = { retainParsedDxf?: boolean } & Record<string, unknown>;

type InternalDxfWorker = {
  _Load: (
    url: string,
    fonts: string[] | null,
    options: WorkerOptions,
    progressCbk: ((phase: string, processedSize: number, totalSize: number | null) => void) | null
  ) => Promise<WorkerLoadResult>;
};

const TEXT_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);

function textType(entity: ParsedEntity): string | null {
  const type = String(entity?.type ?? "").toUpperCase();
  return TEXT_TYPES.has(type) ? type : null;
}

function compactParsedTextEvidence(dxf: ParsedDxf | undefined): ParsedDxf | undefined {
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

  return { entities, blocks };
}

const workerScope = self as unknown as Worker;
const worker = new DxfWorker(workerScope, true) as InternalDxfWorker;
const upstreamLoad = worker._Load.bind(worker);

// `retainParsedDxf=true` normally sends the entire parsed DXF back through structured clone after
// scene preparation. For real engineering drawings that duplicates megabytes of parsed state on the
// main thread and can fail/slow text-heavy files. Keep parsing inside the exact upstream worker, but
// replace the returned DXF with a clone-safe text-only census before postMessage. The renderer scene
// itself is untouched.
worker._Load = async (url, fonts, options, progressCbk) => {
  const result = await upstreamLoad(url, fonts, options, progressCbk);
  if (options.retainParsedDxf === true) {
    result.dxf = compactParsedTextEvidence(result.dxf);
  }
  return result;
};
