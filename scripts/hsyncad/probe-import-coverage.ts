import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import";
import { validateIdeCarrier, sealIdeCarrierHeader } from "../../src/lib/hsyncad/ide-import/ide-binary-codec";
import { importIdeWorkspace } from "../../src/lib/hsyncad/ide-workspace";
import { nativeImportCoverage } from "../../src/lib/hsyncad/structural/native-import-coverage";

const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const [inventoryPath, output] = process.argv.slice(2);
if (!inventoryPath || !output || !path.isAbsolute(output)) throw new Error("Envanter ve yeni mutlak çıktı klasörü gerekir.");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8")) as { path: string; sha256: string; group: string }[];
fs.mkdirSync(output);
const seen = new Set<string>();
const reports = [];
for (const input of inventory.filter(i => /\.ide10$/i.test(i.path) && !/iskele/i.test(i.path))) {
  if (seen.has(input.sha256)) continue;
  seen.add(input.sha256);
  const bytes = Uint8Array.from(fs.readFileSync(input.path)); assert.equal(sha(bytes), input.sha256);
  const project = parseIde10(bytes.buffer, path.basename(input.path));
  const report = nativeImportCoverage(importIdeWorkspace(project), { sha256: sha(bytes), bytes: bytes.length });
  const first = project.elements.find(e => e.planAnnotation?.loads), carrier = validateIdeCarrier(bytes);
  let mutation: unknown = { status: "not_exercised", reason: "No plain v10 load observation" };
  if (first?.planAnnotation?.loads && carrier.encodedFlag === 0) {
    const observed = first.planAnnotation.loads, offset = observed.sourceOffset + (first.foundation ? 16 : -16);
    assert.equal(new DataView(bytes.buffer).getFloat64(offset, true), observed.dead);
    const changed = bytes.slice(), nextDead = observed.dead + .125;
    new DataView(changed.buffer).setFloat64(offset, nextDead, true);
    sealIdeCarrierHeader(changed, { formatVersion: carrier.formatVersion, encodedFlag: 0 });
    const changedProject = parseIde10(changed.buffer, "controlled-memory-copy.ide10");
    const changedReport = nativeImportCoverage(importIdeWorkspace(changedProject), { sha256: sha(changed), bytes: changed.length });
    const changedIds = [];
    for (const r of report.records) {
      const next = changedReport.records.find(n => n.elementId === r.elementId)!;
      assert.ok(next); assert.equal(next.observedLoads?.live, r.observedLoads?.live);
      if (next.observedLoads?.dead !== r.observedLoads?.dead) changedIds.push(r.elementId);
    }
    assert.deepEqual(changedIds, [first.id]);
    assert.equal(changedReport.records.find(r => r.elementId === first.id)?.observedLoads?.dead, nextDead);
    assert.equal(changedReport.engineeringAcceptance, false);
    mutation = { status: "pass", changedIds, offset, inputSha256: sha(changed), originalDead: observed.dead, changedDead: nextDead, solverInput: false };
  }
  assert.equal(sha(fs.readFileSync(input.path)), input.sha256);
  const folder = path.join(output, `project-${reports.length + 1}`); fs.mkdirSync(folder);
  fs.writeFileSync(path.join(folder, "IMPORT_COVERAGE.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(folder, "verification.json"), JSON.stringify({ sourcePath: input.path, sourceSha256: input.sha256, mutation, engineeringAcceptance: false }, null, 2));
  reports.push({ group: input.group, sourceSha256: input.sha256, counts: report.counts, mutation });
}
assert.equal(reports.length, 3, "Üç ayrı gerçek betonarme kaynak gerekli.");
fs.writeFileSync(path.join(output, "manifest.json"), JSON.stringify({ reports, engineeringAcceptance: false }, null, 2));
console.log(JSON.stringify(reports));
