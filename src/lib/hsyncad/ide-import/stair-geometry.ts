import earcut from "earcut";
import type { IdePoint } from "./index";

/** Only arithmetic is evaluated. Source text is never passed to eval/Function. */
export function evaluateStairExpression(source: string, variables: Readonly<Record<string, number>>, options?: { angleUnit: "degrees" | "radians" }): number | null {
  if (!source || source.length > 2048) return null;
  const tokens: string[] = [];
  const lexer = /\s*(?:(\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)|([\p{L}_][\p{L}\p{M}\p{N}_]*)|([+\-*/^(),]))/uy;
  let at = 0;
  while (at < source.length) {
    if (!source.slice(at).trim()) break;
    lexer.lastIndex = at;
    const match = lexer.exec(source);
    if (!match || tokens.length >= 512) return null;
    tokens.push(match[1] ?? match[2] ?? match[3]); at = lexer.lastIndex;
  }
  let cursor = 0, depth = 0;
  const finite = (value: number) => { if (!Number.isFinite(value)) throw new Error("Non-finite expression"); return value; };
  const functions: Record<string, (...args: number[]) => number> = {
    ABS: Math.abs, SQRT: Math.sqrt, MIN: Math.min, MAX: Math.max,
  };
  // A syntactically valid angle expression can still be semantically wrong.
  // Trigonometry stays unsupported until the native angle unit is established.
  if (options?.angleUnit) {
    const intoRadians = options.angleUnit === "degrees" ? Math.PI / 180 : 1;
    const fromRadians = 1 / intoRadians;
    Object.assign(functions, {
      SIN: (n: number) => Math.sin(n * intoRadians), COS: (n: number) => Math.cos(n * intoRadians), TAN: (n: number) => Math.tan(n * intoRadians),
      ASIN: (n: number) => Math.asin(n) * fromRadians, ACOS: (n: number) => Math.acos(n) * fromRadians, ATAN: (n: number) => Math.atan(n) * fromRadians,
    });
  }
  function primary(): number {
    if (++depth > 32) throw new Error("Expression nesting limit");
    try {
      const token = tokens[cursor++];
      if (token === "(") { const value = sum(); if (tokens[cursor++] !== ")") throw new Error("Unclosed expression"); return value; }
      if (token === undefined) throw new Error("Missing expression");
      if (/^(?:\d|\.)/.test(token)) return finite(Number(token));
      if (tokens[cursor] === "(") {
        const fn = functions[token.toUpperCase()];
        if (!fn) throw new Error("Unsupported expression function");
        cursor++; const args = [sum()];
        while (tokens[cursor] === ",") { cursor++; args.push(sum()); if (args.length > 32) throw new Error("Function argument limit"); }
        if (tokens[cursor++] !== ")") throw new Error("Unclosed function");
        if (token.toUpperCase() !== "MIN" && token.toUpperCase() !== "MAX" && args.length !== 1) throw new Error("Function arity");
        return finite(fn(...args));
      }
      if (Object.prototype.hasOwnProperty.call(variables, token)) return finite(variables[token]);
      if (token.toUpperCase() === "PI") return Math.PI;
      throw new Error("Unknown variable");
    } finally { depth--; }
  }
  function power(): number { const value = primary(); return tokens[cursor] === "^" ? (cursor++, finite(Math.pow(value, unary()))) : value; }
  function unary(): number { if (tokens[cursor] === "+") { cursor++; return unary(); } if (tokens[cursor] === "-") { cursor++; return -unary(); } return power(); }
  function product(): number {
    let value = unary();
    while (tokens[cursor] === "*" || tokens[cursor] === "/") { const op = tokens[cursor++], right = unary(); value = finite(op === "*" ? value * right : value / right); }
    return value;
  }
  function sum(): number {
    let value = product();
    while (tokens[cursor] === "+" || tokens[cursor] === "-") { const op = tokens[cursor++], right = product(); value = finite(op === "+" ? value + right : value - right); }
    return value;
  }
  try { const value = sum(); return cursor === tokens.length ? finite(value) : null; } catch { return null; }
}

export interface StairSurfaceInput {
  /** World XY in metres. Includes decoded project node edits and transform. */
  polygon: IdePoint[];
  holes?: IdePoint[][];
  kind: "landing" | "flight";
  /** World Z in metres; used directly for a landing. */
  elevation: number;
  /** Proven straight walking direction. Curved/winding flights need native cuts. */
  travel?: [IdePoint, IdePoint];
  /** Native/verified cut stations, normalized along travel, including 0 and 1. */
  stations?: number[];
  /** One absolute world-Z top elevation per station interval. */
  levels?: number[];
  /** Boundary risers are created only when their endpoint levels are known. */
  startElevation?: number;
  endElevation?: number;
}

