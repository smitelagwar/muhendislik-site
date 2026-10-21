import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { fileURLToPath } from "node:url";

const ACCEPTANCE_LIMITS = Object.freeze({
  cameraCssPx: 0.25,
  geometryCssPx: 0.25,
  rasterEdgeP95CssPx: 1.25,
  criticalRoiEdgeMaxCssPx: 1.25,
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function finiteTuple(value, length, label) {
  if (!Array.isArray(value) || value.length !== length || value.some((item) => !Number.isFinite(item))) {
    throw new Error(`${label} must contain ${length} finite numbers`);
  }
}

function validateManifest(manifest, label) {
  if (!manifest || manifest.schemaVersion !== 1) throw new Error(`${label}: unsupported manifest schema`);
  if (!manifest.source?.id || !/^[0-9a-f]{64}$/.test(manifest.source.sha256 ?? "")) {
    throw new Error(`${label}: source id and exact lowercase SHA-256 are required`);
  }
  if (label === "reference" && (!manifest.native?.name || !manifest.native?.build)) {
    throw new Error("reference: native program name and exact build are required");
  }
  if (label === "candidate" && (!manifest.browser?.name || !manifest.browser?.build)) {
    throw new Error("candidate: browser renderer and exact build are required");
  }
  const profile = manifest.profile;
  if (!profile?.viewId || !profile.visualProfile || !profile.limits) throw new Error(`${label}: incomplete view profile`);
  if (!Number.isInteger(profile.viewportCss?.width) || !Number.isInteger(profile.viewportCss?.height) ||
      profile.viewportCss.width <= 0 || profile.viewportCss.height <= 0 ||
      !Number.isFinite(profile.deviceScaleFactor) || profile.deviceScaleFactor <= 0) {
    throw new Error(`${label}: viewport size and deviceScaleFactor are required`);
  }
  finiteTuple(profile.worldRect, 4, `${label}.profile.worldRect`);
  finiteTuple(profile.backgroundRgb, 3, `${label}.profile.backgroundRgb`);
  const [minX, minY, maxX, maxY] = profile.worldRect;
  if (!(minX < maxX && minY < maxY)) throw new Error(`${label}: worldRect must have positive area`);
  if (canonical(profile.limits) !== canonical(ACCEPTANCE_LIMITS)) {
    throw new Error(`${label}: tolerances must remain at the L06 plan limits`);
  }
  if (!manifest.capture?.png || !Array.isArray(manifest.rois) || manifest.rois.length < 10) {
    throw new Error(`${label}: a PNG capture and at least 10 semantic ROIs are required`);
  }
  const roiIds = new Set();
  for (const roi of manifest.rois) {
    if (!roi?.id || roiIds.has(roi.id)) throw new Error(`${label}: ROI ids must be present and unique`);
    roiIds.add(roi.id);
    finiteTuple(roi.worldBBox, 4, `${label}.${roi.id}.worldBBox`);
    const [x1, y1, x2, y2] = roi.worldBBox;
    if (!(x1 < x2 && y1 < y2)) throw new Error(`${label}.${roi.id}: worldBBox must have positive area`);
    if (x1 < minX || y1 < minY || x2 > maxX || y2 > maxY) {
      throw new Error(`${label}.${roi.id}: worldBBox must be inside the captured camera rect`);
    }
    if (roi.critical && (!Array.isArray(roi.criticalEntityKeys) || roi.criticalEntityKeys.length === 0)) {
      throw new Error(`${label}.${roi.id}: critical ROI needs native entity identities`);
    }
    if (!Array.isArray(roi.criticalTexts ?? [])) throw new Error(`${label}.${roi.id}: criticalTexts must be an array`);
  }
  return { profile, roiIds };
}

function readPng(manifestPath, capturePath, label) {
  const filename = path.resolve(path.dirname(manifestPath), capturePath);
  const stat = fs.statSync(filename);
  if (stat.size === 0 || stat.size > 128 * 1024 * 1024) throw new Error(`${label}: PNG size is outside 1..128 MiB`);
  const image = PNG.sync.read(fs.readFileSync(filename), { checkCRC: true });
  return { image, filename };
}

function cameraRegistration(reference, candidate) {
  const ref = reference.profile;
  const cand = candidate.profile;
  const widthCss = ref.viewportCss.width;
  const heightCss = ref.viewportCss.height;
  const [rx1, ry1, rx2, ry2] = ref.worldRect;
  const [cx1, cy1, cx2, cy2] = cand.worldRect;
  const refScaleX = widthCss / (rx2 - rx1);
  const candScaleX = widthCss / (cx2 - cx1);
  const refScaleY = heightCss / (ry2 - ry1);
  const candScaleY = heightCss / (cy2 - cy1);
  const centerXCss = Math.abs((rx1 + rx2 - cx1 - cx2) / 2) * refScaleX;
  const centerYCss = Math.abs((ry1 + ry2 - cy1 - cy2) / 2) * refScaleY;
  const scaleXCss = Math.abs(refScaleX - candScaleX) * ((rx2 - rx1) / 2);
  const scaleYCss = Math.abs(refScaleY - candScaleY) * ((ry2 - ry1) / 2);
  return {
    centerErrorCssPx: Math.max(centerXCss, centerYCss),
    scaleErrorCssPx: Math.max(scaleXCss, scaleYCss),
    maximumCameraErrorCssPx: Math.max(centerXCss + scaleXCss, centerYCss + scaleYCss),
    registration: "global camera translation/scale only; no elastic warp",
  };
}

function alignCandidateToReference(referenceImage, candidateImage, referenceProfile, candidateProfile) {
  const output = Buffer.alloc(referenceImage.data.length);
  const [rx1, ry1, rx2, ry2] = referenceProfile.worldRect;
  const [cx1, cy1, cx2, cy2] = candidateProfile.worldRect;
  const refWidth = rx2 - rx1;
  const refHeight = ry2 - ry1;
  const candWidth = cx2 - cx1;
  const candHeight = cy2 - cy1;
  const [bgR, bgG, bgB] = candidateProfile.backgroundRgb;

  for (let y = 0; y < referenceImage.height; y += 1) {
    const worldY = ry2 - ((y + 0.5) / referenceImage.height) * refHeight;
    const sourceY = Math.floor(((cy2 - worldY) / candHeight) * candidateImage.height);
    for (let x = 0; x < referenceImage.width; x += 1) {
      const worldX = rx1 + ((x + 0.5) / referenceImage.width) * refWidth;
      const sourceX = Math.floor(((worldX - cx1) / candWidth) * candidateImage.width);
      const outputOffset = (y * referenceImage.width + x) * 4;
      if (sourceX < 0 || sourceY < 0 || sourceX >= candidateImage.width || sourceY >= candidateImage.height) {
        output[outputOffset] = bgR;
        output[outputOffset + 1] = bgG;
        output[outputOffset + 2] = bgB;
        output[outputOffset + 3] = 255;
      } else {
        const sourceOffset = (sourceY * candidateImage.width + sourceX) * 4;
        candidateImage.data.copy(output, outputOffset, sourceOffset, sourceOffset + 4);
      }
    }
  }
  return output;
}

function makeMask(data, width, height, backgroundRgb, thresholdRgb) {
  const mask = new Uint8Array(width * height);
  const [br, bg, bb] = backgroundRgb;
  for (let pixel = 0; pixel < mask.length; pixel += 1) {
    const offset = pixel * 4;
    const alpha = data[offset + 3];
    const distance = Math.max(Math.abs(data[offset] - br), Math.abs(data[offset + 1] - bg), Math.abs(data[offset + 2] - bb));
    mask[pixel] = alpha > 0 && distance > thresholdRgb ? 1 : 0;
  }
  return mask;
}

function edgesOf(mask, width, height) {
  const edge = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!mask[index]) continue;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
          !mask[index - 1] || !mask[index + 1] || !mask[index - width] || !mask[index + width]) {
        edge[index] = 1;
      }
    }
  }
  return edge;
}

