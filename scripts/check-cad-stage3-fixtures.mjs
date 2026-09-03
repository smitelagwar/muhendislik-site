#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("[check-cad-stage3-fixtures] Validating TEXT, MTEXT, ATTRIB, DIMENSION fixtures...");

function parsePairs(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number.parseInt(lines[i].trim(), 10);
    if (Number.isFinite(code)) {
      pairs.push({ code, value: lines[i + 1]?.trim() ?? "" });
    }
  }
  return pairs;
}

// 1. Text Rotation (0, 90, 180, 270 derece)
{
  const fixturePath = join(root, "tests", "fixtures", "cad-preview-v2", "text-rotation-0-90-180-270.dxf");
  const text = await readFile(fixturePath, "utf8");
  const pairs = parsePairs(text);

  const rotations = [];
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code === 0 && pairs[i].value === "TEXT") {
      let rot = 0;
      for (let j = i + 1; j < pairs.length && pairs[j].code !== 0; j++) {
        if (pairs[j].code === 50) rot = Number.parseFloat(pairs[j].value);
      }
      rotations.push(rot);
    }
  }

  assert.ok(rotations.length >= 4, "En az 4 rotasyon örneği bulunmalıdır");
  assert.ok(rotations.includes(0), "0 derece rotasyon bulunmalıdır");
  assert.ok(rotations.includes(90), "90 derece rotasyon bulunmalıdır");
  assert.ok(rotations.includes(180), "180 derece rotasyon bulunmalıdır");
  assert.ok(rotations.includes(270), "270 derece rotasyon bulunmalıdır");
}
console.log("  [1/4] text-rotation-0-90-180-270.dxf doğrulandı.");

// 2. Text Alignment and Extrusion (OCS)
{
  const fixturePath = join(root, "tests", "fixtures", "cad-preview-v2", "text-alignment-extrusion.dxf");
  const text = await readFile(fixturePath, "utf8");
  const pairs = parsePairs(text);

  let hasAlignmentPoint = false;
  let hasExtrusion = false;

  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code === 0 && (pairs[i].value === "TEXT" || pairs[i].value === "MTEXT")) {
      for (let j = i + 1; j < pairs.length && pairs[j].code !== 0; j++) {
        if (pairs[j].code === 11 || pairs[j].code === 21) hasAlignmentPoint = true;
        if (pairs[j].code === 210 || pairs[j].code === 220 || pairs[j].code === 230) hasExtrusion = true;
      }
    }
  }

  assert.ok(hasAlignmentPoint, "Second alignment point (11/21) mevcut olmalıdır");
  assert.ok(hasExtrusion, "Extrusion vektörü (210/220/230) mevcut olmalıdır");
}
console.log("  [2/4] text-alignment-extrusion.dxf doğrulandı.");

// 3. Block Insert and ATTRIB Transform
{
  const fixturePath = join(root, "tests", "fixtures", "cad-preview-v2", "insert-attrib-transforms.dxf");
  const text = await readFile(fixturePath, "utf8");
  const pairs = parsePairs(text);

  let hasInsert = false;
  let hasAttrib = false;

  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code === 0 && pairs[i].value === "INSERT") hasInsert = true;
    if (pairs[i].code === 0 && pairs[i].value === "ATTRIB") hasAttrib = true;
  }

  assert.ok(hasInsert, "INSERT entity mevcut olmalıdır");
  assert.ok(hasAttrib, "ATTRIB entity mevcut olmalıdır");
}
console.log("  [3/4] insert-attrib-transforms.dxf doğrulandı.");

// 4. Dimension Linear
{
  const fixturePath = join(root, "tests", "fixtures", "dxf", "dimension-linear.dxf");
  const text = await readFile(fixturePath, "utf8");
  const pairs = parsePairs(text);

  let hasDimension = false;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i].code === 0 && pairs[i].value === "DIMENSION") {
      hasDimension = true;
      break;
    }
  }

  assert.ok(hasDimension, "DIMENSION entity mevcut olmalıdır");
}
console.log("  [4/4] dimension-linear.dxf doğrulandı.");

console.log("[check-cad-stage3-fixtures] OK: Tüm CAD annotation ve geometri fixture'ları doğrulandı.");
