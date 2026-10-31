/**
 * Read-only IDE Building Designer Ver 4/SubVer 00 geometry reader.
 *
 * This reads the stored float64 footprints, reference lines, widths, offsets,
 * IDs and storey records. It does not execute ideCAD or reconstruct analysis
 * results. The common record grammar is checked through to the name field;
 * nearby numbers are never accepted as coordinates merely because they look
 * plausible. See the retained ide10 investigation for the observed grammar.
 */
import { readIdeStairTemplate } from "./stairs";
import { readIdeStairAnalysisSurface } from "./stair-analysis-mesh";
import { deriveIdeStairPlan } from "./stair-plan";
import { readNativeBeamSection, readNativeWallHeight, readNativeWallPlanSection } from "./native-plan-labels";
import { createIdeDataView, hasIdeEncodedNumbers, isIde11SchemaVersion } from "./numeric-codec";
export type IdePoint = { x: number; y: number };
export type IdeElementType = "column" | "beam" | "wall" | "slab" | "stair" | "band" | "section" | "axis" | "slabEdge" | "line" | "unknown";
export interface IdeMesh {
  /** Native world XYZ in metres; do not add the floor elevation again. */
  positions: number[];
  indices?: number[];
  source: "native-analysis-mesh" | "parametric-derived";
  /** Original four-node faces. Triangle indices split each along 0–2. */
  quads?: number[];
  sourceOffset?: number;
  connectivityOffset?: number;
  sourceNodeCount?: number;
  sourceFaceCount?: number;
  surfaceOnly?: boolean;
  nonPlanarQuads?: number;
  maxNonPlanarity?: number;
}
export interface IdeFloor {
  id: string;
  name: string;
  elevation: number;
  height: number;
  sourceOffset: number;
  endOffset: number;
}
export interface IdeElement {
  id: string;
  nativeId: number;
  name: string;
  type: IdeElementType;
  floorId: string;
  points: IdePoint[];
  footprint?: IdePoint[];
  holes?: IdePoint[][];
  mesh?: IdeMesh;
  /** Source-derived plan paths, including projected native mesh boundaries. */
  planPaths?: IdePoint[][];
  /** Source-count-derived stair numbers; native XY, CCW rotation in radians. */
  planTexts?: { point: IdePoint; text: string; rotation?: number }[];
  planGeometrySource?: "parametric-derived";
  stairParameters?: { variables: Record<string, number>; areas: { name: string; kind: "flight" | "landing"; riserCountParameter: number; riseParameter: number; treadParameter: number }[] };
  width?: number;
  thickness?: number;
  height?: number;
  bottom?: number;
  top?: number;
  sourceOffset: number;
  primitiveType: number;
  layerId: number;
  nativeZ: number;
  lateralOffset: number;
  rotation: number;
  sectionLabel?: string;
  planAnnotation?: { section?: string; loads?: { dead: number; live: number; unit: "tf/m²"; sourceOffset: number }; designAxes?: { points: IdePoint[]; direction: "x" | "y"; sourceOffset: number }[] };
  foundation?: boolean;
  verticalSource?: "storey-derived" | "native-analysis-mesh" | "native-wall-height";
  nativeHeightOffset?: number;
  structural?: boolean;
  /** Only the native plan representation is established; do not infer a solid. */
  planOnly?: boolean;
}
export interface IdeCoverage {
  candidateRecords: number;
  decodedRecords: number;
  unsupportedRecords: number;
  ignoredTemplateRecords: number;
  holeRecords: number;
  rejectedCandidates: number;
  byType: Record<string, number>;
  unsupportedTypes: Record<string, number>;
  limitations: string[];
}
export interface IdeProject {
  format: "ide10" | "ide11" | "ide11trial";
  filename: string;
  name: string;
  byteLength: number;
  floors: IdeFloor[];
  elements: IdeElement[];
  coverage: IdeCoverage;
  warnings: string[];
}

