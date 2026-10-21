import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

function makeDocument(lines: Array<Partial<CadLineEntity> & Pick<CadLineEntity, "handle" | "order" | "start" | "end">>): CadCanonicalDocument {
  return {
    sourceVersionKey: "r03-direct-line-spatial-v1",
    sourceSha256: "r03-direct-line-spatial-v1",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": {
        id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0.5, linetypeName: "CONTINUOUS",
      },
    },
    linetypes: {
      DASH: { id: "DASH", name: "DASH", pattern: [1000, -500], totalLength: 1500 },
    },
    textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: lines.map((line) => ({
      type: "LINE", layer: "0", ...line,
    } as CadLineEntity)),
  };
}

function readChunks(scene: ReturnType<typeof compileCanonicalToScene>) {
  return scene.manifest.chunks.map((manifestChunk) => {
    const parsed = parseSceneChunk(scene.chunks.get(manifestChunk.chunkId)!);
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const pathDistance = parsed.sections.get(SceneTag.PATH_DISTANCE)!.data as Float32Array;
    const metadataBytes = parsed.sections.get(SceneTag.META)!.data as Uint8Array;
    const meta = JSON.parse(new TextDecoder().decode(metadataBytes)) as {
      drawCommands: Array<{ kind: string; globalOrderIndex?: number; lineweightMm?: number; dashStyle?: { dashSize: number; gapSize: number } }>;
    };
    return { manifestChunk, origin, xy, pathDistance, drawCommands: meta.drawCommands };
  });
}

function reconstructedEndpoints(chunk: ReturnType<typeof readChunks>[number]) {
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 3 < chunk.xy.length; i += 4) {
    points.push(
      [chunk.origin[0]! + chunk.xy[i]!, chunk.origin[1]! + chunk.xy[i + 1]!],
      [chunk.origin[0]! + chunk.xy[i + 2]!, chunk.origin[1]! + chunk.xy[i + 3]!],
    );
  }
  return points;
}

function testContinuousWidthAndPainterOrder() {
  const scene = compileCanonicalToScene(makeDocument([
    { handle: "LONG", order: 1n, start: [0, 0], end: [12_000, 0], lineweightMm: 4 },
    { handle: "OVERLAY", order: 2n, start: [2, -5], end: [2, 5], lineweightMm: 2 },
  ]), { sceneId: "r03_width_order" });
  assert(scene.manifest.compilerVersion === CAD_V2_COMPILER_REVISION,
    "changed chunk output advertises the active compiler/cache revision");
  const chunks = readChunks(scene);
  const longChunks = chunks.filter((chunk) => chunk.drawCommands.some((cmd) => cmd.globalOrderIndex === 0));
  assert(longChunks.length === 3, `12,000-unit direct LINE is spatially split into ${longChunks.length} chunks`);
  assert(chunks.every(({ manifestChunk }) => Math.max(
    manifestChunk.bbox[2] - manifestChunk.bbox[0], manifestChunk.bbox[3] - manifestChunk.bbox[1],
  ) <= 4096.000001), "spatial chunk bounds include stroke extents and stay within the 4,096-unit span");
  assert(longChunks.some((chunk) => Math.abs(chunk.manifestChunk.bbox[1] + 2) < 1e-5), "lineweight padding expands each split source stroke's lower bound by half the stroke width");
  assert(chunks.some((chunk) => chunk.drawCommands.some((cmd) => cmd.globalOrderIndex === 1)), "interleaved overlay preserves its later source painter order");
  assert(longChunks.every((chunk) => chunk.drawCommands.some((cmd) => cmd.globalOrderIndex === 0)), "every split retains its source entity order identity");

  const pathEndpoints = longChunks.flatMap((chunk) => Array.from(chunk.pathDistance));
  assert(Math.min(...pathEndpoints) === 0 && Math.max(...pathEndpoints) === 12_000, "split direct LINE PATH_DISTANCE still spans the complete source distance");
  const allPoints = longChunks.flatMap(reconstructedEndpoints);
  assert(Math.min(...allPoints.map(([x]) => x)) === 0 && Math.max(...allPoints.map(([x]) => x)) === 12_000, "spatial slices cover the exact source endpoints without dropping geometry");
}

