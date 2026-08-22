const ORIGINAL_TEXT_TYPE_KEY = "__dxfFidelityOriginalType";
const STAGE2_REPORT_KEY = "__dxfTextStage2";
const SYNTHETIC_INSERT_PREFIX = "__dxf_viewer_insert_";
const EPSILON = 1e-9;

export type DxfTextStage2Entity = {
  type?: unknown;
  handle?: unknown;
  ownerHandle?: unknown;
  name?: unknown;
  layer?: unknown;
  color?: unknown;
  colorIndex?: unknown;
  text?: unknown;
  tag?: unknown;
  textStyle?: unknown;
  styleName?: unknown;
  textHeight?: unknown;
  scale?: unknown;
  xScale?: unknown;
  startPoint?: unknown;
  endPoint?: unknown;
  rotation?: unknown;
  horizontalJustification?: unknown;
  verticalJustification?: unknown;
  halign?: unknown;
  valign?: unknown;
  hidden?: unknown;
  constant?: unknown;
  obliqueAngle?: unknown;
  backwards?: unknown;
  mirrored?: unknown;
  [ORIGINAL_TEXT_TYPE_KEY]?: string;
  [key: string]: unknown;
};

export type DxfTextStage2Block = {
  entities?: DxfTextStage2Entity[];
  [key: string]: unknown;
};

export type DxfTextStage2ParsedDxf = {
  entities?: DxfTextStage2Entity[];
  blocks?: Record<string, DxfTextStage2Block>;
  [STAGE2_REPORT_KEY]?: DxfTextStage2Report;
  [key: string]: unknown;
};

export interface DxfTextStage2Report {
  syntheticInsertHandleCount: number;
  repairedAttribOwnerCount: number;
  unresolvedAttribOwnerCount: number;
  convertedAttribCount: number;
  constantAttdefCount: number;
  promotedConstantAttdefCount: number;
  variableAttdefCount: number;
  nonUnitAttributeWidthFactorCount: number;
  constantAttributeConflictCount: number;
  unsupportedObliqueAttributeCount: number;
  unsupportedMirroredConstantAttdefCount: number;
  warnings: string[];
  blockingIssues: string[];
}

function normalizedType(entity: DxfTextStage2Entity): string {
  return String(entity.type ?? "").trim().toUpperCase();
}

function normalizedHandle(value: unknown): string | null {
  const handle = String(value ?? "").trim();
  return handle || null;
}

function normalizedName(value: unknown): string | null {
  const name = String(value ?? "").trim();
  return name || null;
}

function normalizedTag(value: unknown): string | null {
  const tag = String(value ?? "").trim();
  return tag ? tag.toUpperCase() : null;
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(number) ? number : null;
}

function isNonZero(value: unknown): boolean {
  const number = finiteNumber(value);
  return number !== null && Math.abs(number) > EPSILON;
}

function entityArrays(dxf: DxfTextStage2ParsedDxf): DxfTextStage2Entity[][] {
  const arrays: DxfTextStage2Entity[][] = [];
  if (Array.isArray(dxf.entities)) arrays.push(dxf.entities);
  for (const block of Object.values(dxf.blocks ?? {})) {
    if (Array.isArray(block?.entities)) arrays.push(block.entities);
  }
  return arrays;
}

function copyInsertAppearance(target: DxfTextStage2Entity, insert: DxfTextStage2Entity | null) {
  if (!insert) return;
  // Mirrors the upstream ATTRIB path, which resolves layer/color from the owning INSERT when it can.
  if (insert.layer !== undefined) target.layer = insert.layer;
  if (insert.color !== undefined) target.color = insert.color;
  if (insert.colorIndex !== undefined) target.colorIndex = insert.colorIndex;
}

function convertAttributeLikeToText(entity: DxfTextStage2Entity, originalType: "ATTRIB" | "ATTDEF") {
  entity[ORIGINAL_TEXT_TYPE_KEY] = originalType;
  entity.type = "TEXT";
  if (entity.textStyle !== undefined && entity.styleName === undefined) entity.styleName = entity.textStyle;
  if (entity.scale !== undefined && entity.xScale === undefined) entity.xScale = entity.scale;
  if (entity.horizontalJustification !== undefined && entity.halign === undefined) {
    entity.halign = entity.horizontalJustification;
  }
  if (entity.verticalJustification !== undefined && entity.valign === undefined) {
    entity.valign = entity.verticalJustification;
  }
}