type Candidate = { nameOffset: number; name: string; bbox: number[] };
type NativeGeometry = {
  primitiveType: number;
  points: IdePoint[];
  geometryOffset: number;
  nativeId: number;
  nativeZ: number;
  width: number;
  layerId: number;
  rotation: number;
  lateralOffset: number;
  relations: number[];
};
const HEADER = "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n";
const MAX_FILE_BYTES = 512 * 1024 * 1024;
const MAX_POINTS = 2048;
const MAX_REFS = 16384;
const MAX_GEOMETRY_BYTES = MAX_POINTS * 16 + MAX_REFS * 4 + 512;
const KNOWN_TYPES: Record<number, IdeElementType> = { 2: "wall", 4: "column", 5: "beam", 6: "axis", 7: "slab", 17: "wall", 40: "stair", 44: "line", 45: "slabEdge", 123: "section", 128: "band" };

function finiteCoordinate(n: number) { return Number.isFinite(n) && Math.abs(n) <= 1_000_000; }
function increment(dict: Record<string, number>, key: string) { dict[key] = (dict[key] ?? 0) + 1; }

function readString(bytes: Uint8Array, view: DataView, at: number, decoder: TextDecoder): string | undefined {
  if (at < 0 || at + 4 > bytes.length) return;
  const length = view.getUint32(at, true);
  if (length < 1 || length > 161 || at + 4 + length > bytes.length || bytes[at + 3 + length] !== 0) return;
  for (let j = at + 4; j < at + 3 + length; j++) if (bytes[j] < 32 || bytes[j] === 127 || bytes[j] === 255) return;
  return decoder.decode(bytes.subarray(at + 4, at + 3 + length));
}

function followsFloorTemplate(bytes: Uint8Array, view: DataView, at: number): boolean {
  // Native floor preferences end in a serialized default stair label T01 (or
  // another T+digits label), followed by the floor-name serialization flag.
  if (bytes[at - 1] !== 0 || bytes[at - 2] !== 0) return false;
  for (let length = 3; length <= 8; length++) {
    const start = at - 2 - length;
    if (start < 4 || bytes[start] !== 84 || view.getUint32(start - 4, true) !== length + 1) continue;
    let digits = true;
    for (let j = start + 1; j < at - 2; j++) if (bytes[j] < 48 || bytes[j] > 57) digits = false;
    if (digits) return true;
  }
  return false;
}

/** The first real storey has no preceding default-object T01 template.
 * Its native viewport title and duplicated view coordinates authenticate it.
 * This also avoids mistaking later report/name strings for storey headers. */
function hasNativeFloorHeader(bytes: Uint8Array, view: DataView, at: number, name: string, decoder: TextDecoder): boolean {
  const length = view.getUint32(at, true), data = at + 4 + length;
  if (data + 100 >= bytes.length) return false;
  const ordinal = view.getInt32(data + 16, true), marker = view.getUint32(data + 24, true);
  if (Math.abs(ordinal) > 1000 || view.getUint32(data + 20, true) === 0 || (marker !== 0 && marker !== 0xffffffff)) return false;
  // Native story reader adds a second u32 reference from version 211150.
  const viewport = data + (view.getUint32(74, true) >= 211150 ? 4 : 0);
  const viewScale = view.getFloat64(viewport + 28, true);
  if (!Number.isFinite(viewScale) || viewScale <= 0 || viewScale > 1000) return false;
  // Four consecutive viewport coordinate values are serialized twice each.
  for (let j = 0; j < 4; j++) {
    const a = view.getFloat64(viewport + 36 + j * 16, true), b = view.getFloat64(viewport + 44 + j * 16, true);
    if (!finiteCoordinate(a) || a !== b) return false;
  }
  if (view.getFloat64(viewport + 36, true) === view.getFloat64(viewport + 52, true) || view.getFloat64(viewport + 68, true) === view.getFloat64(viewport + 84, true)) return false;
  for (let p = data + 100; p < Math.min(bytes.length - 165, data + 1800); p++) {
    const title = readString(bytes, view, p, decoder);
    if (title?.startsWith(`${name} TAVANI, `) && / KOTU$/.test(title)) return true;
  }
  return false;
}

