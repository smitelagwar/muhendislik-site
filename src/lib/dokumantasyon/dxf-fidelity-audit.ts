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
  "HATCH",
]);

export const DXF_STAGE1_P0_ENTITY_TYPES = new Set([
  "TEXT",
  "MTEXT",
  "DIMENSION",
  "INSERT",
  "ATTRIB",
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
  paperSpaceEntityCount: number;
  textEntityCount: number;
  dimensionEntityCount: number;
  insertEntityCount: number;
  unsupportedEntityCount: number;
  unsupportedTypes: string[];
  entityCensus: DxfEntityCensusRow[];
  hasEntitiesSection: boolean;
  hasBlocksSection: boolean;
}

type Pair = { code: number; value: string };

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

function isPaperSpaceRecord(record: Pair[]): boolean {
  return record.some((pair) => pair.code === 67 && pair.value === "1");
}

export function auditDxfText(text: string): DxfFidelityAudit {
  const pairs = parsePairs(text);
  const entityCounts = new Map<string, number>();
  let section: string | null = null;
  let currentRecord: Pair[] = [];
  let currentType: string | null = null;
  let entityCount = 0;
  let blockEntityCount = 0;
  let paperSpaceEntityCount = 0;
  let hasEntitiesSection = false;
  let hasBlocksSection = false;

  const flushRecord = () => {
    if (!currentType) return;
    if (section !== "ENTITIES" && section !== "BLOCKS") return;
    if (DXF_STRUCTURAL_RECORD_TYPES.has(currentType)) return;

    increment(entityCounts, currentType);
    if (section === "ENTITIES") {
      entityCount += 1;
      if (isPaperSpaceRecord(currentRecord)) paperSpaceEntityCount += 1;
    } else {
      blockEntityCount += 1;
    }
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];

    if (pair.code === 0 && pair.value === "SECTION") {
      flushRecord();
      currentRecord = [];
      currentType = null;
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

  return {
    acadVersion: readHeaderVariable(pairs, "$ACADVER"),
    codePage: readHeaderVariable(pairs, "$DWGCODEPAGE"),
    entityCount,
    blockEntityCount,
    paperSpaceEntityCount,
    textEntityCount: countType("TEXT") + countType("MTEXT") + countType("ATTRIB") + countType("ATTDEF"),
    dimensionEntityCount: countType("DIMENSION"),
    insertEntityCount: countType("INSERT"),
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

  return warnings;
}
