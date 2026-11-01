import fs from "fs";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";

const model = JSON.parse(fs.readFileSync("C:/Users/hsyn/Desktop/SON/7_KAT_5000M2_BINA.hsyncad", "utf8"));
const takeoff = calculateFullTakeoff(model, undefined, resolveJunctions(model));

console.log("elementBreakdown length:", takeoff.elementBreakdown.length);
const types = new Set(takeoff.elementBreakdown.map(i => i.type));
console.log("Types in elementBreakdown:", Array.from(types));

// Check floor summary
const floorSummary = {};
for (const item of takeoff.elementBreakdown) {
  if (!floorSummary[item.floorName]) {
    floorSummary[item.floorName] = { concrete: {}, formwork: {} };
  }
  const f = floorSummary[item.floorName];
  f.concrete[item.type] = (f.concrete[item.type] || 0) + item.concreteM3;
  f.formwork[item.type] = (f.formwork[item.type] || 0) + item.formworkM2;
}

console.log("Floor summary breakdown:");
console.log(JSON.stringify(floorSummary, null, 2));
