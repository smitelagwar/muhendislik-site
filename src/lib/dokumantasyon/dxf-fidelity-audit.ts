export const DXF_VIEWER_SUPPORTED_ENTITY_TYPES = new Set([
  "LINE",
  "POLYLINE",
  "LWPOLYLINE",
  "ARC",
  "CIRCLE",
  "ELLIPSE",
  "POINT",
  "SPLINE",
  "INSERT",
  "TEXT",
  "MTEXT",
  "3DFACE",
  "SOLID",
  "DIMENSION",
  "ATTRIB",
  "ATTDEF",
  "HATCH",
]);

export const DXF_STAGE1_P0_ENTITY_TYPES = new Set([
  "TEXT",
  "MTEXT",
  "DIMENSION",
  "INSERT",
  "ATTRIB",
  "ATTDEF",
  "LINE",
  "POLYLINE",
  "LWPOLYLINE",
  "ARC",
  "CIRCLE",
  "ELLIPSE",
  "SPLINE",
  "HATCH",
]);

const DXF_STRUCTURAL_RECORD_TYPES = new Set(["BLOCK", "ENDBLK", "VERTEX", "SEQEND"]);
const EPSILON = 1e-9;

export interface DxfEntityCensusRow {
  type: string;
  count: number;
  rendererSupport: "supported" | "unsupported";
  priority: "p0" | "other";
}

export interface DxfFidelityAudit {
  acadVersion: string | null;
  codePage: string | null;
  entityCount: number;
  blockEntityCount: number;
  blockDefinitionCount: number;
  paperSpaceEntityCount: number;
  textEntityCount: number;
  dimensionEntityCount: number;
  insertEntityCount: number;
  nestedInsertCount: number;
  transformedInsertCount: number;
  mirroredInsertCount: number;
  nonUniformScaleInsertCount: number;
  arrayInsertCount: number;
  zeroScaleInsertCount: number;
  missingBlockReferenceCount: number;
  missingBlockReferences: string[];
  nonDefaultOcsEntityCount: number;
  nonDefaultOcsInsertCount: number;
  blockCycleCount: number;
  blockCycles: string[];
  unsupportedEntityCount: number;
  unsupportedTypes: string[];
  entityCensus: DxfEntityCensusRow[];
  hasEntitiesSection: boolean;
  hasBlocksSection: boolean;
}

type Pair = { code: number; value: string };
type InsertReference = { blockName: string; parentBlockName: string | null };

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];

  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[index + 1].trim() });
  }

  return pairs;
}

function readHeaderVariable(pairs: Pair[], variableName: string): string | null {
  for (let index = 0; index < pairs.length - 1; index += 1) {
    if (pairs[index].code === 9 && pairs[index].value === variableName) {
      const next = pairs[index + 1];
      return next?.value ?? null;
    }
  }
  return null;
}

function increment(map: Map<string, number>, type: string) {
  map.set(type, (map.get(type) ?? 0) + 1);
}

function valueForCode(record: Pair[], code: number): string | null {
  return record.find((pair) => pair.code === code)?.value ?? null;
}

