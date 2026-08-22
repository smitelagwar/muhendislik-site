import { DXF_VIEWER_SUPPORTED_ENTITY_TYPES } from "./dxf-fidelity-audit";

const EPSILON = 1e-9;
const STRUCTURAL_RECORD_TYPES = new Set(["SECTION", "ENDSEC", "TABLE", "ENDTAB", "BLOCK", "ENDBLK", "VERTEX", "SEQEND", "EOF"]);

type Pair = { code: number; value: string };
type RecordData = {
  section: string | null;
  type: string;
  pairs: Pair[];
  blockName: string | null;
};

type LayerState = {
  off: boolean;
  frozen: boolean;
};

export interface DxfReleaseHardeningAudit {
  visibleModelUnsupportedEntityCount: number;
  visibleModelUnsupportedTypes: string[];
  reachableBlockUnsupportedEntityCount: number;
  reachableBlockUnsupportedTypes: string[];
  blockedUnsupportedEntityCount: number;
  blockedUnsupportedTypes: string[];
  visibleMissingBlockReferenceCount: number;
  visibleMissingBlockReferences: string[];
  reachableMissingBlockReferenceCount: number;
  reachableMissingBlockReferences: string[];
  blockedMissingBlockReferenceCount: number;
  blockedMissingBlockReferences: string[];
  unsafeOcsEntityCount: number;
  unsafeOcsTypes: string[];
  reachableBlockCount: number;
  ignoredUnsupportedEntityCount: number;
}

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[index + 1] });
  }
  return pairs;
}

function valueForCode(record: Pair[], code: number): string | null {
  return record.find((pair) => pair.code === code)?.value.trim() ?? null;
}

