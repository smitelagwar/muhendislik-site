import { parseIde10, type IdeElement, type IdeProject } from "./index";
import { IDE10_VERSION, sealIdeCarrierHeader } from "./ide-binary-codec";
import { applyIdeBinarySplices, collectIde11TrialTransformPlan, type IdeTranscodeOptions } from "./ide11-transcoder";

export interface Ide10ExportInput {
  /** Source .ide11trial, .ide11, or .ide10 binary buffer */
  sourceBuffer: ArrayBuffer | Uint8Array;
  /** Parsed/edited IdeProject (optional; parsed from sourceBuffer if omitted) */
  project?: IdeProject;
  /** Optional baseline .ide10 binary buffer for 100% native v10 donor surgery */
  donorIde10Buffer?: ArrayBuffer | Uint8Array;
}

export interface Ide10ExportResult {
  bytes: Uint8Array;
  mode: "donor-patched" | "standalone-downgraded" | "native-ide10-passthrough";
  patchedElementCount: number;
}

const PATCH_EPS = 1e-6;

function findDonorGeometryOffsets(
  donorView: DataView,
  nameOffset: number,
  expectedId: number,
  expectedCount: number,
): {
  geometryOffset: number;
  tail: number;
  rotOffset: number;
  latOffset: number;
  bboxOffset: number;
} | undefined {
  const bboxOffset = nameOffset - 21;
  const min = Math.max(0, nameOffset - 65536);
  for (let p = bboxOffset - 36; p >= min; p--) {
    const pt = donorView.getUint32(p, true);
    const cnt = donorView.getUint32(p + 4, true);
    if (pt < 1 || pt > 200 || cnt !== expectedCount) continue;
    const tail = p + 8 + cnt * 16;
    if (tail + 36 > bboxOffset) continue;
    if (donorView.getUint32(tail, true) !== expectedId) continue;
    let cursor = tail + 24;
    let valid = true;
    let rotOffset = 0;
    for (let list = 0; list < 3; list++) {
      if (cursor + 4 > bboxOffset) {
        valid = false;
        break;
      }
      const len = donorView.getUint32(cursor, true);
      cursor += 4;
      if (len > 16384 || cursor + len * 4 > bboxOffset) {
        valid = false;
        break;
      }
      cursor += len * 4;
      if (list === 0) {
        if (cursor + 8 > bboxOffset) {
          valid = false;
          break;
        }
        rotOffset = cursor;
        cursor += 8;
      }
    }
    if (!valid || cursor + 8 !== bboxOffset) continue;
    return {
      geometryOffset: p,
      tail,
      rotOffset,
      latOffset: cursor,
      bboxOffset,
    };
  }
  return undefined;
}

/**
 * Surgically patches updated element properties (slab G/Q loads, heights, widths, elevations, coordinates)
 * from `targetProject` into a clone of `donorIde10Buffer` matched by `nativeId`, then seals the CRC32 header.
 * Unchanged fields (within 1e-6 IEEE-754 tolerance) are never overwritten, preserving 100% bit-for-bit
 * donor identity on unedited Save-As `.ide11trial` files.
 */
