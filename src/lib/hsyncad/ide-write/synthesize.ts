/**
 * ideCAD Native Binary File Synthesizer (synthesizeIdeFile).
 * Synthesizes 100% genuine .ide10 and .ide11 binary project files from CadModel or IdeProject
 * from scratch without requiring any donor files or binary patching.
 */

import { encodeCp1254NulString, sealIdeCarrierHeader } from "../ide-import/ide-binary-codec";
import type { CadElement, CadModel, Floor, Point } from "../model";
import type { IdeElement, IdeFloor, IdeProject } from "../ide-import";
import {
  getVersionNumber,
  type IdeFormatVersion,
} from "./format-constants";
import {
  computePointsBbox,
  encodeAxisRecord,
  encodeBandRecord,
  encodeBeamRecord,
  encodeColumnRecord,
  encodeGenericRecord,
  encodeSlabEdgeRecord,
  encodeSlabRecord,
  encodeStairRecord,
  encodeWallRecord,
  type BoundingBox,
} from "./record-builders";
import { buildHeaderBlock, buildProjectInfoBlock } from "./project-header";
import { buildStoreyHeader, buildStoreyTrailer } from "./floor-block";

export interface NormalizedElement {
  id: string;
  nativeId: number;
  name: string;
  type: string;
  floorId: string;
  raw: CadElement | IdeElement;
}

export interface NormalizedFloor {
  id: string;
  name: string;
  elevation: number;
  height: number;
}

function isIdeProject(obj: unknown): obj is IdeProject {
  return typeof obj === "object" && obj !== null && "floors" in obj && "coverage" in obj;
}

/**
 * Computes an overall model bounding box from elements.
 */
function computeModelBounds(elements: (CadElement | IdeElement)[]): BoundingBox {
  const points: Point[] = [];
  for (const el of elements) {
    if ("points" in el && Array.isArray(el.points)) {
      points.push(...el.points);
    }
    if ("start" in el && el.start) points.push(el.start);
    if ("end" in el && el.end) points.push(el.end);
    if ("position" in el && el.position) points.push(el.position);
  }
  const bbox = computePointsBbox(points);
  // Guarantee reasonable defaults if empty
  if (!Number.isFinite(bbox.minX) || bbox.minX === Infinity) {
    return { minX: -10, minY: -10, maxX: 50, maxY: 50 };
  }
  return {
    minX: bbox.minX - 5,
    minY: bbox.minY - 5,
    maxX: bbox.maxX + 5,
    maxY: bbox.maxY + 5,
  };
}

/**
 * Synthesizes a valid, bit-for-bit parseable ideCAD .ide10 or .ide11 binary file from scratch.
 *
 * @param modelOrProject - A hsynCAD CadModel or a parsed IdeProject
 * @param format - Target format version: "ide10" (201094) or "ide11" (211220)
 * @returns Fully assembled, sealed Uint8Array with valid CRC32 and carrier headers
 */
