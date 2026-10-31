import type { IdePoint } from "./index";
import { evaluateStairExpression } from "./stair-geometry";

/**
 * Counted, read-only stair-template grammar observed in IDE Ver 4/SubVer 00.
 * This is an embedded parametric graph, not an authenticated cached mesh.
 * Native placement, edited-node trailers and automatic riser rules must be
 * established separately before converting the graph into world geometry.
 */
export interface IdeStairNode {
  id: number;
  name: string;
  sourceOffset: number;
  kind: "primary" | "secondary" | "free";
  method?: number;
  xExpression?: string;
  yExpression?: string;
  expression?: string;
  /** Raw native trailer scalars; their placement/edit semantics are unknown. */
  nativeTrailer: number[];
}
export interface IdeStairCurve {
  sourceOffset: number;
  kind: number;
  nativeParameters: [number, number];
  nodeIds: number[];
  ownerId?: number;
  nativeFlags?: number[];
  nativeFactor?: number;
}
export interface IdeStairContour {
  id: number;
  name: string;
  sourceOffset: number;
  curves: IdeStairCurve[];
  breakMode: number;
  inside: boolean;
  drawMode: number;
}
export interface IdeStairLot {
  id: number;
  name: string;
  curves: IdeStairCurve[];
  startCircle: boolean;
  endArrow: boolean;
  circleExpression: string;
  arrowExpression: string;
  ownerId: number;
}
export interface IdeStairArea {
  id: number;
  name: string;
  sourceOffset: number;
  kind: "flight" | "landing";
  contourIds: number[];
  contourDirections: boolean[];
  railingIds: number[];
  lotIds: number[];
  /** Zero selects a native automatic rise/tread mode, which is unresolved. */
  riserCountParameter: number;
  riseParameter: number;
  treadParameter: number;
  skewBegin: number;
  skewEnd: number;
  skewMethod: number;
  minTread: number;
  totalRiseExpression: string;
  elevationExpression: string;
  thicknessExpression: string;
  /** Retained verbatim until all nine flag meanings have been established. */
  nativeOptions: number[];
  previousName: string;
  nextName: string;
}
export interface IdeStairTemplate {
  source: "native-parametric-template";
  sourceOffset: number;
  endOffset: number;
  variables: Record<string, number>;
  variableDefinitions: Record<string, string>;
  nodes: IdeStairNode[];
  contours: IdeStairContour[];
  lots: IdeStairLot[];
  areas: IdeStairArea[];
  /** Formula-only local XY; nonzero native trailers remain unresolved. */
  formulaPoints: Record<number, IdePoint>;
  unresolved: string[];
}

class StairCursor {
  readonly decoder = new TextDecoder("windows-1254");
  readonly end: number;
  constructor(readonly bytes: Uint8Array, readonly view: DataView, public at: number) {
    this.end = Math.min(bytes.length, at + 2_000_000);
  }
  need(length: number) { if (length < 0 || this.at + length > this.end) throw new Error("Truncated stair graph"); }
  u8() { this.need(1); return this.bytes[this.at++]; }
  u32() { this.need(4); const n = this.view.getUint32(this.at, true); this.at += 4; return n; }
  f64() { this.need(8); const n = this.view.getFloat64(this.at, true); this.at += 8; if (!Number.isFinite(n)) throw new Error("Non-finite stair scalar"); return n; }
  skip(length: number) { this.need(length); this.at += length; }
  flag() { const value = this.u8(); if (value > 1) throw new Error("Invalid stair boolean"); return !!value; }
  string() {
    if (this.u8() !== 0) throw new Error("Unsupported stair string encoding");
    const length = this.u32();
    if (length < 1 || length > 2049) throw new Error("Invalid stair string length");
    this.need(length);
    if (this.bytes[this.at + length - 1] !== 0) throw new Error("Unterminated stair string");
    const body = this.bytes.subarray(this.at, this.at + length - 1);
    if (body.some(value => value < 32 || value === 127 || value === 255)) throw new Error("Invalid stair text");
    const value = this.decoder.decode(body); this.at += length; return value;
  }
  expression() { if (this.u8() !== 1) throw new Error("Unsupported stair expression encoding"); return this.string(); }
  list<T>(read: () => T, max = 2048): T[] {
    const count = this.u32();
    if (count > max) throw new Error("Stair count limit");
    return Array.from({ length: count }, read);
  }
}

