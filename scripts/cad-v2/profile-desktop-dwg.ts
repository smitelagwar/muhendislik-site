import * as fs from "node:fs";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";

async function main() {
  console.log("=== 1. ANALYZING mustafa selvimimariiiii.dwg ===");
  const buf1 = fs.readFileSync("C:/Users/hsyn/Desktop/mustafa selvimimariiiii.dwg");
  const doc1 = await parseDwgToCanonical(buf1, { sourceVersionKey: "mustafa_1" });
  console.log("Entities count:", doc1.modelSpaceEntities.length);
  
  const typeCounts1: Record<string, number> = {};
  for (const ent of doc1.modelSpaceEntities) {
    typeCounts1[ent.type] = (typeCounts1[ent.type] || 0) + 1;
  }
  console.log("Mustafa entity types:", typeCounts1);

  // Check how many blocks and entities inside blocks
  console.log("Total block definitions:", Object.keys(doc1.blocks).length);
  let totalBlockEntities = 0;
  for (const b of Object.values(doc1.blocks)) {
    totalBlockEntities += b.entities.length;
  }
  console.log("Total entities inside blocks:", totalBlockEntities);

  // Check coordinates distribution
  const xs: number[] = [];
  const ys: number[] = [];
  for (const ent of doc1.modelSpaceEntities) {
    if (ent.type === "LINE" && ent.start && ent.end) {
      xs.push(ent.start[0], ent.end[0]);
      ys.push(ent.start[1], ent.end[1]);
    } else if (ent.type === "LWPOLYLINE" && Array.isArray(ent.vertices)) {
      for (const v of ent.vertices) {
        if (v && v.point) {
          xs.push(v.point[0]);
          ys.push(v.point[1]);
        }
      }
    } else if (ent.type === "INSERT" && ent.insertionPoint) {
      xs.push(ent.insertionPoint[0]);
      ys.push(ent.insertionPoint[1]);
    }
  }

  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  console.log("X quantiles:", {
    min: xs[0],
    p001: xs[Math.floor(xs.length * 0.001)],
    p01: xs[Math.floor(xs.length * 0.01)],
    p05: xs[Math.floor(xs.length * 0.05)],
    p50: xs[Math.floor(xs.length * 0.50)],
    p95: xs[Math.floor(xs.length * 0.95)],
    p99: xs[Math.floor(xs.length * 0.99)],
    max: xs[xs.length - 1]
  });
  console.log("Y quantiles:", {
    min: ys[0],
    p001: ys[Math.floor(ys.length * 0.001)],
    p01: ys[Math.floor(ys.length * 0.01)],
    p05: ys[Math.floor(ys.length * 0.05)],
    p50: ys[Math.floor(ys.length * 0.50)],
    p95: ys[Math.floor(ys.length * 0.95)],
    p99: ys[Math.floor(ys.length * 0.99)],
    max: ys[ys.length - 1]
  });
}

main().catch(console.error);
