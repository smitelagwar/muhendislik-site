import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10, type IdeProject } from "./ide-import";
import { decodeIdeNumericBlock, encodeIdeFloat64 } from "./ide-import/numeric-codec";
import {
  computeIdePayloadChecksum,
  encodeCp1254NulString,
  IDE10_VERSION,
  IDE11_VERSION,
  sealIdeCarrierHeader,
  verifyIdeHeaderChecksum,
} from "./ide-import/ide-binary-codec";
import { exportIde10Binary, exportIde11Binary } from "./ide-export";

const trialSamplePath = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
const nativeIde10Path = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";

const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b} (eps=${eps})`);

function assertProjectsEquivalent(actual: IdeProject, reference: IdeProject) {
  assert.equal(actual.floors.length, reference.floors.length);
  for (let i = 0; i < reference.floors.length; i++) {
    assert.equal(actual.floors[i].name, reference.floors[i].name);
    close(actual.floors[i].elevation, reference.floors[i].elevation);
    close(actual.floors[i].height, reference.floors[i].height);
  }
  assert.equal(actual.elements.length, reference.elements.length);
  assert.equal(actual.coverage.unsupportedRecords, 0);
  assert.equal(actual.coverage.holeRecords, reference.coverage.holeRecords);
  assert.deepEqual(actual.coverage.byType, reference.coverage.byType);

  const refById = new Map(reference.elements.map((e) => [`${e.floorId}:${e.nativeId}`, e]));
  for (const el of actual.elements) {
    const ref = refById.get(`${el.floorId}:${el.nativeId}`);
    assert.ok(ref, `Missing element ${el.floorId}:${el.nativeId}`);
    assert.equal(el.type, ref.type);
    assert.equal(el.name, ref.name);
    assert.equal(el.points.length, ref.points.length);
    for (let i = 0; i < ref.points.length; i++) {
      close(el.points[i].x, ref.points[i].x);
      close(el.points[i].y, ref.points[i].y);
    }
    for (const field of ["width", "thickness", "height", "bottom", "top", "nativeZ", "lateralOffset", "rotation"] as const) {
      if (ref[field] !== undefined) {
        assert.ok(el[field] !== undefined, `Missing ${field} on ${el.name}`);
        close(el[field]!, ref[field]!);
      }
    }
    assert.equal(el.sectionLabel, ref.sectionLabel, `Beam section mismatch on ${el.name}`);
    assert.equal(el.planAnnotation?.section, ref.planAnnotation?.section, `Wall section mismatch on ${el.floorId} ${el.name}`);
    if (ref.planAnnotation?.loads) {
      assert.ok(el.planAnnotation?.loads, `Missing slab loads on ${el.name}`);
      close(el.planAnnotation.loads.dead, ref.planAnnotation.loads.dead);
      close(el.planAnnotation.loads.live, ref.planAnnotation.loads.live);
    }
    if (ref.mesh) {
      assert.deepEqual(el.mesh?.positions, ref.mesh.positions);
      assert.deepEqual(el.mesh?.quads, ref.mesh.quads);
    }
    if (ref.planPaths) {
      assert.equal(el.planPaths?.length, ref.planPaths.length, `Stair planPaths mismatch on ${el.floorId} ${el.name}`);
    }
  }
}

test("Blowfish numeric codec round-trips IEEE-754 float64 values deterministically", () => {
  for (const value of [0, -0.5, 0.25, 0.545, 1, 3.0, 29.55, -142.875, 145671.125]) {
    const encoded = encodeIdeFloat64(value);
    const decoded = new DataView(decodeIdeNumericBlock(new DataView(encoded.buffer), 0).buffer).getFloat64(0, true);
    assert.equal(decoded, value);
  }
});

test("sealIdeCarrierHeader writes exact version, encodedFlag, byteLength and inverted CRC32", () => {
  const sample = new Uint8Array(128);
  for (let i = 88; i < sample.length; i++) sample[i] = (i * 31) & 0xff;
  sealIdeCarrierHeader(sample, { formatVersion: IDE11_VERSION, encodedFlag: 0 });
  const view = new DataView(sample.buffer);
  assert.equal(view.getUint32(74, true), IDE11_VERSION);
  assert.equal(sample[78], 0);
  assert.equal(view.getUint32(79, true), 128);
  assert.equal(view.getUint32(83, true), computeIdePayloadChecksum(sample, 88));
  assert.equal(verifyIdeHeaderChecksum(sample).valid, true);
});

test("encodeCp1254NulString encodes Turkish characters and length prefix with NUL terminator", () => {
  const bytes = encodeCp1254NulString("ZEMİN KAT ğüşiöç");
  const view = new DataView(bytes.buffer);
  const len = view.getUint32(0, true);
  assert.equal(len, "ZEMİN KAT ğüşiöç".length + 1);
  assert.equal(bytes[bytes.length - 1], 0);
  const decoded = new TextDecoder("windows-1254").decode(bytes.subarray(4, 3 + len));
  assert.equal(decoded, "ZEMİN KAT ğüşiöç");
});

test(
  ".ide11trial exports to decoded .ide11 and round-trips through parseIde10 with 100% element equivalence",
  { skip: !existsSync(trialSamplePath), timeout: 45_000 },
  () => {
    const trialBytes = new Uint8Array(readFileSync(trialSamplePath));
    assert.equal(verifyIdeHeaderChecksum(trialBytes).valid, true);
    const trialProject = parseIde10(
      trialBytes.buffer.slice(trialBytes.byteOffset, trialBytes.byteOffset + trialBytes.byteLength) as ArrayBuffer,
      "MUSTAFA SELVİ 1.KISIM.ide11trial",
    );

    const ide11Bytes = exportIde11Binary(trialBytes, trialProject);
    assert.equal(verifyIdeHeaderChecksum(ide11Bytes).valid, true);
    const header = new DataView(ide11Bytes.buffer, ide11Bytes.byteOffset, ide11Bytes.byteLength);
    assert.equal(header.getUint32(74, true), IDE11_VERSION);
    assert.equal(ide11Bytes[78], 1);
    // The native v11 carrier preserves all 3D FEM matrices and restores all redacted "XX" beam and wall labels
    assert.ok(ide11Bytes.byteLength >= trialBytes.byteLength);

    const parsedIde11 = parseIde10(
      ide11Bytes.buffer.slice(ide11Bytes.byteOffset, ide11Bytes.byteOffset + ide11Bytes.byteLength) as ArrayBuffer,
      "MUSTAFA SELVİ 1.KISIM.ide11",
    );
    assert.equal(parsedIde11.format, "ide11");
    assert.equal(parsedIde11.floors.length, 6);
    assert.equal(parsedIde11.elements.length, 1273);
    assert.equal(parsedIde11.coverage.unsupportedRecords, 0);
    assert.equal(parsedIde11.coverage.holeRecords, 76);
    assert.equal(parsedIde11.elements.filter(e => e.planAnnotation?.loads).length, 159);
    assert.equal(parsedIde11.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
    assert.equal(parsedIde11.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
    assert.equal(parsedIde11.elements.filter(e => e.type === "stair" && e.mesh).length, 7);

    if (existsSync(nativeIde10Path)) {
      const donorBytes = new Uint8Array(readFileSync(nativeIde10Path));
      const donorProject = parseIde10(
        donorBytes.buffer.slice(donorBytes.byteOffset, donorBytes.byteOffset + donorBytes.byteLength) as ArrayBuffer,
        "MUSTAFA SELVİ 1.KISIM.ide10",
      );
      assertProjectsEquivalent(parsedIde11, donorProject);
    }
  },
);

test(
  ".ide11trial exports to .ide10 in both standalone-downgraded and bit-for-bit donor-patched modes",
  { skip: !existsSync(trialSamplePath), timeout: 60_000 },
  () => {
    const trialBytes = new Uint8Array(readFileSync(trialSamplePath));
    const trialProject = parseIde10(
      trialBytes.buffer.slice(trialBytes.byteOffset, trialBytes.byteOffset + trialBytes.byteLength) as ArrayBuffer,
      "MUSTAFA SELVİ 1.KISIM.ide11trial",
    );

    // 1. Standalone .ide10 downgrade
    const standalone = exportIde10Binary(trialBytes, trialProject);
    assert.equal(standalone.mode, "standalone-downgraded");
    assert.equal(verifyIdeHeaderChecksum(standalone.bytes).valid, true);
    const header = new DataView(standalone.bytes.buffer, standalone.bytes.byteOffset, standalone.bytes.byteLength);
    assert.equal(header.getUint32(74, true), IDE10_VERSION);
    assert.equal(standalone.bytes[78], 0);
    assert.ok(trialBytes.byteLength - standalone.bytes.byteLength > 940_000);

    const parsedIde10 = parseIde10(
      standalone.bytes.buffer.slice(standalone.bytes.byteOffset, standalone.bytes.byteOffset + standalone.bytes.byteLength) as ArrayBuffer,
      "MUSTAFA SELVİ 1.KISIM.ide10",
    );
    assert.equal(parsedIde10.format, "ide10");
    assert.equal(parsedIde10.floors.length, 6);
    assert.equal(parsedIde10.elements.length, 1273);
    assert.equal(parsedIde10.coverage.unsupportedRecords, 0);
    assert.equal(parsedIde10.coverage.holeRecords, 76);
    assert.equal(parsedIde10.elements.filter(e => e.planAnnotation?.loads).length, 159);
    assert.equal(parsedIde10.elements.filter(e => e.type === "beam" && e.sectionLabel).length, 357);
    assert.equal(parsedIde10.elements.filter(e => e.type === "wall" && e.structural && e.planAnnotation?.section).length, 196);
    assert.equal(parsedIde10.elements.filter(e => e.type === "stair" && e.mesh).length, 7);

    // 2. Donor-assisted .ide10 surgical patch (when native .ide10 sample is present)
    if (existsSync(nativeIde10Path)) {
      const donorBytes = new Uint8Array(readFileSync(nativeIde10Path));
      const donorProject = parseIde10(
        donorBytes.buffer.slice(donorBytes.byteOffset, donorBytes.byteOffset + donorBytes.byteLength) as ArrayBuffer,
        "MUSTAFA SELVİ 1.KISIM.ide10",
      );
      assertProjectsEquivalent(parsedIde10, donorProject);

      // Unedited Save-As .ide11trial exported with donor must be 100% SHA-256 bit-for-bit identical to donor!
      const unmodifiedExport = exportIde10Binary(trialBytes, trialProject, donorBytes);
      assert.equal(unmodifiedExport.mode, "donor-patched");
      assert.equal(unmodifiedExport.patchedElementCount, 0);
      assert.equal(digest(unmodifiedExport.bytes), digest(donorBytes));

      // Edited slab loads and wall height/geometry must patch surgically
      const modified = structuredClone(trialProject);
      const slab = modified.elements.find(e => e.type === "slab" && e.planAnnotation?.loads)!;
      slab.planAnnotation!.loads!.dead = 0.654;
      slab.planAnnotation!.loads!.live = 0.432;
      const archWall = modified.elements.find(e => e.type === "wall" && e.nativeHeightOffset !== undefined)!;
      archWall.height = 3.15;
      archWall.points[0].x += 0.25;

      const patched = exportIde10Binary(trialBytes, modified, donorBytes);
      assert.equal(patched.mode, "donor-patched");
      assert.equal(patched.patchedElementCount, 2);
      assert.equal(verifyIdeHeaderChecksum(patched.bytes).valid, true);

      const reparsedDonor = parseIde10(
        patched.bytes.buffer.slice(patched.bytes.byteOffset, patched.bytes.byteOffset + patched.bytes.byteLength) as ArrayBuffer,
        "MUSTAFA SELVİ 1.KISIM.ide10",
      );
      const updatedSlab = reparsedDonor.elements.find(e => e.id === slab.id)!;
      assert.equal(updatedSlab.planAnnotation?.loads?.dead, 0.654);
      assert.equal(updatedSlab.planAnnotation?.loads?.live, 0.432);
      const updatedWall = reparsedDonor.elements.find(e => e.id === archWall.id)!;
      close(updatedWall.height!, 3.15);
      close(updatedWall.points[0].x, archWall.points[0].x);
    }
  },
);