function readNativeGeometry(view: DataView, c: Candidate, encoded: boolean): NativeGeometry | undefined {
  const nameOffset = c.nameOffset, bboxOffset = nameOffset - 21;
  // Empty strings also occur in analysis arrays and drawing-sheet records.
  // Only a fully checked native slab-hole record is relevant to this reader
  // when an object has no name; do not count arbitrary zero bytes as objects.
  const min = Math.max(0, nameOffset - (c.name ? MAX_GEOMETRY_BYTES : 8192));
  // The last common geometry record ending at this exact name is the owner.
  // All variable-length reference lists and the final bbox must line up.
  for (let p = bboxOffset - 36; p >= min; p--) {
    const primitiveType = view.getUint32(p, true), count = view.getUint32(p + 4, true);
    if (primitiveType < 1 || (primitiveType > 100 && primitiveType !== 123 && primitiveType !== 128) || count < 1 || count > MAX_POINTS || (count === 1 && primitiveType !== 40) || (primitiveType === 40 && count !== 1)) continue;
    if ((primitiveType === 123 || primitiveType === 128) && count !== 2) continue;
    if (!c.name && primitiveType !== 13) continue;
    const tail = p + 8 + count * 16;
    if (tail + 60 > nameOffset) continue;
    const nativeId = view.getUint32(tail, true), nativeZ = view.getFloat64(tail + 4, true) * (encoded ? 0.5 : 1), width = view.getFloat64(tail + 12, true) * (encoded ? 1 / 3 : 1), layerId = view.getUint32(tail + 20, true);
    if (nativeId === 0 || !finiteCoordinate(nativeZ) || !Number.isFinite(width) || width < 0 || width > 1000 || layerId > 100000) continue;
    let cursor = tail + 24, valid = true, rotation = 0;
    const relations: number[] = [];
    for (let list = 0; list < 3; list++) {
      if (cursor + 4 > bboxOffset) { valid = false; break; }
      const length = view.getUint32(cursor, true);
      cursor += 4;
      if (length > MAX_REFS || cursor + length * 4 > bboxOffset) { valid = false; break; }
      if (list === 1) for (let j = 0; j < length; j++) relations.push(view.getUint32(cursor + j * 4, true));
      cursor += length * 4;
      if (list === 0) {
        // The 211220 native writer adds four opaque u32 values after the
        // first reference list, even when empty, before the stored rotation.
        // Their meaning is not inferred; subsequent fields must still align.
        if (encoded) cursor += 16;
        if (cursor + 8 > bboxOffset) { valid = false; break; }
        rotation = view.getFloat64(cursor, true); cursor += 8;
      }
    }
    if (!valid || cursor + 8 !== bboxOffset || !Number.isFinite(rotation)) continue;
    const lateralOffset = view.getFloat64(cursor, true);
    if (!Number.isFinite(lateralOffset) || Math.abs(lateralOffset) > 1000) continue;
    const points: IdePoint[] = [];
    const tolerance = Math.max(0.00002, ...c.bbox.map(v => Math.abs(v) * 2e-7));
    for (let j = 0; j < count; j++) {
      const x = view.getFloat64(p + 8 + j * 16, true), y = view.getFloat64(p + 16 + j * 16, true);
      if (!finiteCoordinate(x) || !finiteCoordinate(y) || x < c.bbox[0] - tolerance || x > c.bbox[2] + tolerance || y < c.bbox[1] - tolerance || y > c.bbox[3] + tolerance) { valid = false; break; }
      points.push({ x, y });
    }
    if (!valid) continue;
    let spread = 0;
    for (const point of points) spread = Math.max(spread, Math.hypot(point.x - points[0].x, point.y - points[0].y));
    if (spread < 1e-8 && primitiveType !== 40) continue;
    return { primitiveType, points, geometryOffset: p, nativeId, nativeZ, width, layerId, rotation, lateralOffset, relations };
  }
}

