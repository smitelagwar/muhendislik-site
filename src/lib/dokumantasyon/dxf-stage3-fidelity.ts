type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[]; blockName: string | null };

const EPSILON = 1e-9;
const TEXT_ENTITY_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
const SINGLE_LINE_TEXT_TYPES = new Set(["TEXT", "ATTRIB", "ATTDEF"]);
const SUPPORTED_SYNTH_DIMENSION_TYPES = new Set([0, 1]);

export interface DxfStage3Audit {
  textRecordCount: number;
  rotatedTextCount: number;
  alignedTextCount: number;
  nonPositiveTextHeightCount: number;
  mtextCount: number;
  stackedFractionCount: number;
  unsupportedTextObliqueCount: number;
  unsupportedTextGenerationFlagCount: number;
  unsupportedAttribAttachmentCount: number;
  invalidTextWidthFactorCount: number;
  invalidTextAlignmentCodeCount: number;
  missingTextAlignmentPointCount: number;
  invalidMtextAttachmentCount: number;
  invalidMtextDirectionCount: number;
  invalidMtextLineSpacingCount: number;
  styleDefinitionCount: number;
  shxStyleCount: number;
  shxStyles: string[];
  missingTextStyleReferenceCount: number;
  missingTextStyles: string[];
  dimensionCount: number;
  linearDimensionCount: number;
  alignedDimensionCount: number;
  unsupportedDimensionCount: number;
  unsupportedDimensionWithoutBlockCount: number;
  unsupportedDimensionTypes: string[];
  dimensionWithResolvedBlockCount: number;
  missingDimensionBlockReferenceCount: number;
  missingDimensionBlocks: string[];
  malformedSupportedDimensionCount: number;
  dimensionStyleDefinitionCount: number;
  missingDimensionStyleReferenceCount: number;
  missingDimensionStyles: string[];
}

export interface DxfStage3NormalizationResult {
  text: string;
  stackedFractionFallbackCount: number;
}

function parsePairs(text: string): Pair[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs: Pair[] = [];
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[index + 1] });
  }
  return pairs;
}

function valueForCode(record: Pair[], code: number): string | null {
  return record.find((pair) => pair.code === code)?.value.trim() ?? null;
}

