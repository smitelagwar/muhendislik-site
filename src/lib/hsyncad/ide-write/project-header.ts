/**
 * ideCAD binary project header and project metadata block builders.
 */

import { encodeCp1254NulString } from "../ide-import/ide-binary-codec";
import {
  IDE10_VERSION,
  IDE11_VERSION,
  IDE_HEADER_SIZE,
  IDE_SIGNATURE,
  STANDARD_LOAD_CASES,
  type IdeFormatVersion,
} from "./format-constants";

export interface ProjectInfoOptions {
  projectName: string;
  format?: IdeFormatVersion;
  author?: string;
  city?: string;
}

/** Builds the 88-byte unsealed initial header. */
export function buildHeaderBlock(format: IdeFormatVersion = "ide11"): Uint8Array {
  const header = new Uint8Array(IDE_HEADER_SIZE);
  // Write 74-byte ASCII signature
  for (let i = 0; i < IDE_SIGNATURE.length; i++) {
    header[i] = IDE_SIGNATURE.charCodeAt(i);
  }
  const view = new DataView(header.buffer);
  const version = format === "ide11" ? IDE11_VERSION : IDE10_VERSION;
  view.setUint32(74, version, true);
  header[78] = 0; // Native carrier flag (unencoded)
  view.setUint32(79, 0, true); // Stored length placeholder
  view.setUint32(83, 0, true); // Stored CRC32 placeholder
  header[87] = 0;
  return header;
}

/**
 * Builds the project information block starting at offset 88:
 * - Reserved zeros
 * - Project name string
 * - Preview data (empty cLen = 0)
 * - Standard 13 load cases (G, Q, Ex, Ey...)
 * - Layer table and standard style tables
 */
export function buildProjectInfoBlock(options: ProjectInfoOptions): Uint8Array {
  const format = options.format ?? "ide11";
  const nameBytes = encodeCp1254NulString(options.projectName || "Yeni Proje");

  // We assemble chunks using an array of Uint8Arrays
  const chunks: Uint8Array[] = [];

  // 1. Reserved 8 bytes (offset 88..95)
  chunks.push(new Uint8Array(8));

  // 2. Project name (offset 96..)
  chunks.push(nameBytes);

  // 3. Padding to offset 112 + len:
  // In the original file, between end of project name and cLen, there are 8 bytes of padding/flags
  chunks.push(new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0]));

  // 4. Preview length cLen (4 bytes u32 = 0)
  const cLenView = new Uint8Array(4);
  chunks.push(cLenView);

  // 5. Preview terminator + Demo flag
  if (format === "ide11") {
    // In v11: 28 bytes of padding + demoFlag(0) + marker
    const v11Meta = new Uint8Array(32);
    v11Meta[28] = 0; // demoFlag = 0
    new DataView(v11Meta.buffer).setUint32(28, 0, true);
    chunks.push(v11Meta);
  } else {
    // In v10: 2 bytes: terminator(0) + demoFlag(0)
    chunks.push(new Uint8Array([0, 0]));
  }

  // 6. Standard 13 Load Cases: G, Q, G', Q', Ez(G), Ex, Ey, Ex', Ey', ExB, ExB', EyB, EyB'
  const loadCaseCountBuf = new Uint8Array(4);
  new DataView(loadCaseCountBuf.buffer).setUint32(0, STANDARD_LOAD_CASES.length, true);
  chunks.push(loadCaseCountBuf);

  STANDARD_LOAD_CASES.forEach((lcName, idx) => {
    const idBuf = new Uint8Array(4);
    new DataView(idBuf.buffer).setUint32(0, idx + 1, true);
    chunks.push(idBuf);
    chunks.push(encodeCp1254NulString(lcName));
  });

  // 7. Layer Table Definition
  const standardLayers = [
    { id: 1, name: "Akslar", color: 0x0000ff },
    { id: 2, name: "Kolonlar", color: 0x8d8db7 },
    { id: 3, name: "Kirişler", color: 0x00ed00 },
    { id: 4, name: "Perdeler", color: 0x9292bb },
    { id: 5, name: "Döşemeler", color: 0xdfedef },
    { id: 6, name: "Merdivenler", color: 0x666699 },
    { id: 7, name: "Ölçülendirme", color: 0xffffff },
    { id: 8, name: "Yazılar", color: 0xffff00 },
  ];

  const layerCountBuf = new Uint8Array(4);
  new DataView(layerCountBuf.buffer).setUint32(0, standardLayers.length, true);
  chunks.push(layerCountBuf);

  for (const layer of standardLayers) {
    const lBuf = new Uint8Array(12);
    const lv = new DataView(lBuf.buffer);
    lv.setUint32(0, layer.id, true);
    lv.setUint32(4, layer.color, true);
    lv.setUint32(8, 1, true); // Visible
    chunks.push(lBuf);
    chunks.push(encodeCp1254NulString(layer.name));
  }

  // Calculate total length and concatenate
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.byteLength;
  }

  return result;
}