function lineFootprint(geometry: NativeGeometry): IdePoint[] | undefined {
  const [a, b] = geometry.points;
  if (geometry.points.length !== 2 || geometry.width <= 0) return;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 1e-8) return;
  const nx = -(b.y - a.y) / length, ny = (b.x - a.x) / length;
  const left = geometry.lateralOffset, right = left - geometry.width;
  return [
    { x: a.x + nx * right, y: a.y + ny * right },
    { x: b.x + nx * right, y: b.y + ny * right },
    { x: b.x + nx * left, y: b.y + ny * left },
    { x: a.x + nx * left, y: a.y + ny * left },
  ];
}

function matchesBounds(points: IdePoint[], bbox: number[]): boolean {
  if (!points.length) return false;
  const actual = [Math.min(...points.map(p => p.x)), Math.min(...points.map(p => p.y)), Math.max(...points.map(p => p.x)), Math.max(...points.map(p => p.y))];
  // Native display bounds also include labels and joined member ends. A label
  // can extend beyond its stored footprint, so equality would discard valid
  // narrow slabs. The actual footprint must be contained in those bounds.
  return actual.every((v, i) => i < 2 ? v >= bbox[i] - Math.max(0.0001, Math.abs(v) * 3e-7) : v <= bbox[i] + Math.max(0.0001, Math.abs(v) * 3e-7));
}

function readBeamSection(bytes: Uint8Array, view: DataView, c: Candidate, geometry: NativeGeometry, decoder: TextDecoder): { sectionLabel?: string; height?: number } {
  const start = c.nameOffset + c.name.length + 1, end = Math.min(bytes.length - 30, start + 1400);
  for (let p = start; p < end; p++) {
    const label = readString(bytes, view, p, decoder);
    if (!label || !/^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(label)) continue;
    const [width, height] = label.split("/").map(v => Number(v.replace(",", ".")) / 100);
    if (Math.abs(width - geometry.width) < 0.00001 && height > 0.01 && height <= 10) return { sectionLabel: label, height };
  }
  return {};
}

/** Native slab loading fields, authenticated by their surrounding record tags.
 * Unit and G/Q semantics are corroborated by the human-supplied D4/D5 native
 * screenshots. No screenshot constant is substituted for a missing field. */
function readSlabPlanLoads(bytes: Uint8Array, view: DataView, c: Candidate, v11Schema: boolean): IdeElement["planAnnotation"] {
  const p = c.nameOffset + c.name.length + 1;
  const shift = v11Schema ? 4 : 0;
  if (p + 515 + shift > bytes.length || (v11Schema && view.getUint32(p + 470, true) !== 36) || view.getUint32(p + 470 + shift, true) !== 1 || view.getUint32(p + 475 + shift, true) !== 1 || !((view.getUint32(p + 466, true) === 43 && view.getUint32(p + 489 + shift, true) === 85 && view.getUint32(p + 493 + shift, true) === 45) || (view.getUint32(p + 466, true) === 11 && view.getUint32(p + 489 + shift, true) === 1 && [81, 65].includes(view.getUint32(p + 493 + shift, true))))) return;
  const dead = view.getFloat64(p + 497 + shift, true), live = view.getFloat64(p + 481 + shift, true);
  if (![dead, live].every(value => Number.isFinite(value) && value >= 0 && value <= 1000)) return;
  return { loads: { dead, live, unit: "tf/m²", sourceOffset: p + 481 + shift } };
}

/** Slab calculation axes have a native normalized line equation followed
 * by four source points repeating the same two endpoints. The second record's
 * byte length varies with reinforcement data, so its orthogonal equation is
 * checked within this slab's own record, never beyond the next native object. */
