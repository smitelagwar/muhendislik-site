import assert from "node:assert/strict";
import { CadV2Renderer } from "../../src/lib/cad-v2/render/cad-v2-renderer";
import { PendingCameraChange } from "../../src/lib/cad-v2/render/pending-camera-change";

const queue = new PendingCameraChange<{ center: [number, number] }>();
const applied: Array<{ center: [number, number] }> = [];

queue.enqueue({ center: [1, 1] });
queue.enqueue({ center: [2, 2] });
queue.enqueue({ center: [3, 3] });

assert.equal(queue.flush((change) => applied.push(change)), true);
assert.deepEqual(applied, [{ center: [3, 3] }], "a frame should apply only the latest queued camera state");
assert.equal(queue.flush((change) => applied.push(change)), false, "an empty camera queue should not schedule redundant work");

queue.enqueue({ center: [4, 4] });
assert.equal(queue.flush((change) => applied.push(change)), true);
assert.deepEqual(applied, [{ center: [3, 3] }, { center: [4, 4] }], "camera updates after a flush should be retained");

const renderer = Object.create(CadV2Renderer.prototype) as any;
const renderTrace: string[] = [];
const latestCamera = { center: [8, 9] as [number, number] };
renderer.rafId = 123;
renderer.isDisposed = false;
renderer.isDirty = true;
renderer.pendingCameraChange = new PendingCameraChange();
renderer.pendingCameraChange.enqueue({ center: [6, 7] });
renderer.pendingCameraChange.enqueue(latestCamera);
renderer.canvas = { getContext: () => ({ isContextLost: () => false }) };
renderer.renderedFrameGate = { isUnavailable: () => false, markFrameRendered: () => renderTrace.push("frame-ready") };
renderer.renderer = { render: () => renderTrace.push("render") };
renderer.scene = {};
renderer.camera = {};
renderer.updateCameraRelativeOffset = (center: [number, number]) => renderTrace.push(`offset:${center.join(",")}`);
renderer.updateChunkVisibility = (camera: typeof latestCamera) => renderTrace.push(`visibility:${camera.center.join(",")}`);

renderer.renderFrame();
assert.deepEqual(renderTrace, ["offset:8,9", "visibility:8,9", "render", "frame-ready"],
  "the production render frame should apply the latest camera update once before drawing");

console.log("PASS: camera state updates coalesce to the latest state per rendered frame");
