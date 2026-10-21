import type { UnsupportedBlockEntityCandidate } from "../canonical/diagnostics";

export interface DxfExternalReferenceEntity {
  entityType: "IMAGE" | "PDFUNDERLAY" | "DWFUNDERLAY" | "DGNUNDERLAY" | "OLE2FRAME" | "OLEFRAME";
  entityHandle?: string;
  section: "ENTITIES" | "BLOCKS";
  blockName?: string;
  isPaperSpace: boolean;
  visible: boolean;
  sourceOrder: bigint;
}

const EXTERNAL_REFERENCE_TYPES = new Set<DxfExternalReferenceEntity["entityType"]>([
  "IMAGE", "PDFUNDERLAY", "DWFUNDERLAY", "DGNUNDERLAY", "OLE2FRAME", "OLEFRAME",
]);

const upper = (value: unknown) => String(value ?? "").trim().toUpperCase();

/**
 * Preserve companion-backed entity records that the database converter drops
 * before its entity iterator. This emits diagnostics only; it never fabricates
 * raster, underlay, or OLE geometry from incomplete external data.
 */
export async function parseDxfExternalReferenceEntities(input: Buffer | Uint8Array): Promise<DxfExternalReferenceEntity[]> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const records: DxfExternalReferenceEntity[] = [];
  let section = "";
  let awaitingSectionName = false;
  let recordType = "";
  let recordPairs: Array<{ code: number; value: string }> = [];
  let blockName = "";
  let sourceOrder = BigInt(0);

  const firstValue = (code: number) => recordPairs.find((pair) => pair.code === code)?.value;
  const numericValue = (code: number, fallback = 0) => {
    const parsed = Number(firstValue(code));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const flushRecord = () => {
    if ((section !== "ENTITIES" && section !== "BLOCKS") || !EXTERNAL_REFERENCE_TYPES.has(recordType as DxfExternalReferenceEntity["entityType"])) {
      return;
    }
    sourceOrder += BigInt(1);
    const normalizedBlockName = section === "BLOCKS" ? blockName : undefined;
    const layoutName = upper(firstValue(410));
    records.push({
      entityType: recordType as DxfExternalReferenceEntity["entityType"],
      entityHandle: upper(firstValue(5)) || undefined,
      section,
      ...(normalizedBlockName ? { blockName: normalizedBlockName } : {}),
      isPaperSpace: section === "BLOCKS"
        ? normalizedBlockName?.toUpperCase().startsWith("*PAPER_SPACE") === true || (layoutName.length > 0 && layoutName !== "MODEL")
        : numericValue(67) === 1 || (layoutName.length > 0 && layoutName !== "MODEL"),
      visible: numericValue(60) === 0,
      sourceOrder,
    });
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flushRecord();
      recordType = upper(pair.value);
      recordPairs = [];
      if (recordType === "SECTION") {
        awaitingSectionName = true;
        continue;
      }
      if (recordType === "ENDSEC") {
        section = "";
        blockName = "";
        continue;
      }
      if (recordType === "BLOCK") blockName = "";
      continue;
    }
    const value = String(pair.value ?? "");
    if (awaitingSectionName && pair.code === 2) {
      section = upper(value);
      awaitingSectionName = false;
      continue;
    }
    if (section === "BLOCKS" && recordType === "BLOCK" && pair.code === 2) {
      blockName = value.trim();
    }
    recordPairs.push({ code: pair.code, value });
  }
  flushRecord();
  return records;
}

export function toDxfUnsupportedBlockCandidate(record: DxfExternalReferenceEntity): UnsupportedBlockEntityCandidate | undefined {
  if (record.section !== "BLOCKS" || !record.blockName) return undefined;
  return {
    blockName: record.blockName,
    entityType: record.entityType,
    entityHandle: record.entityHandle,
    sourceOrder: record.sourceOrder,
    isPaperSpace: record.isPaperSpace,
    visible: record.visible,
  };
}