function readSlabDesignAxes(bytes: Uint8Array, view: DataView, c: Candidate, recordEnd: number, encoded: boolean, v11Schema = encoded): NonNullable<IdeElement["planAnnotation"]>["designAxes"] {
  const p = c.nameOffset + c.name.length + 1, end = Math.min(recordEnd, bytes.length, p + 12000);
  // This packed equation/point array is raw even in encoded carriers.
  const floats = encoded ? new DataView(view.buffer, view.byteOffset, view.byteLength) : view;
  const shift = v11Schema ? 4 : 0;
  const read = (offset: number) => {
    if (offset - 24 < p || offset + 64 > end) return;
    const a = floats.getFloat64(offset - 24, true), b = floats.getFloat64(offset - 16, true), d = floats.getFloat64(offset - 8, true);
    if (![a, b, d].every(finiteCoordinate) || Math.abs(a * a + b * b - 1) > 1e-8) return;
    const points = Array.from({ length: 4 }, (_, j) => ({ x: floats.getFloat64(offset + j * 16, true), y: floats.getFloat64(offset + j * 16 + 8, true) }));
    const tolerance = 0.0001;
    if (points.some(q => !finiteCoordinate(q.x) || !finiteCoordinate(q.y) || q.x < c.bbox[0] - tolerance || q.x > c.bbox[2] + tolerance || q.y < c.bbox[1] - tolerance || q.y > c.bbox[3] + tolerance || Math.abs(a * q.x + b * q.y + d) > 1e-6)) return;
    if (Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) < 0.01 || points.slice(2).some(q => !points.slice(0, 2).some(r => Math.hypot(q.x - r.x, q.y - r.y) < 1e-7))) return;
    // Only the source horizontal/vertical families are understood here.
    if (Math.min(Math.abs(a), Math.abs(b)) > 1e-7) return;
    return { a, b, axis: { points: points.slice(0, 2), direction: (Math.abs(a) < Math.abs(b) ? "x" : "y") as "x" | "y", sourceOffset: offset } };
  };
  const first = read(p + 776 + shift);
  if (!first) return;
  const seconds: NonNullable<ReturnType<typeof read>>[] = [];
  for (let offset = p + 976 + shift; offset + 64 < end; offset++) {
    const candidate = read(offset);
    if (candidate && Math.abs(first.a * candidate.a + first.b * candidate.b) < 1e-7) seconds.push(candidate);
  }
  return seconds.length === 1 ? [first.axis, seconds[0].axis] : [first.axis];
}

