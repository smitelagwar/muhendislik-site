import { columnOffsets, effectiveThickness } from "./definitions";
import { distance, elementFootprint, elementVerticalRange, isSimplePolygon, polygonArea, segmentIntersection } from "./geometry";
import { validateModel, type CadModel, type Point, type SolidElement } from "./model";
import { ideCadSlabPanelIssues } from "./ifc-panels";
import { ideReferenceElements } from "./ide-workspace";

export type IfcExportIssue = { id: string; name: string; code: string; reason: string };
export type IfcExportReport = {
  schema: "IFC2X3";
  nativeIdeCadVerified: false;
  sourceElementCount: number;
  exported: { id: string; name: string; type: SolidElement["type"]; ifcClass: string; ifcId: string; sourceFloorId: string; containerFloorId: string; bottom: number; top: number; volume: number }[];
  omitted: IfcExportIssue[];
  warnings: IfcExportIssue[];
  storeys: { id: string; name: string; elevation: number; boundaryOnly: boolean }[];
  notTransferred: string[];
};
export type IfcExportOptions = {
  /** Refuse slab outlines the observed native importer changes or loses. */
  requireIdeCadPanels?: boolean;
  /** Default: reject an unsupported solid instead of silently exporting part of a building. */
  unsupportedElements?: "error" | "omit";
  /** CadModel v1 does not model holes; callers must supply known slab voids explicitly. */
  holesBySlabId?: Readonly<Record<string, readonly (readonly Point[])[]>>;
  /** Fixed by default so identical models produce byte-identical files. */
  timestamp?: string;
};
export class IfcExportError extends Error {
  constructor(message: string, public readonly issues: IfcExportIssue[]) { super(message); this.name = "IfcExportError"; }
}