/**
 * Count-driven straight-flight rule documented in ideCAD's Stair Edit help:
 * https://help.idecad.com.tr/ideCAD/merdiven-edit (Alanlar Sekmesi).
 * Call only when native count mode, top-tread flag and zero finish adjustments
 * are decoded. Height/width-controlled automatic counts stay unresolved.
 */
export function deriveUniformStairSchedule(input: { mode: "count"; count: number; topTread: boolean; elevation: number; totalRise: number; coatingAdjustments: "zero" }): { stations: number[]; levels: number[]; startElevation: number; endElevation: number; riserCount: number; treadCount: number } | null {
  if (input.mode !== "count" || input.coatingAdjustments !== "zero" || typeof input.topTread !== "boolean" || !Number.isInteger(input.count) || input.count < 1 || input.count > 1000 || !validElevation(input.elevation) || !Number.isFinite(input.totalRise) || Math.abs(input.totalRise) < EPS) return null;
  const riserCount = input.count + (input.topTread ? 0 : 1), treadCount = riserCount - 1;
  if (!treadCount || !validElevation(input.elevation + input.totalRise)) return null;
  return {
    stations: Array.from({ length: treadCount + 1 }, (_, i) => i / treadCount),
    levels: Array.from({ length: treadCount }, (_, i) => input.elevation + input.totalRise * (i + 1) / riserCount),
    startElevation: input.elevation, endElevation: input.elevation + input.totalRise, riserCount, treadCount,
  };
}

export type StairSurfaceResult = {
  status: "surface";
  mesh: { positions: number[]; source: "parametric-derived" };
  planPaths: IdePoint[][];
  limitations: string[];
} | { status: "unsupported"; reason: string };

const EPS = 1e-8;
const area = (points: IdePoint[]) => {
  const origin = points[0];
  return points.reduce((value, p, i) => { const q = points[(i + 1) % points.length]; return value + (p.x - origin.x) * (q.y - origin.y) - (p.y - origin.y) * (q.x - origin.x); }, 0) / 2;
};
const near = (a: IdePoint, b: IdePoint) => Math.hypot(a.x - b.x, a.y - b.y) <= EPS;
function ring(points: IdePoint[]) { return points.length > 1 && near(points[0], points.at(-1)!) ? points.slice(0, -1) : points.slice(); }
function validPoint(p: IdePoint) { return Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) <= 1_000_000 && Math.abs(p.y) <= 1_000_000; }
const validElevation = (value: number) => Number.isFinite(value) && Math.abs(value) <= 1_000_000;

/**
 * Builds the source-defined upper surfaces and risers. It deliberately creates
 * no guessed waist/underside: normal-vs-vertical thickness and construction
 * type must be decoded before a complete native solid can be reconstructed.
 */
