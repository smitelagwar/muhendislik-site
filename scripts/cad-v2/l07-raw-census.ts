import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createGzip } from "node:zlib";
import { createReadStream, createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { normalizeDxfSourceEncoding, parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import type { CadCanonicalDocument, CadEntity } from "../../src/lib/cad-v2/canonical/types";
import { CAD_V2_COMPILER_REVISION, CAD_V2_PIPELINE_REVISION, CAD_V2_RENDER_ABI } from "../../src/lib/cad-v2/version";

type Fixture = { id: string; relativePath: string; format: "DWG" | "DXF"; magic: string; sizeBytes: number; sha256: string };
type Role = "model" | "paper" | "block" | "unknown";
type RawRow = {
  sourceIndex: number;
  handle: string | null;
  canonicalLookupHandle: string | null;
  ownerEntityOrdinal: number;
  type: string;
  ownerRef: string | null;
  ownerRecordRefs: string[];
  ownerRecordName: string;
  role: Role;
  layoutId: string | null;
  flattenedListMember: boolean;
  sourceVisible: boolean;
  clipBoundaryPresent: boolean;
  classification: string;
  canonicalLocations: string[];
  canonicalEntityHandles: string[];
  canonicalVisible?: boolean;
  diagnosticCodes: string[];
  potentialExpandedOccurrences: number;
  occurrencesUnderClipScope: number;
};

const normalize = (value: unknown) => value == null ? "" : String(value).trim().replace(/^0x/i, "").toUpperCase();
const entityType = (entity: any) => String(entity?.dxfTypeName || entity?.type || entity?.constructor?.name || "UNKNOWN").trim().toUpperCase();
const rawHandle = (entity: any) => normalize(entity?.handle ?? entity?.objectId ?? entity?.id) || null;
const rawOwnerRef = (entity: any) => normalize(entity?.ownerBlockRecordSoftId ?? entity?.ownerId ?? entity?.ownerBlockRecordId ?? entity?.ownerHandle) || null;
const rawVisible = (entity: any) => entity?.isVisible !== false && entity?.visible !== false && entity?.off !== true && entity?.isInvisible !== true;

function classifyRawRow(input: {
  role: Role;
  type: string;
  sourceVisible: boolean;
  canonicalLocations: string[];
  diagnosticCodes: string[];
  blockReachable: boolean;
}): string {
  if (input.canonicalLocations.length) {
    if (input.diagnosticCodes.length) return input.sourceVisible ? "converted_with_diagnostic" : "converted_source_invisible_with_diagnostic";
    return input.sourceVisible ? "converted" : "converted_source_invisible";
  }
  if (input.diagnosticCodes.includes("CURVE_GEOMETRY_INVALID") || input.diagnosticCodes.includes("EMPTY_HATCH_LOOPS")) return "invalid_diagnostic";
  if (input.diagnosticCodes.includes("UNSUPPORTED_ENTITY_TYPE")) return "unsupported_diagnostic";
  if (input.diagnosticCodes.length) return "degraded_diagnostic";
  if (input.type === "VIEWPORT") return "viewport_control";
  if (!input.sourceVisible) return "source_invisible_no_canonical";
  if (input.role === "block" && !input.blockReachable) return "unreferenced_block_content";
  return "UNACCOUNTED";
}

function localCensusStatus(input: {
  unaccountedRows: number;
  ownerMismatchCount: number;
  duplicateRawHandleCount: number;
  canonicalOnlyHandleCount: number;
  expansionTruncated: boolean;
}): "LOCAL_CENSUS_PASS" | "LOCAL_CENSUS_DEGRADED" {
  return input.unaccountedRows === 0
    && input.ownerMismatchCount === 0
    && input.duplicateRawHandleCount === 0
    && input.canonicalOnlyHandleCount === 0
    && !input.expansionTruncated
    ? "LOCAL_CENSUS_PASS"
    : "LOCAL_CENSUS_DEGRADED";
}

function countBy<T>(values: T[], key: (value: T) => string) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const name = key(value) || "<unknown>";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
}

function readAsciiDxfHeaderValue(bytes: Buffer, variableName: string): string | null {
  const headerPrefix = bytes.subarray(0, Math.min(bytes.byteLength, 1024 * 1024)).toString("latin1").replace(/^\uFEFF/, "");
  const lines = headerPrefix.split(/\r\n|\n|\r/);
  for (let index = 0; index + 3 < lines.length; index += 2) {
    if (lines[index]?.trim() !== "9" || lines[index + 1]?.trim().toUpperCase() !== variableName.toUpperCase()) continue;
    const valueCode = lines[index + 2]?.trim();
    return valueCode === "1" || valueCode === "3" ? (lines[index + 3]?.trim() || null) : null;
  }
  return null;
}

function sourceMagic(bytes: Buffer, fixture: Fixture): string {
  if (fixture.format === "DWG") return bytes.subarray(0, 6).toString("ascii");
  return readAsciiDxfHeaderValue(bytes, "$ACADVER") || "<missing-$ACADVER>";
}

function layoutNamesByRecordRef(layouts: any[], records: any[]): Map<string, string> {
  const names = new Map<string, string>();
  for (const layout of layouts) {
    const layoutName = String(layout?.layoutName || layout?.name || "").trim();
    const blockRef = normalize(layout?.blockTableRecordId ?? layout?.paperSpaceTableId);
    if (!layoutName || !blockRef) continue;
    names.set(blockRef, layoutName);
    const record = records.find((candidate) => [candidate?.objectId, candidate?.handle, candidate?.id].some((ref) => normalize(ref) === blockRef));
    if (record) for (const ref of [record?.objectId, record?.handle, record?.id]) if (normalize(ref)) names.set(normalize(ref), layoutName);
  }
  return names;
}

async function readRawRows(fixture: Fixture, bytes: Buffer): Promise<{ rows: RawRow[]; rawSummary: Record<string, unknown> }> {
  const rowsByKey = new Map<string, { entity: any; record: any; role: Role; layoutId: string | null; flattened: boolean; recordOrdinal: number; adapterOrder: number | null }>();
  let rawSummary: Record<string, unknown> = {};

  if (fixture.format === "DWG") {
    const lib = await import("@mlightcad/libredwg-web");
    const dwg = await lib.LibreDwg.create();
    let pointer: number | undefined;
    let raw: any;
    try {
      pointer = dwg.dwg_read_data(bytes, lib.Dwg_File_Type.DWG);
      if (!pointer) throw new Error(`${fixture.id}: LibreDWG raw conversion returned no pointer`);
      raw = dwg.convert(pointer);
    } finally {
      if (pointer) dwg.dwg_free(pointer);
    }
    const records = (raw?.tables?.BLOCK_RECORD?.entries ?? []) as any[];
    const rawLayouts = (raw?.objects?.LAYOUT ?? raw?.tables?.LAYOUT?.entries ?? raw?.layouts ?? []) as any[];
    const layoutByBlockRef = layoutNamesByRecordRef(rawLayouts, records);
    const recordByRef = new Map<string, any>();
    for (const record of records) for (const value of [record?.handle, record?.objectId]) if (normalize(value)) recordByRef.set(normalize(value), record);
    let index = 0;
    for (const record of records) {
      const name = String(record?.name || "<unnamed>");
      const role: Role = name.toLowerCase().startsWith("*model_space") ? "model" : name.toLowerCase().startsWith("*paper_space") ? "paper" : "block";
      const recordRef = normalize(record?.handle ?? record?.objectId) || null;
      const layoutId = role === "paper" ? (layoutByBlockRef.get(recordRef || "") || name) : role === "model" ? "Model" : null;
      let recordOrdinal = 0;
      for (const entity of (record?.entities ?? []) as any[]) {
        const ordinal = recordOrdinal++;
        const handle = rawHandle(entity);
        const key = handle ? `H:${handle}` : `R:${recordRef ?? name}:${index}`;
        const prior = rowsByKey.get(key);
        if (prior) {
          if (prior.record?.handle !== record?.handle) prior.record = { ...prior.record, duplicateOwnerRecordRefs: [...(prior.record?.duplicateOwnerRecordRefs ?? []), recordRef] };
          continue;
        }
        rowsByKey.set(key, { entity, record, role, layoutId, flattened: false, recordOrdinal: ordinal, adapterOrder: null });
        index++;
      }
    }
    const flattened = Array.isArray(raw?.entities) ? raw.entities as any[] : [];
    for (const entity of flattened) {
      const handle = rawHandle(entity);
      const ownerRef = rawOwnerRef(entity);
      const record = ownerRef ? recordByRef.get(ownerRef) : undefined;
      const key = handle ? `H:${handle}` : `FLAT:${index++}`;
      const prior = rowsByKey.get(key);
      if (prior) prior.flattened = true;
      else {
        const name = String(record?.name || "<owner-unresolved>");
        const role: Role = name.toLowerCase().startsWith("*model_space") ? "model" : name.toLowerCase().startsWith("*paper_space") ? "paper" : record ? "block" : "unknown";
        rowsByKey.set(key, { entity, record, role, layoutId: role === "paper" ? (layoutByBlockRef.get(normalize(record?.handle) || "") || name) : role === "model" ? "Model" : null, flattened: true, recordOrdinal: -1, adapterOrder: null });
      }
    }
    rawSummary = {
      rawFlattenedEntityCount: flattened.length,
      blockRecordCount: records.length,
      layoutObjects: rawLayouts.map((layout) => ({ handle: normalize(layout?.handle) || null, name: layout?.layoutName || layout?.name || null, blockRecordRef: normalize(layout?.paperSpaceTableId ?? layout?.blockTableRecordId) || null })),
      header: { version: raw?.header?.version ?? null, codepage: raw?.header?.codepage ?? null, insunits: raw?.header?.INSUNITS ?? raw?.header?.insunits ?? null },
    };
  } else {
    const {
      AcDbNativeDxfConverter, AcDbDatabase, acdbAssignWorkingDatabase,
      acdbHostApplicationServices, acdbSetHostApplicationServicesProvider,
    } = await import("@mlightcad/data-model");
    const db = new AcDbDatabase();
    if (typeof acdbSetHostApplicationServicesProvider === "function" && typeof acdbHostApplicationServices === "function") acdbSetHostApplicationServicesProvider(acdbHostApplicationServices);
    if (typeof acdbHostApplicationServices === "function") {
      try { const services = acdbHostApplicationServices(); if (services) services.workingDatabase = db; } catch { /* census is read-only */ }
    }
    if (typeof acdbAssignWorkingDatabase === "function") acdbAssignWorkingDatabase(db);
    const converter = new AcDbNativeDxfConverter();
    const normalizedSource = normalizeDxfSourceEncoding(bytes);
    await converter.read(new Uint8Array(normalizedSource.bytes) as unknown as ArrayBuffer, db);
    const table = (db as any).tables?.blockTable;
    const records = table?.newIterator?.().toArray?.() ?? [];
    const layoutsTable = (db as any).objects?.layout ?? (db as any).tables?.layoutTable;
    const layouts = layoutsTable?.newIterator?.().toArray?.() ?? [];
    const layoutByBlockRef = layoutNamesByRecordRef(layouts, records);
    const modelRecord = records.find((record: any) => String(record?.name || "").toLowerCase().startsWith("*model_space"));
    const modelItems = modelRecord?.newIterator?.().toArray?.() ?? [];
    const modelEntityCount = modelItems.reduce((count: number, item: any) => count + (typeof item === "string" ? ((db as any).openEntityForRead(item) ? 1 : 0) : item ? 1 : 0), 0);
    let adapterOrder = modelEntityCount + 1;
    let index = 0;
    for (const record of records) {
      const name = String(record?.name || "<unnamed>");
      const role: Role = name.toLowerCase().startsWith("*model_space") ? "model" : name.toLowerCase().startsWith("*paper_space") ? "paper" : "block";
      const recordRef = normalize(record?.objectId ?? record?.handle) || null;
      const layoutId = role === "paper" ? (layoutByBlockRef.get(recordRef || "") || name) : role === "model" ? "Model" : null;
      const entities = record?.newIterator?.().toArray?.() ?? [];
      let recordOrdinal = 0;
      for (const item of entities as any[]) {
        const entity = typeof item === "string" ? (db as any).openEntityForRead(item) : item;
        if (!entity) continue;
        const ordinal = recordOrdinal++;
        const handle = rawHandle(entity);
        const key = handle ? `H:${handle}` : `R:${recordRef ?? name}:${index}`;
        let entityAdapterOrder: number | null;
        if (role === "model") {
          entityAdapterOrder = ordinal + 1;
        } else {
          const type = entityType(entity);
          const viewportNumber = typeof entity?.number === "number" ? entity.number : typeof entity?.viewportId === "number" ? entity.viewportId : undefined;
          if (type === "VIEWPORT" && (role !== "paper" || viewportNumber === 1)) entityAdapterOrder = null;
          else entityAdapterOrder = adapterOrder++;
        }
        rowsByKey.set(key, { entity, record, role, layoutId, flattened: false, recordOrdinal: ordinal, adapterOrder: entityAdapterOrder });
        index++;
      }
    }
    rawSummary = {
      rawFlattenedEntityCount: null,
      blockRecordCount: records.length,
      layoutObjects: layouts.map((layout: any) => ({ handle: normalize(layout?.handle ?? layout?.objectId) || null, name: layout?.layoutName || layout?.name || null, blockRecordRef: normalize(layout?.blockTableRecordId) || null })),
      header: { version: (db as any).header?.version ?? null, codepage: normalizedSource.codepage, decoderCodepage: (db as any).header?.codepage ?? null, insunits: (db as any).header?.INSUNITS ?? (db as any).header?.insunits ?? null },
      rawEntityOwners: "Each block-table-record iterator was inventoried; entity ownerId is compared with that record's objectId/handle.",
    };
  }

  const rows: RawRow[] = [...rowsByKey.values()].map(({ entity, record, role, layoutId, flattened, recordOrdinal, adapterOrder }, sourceIndex) => {
    const name = String(record?.name || "<owner-unresolved>");
    const recordRef = normalize(record?.handle ?? record?.objectId) || null;
    const ownerRef = rawOwnerRef(entity);
    const clip = entity?.clipBoundary ?? entity?.spatialFilter ?? entity?.spatialFilterId ?? entity?.clippingBoundaryId;
    return {
      sourceIndex,
      handle: rawHandle(entity),
      canonicalLookupHandle: normalize(entity?.handle) || (fixture.format === "DXF" && adapterOrder != null ? `H_${adapterOrder}` : rawHandle(entity)),
      ownerEntityOrdinal: recordOrdinal,
      type: entityType(entity),
      ownerRef,
      ownerRecordRefs: [normalize(record?.handle), normalize(record?.objectId)].filter(Boolean),
      ownerRecordName: name,
      role,
      layoutId,
      flattenedListMember: flattened,
      sourceVisible: rawVisible(entity),
      clipBoundaryPresent: clip != null && clip !== false,
      classification: "pending",
      canonicalLocations: [],
      canonicalEntityHandles: [],
      diagnosticCodes: [],
      potentialExpandedOccurrences: 0,
      occurrencesUnderClipScope: 0,
    };
  });
  return { rows, rawSummary };
}

type CanonicalMatch = { location: string; entity: CadEntity; layoutId: string };

function canonicalIndexes(doc: CadCanonicalDocument) {
  const byHandle = new Map<string, CanonicalMatch[]>();
  const add = (entity: CadEntity, location: string, layoutId: string) => {
    const handle = normalize(entity.handle);
    if (!handle) return;
    const matches = byHandle.get(handle) ?? [];
    matches.push({ location, entity, layoutId });
    byHandle.set(handle, matches);
  };
  for (const entity of doc.modelSpaceEntities) add(entity, "model", "Model");
  for (const [layoutId, entities] of Object.entries(doc.paperSpaceEntities ?? {})) for (const entity of entities) add(entity, `paper:${layoutId}`, layoutId);
  for (const [blockName, block] of Object.entries(doc.blocks)) for (const entity of block.entities) add(entity, `block:${blockName}`, blockName);
  const diagnosticsByHandle = new Map<string, string[]>();
  const diagnosticsBySourceOrder = new Map<number, string[]>();
  for (const diagnostic of doc.diagnostics ?? []) {
    const handle = normalize(diagnostic.entityHandle);
    if (handle) {
      const codes = diagnosticsByHandle.get(handle) ?? [];
      codes.push(diagnostic.code);
      diagnosticsByHandle.set(handle, codes);
    } else {
      const order = Number(/unsupported_entity_(\d+)$/i.exec(diagnostic.id)?.[1] ?? /_(\d+)$/i.exec(diagnostic.id)?.[1]);
      if (Number.isSafeInteger(order)) diagnosticsBySourceOrder.set(order, [...(diagnosticsBySourceOrder.get(order) ?? []), diagnostic.code]);
    }
  }
  return { byHandle, diagnosticsByHandle, diagnosticsBySourceOrder };
}

function collectPotentialExpansion(doc: CadCanonicalDocument, maximumVisits = 1_000_000) {
  const occurrences = new Map<string, number>();
  const clipped = new Map<string, number>();
  let visits = 0;
  let truncated = false;
  const walk = (entity: CadEntity, blockStack: Set<string>, underClip: boolean) => {
    if (++visits > maximumVisits) { truncated = true; return; }
    const handle = normalize(entity.handle);
    if (handle) {
      occurrences.set(handle, (occurrences.get(handle) ?? 0) + 1);
      if (underClip) clipped.set(handle, (clipped.get(handle) ?? 0) + 1);
    }
    if (entity.type !== "INSERT" || entity.visible === false) return;
    const insert = entity as CadEntity & { blockName: string; clipBoundary?: unknown };
    const blockName = String(insert.blockName || "");
    const block = doc.blocks[blockName];
    if (!block || block.isXref || blockStack.has(blockName)) return;
    const next = new Set(blockStack);
    next.add(blockName);
    const childClipScope = underClip || insert.clipBoundary != null;
    for (const child of block.entities) {
      if (truncated) break;
      walk(child, next, childClipScope);
    }
  };
  for (const entity of [...doc.modelSpaceEntities, ...Object.values(doc.paperSpaceEntities ?? {}).flat()]) {
    if (truncated) break;
    walk(entity, new Set(), false);
  }
  return { occurrences, clipped, visits: Math.min(visits, maximumVisits), truncated };
}

function reconcileRawRows(rows: RawRow[], doc: CadCanonicalDocument) {
  const indexes = canonicalIndexes(doc);
  const expansion = collectPotentialExpansion(doc);
  const matchedCanonicalIdentities = new Set<string>();
  for (const row of rows) {
    const expectedLocation = row.role === "model" ? "model" : row.role === "paper" ? `paper:${row.layoutId}` : row.role === "block" ? `block:${row.ownerRecordName}` : "";
    const handle = normalize(row.handle);
    const lookupHandles = [...new Set([handle, normalize(row.canonicalLookupHandle)].filter(Boolean))];
    let matches: CanonicalMatch[] = [];
    for (const lookupHandle of lookupHandles) {
      matches = (indexes.byHandle.get(lookupHandle) ?? []).filter((match) => match.location === expectedLocation);
      if (matches.length) break;
    }
    const codes = (handle ? indexes.diagnosticsByHandle.get(handle) ?? [] : []).concat(
      row.role === "model" ? indexes.diagnosticsBySourceOrder.get(row.ownerEntityOrdinal + 1) ?? [] : [],
    );
    row.canonicalLocations = matches.map((match) => match.location);
    row.canonicalEntityHandles = matches.map((match) => normalize(match.entity.handle));
    for (const match of matches) matchedCanonicalIdentities.add(`${match.location}:${normalize(match.entity.handle)}`);
    row.canonicalVisible = matches.length ? matches.some((match) => match.entity.visible !== false) : undefined;
    row.diagnosticCodes = [...new Set(codes)].sort();
    row.potentialExpandedOccurrences = row.canonicalEntityHandles.reduce((sum, canonicalHandle) => sum + (expansion.occurrences.get(canonicalHandle) ?? 0), 0);
    row.occurrencesUnderClipScope = row.canonicalEntityHandles.reduce((sum, canonicalHandle) => sum + (expansion.clipped.get(canonicalHandle) ?? 0), 0);
    const blockReachable = row.role === "block" && row.ownerRecordName !== "<owner-unresolved>" && row.potentialExpandedOccurrences > 0;
    row.classification = classifyRawRow({ role: row.role, type: row.type, sourceVisible: row.sourceVisible, canonicalLocations: row.canonicalLocations, diagnosticCodes: row.diagnosticCodes, blockReachable });
  }
  const canonicalOnlyHandles = [...indexes.byHandle.entries()].flatMap(([handle, matches]) => matches
    .filter((match) => !matchedCanonicalIdentities.has(`${match.location}:${handle}`))
    .map((match) => `${match.location}:${handle}`)).sort();
  const ownerMismatches = rows.filter((row) => row.ownerRef && row.ownerRecordRefs.length && !row.ownerRecordRefs.includes(normalize(row.ownerRef)));
  const duplicateRawHandles = Object.entries(countBy(rows.filter((row) => row.handle), (row) => normalize(row.handle))).filter(([, count]) => count > 1);
  return {
    rowCount: rows.length,
    countsByRole: countBy(rows, (row) => row.role),
    countsByType: countBy(rows, (row) => row.type),
    countsByClassification: countBy(rows, (row) => row.classification),
    canonicalLocationCounts: countBy(rows.flatMap((row) => row.canonicalLocations), (location) => location.split(":")[0]!),
    rowsWithDiagnostic: rows.filter((row) => row.diagnosticCodes.length).length,
    unsupportedRows: rows.filter((row) => row.classification === "unsupported_diagnostic").length,
    invalidRows: rows.filter((row) => row.classification === "invalid_diagnostic").length,
    unaccountedRows: rows.filter((row) => row.classification === "UNACCOUNTED").length,
    unaccountedExamples: rows.filter((row) => row.classification === "UNACCOUNTED").slice(0, 200).map((row) => ({ handle: row.handle, type: row.type, role: row.role, ownerRecordName: row.ownerRecordName, ownerRef: row.ownerRef })),
    ownerMismatchCount: ownerMismatches.length,
    ownerMismatchExamples: ownerMismatches.slice(0, 100).map((row) => ({ handle: row.handle, type: row.type, ownerRef: row.ownerRef, ownerRecordRefs: row.ownerRecordRefs, ownerRecordName: row.ownerRecordName })),
    duplicateRawHandleCount: duplicateRawHandles.length,
    duplicateRawHandleExamples: duplicateRawHandles.slice(0, 100).map(([handle, count]) => ({ handle, count })),
    canonicalOnlyHandleCount: canonicalOnlyHandles.length,
    canonicalOnlyHandleExamples: canonicalOnlyHandles.slice(0, 100),
    expansionAccounting: {
      kind: "candidate canonical graph reachability; not geometric draw/clip proof",
      visits: expansion.visits,
      truncated: expansion.truncated,
      uniqueSourceHandlesWithOccurrences: expansion.occurrences.size,
      totalSourceEntityOccurrences: [...expansion.occurrences.values()].reduce((sum, count) => sum + count, 0),
      entityOccurrencesUnderClippedInsert: [...expansion.clipped.values()].reduce((sum, count) => sum + count, 0),
    },
    rows,
  };
}

async function sha256File(filePath: string) {
  const hash = crypto.createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

function candidateDirtyDigest(repoRoot: string) {
  const trackedDiff = execFileSync("git", ["diff", "--binary", "HEAD", "--"], { cwd: repoRoot, maxBuffer: 512 * 1024 * 1024 });
  const untrackedOutput = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 });
  const untrackedPaths = untrackedOutput.toString("utf8").split("\0").filter((relativePath) => Boolean(relativePath)
    // L07 atlas and census outputs are evidence, not candidate source inputs.
    // Exclude the evidence folder so sequential captures share one stable source snapshot.
    && !relativePath.replaceAll("\\", "/").startsWith("motor_v2/evidence/fidelity-v3/L07/")
    && !relativePath.replaceAll("\\", "/").startsWith(".test-data/cad-v2-l07-raw-census/"));
  const digest = crypto.createHash("sha256").update(trackedDiff);
  for (const relativePath of untrackedPaths) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) continue;
    const fileHash = crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
    digest.update(relativePath.replaceAll("\\", "/")).update("\0").update(fileHash).update("\n");
  }
  return { sha256: digest.digest("hex"), trackedDiffBytes: trackedDiff.length, untrackedFilesHashed: untrackedPaths.length };
}