/** Returns only a fully aligned graph; malformed or unobserved variants fail closed. */
export function readIdeStairTemplate(bytes: Uint8Array, view: DataView, nameOffset: number, nameByteLength: number): IdeStairTemplate | undefined {
  try {
    if (nameByteLength < 1 || nameByteLength > 161 || nameOffset < 0 || nameOffset + nameByteLength + 322 >= bytes.length) return;
    const cursor = new StairCursor(bytes, view, nameOffset + nameByteLength + 322);
    const sourceOffset = cursor.at;
    const variables: Record<string, number> = Object.create(null), variableDefinitions: Record<string, string> = Object.create(null);
    cursor.list(() => {
      const name = cursor.string(), definition = cursor.string(), value = cursor.f64();
      if (!name || Object.hasOwn(variables, name) || Math.abs(value) > 1_000_000) throw new Error("Invalid stair variable");
      variables[name] = value; variableDefinitions[name] = definition;
    }, 256);
    const primary = (kind: "primary" | "free"): IdeStairNode => ({ sourceOffset: cursor.at, kind, name: cursor.string(), id: cursor.u32(), xExpression: cursor.expression(), yExpression: cursor.expression(), nativeTrailer: kind === "primary" ? [cursor.f64(), cursor.f64(), cursor.u8()] : [cursor.f64(), cursor.f64()] });
    const primaryNodes = cursor.list(() => primary("primary"));
    const secondaryNodes = cursor.list((): IdeStairNode => {
      const sourceOffset = cursor.at, name = cursor.string(), id = cursor.u32(), method = cursor.u32();
      if (method === 3) {
        const xExpression = cursor.expression(), yExpression = cursor.expression();
        cursor.skip(16);
        return { sourceOffset, kind: "secondary", name, id, method, xExpression, yExpression, nativeTrailer: [0, 0, cursor.f64(), cursor.f64(), cursor.u8()] };
      }
      if (method !== 0 && method !== 1) throw new Error("Unsupported stair secondary node");
      return { sourceOffset, kind: "secondary", name, id, method, expression: cursor.expression(), nativeTrailer: [cursor.u8(), cursor.u32(), cursor.u32(), cursor.f64(), cursor.f64(), cursor.f64(), cursor.u8()] };
    });
    const freeNodes = cursor.list(() => primary("free")), nodes = [...primaryNodes, ...secondaryNodes, ...freeNodes];
    const curve = (): IdeStairCurve => ({ sourceOffset: cursor.at, kind: cursor.u32(), nativeParameters: [cursor.u32(), cursor.u32()], nodeIds: cursor.list(() => cursor.u32()) });
    const ownedCurve = (): IdeStairCurve => ({ ...curve(), ownerId: cursor.u32() });
    const contours = cursor.list((): IdeStairContour => ({
      sourceOffset: cursor.at, name: cursor.string(), id: cursor.u32(),
      curves: cursor.list(() => ({ ...ownedCurve(), nativeFlags: Array.from({ length: 8 }, () => cursor.u8()), nativeFactor: cursor.f64() })),
      breakMode: cursor.u32(), inside: cursor.flag(), drawMode: cursor.u8(),
    }));
    const lots = cursor.list((): IdeStairLot => ({ name: cursor.string(), id: cursor.u32(), curves: cursor.list(ownedCurve), startCircle: cursor.flag(), endArrow: cursor.flag(), circleExpression: cursor.expression(), arrowExpression: cursor.expression(), ownerId: cursor.u32() }));
    const railingIds = cursor.list(() => {
      cursor.string(); const id = cursor.u32(); cursor.list(curve); cursor.u8(); cursor.list(() => cursor.f64()); cursor.expression(); cursor.expression(); cursor.string(); cursor.string(); return id;
    });
    const areas = cursor.list((): IdeStairArea => {
      const sourceOffset = cursor.at, name = cursor.string(), id = cursor.u32(), type = cursor.u32();
      if (type > 1) throw new Error("Unsupported stair area type");
      const contourIds = cursor.list(() => cursor.u32()), contourDirections = contourIds.map(() => cursor.flag()), railingIds = cursor.list(() => cursor.u32()), lotIds = cursor.list(() => cursor.u32());
      const riserCountParameter = cursor.f64(), riseParameter = cursor.f64(), treadParameter = cursor.f64();
      const skewBegin = cursor.u32(), skewEnd = cursor.u32(), skewMethod = cursor.u32(), minTread = cursor.f64();
      cursor.flag(); for (let i = 0; i < 4; i++) cursor.f64(); cursor.flag();
      const totalRiseExpression = cursor.expression(), elevationExpression = cursor.expression(), nativeOptions = Array.from({ length: 9 }, () => Number(cursor.flag()));
      const previousName = cursor.string(), nextName = cursor.string();
      cursor.u8(); cursor.f64(); cursor.f64(); cursor.f64(); cursor.u32(); cursor.skip(60); cursor.f64();
      const thicknessExpression = cursor.expression(); cursor.f64(); cursor.f64();
      if (!Number.isInteger(riserCountParameter) || riserCountParameter < 0 || riserCountParameter > 1000 || riseParameter < 0 || riseParameter > 100 || treadParameter < 0 || treadParameter > 100) throw new Error("Invalid stair step settings");
      return { sourceOffset, name, id, kind: type === 0 ? "flight" : "landing", contourIds, contourDirections, railingIds, lotIds, riserCountParameter, riseParameter, treadParameter, skewBegin, skewEnd, skewMethod, minTread, totalRiseExpression, elevationExpression, thicknessExpression, nativeOptions, previousName, nextName };
    }, 256);
    if (!nodes.length || !contours.length || !areas.length) return;
    const ids = new Set<number>();
    for (const row of [...nodes, ...contours, ...lots, ...areas, ...railingIds.map(id => ({ id }))]) {
      if (!row.id || ids.has(row.id)) throw new Error("Duplicate stair graph id"); ids.add(row.id);
    }
    const nodeIds = new Set(nodes.map(node => node.id)), contourIds = new Set(contours.map(contour => contour.id)), lotIds = new Set(lots.map(lot => lot.id));
    if ([...contours, ...lots].some(row => row.curves.some(line => line.nodeIds.some(id => !nodeIds.has(id)))) || areas.some(area => area.contourIds.some(id => !contourIds.has(id)) || area.lotIds.some(id => !lotIds.has(id)) || area.railingIds.some(id => !railingIds.includes(id)))) throw new Error("Missing stair graph reference");
    const formulaPoints: Record<number, IdePoint> = Object.create(null);
    for (const node of nodes) if (node.xExpression !== undefined && node.yExpression !== undefined) {
      const x = evaluateStairExpression(node.xExpression, variables), y = evaluateStairExpression(node.yExpression, variables);
      if (x !== null && y !== null && Math.abs(x) <= 1_000_000 && Math.abs(y) <= 1_000_000) formulaPoints[node.id] = { x, y };
    }
    return { source: "native-parametric-template", sourceOffset, endOffset: cursor.at, variables, variableDefinitions, nodes, contours, lots, areas, formulaPoints, unresolved: ["Merdivenin yerel grafiğinin dünya koordinatlarına dönüşümü henüz doğrulanmadı.", "Düğüm sonundaki yerel düzenleme alanları ve dokuz alan seçeneğinin bütün anlamları henüz doğrulanmadı.", ...(areas.some(area => area.kind === "flight" && area.riserCountParameter === 0) ? ["Yükseklik/genişlik kontrollü otomatik basamak sayısı henüz çözümlenmedi."] : [])] };
  } catch { return; }
}
