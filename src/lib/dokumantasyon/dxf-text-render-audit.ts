const TEXT_TYPES = new Set(["TEXT", "MTEXT", "ATTRIB", "ATTDEF"]);
const EPSILON = 1e-9;

type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[]; blockName: string | null };
type LayerState = { off: boolean; frozen: boolean };

export type DxfTextType = "TEXT" | "MTEXT" | "ATTRIB" | "ATTDEF";

export interface DxfTextSourceAudit {
  totalTextRecords: number;
  topLevelTextRecords: number;
  blockTextRecords: number;
  visibleModelTextRecords: number;
  reachableBlockTextRecords: number;
  renderCandidateTextRecords: number;
  hiddenTextRecords: number;
  paperSpaceTextRecords: number;
  suppressedLayerTextRecords: number;
  unreachableBlockTextRecords: number;
  emptyTextRecords: number;
  missingHeightRecords: number;
  nonPositiveHeightRecords: number;
  visibleAttdefRecords: number;
  byType: Record<DxfTextType, number>;
  candidateByType: Record<DxfTextType, number>;
  textLayers: string[];
  textStyles: string[];
  reachableBlocks: string[];
  attributeTags: string[];
  minPositiveHeight: number | null;
  maxPositiveHeight: number | null;
}

export interface DxfParsedTextAudit {
  available: boolean;
  totalTextRecords: number;
  topLevelTextRecords: number;
  blockTextRecords: number;
  byType: Record<DxfTextType, number>;
}

export interface DxfFontProbe {
  url: string;
  ok: boolean;
  status: number | null;
  bytes: number;
  contentType: string | null;
  error: string | null;
}

export interface DxfTextRenderEvidence {
  source: DxfTextSourceAudit;
  parsed: DxfParsedTextAudit | null;
  fontProbes: DxfFontProbe[];
  rendererMissingChars: boolean | null;
  parserLossCount: number;
  status: "no-text" | "ok" | "warning" | "blocking";
  issues: string[];
  evidence: string[];
}

function emptyTypeCounts(): Record<DxfTextType, number> {
  return { TEXT: 0, MTEXT: 0, ATTRIB: 0, ATTDEF: 0 };
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

function valuesForCodes(record: Pair[], codes: Set<number>): string[] {
  return record.filter((pair) => codes.has(pair.code)).map((pair) => pair.value);
}

function numberForCode(record: Pair[], code: number): number | null {
  const raw = valueForCode(record, code);
  if (raw === null) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
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
    records.push({
      section,
      type,
      pairs: currentPairs,
      blockName: section === "BLOCKS" && type !== "BLOCK" && type !== "ENDBLK" ? currentBlockName : null,
    });
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
    const flags = Math.trunc(numberForCode(record.pairs, 70) ?? 0);
    const color = numberForCode(record.pairs, 62) ?? 7;
    layers.set(name, { off: color < 0, frozen: (flags & 1) !== 0 || (flags & 2) !== 0 });
  }
  return layers;
}

function isPaperSpace(record: RecordData): boolean {
  return valueForCode(record.pairs, 67) === "1";
}

function isEntityHidden(record: RecordData): boolean {
  if (valueForCode(record.pairs, 60) === "1") return true;
  if (record.type === "ATTRIB" || record.type === "ATTDEF") {
    const flags = Math.trunc(numberForCode(record.pairs, 70) ?? 0);
    if ((flags & 1) !== 0) return true;
  }
  return false;
}

function isLayerSuppressed(record: RecordData, layers: Map<string, LayerState>): boolean {
  const layerName = valueForCode(record.pairs, 8) ?? "0";
  if (record.section === "BLOCKS" && layerName === "0") return false;
  const layer = layers.get(layerName);
  return Boolean(layer?.off || layer?.frozen);
}

function textContent(record: RecordData): string {
  if (record.type === "MTEXT") return valuesForCodes(record.pairs, new Set([1, 3])).join("");
  return valueForCode(record.pairs, 1) ?? "";
}

function referencedBlock(record: RecordData): string | null {
  if (record.type !== "INSERT") return null;
  return valueForCode(record.pairs, 2);
}

function isRenderableSourceRecord(record: RecordData, layers: Map<string, LayerState>): boolean {
  if (isEntityHidden(record)) return false;
  if (record.section === "ENTITIES" && isPaperSpace(record)) return false;
  return !isLayerSuppressed(record, layers);
}