function testDashedLinePhaseAndWidthFallback() {
  const hairline = compileCanonicalToScene(makeDocument([
    { handle: "DASH_HAIRLINE", order: 1n, start: [0, 0], end: [12_000, 0], linetype: "DASH", lineweightMm: 0 },
  ]), { sceneId: "r03_dash_phase" });
  const hairlineChunks = readChunks(hairline);
  assert(hairlineChunks.length === 3, "shader-dashed direct LINE uses three spatial chunks");
  assert(hairlineChunks.every((chunk) => chunk.drawCommands.some((cmd) => cmd.dashStyle?.dashSize === 1000 && cmd.dashStyle.gapSize === 500)), "shader dash style survives spatial slicing");
  assert(Math.abs(hairlineChunks[0]!.pathDistance.at(-1)! - hairlineChunks[1]!.pathDistance[0]!) < 0.01, "PATH_DISTANCE phase is continuous across the first chunk boundary");
  assert(Math.abs(hairlineChunks[1]!.pathDistance.at(-1)! - hairlineChunks[2]!.pathDistance[0]!) < 0.01, "PATH_DISTANCE phase is continuous across the second chunk boundary");

  const thickDashed = compileCanonicalToScene(makeDocument([
    { handle: "DASH_THICK", order: 1n, start: [0, 0], end: [12_000, 0], linetype: "DASH", lineweightMm: 4 },
  ]), { sceneId: "r03_dash_width" });
  const thickChunks = readChunks(thickDashed);
  assert(thickChunks.length > 1, "thick tessellated dashed direct LINE is spatially divided");
  assert(thickChunks.every((chunk) => Math.max(
    chunk.manifestChunk.bbox[2] - chunk.manifestChunk.bbox[0],
    chunk.manifestChunk.bbox[3] - chunk.manifestChunk.bbox[1],
  ) <= 4096.000001), "thick dashed chunk bounds include stroke width and remain spatially bounded");
  assert(Math.max(...thickChunks.flatMap((chunk) => Array.from(chunk.pathDistance))) > 10_000, "tessellated dashed fallback preserves source path distance rather than restarting dash phase per chunk");
}

function testHighOriginAndPartitionCap() {
  const highOrigin = compileCanonicalToScene(makeDocument([
    { handle: "HIGH", order: 1n, start: [1_000_000_000, 1_000_000_000], end: [1_000_012_000, 1_000_003_000], lineweightMm: 1 },
  ]), { sceneId: "r03_high_origin" });
  const highChunks = readChunks(highOrigin);
  assert(highChunks.length === 3, "high-origin direct LINE keeps three bounded chunks");
  assert(highChunks.every((chunk) => Math.max(
    chunk.manifestChunk.bbox[2] - chunk.manifestChunk.bbox[0],
    chunk.manifestChunk.bbox[3] - chunk.manifestChunk.bbox[1],
  ) <= 4096.000001), "high-origin chunk bboxes use local spatial extents");
  const aggregateBBox = [
    Math.min(...highChunks.map((chunk) => chunk.manifestChunk.bbox[0])),
    Math.min(...highChunks.map((chunk) => chunk.manifestChunk.bbox[1])),
    Math.max(...highChunks.map((chunk) => chunk.manifestChunk.bbox[2])),
    Math.max(...highChunks.map((chunk) => chunk.manifestChunk.bbox[3])),
  ];
  assert(JSON.stringify(aggregateBBox) === JSON.stringify([999_999_999.5, 999_999_999.5, 1_000_012_000.5, 1_000_003_000.5]), "high-origin chunk bboxes reconstruct the source extents plus lineweight padding");
  assert(highChunks.every((chunk) => chunk.origin[0]! > 1_000_000_000 && Math.max(...Array.from(chunk.xy).map(Math.abs)) < 3_000), "high-origin encoding stores small Float32 coordinates around Float64 chunk origins");
  const recovered = highChunks.flatMap(reconstructedEndpoints);
  assert(Math.abs(Math.min(...recovered.map(([x]) => x)) - 1_000_000_000) < 1e-5, "high-origin source start is reconstructed");
  assert(Math.abs(Math.max(...recovered.map(([x]) => x)) - 1_000_012_000) < 1e-5, "high-origin source end is reconstructed");

  const overLimit = compileCanonicalToScene(makeDocument([
    { handle: "OVER_LIMIT", order: 1n, start: [0, 0], end: [1_100_000, 0] },
  ]), { sceneId: "r03_partition_cap" });
  assert(overLimit.manifest.chunks.length <= 256, "a line beyond the slice cap does not create an unbounded chunk count");
  assert(overLimit.manifest.qualityStatus === "degraded", "slice-cap fallback is reported as degraded");
  assert(overLimit.manifest.diagnosticsSummary.diagnosticCodes.includes("DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED"), "slice-cap fallback exposes its partial contract diagnostic");
  const retained = readChunks(overLimit).flatMap(reconstructedEndpoints);
  assert(Math.min(...retained.map(([x]) => x)) === 0 && Math.max(...retained.map(([x]) => x)) === 1_100_000, "slice-cap fallback retains the whole source line");
}

testContinuousWidthAndPainterOrder();
testDashedLinePhaseAndWidthFallback();
testHighOriginAndPartitionCap();
console.log("PASS: R03 direct LINE spatial slicing, width, dash phase, order, origin and cap contract");
