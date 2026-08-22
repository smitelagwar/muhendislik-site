type Pair = { code: number; value: string };
type RecordData = { section: string | null; type: string; pairs: Pair[] };

const EPSILON = 1e-9;
const ENTITY_SECTIONS = new Set(["ENTITIES", "BLOCKS"]);
const CONTINUOUS_LINETYPES = new Set(["", "CONTINUOUS", "BYLAYER", "BYBLOCK"]);

export interface DxfStage4Audit {
  layerDefinitionCount: number;
  offLayerCount: number;
  offLayers: string[];
  frozenLayerCount: number;
  frozenLayers: string[];
  lockedLayerCount: number;
  missingLayerReferenceCount: number;
  missingLayerReferences: string[];
  nonContinuousLinetypeEntityCount: number;
  nonContinuousLinetypes: string[];
  bulgedPolylineCount: number;
  widthPolylineCount: number;
  splineCount: number;
  fitPointOnlySplineCount: number;
  weightedSplineCount: number;
  closedOrPeriodicSplineCount: number;
  nonDefaultOcsSplineCount: number;
  malformedSplineCount: number;
  hatchCount: number;
  patternedHatchCount: number;
  gradientHatchCount: number;
  emptyBoundaryHatchCount: number;
  unsupportedHatchEdgeTypeCount: number;
  degenerateCurveCount: number;
  paperSpaceGeometryCount: number;
  modelSpaceGeometryCount: number;
}

export interface DxfStage4NormalizationResult {
  text: string;
  offLayersFrozenForRendering: number;
}

export interface DxfStage4ViewerSnapshot {
  viewport: { width: number; height: number };
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  origin: { x: number; y: number } | null;
  camera: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    zoom: number;
    position: { x: number; y: number; z: number };
  } | null;
  layers: string[];
}

export interface DxfStage4ViewerValidation {
  warnings: string[];
  blockingIssues: string[];
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

function parseRecords(text: string): RecordData[] {
  const pairs = parsePairs(text);
  const records: RecordData[] = [];
  let section: string | null = null;
  let type: string | null = null;
  let recordPairs: Pair[] = [];

  const flush = () => {
    if (type) records.push({ section, type, pairs: recordPairs });
  };

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const value = pair.value.trim();
    if (pair.code === 0 && value === "SECTION") {
      flush();
      type = null;
      recordPairs = [];
      const next = pairs[index + 1];
      section = next?.code === 2 ? next.value.trim().toUpperCase() : null;
      continue;
    }
    if (pair.code === 0 && value === "ENDSEC") {
      flush();
      type = null;
      recordPairs = [];
      section = null;
      continue;
    }
    if (pair.code === 0) {
      flush();
      type = value.toUpperCase();
      recordPairs = [pair];
      continue;
    }
    if (type) recordPairs.push(pair);
  }
  flush();
  return records;
}

function valuesForCode(record: Pair[], code: number): string[] {
  return record.filter((pair) => pair.code === code).map((pair) => pair.value.trim());
}

function valueForCode(record: Pair[], code: number): string | null {
  return valuesForCode(record, code)[0] ?? null;
}

function numbersForCode(record: Pair[], code: number): number[] {
  return valuesForCode(record, code)
    .map((value) => Number.parseFloat(value))
    .filter(Number.isFinite);
}

function numberForCode(record: Pair[], code: number, fallback: number): number {
  return numbersForCode(record, code)[0] ?? fallback;
}

function hasNonDefaultOcs(record: Pair[]): boolean {
  const hasExtrusion = record.some((pair) => pair.code === 210 || pair.code === 220 || pair.code === 230);
  if (!hasExtrusion) return false;
  const x = numberForCode(record, 210, 0);
  const y = numberForCode(record, 220, 0);
  const z = numberForCode(record, 230, 1);
  return Math.abs(x) > EPSILON || Math.abs(y) > EPSILON || Math.abs(z - 1) > EPSILON;
}

function isPaperSpace(record: Pair[]): boolean {
  return valueForCode(record, 67) === "1";
}

function isGeometryRecord(type: string): boolean {
  return new Set([
    "LINE", "POLYLINE", "LWPOLYLINE", "ARC", "CIRCLE", "ELLIPSE", "POINT", "SPLINE",
    "INSERT", "TEXT", "MTEXT", "3DFACE", "SOLID", "DIMENSION", "ATTRIB", "HATCH",
  ]).has(type);
}