/** Parse a local .ide10 without modifying it. Run this in a worker for large files. */
export function parseIde10(buffer: ArrayBuffer, filename: string): IdeProject {
  if (buffer.byteLength > MAX_FILE_BYTES) throw new Error("IDE dosyası 512 MB sınırını aşıyor.");
  const bytes = new Uint8Array(buffer), decoder = new TextDecoder("windows-1254");
  if (bytes.length < HEADER.length + 24 || HEADER.split("").some((c, i) => bytes[i] !== c.charCodeAt(0))) throw new Error("Bu dosya desteklenen IDE Building Designer Ver 4/SubVer 00 biçiminde değil.");
  const view = createIdeDataView(buffer);
  const encoded = hasIdeEncodedNumbers(buffer);
  const v11Schema = isIde11SchemaVersion(buffer);
  if ((encoded || v11Schema) && view.getUint32(79, true) !== bytes.length) throw new Error("IDE dosyasının kayıtlı boyutu uyuşmuyor. Dosya eksik veya bozulmuş olabilir.");
  const candidates: Candidate[] = [], floors: IdeFloor[] = [];
  for (let i = 24; i < bytes.length - 24; i++) {
    // Every accepted string has its full stored length and NUL terminator.
    const length = view.getUint32(i, true);
    if (length < 1 || length > 161 || i + 4 + length + 20 > bytes.length || bytes[i + 3 + length] !== 0) continue;
    const text = readString(bytes, view, i, decoder);
    if (text === undefined) continue;
    const at = i + 4;
    if (text && (followsFloorTemplate(bytes, view, i) || hasNativeFloorHeader(bytes, view, i, text, decoder))) {
      const elevation = view.getFloat64(at + length, true), height = view.getFloat64(at + length + 8, true);
      if (finiteCoordinate(elevation) && Number.isFinite(height) && height >= 0.1 && height <= 100) floors.push({ id: `ide-floor-${floors.length}`, name: text, elevation, height, sourceOffset: at, endOffset: bytes.length });
    }
    if (at < 21) continue;
    // Native indexed colour values bracket 1,000,000,000. The geometry/name
    // grammar below, rather than a colour alone, establishes a decoded record.
    const color = view.getUint32(at + length, true);
    if (color < 999999000 || color > 1000001000) continue;
    const bbox = [0, 1, 2, 3].map(j => view.getFloat32(at - 21 + j * 4, true));
    if (bbox.some(v => !finiteCoordinate(v)) || bbox[2] < bbox[0] - 0.00001 || bbox[3] < bbox[1] - 0.00001 || bbox[2] - bbox[0] + bbox[3] - bbox[1] < 1e-8) continue;
    candidates.push({ nameOffset: at, name: text, bbox });
  }
  if (!floors.length) throw new Error("IDE dosyasında doğrulanabilir kat kayıtları bulunamadı. Bu sürümün kat yapısı henüz desteklenmiyor.");
  for (let i = 0; i < floors.length - 1; i++) floors[i].endOffset = floors[i + 1].sourceOffset;
  const coverage: IdeCoverage = { candidateRecords: 0, decodedRecords: 0, unsupportedRecords: 0, ignoredTemplateRecords: 0, holeRecords: 0, rejectedCandidates: 0, byType: {}, unsupportedTypes: {}, limitations: [
    "Plan konumları, kat kotları ve yükseklikleri, kesit genişlikleri, yanal kaçıklıklar ve döşeme boşlukları dosyadan okunur.",
    "Bant kirişler kaynak plan genişliği ve kaçıklığıyla, kesit işaretleri kaynak çizgisiyle gösterilir. Bu iki türün 3B gövdesi, özel kotu, kesit okları ve kesit çizimi henüz doğrulanmamıştır.",
    "Merdivenler dosyada saklanan yerel XYZ düğümleri ve dört düğümlü bağlantılardan analiz yüzeyi olarak okunur; basamak, kaplama, korkuluk veya kapalı katı gövde eşdeğerliği iddia edilmez.",
    "Saklanan merdiven analiz ağının son model düzenlemesiyle güncelliği henüz doğrulanmamıştır. Statik hesap sonuçları, donatı çizimleri ve paftalar görüntülenmez.",
    "Duvarların yüksekliği kaynak duvar kaydından okunur. Diğer taşıyıcıların 3B düşey sınırları kat aralıklarından ve kiriş kesit ölçülerinden oluşturulur. Özel eleman üst/alt kot ayarlarının tamamı henüz çözümlenmemiştir.",
    "Bu görünüm incelenmiş eleman türlerini kapsar; dosyanın bütün özelliklerinin ideCAD ile aynı açıldığı anlamına gelmez.",
  ] };
  const elements: IdeElement[] = [], nativeGeometries = new Map<string, NativeGeometry>();
  const slabs: { element: IdeElement; geometry: NativeGeometry }[] = [];
  const geometryCache = new Map<number, NativeGeometry | undefined>();
  const geometryAt = (index: number) => {
    if (!geometryCache.has(index)) geometryCache.set(index, readNativeGeometry(view, candidates[index], encoded));
    return geometryCache.get(index);
  };
  const nextGeometryOffset = (index: number) => {
    for (let i = index + 1; i < candidates.length; i++) { const geometry = geometryAt(i); if (geometry) return geometry.geometryOffset; }
    return bytes.length;
  };
  let floorIndex = 0;
  for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
    const c = candidates[candidateIndex];
    if (c.nameOffset < floors[0].sourceOffset) { coverage.ignoredTemplateRecords++; continue; }
    while (floorIndex < floors.length - 1 && c.nameOffset >= floors[floorIndex + 1].sourceOffset) floorIndex++;
    const floor = floors[floorIndex];
    coverage.candidateRecords++;
    const g = geometryAt(candidateIndex);
    if (!g) {
      if (!c.name) coverage.rejectedCandidates++;
      else { coverage.unsupportedRecords++; increment(coverage.unsupportedTypes, c.name.startsWith("M") ? "Merdiven/özel kayıt" : "Çözümlenmeyen ortak kayıt"); }
      continue;
    }
    nativeGeometries.set(`${floor.id}:${g.nativeId}`, g);
    if (g.primitiveType === 13) { coverage.holeRecords++; continue; }
    const type = KNOWN_TYPES[g.primitiveType];
    if (!type) { coverage.unsupportedRecords++; increment(coverage.unsupportedTypes, `Tür ${g.primitiveType}`); continue; }
    if (type === "stair") {
      const template = readIdeStairTemplate(bytes, view, c.nameOffset, c.name.length + 1);
      const surface = template && readIdeStairAnalysisSurface(bytes, view, template.endOffset, nextGeometryOffset(candidateIndex), c.bbox, encoded);
      if (!template || !surface) { coverage.unsupportedRecords++; increment(coverage.unsupportedTypes, "Merdiven analiz ağı çözümlenemedi"); continue; }
      const plan = deriveIdeStairPlan(template, g.points[0], surface.mesh);
      elements.push({
        id: `${floor.id}:${g.nativeId}`, nativeId: g.nativeId, name: c.name || `Merdiven ${g.nativeId}`, type, floorId: floor.id, points: g.points,
        sourceOffset: c.nameOffset, primitiveType: g.primitiveType, layerId: g.layerId, nativeZ: g.nativeZ, lateralOffset: g.lateralOffset, rotation: g.rotation,
        mesh: surface.mesh, planPaths: [...surface.planPaths, ...(plan?.paths ?? [])], ...(plan ? { planTexts: plan.texts, planGeometrySource: plan.source } : {}), bottom: surface.bottom, top: surface.top, height: surface.top - surface.bottom, verticalSource: "native-analysis-mesh",
        stairParameters: { variables: template.variables, areas: template.areas.map(area => ({ name: area.name, kind: area.kind, riserCountParameter: area.riserCountParameter, riseParameter: area.riseParameter, treadParameter: area.treadParameter })) },
      });
      coverage.decodedRecords++; increment(coverage.byType, type); continue;
    }
    let footprint: IdePoint[] | undefined;
    if (type === "column" || type === "slab") footprint = g.points;
    if (type === "beam" || type === "wall" || type === "band") footprint = lineFootprint(g);
    if (footprint && !matchesBounds(footprint, c.bbox)) { coverage.unsupportedRecords++; increment(coverage.unsupportedTypes, "Sınırı uyuşmayan geometri"); continue; }
    const element: IdeElement = {
      id: `${floor.id}:${g.nativeId}`, nativeId: g.nativeId, name: c.name || `Eleman ${g.nativeId}`, type, floorId: floor.id, points: g.points, ...(footprint ? { footprint } : {}),
      sourceOffset: c.nameOffset, primitiveType: g.primitiveType, layerId: g.layerId, nativeZ: g.nativeZ, lateralOffset: g.lateralOffset, rotation: g.rotation,
      ...((type === "beam" || type === "wall" || type === "band") ? { width: g.width } : {}), ...(type === "slab" ? { thickness: g.width } : {}),
      ...((type === "band" || type === "section") ? { planOnly: true } : {}),
      ...(type === "beam" ? (v11Schema ? (readNativeBeamSection(view, c.nameOffset, c.name, nextGeometryOffset(candidateIndex), g.width) ?? readBeamSection(bytes, view, c, g, decoder)) : readBeamSection(bytes, view, c, g, decoder)) : {}),
      ...(type === "wall" ? { structural: g.primitiveType === 17 } : {}),
    };
    
    const section = type === "beam" ? element.sectionLabel : type === "wall" && element.structural ? readNativeWallPlanSection(bytes, view, c.nameOffset, element.name, nextGeometryOffset(candidateIndex), g.points, g.width) : undefined;
    const annotation = type === "slab" ? readSlabPlanLoads(bytes, view, c, v11Schema) : undefined;
    if (type === "slab" && annotation?.loads) annotation.designAxes = readSlabDesignAxes(bytes, view, c, nextGeometryOffset(candidateIndex), encoded, v11Schema);
    if (section || annotation) element.planAnnotation = { ...annotation, ...(section ? { section } : {}) };
    // These are explicitly derived display ranges. The floor dimensions are
    // native; their zero-offset placement convention is documented by ideCAD.
    // Per-element special elevation overrides have not yet been decoded.
    const attributes = c.nameOffset + c.name.length + 1;
    if (type === "slab") {
      element.foundation = (view.getUint32(attributes + 8, true) & 0x00200000) !== 0;
      element.top = floor.elevation + g.nativeZ + (element.foundation ? 0 : floor.height);
      element.bottom = element.top - g.width;
      element.verticalSource = "storey-derived";
    } else if (type === "wall" && element.structural === false) {
      const nativeHeight = readNativeWallHeight(view, c.nameOffset, element.name, nextGeometryOffset(candidateIndex));
      if (nativeHeight) {
        element.bottom = floor.elevation + g.nativeZ;
        element.height = nativeHeight.height;
        element.top = element.bottom + nativeHeight.height;
        element.nativeHeightOffset = nativeHeight.sourceOffset;
        element.verticalSource = "native-wall-height";
      } else element.planOnly = true;
    } else if (type === "column" || type === "wall") {
      element.bottom = floor.elevation + g.nativeZ;
      element.top = floor.elevation + floor.height;
      element.height = element.top - element.bottom;
      element.verticalSource = "storey-derived";
    } else if (type === "beam" && element.height !== undefined) {
      element.top = floor.elevation + floor.height + g.nativeZ;
      element.bottom = element.top - element.height;
      element.verticalSource = "storey-derived";
    }
    elements.push(element); coverage.decodedRecords++; increment(coverage.byType, type);
    if (type === "slab") slabs.push({ element, geometry: g });
  }
  for (const { element, geometry } of slabs) {
    const holes: IdePoint[][] = [];
    for (const id of geometry.relations) {
      const hole = nativeGeometries.get(`${element.floorId}:${id}`);
      if (hole?.primitiveType === 13) holes.push(hole.points);
    }
    if (holes.length) element.holes = holes;
  }
  if (!elements.some(e => e.footprint?.length)) throw new Error("IDE dosyasından doğrulanmış taşıyıcı eleman geometrisi okunamadı.");
  const warnings = ["Bu görünüm yerel IDE plan verilerinden üretilmiştir. ideCAD ile tam görsel ve hesap eşdeğerliği doğrulanmış değildir."];
  if (hasIdeEncodedNumbers(buffer)) warnings.push("Deneme sürümünün sayısal kayıtları dosya biçimine uygun çözümlendi. Özgün dosya değiştirilmedi; bu işlem IDE10/IDE11 sürüm dönüşümü değildir.");
  if (coverage.unsupportedRecords) warnings.push(`${coverage.unsupportedRecords} kayıt henüz görüntülenemiyor; kapsam ayrıntılarını inceleyin.`);
  let demoFlag = 0;
  if (bytes.length >= 120) {
    const nameLen = view.getUint32(96, true);
    if (116 + nameLen <= bytes.length) {
      const cLen = view.getUint32(112 + nameLen, true);
      const previewEnd = 116 + nameLen + cLen;
      if (v11Schema) {
        if (previewEnd + 34 <= bytes.length && view.getUint32(previewEnd + 30, true) === 0x000005ce) {
          demoFlag = bytes[previewEnd + 29];
        }
      } else if (previewEnd + 2 <= bytes.length) {
        demoFlag = bytes[previewEnd + 1];
      }
    }
  }
  const detectedFormat: IdeProject["format"] =
    /\.ide11trial$/i.test(filename)
      ? "ide11trial"
      : /\.ide11$/i.test(filename)
        ? "ide11"
        : v11Schema
          ? (demoFlag !== 0 ? "ide11trial" : "ide11")
          : "ide10";
  return { format: detectedFormat, filename, name: filename.replace(/^.*[\\/]/, "").replace(/\.(?:ide10|ide11|ide11trial)$/i, ""), byteLength: bytes.length, floors, elements, coverage, warnings };
}