export function auditDxfTextRenderSource(text: string): DxfTextSourceAudit {
  const records = parseRecords(text);
  const layers = parseLayers(records);
  const blockDefinitions = new Map<string, RecordData[]>();
  const reachableBlocks = new Set<string>();
  const queue: string[] = [];

  for (const record of records) {
    if (record.section !== "BLOCKS" || !record.blockName) continue;
    const list = blockDefinitions.get(record.blockName) ?? [];
    list.push(record);
    blockDefinitions.set(record.blockName, list);
  }

  for (const record of records) {
    if (record.section !== "ENTITIES" || record.type !== "INSERT") continue;
    if (!isRenderableSourceRecord(record, layers)) continue;
    const blockName = referencedBlock(record);
    if (blockName && blockDefinitions.has(blockName)) queue.push(blockName);
  }

  while (queue.length > 0) {
    const blockName = queue.shift();
    if (!blockName || reachableBlocks.has(blockName)) continue;
    reachableBlocks.add(blockName);
    for (const record of blockDefinitions.get(blockName) ?? []) {
      if (!isRenderableSourceRecord(record, layers)) continue;
      const nested = referencedBlock(record);
      if (nested && blockDefinitions.has(nested)) queue.push(nested);
    }
  }

  const byType = emptyTypeCounts();
  const candidateByType = emptyTypeCounts();
  const textLayers = new Set<string>();
  const textStyles = new Set<string>();
  const attributeTags = new Set<string>();
  const positiveHeights: number[] = [];
  let totalTextRecords = 0;
  let topLevelTextRecords = 0;
  let blockTextRecords = 0;
  let visibleModelTextRecords = 0;
  let reachableBlockTextRecords = 0;
  let hiddenTextRecords = 0;
  let paperSpaceTextRecords = 0;
  let suppressedLayerTextRecords = 0;
  let unreachableBlockTextRecords = 0;
  let emptyTextRecords = 0;
  let missingHeightRecords = 0;
  let nonPositiveHeightRecords = 0;
  let visibleAttdefRecords = 0;

  for (const record of records) {
    if (!TEXT_TYPES.has(record.type)) continue;
    const type = record.type as DxfTextType;
    totalTextRecords += 1;
    byType[type] += 1;
    if (record.section === "ENTITIES") topLevelTextRecords += 1;
    if (record.section === "BLOCKS") blockTextRecords += 1;

    const content = textContent(record);
    if (!content.trim()) emptyTextRecords += 1;
    const height = numberForCode(record.pairs, 40);
    if (height === null) missingHeightRecords += 1;
    else if (height <= EPSILON) nonPositiveHeightRecords += 1;
    else positiveHeights.push(height);

    textLayers.add(valueForCode(record.pairs, 8) ?? "0");
    const style = valueForCode(record.pairs, 7);
    if (style) textStyles.add(style);
    if (type === "ATTRIB" || type === "ATTDEF") {
      const tag = valueForCode(record.pairs, 2);
      if (tag) attributeTags.add(tag);
    }

    const hidden = isEntityHidden(record);
    const paper = record.section === "ENTITIES" && isPaperSpace(record);
    const layerSuppressed = isLayerSuppressed(record, layers);
    if (hidden) hiddenTextRecords += 1;
    if (paper) paperSpaceTextRecords += 1;
    if (layerSuppressed) suppressedLayerTextRecords += 1;

    if (record.section === "BLOCKS" && (!record.blockName || !reachableBlocks.has(record.blockName))) {
      unreachableBlockTextRecords += 1;
    }

    const candidate = !hidden && !paper && !layerSuppressed && (
      record.section === "ENTITIES" || (record.section === "BLOCKS" && Boolean(record.blockName && reachableBlocks.has(record.blockName)))
    );
    if (!candidate) continue;

    candidateByType[type] += 1;
    if (record.section === "ENTITIES") visibleModelTextRecords += 1;
    else reachableBlockTextRecords += 1;
    if (type === "ATTDEF") visibleAttdefRecords += 1;
  }

  return {
    totalTextRecords,
    topLevelTextRecords,
    blockTextRecords,
    visibleModelTextRecords,
    reachableBlockTextRecords,
    renderCandidateTextRecords: visibleModelTextRecords + reachableBlockTextRecords,
    hiddenTextRecords,
    paperSpaceTextRecords,
    suppressedLayerTextRecords,
    unreachableBlockTextRecords,
    emptyTextRecords,
    missingHeightRecords,
    nonPositiveHeightRecords,
    visibleAttdefRecords,
    byType,
    candidateByType,
    textLayers: [...textLayers].sort(),
    textStyles: [...textStyles].sort(),
    reachableBlocks: [...reachableBlocks].sort(),
    attributeTags: [...attributeTags].sort(),
    minPositiveHeight: positiveHeights.length > 0 ? Math.min(...positiveHeights) : null,
    maxPositiveHeight: positiveHeights.length > 0 ? Math.max(...positiveHeights) : null,
  };
}

function parsedTextType(entity: unknown): DxfTextType | null {
  if (!entity || typeof entity !== "object") return null;
  const type = String((entity as { type?: unknown }).type ?? "").toUpperCase();
  return TEXT_TYPES.has(type) ? type as DxfTextType : null;
}