export async function runFixture(fixture: Fixture, runId: string, repoRoot = process.cwd()) {
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "tests/cad-v2/fixtures-manifest.json"), "utf8")) as { realCorpus: Fixture[] };
  const expected = manifest.realCorpus.find((item) => item.id === fixture.id);
  if (!expected || expected.relativePath !== fixture.relativePath || expected.sha256 !== fixture.sha256) throw new Error(`${fixture.id}: fixture identity is not the checked-in corpus manifest entry`);
  const sourcePath = path.resolve(repoRoot, fixture.relativePath);
  const bytes = fs.readFileSync(sourcePath);
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== fixture.sizeBytes || sha256 !== fixture.sha256) throw new Error(`${fixture.id}: source length or SHA-256 differs from fixtures-manifest.json`);
  const observedMagic = sourceMagic(bytes, fixture);
  if (observedMagic !== fixture.magic) throw new Error(`${fixture.id}: source magic/version ${observedMagic} differs from manifest ${fixture.magic}`);
  const started = Date.now();
  const { rows, rawSummary } = await readRawRows(fixture, bytes);
  const canonical = fixture.format === "DXF"
    ? await parseDxfToCanonical(bytes, { sourceVersionKey: `l07_${fixture.id}`, sourceSha256: sha256 })
    : await parseDwgToCanonical(bytes, { sourceVersionKey: `l07_${fixture.id}`, sourceSha256: sha256 });
  const reconciled = reconcileRawRows(rows, canonical);
  const dirtyState = candidateDirtyDigest(repoRoot);
  const runDir = path.join(repoRoot, ".test-data", "cad-v2-l07-raw-census", runId);
  fs.mkdirSync(runDir, { recursive: true });
  const inventoryPath = path.join(runDir, `${fixture.id.toLowerCase()}-raw-canonical.jsonl.gz`);
  async function* jsonLines() {
    for (const row of rows) yield `${JSON.stringify(row)}\n`;
  }
  await pipeline(Readable.from(jsonLines()), createGzip({ level: 9 }), createWriteStream(inventoryPath));
  const summary = {
    schemaVersion: 1,
    evidenceKind: "same-decoder raw-to-canonical source census; not an independent AutoCAD oracle",
    status: localCensusStatus({
      unaccountedRows: reconciled.unaccountedRows,
      ownerMismatchCount: reconciled.ownerMismatchCount,
      duplicateRawHandleCount: reconciled.duplicateRawHandleCount,
      canonicalOnlyHandleCount: reconciled.canonicalOnlyHandleCount,
      expansionTruncated: reconciled.expansionAccounting.truncated,
    }),
    source: { id: fixture.id, path: fixture.relativePath, format: fixture.format, magic: observedMagic, magicSource: fixture.format === "DWG" ? "first six source bytes" : "ASCII DXF $ACADVER header", bytes: bytes.byteLength, sha256 },
    candidate: { branch: "codex/srdr-dwg-motor-v2-fidelity", head: "4b51ebe6b1470c6a247e03158dfe4b5359621c97", dirtyStateSha256: dirtyState.sha256, dirtyState, compiler: CAD_V2_COMPILER_REVISION, pipeline: CAD_V2_PIPELINE_REVISION, renderAbi: CAD_V2_RENDER_ABI },
    decoder: { rawParser: fixture.format === "DWG" ? "@mlightcad/libredwg-web direct DWG conversion + candidate DWG adapter" : "@mlightcad/data-model block-table iterators + candidate DXF adapter", rawSummary },
    canonical: { modelCount: canonical.modelSpaceEntities.length, paperCountsByLayout: Object.fromEntries(Object.entries(canonical.paperSpaceEntities ?? {}).map(([layout, entities]) => [layout, entities.length])), blockCount: Object.keys(canonical.blocks).length, layoutNames: Object.values(canonical.layouts).map((layout) => ({ id: layout.id, name: layout.name, model: layout.isModelSpace, blockRecordName: layout.blockRecordName })), diagnosticCounts: countBy(canonical.diagnostics ?? [], (diagnostic) => `${diagnostic.severity}:${diagnostic.code}`), rawStats: canonical.rawStats ?? null },
    reconciliation: { ...reconciled, rows: undefined },
    inventory: { path: path.relative(repoRoot, inventoryPath).replaceAll("\\", "/"), bytesGzip: fs.statSync(inventoryPath).size, sha256Gzip: await sha256File(inventoryPath), recordCount: rows.length, recordFormat: "one JSON object per gzip line; raw handle, owner record/reference, layout, source visibility, canonical location, diagnostics, potential block occurrences and clip scope" },
    limits: ["Raw and canonical views use the same decoder family; this is adapter accounting, not independent file truth.", "Potential block occurrences are graph reachability counts; they do not prove rendered geometry, draw completeness, or clip intersection.", "Missing AutoCAD LT 2027 native oracle keeps numeric/layout parity NOT_RUN.", "FAIL-404 source bytes and SHA remain unavailable; the provided screenshots are only prepare-200 then chunk-404 evidence."],
    elapsedMs: Date.now() - started,
    nativeOracle: "NOT_RUN",
  };
  const evidenceDir = path.join(repoRoot, "motor_v2", "evidence", "fidelity-v3", "L07");
  fs.mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, `raw-census-${runId}-${fixture.id.toLowerCase()}.json`);
  fs.writeFileSync(evidencePath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const { rows: _rows, ...counts } = reconciled;
  return { status: summary.status, summaryPath: evidencePath, inventoryPath, ...counts, elapsedMs: summary.elapsedMs };
}

export { classifyRawRow, localCensusStatus, reconcileRawRows };

async function main() {
  const fixtureId = process.argv[2];
  if (!fixtureId || !/^R00[1-4]$/.test(fixtureId)) throw new Error("Usage: tsx scripts/cad-v2/l07-raw-census.ts <R001|R002|R003|R004> [run-id]");
  const repoRoot = process.cwd();
  const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, "tests/cad-v2/fixtures-manifest.json"), "utf8")) as { realCorpus: Fixture[] };
  const fixture = manifest.realCorpus.find((entry) => entry.id === fixtureId);
  if (!fixture) throw new Error(`Fixture ${fixtureId} is absent from manifest`);
  const runId = process.argv[3] || new Date().toISOString().replace(/[-:.]/g, "").replace("Z", "Z");
  const result = await runFixture(fixture, runId, repoRoot);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1; });
}