export function patchIde10DonorBuffer(
  donorBuffer: ArrayBuffer | Uint8Array,
  targetProject: IdeProject,
): Ide10ExportResult {
  const donorBytes = donorBuffer instanceof Uint8Array
    ? new Uint8Array(donorBuffer)
    : new Uint8Array(donorBuffer.slice(0));
  const donorView = new DataView(donorBytes.buffer, donorBytes.byteOffset, donorBytes.byteLength);
  if (donorView.getUint32(74, true) !== IDE10_VERSION || donorBytes[78] !== 0) {
    throw new Error("Donör dosya geçerli bir .ide10 (201094, bayrak=0) taşıyıcısı değil.");
  }

  const donorProject = parseIde10(
    donorBytes.buffer.slice(donorBytes.byteOffset, donorBytes.byteOffset + donorBytes.byteLength) as ArrayBuffer,
    "donor.ide10",
  );
  const targetById = new Map<string, IdeElement>();
  for (const el of targetProject.elements) {
    targetById.set(`${el.floorId}:${el.nativeId}`, el);
  }

  // Update floor elevations and heights in donor ONLY when changed beyond PATCH_EPS
  let floorPatched = false;
  for (let i = 0; i < Math.min(donorProject.floors.length, targetProject.floors.length); i++) {
    const df = donorProject.floors[i];
    const tf = targetProject.floors[i];
    const nameLen = donorView.getUint32(df.sourceOffset - 4, true);
    const dataOffset = df.sourceOffset + nameLen;
    if (dataOffset + 16 <= donorBytes.byteLength) {
      if (Math.abs(df.elevation - tf.elevation) > PATCH_EPS) {
        donorView.setFloat64(dataOffset, tf.elevation, true);
        floorPatched = true;
      }
      if (Math.abs(df.height - tf.height) > PATCH_EPS) {
        donorView.setFloat64(dataOffset + 8, tf.height, true);
        floorPatched = true;
      }
    }
  }

  let patchedElementCount = 0;
  for (const dEl of donorProject.elements) {
    const tEl = targetById.get(`${dEl.floorId}:${dEl.nativeId}`);
    if (!tEl) continue;
    let elementPatched = false;

    // 1. Patch common geometry record (points, nativeZ, width/thickness, rotation, lateralOffset) if changed
    const dWidth = dEl.width ?? dEl.thickness;
    const tWidth = tEl.width ?? tEl.thickness;
    const pointsChanged =
      dEl.points.length === tEl.points.length &&
      dEl.points.some(
        (pt, idx) =>
          Math.abs(pt.x - tEl.points[idx].x) > PATCH_EPS ||
          Math.abs(pt.y - tEl.points[idx].y) > PATCH_EPS,
      );
    const zChanged = Math.abs(dEl.nativeZ - tEl.nativeZ) > PATCH_EPS;
    const widthChanged =
      dWidth !== undefined && tWidth !== undefined && Math.abs(dWidth - tWidth) > PATCH_EPS;
    const rotChanged = Math.abs(dEl.rotation - tEl.rotation) > PATCH_EPS;
    const latChanged = Math.abs(dEl.lateralOffset - tEl.lateralOffset) > PATCH_EPS;

    if (pointsChanged || zChanged || widthChanged || rotChanged || latChanged) {
      const geom = findDonorGeometryOffsets(donorView, dEl.sourceOffset, dEl.nativeId, dEl.points.length);
      if (geom) {
        if (pointsChanged) {
          for (let j = 0; j < tEl.points.length; j++) {
            donorView.setFloat64(geom.geometryOffset + 8 + j * 16, tEl.points[j].x, true);
            donorView.setFloat64(geom.geometryOffset + 16 + j * 16, tEl.points[j].y, true);
          }
          const boundsPoints = [...tEl.points, ...(tEl.footprint ?? [])];
          const w = tWidth ?? dWidth ?? 0;
          if (tEl.points.length === 2 && w > 0) {
            const [a, b] = tEl.points;
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            if (len > 1e-8) {
              const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
              const left = tEl.lateralOffset, right = left - w;
              boundsPoints.push(
                { x: a.x + nx * right, y: a.y + ny * right },
                { x: b.x + nx * right, y: b.y + ny * right },
                { x: b.x + nx * left, y: b.y + ny * left },
                { x: a.x + nx * left, y: a.y + ny * left },
              );
            }
          }
          let minX = donorView.getFloat32(geom.bboxOffset, true);
          let minY = donorView.getFloat32(geom.bboxOffset + 4, true);
          let maxX = donorView.getFloat32(geom.bboxOffset + 8, true);
          let maxY = donorView.getFloat32(geom.bboxOffset + 12, true);
          for (const pt of boundsPoints) {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
          }
          donorView.setFloat32(geom.bboxOffset, minX, true);
          donorView.setFloat32(geom.bboxOffset + 4, minY, true);
          donorView.setFloat32(geom.bboxOffset + 8, maxX, true);
          donorView.setFloat32(geom.bboxOffset + 12, maxY, true);
        }
        if (zChanged) {
          donorView.setFloat64(geom.tail + 4, tEl.nativeZ, true);
        }
        if (widthChanged && tWidth !== undefined) {
          donorView.setFloat64(geom.tail + 12, tWidth, true);
        }
        if (rotChanged) {
          donorView.setFloat64(geom.rotOffset, tEl.rotation, true);
        }
        if (latChanged) {
          donorView.setFloat64(geom.latOffset, tEl.lateralOffset, true);
        }
        elementPatched = true;
      }
    }

    // 2. Patch slab dead/live loads (G/Q) ONLY when changed beyond PATCH_EPS
    if (dEl.type === "slab" && dEl.planAnnotation?.loads && tEl.planAnnotation?.loads) {
      const loadOff = dEl.planAnnotation.loads.sourceOffset;
      if (loadOff + 24 <= donorBytes.byteLength) {
        const liveDiff = Math.abs(dEl.planAnnotation.loads.live - tEl.planAnnotation.loads.live) > PATCH_EPS;
        const deadDiff = Math.abs(dEl.planAnnotation.loads.dead - tEl.planAnnotation.loads.dead) > PATCH_EPS;
        if (liveDiff) {
          donorView.setFloat64(loadOff, tEl.planAnnotation.loads.live, true);
          elementPatched = true;
        }
        if (deadDiff) {
          donorView.setFloat64(loadOff + 16, tEl.planAnnotation.loads.dead, true);
          elementPatched = true;
        }
      }
    }

    // 3. Patch architectural wall native height ONLY when changed beyond PATCH_EPS
    if (
      dEl.type === "wall" &&
      dEl.nativeHeightOffset !== undefined &&
      tEl.height !== undefined &&
      dEl.nativeHeightOffset + 8 <= donorBytes.byteLength
    ) {
      if (dEl.height !== undefined && Math.abs(dEl.height - tEl.height) > PATCH_EPS) {
        donorView.setFloat64(dEl.nativeHeightOffset, tEl.height, true);
        elementPatched = true;
      }
    }

    // 4. Patch beam height ONLY when changed beyond PATCH_EPS
    if (
      dEl.type === "beam" &&
      dEl.height !== undefined &&
      tEl.height !== undefined &&
      Math.abs(dEl.height - tEl.height) > PATCH_EPS
    ) {
      const beamHeightOff = dEl.sourceOffset + dEl.name.length + 1 + 266;
      if (beamHeightOff + 8 <= donorBytes.byteLength) {
        donorView.setFloat64(beamHeightOff, tEl.height, true);
        elementPatched = true;
      }
    }

    if (elementPatched) patchedElementCount++;
  }

  if (floorPatched || patchedElementCount > 0) {
    sealIdeCarrierHeader(donorBytes, {
      formatVersion: IDE10_VERSION,
      encodedFlag: 0,
    });
  }

  return {
    bytes: donorBytes,
    mode: "donor-patched",
    patchedElementCount,
  };
}