export function auditParsedDxfText(dxf: unknown): DxfParsedTextAudit {
  if (!dxf || typeof dxf !== "object") {
    return { available: false, totalTextRecords: 0, topLevelTextRecords: 0, blockTextRecords: 0, byType: emptyTypeCounts() };
  }
  const root = dxf as { entities?: unknown[]; blocks?: Record<string, { entities?: unknown[] }> };
  const byType = emptyTypeCounts();
  let topLevelTextRecords = 0;
  let blockTextRecords = 0;

  for (const entity of root.entities ?? []) {
    const type = parsedTextType(entity);
    if (!type) continue;
    byType[type] += 1;
    topLevelTextRecords += 1;
  }
  for (const block of Object.values(root.blocks ?? {})) {
    for (const entity of block?.entities ?? []) {
      const type = parsedTextType(entity);
      if (!type) continue;
      byType[type] += 1;
      blockTextRecords += 1;
    }
  }

  return {
    available: true,
    totalTextRecords: topLevelTextRecords + blockTextRecords,
    topLevelTextRecords,
    blockTextRecords,
    byType,
  };
}

export async function probeDxfFontUrls(urls: string[], signal?: AbortSignal): Promise<DxfFontProbe[]> {
  return Promise.all(urls.map(async (url): Promise<DxfFontProbe> => {
    try {
      const response = await fetch(url, { signal, cache: "no-store" });
      const buffer = response.ok ? await response.arrayBuffer() : new ArrayBuffer(0);
      return {
        url,
        ok: response.ok && buffer.byteLength > 1024,
        status: response.status,
        bytes: buffer.byteLength,
        contentType: response.headers.get("content-type"),
        error: response.ok && buffer.byteLength <= 1024 ? "Font response is unexpectedly small." : null,
      };
    } catch (error) {
      return {
        url,
        ok: false,
        status: null,
        bytes: 0,
        contentType: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }));
}

export function evaluateDxfTextRenderEvidence(input: {
  source: DxfTextSourceAudit;
  parsed?: DxfParsedTextAudit | null;
  fontProbes?: DxfFontProbe[];
  rendererMissingChars?: boolean | null;
}): DxfTextRenderEvidence {
  const parsed = input.parsed ?? null;
  const fontProbes = input.fontProbes ?? [];
  const rendererMissingChars = input.rendererMissingChars ?? null;
  const issues: string[] = [];
  const evidence: string[] = [];
  const parserLossCount = parsed?.available ? Math.max(0, input.source.totalTextRecords - parsed.totalTextRecords) : 0;

  evidence.push(
    `kaynak ${input.source.totalTextRecords} text kaydı`,
    `render adayı ${input.source.renderCandidateTextRecords}`,
    `TEXT ${input.source.candidateByType.TEXT}`,
    `MTEXT ${input.source.candidateByType.MTEXT}`,
    `ATTRIB ${input.source.candidateByType.ATTRIB}`,
    `ATTDEF ${input.source.candidateByType.ATTDEF}`
  );

  if (input.source.renderCandidateTextRecords === 0) {
    return { source: input.source, parsed, fontProbes, rendererMissingChars, parserLossCount, status: "no-text", issues, evidence };
  }

  if (fontProbes.length > 0 && fontProbes.every((font) => !font.ok)) {
    issues.push("Hiçbir fallback font dosyası doğrulanamadı; renderer text geometri üretemeyebilir.");
  } else if (fontProbes.some((font) => !font.ok)) {
    issues.push("Fallback font setinin bir bölümü yüklenemedi; glyph kapsamı eksilebilir.");
  }

  if (parsed?.available) {
    evidence.push(`parser ${parsed.totalTextRecords} text kaydı`);
    if (parserLossCount > 0) {
      issues.push(`Kaynak ile dxf-viewer parser arasında ${parserLossCount} text kaydı kayboldu.`);
    }
  } else {
    issues.push("dxf-viewer parsed DXF kanıtı alınamadı; kaynak→parser eşleşmesi doğrulanamadı.");
  }

  if (rendererMissingChars === true) {
    issues.push("Renderer en az bir karakter için font glyph bulamadığını bildirdi.");
  }
  if (input.source.visibleAttdefRecords > 0) {
    issues.push(`${input.source.visibleAttdefRecords} görünür/reachable ATTDEF bulundu; upstream renderer ATTDEF'i doğrudan render dispatch listesine almıyor.`);
  }
  if (input.source.nonPositiveHeightRecords > 0) {
    issues.push(`${input.source.nonPositiveHeightRecords} text kaydı sıfır/negatif yükseklik taşıyor.`);
  }
  if (input.source.emptyTextRecords > 0) {
    issues.push(`${input.source.emptyTextRecords} text kaydının görünür içeriği boş.`);
  }

  const blocking = parserLossCount > 0 || (fontProbes.length > 0 && fontProbes.every((font) => !font.ok));
  const warning = issues.length > 0;
  return {
    source: input.source,
    parsed,
    fontProbes,
    rendererMissingChars,
    parserLossCount,
    status: blocking ? "blocking" : warning ? "warning" : "ok",
    issues,
    evidence,
  };
}
