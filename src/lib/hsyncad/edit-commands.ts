import type { CadElement, Point } from "./model";

export type EditOperation = "copy" | "rotate" | "mirror" | "offset" | "array";
export function editElement(source: CadElement, operation: EditOperation, dx: number, dy: number, angle: number, count: number): CadElement[] {
  if (![dx, dy, angle, count].every(Number.isFinite) || count < 1 || count > 50 || !Number.isInteger(count)) throw new Error("Sonlu ölçüler ve 1–50 arasında tam sayı girin.");
  if (["copy", "offset", "array"].includes(operation) && Math.hypot(dx, dy) < 1e-6) throw new Error("Kopya için sıfırdan farklı bir ötelenme girin.");
  const pivot = source.type === "column" ? source.position : source.type === "slab" ? source.points[0] : source.start;
  const copies = operation === "array" ? count : 1;
  return Array.from({ length: copies }, (_, index) => {
    const e = structuredClone(source), radians = angle * Math.PI / 180;
    const transform = (p: Point): Point => {
      const x = p.x - pivot.x, y = p.y - pivot.y;
      if (operation === "rotate") return { x: pivot.x + x * Math.cos(radians) - y * Math.sin(radians), y: pivot.y + x * Math.sin(radians) + y * Math.cos(radians) };
      if (operation === "mirror") { const projection = x * Math.cos(radians) + y * Math.sin(radians); return { x: pivot.x + 2 * projection * Math.cos(radians) - x, y: pivot.y + 2 * projection * Math.sin(radians) - y }; }
      return { x: p.x + dx * (index + 1), y: p.y + dy * (index + 1) };
    };
    delete e.connections;
    if (e.type === "column") {
      e.position = transform(e.position);
      if (operation === "rotate") e.rotation = (e.rotation ?? 0) + angle;
      if (operation === "mirror") { e.rotation = 2 * angle - (e.rotation ?? 0); e.mirrorX = !e.mirrorX; }
      if (operation === "rotate" || operation === "mirror") { const lean = transform({ x: pivot.x + (e.leanX ?? 0), y: pivot.y + (e.leanY ?? 0) }); e.leanX = lean.x - pivot.x; e.leanY = lean.y - pivot.y; }
    } else if (e.type === "slab") {
      if ((e.slopeX || e.slopeY) && (operation === "rotate" || operation === "mirror")) throw new Error("Eğimli döşemenin düzlem dönüşümü henüz desteklenmiyor; işlem uygulanmadı.");
      e.points = e.points.map(transform); if (e.labelPosition) e.labelPosition = transform(e.labelPosition); delete e.boundary;
    } else {
      e.start = transform(e.start); e.end = transform(e.end);
      if (operation === "mirror" && (e.type === "beam" || e.type === "wall")) { e.curveSagitta = -(e.curveSagitta ?? 0); e.offset = -(e.offset ?? 0); if (e.alignment === "left") e.alignment = "right"; else if (e.alignment === "right") e.alignment = "left"; }
      if (e.type === "axis") e.orientation = "free";
    }
    if (["copy", "array", "offset"].includes(operation)) { e.id = crypto.randomUUID(); e.name += `-K${index + 1}`; }
    return e;
  });
}