function hasPolylineWidth(record: Pair[]): boolean {
  return [40, 41, 43].some((code) => numbersForCode(record, code).some((value) => Math.abs(value) > EPSILON));
}

function isNonContinuousLinetype(name: string | null): boolean {
  return Boolean(name && !CONTINUOUS_LINETYPES.has(name.trim().toUpperCase()));
}

export function auditDxfStage4(text: string): DxfStage4Audit {
  const records = parseRecords(text);
  const layers = new Map<string, { off: boolean; frozen: boolean; locked: boolean; linetype: string | null }>();

  for (const record of records) {
    if (record.section !== "TABLES" || record.type !== "LAYER") continue;
    const name = valueForCode(record.pairs, 2);
    if (!name) continue;
    const flags = Math.trunc(numberForCode(record.pairs, 70, 0));
    const colorIndex = numberForCode(record.pairs, 62, 7);
    layers.set(name, {
      off: colorIndex < 0,
      frozen: (flags & 1) !== 0 || (flags & 2) !== 0,
      locked: (flags & 4) !== 0,
      linetype: valueForCode(record.pairs, 6),
    });
  }

  const offLayers = [...layers.entries()].filter(([, layer]) => layer.off).map(([name]) => name).sort();
  const frozenLayers = [...layers.entries()].filter(([, layer]) => layer.frozen).map(([name]) => name).sort();
  const missingLayerReferences = new Set<string>();
  const nonContinuousLinetypes = new Set<string>();
  let missingLayerReferenceCount = 0;
  let nonContinuousLinetypeEntityCount = 0;
  let bulgedPolylineCount = 0;
  let widthPolylineCount = 0;
  let splineCount = 0;
  let fitPointOnlySplineCount = 0;
  let weightedSplineCount = 0;
  let closedOrPeriodicSplineCount = 0;
  let nonDefaultOcsSplineCount = 0;
  let malformedSplineCount = 0;
  let hatchCount = 0;
  let patternedHatchCount = 0;
  let gradientHatchCount = 0;
  let emptyBoundaryHatchCount = 0;
  let unsupportedHatchEdgeTypeCount = 0;
  let degenerateCurveCount = 0;
  let paperSpaceGeometryCount = 0;
  let modelSpaceGeometryCount = 0;

  for (const record of records) {
    if (!ENTITY_SECTIONS.has(record.section ?? "")) continue;
    if (isGeometryRecord(record.type)) {
      if (record.section === "ENTITIES" && isPaperSpace(record.pairs)) paperSpaceGeometryCount += 1;
      else if (record.section === "ENTITIES") modelSpaceGeometryCount += 1;
    }

    if (record.type !== "VERTEX" && isGeometryRecord(record.type)) {
      const layerName = valueForCode(record.pairs, 8) ?? "0";
      if (layers.size > 0 && !layers.has(layerName)) {
        missingLayerReferenceCount += 1;
        missingLayerReferences.add(layerName);
      }
      const explicitLinetype = valueForCode(record.pairs, 6);
      const effectiveLinetype = explicitLinetype && explicitLinetype.toUpperCase() !== "BYLAYER"
        ? explicitLinetype
        : layers.get(layerName)?.linetype ?? null;
      if (isNonContinuousLinetype(effectiveLinetype)) {
        nonContinuousLinetypeEntityCount += 1;
        if (effectiveLinetype) nonContinuousLinetypes.add(effectiveLinetype);
      }
    }

    if (record.type === "LWPOLYLINE") {
      if (numbersForCode(record.pairs, 42).some((value) => Math.abs(value) > EPSILON)) bulgedPolylineCount += 1;
      if (hasPolylineWidth(record.pairs)) widthPolylineCount += 1;
      const vertexCount = Math.trunc(numberForCode(record.pairs, 90, numbersForCode(record.pairs, 10).length));
      if (vertexCount < 2) degenerateCurveCount += 1;
    }

    if (record.type === "VERTEX") {
      if (numbersForCode(record.pairs, 42).some((value) => Math.abs(value) > EPSILON)) bulgedPolylineCount += 1;
      if (hasPolylineWidth(record.pairs)) widthPolylineCount += 1;
    }

    if (record.type === "ARC" || record.type === "CIRCLE") {
      if (numberForCode(record.pairs, 40, 0) <= EPSILON) degenerateCurveCount += 1;
    }
    if (record.type === "ELLIPSE") {
      const majorX = numberForCode(record.pairs, 11, 0);
      const majorY = numberForCode(record.pairs, 21, 0);
      const ratio = numberForCode(record.pairs, 40, 0);
      if (Math.hypot(majorX, majorY) <= EPSILON || ratio <= EPSILON) degenerateCurveCount += 1;
    }

    if (record.type === "SPLINE") {
      splineCount += 1;
      const controlPointCount = numbersForCode(record.pairs, 10).length;
      const fitPointCount = numbersForCode(record.pairs, 11).length;
      const degree = Math.trunc(numberForCode(record.pairs, 71, 3));
      const knotCount = numbersForCode(record.pairs, 40).length;
      const weightCount = numbersForCode(record.pairs, 41).length;
      const flags = Math.trunc(numberForCode(record.pairs, 70, 0));
      if (controlPointCount === 0 && fitPointCount > 0) fitPointOnlySplineCount += 1;
      if (weightCount > 0) weightedSplineCount += 1;
      if ((flags & 1) !== 0 || (flags & 2) !== 0) closedOrPeriodicSplineCount += 1;
      if (hasNonDefaultOcs(record.pairs)) nonDefaultOcsSplineCount += 1;
      if (
        controlPointCount === 0 ||
        degree < 1 ||
        (controlPointCount > 0 && degree > controlPointCount - 1) ||
        (knotCount > 0 && controlPointCount > 0 && knotCount !== controlPointCount + degree + 1)
      ) {
        malformedSplineCount += 1;
      }
    }

    if (record.type === "HATCH") {
      hatchCount += 1;
      const solidFill = Math.trunc(numberForCode(record.pairs, 70, 0)) === 1;
      if (!solidFill) patternedHatchCount += 1;
      if (numberForCode(record.pairs, 450, 0) === 1) gradientHatchCount += 1;
      if (Math.trunc(numberForCode(record.pairs, 91, 0)) <= 0) emptyBoundaryHatchCount += 1;
      unsupportedHatchEdgeTypeCount += numbersForCode(record.pairs, 72).filter((value) => value > 4).length;
    }
  }

  return {
    layerDefinitionCount: layers.size,
    offLayerCount: offLayers.length,
    offLayers,
    frozenLayerCount: frozenLayers.length,
    frozenLayers,
    lockedLayerCount: [...layers.values()].filter((layer) => layer.locked).length,
    missingLayerReferenceCount,
    missingLayerReferences: [...missingLayerReferences].sort(),
    nonContinuousLinetypeEntityCount,
    nonContinuousLinetypes: [...nonContinuousLinetypes].sort(),
    bulgedPolylineCount,
    widthPolylineCount,
    splineCount,
    fitPointOnlySplineCount,
    weightedSplineCount,
    closedOrPeriodicSplineCount,
    nonDefaultOcsSplineCount,
    malformedSplineCount,
    hatchCount,
    patternedHatchCount,
    gradientHatchCount,
    emptyBoundaryHatchCount,
    unsupportedHatchEdgeTypeCount,
    degenerateCurveCount,
    paperSpaceGeometryCount,
    modelSpaceGeometryCount,
  };
}