export function synthesizeIdeFile(
  modelOrProject: CadModel | IdeProject,
  format: IdeFormatVersion = "ide11",
): Uint8Array {
  const formatVersion = getVersionNumber(format);
  const projectName = modelOrProject.name || "hsynCAD Proje";

  // 1. Normalize Floors
  const floors: NormalizedFloor[] = modelOrProject.floors.map(f => ({
    id: f.id,
    name: f.name,
    elevation: f.elevation,
    height: f.height,
  }));

  if (floors.length === 0) {
    floors.push({ id: "floor-0", name: "Zemin Kat", elevation: 0, height: 3.0 });
  }

  // 2. Normalize Elements
  const rawElements = modelOrProject.elements as (CadElement | IdeElement)[];
  let nextId = 10001;
  const elementsByFloor = new Map<string, NormalizedElement[]>();
  for (const f of floors) {
    elementsByFloor.set(f.id, []);
  }

  for (const el of rawElements) {
    const floorId = "floorId" in el ? el.floorId : floors[0].id;
    const nativeId = "nativeId" in el && typeof el.nativeId === "number" && el.nativeId > 0
      ? el.nativeId
      : nextId++;
    const name = el.name || `E${nativeId}`;
    const normEl: NormalizedElement = {
      id: el.id || `el-${nativeId}`,
      nativeId,
      name,
      type: el.type,
      floorId,
      raw: el,
    };

    const targetList = elementsByFloor.get(floorId);
    if (targetList) {
      targetList.push(normEl);
    } else {
      elementsByFloor.get(floors[0].id)?.push(normEl);
    }
  }

  // 3. Overall Model Bounds
  const modelBounds = computeModelBounds(rawElements);

  // 4. Assemble Chunks
  const chunks: Uint8Array[] = [];

  // 4.1 Header block (88 bytes unsealed)
  chunks.push(buildHeaderBlock(format));

  // 4.2 Project Information & Metadata block
  chunks.push(
    buildProjectInfoBlock({
      projectName,
      format,
      author: "hsynCAD",
    }),
  );

  // 4.3 Floor Blocks (Storey Header + Element Records + Trailer)
  floors.forEach((floor, ordinal) => {
    // Kat Başlığı
    chunks.push(
      buildStoreyHeader({
        floor: floor as Floor,
        ordinal,
        format,
        modelBounds,
      }),
    );

    // O kata ait elemanlar
    const floorElements = elementsByFloor.get(floor.id) || [];
    for (const el of floorElements) {
      const raw = el.raw as any;
      if (el.type === "axis") {
        chunks.push(encodeAxisRecord(raw, el.nativeId));
      } else if (el.type === "column") {
        chunks.push(encodeColumnRecord(raw, el.nativeId));
      } else if (el.type === "beam") {
        chunks.push(encodeBeamRecord(raw, el.nativeId, format));
      } else if (el.type === "wall") {
        chunks.push(encodeWallRecord(raw, el.nativeId, format));
      } else if (el.type === "slab") {
        chunks.push(encodeSlabRecord(raw, el.nativeId, format));
      } else if (el.type === "band") {
        chunks.push(encodeBandRecord(raw, el.nativeId));
      } else if (el.type === "stair") {
        chunks.push(encodeStairRecord(raw, el.nativeId));
      } else if (el.type === "slabEdge" || el.type === "line") {
        chunks.push(encodeSlabEdgeRecord(raw, el.nativeId));
      } else {
        chunks.push(encodeGenericRecord(raw, el.nativeId));
      }
    }

    // Kat Sonu Trailer
    chunks.push(buildStoreyTrailer());
  });

  // 4.4 Project Tail Block (Antet & Mühür Bilgileri)
  const tailChunks: Uint8Array[] = [];
  tailChunks.push(new Uint8Array([0xff, 0xff, 0xff, 0xff])); // Storey list end
  tailChunks.push(encodeCp1254NulString(projectName));
  tailChunks.push(encodeCp1254NulString("hsynCAD Mühendislik"));
  tailChunks.push(encodeCp1254NulString("TMMOB İnşaat Mühendisleri Odası"));
  tailChunks.push(new Uint8Array(64)); // Final EOF padding

  const tailTotal = tailChunks.reduce((acc, c) => acc + c.byteLength, 0);
  const tailBlock = new Uint8Array(tailTotal);
  let tPos = 0;
  for (const tc of tailChunks) {
    tailBlock.set(tc, tPos);
    tPos += tc.byteLength;
  }
  chunks.push(tailBlock);

  // 5. Concatenate All Chunks
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const finalBytes = new Uint8Array(totalLength);
  let writePos = 0;
  for (const chunk of chunks) {
    finalBytes.set(chunk, writePos);
    writePos += chunk.byteLength;
  }

  // 6. Seal Header (CRC32 Checksum and File Length)
  sealIdeCarrierHeader(finalBytes, {
    formatVersion,
    encodedFlag: 0,
  });

  return finalBytes;
}
