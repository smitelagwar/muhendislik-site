import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { createHash } from "node:crypto";
import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "../src/lib/hsyncad/geometry";
import { parseIde10 } from "../src/lib/hsyncad/ide-import";
import { createDemoModel, isSolidElement, validateModel, type Point } from "../src/lib/hsyncad/model";

const metreTolerance = 0.001;

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const squaredLength = dx * dx + dy * dy;
  if (!squaredLength) return distance(point, a);
  const projection = ((point.x - a.x) * dx + (point.y - a.y) * dy) / squaredLength;
  const t = Math.min(1, Math.max(0, projection));
  return distance(point, { x: a.x + t * dx, y: a.y + t * dy });
}

function compareOutlines(expected: Point[], observed: Point[]): boolean {
  if (expected.length < 3 || observed.length < 3) return false;
  const onBoundary = (points: Point[], ring: Point[]) => points.every((p, i) => {
    const q = points[(i + 1) % points.length];
    const midpoint = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
    return [p, midpoint].every(sample => ring.some((a, j) => distanceToSegment(sample, a, ring[(j + 1) % ring.length]) <= metreTolerance));
  });
  const areaTolerance = metreTolerance * polygonPerimeter(expected);
  return Math.abs(polygonArea(expected) - polygonArea(observed)) <= areaTolerance && onBoundary(expected, observed) && onBoundary(observed, expected);
}

function main(): number {
  const [source, target, ...extra] = process.argv.slice(2);
  if (!source || !target || extra.length) throw new Error("Kullanım: tsx scripts/audit-hsyncad-native-roundtrip.ts <model.json veya --demo> <native IDE dosyası>");
  if (source !== "--demo" && statSync(source).size > 5_000_000) throw new Error("Kaynak model 5 MB sınırını aşıyor.");
  if (statSync(target).size > 512 * 1024 * 1024) throw new Error("Native dosya 512 MB sınırını aşıyor.");
  const sourceBytes = source === "--demo" ? undefined : readFileSync(source);
  const sourceModel = sourceBytes ? JSON.parse(sourceBytes.toString("utf8")) : undefined;
  if (Array.isArray(sourceModel?.elements) && sourceModel.elements.some((e: { holes?: unknown } | null) => e && Array.isArray(e.holes) && e.holes.length)) throw new Error("Boşluklu kaynak konturunun bu denetimde eşleşmesi henüz desteklenmiyor; eksiksiz geometri eşleşmesi raporlanmadı.");
  const model = sourceBytes ? validateModel(sourceModel) : createDemoModel();
  const bytes = readFileSync(target);
  const native = parseIde10(Uint8Array.from(bytes).buffer, basename(target));
  const sourceSolids = model.elements.filter(isSolidElement);
  const nativeSolids = native.elements.filter(e => ["beam", "column", "slab", "wall"].includes(e.type));
  const floorPairs = model.floors.map(floor => ({ floor, candidates: native.floors.filter(f => Math.abs(f.elevation - floor.elevation) <= metreTolerance) }));
  const taken = new Set<string>();
  const elements = sourceSolids.map(sourceElement => {
    const sourceFloor = model.floors.find(f => f.id === sourceElement.floorId)!;
    const floor = floorPairs.find(pair => pair.floor.id === sourceFloor.id)?.candidates;
    const outline = elementFootprint(sourceElement);
    const [bottom, top] = elementVerticalRange(sourceElement, sourceFloor);
    const candidates = nativeSolids.filter(e => floor?.length === 1 && e.floorId === floor[0].id && e.type === sourceElement.type && !taken.has(e.id));
    const outlineMatches = candidates.filter(e => {
      if (sourceElement.type === "column" && sourceElement.section === "circle" && e.circleSection) {
        const center = { x: outline.reduce((sum, p) => sum + p.x, 0) / outline.length, y: outline.reduce((sum, p) => sum + p.y, 0) / outline.length };
        return distance(center, e.circleSection.center) <= metreTolerance && Math.abs(sourceElement.width / 2 - e.circleSection.radius) <= metreTolerance;
      }
      return compareOutlines(outline, e.footprint ?? e.points);
    });
    const matches = outlineMatches.filter(e => e.bottom !== undefined && e.top !== undefined && Math.abs(e.bottom - bottom) <= metreTolerance && Math.abs(e.top - top) <= metreTolerance && !e.holes?.length);
    const unique = matches.length === 1 ? matches[0] : undefined;
    if (unique) taken.add(unique.id);
    return {
      sourceId: sourceElement.id, sourceName: sourceElement.name, type: sourceElement.type,
      expected: { floor: sourceFloor.name, bottom, top, outline },
      status: unique ? "matched" : matches.length > 1 ? "ambiguous" : outlineMatches.length ? "vertical-or-opening-mismatch" : "no-matching-outline",
      observed: (matches.length ? matches : outlineMatches).map(e => ({ id: e.id, name: e.name, bottom: e.bottom, top: e.top, structural: e.structural, openings: e.holes?.length ?? 0, ...(e.circleSection ? { circleSection: e.circleSection } : {}) })),
    };
  });
  const floors = floorPairs.map(({floor, candidates}) => ({
    sourceName: floor.name, elevation: floor.elevation, height: floor.height,
    observed: candidates.map(f => ({ id: f.id, name: f.name, elevation: f.elevation, height: f.height })),
    matched: candidates.length === 1 && Math.abs(candidates[0].height - floor.height) <= metreTolerance,
  }));
  const extraSolids = nativeSolids.filter(e => !taken.has(e.id)).map(e => ({ id: e.id, name: e.name, type: e.type, floorId: e.floorId }));
  const matched = elements.filter(element => element.status === "matched").length;
  const geometryMatch = elements.length > 0 && matched === elements.length && !extraSolids.length &&
    floors.every(f => f.matched) && floors.length === native.floors.length && native.coverage.unsupportedRecords === 0;
  console.log(JSON.stringify({
    geometryMatch, metreTolerance,
    source: { filename: source === "--demo" ? "--demo" : basename(source), sha256: sourceBytes ? createHash("sha256").update(sourceBytes).digest("hex") : null },
    target: { filename: native.filename, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, format: native.format, name: native.name, unsupportedRecords: native.coverage.unsupportedRecords },
    counts: { expected: elements.length, decodedSolids: nativeSolids.length, matched, extraSolids: extraSolids.length },
    floors, elements, extraSolids,
    scope: "Katlar ve tanınan katıların plan sınırı ve düşey aralığı; native daire işareti/yarıçapı doğrulanan kolonlarda merkez ve yarıçap karşılaştırılır. Malzeme, taşıyıcı sınıfı, donatı, analiz, yük ve native uygulama açılışı ayrıca doğrulanır.",
  }, null, 2));
  return geometryMatch ? 0 : 2;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