function distanceTransform(edge, width, height) {
  const diagonal = Math.SQRT2;
  const distance = new Float32Array(edge.length);
  for (let i = 0; i < edge.length; i += 1) distance[i] = edge[i] ? 0 : Number.POSITIVE_INFINITY;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      let d = distance[i];
      if (x > 0) d = Math.min(d, distance[i - 1] + 1);
      if (y > 0) d = Math.min(d, distance[i - width] + 1);
      if (x > 0 && y > 0) d = Math.min(d, distance[i - width - 1] + diagonal);
      if (x + 1 < width && y > 0) d = Math.min(d, distance[i - width + 1] + diagonal);
      distance[i] = d;
    }
  }
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = width - 1; x >= 0; x -= 1) {
      const i = y * width + x;
      let d = distance[i];
      if (x + 1 < width) d = Math.min(d, distance[i + 1] + 1);
      if (y + 1 < height) d = Math.min(d, distance[i + width] + 1);
      if (x + 1 < width && y + 1 < height) d = Math.min(d, distance[i + width + 1] + diagonal);
      if (x > 0 && y + 1 < height) d = Math.min(d, distance[i + width - 1] + diagonal);
      distance[i] = d;
    }
  }
  return distance;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
}

function regionMetrics(referenceMask, candidateMask, width, height, deviceScaleFactor) {
  const referenceEdges = edgesOf(referenceMask, width, height);
  const candidateEdges = edgesOf(candidateMask, width, height);
  let referenceCount = 0;
  let candidateCount = 0;
  let missing = 0;
  let extra = 0;
  for (let i = 0; i < referenceMask.length; i += 1) {
    referenceCount += referenceMask[i];
    candidateCount += candidateMask[i];
    if (referenceMask[i] && !candidateMask[i]) missing += 1;
    if (!referenceMask[i] && candidateMask[i]) extra += 1;
  }
  const distanceToReference = distanceTransform(referenceEdges, width, height);
  const distanceToCandidate = distanceTransform(candidateEdges, width, height);
  const distances = [];
  let maximum = 0;
  let edgeCount = 0;
  for (let i = 0; i < referenceEdges.length; i += 1) {
    if (referenceEdges[i]) {
      const d = distanceToCandidate[i];
      distances.push(d);
      maximum = Math.max(maximum, d);
      edgeCount += 1;
    }
    if (candidateEdges[i]) {
      const d = distanceToReference[i];
      distances.push(d);
      maximum = Math.max(maximum, d);
      edgeCount += 1;
    }
  }
  distances.sort((a, b) => a - b);
  const px = (value) => Number.isFinite(value) ? Number((value / deviceScaleFactor).toFixed(4)) : null;
  return {
    referenceForegroundPixels: referenceCount,
    candidateForegroundPixels: candidateCount,
    missingForegroundPixels: missing,
    extraForegroundPixels: extra,
    symmetricEdgeP95CssPx: px(percentile(distances, 0.95)),
    symmetricEdgeMaxCssPx: edgeCount === 0 ? 0 : px(maximum),
    unboundedEdgeDistance: distances.some((distance) => !Number.isFinite(distance)),
    edgeCount,
  };
}

