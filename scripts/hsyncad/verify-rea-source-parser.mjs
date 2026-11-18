import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

// Yalnız geliştirme doğrulaması: yerel REA kaynak kodu ürün importu değildir.
const [reaRoot, evidencePath, outputPath] = process.argv.slice(2);
const phase = name => process.stdout.write(`${new Date().toISOString()} ${name}\n`);
phase('read-evidence');
const bundle = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const record = bundle.records.find(r => r.operation === 'inspect_pe_resources');
assert.ok(record);
const artifact = record.normalized_result.artifact;
const bytes = fs.readFileSync(artifact.path);
const sha = input => createHash('sha256').update(input).digest('hex');
assert.equal(sha(bytes), artifact.sha256);
// Kaynak repo içinde binlerce modülü tsx ile ayrı ayrı yüklemek yerine yalnız
// seçilen parserın bağımlılıklarını yerel araştırma bundle'ına derle.
phase('bundle-source');
const bundlePath = path.join(path.dirname(outputPath), 'rea-source-parser-bundle.mjs');
const compilation = await build({ entryPoints: [path.join(reaRoot, 'src/native/pe/PeResourceParser.ts')],
  outfile: bundlePath, bundle: true, format: 'esm', platform: 'node', metafile: true,
  banner: { js: 'import {createRequire} from "node:module";const require=createRequire(import.meta.url);' } });
fs.writeFileSync(`${bundlePath}.meta.json`, JSON.stringify(compilation.metafile, null, 2));
phase('import-bundle');
const { parsePeResources } = await import(pathToFileURL(bundlePath).href);
phase('parse-real-exe');
const parsed = await parsePeResources(bytes, record.normalized_result.artifact, record.parameters);
phase('compare-resource-identity');
// Checkout ana dalı daha geniş directory metadata'sı içerebilir. Kaynaklar,
// payload hash/konumları, kimlikler ve kapsama ölçüleri tam karşılaştırılır.
assert.deepEqual(parsed.resources, record.normalized_result.resources, 'Repo kaynak parserı ile MCP kaynakları farklı');
assert.deepEqual(parsed.coverage, record.normalized_result.coverage);
await assert.rejects(() => parsePeResources(bytes.subarray(0, 512), record.normalized_result.artifact, record.parameters));
await assert.rejects(() => parsePeResources(bytes, record.normalized_result.artifact, { ...record.parameters, max_entries: 1 }));
assert.equal(sha(fs.readFileSync(artifact.path)), artifact.sha256);
const sources = ['src/native/pe/PeResourceParser.ts', 'src/native/pe/PeResourceLayout.ts',
  'src/application/binaryDiagnostics/PeResourcesService.ts', 'src/ghidra/GhidraInstallation.ts'];
const result = { checkedAt: new Date().toISOString(), repoPath: reaRoot,
  repoHead: execFileSync('git', ['-C', reaRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceHashes: Object.fromEntries(sources.map(p => [p, sha(fs.readFileSync(path.join(reaRoot, p)))])),
  evidenceId: record.evidence_id, artifact: parsed.artifact, coverage: parsed.coverage,
  bundleSha256: sha(fs.readFileSync(bundlePath)), bundledSourceFiles: Object.keys(compilation.metafile.inputs).length,
  checks: { exactMcpResourceParity: 'pass', truncatedPeRejected: 'pass',
    capacityExhaustionRejected: 'pass', originalExeUnchanged: 'pass' },
  limitation: 'Kaynak parsePeResources doğrudan çalıştırıldı. Repo CLI build ve Windows native provider kabulü değildir.' };
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result)}\n`);