export function buildStairAreaSurface(input: StairSurfaceInput): StairSurfaceResult {
  const exterior = ring(input.polygon), holes = (input.holes ?? []).map(ring);
  const all = [exterior, ...holes];
  if (!validElevation(input.elevation) || all.some(points => points.length < 3 || points.some(p => !validPoint(p))) || all.reduce((n, points) => n + points.length, 0) > 2048) return { status: "unsupported", reason: "Merdiven alan sınırı veya kotu geçersiz." };
  const coords: number[] = [], starts: number[] = [];
  for (let i = 0; i < all.length; i++) { if (i) starts.push(coords.length / 2); for (const p of all[i]) coords.push(p.x, p.y); }
  const indices = earcut(coords, starts, 2), vertices = Array.from({ length: coords.length / 2 }, (_, i) => ({ x: coords[i * 2], y: coords[i * 2 + 1] }));
  const triangles: IdePoint[][] = [];
  for (let i = 0; i < indices.length; i += 3) triangles.push([vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]]]);
  const expected = Math.abs(area(exterior)) - holes.reduce((n, points) => n + Math.abs(area(points)), 0), actual = triangles.reduce((n, points) => n + Math.abs(area(points)), 0);
  if (!(expected > EPS) || Math.abs(expected - actual) > Math.max(1e-7, expected * 1e-8)) return { status: "unsupported", reason: "Merdiven alanı boşlukları korunarak üçgenlenemedi." };
  const positions: number[] = [], planPaths: IdePoint[][] = [];
  const triangle = (a: IdePoint, b: IdePoint, c: IdePoint, z: number) => { if (Math.abs(area([a, b, c])) > EPS * EPS) positions.push(a.x, a.y, z, b.x, b.y, z, c.x, c.y, z); };
  const limitations = ["Merdiven üst yüzeyleri ve doğrulanmış rıht kotları parametrelerden türetilmiştir; alt plak, kaplama ve korkuluk katıları içermez."];
  if (input.kind === "landing") {
    for (const points of triangles) triangle(points[0], points[1], points[2], input.elevation);
    return { status: "surface", mesh: { positions, source: "parametric-derived" }, planPaths: all.map(points => [...points, points[0]]), limitations };
  }
  const { travel, stations, levels } = input;
  if (!travel || !stations || !levels || stations.length < 2 || stations.length > 1001 || levels.length !== stations.length - 1 || stations[0] !== 0 || stations.at(-1) !== 1 || stations.some((value, i) => !Number.isFinite(value) || value < 0 || value > 1 || i > 0 && value <= stations[i - 1]) || levels.some(value => !validElevation(value)) || input.startElevation !== undefined && !validElevation(input.startElevation) || input.endElevation !== undefined && !validElevation(input.endElevation)) return { status: "unsupported", reason: "Merdivenin gerçek basamak konumları ve kotları henüz doğrulanmadı." };
  if (!travel.every(validPoint) || triangles.length * levels.length > 2_000_000) return { status: "unsupported", reason: "Merdiven çıkış hattı veya yüzey kapsamı geçersiz." };
  const dx = travel[1].x - travel[0].x, dy = travel[1].y - travel[0].y, length2 = dx * dx + dy * dy, length = Math.sqrt(length2);
  if (length < EPS) return { status: "unsupported", reason: "Merdiven çıkış hattı sıfır uzunlukta." };
  const station = (p: IdePoint) => ((p.x - travel[0].x) * dx + (p.y - travel[0].y) * dy) / length2;
  if (exterior.some(p => station(p) < -EPS || station(p) > 1 + EPS)) return { status: "unsupported", reason: "Merdiven sınırı doğrulanmış düz çıkış hattının aralığı dışında." };
  function clip(points: IdePoint[], cut: number, lower: boolean) {
    const output: IdePoint[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length], ta = station(a) - cut, tb = station(b) - cut;
      const aIn = lower ? ta >= -EPS : ta <= EPS, bIn = lower ? tb >= -EPS : tb <= EPS;
      if (aIn && (!output.length || !near(output.at(-1)!, a))) output.push(a);
      if (aIn !== bIn) { const t = ta / (ta - tb), p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; if (!output.length || !near(output.at(-1)!, p)) output.push(p); }
    }
    return ring(output);
  }
  for (let step = 0; step < levels.length; step++) for (const points of triangles) {
    const clipped = clip(clip(points, stations[step], true), stations[step + 1], false);
    for (let i = 1; i + 1 < clipped.length; i++) triangle(clipped[0], clipped[i], clipped[i + 1], levels[step]);
  }
  const nx = -dy / length, ny = dx / length;
  function section(cut: number): IdePoint[][] {
    const origin = { x: travel![0].x + dx * cut, y: travel![0].y + dy * cut }, intervals: [number, number][] = [];
    const perpendicular = (p: IdePoint) => (p.x - origin.x) * nx + (p.y - origin.y) * ny;
    for (const points of triangles) {
      const hits: IdePoint[] = [];
      const add = (p: IdePoint) => { if (!hits.some(q => near(p, q))) hits.push(p); };
      for (let i = 0; i < 3; i++) {
        const a = points[i], b = points[(i + 1) % 3], ta = station(a) - cut, tb = station(b) - cut;
        if (Math.abs(ta) <= EPS) add(a);
        if (ta * tb < -EPS * EPS) { const t = ta / (ta - tb); add({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); }
      }
      if (hits.length >= 2) { const values = hits.map(perpendicular); intervals.push([Math.min(...values), Math.max(...values)]); }
    }
    intervals.sort((a, b) => a[0] - b[0]); const merged: [number, number][] = [];
    for (const interval of intervals) { const previous = merged.at(-1); if (previous && interval[0] <= previous[1] + EPS) previous[1] = Math.max(previous[1], interval[1]); else merged.push([...interval]); }
    return merged.filter(([a, b]) => b - a > EPS).map(([a, b]) => [{ x: origin.x + nx * a, y: origin.y + ny * a }, { x: origin.x + nx * b, y: origin.y + ny * b }]);
  }
  function riser(cut: number, before: number, after: number) {
    if (!Number.isFinite(before) || !Number.isFinite(after) || Math.abs(after - before) < EPS) return;
    for (const [a, b] of section(cut)) {
      planPaths.push([a, b]);
      positions.push(a.x, a.y, before, b.x, b.y, before, b.x, b.y, after, a.x, a.y, before, b.x, b.y, after, a.x, a.y, after);
    }
  }
  for (let i = 1; i < stations.length - 1; i++) riser(stations[i], levels[i - 1], levels[i]);
  if (input.startElevation !== undefined) riser(0, input.startElevation, levels[0]);
  if (input.endElevation !== undefined) riser(1, levels.at(-1)!, input.endElevation);
  return { status: "surface", mesh: { positions, source: "parametric-derived" }, planPaths, limitations };
}
