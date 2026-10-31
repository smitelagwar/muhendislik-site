import assert from "node:assert/strict";
import { test } from "node:test";
import { PRODUCT_RIBBON_TABS } from "./product-ribbon";
import type { NativeRibbonCommand } from "./ribbon-layout";
import { createDemoModel } from "./model";
import { addStairToModel } from "./stairs";
import { addPadFootingToColumn } from "./foundations";
import fs from "node:fs";
import path from "node:path";

function collectCommands(cmds: NativeRibbonCommand[]): NativeRibbonCommand[] {
  const result: NativeRibbonCommand[] = [];
  for (const c of cmds) {
    result.push(c);
    if (c.children?.length) {
      result.push(...collectCommands(c.children));
    }
  }
  return result;
}

test("Milestone 1: PRODUCT_RIBBON_TABS prunes all non-RC commands (steel, pile, dome, vault, purlin, scaffolding)", () => {
  const allCommands = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
  
  const nonRcCommands = allCommands.filter(c => {
    const l = (c.label || "").toLocaleLowerCase("tr-TR");
    const s = c.symbol || "";
    return (
      l.includes("çelik") || /STEEL/i.test(s) ||
      l.includes("kazık") || /PILE/i.test(s) ||
      l.includes("kubbe") || /DOME/i.test(s) ||
      l.includes("tonoz") || /VAULT/i.test(s) ||
      l.includes("aşık") || /PURLIN/i.test(s) ||
      l.includes("iskele") || /SCAFFOLD/i.test(s)
    );
  });

  assert.equal(nonRcCommands.length, 0, `Expected 0 non-RC commands, found: ${nonRcCommands.map(c => c.label).join(", ")}`);
});

test("Milestone 1: Beam-column joint safety commands (12260, 11910) are strictly preserved", () => {
  const allCommands = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
  
  const jointReport = allCommands.find(c => c.commandId === 12260);
  const jointSection = allCommands.find(c => c.commandId === 11910);
  
  assert.ok(jointReport, "Command 12260 (Kolon-Kiriş Birleşim Güvenliği) must be preserved");
  assert.ok(jointSection, "Command 11910 (Kolon-Kiriş Birleşim Kesiti) must be preserved");
  assert.match(jointReport.label, /birleşim/i);
});

test("Milestone 1: Workbench maps Radye 12576 and all required unmapped RC ribbon commands", () => {
  const workbenchSrc = fs.readFileSync(path.resolve(__dirname, "../../components/hsyncad/workbench.tsx"), "utf8");
  
  const requiredCommands = [
    12576, // Radye Temel
    14351, // Radye Kenarı
    14611, // Radye Kenarı Ayarları
    13135, // Radye Boşluğu
    13110, // Döşeme Boşluğu
    1823,  // Eğrisel Kiriş
    1824,  // Yay Kiriş
    1825,  // Dairesel Kiriş
    1829,  // Sürekli Yay Kiriş
    13812, // Subasman Perdesi
    40071, // Yay Aks
    40072, // 3 Noktadan Yay Aks
    11240, // Kat Ayarları
    12500, // Kat Kopyala
    40350, // Yarı Rijit Diyafram
  ];

  for (const cmdId of requiredCommands) {
    const pattern = new RegExp(`\\b${cmdId}\\s*:`);
    assert.ok(pattern.test(workbenchSrc), `Workbench ribbonActions must register command ID ${cmdId}`);
  }
});

test("Milestone 1: 2-click stair placement creates genuine sloped slab element at arbitrary user coordinates", () => {
  const model = createDemoModel();
  const floorId = model.floors[0].id;
  const initialElements = model.elements.length;

  const start = { x: 2.5, y: 1.0 };
  const end = { x: 6.5, y: 1.0 };
  const updated = addStairToModel(model, floorId, start, end);

  assert.equal(updated.elements.length, initialElements + 1);
  const stair = updated.elements.at(-1);
  assert.ok(stair);
  assert.equal(stair.layer, "Merdivenler");
  assert.equal(stair.type, "slab");
  if (stair.type === "slab") {
    assert.equal(stair.points.length, 4);
    // Bounding box should span between start.x and end.x
    const xs = stair.points.map(p => p.x);
    assert.ok(Math.min(...xs) < 2.6);
    assert.ok(Math.max(...xs) > 6.4);
  }
});

test("Milestone 1: 1-click single footing snapping creates pad footing exclusively under target column", () => {
  const model = createDemoModel();
  const targetCol = model.elements.find(e => e.type === "column" && e.name === "S2")!;
  assert.ok(targetCol && targetCol.type === "column");

  const initialCount = model.elements.length;
  const updated = addPadFootingToColumn(model, targetCol);

  assert.equal(updated.elements.length, initialCount + 1);
  const footing = updated.elements.find(e => e.id === `footing-${targetCol.id}`);
  assert.ok(footing && footing.type === "column");
  assert.equal(footing.name, `TK-${targetCol.name}`);
  assert.equal(footing.layer, "Temeller");
  assert.deepEqual(footing.position, targetCol.position);
  assert.equal(footing.width, 1.5);
  assert.equal(footing.depth, 1.5);

  // Other columns do not have footings created
  const otherFootings = updated.elements.filter(e => e.id.startsWith("footing-"));
  assert.equal(otherFootings.length, 1);
});
