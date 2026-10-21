import type { CadAttribEntity, CadBlockDefinition, CadColor, CadDiagnostic, CadEntity } from "../canonical/types";

type Pair = { code: number; value: string };
type RawRecord = { type: string; pairs: Pair[] };

export interface DxfAttributeInsertRecord {
  sourceHandle?: string;
  blockName: string;
  /** Containing BLOCK definition when this INSERT is nested in the BLOCKS section. */
  ownerBlockName?: string;
  attributes: Record<string, string>;
  attributeEntities: DxfAttributeInstanceRecord[];
}

export interface DxfAttributeInstanceRecord {
  sourceHandle?: string;
  tag: string;
  text: string;
  layer: string;
  color?: CadColor;
  linetype?: string;
  lineweightMm?: number;
  insertionPoint?: [number, number];
  alignmentPoint?: [number, number];
  height: number;
  rotationRad: number;
  widthFactor: number;
  obliqueRad: number;
  styleName: string;
  horizontalMode?: number;
  verticalMode?: number;
  isInvisible: boolean;
  isConstant: boolean;
  geometryUnsupportedReason?: string;
}

export interface DxfAttributeDefinitionRecord {
  tag: string;
  defaultText: string;
  flags: number;
  insertionPoint?: [number, number];
  alignmentPoint?: [number, number];
  horizontalMode?: number;
  verticalMode?: number;
}

export interface DxfUnsupportedAnnotationRecord {
  entityType: "MLEADER" | "MULTILEADER";
  sourceHandle?: string;
}

export interface DxfAttributePairRecords {
  inserts: DxfAttributeInsertRecord[];
  blockInserts: DxfAttributeInsertRecord[];
  definitionsByBlock: Map<string, DxfAttributeDefinitionRecord[]>;
  unsupportedAnnotations: DxfUnsupportedAnnotationRecord[];
}

const upper = (value: unknown) => String(value ?? "").trim().toUpperCase();
const pairValue = (record: RawRecord, code: number) => record.pairs.find((pair) => pair.code === code)?.value;
const optionalPairNumber = (record: RawRecord, code: number) => {
  const raw = pairValue(record, code);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};
