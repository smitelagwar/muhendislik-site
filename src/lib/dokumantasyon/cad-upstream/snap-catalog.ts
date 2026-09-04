import type { CadSnapPrimitive, CadSnapPoint } from "./snap-engine";
import { normalizeTurkishText } from "./text-search";

type MatrixLike = { elements?: ArrayLike<number> } | ArrayLike<number>;
type EntityLike = Record<string, unknown> & {
  type?: unknown;
  typeName?: unknown;
  dxfTypeName?: unknown;
  layer?: string;
  objectId?: unknown;
};
type BlockLike = { newIterator?: () => Iterable<EntityLike> };
type DatabaseLike = {
  tables?: {
    blockTable?: {
      modelSpace?: BlockLike;
      getAt?: (name: string) => BlockLike | undefined;
    };
  };
};

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

function matrixElements(matrix?: MatrixLike | null): number[] {
  let source: ArrayLike<number> | undefined;
  if (matrix && typeof matrix === "object" && "elements" in matrix) {
    source = (matrix as { elements?: ArrayLike<number> }).elements;
  } else {
    source = matrix as ArrayLike<number> | undefined;
  }
  if (!source || source.length !== 16) return [...IDENTITY];
  return Array.from(source, Number);
}

function multiply(a: number[], b: number[]): number[] {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let value = 0;
      for (let k = 0; k < 4; k++) value += a[k * 4 + row]! * b[col * 4 + k]!;
      out[col * 4 + row] = value;
    }
  }
  return out;
}

function point(value: unknown): CadSnapPoint | null {
  if (!value || typeof value !== "object") return null;
  const p = value as { x?: unknown; y?: unknown };
  if (typeof p.x !== "number" || typeof p.y !== "number") return null;
  return { x: p.x, y: p.y };
}

function transformPoint(matrix: number[], p: CadSnapPoint): CadSnapPoint {
  return {
    x: matrix[0]! * p.x + matrix[4]! * p.y + matrix[12]!,
    y: matrix[1]! * p.x + matrix[5]! * p.y + matrix[13]!,
  };
}

function scaleXY(matrix: number[]): { x: number; y: number } {
  return {
    x: Math.hypot(matrix[0]!, matrix[1]!),
    y: Math.hypot(matrix[4]!, matrix[5]!),
  };
}

function entityId(entity: EntityLike, fallback: string): string {
  const raw = entity.objectId;
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object") {
    const text = String(raw);
    if (text !== "[object Object]") return text;
  }
  return fallback;
}

