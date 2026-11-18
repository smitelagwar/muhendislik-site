import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseIde10 } from '../../src/lib/hsyncad/ide-import/index.ts';
import { importIdeWorkspace } from '../../src/lib/hsyncad/ide-workspace.ts';
import { sealIdeCarrierHeader } from '../../src/lib/hsyncad/ide-import/ide-binary-codec.ts';

// Özel kaynak yolları CLI envanterindedir; üretim motoruna cevap anahtarı eklenmez.
const [inventoryPath, outputPath] = process.argv.slice(2);
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const results = [];
const seen = new Set();
for (const entry of inventory.filter(e => /\.ide10$/i.test(e.path) && !/iskele/i.test(e.path))) {
  if (seen.has(entry.sha256)) continue; // Downloads ve özgün aynı kaynaksa iki proje sayılmaz.
  seen.add(entry.sha256);
  const bytes = Uint8Array.from(fs.readFileSync(entry.path));
  assert.equal(sha(bytes), entry.sha256, 'Kaynak envanter kimliği değişti');
  const project = parseIde10(bytes.buffer, path.basename(entry.path));
  const mapped = importIdeWorkspace(project);
  const view = new DataView(bytes.buffer);
  const loads = project.elements.filter(e => e.planAnnotation?.loads).map(e => {
    const load = e.planAnnotation.loads;
    const qOffset = load.sourceOffset;
    const gOffset = qOffset + 16;
    assert.equal(view.getFloat64(qOffset, true), load.live);
    assert.equal(view.getFloat64(gOffset, true), load.dead);
    return { nativeId: e.nativeId, elementId: e.id, name: e.name, floorId: e.floorId,
      recordNameOffset: e.sourceOffset, q: { value: load.live, offset: qOffset, bytes: 8 },
      g: { value: load.dead, offset: gOffset, bytes: 8 }, encoding: 'float64-le', unit: load.unit,
      selfWeightIncluded: 'unknown', materialId: null };
  });
  assert.ok(loads.length > 0);
  const picked = loads[0];
  const altered = bytes.slice();
  const alteredView = new DataView(altered.buffer);
  const replacement = picked.g.value === 0.1234 ? 0.2345 : 0.1234;
  alteredView.setFloat64(picked.g.offset, replacement, true);
  sealIdeCarrierHeader(altered, { formatVersion: 201094, encodedFlag: 0 });
  const changed = parseIde10(altered.buffer, 'private-memory-mutation.ide10');
  assert.equal(changed.elements.find(e => e.nativeId === picked.nativeId && e.floorId === picked.floorId).planAnnotation.loads.dead, replacement);
  for (const other of loads.slice(1)) {
    const actual = changed.elements.find(e => e.id === other.elementId).planAnnotation.loads;
    assert.equal(actual.dead, other.g.value);
    assert.equal(actual.live, other.q.value);
  }
  const invalid = bytes.slice();
  new DataView(invalid.buffer).setFloat64(picked.g.offset, Number.NaN, true);
  sealIdeCarrierHeader(invalid, { formatVersion: 201094, encodedFlag: 0 });
  assert.equal(parseIde10(invalid.buffer, 'invalid-memory-mutation.ide10').elements.find(e => e.id === picked.elementId).planAnnotation?.loads, undefined);
  assert.throws(() => parseIde10(bytes.slice(0, -1).buffer, 'truncated.ide10'));
  assert.equal(sha(fs.readFileSync(entry.path)), entry.sha256);
  results.push({ group: entry.group, source: { path: entry.path, sha256: entry.sha256, bytes: bytes.length },
    format: project.format, floors: project.floors, decoded: project.elements.length,
    loads, mappedLoads: mapped.elements.filter(e => e.finishLoad !== undefined || e.liveLoad !== undefined).length,
    mappedMaterials: mapped.materials, mappedElements: mapped.elements.length,
    references: mapped.ideImport.references.length,
    engineeringUnknown: ['physical material class/strength', 'G self-weight convention', 'soil/spectrum/analysis settings',
      'reinforcement layout/cut list', 'saved result revision', 'load consumers in ideCAD'],
    verification: { sourceHashBeforeAfter: 'pass', rawBytesMatchParser: 'pass',
      oneFieldMutationIsolation: 'pass', nanFieldOmitted: 'pass', truncatedCarrierRejected: 'pass' } });
}
assert.equal(results.length, 3, 'Üç betonarme kaynak gerekli');
fs.writeFileSync(outputPath, `${JSON.stringify({ checkedAt: new Date().toISOString(), authority: 'derived',
  note: 'Mevcut parserın kaynak baytlarıyla yeniden doğrulanması; G öz ağırlık semantiği veya donatı hesabı kabulü değildir.',
  sourceHashes: Object.fromEntries(['src/lib/hsyncad/ide-import/index.ts', 'src/lib/hsyncad/ide-workspace.ts'].map(p => [p, sha(fs.readFileSync(p))])),
  projects: results }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(results.map(r => ({ group: r.group, decoded: r.decoded, loads: r.loads.length, mappedLoads: r.mappedLoads, verification: r.verification })))}\n`);