export function getDxfStage4Warnings(audit: DxfStage4Audit): string[] {
  const warnings: string[] = [];
  if (audit.offLayerCount > 0) warnings.push(`${audit.offLayerCount} kapalı layer render kopyasında gizlenecek: ${audit.offLayers.join(", ")}.`);
  if (audit.frozenLayerCount > 0) warnings.push(`${audit.frozenLayerCount} frozen layer kaynak DXF görünürlük durumuna uygun olarak render edilmeyecek.`);
  if (audit.missingLayerReferenceCount > 0) warnings.push(`${audit.missingLayerReferenceCount} entity tanımsız layer referansına sahip: ${audit.missingLayerReferences.join(", ")}.`);
  if (audit.nonContinuousLinetypeEntityCount > 0) warnings.push(`${audit.nonContinuousLinetypeEntityCount} entity non-continuous linetype kullanıyor (${audit.nonContinuousLinetypes.join(", ")}); mevcut engine line pattern lookup uygulamadığı için çizgi deseni birebir olmayabilir.`);
  if (audit.widthPolylineCount > 0) warnings.push(`${audit.widthPolylineCount} polyline width bilgisi içeriyor; mevcut engine shaped polyline genişliğini uygulamıyor.`);
  if (audit.patternedHatchCount > 0) warnings.push(`${audit.patternedHatchCount} patterned HATCH bulundu; pattern tessellation sonucu kaynak CAD ile görsel olarak doğrulanmalı.`);
  if (audit.paperSpaceGeometryCount > 0) warnings.push(`${audit.paperSpaceGeometryCount} paper-space entity model görünümünden ayrıştırılacak; layout/viewports sonraki aşama kapsamındadır.`);
  if (audit.degenerateCurveCount > 0) warnings.push(`${audit.degenerateCurveCount} degenerate curve/polyline bulundu; kaynak geometri ayrıca kontrol edilmeli.`);
  return warnings;
}