const EPS = 1e-7;
const cmp = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const refs = (values: number[]) => `(${values.map(v => `#${v}`).join(",")})`;
const real = (value: number) => {
  if (!Number.isFinite(value)) throw new Error("IFC: sonlu sayı gerekli.");
  const [mantissa, exponent] = Number(value.toPrecision(15)).toString().replace("e", "E").split("E");
  return `${mantissa.includes(".") ? mantissa : `${mantissa}.`}${exponent === undefined ? "" : `E${exponent}`}`;
};
/** STEP Part 21 strings: quote/backslash escaping and UTF-16 X2 sequences. */
function str(value: string): string {
  let out = "'";
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    out += c === 39 ? "''" : c === 92 ? "\\\\" : c >= 32 && c <= 126 ? value[i] : `\\X2\\${c.toString(16).toUpperCase().padStart(4, "0")}\\X0\\`;
  }
  return `${out}'`;
}
/** Deterministic 128-bit identity, encoded using IFC's 22-character alphabet. Not a security hash. */
function guid(seed: string): string {
  const bytes = new TextEncoder().encode(seed);
  const words = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35].map((initial, lane) => {
    let h = initial;
    for (const byte of bytes) h = Math.imul(h ^ byte ^ (lane * 17), 0x01000193) >>> 0;
    return h.toString(2).padStart(32, "0");
  });
  const bits = `0000${words.join("")}`, alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  return Array.from({ length: 22 }, (_, i) => alphabet[parseInt(bits.slice(i * 6, i * 6 + 6), 2)]).join("");
}
class StepWriter {
  rows: string[] = [];
  private identities = new Map<string, string>();
  constructor(private namespace: string) {}
  add(type: string, args: string): number { const id = this.rows.length + 1; this.rows.push(`#${id}=${type}(${args});`); return id; }
  id(key: string): string {
    const id = guid(`${this.namespace}\u0000${key}`);
    const previous = this.identities.get(id);
    if (previous !== undefined) throw new Error(`IFC kimlik çakışması: ${previous} / ${key}`);
    this.identities.set(id, key); return str(id);
  }
  point(values: number[]) { return this.add("IFCCARTESIANPOINT", `(${values.map(real).join(",")})`); }
  direction(values: number[]) { return this.add("IFCDIRECTION", `(${values.map(real).join(",")})`); }
  axis3(location: number[], axis = [0, 0, 1], ref = [1, 0, 0]) {
    return this.add("IFCAXIS2PLACEMENT3D", `#${this.point(location)},#${this.direction(axis)},#${this.direction(ref)}`);
  }
  placement(parent: number | null, xyz: number[], ref = [1, 0, 0]) {
    return this.add("IFCLOCALPLACEMENT", `${parent === null ? "$" : `#${parent}`},#${this.axis3(xyz, [0, 0, 1], ref)}`);
  }
  polyline(points: number[][]) { return this.add("IFCPOLYLINE", refs(points.map(p => this.point(p)))); }
  rectangle(width: number, depth: number, center = [0, 0]) {
    const position = this.add("IFCAXIS2PLACEMENT2D", `#${this.point(center)},$`);
    return this.add("IFCRECTANGLEPROFILEDEF", `.AREA.,$,#${position},${real(width)},${real(depth)}`);
  }
  profile(points: Point[], holes: Point[][] = []) {
    const ring = (p: Point[]) => this.polyline([...p, p[0]].map(v => [v.x, v.y]));
    const outer = ring(oriented(points, true));
    return holes.length ? this.add("IFCARBITRARYPROFILEDEFWITHVOIDS", `.AREA.,$,#${outer},${refs(holes.map(h => ring(oriented(h, false))))}`)
      : this.add("IFCARBITRARYCLOSEDPROFILEDEF", `.AREA.,$,#${outer}`);
  }
}
function oriented(points: Point[], ccw: boolean) {
  const sum = points.reduce((s, p, i) => { const q = points[(i + 1) % points.length]; return s + p.x * q.y - q.x * p.y; }, 0);
  return (sum > 0) === ccw ? points : [...points].reverse();
}
function onEdge(p: Point, a: Point, b: Point) {
  return Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) < EPS
    && p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
}
function inside(p: Point, ring: Point[]) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (onEdge(p, a, b)) return false;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}
function ringsTouch(a: Point[], b: Point[]) {
  return a.some((p, i) => b.some((q, j) => {
    const p2 = a[(i + 1) % a.length], q2 = b[(j + 1) % b.length];
    return !!segmentIntersection(p, p2, q, q2) || onEdge(p, q, q2) || onEdge(q, p, p2);
  }));
}
function holesFor(element: SolidElement, options: IfcExportOptions): Point[][] {
  const extension = (element as SolidElement & { holes?: Point[][] }).holes;
  const raw = options.holesBySlabId?.[element.id] ?? extension ?? [];
  if (element.type !== "slab") { if (raw.length) throw new Error(`${element.name}: yalnız döşeme boşlukları desteklenir.`); return []; }
  const holes = raw.map(r => r.map(p => ({ x: p.x, y: p.y })));
  holes.forEach((hole, i) => {
    if (!isSimplePolygon(hole) || hole.some(p => !inside(p, element.points)) || ringsTouch(hole, element.points)
      || holes.slice(0, i).some(other => ringsTouch(hole, other) || inside(hole[0], other) || inside(other[0], hole))) {
      throw new Error(`${element.name}: boşluklar basit, birbirinden ayrık ve döşemenin tamamen içinde olmalıdır.`);
    }
  });
  return holes;
}

