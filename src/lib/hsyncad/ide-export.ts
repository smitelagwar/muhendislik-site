import { parseIde10, type IdeElement, type IdeElementType, type IdePoint, type IdeProject } from "./ide-import";
import { axisEndLabels, memberLabel, planBounds, planPoints, slabLabelAnchor } from "./ide-plan-layout";
import { transcodeIde11TrialToIde11 } from "./ide-import/ide11-transcoder";
import { exportToIde10Binary, type Ide10ExportResult } from "./ide-import/ide10-exporter";
import { IDE11_VERSION } from "./ide-import/ide-binary-codec";

export interface IdePlanExportOptions {
  elements?: readonly IdeElement[];
  includeFoundations?: boolean;
  labels?: boolean;
}

export const IDE_SNAPSHOT_KIND = "hsyncad-ide-viewer";
const MAX_SNAPSHOT_CHARACTERS = 250 * 1024 * 1024;
const TYPES = new Set<IdeElementType>(["column", "beam", "wall", "slab", "stair", "band", "section", "axis", "slabEdge", "line", "unknown"]);
const COLORS: Record<string, string> = { column: "#8d8db7", beam: "#00ed00", wall: "#9292bb", slab: "#dfedef", stair: "#666699", band: "#6060c0", section: "#565656", axis: "#ff6536", slabEdge: "#53538e", line: "#b6b2a5", unknown: "#8b8b8b" };
const INVALID = "Geçerli bir hsynCAD IDE görüntüleme dosyası değil.";
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1e12;
const integer = (n: unknown, maximum = 512 * 1024 * 1024): n is number => finite(n) && Number.isInteger(n) && n >= 0 && n <= maximum;
const object = (n: unknown): n is Record<string, unknown> => !!n && typeof n === "object" && !Array.isArray(n);
const text = (n: unknown, maximum = 512): n is string => typeof n === "string" && n.length <= maximum;
const point = (n: unknown): n is IdePoint => object(n) && finite(n.x) && finite(n.y) && Math.abs(n.x) <= 1e6 && Math.abs(n.y) <= 1e6;
const points = (n: unknown): n is IdePoint[] => Array.isArray(n) && n.length <= 100_000 && n.every(point);
function assert(condition: unknown): asserts condition { if (!condition) throw new Error(INVALID); }

