import assert from "node:assert/strict";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

for (const lineweightMm of [0.13, 0.25, 0.5, 1]) {
  const doc: CadCanonicalDocument = {
    sourceVersionKey: `wide-dash-${lineweightMm}`, sourceSha256: `wide-dash-${lineweightMm}`,
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm, linetypeName: "DASH" } },
    linetypes: { DASH: { id: "DASH", name: "DASH", pattern: [24, -16], totalLength: 40 } },
    textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
    diagnostics: [], modelSpaceEntities: [{ type: "LINE", handle: "WIDE", layer: "0",
      linetype: "DASH", linetypeScale: 2, lineweightMm, start: [0, 0], end: [184, 0],
      order: BigInt(1) }],
  };
  function decode(maxPrimitivesPerChunk?: number) {
    const scene = compileCanonicalToScene(doc, {
      sceneId: `wide_dash_${lineweightMm}_${maxPrimitivesPerChunk ?? "single"}`,
      maxPrimitivesPerChunk,
    });
    return scene.manifest.chunks.flatMap((ref) => {
      const sections = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections;
      const path = sections.get(SceneTag.PATH_DISTANCE)?.data as Float32Array;
      const meta = JSON.parse(new TextDecoder().decode(sections.get(SceneTag.META)!.data as Uint8Array)) as {
        drawCommands: Array<{ kind: string; lineweightMm: number; dashStyle?: unknown }>;
      };
      assert.ok(meta.drawCommands.every((command) => command.kind === "line" &&
        command.lineweightMm === lineweightMm && command.dashStyle === undefined));
      return Array.from(path);
    });
  }
  const expected = [0, 48, 80, 128, 160, 184];
  assert.deepEqual(decode(), expected, `${lineweightMm} mm follows entity scale 2 and CPU dash phase`);
  assert.deepEqual(decode(1), expected, `${lineweightMm} mm phase survives primitive chunk boundaries`);
}
console.log("PASS: four source lineweights, scale 2, CPU dash phase and binary chunk parity");
