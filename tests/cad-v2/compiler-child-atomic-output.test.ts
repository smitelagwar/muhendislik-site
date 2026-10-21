import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runCompileChild } from "../../services/cad-v2-compiler/src/compiler-child";
import { computeSceneIdentity } from "../../src/lib/cad-v2/service/scene-identity";

const SAMPLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
11
100
21
0
0
CIRCLE
8
0
10
50
20
50
40
25
0
ENDSEC
0
EOF
`;

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cad-v2-child-atomic-"));
  try {
    const inputPath = path.join(root, "source.dxf");
    fs.writeFileSync(inputPath, SAMPLE_DXF, "utf8");

    const existingOutput = path.join(root, "existing-scene");
    fs.mkdirSync(existingOutput);
    fs.writeFileSync(path.join(existingOutput, "sentinel.txt"), "keep-existing-artifact", "utf8");
    await assert.rejects(
      () => runCompileChild({ inputPath, outputPath: existingOutput, sourceVersionKey: "rev-must-not-overwrite" }),
      /output path already exists/i,
      "child must fail closed when an immutable output generation already exists"
    );
    assert.equal(fs.readFileSync(path.join(existingOutput, "sentinel.txt"), "utf8"), "keep-existing-artifact");
    assert.equal(fs.existsSync(path.join(existingOutput, "manifest.json")), false,
      "failed publish must not add a manifest to an existing generation");

    const outputPath = path.join(root, "new-scene");
    await runCompileChild({
      inputPath,
      outputPath,
      sourceVersionKey: "rev-atomic-child-7",
      fileId: "file-atomic-child-7",
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(outputPath, "manifest.json"), "utf8"));
    assert.equal(manifest.sourceVersionKey, "rev-atomic-child-7", "authoritative source revision reaches the manifest");
    assert.equal(manifest.sourceSha256, crypto.createHash("sha256").update(fs.readFileSync(inputPath)).digest("hex"));
    assert.equal(manifest.sceneId, computeSceneIdentity({
      fileId: "file-atomic-child-7",
      sourceSha256: manifest.sourceSha256,
      authoritativeRevision: "rev-atomic-child-7",
    }).sceneId, "durable file identity must reach the child compiler's deterministic scene ID");

    const expectedNames = new Set(["manifest.json"]);
    for (const chunk of manifest.chunks) {
      const name = `${chunk.chunkId}.bin`;
      expectedNames.add(name);
      const bytes = fs.readFileSync(path.join(outputPath, name));
      assert.equal(bytes.byteLength, chunk.byteLength, `${name} byte length matches manifest`);
      assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), chunk.sha256, `${name} digest matches manifest`);
    }
    for (const page of manifest.indexPages ?? []) {
      const name = `index_${page.indexId}.json`;
      expectedNames.add(name);
      const bytes = fs.readFileSync(path.join(outputPath, name));
      assert.equal(bytes.byteLength, page.byteLength, `${name} byte length matches manifest`);
      assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), page.sha256, `${name} digest matches manifest`);
    }
    for (const page of manifest.metadataPages ?? []) {
      const name = `meta_${page.metadataId}.json`;
      expectedNames.add(name);
      const bytes = fs.readFileSync(path.join(outputPath, name));
      assert.equal(bytes.byteLength, page.byteLength, `${name} byte length matches manifest`);
      assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), page.sha256, `${name} digest matches manifest`);
    }
    assert.deepEqual(fs.readdirSync(outputPath).sort(), [...expectedNames].sort(),
      "published directory contains exactly the manifest-declared artifacts");
    assert.equal(fs.readdirSync(root).filter((name) => name.startsWith(".cad-v2-compiler-" )).length, 0,
      "atomic staging directory is removed after publish");
    console.log("compiler child atomic output and artifact set PASS");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