function numberForCode(record: Pair[], code: number, fallback: number): number {
  const raw = valueForCode(record, code);
  if (raw === null) return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumberForCode(record: Pair[], code: number): number | null {
  const raw = valueForCode(record, code);
  if (raw === null) return null;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasCode(record: Pair[], code: number): boolean {
  return record.some((pair) => pair.code === code);
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
    records.push({ section, type: currentType, pairs: currentPairs, blockName: currentBlockName });

    if (section === "BLOCKS" && currentType === "BLOCK") {
      currentBlockName = valueForCode(currentPairs, 2) ?? valueForCode(currentPairs, 3);
    } else if (section === "BLOCKS" && currentType === "ENDBLK") {
      currentBlockName = null;
    }
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    if (pair.code === 0 && pair.value.trim() === "SECTION") {
      flush();
      currentType = null;
      currentPairs = [];
      const next = pairs[index + 1];
      section = next?.code === 2 ? next.value.trim() : null;
      continue;
    }
    if (pair.code === 0 && pair.value.trim() === "ENDSEC") {
      flush();
      currentType = null;
      currentPairs = [];
      section = null;
      currentBlockName = null;
      continue;
    }
    if (pair.code === 0) {
      flush();
      currentType = pair.value.trim().toUpperCase();
      currentPairs = [pair];
      continue;
    }
    if (currentType) currentPairs.push(pair);
  }
  flush();
  return records;
}

function dimensionTypeName(type: number): string {
  switch (type) {
    case 0: return "linear/rotated";
    case 1: return "aligned";
    case 2: return "angular";
    case 3: return "diameter";
    case 4: return "radius";
    case 5: return "angular-3point";
    case 6: return "ordinate";
    default: return `type-${type}`;
  }
}

function hasLinearDimensionGeometry(record: Pair[]): boolean {
  return hasCode(record, 10) && hasCode(record, 20) && hasCode(record, 13) && hasCode(record, 23) && hasCode(record, 14) && hasCode(record, 24);
}

function countStackedFractions(value: string): number {
  return [...value.matchAll(/(?<!\\)\\S[^;]*;/gi)].length;
}

export function auditDxfStage3(text: string): DxfStage3Audit {
  const records = parseRecords(text);
  const blockDefinitions = new Set<string>();
  const styleDefinitions = new Map<string, { font: string | null; bigFont: string | null }>();
  const dimStyleDefinitions = new Set<string>();

  for (const record of records) {
    if (record.section === "BLOCKS" && record.type === "BLOCK") {
      const name = valueForCode(record.pairs, 2) ?? valueForCode(record.pairs, 3);
      if (name) blockDefinitions.add(name);
    }
    if (record.section === "TABLES" && record.type === "STYLE") {
      const name = valueForCode(record.pairs, 2);
      if (name) styleDefinitions.set(name, { font: valueForCode(record.pairs, 3), bigFont: valueForCode(record.pairs, 4) });
    }
    if (record.section === "TABLES" && record.type === "DIMSTYLE") {
      const name = valueForCode(record.pairs, 2);
      if (name) dimStyleDefinitions.add(name);
    }
  }

  let textRecordCount = 0;
  let rotatedTextCount = 0;
  let alignedTextCount = 0;
  let nonPositiveTextHeightCount = 0;
  let mtextCount = 0;
  let stackedFractionCount = 0;
  let unsupportedTextObliqueCount = 0;
  let unsupportedTextGenerationFlagCount = 0;
  let unsupportedAttribAttachmentCount = 0;
  let invalidTextWidthFactorCount = 0;
  let invalidTextAlignmentCodeCount = 0;
  let missingTextAlignmentPointCount = 0;
  let invalidMtextAttachmentCount = 0;
  let invalidMtextDirectionCount = 0;
  let invalidMtextLineSpacingCount = 0;
  let dimensionCount = 0;
  let linearDimensionCount = 0;
  let alignedDimensionCount = 0;
  let unsupportedDimensionCount = 0;
  let unsupportedDimensionWithoutBlockCount = 0;
  let dimensionWithResolvedBlockCount = 0;
  let missingDimensionBlockReferenceCount = 0;
  let malformedSupportedDimensionCount = 0;
  const unsupportedDimensionTypes = new Set<string>();
  const missingDimensionBlocks = new Set<string>();
  const usedTextStyles = new Set<string>();
  const usedDimensionStyles = new Set<string>();

  for (const record of records) {
    if (record.section !== "ENTITIES" && record.section !== "BLOCKS") continue;

    if (TEXT_ENTITY_TYPES.has(record.type)) {
      textRecordCount += 1;
      const style = valueForCode(record.pairs, 7);
      if (style) usedTextStyles.add(style);
      const height = numberForCode(record.pairs, 40, 1);
      if (height <= EPSILON) nonPositiveTextHeightCount += 1;
      if (Math.abs(numberForCode(record.pairs, 50, 0)) > EPSILON) rotatedTextCount += 1;

      if (SINGLE_LINE_TEXT_TYPES.has(record.type)) {
        const hAlign = numberForCode(record.pairs, 72, 0);
        const verticalCode = record.type === "TEXT" ? 73 : 74;
        const vAlign = numberForCode(record.pairs, verticalCode, 0);
        if (hAlign !== 0 || vAlign !== 0) {
          alignedTextCount += 1;
          if (!hasCode(record.pairs, 11) || !hasCode(record.pairs, 21)) missingTextAlignmentPointCount += 1;
        }
        if (!Number.isInteger(hAlign) || hAlign < 0 || hAlign > 5 || !Number.isInteger(vAlign) || vAlign < 0 || vAlign > 3) {
          invalidTextAlignmentCodeCount += 1;
        }
        const widthFactor = optionalNumberForCode(record.pairs, 41);
        if (widthFactor !== null && widthFactor <= EPSILON) invalidTextWidthFactorCount += 1;
        if (Math.abs(numberForCode(record.pairs, 51, 0)) > EPSILON) unsupportedTextObliqueCount += 1;

        if (record.type === "TEXT" || record.type === "ATTDEF") {
          const generationFlags = Math.trunc(numberForCode(record.pairs, 71, 0));
          if ((generationFlags & 2) !== 0 || (generationFlags & 4) !== 0) unsupportedTextGenerationFlagCount += 1;
        }
        if (record.type === "ATTRIB") {
          const attachmentPoint = Math.trunc(numberForCode(record.pairs, 71, 0));
          if (attachmentPoint !== 0) unsupportedAttribAttachmentCount += 1;
        }
      }

      if (record.type === "MTEXT") {
        mtextCount += 1;
        const attachment = numberForCode(record.pairs, 71, 1);
        if (attachment !== 1) alignedTextCount += 1;
        if (!Number.isInteger(attachment) || attachment < 1 || attachment > 9) invalidMtextAttachmentCount += 1;

        const hasDirectionX = hasCode(record.pairs, 11);
        const hasDirectionY = hasCode(record.pairs, 21);
        if (hasDirectionX || hasDirectionY) {
          if (!hasDirectionX || !hasDirectionY) {
            invalidMtextDirectionCount += 1;
          } else {
            const dx = numberForCode(record.pairs, 11, 0);
            const dy = numberForCode(record.pairs, 21, 0);
            if (Math.hypot(dx, dy) <= EPSILON) invalidMtextDirectionCount += 1;
          }
        }
        const lineSpacing = optionalNumberForCode(record.pairs, 44);
        if (lineSpacing !== null && (lineSpacing < 0.25 || lineSpacing > 4)) invalidMtextLineSpacingCount += 1;

        for (const pair of record.pairs) {
          if (pair.code === 1 || pair.code === 3) stackedFractionCount += countStackedFractions(pair.value);
        }
      }
      continue;
    }

    // Dimension fidelity gates describe top-level drawing dimensions. DIMENSION records that live
    // inside BLOCKS are implementation/detail content and must not be double-counted as model-space
    // dimensions merely because their parent block is referenced elsewhere.
    if (record.section !== "ENTITIES" || record.type !== "DIMENSION") continue;
    dimensionCount += 1;
    const rawType = Math.trunc(numberForCode(record.pairs, 70, 0));
    const type = rawType & 0xf;
    if (type === 0) linearDimensionCount += 1;
    if (type === 1) alignedDimensionCount += 1;

    const styleName = valueForCode(record.pairs, 3);
    if (styleName) usedDimensionStyles.add(styleName);

    const blockName = valueForCode(record.pairs, 2);
    const hasResolvedBlock = Boolean(blockName && blockDefinitions.has(blockName));
    if (hasResolvedBlock) dimensionWithResolvedBlockCount += 1;
    if (blockName && !hasResolvedBlock) {
      missingDimensionBlockReferenceCount += 1;
      missingDimensionBlocks.add(blockName);
    }

    if (!SUPPORTED_SYNTH_DIMENSION_TYPES.has(type)) {
      unsupportedDimensionCount += 1;
      unsupportedDimensionTypes.add(dimensionTypeName(type));
      if (!hasResolvedBlock) unsupportedDimensionWithoutBlockCount += 1;
    } else if (!hasResolvedBlock && !hasLinearDimensionGeometry(record.pairs)) {
      malformedSupportedDimensionCount += 1;
    }
  }

  const shxStyles = [...styleDefinitions.entries()]
    .filter(([, style]) => [style.font, style.bigFont].some((font) => font?.toLowerCase().endsWith(".shx")))
    .map(([name]) => name)
    .sort();
  const missingTextStyles = [...usedTextStyles].filter((name) => !styleDefinitions.has(name)).sort();
  const missingDimensionStyles = [...usedDimensionStyles].filter((name) => !dimStyleDefinitions.has(name)).sort();

  return {
    textRecordCount,
    rotatedTextCount,
    alignedTextCount,
    nonPositiveTextHeightCount,
    mtextCount,
    stackedFractionCount,
    unsupportedTextObliqueCount,
    unsupportedTextGenerationFlagCount,
    unsupportedAttribAttachmentCount,
    invalidTextWidthFactorCount,
    invalidTextAlignmentCodeCount,
    missingTextAlignmentPointCount,
    invalidMtextAttachmentCount,
    invalidMtextDirectionCount,
    invalidMtextLineSpacingCount,
    styleDefinitionCount: styleDefinitions.size,
    shxStyleCount: shxStyles.length,
    shxStyles,
    missingTextStyleReferenceCount: missingTextStyles.length,
    missingTextStyles,
    dimensionCount,
    linearDimensionCount,
    alignedDimensionCount,
    unsupportedDimensionCount,
    unsupportedDimensionWithoutBlockCount,
    unsupportedDimensionTypes: [...unsupportedDimensionTypes].sort(),
    dimensionWithResolvedBlockCount,
    missingDimensionBlockReferenceCount,
    missingDimensionBlocks: [...missingDimensionBlocks].sort(),
    malformedSupportedDimensionCount,
    dimensionStyleDefinitionCount: dimStyleDefinitions.size,
    missingDimensionStyleReferenceCount: missingDimensionStyles.length,
    missingDimensionStyles,
  };
}

export function getDxfStage3Warnings(audit: DxfStage3Audit): string[] {
  const warnings: string[] = [];
  if (audit.stackedFractionCount > 0) warnings.push(`${audit.stackedFractionCount} MTEXT stacked fraction bulundu; görünür plain-text fallback uygulanacak.`);
  if (audit.shxStyleCount > 0) warnings.push(`${audit.shxStyleCount} SHX tabanlı text style bulundu (${audit.shxStyles.join(", ")}); web TTF fallback ile tipografi birebir olmayabilir.`);
  if (audit.missingTextStyleReferenceCount > 0) warnings.push(`${audit.missingTextStyleReferenceCount} tanımsız text style referansı var: ${audit.missingTextStyles.join(", ")}.`);
  if (audit.nonPositiveTextHeightCount > 0) warnings.push(`${audit.nonPositiveTextHeightCount} text entity sıfır/negatif yükseklik içeriyor; görünürlük style fallback'e bağlı olabilir.`);
  if (audit.missingDimensionBlockReferenceCount > 0) warnings.push(`${audit.missingDimensionBlockReferenceCount} DIMENSION tanımsız block referansına sahip: ${audit.missingDimensionBlocks.join(", ")}.`);
  if (audit.missingDimensionStyleReferenceCount > 0) warnings.push(`${audit.missingDimensionStyleReferenceCount} tanımsız DIMSTYLE referansı var: ${audit.missingDimensionStyles.join(", ")}.`);
  if (audit.unsupportedDimensionCount > 0) warnings.push(`Renderer'ın doğrudan sentezlemediği dimension tipleri mevcut: ${audit.unsupportedDimensionTypes.join(", ")}. Hazır dimension block'u olmayanlar engellenecek.`);
  return warnings;
}

export function getDxfStage3BlockingIssues(audit: DxfStage3Audit): string[] {
  const issues: string[] = [];
  if (audit.unsupportedTextObliqueCount > 0) {
    issues.push(`${audit.unsupportedTextObliqueCount} TEXT/ATTRIB/ATTDEF oblique açı içeriyor; upstream parser/renderer shear bilgisini güvenilir taşımıyor.`);
  }
  if (audit.unsupportedTextGenerationFlagCount > 0) {
    issues.push(`${audit.unsupportedTextGenerationFlagCount} TEXT/ATTDEF backwards/upside-down generation flag içeriyor; sessiz yön kaybı başarı sayılamaz.`);
  }
  if (audit.unsupportedAttribAttachmentCount > 0) {
    issues.push(`${audit.unsupportedAttribAttachmentCount} ATTRIB attachment point içeriyor; mevcut TEXT normalizasyonu bu attachment semantiğini güvenilir uygulamıyor.`);
  }
  if (audit.invalidTextWidthFactorCount > 0) {
    issues.push(`${audit.invalidTextWidthFactorCount} text entity sıfır/negatif X width factor içeriyor; güvenilir text bounds üretilemez.`);
  }
  if (audit.invalidTextAlignmentCodeCount > 0) {
    issues.push(`${audit.invalidTextAlignmentCodeCount} text entity geçersiz horizontal/vertical justification kodu içeriyor.`);
  }
  if (audit.missingTextAlignmentPointCount > 0) {
    issues.push(`${audit.missingTextAlignmentPointCount} aligned/center/right/fit text için zorunlu ikinci alignment noktası yok.`);
  }
  if (audit.invalidMtextAttachmentCount > 0) {
    issues.push(`${audit.invalidMtextAttachmentCount} MTEXT attachment point 1–9 aralığı dışında.`);
  }
  if (audit.invalidMtextDirectionCount > 0) {
    issues.push(`${audit.invalidMtextDirectionCount} MTEXT direction vektörü eksik/sıfır; orientation güvenilir hesaplanamaz.`);
  }
  if (audit.invalidMtextLineSpacingCount > 0) {
    issues.push(`${audit.invalidMtextLineSpacingCount} MTEXT line-spacing factor 0.25–4.0 aralığı dışında.`);
  }
  if (audit.unsupportedDimensionWithoutBlockCount > 0) {
    issues.push(`${audit.unsupportedDimensionWithoutBlockCount} angular/radius/diameter/ordinate sınıfı DIMENSION için render edilebilir hazır block yok; mevcut engine bu ölçüleri güvenilir sentezleyemez.`);
  }
  if (audit.malformedSupportedDimensionCount > 0) {
    issues.push(`${audit.malformedSupportedDimensionCount} linear/aligned DIMENSION zorunlu tanım noktalarını içermiyor ve hazır dimension block'u yok; eksik ölçü çizimi başarı sayılamaz.`);
  }
  return issues;
}

function normalizeStackedFractions(value: string): { value: string; count: number } {
  let count = 0;
  const normalized = value.replace(/(?<!\\)\\S([^;]*);/gi, (_match, body: string) => {
    count += 1;
    const separatorIndex = body.search(/[\^#/]/);
    if (separatorIndex < 0) return body;
    const numerator = body.slice(0, separatorIndex);
    const denominator = body.slice(separatorIndex + 1);
    return `${numerator}/${denominator}`;
  });
  return { value: normalized, count };
}

export function normalizeDxfTextForStage3Rendering(text: string): DxfStage3NormalizationResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let currentType: string | null = null;
  let stackedFractionFallbackCount = 0;

  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (!Number.isFinite(code)) continue;
    const value = lines[index + 1];
    if (code === 0) {
      currentType = value.trim().toUpperCase();
      continue;
    }
    if (currentType === "MTEXT" && (code === 1 || code === 3)) {
      const normalized = normalizeStackedFractions(value);
      lines[index + 1] = normalized.value;
      stackedFractionFallbackCount += normalized.count;
    }
  }

  return { text: lines.join("\n"), stackedFractionFallbackCount };
}