/** Geometry/identity IFC bridge. Does NOT generate a native .ide10/.ide11 archive. */
export function exportCadModelIfc(input: CadModel, options: IfcExportOptions = {}): { text: string; report: IfcExportReport } {
  // Validate the original model; don't use the reconstructed result, which drops unknown extension fields such as holes.
  validateModel(input);
  const model = input, floors = [...model.floors].sort((a, b) => a.elevation - b.elevation || cmp(a.id, b.id));
  for (let i = 1; i < floors.length; i++) {
    if (Math.abs(floors[i - 1].elevation + floors[i - 1].height - floors[i].elevation) > EPS) {
      throw new Error("ideCAD IFC aktarımı için katlar üst üste binmeden, boşluk bırakmadan sıralanmalıdır.");
    }
  }
  const timestamp = options.timestamp ?? "2000-01-01T00:00:00Z";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp) || !Number.isFinite(Date.parse(timestamp)) || Date.parse(timestamp) < 0 || new Date(timestamp).toISOString().replace(".000Z", "Z") !== timestamp) throw new Error("Geçersiz IFC zaman damgası.");
  const boundaryId = "__hsyncad_ifc_top_boundary__";
  if (floors.some(f => f.id === boundaryId)) throw new Error("IFC üst sınır katı kimliği kaynak modelde kullanılıyor.");
  const last = floors[floors.length - 1];
  const report: IfcExportReport = {
    schema: "IFC2X3", nativeIdeCadVerified: false, sourceElementCount: model.elements.length, exported: [], omitted: [], warnings: [],
    storeys: [...floors.map(f => ({ id: f.id, name: f.name, elevation: f.elevation, boundaryOnly: false })), { id: boundaryId, name: "hsynCAD üst kot sınırı", elevation: last.elevation + last.height, boundaryOnly: true }],
    notTransferred: ["Donatı geometrisi ve donatı hesabı", "Sabit/hareketli yükler ve yük kombinasyonları", "Beton ve donatı dayanım sınıfları; kaynak model yalnız malzeme adı taşır", "Analiz sonuçları, deprem/zemin parametreleri ve mesnetler", "Paftalar, ölçüler, akslar, katman görünürlüğü ve çizim ayarları", "Temel/merdiven gibi CadModel'de ayrı türü olmayan elemanların özgün statik anlamı"],
  };
  for (const id of Object.keys(options.holesBySlabId ?? {})) if (!model.elements.some(e => e.id === id && e.type === "slab")) throw new Error(`Boşluk döşemesi bulunamadı: ${id}`);
  const supported: SolidElement[] = [], holes = new Map<string, Point[][]>();
  const panelIssues = options.requireIdeCadPanels ? ideCadSlabPanelIssues(model) : new Map<string, string>();
  for (const e of [...model.elements].sort((a, b) => cmp(a.id, b.id))) {
    if (e.type === "axis" || e.type === "slabEdge") { report.omitted.push({ id: e.id, name: e.name, code: "NON_SOLID", reason: "Aks/döşeme kenarı bu yapısal IFC aktarımında yazılmaz." }); continue; }
    let reason: string | undefined;
    if ((e.type === "beam" || e.type === "wall") && Math.abs(e.curveSagitta ?? 0) > EPS) reason = "Eğrisel eleman için doğrulanmış native IFC aktarımı yok.";
    if (e.type === "beam" && Math.abs((e.endTopOffset ?? e.topOffset ?? 0) - (e.topOffset ?? 0)) > EPS) reason = "Eğimli kiriş bu aktarımda desteklenmiyor.";
    if (e.type === "slab" && (Math.abs(e.slopeX ?? 0) > EPS || Math.abs(e.slopeY ?? 0) > EPS)) reason = "Eğimli döşeme bu aktarımda desteklenmiyor; düzleştirilmez.";
    if (e.type === "column" && (Math.abs(e.leanX ?? 0) > EPS || Math.abs(e.leanY ?? 0) > EPS)) reason = "Eğik kolon bu aktarımda desteklenmiyor.";
    if (!reason && panelIssues.has(e.id)) reason = panelIssues.get(e.id);
    if (reason) { report.omitted.push({ id: e.id, name: e.name, code: "UNSUPPORTED_GEOMETRY", reason }); continue; }
    holes.set(e.id, holesFor(e, options)); supported.push(e);
    if (options.requireIdeCadPanels && (holes.get(e.id)?.length ?? 0) > 0) {
      supported.pop(); report.omitted.push({ id: e.id, name: e.name, code: "NATIVE_HOLES_UNVERIFIED", reason: "Döşeme boşluklarının native kayıtta korunduğu henüz doğrulanmadı." }); continue;
    }
    if (e.type === "wall") report.warnings.push({ id: e.id, name: e.name, code: "WALL_CLASSIFICATION", reason: "IfcWallStandardCase yazılır; ideCAD'de betonarme perdeye dönüşmesi ve kat ataması ayrıca doğrulanmalıdır." });
    if (e.type === "slab" && e.buildUp?.length) report.warnings.push({ id: e.id, name: e.name, code: "SLAB_BUILDUP", reason: "Görüntülenen toplam katman kalınlığı korunur; katman malzemeleri tek kaynak malzemesine indirgenir." });
    if ((holes.get(e.id)?.length ?? 0) > 0) report.warnings.push({ id: e.id, name: e.name, code: "SLAB_HOLES", reason: "IFC profiline boşluklar yazılır; ideCAD'in delikleri native döşemede koruduğu ayrıca doğrulanmalıdır." });
  }
  const unsupported = report.omitted.filter(e => e.code !== "NON_SOLID");
  if (unsupported.length && options.unsupportedElements !== "omit") throw new IfcExportError(`IFC aktarımı durduruldu. ${unsupported.slice(0, 3).map(issue => `${issue.name}: ${issue.reason}`).join(" ")}${unsupported.length > 3 ? ` Ayrıca ${unsupported.length - 3} eleman daha uygun değil.` : ""}`, unsupported);
  const references = ideReferenceElements(model);
  report.sourceElementCount += references.length;
  for (const e of references) report.omitted.push({ id: e.id, name: e.name, code: "IDE_SOURCE_REFERENCE", reason: "IDE kaynak referansı düzenlenebilir yapısal IFC modeline dahil edilmedi; .hsyncad çalışma dosyasında korunur." });
  if (model.ideImport) report.notTransferred.push("IDE kaynak referansları ve çözümlenemeyen native kayıtlar; tam IDE projesi aktarımı değildir");
  report.warnings.push({ id: "project", name: model.name, code: "NATIVE_IMPORT_UNVERIFIED", reason: "Bu IFC dosyasının ideCAD'de açılması, native nesne türleri, malzeme eşleşmesi ve üst katın kaldırılması uygulamada doğrulanmalıdır." });
  const w = new StepWriter(`hsynCAD IFC2X3/${model.name}`);
  const person = w.add("IFCPERSON", "$,$,'hsynCAD',$,$,$,$,$");
  const organization = w.add("IFCORGANIZATION", "$,'hsynCAD',$,$,$");
  const user = w.add("IFCPERSONANDORGANIZATION", `#${person},#${organization},$`);
  const app = w.add("IFCAPPLICATION", `#${organization},'1.0','hsynCAD structural IFC exporter','hsynCAD'`);
  const owner = w.add("IFCOWNERHISTORY", `#${user},#${app},$,.ADDED.,$,$,$,${Math.floor(Date.parse(timestamp) / 1000)}`);
  const world = w.axis3([0, 0, 0]);
  const context = w.add("IFCGEOMETRICREPRESENTATIONCONTEXT", "$,'Model',3,0.0000001," + `#${world},$`);
  const units = w.add("IFCUNITASSIGNMENT", refs([
    w.add("IFCSIUNIT", "*,.LENGTHUNIT.,$,.METRE."), w.add("IFCSIUNIT", "*,.AREAUNIT.,$,.SQUARE_METRE."),
    w.add("IFCSIUNIT", "*,.VOLUMEUNIT.,$,.CUBIC_METRE."), w.add("IFCSIUNIT", "*,.PLANEANGLEUNIT.,$,.RADIAN."),
  ]));
  const project = w.add("IFCPROJECT", `${w.id("project")},#${owner},${str(model.name)},$,$,$,$,(#${context}),#${units}`);
  const sitePlacement = w.placement(null, [0, 0, 0]);
  const site = w.add("IFCSITE", `${w.id("site")},#${owner},'Site',$,$,#${sitePlacement},$,$,.ELEMENT.,$,$,$,$,$`);
  const buildingPlacement = w.placement(sitePlacement, [0, 0, 0]);
  const building = w.add("IFCBUILDING", `${w.id("building")},#${owner},${str(model.name)},$,$,#${buildingPlacement},$,$,.ELEMENT.,$,$,$`);
  const aggregate = (key: string, parent: number, children: number[]) => w.add("IFCRELAGGREGATES", `${w.id(key)},#${owner},$,$,#${parent},${refs(children)}`);
  aggregate("project-site", project, [site]); aggregate("site-building", site, [building]);
  const storeys = report.storeys.map(s => {
    const placement = w.placement(buildingPlacement, [0, 0, s.elevation]);
    const entity = w.add("IFCBUILDINGSTOREY", `${w.id(`storey/${s.id}`)},#${owner},${str(s.name)},$,$,#${placement},$,$,.ELEMENT.,${real(s.elevation)}`);
    return { ...s, entity, placement, elements: [] as number[] };
  });
  aggregate("building-storeys", building, storeys.map(s => s.entity));
  const materials = new Map([...model.materials].sort((a, b) => cmp(a.id, b.id)).map(m => [m.id, w.add("IFCMATERIAL", str(m.name))]));
  for (const e of supported) {
    const floorIndex = floors.findIndex(f => f.id === e.floorId), floor = floors[floorIndex];
    const container = storeys[floorIndex + (e.type === "beam" || e.type === "slab" ? 1 : 0)];
    const [bottom, top] = elementVerticalRange(e, floor);
    let profile: number, placement: number, solidPosition: number, depth = top - bottom, area: number;
    let axisLine: number | undefined;
    if (e.type === "beam" || e.type === "wall") {
      const length = distance(e.start, e.end), dx = (e.end.x - e.start.x) / length, dy = (e.end.y - e.start.y) / length;
      const width = e.type === "beam" ? e.width : e.thickness;
      const shift = (e.offset ?? 0) + (e.alignment === "left" ? width / 2 : e.alignment === "right" ? -width / 2 : 0);
      // Native wall import adds the profile's 2D position without rotating it.
      // Put the origin at the member centre and keep its profile position zero;
      // this preserves both IFC world geometry and diagonal native placement.
      const centre = e.type === "wall" ? length / 2 : 0;
      placement = w.placement(container.placement, [e.start.x + dx * centre - dy * shift, e.start.y + dy * centre + dx * shift, (e.type === "beam" ? (bottom + top) / 2 : bottom) - container.elevation], [dx, dy, 0]);
      axisLine = w.polyline([[-centre, 0, 0], [length - centre, 0, 0]]);
      if (e.type === "beam") {
        profile = w.rectangle(width, e.height); solidPosition = w.axis3([0, 0, 0], [1, 0, 0], [0, 1, 0]); depth = length; area = width * e.height;
      } else { profile = w.rectangle(length, width); solidPosition = w.axis3([0, 0, 0]); area = length * width; }
    } else if (e.type === "column" && e.section !== "polygon") {
      const angle = (e.rotation ?? 0) * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle), offset = columnOffsets(e), mirror = e.mirrorX ? -1 : 1;
      placement = w.placement(container.placement, [e.position.x + offset.x * cos - offset.y * mirror * sin, e.position.y + offset.x * sin + offset.y * mirror * cos, bottom - container.elevation], [cos, sin, 0]);
      if (e.section === "circle") {
        const pos = w.add("IFCAXIS2PLACEMENT2D", `#${w.point([0, 0])},$`);
        profile = w.add("IFCCIRCLEPROFILEDEF", `.AREA.,$,#${pos},${real(e.width / 2)}`); area = Math.PI * (e.width / 2) ** 2;
      } else { profile = w.rectangle(e.width, e.depth); area = e.width * e.depth; }
      solidPosition = w.axis3([0, 0, 0]);
    } else {
      const points = elementFootprint(e), voids = holes.get(e.id) ?? [];
      profile = w.profile(points, voids); area = polygonArea(points) - voids.reduce((sum, h) => sum + polygonArea(h), 0);
      placement = w.placement(container.placement, [0, 0, bottom - container.elevation]); solidPosition = w.axis3([0, 0, 0]);
      if (e.type === "slab") depth = effectiveThickness(e);
    }
    const solid = w.add("IFCEXTRUDEDAREASOLID", `#${profile},#${solidPosition},#${w.direction([0, 0, 1])},${real(depth)}`);
    const body = w.add("IFCSHAPEREPRESENTATION", `#${context},'Body','SweptSolid',(#${solid})`);
    // Keep the solid first. ideCAD's native member importer consumes the first
    // geometry result and dereferences its profile before checking its type.
    const representations = axisLine === undefined ? [body] : [body, w.add("IFCSHAPEREPRESENTATION", `#${context},'Axis','Curve3D',(#${axisLine})`)];
    const shape = w.add("IFCPRODUCTDEFINITIONSHAPE", `$,$,${refs(representations)}`);
    const type = { column: "IFCCOLUMN", beam: "IFCBEAM", wall: "IFCWALLSTANDARDCASE", slab: "IFCSLAB" }[e.type];
    const ifcId = w.id(`element/${e.id}`);
    const entity = w.add(type, `${ifcId},#${owner},${str(e.name)},$,$,#${placement},#${shape},${str(e.id)}${e.type === "slab" ? ",.FLOOR." : ""}`);
    container.elements.push(entity);
    let material = materials.get(e.materialId)!;
    if (e.type === "wall") {
      const layer = w.add("IFCMATERIALLAYER", `#${material},${real(e.thickness)},$`);
      const set = w.add("IFCMATERIALLAYERSET", `(#${layer}),$`);
      material = w.add("IFCMATERIALLAYERSETUSAGE", `#${set},.AXIS2.,.POSITIVE.,${real(-e.thickness / 2)}`);
    }
    w.add("IFCRELASSOCIATESMATERIAL", `${w.id(`material/${e.id}`)},#${owner},$,$,(#${entity}),#${material}`);
    const properties = [
      w.add("IFCPROPERTYSINGLEVALUE", `'SourceElementId',$,IFCIDENTIFIER(${str(e.id)}),$`),
      w.add("IFCPROPERTYSINGLEVALUE", `'SourceFloorId',$,IFCIDENTIFIER(${str(e.floorId)}),$`),
      w.add("IFCPROPERTYSINGLEVALUE", `'SourceType',$,IFCLABEL(${str(e.type)}),$`),
    ];
    const pset = w.add("IFCPROPERTYSET", `${w.id(`properties/${e.id}`)},#${owner},'HsynCADSource',$,${refs(properties)}`);
    w.add("IFCRELDEFINESBYPROPERTIES", `${w.id(`properties-rel/${e.id}`)},#${owner},$,$,(#${entity}),#${pset}`);
    const loadBearing = w.add("IFCPROPERTYSINGLEVALUE", "'LoadBearing',$,IFCBOOLEAN(.T.),$");
    const common = w.add("IFCPROPERTYSET", `${w.id(`common/${e.id}`)},#${owner},${str(`Pset_${e.type[0].toUpperCase()}${e.type.slice(1)}Common`)},$,(#${loadBearing})`);
    w.add("IFCRELDEFINESBYPROPERTIES", `${w.id(`common-rel/${e.id}`)},#${owner},$,$,(#${entity}),#${common}`);
    report.exported.push({ id: e.id, name: e.name, type: e.type, ifcClass: type, ifcId: ifcId.slice(1, -1), sourceFloorId: e.floorId, containerFloorId: container.id, bottom, top, volume: area * depth });
  }
  for (const s of storeys) if (s.elements.length) w.add("IFCRELCONTAINEDINSPATIALSTRUCTURE", `${w.id(`containment/${s.id}`)},#${owner},$,$,${refs(s.elements)},#${s.entity}`);
  return { text: ["ISO-10303-21;", "HEADER;", "FILE_DESCRIPTION(('hsynCAD structural geometry exchange'),'2;1');",
    `FILE_NAME(${str(`${model.name}.ifc`)},${str(timestamp)},('hsynCAD'),('hsynCAD'),'hsynCAD IFC2X3 exporter','hsynCAD','');`,
    "FILE_SCHEMA(('IFC2X3'));", "ENDSEC;", "DATA;", ...w.rows, "ENDSEC;", "END-ISO-10303-21;", ""].join("\n"), report };
}