function numberForCode(record: Pair[], code: number, fallback: number): number {
  const raw = valueForCode(record, code);
  if (raw === null) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function isPaperSpaceRecord(record: Pair[]): boolean {
  return record.some((pair) => pair.code === 67 && pair.value === "1");
}

function hasNonDefaultOcs(record: Pair[]): boolean {
  const hasExtrusion = record.some((pair) => pair.code === 210 || pair.code === 220 || pair.code === 230);
  if (!hasExtrusion) return false;
  const x = numberForCode(record, 210, 0);
  const y = numberForCode(record, 220, 0);
  const z = numberForCode(record, 230, 1);
  return Math.abs(x) > EPSILON || Math.abs(y) > EPSILON || Math.abs(z - 1) > EPSILON;
}

function findBlockCycles(insertReferences: InsertReference[]): string[] {
  const graph = new Map<string, Set<string>>();
  for (const reference of insertReferences) {
    if (!reference.parentBlockName) continue;
    let children = graph.get(reference.parentBlockName);
    if (!children) {
      children = new Set<string>();
      graph.set(reference.parentBlockName, children);
    }
    children.add(reference.blockName);
  }

  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const cycles = new Set<string>();

  const visit = (node: string) => {
    state.set(node, 1);
    stack.push(node);
    for (const child of graph.get(node) ?? []) {
      const childState = state.get(child) ?? 0;
      if (childState === 0) {
        visit(child);
      } else if (childState === 1) {
        const start = stack.lastIndexOf(child);
        if (start >= 0) cycles.add([...stack.slice(start), child].join(" → "));
      }
    }
    stack.pop();
    state.set(node, 2);
  };

  for (const node of graph.keys()) {
    if ((state.get(node) ?? 0) === 0) visit(node);
  }

  return [...cycles].sort();
}

export function auditDxfText(text: string): DxfFidelityAudit {
  const pairs = parsePairs(text);
  const entityCounts = new Map<string, number>();
  const blockDefinitions = new Set<string>();
  const insertReferences: InsertReference[] = [];
  let section: string | null = null;
  let currentRecord: Pair[] = [];
  let currentType: string | null = null;
  let currentBlockName: string | null = null;
  let entityCount = 0;
  let blockEntityCount = 0;
  let paperSpaceEntityCount = 0;
  let nestedInsertCount = 0;
  let transformedInsertCount = 0;
  let mirroredInsertCount = 0;
  let nonUniformScaleInsertCount = 0;
  let arrayInsertCount = 0;
  let zeroScaleInsertCount = 0;
  let nonDefaultOcsEntityCount = 0;
  let nonDefaultOcsInsertCount = 0;
  let hasEntitiesSection = false;
  let hasBlocksSection = false;

  const flushRecord = () => {
    if (!currentType) return;
    if (section !== "ENTITIES" && section !== "BLOCKS") return;

    if (section === "BLOCKS" && currentType === "BLOCK") {
      const name = valueForCode(currentRecord, 2) ?? valueForCode(currentRecord, 3);
      currentBlockName = name;
      if (name) blockDefinitions.add(name);
      return;
    }

    if (section === "BLOCKS" && currentType === "ENDBLK") {
      currentBlockName = null;
      return;
    }

    if (DXF_STRUCTURAL_RECORD_TYPES.has(currentType)) return;

    increment(entityCounts, currentType);
    if (section === "ENTITIES") {
      entityCount += 1;
      if (isPaperSpaceRecord(currentRecord)) paperSpaceEntityCount += 1;
    } else {
      blockEntityCount += 1;
    }

    const nonDefaultOcs = hasNonDefaultOcs(currentRecord);
    if (nonDefaultOcs) nonDefaultOcsEntityCount += 1;

    if (currentType === "INSERT") {
      const blockName = valueForCode(currentRecord, 2);
      if (blockName) insertReferences.push({ blockName, parentBlockName: section === "BLOCKS" ? currentBlockName : null });
      if (section === "BLOCKS" && currentBlockName !== null) nestedInsertCount += 1;
      if (nonDefaultOcs) nonDefaultOcsInsertCount += 1;

      const xScale = numberForCode(currentRecord, 41, 1);
      const yScale = numberForCode(currentRecord, 42, 1);
      const zScale = numberForCode(currentRecord, 43, 1);
      const rotation = numberForCode(currentRecord, 50, 0);
      const columnCount = Math.max(1, Math.trunc(numberForCode(currentRecord, 70, 1)));
      const rowCount = Math.max(1, Math.trunc(numberForCode(currentRecord, 71, 1)));

      if (
        Math.abs(xScale - 1) > EPSILON ||
        Math.abs(yScale - 1) > EPSILON ||
        Math.abs(zScale - 1) > EPSILON ||
        Math.abs(rotation) > EPSILON
      ) {
        transformedInsertCount += 1;
      }
      if (xScale < 0 || yScale < 0 || zScale < 0) mirroredInsertCount += 1;
      if (Math.abs(Math.abs(xScale) - Math.abs(yScale)) > EPSILON) nonUniformScaleInsertCount += 1;
      if (columnCount > 1 || rowCount > 1) arrayInsertCount += 1;
      if (Math.abs(xScale) <= EPSILON || Math.abs(yScale) <= EPSILON || Math.abs(zScale) <= EPSILON) zeroScaleInsertCount += 1;
    }
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];

    if (pair.code === 0 && pair.value === "SECTION") {
      flushRecord();
      currentRecord = [];
      currentType = null;
      currentBlockName = null;
      const sectionName = pairs[index + 1];
      if (sectionName?.code === 2) {
        section = sectionName.value;
        if (section === "ENTITIES") hasEntitiesSection = true;
        if (section === "BLOCKS") hasBlocksSection = true;
      }
      continue;
    }

    if (pair.code === 0 && pair.value === "ENDSEC") {
      flushRecord();
      currentRecord = [];
      currentType = null;
      currentBlockName = null;
      section = null;
      continue;
    }

    if ((section === "ENTITIES" || section === "BLOCKS") && pair.code === 0) {
      flushRecord();
      currentType = pair.value.toUpperCase();
      currentRecord = [pair];
      continue;
    }

    if (currentType) currentRecord.push(pair);
  }
  flushRecord();

  const entityCensus = [...entityCounts.entries()]
    .map(([type, count]): DxfEntityCensusRow => ({
      type,
      count,
      rendererSupport: DXF_VIEWER_SUPPORTED_ENTITY_TYPES.has(type) ? "supported" : "unsupported",
      priority: DXF_STAGE1_P0_ENTITY_TYPES.has(type) ? "p0" : "other",
    }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  const unsupportedRows = entityCensus.filter((row) => row.rendererSupport === "unsupported");
  const countType = (type: string) => entityCounts.get(type) ?? 0;
  const missingInsertReferences = insertReferences.filter((reference) => !blockDefinitions.has(reference.blockName));
  const missingBlockReferences = [...new Set(missingInsertReferences.map((reference) => reference.blockName))].sort();
  const blockCycles = findBlockCycles(insertReferences);

  return {
    acadVersion: readHeaderVariable(pairs, "$ACADVER"),
    codePage: readHeaderVariable(pairs, "$DWGCODEPAGE"),
    entityCount,
    blockEntityCount,
    blockDefinitionCount: blockDefinitions.size,
    paperSpaceEntityCount,
    textEntityCount: countType("TEXT") + countType("MTEXT") + countType("ATTRIB") + countType("ATTDEF"),
    dimensionEntityCount: countType("DIMENSION"),
    insertEntityCount: countType("INSERT"),
    nestedInsertCount,
    transformedInsertCount,
    mirroredInsertCount,
    nonUniformScaleInsertCount,
    arrayInsertCount,
    zeroScaleInsertCount,
    missingBlockReferenceCount: missingInsertReferences.length,
    missingBlockReferences,
    nonDefaultOcsEntityCount,
    nonDefaultOcsInsertCount,
    blockCycleCount: blockCycles.length,
    blockCycles,
    unsupportedEntityCount: unsupportedRows.reduce((total, row) => total + row.count, 0),
    unsupportedTypes: unsupportedRows.map((row) => row.type),
    entityCensus,
    hasEntitiesSection,
    hasBlocksSection,
  };
}

export function getDxfFidelityWarnings(audit: DxfFidelityAudit): string[] {
  const warnings: string[] = [];

  if (!audit.hasEntitiesSection) warnings.push("ENTITIES bölümü bulunamadı.");
  if (audit.entityCount === 0 && audit.blockEntityCount === 0) warnings.push("Render edilebilir entity bulunamadı.");
  if (audit.unsupportedEntityCount > 0) {
    warnings.push(
      `${audit.unsupportedEntityCount} entity mevcut renderer tarafından doğrudan desteklenmiyor: ${audit.unsupportedTypes.join(", ")}.`
    );
  }
  if (audit.paperSpaceEntityCount > 0) {
    warnings.push(`${audit.paperSpaceEntityCount} entity paper space içinde; görünüm ayrıca doğrulanmalı.`);
  }
  if (audit.missingBlockReferenceCount > 0) {
    warnings.push(
      `${audit.missingBlockReferenceCount} INSERT tanımsız block referansına sahip: ${audit.missingBlockReferences.join(", ")}.`
    );
  }
  if (audit.zeroScaleInsertCount > 0) {
    warnings.push(`${audit.zeroScaleInsertCount} INSERT sıfır ölçek içeriyor; geometri görünmeyebilir.`);
  }
  if (audit.nestedInsertCount > 0) {
    warnings.push(`${audit.nestedInsertCount} nested INSERT bulundu; block dönüşüm zinciri doğrulanmalı.`);
  }
  if (audit.mirroredInsertCount > 0 || audit.nonUniformScaleInsertCount > 0 || audit.arrayInsertCount > 0) {
    warnings.push(
      `Riskli INSERT dönüşümleri: ${audit.mirroredInsertCount} mirrored, ${audit.nonUniformScaleInsertCount} non-uniform scale, ${audit.arrayInsertCount} array.`
    );
  }
  if (audit.nonDefaultOcsEntityCount > 0) {
    warnings.push(`${audit.nonDefaultOcsEntityCount} entity non-default extrusion/OCS kullanıyor; tam OCS sadakati doğrulanmalı.`);
  }
  if (audit.blockCycleCount > 0) {
    warnings.push(`Recursive block zinciri bulundu: ${audit.blockCycles.join("; ")}.`);
  }

  return warnings;
}

export function getDxfStage2BlockingIssues(audit: DxfFidelityAudit): string[] {
  const issues: string[] = [];

  if (audit.blockCycleCount > 0) {
    issues.push(`Dolaylı recursive BLOCK/INSERT zinciri mevcut (${audit.blockCycles.join("; ")}); mevcut renderer bu topolojiyi güvenli işleyemez.`);
  }
  if (audit.arrayInsertCount > 0) {
    issues.push(`${audit.arrayInsertCount} grid/array INSERT bulundu; mevcut renderer MINSERT/grid instancing'i eksiksiz render etmiyor.`);
  }
  if (audit.nonDefaultOcsInsertCount > 0) {
    issues.push(`${audit.nonDefaultOcsInsertCount} INSERT non-default extrusion/OCS kullanıyor; mevcut renderer INSERT extrusion dönüşümünü uygulamıyor.`);
  }

  return issues;
}
