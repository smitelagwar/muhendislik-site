// F06 acceptance: compile two paper layouts from one model, then verify the
// exact per-layout geometry/style/visibility contract consumed by the renderer.
import assert from "node:assert/strict";
import { CadV2Renderer } from "../../src/lib/cad-v2/render/cad-v2-renderer";
import type { CadCanonicalDocument, CadEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { getCameraWorldViewportBBox, isChunkVisibleInCamera } from "../../src/lib/cad-v2/render/chunk-visibility";
import type { CadCameraState } from "../../src/lib/cad-v2/interaction/d3-camera-adapter";

function check(condition: boolean, message: string): void {
  assert.ok(condition, message);
  console.log(`PASS: ${message}`);
}

function near(a: number, b: number, tolerance = 2e-4): boolean {
  return Math.abs(a - b) <= tolerance;
}

function segmentsForLayout(scene: ReturnType<typeof compileCanonicalToScene>, layoutId: string) {
  const refs = scene.manifest.chunks.filter((chunk) => chunk.layoutId === layoutId);
  const segments: Array<{ layer: string; a: [number, number]; b: [number, number]; color: number[] }> = [];
  for (const ref of refs) {
    const parsed = parseSceneChunk(scene.chunks.get(ref.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    const meta = JSON.parse(new TextDecoder().decode(parsed.sections.get(SceneTag.META)!.data as Uint8Array));
    for (const command of meta.drawCommands as Array<{ kind: string; layer: string; firstVertex: number; vertexCount: number; color: number[] }>) {
      if (command.kind !== "line") continue;
      for (let offset = 0; offset < command.vertexCount; offset += 2) {
        const index = (command.firstVertex + offset) * 2;
        segments.push({
          layer: command.layer,
          a: [xy[index] + origin[0], xy[index + 1] + origin[1]],
          b: [xy[index + 2] + origin[0], xy[index + 3] + origin[1]],
          color: command.color,
        });
      }
    }
  }
  return segments;
}

function hasSegment(
  segments: ReturnType<typeof segmentsForLayout>,
  layer: string,
  a: [number, number],
  b: [number, number]
): boolean {
  return segments.some((segment) => segment.layer === layer && (
    (near(segment.a[0], a[0]) && near(segment.a[1], a[1]) && near(segment.b[0], b[0]) && near(segment.b[1], b[1])) ||
    (near(segment.a[0], b[0]) && near(segment.a[1], b[1]) && near(segment.b[0], a[0]) && near(segment.b[1], a[1]))
  ));
}

const layers = {
  WALL: { id: "WALL", name: "WALL", visible: true, frozen: false, locked: false, color: { method: "rgb" as const, rgb: [180, 190, 200] as [number, number, number] }, lineweightMm: 0.5, linetypeName: "Continuous" },
  POWER: { id: "POWER", name: "POWER", visible: true, frozen: false, locked: false, color: { method: "rgb" as const, rgb: [20, 30, 40] as [number, number, number] }, lineweightMm: 0.25, linetypeName: "Continuous" },
};

const modelEntities: CadEntity[] = [
  { handle: "W1", type: "LINE", layer: "WALL", order: 1n, start: [-10, 0], end: [10, 0] },
  { handle: "P1", type: "LINE", layer: "POWER", order: 2n, start: [0, -10], end: [0, 10] },
  { handle: "X1", type: "INSERT", layer: "0", order: 3n, blockName: "SITE_XREF", insertionPoint: [100, 100], scale: [1, 1, 1], rotationRad: 0 },
];

const document: CadCanonicalDocument = {
  sourceVersionKey: "f06-layout-render-fixture",
  sourceSha256: "f06-layout-render-fixture",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  units: 4,
  measurement: 1,
  layers,
  linetypes: {},
  textStyles: {},
  blocks: {
    SITE_XREF: { name: "SITE_XREF", basePoint: [0, 0], entities: [], isXref: true, xrefPath: "site-base.dwg" },
  },
  layouts: {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-20, -20, 20, 20], tabOrder: 0 },
    SHEET_A: { id: "SHEET_A", name: "SHEET_A", isModelSpace: false, bbox: [0, 0, 100, 100], tabOrder: 1 },
    SHEET_B: { id: "SHEET_B", name: "SHEET_B", isModelSpace: false, bbox: [200, 0, 300, 100], tabOrder: 2 },
  },
  viewports: {
    VP_A: { id: "VP_A", layoutId: "SHEET_A", center: [50, 50], width: 20, height: 20, viewCenter: [0, 0], viewHeight: 20, frozenLayers: ["POWER"], clipPolygon: [[45, 45], [55, 45], [55, 55], [45, 55]] },
    VP_B: { id: "VP_B", layoutId: "SHEET_B", center: [250, 50], width: 40, height: 40, viewCenter: [0, 0], viewHeight: 20, twistAngleRad: Math.PI / 2, frozenLayers: [], clipPolygon: [[245, 35], [255, 35], [255, 65], [245, 65]], layerOverrides: { POWER: { color: { method: "rgb", rgb: [255, 0, 180] }, lineweightMm: 0.7 } } },
  },
  modelSpaceEntities: modelEntities,
  paperSpaceEntities: {
    SHEET_A: [{ handle: "PA", type: "LINE", layer: "WALL", order: 10n, start: [2, 2], end: [8, 2] }],
    SHEET_B: [{ handle: "PB", type: "LINE", layer: "WALL", order: 11n, start: [202, 2], end: [208, 2] }],
  },
  diagnostics: [],
};

console.log("=== F06 layout/viewport compiler→renderer acceptance ===");
const scene = compileCanonicalToScene(document, { sceneId: "scene_f06_layout_viewport_render_acceptance" });
const model = segmentsForLayout(scene, "Model");
const sheetA = segmentsForLayout(scene, "SHEET_A");
const sheetB = segmentsForLayout(scene, "SHEET_B");

check(scene.manifest.layouts.map((layout) => layout.layoutId).join(",") === "Model,SHEET_A,SHEET_B", "Tek kaynak doküman üç bağımsız Model/Paper layout üretir");
check(hasSegment(model, "WALL", [-10, 0], [10, 0]) && hasSegment(model, "POWER", [0, -10], [0, 10]), "Aynı model içeriği Model layout'unda değiştirilmeden kalır");
check(hasSegment(sheetA, "WALL", [45, 50], [55, 50]), "SHEET_A aynı model duvarını paper koordinatına taşıyıp polygon içinde kırpar");
check(!sheetA.some((segment) => segment.layer === "POWER"), "SHEET_A viewport-frozen POWER katmanını dışlar");
check(hasSegment(sheetB, "WALL", [250, 35], [250, 65]), "SHEET_B döndürülmüş viewport ve polygon clip ile aynı duvar modelini farklı projekte eder");
check(hasSegment(sheetB, "POWER", [245, 50], [255, 50]), "SHEET_B aynı POWER modelini döndürülmüş koordinatlarda ayrı görünür tutar");
const powerB = sheetB.find((segment) => segment.layer === "POWER" && near(segment.a[1], 50))!;
check(powerB.color.every((value, index) => near(value, [1, 0, 180 / 255][index])), "Viewport-specific POWER color override draw command'a ulaşır");
check(scene.manifest.qualityStatus === "degraded" && scene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNRESOLVED_XREF"), "Eksik XREF sahneyi kullanılabilir bırakırken quality durumunu degraded yapar");
check(sheetA.length > 0 && sheetB.length > 0, "XREF eksikliği yerel paper geometry ve viewport modelini silmez");

const visibilityCamera: CadCameraState = {
  worldOrigin: [0, 0], center: [150, 50], unitsPerCssPixel: 1, width: 1000, height: 1000,
};
check(JSON.stringify(getCameraWorldViewportBBox(visibilityCamera)) === JSON.stringify([-351, -451, 651, 551]),
  "Kamera CSS viewport'u 1 px güven payıyla dünya bbox'ına dönüşür");
check(isChunkVisibleInCamera([-10, -10, 10, 10], { ...visibilityCamera, center: [0, 0], width: 20, height: 20 }),
  "Kamera sınırına taşan chunk görünür kalır");
check(!isChunkVisibleInCamera([1000, 1000, 1010, 1010], { ...visibilityCamera, center: [0, 0], width: 20, height: 20 }),
  "Viewport dışındaki uzak chunk culling ile elenir");
check(isChunkVisibleInCamera(undefined, { ...visibilityCamera, center: [0, 0], width: 20, height: 20 }),
  "Boundsız legacy chunk fail-open görünür kalır");

// Exercise the production layout switch method without constructing WebGL.
// It only needs the actual renderer's chunk groups and invalidation callback.
const renderer = Object.create(CadV2Renderer.prototype) as any;
let invalidations = 0;
renderer.activeLayoutId = "Model";
renderer.loadedChunks = new Map<string, { group: { userData: { layoutId: string }; visible: boolean } }>();
renderer.chunkBounds = new Map();
renderer.cameraAdapter = { getState: () => visibilityCamera };
for (const chunk of scene.manifest.chunks) {
  renderer.loadedChunks.set(chunk.chunkId, { group: { userData: { layoutId: chunk.layoutId }, visible: chunk.layoutId === "Model" } });
}
renderer.invalidate = () => { invalidations++; };
renderer.setChunkBounds(scene.manifest.chunks);
invalidations = 0;
renderer.setActiveLayout("SHEET_B");
check(renderer.getActiveLayout() === "SHEET_B", "Renderer pafta seçiminde active layout kimliğini günceller");
check([...renderer.loadedChunks.values()].every((chunk: any) => chunk.group.visible === (chunk.group.userData.layoutId === "SHEET_B")), "Renderer yalnız seçili paftanın scene chunk'larını görünür tutar");
renderer.setActiveLayout("SHEET_A");
check([...renderer.loadedChunks.values()].every((chunk: any) => chunk.group.visible === (chunk.group.userData.layoutId === "SHEET_A")), "Layout değişimi önceki layout görünürlüğünü tamamen kapatır");
check(invalidations === 2, "Her layout değişimi render invalidation üretir");

visibilityCamera.center = [0, 0];
visibilityCamera.width = 20;
visibilityCamera.height = 20;
renderer.setActiveLayout("Model");
check([...renderer.loadedChunks.values()].every((chunk: any) => chunk.group.visible === (chunk.group.userData.layoutId === "Model")),
  "Renderer manifest bbox ve aktif kamera kesişimine göre Model chunk'larını culler");
visibilityCamera.center = [50, 50];
renderer.updateChunkVisibility(visibilityCamera);
check([...renderer.loadedChunks.values()].filter((chunk: any) => chunk.group.userData.layoutId === "Model").every((chunk: any) => !chunk.group.visible),
  "Pan kamera callback'i aynı layout'un önceki görünüm dışı chunk'ını kapatır");
renderer.setActiveLayout("SHEET_A");
check([...renderer.loadedChunks.values()].every((chunk: any) => chunk.group.visible === (chunk.group.userData.layoutId === "SHEET_A")),
  "Pan sonrası aynı layout'un chunk görünürlüğü kamera ile güncellenir");
visibilityCamera.center = [250, 50];
renderer.setActiveLayout("SHEET_B");
check([...renderer.loadedChunks.values()].every((chunk: any) => chunk.group.visible === (chunk.group.userData.layoutId === "SHEET_B")),
  "Renderer pafta görünürlüğü ile spatial culling'i birlikte uygular");

console.log("=== F06 layout/viewport acceptance PASS ===");
