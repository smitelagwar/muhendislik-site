import { originalDxfTextType, type DxfTextStage2Entity, type DxfTextStage2ParsedDxf } from "./dxf-text-stage2";

const STAGE3_LAYOUT_REPORT_KEY = "__dxfTextStage3Layout";
const EPSILON = 1e-9;
const TURKISH_RE = /[ÇĞİÖŞÜçğıöşü]/u;
const SPECIAL_ESCAPE_RE = /%%[dpcou%]|\\U\+[0-9a-f]{4}/gi;
const ADVANCED_MTEXT_FORMAT_RE = /\\(?:F|H|W|T|Q|A)[^;]*;/gi;
const MTEXT_PARAGRAPH_RE = /(?<!\\)\\P/gi;

type PointLike = { x?: unknown; y?: unknown } | null | undefined;

export type DxfTextStage3LayoutEntity = DxfTextStage2Entity & {
  startPoint?: PointLike;
  endPoint?: PointLike;
  height?: unknown;
  position?: PointLike;
  direction?: PointLike;
  attachmentPoint?: unknown;
  lineSpacing?: unknown;
  width?: unknown;
  upsideDown?: unknown;
};

export type DxfTextStage3LayoutParsedDxf = DxfTextStage2ParsedDxf & {
  [STAGE3_LAYOUT_REPORT_KEY]?: DxfTextStage3LayoutReport;
};

export interface DxfTextStage3LayoutReport {
  singleLineTextCount: number;
  mtextCount: number;
  rotatedTextCount: number;
  alignedTextCount: number;
  nonUnitWidthFactorCount: number;
  mtextParagraphBreakCount: number;
  turkishTextEntityCount: number;
  specialEscapeCount: number;
  advancedMtextFormattingCount: number;
  unsupportedObliqueCount: number;
  unsupportedMirroredCount: number;
  invalidWidthFactorCount: number;
  invalidTextAlignmentCount: number;
  missingAlignmentPointCount: number;
  invalidMtextAttachmentCount: number;
  invalidMtextDirectionCount: number;
  invalidMtextLineSpacingCount: number;
  warnings: string[];
  blockingIssues: string[];
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(number) ? number : null;
}

function pointIsFinite(point: PointLike): boolean {
  if (!point || typeof point !== "object") return false;
  return finiteNumber(point.x) !== null && finiteNumber(point.y) !== null;
}

function pointMagnitude(point: PointLike): number | null {
  if (!pointIsFinite(point)) return null;
  const x = finiteNumber(point?.x) ?? 0;
  const y = finiteNumber(point?.y) ?? 0;
  return Math.hypot(x, y);
}