export function getDxfStage4BlockingIssues(audit: DxfStage4Audit): string[] {
  const issues: string[] = [];
  if (audit.modelSpaceGeometryCount === 0 && audit.paperSpaceGeometryCount > 0) {
    issues.push("DXF yalnız paper-space/layout geometrisi içeriyor; mevcut model-space viewer layout'u doğru temsil edemez.");
  }
  if (audit.fitPointOnlySplineCount > 0) {
    issues.push(`${audit.fitPointOnlySplineCount} SPLINE yalnız fit-point verisi içeriyor; mevcut engine control-point olmayan spline'ı render etmiyor.`);
  }
  if (audit.weightedSplineCount > 0) {
    issues.push(`${audit.weightedSplineCount} weighted/rational SPLINE bulundu; mevcut engine spline weight değerlerini interpolasyona uygulamıyor.`);
  }
  if (audit.closedOrPeriodicSplineCount > 0) {
    issues.push(`${audit.closedOrPeriodicSplineCount} closed/periodic SPLINE bulundu; mevcut engine spline closure/periodicity flag'lerini güvenilir biçimde uygulamıyor.`);
  }
  if (audit.nonDefaultOcsSplineCount > 0) {
    issues.push(`${audit.nonDefaultOcsSplineCount} SPLINE non-default extrusion/OCS kullanıyor; mevcut engine SPLINE extrusion dönüşümünü uygulamıyor.`);
  }
  if (audit.malformedSplineCount > 0) {
    issues.push(`${audit.malformedSplineCount} SPLINE control-point/degree/knot yapısı engine'in güvenli interpolasyon koşullarını sağlamıyor.`);
  }
  if (audit.gradientHatchCount > 0) {
    issues.push(`${audit.gradientHatchCount} gradient HATCH bulundu; mevcut renderer gradient hatch'i güvenilir biçimde desteklemiyor.`);
  }
  if (audit.emptyBoundaryHatchCount > 0 || audit.unsupportedHatchEdgeTypeCount > 0) {
    issues.push(`HATCH boundary güvenilir değil: ${audit.emptyBoundaryHatchCount} boş boundary, ${audit.unsupportedHatchEdgeTypeCount} desteklenmeyen edge type.`);
  }
  return issues;
}

export function normalizeDxfForStage4Rendering(text: string): DxfStage4NormalizationResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let section: string | null = null;
  let currentType: string | null = null;
  let recordStart = -1;
  let offLayersFrozenForRendering = 0;

  const normalizeLayerRecord = (start: number, end: number) => {
    if (section !== "TABLES" || currentType !== "LAYER" || start < 0) return;
    let colorIndex: number | null = null;
    let flagValueIndex: number | null = null;
    let flags = 0;
    for (let index = start; index + 1 < end; index += 2) {
      const code = Number.parseInt(lines[index].trim(), 10);
      if (code === 62) colorIndex = Number.parseFloat(lines[index + 1].trim());
      if (code === 70) {
        flagValueIndex = index + 1;
        flags = Number.parseInt(lines[index + 1].trim(), 10) || 0;
      }
    }
    if (colorIndex === null || colorIndex >= 0) return;
    if (flagValueIndex !== null) {
      lines[flagValueIndex] = String(flags | 1);
    } else {
      lines.splice(end, 0, "70", "1");
    }
    offLayersFrozenForRendering += 1;
  };

  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = Number.parseInt(lines[index].trim(), 10);
    if (!Number.isFinite(code)) continue;
    const value = lines[index + 1].trim().toUpperCase();
    if (code === 0) {
      normalizeLayerRecord(recordStart, index);
      if (value === "SECTION") {
        const nextCode = Number.parseInt(lines[index + 2]?.trim() ?? "", 10);
        section = nextCode === 2 ? lines[index + 3]?.trim().toUpperCase() ?? null : null;
      } else if (value === "ENDSEC") {
        section = null;
      }
      currentType = value;
      recordStart = index;
    }
  }
  normalizeLayerRecord(recordStart, lines.length);

  return { text: lines.join("\n"), offLayersFrozenForRendering };
}