function buildBlockAttdefIndex(dxf: DxfTextStage2ParsedDxf) {
  const result = new Map<string, Map<string, DxfTextStage2Entity>>();
  for (const [blockName, block] of Object.entries(dxf.blocks ?? {})) {
    const byTag = new Map<string, DxfTextStage2Entity>();
    for (const entity of block?.entities ?? []) {
      if (normalizedType(entity) !== "ATTDEF") continue;
      const tag = normalizedTag(entity.tag);
      if (tag) byTag.set(tag, entity);
    }
    result.set(blockName, byTag);
  }
  return result;
}

export function originalDxfTextType(entity: DxfTextStage2Entity): string {
  return String(entity[ORIGINAL_TEXT_TYPE_KEY] ?? entity.type ?? "").trim().toUpperCase();
}

export function normalizeParsedDxfTextStage2(dxf: DxfTextStage2ParsedDxf): DxfTextStage2Report {
  const report: DxfTextStage2Report = {
    syntheticInsertHandleCount: 0,
    repairedAttribOwnerCount: 0,
    unresolvedAttribOwnerCount: 0,
    convertedAttribCount: 0,
    constantAttdefCount: 0,
    promotedConstantAttdefCount: 0,
    variableAttdefCount: 0,
    nonUnitAttributeWidthFactorCount: 0,
    constantAttributeConflictCount: 0,
    unsupportedObliqueAttributeCount: 0,
    unsupportedMirroredConstantAttdefCount: 0,
    warnings: [],
    blockingIssues: [],
  };

  const arrays = entityArrays(dxf);
  let syntheticSequence = 0;

  // Upstream stores INSERTs in a map keyed by handle. A missing handle otherwise becomes the
  // JavaScript `undefined` key, so multiple handle-less INSERTs overwrite each other. Give only the
  // temporary parsed/render copy deterministic synthetic handles.
  for (const entities of arrays) {
    for (const entity of entities) {
      if (normalizedType(entity) !== "INSERT") continue;
      if (normalizedHandle(entity.handle)) continue;
      entity.handle = `${SYNTHETIC_INSERT_PREFIX}${syntheticSequence++}`;
      report.syntheticInsertHandleCount += 1;
    }
  }

  const insertsByHandle = new Map<string, DxfTextStage2Entity>();
  for (const entities of arrays) {
    for (const entity of entities) {
      if (normalizedType(entity) !== "INSERT") continue;
      const handle = normalizedHandle(entity.handle);
      if (handle) insertsByHandle.set(handle, entity);
    }
  }

  const blockAttdefs = buildBlockAttdefIndex(dxf);

  // Repair ATTRIB ownership from standard DXF sequence ordering when owner handle is missing or
  // unusable. This is intentionally worker-local and never rewrites the uploaded/original file.
  for (const entities of arrays) {
    let sequenceInsert: DxfTextStage2Entity | null = null;
    for (const entity of entities) {
      const type = normalizedType(entity);
      if (type === "INSERT") {
        sequenceInsert = entity;
        continue;
      }
      if (type !== "ATTRIB") {
        sequenceInsert = null;
        continue;
      }

      const explicitOwner = normalizedHandle(entity.ownerHandle);
      let owningInsert = explicitOwner ? insertsByHandle.get(explicitOwner) ?? null : null;
      if (!owningInsert && sequenceInsert) {
        entity.ownerHandle = sequenceInsert.handle;
        owningInsert = sequenceInsert;
        report.repairedAttribOwnerCount += 1;
      } else if (!owningInsert) {
        report.unresolvedAttribOwnerCount += 1;
      }

      const widthFactor = finiteNumber(entity.scale);
      if (widthFactor !== null && Math.abs(widthFactor - 1) > EPSILON) {
        report.nonUnitAttributeWidthFactorCount += 1;
      }
      if (isNonZero(entity.obliqueAngle)) report.unsupportedObliqueAttributeCount += 1;

      if (owningInsert) {
        const blockName = normalizedName(owningInsert.name);
        const tag = normalizedTag(entity.tag);
        const attdef = blockName && tag ? blockAttdefs.get(blockName)?.get(tag) ?? null : null;
        if (attdef?.constant === true) report.constantAttributeConflictCount += 1;
      }

      copyInsertAppearance(entity, owningInsert);
      convertAttributeLikeToText(entity, "ATTRIB");
      report.convertedAttribCount += 1;
    }
  }

  // Non-constant ATTDEF is a definition, not another visible text instance: the corresponding
  // ATTRIB carries the per-INSERT value. Constant ATTDEF has no per-instance ATTRIB in normal DXF,
  // so promote only that class to block-local TEXT. Upstream will then instance it with the block.
  for (const block of Object.values(dxf.blocks ?? {})) {
    for (const entity of block?.entities ?? []) {
      if (normalizedType(entity) !== "ATTDEF") continue;
      if (entity.constant === true) {
        report.constantAttdefCount += 1;
        if (isNonZero(entity.obliqueAngle)) report.unsupportedObliqueAttributeCount += 1;
        if (entity.backwards === true || entity.mirrored === true) {
          report.unsupportedMirroredConstantAttdefCount += 1;
        }
        convertAttributeLikeToText(entity, "ATTDEF");
        report.promotedConstantAttdefCount += 1;
      } else {
        report.variableAttdefCount += 1;
      }
    }
  }

  if (report.syntheticInsertHandleCount > 0) {
    report.warnings.push(`${report.syntheticInsertHandleCount} INSERT için geçici renderer handle üretildi.`);
  }
  if (report.repairedAttribOwnerCount > 0) {
    report.warnings.push(`${report.repairedAttribOwnerCount} ATTRIB owner ilişkisi DXF sırasından onarıldı.`);
  }
  if (report.unresolvedAttribOwnerCount > 0) {
    report.warnings.push(`${report.unresolvedAttribOwnerCount} ATTRIB için owning INSERT kesin çözülemedi; kendi layer/color bilgisi kullanıldı.`);
  }
  if (report.promotedConstantAttdefCount > 0) {
    report.warnings.push(`${report.promotedConstantAttdefCount} constant ATTDEF block-local text olarak render edildi.`);
  }
  if (report.nonUnitAttributeWidthFactorCount > 0) {
    report.warnings.push(`${report.nonUnitAttributeWidthFactorCount} ATTRIB X width factor, text yüksekliğini bozmadan uygulandı.`);
  }
  if (report.constantAttributeConflictCount > 0) {
    report.blockingIssues.push(
      `${report.constantAttributeConflictCount} constant ATTDEF için ayrıca ATTRIB instance bulundu; duplicate/çelişkili text üretmemek için dosya doğrulanmalıdır.`
    );
  }
  if (report.unsupportedObliqueAttributeCount > 0) {
    report.blockingIssues.push(
      `${report.unsupportedObliqueAttributeCount} ATTRIB/constant ATTDEF oblique text açısı içeriyor; mevcut renderer bu transformu güvenilir uygulamıyor.`
    );
  }
  if (report.unsupportedMirroredConstantAttdefCount > 0) {
    report.blockingIssues.push(
      `${report.unsupportedMirroredConstantAttdefCount} constant ATTDEF mirrored/backwards text bayrağı içeriyor; mevcut renderer bunu güvenilir uygulamıyor.`
    );
  }

  dxf[STAGE2_REPORT_KEY] = report;
  return report;
}

export function readDxfTextStage2Report(dxf: unknown): DxfTextStage2Report | null {
  if (!dxf || typeof dxf !== "object") return null;
  const report = (dxf as DxfTextStage2ParsedDxf)[STAGE2_REPORT_KEY];
  return report && typeof report === "object" ? report : null;
}

export function dxfTextStage2ReportKey(): string {
  return STAGE2_REPORT_KEY;
}