function boolish(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function textValue(entity: DxfTextStage3LayoutEntity): string {
  return String(entity.text ?? "");
}

function entityArrays(dxf: DxfTextStage3LayoutParsedDxf): DxfTextStage3LayoutEntity[][] {
  const arrays: DxfTextStage3LayoutEntity[][] = [];
  if (Array.isArray(dxf.entities)) arrays.push(dxf.entities as DxfTextStage3LayoutEntity[]);
  for (const block of Object.values(dxf.blocks ?? {})) {
    if (Array.isArray(block?.entities)) arrays.push(block.entities as DxfTextStage3LayoutEntity[]);
  }
  return arrays;
}

export function auditParsedDxfTextStage3Layout(dxf: DxfTextStage3LayoutParsedDxf): DxfTextStage3LayoutReport {
  const report: DxfTextStage3LayoutReport = {
    singleLineTextCount: 0,
    mtextCount: 0,
    rotatedTextCount: 0,
    alignedTextCount: 0,
    nonUnitWidthFactorCount: 0,
    mtextParagraphBreakCount: 0,
    turkishTextEntityCount: 0,
    specialEscapeCount: 0,
    advancedMtextFormattingCount: 0,
    unsupportedObliqueCount: 0,
    unsupportedMirroredCount: 0,
    invalidWidthFactorCount: 0,
    invalidTextAlignmentCount: 0,
    missingAlignmentPointCount: 0,
    invalidMtextAttachmentCount: 0,
    invalidMtextDirectionCount: 0,
    invalidMtextLineSpacingCount: 0,
    warnings: [],
    blockingIssues: [],
  };

  for (const entities of entityArrays(dxf)) {
    for (const rawEntity of entities) {
      const entity = rawEntity as DxfTextStage3LayoutEntity;
      const originalType = originalDxfTextType(entity);
      if (!["TEXT", "ATTRIB", "ATTDEF", "MTEXT"].includes(originalType)) continue;

      const value = textValue(entity);
      if (TURKISH_RE.test(value)) report.turkishTextEntityCount += 1;
      report.specialEscapeCount += [...value.matchAll(SPECIAL_ESCAPE_RE)].length;

      if (originalType === "MTEXT") {
        report.mtextCount += 1;
        report.mtextParagraphBreakCount += [...value.matchAll(MTEXT_PARAGRAPH_RE)].length;
        report.advancedMtextFormattingCount += [...value.matchAll(ADVANCED_MTEXT_FORMAT_RE)].length;

        const rotation = finiteNumber(entity.rotation) ?? 0;
        if (Math.abs(rotation) > EPSILON || pointMagnitude(entity.direction) !== null) {
          report.rotatedTextCount += 1;
        }

        const attachment = finiteNumber(entity.attachmentPoint);
        if (attachment !== null && (attachment < 1 || attachment > 9 || !Number.isInteger(attachment))) {
          report.invalidMtextAttachmentCount += 1;
        }

        if (entity.direction !== undefined && entity.direction !== null) {
          const magnitude = pointMagnitude(entity.direction);
          if (magnitude === null || magnitude <= EPSILON) report.invalidMtextDirectionCount += 1;
        }

        const lineSpacing = finiteNumber(entity.lineSpacing);
        if (lineSpacing !== null && (lineSpacing < 0.25 || lineSpacing > 4)) {
          report.invalidMtextLineSpacingCount += 1;
        }
        continue;
      }

      report.singleLineTextCount += 1;
      const rotation = finiteNumber(entity.rotation) ?? 0;
      if (Math.abs(rotation) > EPSILON) report.rotatedTextCount += 1;

      const widthFactor = finiteNumber(entity.xScale ?? entity.scale ?? 1) ?? 1;
      if (Math.abs(widthFactor - 1) > EPSILON) report.nonUnitWidthFactorCount += 1;
      if (widthFactor <= EPSILON) report.invalidWidthFactorCount += 1;

      const hAlign = finiteNumber(entity.halign ?? entity.horizontalJustification ?? 0) ?? 0;
      const vAlign = finiteNumber(entity.valign ?? entity.verticalJustification ?? 0) ?? 0;
      const validHAlign = Number.isInteger(hAlign) && hAlign >= 0 && hAlign <= 5;
      const validVAlign = Number.isInteger(vAlign) && vAlign >= 0 && vAlign <= 3;
      if (!validHAlign || !validVAlign) report.invalidTextAlignmentCount += 1;
      if (hAlign !== 0 || vAlign !== 0) {
        report.alignedTextCount += 1;
        if (!pointIsFinite(entity.endPoint)) report.missingAlignmentPointCount += 1;
      }

      if (Math.abs(finiteNumber(entity.obliqueAngle) ?? 0) > EPSILON) report.unsupportedObliqueCount += 1;
      if (boolish(entity.backwards) || boolish(entity.mirrored) || boolish(entity.upsideDown)) {
        report.unsupportedMirroredCount += 1;
      }
    }
  }

  if (report.advancedMtextFormattingCount > 0) {
    report.warnings.push(
      `${report.advancedMtextFormattingCount} gelişmiş MTEXT format kodu bulundu; içerik korunur ancak font/width/tracking biçimi CAD ile birebir olmayabilir.`
    );
  }
  if (report.specialEscapeCount > 0) {
    report.warnings.push(`${report.specialEscapeCount} DXF özel karakter escape'i renderer Unicode dönüşümünden geçirilecek.`);
  }
  if (report.unsupportedObliqueCount > 0) {
    report.blockingIssues.push(
      `${report.unsupportedObliqueCount} görünür TEXT/ATTRIB/ATTDEF oblique açı içeriyor; mevcut glyph renderer bu shear transformunu güvenilir uygulamıyor.`
    );
  }
  if (report.unsupportedMirroredCount > 0) {
    report.blockingIssues.push(
      `${report.unsupportedMirroredCount} görünür TEXT/ATTRIB/ATTDEF backwards/mirrored/upside-down bayrağı içeriyor; yanlış yönlü yazı başarı sayılamaz.`
    );
  }
  if (report.invalidWidthFactorCount > 0) {
    report.blockingIssues.push(`${report.invalidWidthFactorCount} text entity sıfır/negatif X width factor içeriyor; güvenilir text bounds üretilemez.`);
  }
  if (report.invalidTextAlignmentCount > 0) {
    report.blockingIssues.push(`${report.invalidTextAlignmentCount} text entity geçersiz horizontal/vertical justification kodu içeriyor.`);
  }
  if (report.missingAlignmentPointCount > 0) {
    report.blockingIssues.push(`${report.missingAlignmentPointCount} aligned/fit/center text için zorunlu ikinci alignment noktası yok.`);
  }
  if (report.invalidMtextAttachmentCount > 0) {
    report.blockingIssues.push(`${report.invalidMtextAttachmentCount} MTEXT attachment point 1–9 aralığı dışında.`);
  }
  if (report.invalidMtextDirectionCount > 0) {
    report.blockingIssues.push(`${report.invalidMtextDirectionCount} MTEXT direction vektörü sıfır/geçersiz; orientation güvenilir hesaplanamaz.`);
  }
  if (report.invalidMtextLineSpacingCount > 0) {
    report.blockingIssues.push(`${report.invalidMtextLineSpacingCount} MTEXT line-spacing factor 0.25–4.0 aralığı dışında.`);
  }

  dxf[STAGE3_LAYOUT_REPORT_KEY] = report;
  return report;
}

export function readDxfTextStage3LayoutReport(dxf: unknown): DxfTextStage3LayoutReport | null {
  if (!dxf || typeof dxf !== "object") return null;
  const report = (dxf as DxfTextStage3LayoutParsedDxf)[STAGE3_LAYOUT_REPORT_KEY];
  return report && typeof report === "object" ? report : null;
}

export function dxfTextStage3LayoutReportKey(): string {
  return STAGE3_LAYOUT_REPORT_KEY;
}