function roiPixelBounds(roi, profile, width, height) {
  const [xmin, ymin, xmax, ymax] = profile.worldRect;
  const [rx1, ry1, rx2, ry2] = roi.worldBBox;
  const x1 = Math.max(0, Math.floor(((rx1 - xmin) / (xmax - xmin)) * width));
  const x2 = Math.min(width, Math.ceil(((rx2 - xmin) / (xmax - xmin)) * width));
  const y1 = Math.max(0, Math.floor(((ymax - ry2) / (ymax - ymin)) * height));
  const y2 = Math.min(height, Math.ceil(((ymax - ry1) / (ymax - ymin)) * height));
  return { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) };
}

function cropMask(mask, fullWidth, bounds) {
  const output = new Uint8Array(bounds.width * bounds.height);
  for (let y = 0; y < bounds.height; y += 1) {
    const start = (bounds.y + y) * fullWidth + bounds.x;
    output.set(mask.subarray(start, start + bounds.width), y * bounds.width);
  }
  return output;
}

function sortedStrings(values) {
  return [...new Set(values ?? [])].map(String).sort();
}

export function compareProfiles({ reference, candidate, referencePath, candidatePath }) {
  const result = {
    schemaVersion: 1,
    status: "FAIL",
    source: reference.source,
    failures: [],
    camera: null,
    fullView: null,
    rois: [],
    native: reference.native ?? null,
    browser: candidate.browser ?? null,
  };
  const refInfo = validateManifest(reference, "reference");
  const candInfo = validateManifest(candidate, "candidate");
  if (reference.source.sha256 !== candidate.source.sha256 || reference.source.id !== candidate.source.id) {
    result.failures.push({ code: "SOURCE_IDENTITY_MISMATCH", message: "Native and browser captures must use the same source bytes." });
  }
  const refProfile = refInfo.profile;
  const candProfile = candInfo.profile;
  if (canonical({ ...refProfile, worldRect: undefined }) !== canonical({ ...candProfile, worldRect: undefined })) {
    result.failures.push({ code: "VIEW_PROFILE_MISMATCH", message: "Viewport, visual, units, UCS, layer, font and limit profiles must match." });
  }
  if (canonical([...refInfo.roiIds].sort()) !== canonical([...candInfo.roiIds].sort())) {
    result.failures.push({ code: "ROI_SET_MISMATCH", message: "Reference and browser captures must use the same ROI set." });
  }
  result.camera = cameraRegistration(refInfo, candInfo);
  if (result.camera.maximumCameraErrorCssPx > ACCEPTANCE_LIMITS.cameraCssPx) {
    result.failures.push({ code: "CAMERA_PROFILE_MISMATCH", message: `Camera registration error exceeds ${ACCEPTANCE_LIMITS.cameraCssPx} CSS px.` });
  }

  const { image: refImage, filename: refFilename } = readPng(referencePath, reference.capture.png, "reference");
  const { image: candImage, filename: candFilename } = readPng(candidatePath, candidate.capture.png, "candidate");
  const expectedWidth = Math.round(refProfile.viewportCss.width * refProfile.deviceScaleFactor);
  const expectedHeight = Math.round(refProfile.viewportCss.height * refProfile.deviceScaleFactor);
  if (refImage.width !== expectedWidth || refImage.height !== expectedHeight ||
      candImage.width !== expectedWidth || candImage.height !== expectedHeight) {
    result.failures.push({ code: "IMAGE_DIMENSION_MISMATCH", message: "PNG dimensions must equal viewport CSS size × deviceScaleFactor." });
  }
  if (refImage.width !== candImage.width || refImage.height !== candImage.height) {
    result.failures.push({ code: "IMAGE_DIMENSION_MISMATCH", message: "Native and browser PNG dimensions differ." });
  }
  result.captures = {
    reference: { path: refFilename, width: refImage.width, height: refImage.height },
    candidate: { path: candFilename, width: candImage.width, height: candImage.height },
  };
  if (result.failures.some((failure) => failure.code === "IMAGE_DIMENSION_MISMATCH")) return result;

  const alignedCandidate = alignCandidateToReference(refImage, candImage, refProfile, candProfile);
  const threshold = refProfile.foregroundThresholdRgb ?? 20;
  const referenceMask = makeMask(refImage.data, refImage.width, refImage.height, refProfile.backgroundRgb, threshold);
  const candidateMask = makeMask(alignedCandidate, refImage.width, refImage.height, refProfile.backgroundRgb, threshold);
  result.fullView = regionMetrics(referenceMask, candidateMask, refImage.width, refImage.height, refProfile.deviceScaleFactor);
  if (result.fullView.referenceForegroundPixels === 0 || result.fullView.candidateForegroundPixels === 0) {
    result.failures.push({ code: "EMPTY_FULL_VIEW", message: "A blank native or browser full-view capture cannot pass." });
  }
  if (result.fullView.unboundedEdgeDistance || result.fullView.symmetricEdgeP95CssPx > ACCEPTANCE_LIMITS.rasterEdgeP95CssPx) {
    result.failures.push({ code: "FULL_VIEW_EDGE_DISTANCE", message: "Full view symmetric edge-distance P95 exceeds 1.25 CSS px." });
  }

  const candidateRois = new Map(candidate.rois.map((roi) => [roi.id, roi]));
  for (const refRoi of reference.rois) {
    const candRoi = candidateRois.get(refRoi.id);
    if (!candRoi) continue;
    const refKeys = sortedStrings(refRoi.criticalEntityKeys);
    const candKeys = sortedStrings(candRoi.criticalEntityKeys);
    const refTexts = [...(refRoi.criticalTexts ?? [])].sort((a, b) => String(a.key).localeCompare(String(b.key)));
    const candTexts = [...(candRoi.criticalTexts ?? [])].sort((a, b) => String(a.key).localeCompare(String(b.key)));
    const semanticMatch = canonical(refKeys) === canonical(candKeys) && canonical(refTexts) === canonical(candTexts);
    const bounds = roiPixelBounds(refRoi, refProfile, refImage.width, refImage.height);
    if (bounds.width <= 0 || bounds.height <= 0) {
      result.failures.push({ code: "ROI_OUTSIDE_CAPTURE", roiId: refRoi.id, message: "ROI does not cover a captured pixel." });
      continue;
    }
    const metrics = regionMetrics(
      cropMask(referenceMask, refImage.width, bounds),
      cropMask(candidateMask, refImage.width, bounds),
      bounds.width,
      bounds.height,
      refProfile.deviceScaleFactor,
    );
    const roiResult = { id: refRoi.id, critical: Boolean(refRoi.critical), semanticMatch, bounds, ...metrics };
    result.rois.push(roiResult);
    if (!semanticMatch) {
      result.failures.push({ code: "CRITICAL_SEMANTIC_LOSS", roiId: refRoi.id, message: "Critical handles or text values differ." });
    }
    if (refRoi.critical && (metrics.referenceForegroundPixels === 0 || metrics.candidateForegroundPixels === 0)) {
      result.failures.push({ code: "EMPTY_CRITICAL_ROI", roiId: refRoi.id, message: "A blank critical ROI cannot pass." });
    }
    if (refRoi.critical && (metrics.unboundedEdgeDistance || metrics.symmetricEdgeMaxCssPx > ACCEPTANCE_LIMITS.criticalRoiEdgeMaxCssPx)) {
      result.failures.push({ code: "CRITICAL_ROI_EDGE_DISTANCE", roiId: refRoi.id, message: "A critical ROI contains edge loss beyond 1.25 CSS px." });
    } else if (metrics.unboundedEdgeDistance || metrics.symmetricEdgeP95CssPx > ACCEPTANCE_LIMITS.rasterEdgeP95CssPx) {
      result.failures.push({ code: "ROI_EDGE_DISTANCE", roiId: refRoi.id, message: "ROI symmetric edge-distance P95 exceeds 1.25 CSS px." });
    }
  }
  result.status = result.failures.length === 0 ? "PASS" : "FAIL";
  result.acceptanceLimits = ACCEPTANCE_LIMITS;
  result.goldenMutation = "none; this tool reads captures and manifests and only writes its result to stdout";
  return result;
}

function loadManifest(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    if (process.argv.length !== 4) throw new Error("Usage: node scripts/cad-v2/compare-reference-profiles.mjs <native-manifest.json> <browser-manifest.json>");
    const [referencePath, candidatePath] = process.argv.slice(2).map((filename) => path.resolve(filename));
    const result = compareProfiles({
      reference: loadManifest(referencePath),
      candidate: loadManifest(candidatePath),
      referencePath,
      candidatePath,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== "PASS") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
