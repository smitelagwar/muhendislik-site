import test from "node:test";
import assert from "node:assert/strict";
import { surfaceUvs } from "./ide-scene-style";

test("brick courses retain physical scale on straight and diagonal walls", () => {
  for (const angle of [0, Math.PI / 4, Math.PI / 2, -Math.PI / 3]) {
    const x = Math.cos(angle) * 2, z = Math.sin(angle) * 2;
    const uv = surfaceUvs([0, 0, 0, x, 0, z, x, 3, z], 0.64, 0.32);
    assert.ok(Math.abs(Math.abs(uv[2] - uv[0]) - 2 / 0.64) < 1e-6);
    assert.ok(Math.abs(uv[5] - uv[3] - 3 / 0.32) < 1e-6);
  }
});

test("surface mapping preserves world phase and horizontal slab scale", () => {
  const uv = surfaceUvs([4, 2, 6, 6, 2, 6, 6, 2, 9], 2, 3);
  assert.deepEqual(Array.from(uv), [2, 2, 3, 2, 3, 3]);
  assert.throws(() => surfaceUvs([0, 0, 0], 1, 1), /Invalid/);
  assert.throws(() => surfaceUvs([], 0, 1), /Invalid/);
});