/** Validate the entire data tree before it reaches renderers or nested spread operations. */
export function validateIdeProjectSnapshot(value: unknown): asserts value is IdeProject {
  let nodes = 0;
  const walk = (item: unknown, depth: number): void => {
    assert(++nodes <= 5_000_000 && depth <= 32);
    if (typeof item === "number") { assert(finite(item)); return; }
    if (typeof item === "string") { assert(item.length <= 65536); return; }
    if (item === null || typeof item === "boolean" || item === undefined) return;
    if (Array.isArray(item)) { assert(item.length <= 6_000_000); for (const child of item) walk(child, depth + 1); return; }
    assert(object(item));
    for (const [key, child] of Object.entries(item)) { assert(!["__proto__", "prototype", "constructor"].includes(key)); walk(child, depth + 1); }
  };
  walk(value, 0);
  assert(object(value) && ["ide10", "ide11", "ide11trial"].includes(String(value.format)));
  assert(text(value.filename) && text(value.name) && integer(value.byteLength));
  assert(Array.isArray(value.floors) && value.floors.length > 0 && value.floors.length <= 1000);
  const floorIds = new Set<string>();
  for (const floor of value.floors) {
    assert(object(floor) && text(floor.id) && floor.id.length > 0 && !floorIds.has(floor.id) && text(floor.name));
    assert(finite(floor.elevation) && Math.abs(floor.elevation) <= 1e6 && finite(floor.height) && floor.height > 0 && floor.height <= 10_000);
    assert(integer(floor.sourceOffset) && integer(floor.endOffset) && floor.endOffset >= floor.sourceOffset);
    floorIds.add(floor.id);
  }
  assert(Array.isArray(value.elements) && value.elements.length > 0 && value.elements.length <= 200_000);
  const ids = new Set<string>(), byType: Record<string, number> = {};
  for (const e of value.elements) {
    assert(object(e) && text(e.id) && e.id.length > 0 && !ids.has(e.id) && text(e.name, 256));
    assert(text(e.type) && TYPES.has(e.type as IdeElementType) && text(e.floorId) && floorIds.has(e.floorId));
    assert(integer(e.nativeId, 0xffffffff) && integer(e.sourceOffset) && integer(e.primitiveType) && integer(e.layerId));
    assert(finite(e.nativeZ) && finite(e.lateralOffset) && finite(e.rotation) && points(e.points));
    if (e.footprint !== undefined) assert(points(e.footprint));
    if (e.holes !== undefined) assert(Array.isArray(e.holes) && e.holes.length <= 10000 && e.holes.every(points));
    if (e.planPaths !== undefined) assert(Array.isArray(e.planPaths) && e.planPaths.length <= 100_000 && e.planPaths.every(points));
    if (e.planTexts !== undefined) assert(Array.isArray(e.planTexts) && e.planTexts.length <= 100_000 && e.planTexts.every(t => object(t) && point(t.point) && text(t.text) && (t.rotation === undefined || finite(t.rotation))));
    for (const name of ["width", "thickness", "height", "bottom", "top"] as const) if (e[name] !== undefined) assert(finite(e[name]));
    for (const name of ["foundation", "structural", "planOnly"] as const) if (e[name] !== undefined) assert(typeof e[name] === "boolean");
    if (e.mesh !== undefined) {
      assert(object(e.mesh) && ["native-analysis-mesh", "parametric-derived"].includes(String(e.mesh.source)));
      assert(Array.isArray(e.mesh.positions) && e.mesh.positions.length > 0 && e.mesh.positions.length % 3 === 0 && e.mesh.positions.length <= 3_000_000);
      assert(e.mesh.positions.every(n => finite(n) && Math.abs(n) <= 1e6));
      const count = e.mesh.positions.length / 3;
      if (e.mesh.indices !== undefined) assert(Array.isArray(e.mesh.indices) && e.mesh.indices.length % 3 === 0 && e.mesh.indices.every(n => integer(n, count - 1)));
      if (e.mesh.quads !== undefined) assert(Array.isArray(e.mesh.quads) && e.mesh.quads.length % 4 === 0 && e.mesh.quads.every(n => integer(n, count - 1)));
    }
    if (e.planAnnotation !== undefined) {
      assert(object(e.planAnnotation));
      const a = e.planAnnotation;
      if (a.section !== undefined) assert(text(a.section));
      if (a.loads !== undefined) assert(object(a.loads) && finite(a.loads.dead) && finite(a.loads.live) && a.loads.dead >= 0 && a.loads.live >= 0 && a.loads.unit === "tf/m²" && integer(a.loads.sourceOffset));
      if (a.designAxes !== undefined) assert(Array.isArray(a.designAxes) && a.designAxes.length <= 10000 && a.designAxes.every(axis => object(axis) && points(axis.points) && axis.points.length === 2 && ["x", "y"].includes(String(axis.direction)) && integer(axis.sourceOffset)));
    }
    ids.add(e.id); byType[e.type] = (byType[e.type] ?? 0) + 1;
  }
  assert(object(value.coverage));
  const c = value.coverage;
  for (const key of ["candidateRecords", "decodedRecords", "unsupportedRecords", "ignoredTemplateRecords", "holeRecords", "rejectedCandidates"]) assert(integer(c[key]));
  assert(c.decodedRecords === value.elements.length && c.candidateRecords === (c.decodedRecords as number) + (c.unsupportedRecords as number) + (c.holeRecords as number) + (c.rejectedCandidates as number));
  assert(object(c.byType) && object(c.unsupportedTypes));
  for (const [key, count] of Object.entries(c.byType)) assert(integer(count) && byType[key] === count);
  for (const [key, count] of Object.entries(byType)) assert(c.byType[key] === count);
  assert(Object.values(c.unsupportedTypes).every(count => integer(count)) && Object.values(c.unsupportedTypes).reduce<number>((sum, count) => sum + (count as number), 0) === c.unsupportedRecords);
  assert(Array.isArray(c.limitations) && c.limitations.every(s => text(s, 65536)) && Array.isArray(value.warnings) && value.warnings.every(s => text(s, 65536)));
}