/**
 * Downgrades a standalone .ide11trial or .ide11 buffer into a .ide10 (201094, encodedFlag=0) binary buffer.
 */
export function downgradeIde11ToIde10Buffer(
  sourceBuffer: ArrayBuffer | Uint8Array,
  options: IdeTranscodeOptions = {},
): Uint8Array {
  const src = sourceBuffer instanceof Uint8Array
    ? sourceBuffer
    : new Uint8Array(sourceBuffer);
  const { work, splices } = collectIde11TrialTransformPlan(src, {
    ...options,
    targetVersion: IDE10_VERSION,
  });
  const out = applyIdeBinarySplices(work, splices);
  return sealIdeCarrierHeader(out, {
    formatVersion: IDE10_VERSION,
    encodedFlag: 0,
  });
}

/**
 * Unified .ide10 exporter:
 * - If sourceBuffer is already .ide10 and no donor is needed, seals and returns it (applying any project overrides).
 * - If donorIde10Buffer is supplied, runs surgical donor patching for 100% native v10 compatibility.
 * - Otherwise runs standalone v11 -> v10 binary record downgrade.
 */
export function exportToIde10Binary(input: Ide10ExportInput): Ide10ExportResult {
  const srcBytes = input.sourceBuffer instanceof Uint8Array
    ? input.sourceBuffer
    : new Uint8Array(input.sourceBuffer);
  const srcView = new DataView(srcBytes.buffer, srcBytes.byteOffset, srcBytes.byteLength);
  const version = srcView.getUint32(74, true);
  const flag = srcBytes[78];

  if (version === IDE10_VERSION && flag === 0 && !input.donorIde10Buffer) {
    if (input.project) {
      return patchIde10DonorBuffer(srcBytes, input.project);
    }
    const copy = new Uint8Array(srcBytes);
    sealIdeCarrierHeader(copy, { formatVersion: IDE10_VERSION, encodedFlag: 0 });
    return { bytes: copy, mode: "native-ide10-passthrough", patchedElementCount: 0 };
  }

  const project = input.project ?? parseIde10(
    srcBytes.buffer.slice(srcBytes.byteOffset, srcBytes.byteOffset + srcBytes.byteLength) as ArrayBuffer,
    "source.ide11trial",
  );

  if (input.donorIde10Buffer) {
    return patchIde10DonorBuffer(input.donorIde10Buffer, project);
  }

  const wallSectionOverrides = new Map<number, string>();
  const slabLoadOverrides = new Map<number, { dead: number; live: number }>();
  for (const el of project.elements) {
    if (el.type === "wall" && el.structural && el.planAnnotation?.section) {
      wallSectionOverrides.set(el.nativeId, el.planAnnotation.section);
    }
    if (el.type === "slab" && el.planAnnotation?.loads) {
      slabLoadOverrides.set(el.nativeId, {
        dead: el.planAnnotation.loads.dead,
        live: el.planAnnotation.loads.live,
      });
    }
  }

  const bytes = downgradeIde11ToIde10Buffer(srcBytes, {
    wallSectionOverrides,
    slabLoadOverrides,
  });

  return {
    bytes,
    mode: "standalone-downgraded",
    patchedElementCount: project.elements.length,
  };
}