function finite(values: number[]): boolean {
  return values.every(Number.isFinite);
}

export function validateDxfStage4ViewerSnapshot(
  audit: DxfStage4Audit,
  snapshot: DxfStage4ViewerSnapshot
): DxfStage4ViewerValidation {
  const warnings: string[] = [];
  const blockingIssues: string[] = [];

  if (!finite([snapshot.viewport.width, snapshot.viewport.height]) || snapshot.viewport.width < 2 || snapshot.viewport.height < 2) {
    blockingIssues.push("DXF viewport boyutu sıfır veya geçersiz; güvenilir FitView hesaplanamaz.");
  }

  if (audit.modelSpaceGeometryCount > 0) {
    if (!snapshot.bounds || !finite([snapshot.bounds.minX, snapshot.bounds.maxX, snapshot.bounds.minY, snapshot.bounds.maxY])) {
      blockingIssues.push("Model-space geometri var ancak renderer sonlu bounds üretmedi.");
    } else if (snapshot.bounds.minX > snapshot.bounds.maxX || snapshot.bounds.minY > snapshot.bounds.maxY) {
      blockingIssues.push("Renderer bounds sıralaması geçersiz.");
    }
    if (!snapshot.origin || !finite([snapshot.origin.x, snapshot.origin.y])) {
      blockingIssues.push("Renderer geçerli scene origin üretmedi.");
    }
  }

  if (!snapshot.camera || !finite([
    snapshot.camera.left, snapshot.camera.right, snapshot.camera.top, snapshot.camera.bottom,
    snapshot.camera.zoom, snapshot.camera.position.x, snapshot.camera.position.y, snapshot.camera.position.z,
  ])) {
    blockingIssues.push("FitView sonrası kamera/frustum sonlu değerler üretmedi.");
  } else if (snapshot.camera.right <= snapshot.camera.left || snapshot.camera.top <= snapshot.camera.bottom || snapshot.camera.zoom <= 0) {
    blockingIssues.push("FitView sonrası kamera frustum ölçüleri geçersiz.");
  }

  if (snapshot.bounds && snapshot.origin && snapshot.camera && blockingIssues.length === 0) {
    const minX = snapshot.bounds.minX - snapshot.origin.x;
    const maxX = snapshot.bounds.maxX - snapshot.origin.x;
    const minY = snapshot.bounds.minY - snapshot.origin.y;
    const maxY = snapshot.bounds.maxY - snapshot.origin.y;
    const expectedCenterX = (minX + maxX) / 2;
    const expectedCenterY = (minY + maxY) / 2;
    const span = Math.max(Math.abs(maxX - minX), Math.abs(maxY - minY), 1);
    const tolerance = span * 1e-6 + 1e-6;
    if (
      Math.abs(snapshot.camera.position.x - expectedCenterX) > tolerance ||
      Math.abs(snapshot.camera.position.y - expectedCenterY) > tolerance
    ) {
      blockingIssues.push("FitView kamera merkezi çizim bounds merkeziyle uyuşmuyor.");
    }

    const visibleMinX = snapshot.camera.position.x + snapshot.camera.left / snapshot.camera.zoom;
    const visibleMaxX = snapshot.camera.position.x + snapshot.camera.right / snapshot.camera.zoom;
    const visibleMinY = snapshot.camera.position.y + snapshot.camera.bottom / snapshot.camera.zoom;
    const visibleMaxY = snapshot.camera.position.y + snapshot.camera.top / snapshot.camera.zoom;
    if (minX < visibleMinX - tolerance || maxX > visibleMaxX + tolerance || minY < visibleMinY - tolerance || maxY > visibleMaxY + tolerance) {
      blockingIssues.push("FitView frustum çizim bounds'un tamamını kapsamıyor.");
    }
  }

  const viewerLayers = new Set(snapshot.layers);
  for (const layer of audit.frozenLayers) {
    if (viewerLayers.has(layer)) warnings.push(`Frozen layer renderer layer listesinde kaldı: ${layer}.`);
  }
  return { warnings, blockingIssues };
}
