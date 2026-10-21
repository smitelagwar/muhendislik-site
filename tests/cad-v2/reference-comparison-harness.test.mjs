import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PNG } from "pngjs";
import { compareProfiles } from "../../scripts/cad-v2/compare-reference-profiles.mjs";

const SOURCE_SHA = "a".repeat(64);
const PROFILE = {
  viewId: "Model",
  viewportCss: { width: 64, height: 64 },
  deviceScaleFactor: 1,
  worldRect: [0, 0, 64, 64],
  backgroundRgb: [0, 0, 0],
  foregroundThresholdRgb: 20,
  visualProfile: {
    units: "unitless-test",
    ucs: "WCS",
    layerVisibilitySha256: "b".repeat(64),
    lineTypeScale: 1,
    lineweight: false,
    fontDigest: "synthetic-only",
  },
  limits: {
    cameraCssPx: 0.25,
    geometryCssPx: 0.25,
    rasterEdgeP95CssPx: 1.25,
    criticalRoiEdgeMaxCssPx: 1.25,
  },
};

function image(withCriticalLine, withStaticMarks = true) {
  const png = new PNG({ width: 64, height: 64, colorType: 6 });
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      png.data[offset] = 0;
      png.data[offset + 1] = 0;
      png.data[offset + 2] = 0;
      png.data[offset + 3] = 255;
      const diagonal = withCriticalLine && x >= 8 && x <= 28 && y === x;
      const worldY = 64 - y;
      const staticMark = withStaticMarks && Array.from({ length: 9 }, (_, index) => 6 + index * 6 + 3)
        .some((center) => x === 48 && Math.abs(worldY - center) <= 0.5);
      if (diagonal || staticMark) {
        png.data[offset] = 255;
        png.data[offset + 1] = 255;
        png.data[offset + 2] = 255;
      }
    }
  }
  return PNG.sync.write(png);
}

function manifests() {
  const rois = Array.from({ length: 10 }, (_, index) => ({
    id: `ROI-${String(index + 1).padStart(2, "0")}`,
    worldBBox: index === 0 ? [6, 34, 32, 58] : [40, index * 6, 56, (index + 1) * 6],
    critical: true,
    criticalEntityKeys: [`handle:${(index + 1).toString(16).toUpperCase()}`],
    criticalTexts: index === 0 ? [{ key: "DIM-1", text: "2400" }] : [],
  }));
  const base = {
    schemaVersion: 1,
    source: { id: "SYNTHETIC-HARNESS-ONLY", sha256: SOURCE_SHA },
    profile: structuredClone(PROFILE),
    capture: { png: "capture.png" },
    rois,
  };
  return {
    reference: { ...structuredClone(base), native: { name: "synthetic test oracle", build: "test-only" } },
    candidate: { ...structuredClone(base), browser: { name: "synthetic renderer", build: "test-only" } },
  };
}

async function withCaptures(referenceBytes, candidateBytes, run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cad-v2-l06-compare-"));
  try {
    fs.writeFileSync(path.join(directory, "reference.png"), referenceBytes);
    fs.writeFileSync(path.join(directory, "candidate.png"), candidateBytes);
    const { reference, candidate } = manifests();
    reference.capture.png = "reference.png";
    candidate.capture.png = "candidate.png";
    const refPath = path.join(directory, "reference.json");
    const candPath = path.join(directory, "candidate.json");
    fs.writeFileSync(refPath, JSON.stringify(reference));
    fs.writeFileSync(candPath, JSON.stringify(candidate));
    return await run({ reference, candidate, referencePath: refPath, candidatePath: candPath });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("same source, camera, profile and raster pass with ten explicit critical ROIs", async () => {
  const result = await withCaptures(image(true), image(true), compareProfiles);
  assert.equal(result.status, "PASS");
  assert.equal(result.rois.length, 10);
  assert.equal(result.fullView.symmetricEdgeP95CssPx, 0);
  assert.equal(result.goldenMutation.startsWith("none;"), true);
});

test("a missing critical stroke fails even when the rest of the full view matches", async () => {
  const result = await withCaptures(image(true), image(false), compareProfiles);
  assert.equal(result.status, "FAIL");
  assert.ok(result.failures.some((failure) => failure.code === "CRITICAL_ROI_EDGE_DISTANCE" && failure.roiId === "ROI-01"));
  assert.ok(result.rois.find((roi) => roi.id === "ROI-01").missingForegroundPixels > 0);
});

test("two blank captures cannot pass because they have zero raster difference", async () => {
  const result = await withCaptures(image(false, false), image(false, false), compareProfiles);
  assert.equal(result.status, "FAIL");
  assert.ok(result.failures.some((failure) => failure.code === "EMPTY_FULL_VIEW"));
  assert.ok(result.failures.some((failure) => failure.code === "EMPTY_CRITICAL_ROI" && failure.roiId === "ROI-01"));
});

test("critical text values and camera profile mismatches fail without changing thresholds", async () => {
  const result = await withCaptures(image(true), image(true), ({ reference, candidate, referencePath, candidatePath }) => {
    candidate.rois[0].criticalTexts[0].text = "2500";
    candidate.profile.worldRect = [1, 0, 65, 64];
    return compareProfiles({ reference, candidate, referencePath, candidatePath });
  });
  assert.equal(result.status, "FAIL");
  assert.ok(result.failures.some((failure) => failure.code === "CAMERA_PROFILE_MISMATCH"));
  assert.ok(result.failures.some((failure) => failure.code === "CRITICAL_SEMANTIC_LOSS" && failure.roiId === "ROI-01"));
});