/** Full decoded viewer data, never an unofficial ideCAD native writer. */
export function serializeIdeProject(project: IdeProject): string {
  validateIdeProjectSnapshot(project);
  return JSON.stringify({ kind: IDE_SNAPSHOT_KIND, schemaVersion: 1, project });
}

export function parseIdeProjectSnapshot(source: string): IdeProject {
  assert(source.length <= MAX_SNAPSHOT_CHARACTERS);
  let envelope: unknown;
  try { envelope = JSON.parse(source); } catch { throw new Error(INVALID); }
  assert(object(envelope) && envelope.kind === IDE_SNAPSHOT_KIND && envelope.schemaVersion === 1);
  validateIdeProjectSnapshot(envelope.project);
  return envelope.project;
}

export function ideExportBasename(filename: string): string {
  return filename.replace(/^.*[\\/]/, "").replace(/\.(?:ide10|ide11|ide11trial|hsyncad|json)$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim().slice(0, 140) || "IDE-projesi";
}

function floorElements(project: IdeProject, floorId: string, options: IdePlanExportOptions) {
  if (!project.floors.some(f => f.id === floorId)) throw new Error("Dışa aktarılacak kat bulunamadı.");
  return (options.elements ?? project.elements).filter(e => e.floorId === floorId && (options.includeFoundations || !e.foundation));
}
const num = (n: number) => { if (!Number.isFinite(n)) throw new Error(INVALID); return Object.is(n, -0) ? "0" : String(n); };
const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const xml = (s: string) => clean(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const layer = (e: IdeElement) => `IDE_${e.type.toUpperCase()}`;
const color = (e: IdeElement) => e.type === "wall" && e.structural === false ? "#b4aa93" : COLORS[e.type] ?? COLORS.unknown;
type Label = { at: IdePoint; text: string; height: number; angle?: number; centre?: boolean };
function labels(e: IdeElement): Label[] {
  if (e.type === "axis") return axisEndLabels(e).map(at => ({ at, text: e.name, height: .23, centre: true }));
  if (e.type === "slab") {
    const loads = e.planAnnotation?.loads, a = slabLabelAnchor(e, loads ? 2.5 : .9, .55) ?? slabLabelAnchor(e, .45, .55);
    if (!a) return [];
    const rx = Math.max(.19, e.name.length * .05), result: Label[] = [{ at: { x: a.x + rx, y: a.y - .19 }, text: e.name, height: .16, centre: true }];
    if (e.thickness !== undefined) result.push({ at: { x: a.x + rx, y: a.y - .46 }, text: `d=${Math.round(e.thickness * 100)}`, height: .136, centre: true });
    if (loads) { result.push({ at: { x: a.x + rx * 2 + .08, y: a.y - .19 }, text: `G=${Number(loads.dead.toFixed(3))} ${loads.unit}`, height: .16 }); result.push({ at: { x: a.x + rx * 2 + .08, y: a.y - .44 }, text: `Q=${Number(loads.live.toFixed(3))} ${loads.unit}`, height: .16 }); }
    return result;
  }
  if (["beam", "wall", "column", "band"].includes(e.type) && !(e.type === "wall" && e.structural === false)) {
    const a = memberLabel(e); return a ? [{ at: a.anchor, text: a.text, height: .16, angle: -a.angle }] : [];
  }
  if (e.type === "section") return [e.points[0], e.points.at(-1)].filter((p): p is IdePoint => !!p).map(at => ({ at, text: e.name, height: .2 }));
  return (e.planTexts ?? []).map(t => ({ at: t.point, text: t.text, height: .09, angle: t.rotation ?? 0, centre: true }));
}

/** Selected-floor vector drawing in native metre coordinates; escaped XML only. */
export function exportIdeSvg(project: IdeProject, floorId: string, options: IdePlanExportOptions = {}): string {
  const elements = floorElements(project, floorId, options), floor = project.floors.find(f => f.id === floorId)!;
  const bounds = planBounds(elements.flatMap(planPoints));
  if (!Number.isFinite(bounds.minX)) throw new Error("Bu katta dışa aktarılacak geometri yok.");
  const pad = .7, x = bounds.minX - pad, y = -bounds.maxY - pad, width = Math.max(.1, bounds.maxX - bounds.minX) + pad * 2, height = Math.max(.1, bounds.maxY - bounds.minY) + pad * 2;
  const rows = [`<?xml version="1.0" encoding="UTF-8"?>`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${num(x)} ${num(y)} ${num(width)} ${num(height)}" width="1600" height="${Math.round(1600 * height / width)}">`, `<title>${xml(project.name)} · ${xml(floor.name)}</title>`, `<desc>hsynCAD: çözümlenmiş kaynak planı; birim metre. Native ideCAD dosyası veya tam pafta eşdeğeri değildir.</desc>`, `<defs><pattern id="concrete" width="0.08" height="0.08" patternUnits="userSpaceOnUse"><path d="M0,0.08 L0.08,0" stroke="#8282ab" stroke-width="0.008"/></pattern></defs>`, `<rect x="${num(x)}" y="${num(y)}" width="${num(width)}" height="${num(height)}" fill="white"/>`, `<g stroke-linejoin="round" stroke-linecap="round" font-family="Arial,sans-serif">`];
  const path = (points: IdePoint[], closed = false) => points.length ? `M${points.map(p => `${num(p.x)},${num(-p.y)}`).join(" L")}${closed ? " Z" : ""}` : "";
  const priority = (e: IdeElement) => e.type === "slab" ? 0 : ["axis", "section", "line", "slabEdge"].includes(e.type) ? 1 : e.type === "wall" && e.structural === false ? 2 : e.type === "stair" ? 3 : e.type === "band" ? 4 : e.type === "beam" ? 6 : 5;
  const ordered = [...elements].sort((a, b) => priority(a) - priority(b));
  let serial = 0;
  for (const e of ordered) {
    const ring = e.footprint?.length ? e.footprint : e.points, isPolygon = !e.planPaths?.length && ring.length >= 3;
    const paths = e.planPaths?.length ? e.planPaths.map(p => path(p)).join(" ") : `${path(ring, isPolygon)} ${(e.holes ?? []).map(p => path(p, true)).join(" ")}`;
    const fill = !isPolygon ? "none" : e.type === "slab" ? "#e8f2f3" : e.type === "beam" ? "#00ef00" : e.type === "wall" && e.structural === false ? "#faf9f5" : "#aaaac1";
    rows.push(`<path data-type="${xml(e.type)}" d="${paths}" fill="${fill}" fill-rule="evenodd" stroke="${color(e)}" stroke-width="0.018"${["axis", "section"].includes(e.type) ? ' stroke-dasharray="0.75 0.15 0.05 0.15"' : ""}/>`);
    if (isPolygon && (e.type === "column" || e.type === "wall" && e.structural !== false)) rows.push(`<path d="${paths}" fill="url(#concrete)" fill-rule="evenodd"/>`);
    if (e.planAnnotation?.designAxes?.length) {
      const id = `slab-clip-${serial++}`;
      rows.push(`<clipPath id="${id}"><path d="${paths}" clip-rule="evenodd"/></clipPath><g clip-path="url(#${id})">`);
      for (const axis of e.planAnnotation.designAxes) rows.push(`<path d="${path(axis.points)}" fill="none" stroke="${axis.direction === "x" ? "#17812a" : "#39389f"}" stroke-width="0.025"/>`);
      rows.push("</g>");
    }
  }
  for (const e of options.labels === false ? [] : ordered) {
    if (e.type === "axis") for (const p of axisEndLabels(e)) rows.push(`<circle cx="${num(p.x)}" cy="${num(-p.y)}" r="0.18" fill="white" stroke="${COLORS.axis}" stroke-width="0.018"/>`);
    if (e.type === "slab") {
      const at = labels(e)[0]?.at;
      if (at) rows.push(`<ellipse cx="${num(at.x)}" cy="${num(-at.y)}" rx="${num(Math.max(.19, e.name.length * .05))}" ry="0.19" fill="none" stroke="#308442" stroke-width="0.015"/>`);
    }
    for (const l of labels(e)) rows.push(`<text x="${num(l.at.x)}" y="${num(-l.at.y)}" fill="${e.type === "axis" ? COLORS.axis : "#313596"}" font-size="${num(l.height)}" dominant-baseline="central"${l.centre ? ' text-anchor="middle"' : ""}${l.angle ? ` transform="rotate(${num(-l.angle * 180 / Math.PI)} ${num(l.at.x)} ${num(-l.at.y)})"` : ""}>${xml(l.text)}</text>`);
  }
  rows.push("</g></svg>"); return rows.join("\n");
}

const dxfText = (value: string) => value.split("").map(c => { const code = c.charCodeAt(0); return code < 32 || code > 126 || c === "\\" || c === "%" ? `\\U+${code.toString(16).toUpperCase().padStart(4, "0")}` : c; }).join("");

/** R2010 ASCII DXF, independent of ideCAD's native project serialization. */
export function exportIdeDxf(project: IdeProject, floorId: string, options: IdePlanExportOptions = {}): string {
  const elements = floorElements(project, floorId, options), out: string[] = [];
  const put = (...pairs: (string | number)[]) => { for (const value of pairs) out.push(typeof value === "number" ? num(value) : value); };
  const layers = [...new Set([...TYPES].map(t => `IDE_${t.toUpperCase()}`).concat(["IDE_SLAB_HOLES", "IDE_TEXT", "IDE_DESIGN_X", "IDE_DESIGN_Y"]))];
  put(0, "SECTION", 2, "HEADER", 9, "$ACADVER", 1, "AC1024", 9, "$INSUNITS", 70, 6, 9, "$MEASUREMENT", 70, 1, 9, "$LUNITS", 70, 2, 0, "ENDSEC", 0, "SECTION", 2, "TABLES");
  put(0, "TABLE", 2, "LTYPE", 70, 2, 0, "LTYPE", 100, "AcDbSymbolTableRecord", 100, "AcDbLinetypeTableRecord", 2, "CONTINUOUS", 70, 0, 3, "Solid line", 72, 65, 73, 0, 40, 0);
  put(0, "LTYPE", 100, "AcDbSymbolTableRecord", 100, "AcDbLinetypeTableRecord", 2, "CENTER", 70, 0, 3, "Axis", 72, 65, 73, 4, 40, 1.1);
  for (const length of [.75, -.15, .05, -.15]) put(49, length, 74, 0);
  put(0, "ENDTAB", 0, "TABLE", 2, "LAYER", 70, layers.length);
  for (const name of layers) { const type = name.slice(4).toLowerCase(), hex = COLORS[type] ?? "#53538e"; put(0, "LAYER", 100, "AcDbSymbolTableRecord", 100, "AcDbLayerTableRecord", 2, name, 70, 0, 62, name === "IDE_BEAM" ? 3 : name === "IDE_AXIS" ? 30 : 8, 420, parseInt(hex.slice(1), 16), 6, name === "IDE_AXIS" || name === "IDE_SECTION" ? "CENTER" : "CONTINUOUS"); }
  put(0, "ENDTAB", 0, "TABLE", 2, "STYLE", 70, 1, 0, "STYLE", 100, "AcDbSymbolTableRecord", 100, "AcDbTextStyleTableRecord", 2, "STANDARD", 70, 0, 40, 0, 41, 1, 50, 0, 71, 0, 42, .16, 3, "arial.ttf", 4, "", 0, "ENDTAB", 0, "ENDSEC", 0, "SECTION", 2, "ENTITIES");
  const polyline = (p: IdePoint[], name: string, closed: boolean) => {
    if (p.length < 2) return;
    put(0, "LWPOLYLINE", 100, "AcDbEntity", 8, name, 100, "AcDbPolyline", 90, p.length, 70, closed ? 1 : 0);
    for (const v of p) put(10, v.x, 20, v.y);
  };
  for (const e of elements) {
    const ring = e.footprint?.length ? e.footprint : e.points;
    if (e.planPaths?.length) for (const p of e.planPaths) polyline(p, layer(e), false); else polyline(ring, layer(e), ring.length >= 3);
    for (const hole of e.holes ?? []) polyline(hole, "IDE_SLAB_HOLES", true);
    for (const axis of e.planAnnotation?.designAxes ?? []) polyline(axis.points, `IDE_DESIGN_${axis.direction.toUpperCase()}`, false);
    if (options.labels === false) continue;
    if (e.type === "axis") for (const p of axisEndLabels(e)) put(0, "CIRCLE", 100, "AcDbEntity", 8, "IDE_AXIS", 100, "AcDbCircle", 10, p.x, 20, p.y, 30, 0, 40, .18);
    for (const l of labels(e)) {
      put(0, "TEXT", 100, "AcDbEntity", 8, e.type === "axis" ? "IDE_AXIS" : "IDE_TEXT", 100, "AcDbText", 10, l.at.x, 20, l.at.y, 30, 0, 40, l.height, 1, dxfText(l.text), 50, (l.angle ?? 0) * 180 / Math.PI, 7, "STANDARD");
      if (l.centre) put(72, 1, 11, l.at.x, 21, l.at.y, 31, 0);
    }
  }
  put(0, "ENDSEC", 0, "EOF"); return out.join("\r\n") + "\r\n";
}

/**
 * Exports the active project and its binary carrier as a decoded native .ide11 (211220, encodedFlag=0) file.
 */
export function exportIde11Binary(
  sourceBuffer: ArrayBuffer | Uint8Array,
  project?: IdeProject,
  donorIde10Buffer?: ArrayBuffer | Uint8Array,
): Uint8Array {
  const src = sourceBuffer instanceof Uint8Array ? sourceBuffer : new Uint8Array(sourceBuffer);
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  if (src.byteLength < 88) {
    throw new Error("Kaynak IDE dosyası geçerli bir ikili taşıyıcı içermiyor.");
  }
  const version = view.getUint32(74, true);
  if (version !== IDE11_VERSION) {
    throw new Error(".ide11 dışa aktarımı için kaynak taşıyıcı v11 (211220) şemasında olmalıdır.");
  }
  const wallSectionOverrides = new Map<number, string>();
  const slabLoadOverrides = new Map<number, { dead: number; live: number }>();
  if (donorIde10Buffer) {
    try {
      const dBytes = donorIde10Buffer instanceof Uint8Array ? donorIde10Buffer : new Uint8Array(donorIde10Buffer);
      const donorProject = parseIde10(
        dBytes.buffer.slice(dBytes.byteOffset, dBytes.byteOffset + dBytes.byteLength) as ArrayBuffer,
        "donor.ide10",
      );
      for (const el of donorProject.elements) {
        if (el.type === "wall" && el.structural && el.planAnnotation?.section) {
          wallSectionOverrides.set(el.nativeId, el.planAnnotation.section);
        }
      }
    } catch {
      // Fallback to standalone section reconstruction
    }
  }
  if (project) {
    for (const el of project.elements) {
      if (el.type === "wall" && el.structural && el.planAnnotation?.section) {
        wallSectionOverrides.set(el.nativeId, el.planAnnotation.section);
      }
      if (el.type === "slab" && el.planAnnotation?.loads) {
        slabLoadOverrides.set(el.nativeId, {
          dead: el.planAnnotation.loads.dead,
          live: el.planAnnotation.loads.live,
        });
      }
    }
  }
  return transcodeIde11TrialToIde11(src, {
    wallSectionOverrides,
    slabLoadOverrides,
  });
}

/**
 * Exports the active project and its binary carrier as a native .ide10 (201094, encodedFlag=0) file.
 * Uses donor surgical patching when `donorIde10Buffer` is provided, or standalone record downgrade otherwise.
 */
export function exportIde10Binary(
  sourceBuffer: ArrayBuffer | Uint8Array,
  project?: IdeProject,
  donorIde10Buffer?: ArrayBuffer | Uint8Array,
): Ide10ExportResult {
  return exportToIde10Binary({
    sourceBuffer,
    project,
    donorIde10Buffer,
  });
}