function uniqueEntityId(entity: EntityLike, fallback: string, usedIds: Set<string>): string {
  const base = entityId(entity, fallback);
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}#${suffix}`;
  while (usedIds.has(candidate)) {
    suffix += 1;
    candidate = `${base}#${suffix}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function entityType(entity: EntityLike): string {
  const ctorName = (entity as { constructor?: { name?: string } }).constructor?.name;
  for (const raw of [entity.dxfTypeName, entity.typeName, entity.type, ctorName]) {
    if (typeof raw === "string" && raw.trim()) return raw.trim().toUpperCase();
  }
  return entity.type === undefined || entity.type === null
    ? ""
    : String(entity.type).toUpperCase();
}

function readVertices(entity: EntityLike): CadSnapPoint[] {
  const raw = entity.vertices;
  if (Array.isArray(raw)) return raw.map(point).filter((p): p is CadSnapPoint => Boolean(p));

  const getter = entity.getVertices;
  if (typeof getter === "function") {
    try {
      const result = getter.call(entity);
      if (Array.isArray(result)) return result.map(point).filter((p): p is CadSnapPoint => Boolean(p));
    } catch {}
  }

  const countRaw = entity.numberOfVertices;
  const count = typeof countRaw === "number" && Number.isFinite(countRaw)
    ? Math.max(0, Math.floor(countRaw))
    : 0;
  const pointGetter =
    typeof entity.getPoint3dAt === "function"
      ? entity.getPoint3dAt
      : typeof entity.getPoint2dAt === "function"
        ? entity.getPoint2dAt
        : null;
  if (count > 0 && pointGetter) {
    const vertices: CadSnapPoint[] = [];
    for (let index = 0; index < count; index += 1) {
      try {
        const vertex = point(pointGetter.call(entity, index));
        if (vertex) vertices.push(vertex);
      } catch {}
    }
    return vertices;
  }

  return [];
}

function pushPolyline(
  out: CadSnapPrimitive[],
  entity: EntityLike,
  matrix: number[],
  id: string,
  layer?: string
): void {
  const vertices = readVertices(entity).map((p) => transformPoint(matrix, p));
  if (vertices.length < 2) return;
  const closed = Boolean(entity.closed ?? entity.isClosed);
  const segmentCount = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    out.push({
      kind: "line",
      id: `${id}:seg:${i}`,
      layer,
      a: vertices[i]!,
      b: vertices[(i + 1) % vertices.length]!,
    });
  }
}

function pushCircleOrArc(
  out: CadSnapPrimitive[],
  entity: EntityLike,
  matrix: number[],
  id: string,
  layer: string | undefined,
  arc: boolean
): void {
  const center = point(entity.center);
  const radius = typeof entity.radius === "number" ? entity.radius : null;
  if (!center || !(radius && radius > 0)) return;
  const scales = scaleXY(matrix);
  const transformedCenter = transformPoint(matrix, center);
  if (Math.abs(scales.x - scales.y) > Math.max(scales.x, scales.y, 1) * 1e-6) {
    const samples = arc ? 24 : 48;
    const start = arc && typeof entity.startAngle === "number" ? entity.startAngle : 0;
    const end = arc && typeof entity.endAngle === "number" ? entity.endAngle : Math.PI * 2;
    const clockwise = Boolean(entity.clockwise);
    let span = clockwise ? start - end : end - start;
    while (span <= 0) span += Math.PI * 2;
    let previous: CadSnapPoint | null = null;
    for (let i = 0; i <= samples; i++) {
      const angle = clockwise ? start - (span * i) / samples : start + (span * i) / samples;
      const local = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
      const current = transformPoint(matrix, local);
      if (previous) out.push({ kind: "line", id: `${id}:approx:${i - 1}`, layer, a: previous, b: current });
      previous = current;
    }
    return;
  }
  const r = radius * scales.x;
  if (arc) {
    const startAngle = typeof entity.startAngle === "number" ? entity.startAngle : 0;
    const endAngle = typeof entity.endAngle === "number" ? entity.endAngle : Math.PI * 2;
    out.push({ kind: "arc", id, layer, center: transformedCenter, radius: r, startAngle, endAngle, clockwise: Boolean(entity.clockwise) });
  } else {
    out.push({ kind: "circle", id, layer, center: transformedCenter, radius: r });
  }
}

function resolveReferencedBlock(entity: EntityLike, db: DatabaseLike): BlockLike | undefined {
  const direct = entity.blockTableRecord as BlockLike | undefined;
  if (direct?.newIterator) return direct;
  const name = typeof entity.blockName === "string" ? entity.blockName : undefined;
  return name ? db.tables?.blockTable?.getAt?.(name) : undefined;
}

function visitBlock(
  block: BlockLike | undefined,
  db: DatabaseLike,
  matrix: number[],
  out: CadSnapPrimitive[],
  path: string,
  seen: Set<BlockLike>,
  usedIds: Set<string>
): void {
  if (!block?.newIterator || seen.has(block)) return;
  seen.add(block);
  let index = 0;
  for (const entity of block.newIterator()) {
    const fallback = `${path}:${index++}`;
    const id = uniqueEntityId(entity, fallback, usedIds);
    const type = entityType(entity);
    const layer = typeof entity.layer === "string" ? entity.layer : undefined;
    const start = point(entity.startPoint);
    const end = point(entity.endPoint);

    if (start && end && (type.includes("LINE") || type === "")) {
      out.push({ kind: "line", id, layer, a: transformPoint(matrix, start), b: transformPoint(matrix, end) });
      continue;
    }
    if (type.includes("CIRCLE")) {
      pushCircleOrArc(out, entity, matrix, id, layer, false);
      continue;
    }
    if (type.includes("ARC")) {
      pushCircleOrArc(out, entity, matrix, id, layer, true);
      continue;
    }
    if (
      type.includes("POLYLINE") ||
      Array.isArray(entity.vertices) ||
      typeof entity.getVertices === "function" ||
      (typeof entity.numberOfVertices === "number" &&
        (typeof entity.getPoint3dAt === "function" || typeof entity.getPoint2dAt === "function"))
    ) {
      pushPolyline(out, entity, matrix, id, layer);
      continue;
    }

    const transform = entity.getFullInsertionTransform;
    const referenced = resolveReferencedBlock(entity, db);
    if (referenced && typeof transform === "function") {
      try {
        const childMatrix = matrixElements(transform.call(entity) as MatrixLike);
        visitBlock(
          referenced,
          db,
          multiply(matrix, childMatrix),
          out,
          `${path}/${id}`,
          new Set(seen),
          usedIds
        );
      } catch {}
    }
  }
}

export function buildCadSnapPrimitives(database: unknown): CadSnapPrimitive[] {
  const db = database as DatabaseLike;
  const modelSpace = db.tables?.blockTable?.modelSpace;
  if (!modelSpace) return [];
  const out: CadSnapPrimitive[] = [];
  visitBlock(modelSpace, db, [...IDENTITY], out, "model", new Set(), new Set());
  return out;
}

export function buildCadTextSearchCatalog(database: unknown): import("./text-search").CadTextEntityInfo[] {
  const db = database as DatabaseLike;
  const modelSpace = db.tables?.blockTable?.modelSpace;
  if (!modelSpace) return [];
  const out: import("./text-search").CadTextEntityInfo[] = [];

  function visitTextBlock(
    block: BlockLike | undefined,
    matrix: number[],
    seen: Set<BlockLike>,
    layoutName: string
  ): void {
    if (!block?.newIterator || seen.has(block)) return;
    seen.add(block);

    for (const entity of block.newIterator()) {
      const type = entityType(entity);
      const isText = type.includes("TEXT") || type.includes("ATTRIB");

      if (isText) {
        let rawText = "";
        if (typeof entity.text === "string") rawText = entity.text;
        else if (typeof entity.textString === "string") rawText = entity.textString;
        else if (typeof entity.string === "string") rawText = entity.string;
        else if (typeof entity.contents === "string") rawText = entity.contents;

        if (rawText.trim()) {
          const typeName: "TEXT" | "MTEXT" | "ATTRIB" = type.includes("MTEXT")
            ? "MTEXT"
            : type.includes("ATTRIB")
              ? "ATTRIB"
              : "TEXT";

          const clean = typeName === "MTEXT" ? rawText.replace(/\\P/gi, " ") : rawText;
          const p = point(entity.position) ?? point(entity.startPoint) ?? { x: 0, y: 0 };
          const transformedAnchor = transformPoint(matrix, p);

          const rot = typeof entity.rotation === "number" ? entity.rotation : 0;
          const height = typeof entity.height === "number" && entity.height > 0 ? entity.height : 10;
          const width = height * Math.max(1, clean.length * 0.6);

          out.push({
            id: entityId(entity, `txt:${out.length}`),
            handle: entityId(entity, `h:${out.length}`),
            type: typeName,
            text: clean,
            normalizedText: normalizeTurkishText(clean),
            layer: typeof entity.layer === "string" ? entity.layer : "0",
            layout: layoutName,
            anchor: transformedAnchor,
            bounds: {
              min: { x: transformedAnchor.x, y: transformedAnchor.y },
              max: { x: transformedAnchor.x + width, y: transformedAnchor.y + height },
            },
            rotationDeg: (rot * 180) / Math.PI,
          });
        }
      }

      const transform = entity.getFullInsertionTransform;
      const referenced = resolveReferencedBlock(entity, db);
      if (referenced && typeof transform === "function") {
        try {
          const childMatrix = matrixElements(transform.call(entity) as MatrixLike);
          visitTextBlock(referenced, multiply(matrix, childMatrix), new Set(seen), layoutName);
        } catch {}
      }
    }
  }

  visitTextBlock(modelSpace, [...IDENTITY], new Set(), "Model");
  return out;
}
