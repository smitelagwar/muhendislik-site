import assert from "node:assert/strict";
import { supportsCadV2MultiDraw } from "../../src/lib/cad-v2/render/multi-draw-capability";

function makeContext(extensions: string[] | null) {
  const calls: string[] = [];
  const directExtensionCalls: string[] = [];
  const context = {
    getSupportedExtensions() {
      calls.push("getSupportedExtensions");
      return extensions;
    },
    getExtension(name: string) {
      directExtensionCalls.push(name);
      return extensions?.includes(name) ? { multiDrawArraysWEBGL() {} } : null;
    },
  } as unknown as WebGL2RenderingContext;
  return { context, calls, directExtensionCalls };
}

(async () => {
  const supportedContext = makeContext(["WEBGL_multi_draw"]);
  for (let index = 0; index < 19_531; index++) {
    assert.equal(supportsCadV2MultiDraw(supportedContext.context), true,
      "supported WebGL context remains eligible for multi-draw batching");
  }
  assert.deepEqual(supportedContext.calls, ["getSupportedExtensions"],
    "large scenes read the supported extension list once per context rather than once per chunk");
  assert.deepEqual(supportedContext.directExtensionCalls, [],
    "CAD capability detection leaves the renderer-owned getExtension cache intact");

  const duplicateBundle = await import("../../src/lib/cad-v2/render/multi-draw-capability.ts?bundle-copy=2");
  const bundleSharedContext = makeContext(["WEBGL_multi_draw"]);
  assert.equal(supportsCadV2MultiDraw(bundleSharedContext.context), true,
    "first bundled renderer copy sees the supported capability");
  assert.equal(duplicateBundle.supportsCadV2MultiDraw(bundleSharedContext.context), true,
    "a second bundled renderer copy sees the same supported capability");
  assert.deepEqual(bundleSharedContext.calls, ["getSupportedExtensions"],
    "separately bundled renderer copies share one supported-extension lookup per WebGL context");
  assert.deepEqual(bundleSharedContext.directExtensionCalls, [],
    "separately bundled CAD copies do not bypass the renderer's getExtension cache");

  const unsupportedContext = makeContext([]);
  assert.equal(supportsCadV2MultiDraw(unsupportedContext.context), false,
    "unsupported WebGL context uses the established fallback renderer");
  assert.equal(supportsCadV2MultiDraw(unsupportedContext.context), false,
    "unsupported capability decisions are cached too");
  assert.deepEqual(unsupportedContext.calls, ["getSupportedExtensions"],
    "a missing extension list is inspected only once per context");
  assert.deepEqual(unsupportedContext.directExtensionCalls, [],
    "unsupported contexts still avoid a direct duplicate getExtension query");

  assert.notEqual(supportedContext.context, unsupportedContext.context,
    "capability decisions are isolated between WebGL contexts");
  console.log("multi-draw-capability: PASS (19,531 chunk probes and duplicated bundles share one supported-extension lookup per context)");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