const pairPoint = (record: RawRecord, xCode: number, yCode: number): [number, number] | undefined => {
  const x = optionalPairNumber(record, xCode);
  const y = optionalPairNumber(record, yCode);
  return x !== undefined && y !== undefined ? [x, y] : undefined;
};
const pairNumber = (record: RawRecord, code: number, fallback = 0) => {
  const raw = pairValue(record, code);
  const value = raw === undefined ? fallback : Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

function parseAttributeInstance(record: RawRecord): DxfAttributeInstanceRecord | undefined {
  const tag = String(pairValue(record, 2) || "").trim();
  if (!tag) return undefined;

  const flags = pairNumber(record, 70);
  const insertionPoint = pairPoint(record, 10, 20);
  const alignmentPoint = pairPoint(record, 11, 21);
  const extrusion = [
    optionalPairNumber(record, 210) ?? 0,
    optionalPairNumber(record, 220) ?? 0,
    optionalPairNumber(record, 230) ?? 1,
  ];
  const horizontalMode = optionalPairNumber(record, 72);
  const verticalMode = optionalPairNumber(record, 74);
  const unsupportedReasons: string[] = [];
  if (Math.abs(extrusion[0]!) > 1e-9 || Math.abs(extrusion[1]!) > 1e-9 || Math.abs(extrusion[2]! - 1) > 1e-9) {
    unsupportedReasons.push("ATTRIB uses a non-default extrusion direction");
  }
  if (!insertionPoint) unsupportedReasons.push("ATTRIB has no finite insertion point");
  if (((horizontalMode ?? 0) !== 0 || (verticalMode ?? 0) !== 0) && !alignmentPoint) {
    unsupportedReasons.push("justified ATTRIB has no finite alignment point");
  }

  const trueColor = optionalPairNumber(record, 420);
  const colorIndex = optionalPairNumber(record, 62);
  const color: CadColor | undefined = trueColor !== undefined
    ? {
        method: "rgb",
        rgb: [(trueColor >> 16) & 0xff, (trueColor >> 8) & 0xff, trueColor & 0xff],
      }
    : colorIndex !== undefined
      ? colorIndex === 0
        ? { method: "byBlock" }
        : colorIndex === 256
          ? { method: "byLayer" }
          : { method: "aci", aci: colorIndex }
      : undefined;
  const rawLineweight = optionalPairNumber(record, 370);

  return {
    sourceHandle: String(pairValue(record, 5) || "").trim().toUpperCase() || undefined,
    tag,
    text: String(pairValue(record, 1) ?? ""),
    layer: String(pairValue(record, 8) || "0").trim() || "0",
    color,
    linetype: String(pairValue(record, 6) || "").trim() || undefined,
    lineweightMm: rawLineweight !== undefined && rawLineweight >= 0 ? rawLineweight / 100 : undefined,
    insertionPoint,
    alignmentPoint,
    height: pairNumber(record, 40, 2.5),
    rotationRad: pairNumber(record, 50) * Math.PI / 180,
    widthFactor: pairNumber(record, 41, 1),
    obliqueRad: pairNumber(record, 51) * Math.PI / 180,
    styleName: String(pairValue(record, 7) || "STANDARD").trim() || "STANDARD",
    horizontalMode,
    verticalMode,
    isInvisible: (flags & 1) !== 0,
    isConstant: (flags & 2) !== 0,
    ...(unsupportedReasons.length > 0 ? { geometryUnsupportedReason: unsupportedReasons.join("; ") } : {}),
  };
}

/** Preserve INSERT-owned ATTRIB values and source ATTDEF fields omitted by the entity iterator. */
export async function parseDxfAttributePairRecords(input: Buffer | Uint8Array): Promise<DxfAttributePairRecords> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const inserts: DxfAttributeInsertRecord[] = [];
  const blockInserts: DxfAttributeInsertRecord[] = [];
  const definitionsByBlock = new Map<string, DxfAttributeDefinitionRecord[]>();
  const unsupportedAnnotations: DxfUnsupportedAnnotationRecord[] = [];

  let section = "";
  let awaitingSectionName = false;
  let currentRecord: RawRecord | undefined;
  let blockName = "";
  let pendingInsert: { record: DxfAttributeInsertRecord; collectAttributes: boolean } | undefined;

  const flushRecord = () => {
    if (!currentRecord) return;
    const record = currentRecord;
    currentRecord = undefined;

    if ((section === "ENTITIES" || section === "BLOCKS") && (record.type === "MLEADER" || record.type === "MULTILEADER")) {
      unsupportedAnnotations.push({
        entityType: record.type,
        sourceHandle: String(pairValue(record, 5) || "").trim().toUpperCase() || undefined,
      });
    }

    if (section === "BLOCKS") {
      if (record.type === "BLOCK") {
        blockName = String(pairValue(record, 2) || "").trim();
        pendingInsert = undefined;
      } else if (record.type === "ENDBLK") {
        blockName = "";
        pendingInsert = undefined;
      } else if (record.type === "ATTDEF" && blockName) {
        const definitions = definitionsByBlock.get(blockName) || [];
        definitions.push({
          tag: String(pairValue(record, 2) || "").trim(),
          defaultText: String(pairValue(record, 1) ?? ""),
          flags: pairNumber(record, 70),
          insertionPoint: pairPoint(record, 10, 20),
          alignmentPoint: pairPoint(record, 11, 21),
          horizontalMode: optionalPairNumber(record, 72),
          verticalMode: optionalPairNumber(record, 74),
        });
        definitionsByBlock.set(blockName, definitions);
      } else if (record.type === "INSERT" && blockName) {
        const insert: DxfAttributeInsertRecord = {
          sourceHandle: String(pairValue(record, 5) || "").trim().toUpperCase() || undefined,
          blockName: String(pairValue(record, 2) || "").trim(),
          ownerBlockName: blockName,
          attributes: {},
          attributeEntities: [],
        };
        blockInserts.push(insert);
        pendingInsert = { record: insert, collectAttributes: true };
      } else if (record.type === "ATTRIB" && pendingInsert?.collectAttributes) {
        const attribute = parseAttributeInstance(record);
        if (attribute) {
          pendingInsert.record.attributes[attribute.tag] = attribute.text;
          pendingInsert.record.attributeEntities.push(attribute);
        }
      } else if (record.type === "SEQEND") {
        pendingInsert = undefined;
      } else {
        pendingInsert = undefined;
      }
      return;
    }

    if (section !== "ENTITIES") return;
    if (record.type === "INSERT") {
      const paperSpace = pairNumber(record, 67) === 1;
      const layoutName = String(pairValue(record, 410) || "").trim();
      const isModelSpace = !paperSpace && (!layoutName || layoutName.toUpperCase() === "MODEL");
      const insert: DxfAttributeInsertRecord = {
        sourceHandle: String(pairValue(record, 5) || "").trim().toUpperCase() || undefined,
        blockName: String(pairValue(record, 2) || "").trim(),
        attributes: {},
        attributeEntities: [],
      };
      if (isModelSpace) inserts.push(insert);
      pendingInsert = { record: insert, collectAttributes: isModelSpace };
      return;
    }
    if (record.type === "ATTRIB" && pendingInsert) {
      if (pendingInsert.collectAttributes) {
        const attribute = parseAttributeInstance(record);
        if (attribute) {
          pendingInsert.record.attributes[attribute.tag] = attribute.text;
          pendingInsert.record.attributeEntities.push(attribute);
        }
      }
      return;
    }
    if (record.type === "SEQEND") {
      pendingInsert = undefined;
      return;
    }
    pendingInsert = undefined;
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flushRecord();
      const type = upper(pair.value);
      if (type === "SECTION") {
        awaitingSectionName = true;
        continue;
      }
      if (type === "ENDSEC") {
        section = "";
        blockName = "";
        pendingInsert = undefined;
        continue;
      }
      currentRecord = { type, pairs: [] };
      continue;
    }

    const value = String(pair.value);
    if (awaitingSectionName && pair.code === 2) {
      section = upper(value);
      awaitingSectionName = false;
      continue;
    }
    currentRecord?.pairs.push({ code: pair.code, value });
  }
  flushRecord();
  return { inserts, blockInserts, definitionsByBlock, unsupportedAnnotations };
}

