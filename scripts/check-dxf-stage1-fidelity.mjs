import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readFixture(name) {
  return readFile(path.join(root, "tests", "fixtures", "dxf", name), "utf8");
}

function parsePairs(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number.parseInt(lines[i].trim(), 10);
    if (Number.isFinite(code)) pairs.push({ code, value: lines[i + 1].trim() });
  }
  return pairs;
}

function countEntities(text) {
  const pairs = parsePairs(text);
  let section = null;
  const counts = new Map();
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i];
    if (pair.code === 0 && pair.value === "SECTION" && pairs[i + 1]?.code === 2) {
      section = pairs[i + 1].value;
      continue;
    }
    if (pair.code === 0 && pair.value === "ENDSEC") {
      section = null;
      continue;
    }
    if ((section === "ENTITIES" || section === "BLOCKS") && pair.code === 0 && pair.value !== "BLOCK" && pair.value !== "ENDBLK") {
      counts.set(pair.value, (counts.get(pair.value) ?? 0) + 1);
    }
  }
  return counts;
}

const geometry = countEntities(await readFixture("geometry-basic.dxf"));
assert.equal(geometry.get("LINE"), 1);
assert.equal(geometry.get("LWPOLYLINE"), 1);
assert.equal(geometry.get("CIRCLE"), 1);

const text = countEntities(await readFixture("text-turkish.dxf"));
assert.equal(text.get("TEXT"), 1);
assert.equal(text.get("MTEXT"), 1);

const dimensions = countEntities(await readFixture("dimension-linear.dxf"));
assert.equal(dimensions.get("DIMENSION"), 1);

const blocks = countEntities(await readFixture("blocks-attrib.dxf"));
assert.equal(blocks.get("INSERT"), 1);
assert.equal(blocks.get("ATTRIB"), 1);
assert.equal(blocks.get("ATTDEF"), 1);

const unsupported = countEntities(await readFixture("unsupported-annotations.dxf"));
assert.equal(unsupported.get("LEADER"), 1);
assert.equal(unsupported.get("MLEADER"), 1);

const viewerSource = await readFile(path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"), "utf8");
assert.match(viewerSource, /fonts:\s*DXF_FONT_URLS/);
assert.match(viewerSource, /auditDxfText\(dxfText\)/);
assert.match(viewerSource, /cad-dxf-fidelity/);
assert.match(viewerSource, /GetBounds\(\)/);

console.log("DXF Stage 1 fidelity checks passed.");