function numberForCode(record: Pair[], code: number, fallback: number): number {
  const raw = valueForCode(record, code);
  if (raw === null) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function parseRecords(text: string): RecordData[] {
  const pairs = parsePairs(text);
  const records: RecordData[] = [];
  let section: string | null = null;
  let currentType: string | null = null;
  let currentPairs: Pair[] = [];
  let currentBlockName: string | null = null;

  const flush = () => {
    if (!currentType) return;
    const type = currentType.toUpperCase();
    const record: RecordData = {
      section,
      type,
      pairs: currentPairs,
      blockName: section === "BLOCKS" && type !== "BLOCK" && type !== "ENDBLK" ? currentBlockName : null,
    };
    records.push(record);

    if (section === "BLOCKS" && type === "BLOCK") {
      currentBlockName = valueForCode(currentPairs, 2) ?? valueForCode(currentPairs, 3);
    } else if (section === "BLOCKS" && type === "ENDBLK") {
      currentBlockName = null;
    }
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const normalized = pair.value.trim().toUpperCase();

    if (pair.code === 0 && normalized === "SECTION") {
      flush();
      currentType = null;
      currentPairs = [];
      currentBlockName = null;
      const next = pairs[index + 1];
      section = next?.code === 2 ? next.value.trim().toUpperCase() : null;
      continue;
    }

    if (pair.code === 0 && normalized === "ENDSEC") {
      flush();
      currentType = null;
      currentPairs = [];
      currentBlockName = null;
      section = null;
      continue;
    }

    if (pair.code === 0) {
      flush();
      currentType = normalized;
      currentPairs = [pair];
      continue;
    }

    if (currentType) currentPairs.push(pair);
  }
  flush();
  return records;
}

function parseLayers(records: RecordData[]): Map<string, LayerState> {
  const layers = new Map<string, LayerState>();
  for (const record of records) {
    if (record.section !== "TABLES" || record.type !== "LAYER") continue;
    const name = valueForCode(record.pairs, 2);
    if (!name) continue;
    const flags = Math.trunc(numberForCode(record.pairs, 70, 0));
    const colorIndex = numberForCode(record.pairs, 62, 7);
    layers.set(name, {
      off: colorIndex < 0,
      frozen: (flags & 1) !== 0 || (flags & 2) !== 0,
    });
  }
  return layers;
}

function isPaperSpace(record: RecordData): boolean {
  return valueForCode(record.pairs, 67) === "1";
}

function isHidden(record: RecordData): boolean {
  return valueForCode(record.pairs, 60) === "1";
}

function isLayerSuppressed(record: RecordData, layers: Map<string, LayerState>): boolean {
  const layerName = valueForCode(record.pairs, 8) ?? "0";
  if (record.section === "BLOCKS" && layerName === "0") return false;
  const state = layers.get(layerName);
  return Boolean(state?.off || state?.frozen);
}

function isSourceRenderable(record: RecordData, layers: Map<string, LayerState>): boolean {
  if (isHidden(record)) return false;
  if (record.section === "ENTITIES" && isPaperSpace(record)) return false;
  return !isLayerSuppressed(record, layers);
}

function isUnsupported(record: RecordData): boolean {
  if (STRUCTURAL_RECORD_TYPES.has(record.type)) return false;
  return !DXF_VIEWER_SUPPORTED_ENTITY_TYPES.has(record.type);
}

function hasUnsafeOcs(record: RecordData): boolean {
  const hasExtrusion = record.pairs.some((pair) => pair.code === 210 || pair.code === 220 || pair.code === 230);
  if (!hasExtrusion) return false;
  const x = numberForCode(record.pairs, 210, 0);
  const y = numberForCode(record.pairs, 220, 0);
  const z = numberForCode(record.pairs, 230, 1);
  return Math.abs(x) > EPSILON || Math.abs(y) > EPSILON || Math.abs(z - 1) > EPSILON;
}

function referencedBlock(record: RecordData): string | null {
  if (record.type !== "INSERT") return null;
  return valueForCode(record.pairs, 2);
}

export function auditDxfReleaseHardening(text: string): DxfReleaseHardeningAudit {
  const records = parseRecords(text);
  const layers = parseLayers(records);
  const blockDefinitions = new Map<string, RecordData[]>();

  for (const record of records) {
    if (record.section !== "BLOCKS" || !record.blockName) continue;
    const list = blockDefinitions.get(record.blockName) ?? [];
    list.push(record);
    blockDefinitions.set(record.blockName, list);
  }

  const visibleUnsupportedTypes = new Set<string>();
  const reachableUnsupportedTypes = new Set<string>();
  const unsafeOcsTypes = new Set<string>();
  const visibleMissingBlockReferences = new Set<string>();
  const reachableMissingBlockReferences = new Set<string>();
  const reachableBlocks = new Set<string>();
  const queue: string[] = [];
  let visibleModelUnsupportedEntityCount = 0;
  let reachableBlockUnsupportedEntityCount = 0;
  let visibleMissingBlockReferenceCount = 0;
  let reachableMissingBlockReferenceCount = 0;
  let unsafeOcsEntityCount = 0;
  let totalUnsupportedEntityCount = 0;

  for (const record of records) {
    if ((record.section === "ENTITIES" || record.section === "BLOCKS") && isUnsupported(record)) {
      totalUnsupportedEntityCount += 1;
    }
  }

  const inspectRenderableRecord = (record: RecordData, location: "model" | "block") => {
    if (isUnsupported(record)) {
      if (location === "model") {
        visibleModelUnsupportedEntityCount += 1;
        visibleUnsupportedTypes.add(record.type);
      } else {
        reachableBlockUnsupportedEntityCount += 1;
        reachableUnsupportedTypes.add(record.type);
      }
    }

    if (hasUnsafeOcs(record)) {
      unsafeOcsEntityCount += 1;
      unsafeOcsTypes.add(record.type);
    }

    const blockName = referencedBlock(record);
    if (!blockName) return;
    if (!blockDefinitions.has(blockName)) {
      if (location === "model") {
        visibleMissingBlockReferenceCount += 1;
        visibleMissingBlockReferences.add(blockName);
      } else {
        reachableMissingBlockReferenceCount += 1;
        reachableMissingBlockReferences.add(blockName);
      }
      return;
    }
    queue.push(blockName);
  };

  for (const record of records) {
    if (record.section !== "ENTITIES") continue;
    if (!isSourceRenderable(record, layers)) continue;
    inspectRenderableRecord(record, "model");
  }

  while (queue.length > 0) {
    const blockName = queue.shift();
    if (!blockName || reachableBlocks.has(blockName)) continue;
    reachableBlocks.add(blockName);
    for (const record of blockDefinitions.get(blockName) ?? []) {
      if (!isSourceRenderable(record, layers)) continue;
      inspectRenderableRecord(record, "block");
    }
  }

  const blockedUnsupportedTypes = [...new Set([...visibleUnsupportedTypes, ...reachableUnsupportedTypes])].sort();
  const blockedMissingBlockReferences = [
    ...new Set([...visibleMissingBlockReferences, ...reachableMissingBlockReferences]),
  ].sort();
  const blockedUnsupportedEntityCount = visibleModelUnsupportedEntityCount + reachableBlockUnsupportedEntityCount;

  return {
    visibleModelUnsupportedEntityCount,
    visibleModelUnsupportedTypes: [...visibleUnsupportedTypes].sort(),
    reachableBlockUnsupportedEntityCount,
    reachableBlockUnsupportedTypes: [...reachableUnsupportedTypes].sort(),
    blockedUnsupportedEntityCount,
    blockedUnsupportedTypes,
    visibleMissingBlockReferenceCount,
    visibleMissingBlockReferences: [...visibleMissingBlockReferences].sort(),
    reachableMissingBlockReferenceCount,
    reachableMissingBlockReferences: [...reachableMissingBlockReferences].sort(),
    blockedMissingBlockReferenceCount: visibleMissingBlockReferenceCount + reachableMissingBlockReferenceCount,
    blockedMissingBlockReferences,
    unsafeOcsEntityCount,
    unsafeOcsTypes: [...unsafeOcsTypes].sort(),
    reachableBlockCount: reachableBlocks.size,
    ignoredUnsupportedEntityCount: Math.max(0, totalUnsupportedEntityCount - blockedUnsupportedEntityCount),
  };
}

export function getDxfReleaseHardeningBlockingIssues(audit: DxfReleaseHardeningAudit): string[] {
  const issues: string[] = [];

  if (audit.blockedUnsupportedEntityCount > 0) {
    issues.push(
      `${audit.blockedUnsupportedEntityCount} görünür/erişilebilir entity mevcut renderer tarafından desteklenmiyor (${audit.blockedUnsupportedTypes.join(", ")}); sessiz bilgi kaybını önlemek için görüntüleme durduruldu.`
    );
  }

  if (audit.blockedMissingBlockReferenceCount > 0) {
    issues.push(
      `${audit.blockedMissingBlockReferenceCount} görünür/erişilebilir INSERT tanımsız BLOCK referansına sahip (${audit.blockedMissingBlockReferences.join(", ")}); eksik geometri başarı olarak gösterilemez.`
    );
  }

  if (audit.unsafeOcsEntityCount > 0) {
    issues.push(
      `${audit.unsafeOcsEntityCount} görünür/erişilebilir entity non-default extrusion/OCS kullanıyor (${audit.unsafeOcsTypes.join(", ")}); mevcut renderer yalnız sınırlı ±Z davranışına sahip olduğundan tam OCS dönüşümü kanıtlanmadan görüntüleme durduruldu.`
    );
  }

  return issues;
}