/** Merge only unambiguous source-order fallbacks when a decoder omits DXF handles. */
export function applyDxfAttributePairRecords(
  modelSpaceEntities: CadEntity[],
  blocks: Record<string, CadBlockDefinition>,
  records: DxfAttributePairRecords,
  diagnostics: CadDiagnostic[],
): void {
  const bindInsert = (
    source: DxfAttributeInsertRecord,
    target: Extract<CadEntity, { type: "INSERT" }> | undefined,
    sourceIndex: number,
    scope: string,
  ) => {
    if (!target) {
      if (Object.keys(source.attributes).length > 0 || source.attributeEntities.length > 0) {
        const sourceKey = source.sourceHandle || `${scope}_${sourceIndex + 1}`;
        diagnostics.push({
          id: `diag_dxf_insert_attrib_unresolved_${sourceKey}`,
          code: "UNRESOLVED_DXF_INSERT_ATTRIBUTES",
          severity: "warning",
          message: `DXF INSERT ${source.sourceHandle || sourceIndex + 1} ATTRIB values could not be joined to one canonical INSERT in ${scope}; values were not guessed.`,
          entityHandle: source.sourceHandle,
        });
      }
      return;
    }

    if (source.blockName) target.blockName = source.blockName;
    if (Object.keys(source.attributes).length > 0) {
      target.attributes = { ...target.attributes, ...source.attributes };
    }
    if (source.attributeEntities.length > 0) {
      const converted: CadAttribEntity[] = [];
      source.attributeEntities.forEach((attribute, index) => {
        if (attribute.geometryUnsupportedReason || !attribute.insertionPoint) {
          const diagnosticHandle = attribute.sourceHandle || String(source.sourceHandle || sourceIndex + 1) + "_" + String(index + 1);
          diagnostics.push({
            id: "diag_dxf_attrib_geometry_" + diagnosticHandle,
            code: "UNSUPPORTED_ATTRIBUTE_INSTANCE_GEOMETRY",
            severity: "warning",
            message: "DXF ATTRIB " + (attribute.sourceHandle || attribute.tag) + " was bound by tag/value, but its source placement could not be represented safely: " + (attribute.geometryUnsupportedReason || "missing insertion point") + ". The ATTDEF fallback is used.",
            entityHandle: attribute.sourceHandle || source.sourceHandle,
          });
          return;
        }
        converted.push({
          handle: attribute.sourceHandle || target.handle + ":ATTRIB:" + String(index + 1),
          type: "ATTRIB",
          layer: attribute.layer || target.layer,
          color: attribute.color,
          linetype: attribute.linetype,
          lineweightMm: attribute.lineweightMm,
          order: target.order,
          tag: attribute.tag,
          text: attribute.text,
          insertionPoint: attribute.insertionPoint,
          alignmentPoint: attribute.alignmentPoint,
          height: attribute.height,
          rotationRad: attribute.rotationRad,
          widthFactor: attribute.widthFactor,
          obliqueRad: attribute.obliqueRad,
          styleName: attribute.styleName,
          horizontalMode: attribute.horizontalMode,
          verticalMode: attribute.verticalMode,
          isInvisible: attribute.isInvisible,
          isConstant: attribute.isConstant,
        });
      });
      if (converted.length > 0) target.attributeEntities = converted;
    }
  };

  const bindSourceScope = (
    sourceInserts: DxfAttributeInsertRecord[],
    entities: CadEntity[],
    scope: string,
    allowOrdinalFallback: boolean,
  ) => {
    const canonicalInserts = entities.filter((entity): entity is Extract<CadEntity, { type: "INSERT" }> => entity.type === "INSERT");
    const matched = new Set<Extract<CadEntity, { type: "INSERT" }>>();
    const useOrdinalFallback = allowOrdinalFallback && canonicalInserts.length === sourceInserts.length;

    sourceInserts.forEach((source, sourceIndex) => {
      let target = source.sourceHandle
        ? canonicalInserts.find((entity) => {
            const canonicalSourceHandle = String(entity.sourceHandle ?? "").trim().toUpperCase();
            const canonicalHandle = String(entity.handle ?? "").trim().toUpperCase();
            return (canonicalSourceHandle === source.sourceHandle
              || (!canonicalSourceHandle && canonicalHandle === source.sourceHandle)) && !matched.has(entity);
          })
        : undefined;
      if (!target && !source.sourceHandle && useOrdinalFallback) {
        const candidate = canonicalInserts[sourceIndex];
        if (candidate && !matched.has(candidate)) target = candidate;
      }
      if (target) matched.add(target);
      bindInsert(source, target, sourceIndex, scope);
    });
  };

  bindSourceScope(records.inserts, modelSpaceEntities, "modelSpace", true);

  const blockSourceGroups = new Map<string, DxfAttributeInsertRecord[]>();
  for (const source of records.blockInserts) {
    const ownerBlockName = String(source.ownerBlockName || "").trim();
    if (!ownerBlockName) continue;
    const group = blockSourceGroups.get(ownerBlockName) || [];
    group.push(source);
    blockSourceGroups.set(ownerBlockName, group);
  }
  for (const [ownerBlockName, sourceInserts] of blockSourceGroups) {
    const block = blocks[ownerBlockName]
      || Object.entries(blocks).find(([name]) => name.toUpperCase() === ownerBlockName.toUpperCase())?.[1];
    if (!block) {
      sourceInserts.forEach((source, index) => bindInsert(source, undefined, index, `BLOCKS:${ownerBlockName}`));
      continue;
    }
    // Nested block INSERTs require exact source handles; source order can include
    // unsupported/filtered entities and is not a safe identity fallback.
    bindSourceScope(sourceInserts, block.entities, `BLOCKS:${ownerBlockName}`, false);
  }

  records.unsupportedAnnotations.forEach((source, index) => {
    diagnostics.push({
      id: `diag_dxf_unsupported_mleader_${source.sourceHandle || index + 1}`,
      code: "UNSUPPORTED_ENTITY_TYPE",
      severity: "warning",
      message: `DXF ${source.entityType} entity is unsupported by the 2D renderer and was omitted with an explicit entity diagnostic.`,
      entityHandle: source.sourceHandle,
    });
  });

  for (const [sourceBlockName, sourceDefinitions] of records.definitionsByBlock) {
    const block = blocks[sourceBlockName]
      || Object.entries(blocks).find(([name]) => name.toUpperCase() === sourceBlockName.toUpperCase())?.[1];
    if (!block) continue;
    const canonicalDefinitions = block.entities.filter((entity) => entity.type === "ATTDEF");
    if (canonicalDefinitions.length !== sourceDefinitions.length) continue;

    canonicalDefinitions.forEach((entity, index) => {
      if (entity.type !== "ATTDEF") return;
      const source = sourceDefinitions[index];
      if (!source) return;
      if (source.tag) entity.tag = source.tag;
      entity.defaultText = source.defaultText;
      if (source.insertionPoint) entity.insertionPoint = source.insertionPoint;
      if (source.alignmentPoint) entity.alignmentPoint = source.alignmentPoint;
      if (source.horizontalMode !== undefined) entity.horizontalMode = source.horizontalMode;
      if (source.verticalMode !== undefined) entity.verticalMode = source.verticalMode;
      entity.isInvisible = (source.flags & 1) !== 0;
      entity.isConstant = (source.flags & 2) !== 0;
    });
  }
}
