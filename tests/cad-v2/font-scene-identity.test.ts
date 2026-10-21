import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { runCompilerCli } from "../../scripts/cad-v2/run-v2-compiler-cli";
import { runCompileChild } from "../../services/cad-v2-compiler/src/compiler-child";
import { CadV2DurableRepository, type CadV2SqlExecutor, type CadV2SqlStatement } from "../../src/lib/cad-v2/db/repository";
import { applyCadV2DurableRepositoryMigration } from "../../src/lib/cad-v2/db/migrate";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";

const DXF = fs.readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf"),
  "utf8",
);

function createPgliteExecutor(database: PGlite): CadV2SqlExecutor {
  return {
    query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) => {
      const result = await database.query<T>(text, [...params]);
      return result.rows;
    },
    transaction: async (statements: readonly CadV2SqlStatement[]) => {
      await database.exec("BEGIN");
      try {
        const results: unknown[][] = [];
        for (const statement of statements) {
          const result = await database.query(statement.text, [...(statement.params || [])]);
          results.push(result.rows as unknown[]);
        }
        await database.exec("COMMIT");
        return results;
      } catch (error) {
        await database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function assertContainsFiniteGeometry(bytes: Uint8Array, label: string): void {
  const parsed = parseSceneChunk(bytes);
  const xy = parsed.sections.get(SceneTag.XY)?.data;
  assert.ok(xy instanceof Float32Array && xy.length >= 4, `${label} çizgi/metin stroke geometrisini içerir`);
  assert.ok(Array.from(xy).every(Number.isFinite), `${label} geometri koordinatları sonludur`);
  const coordinates = xy as Float32Array;
  const xValues = Array.from(coordinates).filter((_value, index) => index % 2 === 0);
  const yValues = Array.from(coordinates).filter((_value, index) => index % 2 === 1);
  assert.ok(
    Math.max(...xValues) > Math.min(...xValues) || Math.max(...yValues) > Math.min(...yValues),
    `${label} boş/degenerate olmayan bir geometri yayılımı içerir`,
  );
}

async function run(): Promise<void> {
  const originalFontDirectory = path.resolve(process.cwd(), "public/fonts");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `cad-v2-font-identity-${process.pid}-`));
  const fontA = path.join(root, "fonts-a");
  const fontB = path.join(root, "fonts-b");
  const source = Buffer.from(DXF, "utf8");
  const inputPath = path.join(root, "same-source.dxf");
  fs.mkdirSync(fontA, { recursive: true });
  fs.mkdirSync(fontB, { recursive: true });
  fs.writeFileSync(inputPath, source);
  fs.copyFileSync(path.join(originalFontDirectory, "Arial-Regular.ttf"), path.join(fontA, "Arial-Regular.ttf"));
  fs.copyFileSync(path.join(originalFontDirectory, "IBMPlexSerif-Regular.ttf"), path.join(fontB, "Arial-Regular.ttf"));
  let database: PGlite | undefined;

  try {
    const service = new CadV2DurableService(path.join(root, "service-store"));
    const fileId = "font-byte-change";
    const revision = "rev_same_source_font_change";

    FontLayoutEngine.setFontDirectory(fontA);
    FontLayoutEngine.resetFontRegistry();
    const digestA = FontLayoutEngine.getFontDigest();
    const readyA = await service.prepare({
      fileId,
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: revision,
      sourceBuffer: source,
      fileName: "same-source.dxf",
    });
    assert.equal(readyA.status, "ready", "ilk font kataloğuyla durable service sahneyi hazırlar");
    const manifestA = service.getManifest(readyA.sceneId!)!;
    assert.equal(manifestA.dependencyDigest, digestA);
    assertContainsFiniteGeometry(service.getChunk(readyA.sceneId!, manifestA.chunks[0]!.chunkId)!, "ilk servis sahnesi");

    FontLayoutEngine.setFontDirectory(fontB);
    FontLayoutEngine.resetFontRegistry();
    const digestB = FontLayoutEngine.getFontDigest();
    assert.notEqual(digestA, digestB, "font baytları değişince kataloğun gerçek SHA-256 özeti değişir");

    const readyB = await service.prepare({
      fileId,
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: revision,
      sourceBuffer: source,
      fileName: "same-source.dxf",
    });
    assert.equal(readyB.status, "ready", "font byte değişikliği sonrası durable service yeni sahneyi hazırlar");
    assert.notEqual(readyB.sceneId, readyA.sceneId, "font byte değişikliği durable cache hit yerine yeni sceneId üretir");
    const manifestB = service.getManifest(readyB.sceneId!)!;
    assert.equal(manifestB.dependencyDigest, digestB);
    assertContainsFiniteGeometry(service.getChunk(readyB.sceneId!, manifestB.chunks[0]!.chunkId)!, "fontu değişmiş servis sahnesi");

    const cliA = await runCompilerCli({ inputPath, outputDir: path.join(root, "cli-a") });
    const cliManifestA = JSON.parse(fs.readFileSync(cliA.manifestPath, "utf8")) as { dependencyDigest: string; chunks: Array<{ chunkId: string }> };
    assert.equal(cliManifestA.dependencyDigest, digestB);
    assert.equal(cliA.entityCount, 4, "CLI font değişimi sırasında fixture'ın dört kaynak LINE kaydını korur");
    assertContainsFiniteGeometry(fs.readFileSync(path.join(path.dirname(cliA.manifestPath), `${cliManifestA.chunks[0]!.chunkId}.bin`)), "CLI sahnesi");
    FontLayoutEngine.setFontDirectory(fontA);
    FontLayoutEngine.resetFontRegistry();
    const cliB = await runCompilerCli({ inputPath, outputDir: path.join(root, "cli-b") });
    const cliManifestB = JSON.parse(fs.readFileSync(cliB.manifestPath, "utf8")) as { dependencyDigest: string; chunks: Array<{ chunkId: string }> };
    assert.equal(cliManifestB.dependencyDigest, digestA);
    assert.equal(cliB.entityCount, 4, "CLI yeni font kataloğunda fixture'ın dört kaynak LINE kaydını korur");
    assertContainsFiniteGeometry(fs.readFileSync(path.join(path.dirname(cliB.manifestPath), `${cliManifestB.chunks[0]!.chunkId}.bin`)), "fontu değişmiş CLI sahnesi");
    assert.notEqual(cliB.sceneId, cliA.sceneId, "CLI sceneId güncel font kataloğu baytlarına bağlıdır");

    const childAPath = path.join(root, "child-a");
    const childBPath = path.join(root, "child-b");
    await runCompileChild({ inputPath, outputPath: childAPath, sourceVersionKey: revision, fileId });
    const childManifestA = JSON.parse(fs.readFileSync(path.join(childAPath, "manifest.json"), "utf8")) as { sceneId: string; dependencyDigest: string; chunks: Array<{ chunkId: string }> };
    assert.equal(childManifestA.dependencyDigest, digestA);
    assertContainsFiniteGeometry(fs.readFileSync(path.join(childAPath, `${childManifestA.chunks[0]!.chunkId}.bin`)), "compiler child sahnesi");
    FontLayoutEngine.setFontDirectory(fontB);
    FontLayoutEngine.resetFontRegistry();
    await runCompileChild({ inputPath, outputPath: childBPath, sourceVersionKey: revision, fileId });
    const childManifestB = JSON.parse(fs.readFileSync(path.join(childBPath, "manifest.json"), "utf8")) as { sceneId: string; dependencyDigest: string; chunks: Array<{ chunkId: string }> };
    assert.equal(childManifestB.dependencyDigest, digestB);
    assertContainsFiniteGeometry(fs.readFileSync(path.join(childBPath, `${childManifestB.chunks[0]!.chunkId}.bin`)), "fontu değişmiş compiler child sahnesi");
    assert.notEqual(childManifestB.sceneId, childManifestA.sceneId, "compiler child sceneId güncel font kataloğu baytlarına bağlıdır");

    database = new PGlite();
    const executor = createPgliteExecutor(database);
    await applyCadV2DurableRepositoryMigration(executor);
    const repository = new CadV2DurableRepository(executor);
    const repositoryService = new CadV2DurableService(path.join(root, "repository-store"), undefined, repository);
    FontLayoutEngine.setFontDirectory(fontA);
    FontLayoutEngine.resetFontRegistry();
    const pendingA = await repositoryService.prepare({
      fileId: "deferred-font-byte-change",
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: revision,
      deferCompilation: true,
    });
    assert.equal(pendingA.status, "preparing", "kaynak alınmadan deferred prepare job oluşturur");
    FontLayoutEngine.setFontDirectory(fontB);
    FontLayoutEngine.resetFontRegistry();
    const pendingB = await repositoryService.prepare({
      fileId: "deferred-font-byte-change",
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: revision,
      deferCompilation: true,
    });
    assert.equal(pendingB.status, "preparing", "font kataloğu değişince yeni deferred prepare job oluşturur");
    assert.notEqual(pendingB.jobId, pendingA.jobId, "kaynak SHA henüz yokken durable artifact dedupe font digest değişimini ayırır");

    console.log("PASS: durable service, CLI ve compiler child font baytı değişince yeni scene identity üretir");
  } finally {
    await database?.close();
    FontLayoutEngine.setFontDirectory(originalFontDirectory);
    FontLayoutEngine.resetFontRegistry();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
