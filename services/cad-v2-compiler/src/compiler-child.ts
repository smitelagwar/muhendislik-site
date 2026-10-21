// ============================================================================
// CAD V2 COMPILER SERVICE — CHILD PROCESS (G11, D09)
// ============================================================================
// Her parse işi için izole bellek alanında tek seferlik çalıştırılan child process.
// Dwg_Data pointer'ı finally içinde doğru free edilir, exit code 0 döner.

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { parseDwgToCanonical } from "../../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene, type CompiledSceneOutput } from "../../../src/lib/cad-v2/compile/scene-compiler";
import { computeSceneIdentity } from "../../../src/lib/cad-v2/service/scene-identity";
import { FontLayoutEngine } from "../../../src/lib/cad-v2/text/font-layout-engine";

export interface CompileChildArgs {
  inputPath: string;
  outputPath: string;
  sourceVersionKey?: string;
  fileId?: string;
}

function verifyCompiledArtifactSets(compiled: Awaited<ReturnType<typeof compileCanonicalToScene>>): void {
  const manifestChunkPages = new Map(compiled.manifest.chunks.map((page) => [page.chunkId, page]));
  if (manifestChunkPages.size !== compiled.chunks.size ||
      [...compiled.chunks.keys()].some((id) => !manifestChunkPages.has(id))) {
    throw new Error("[CompilerChild] Manifest ve chunk kümesi eşleşmiyor.");
  }
  for (const [id, bytes] of compiled.chunks) {
    const page = manifestChunkPages.get(id)!;
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    if (page.byteLength !== bytes.byteLength || page.sha256 !== sha256) {
      throw new Error(`[CompilerChild] Chunk bütünlüğü uyuşmuyor: ${id}`);
    }
  }

  const verifyTextArtifacts = (
    label: string,
    pages: Array<{ indexId?: string; metadataId?: string; byteLength: number; sha256: string }>,
    files: Map<string, string> | undefined,
    idField: "indexId" | "metadataId",
  ) => {
    const sourcePages = new Map(pages.map((page) => [page[idField]!, page]));
    const sourceFiles = files ?? new Map<string, string>();
    if (sourcePages.size !== sourceFiles.size ||
        [...sourceFiles.keys()].some((id) => !sourcePages.has(id))) {
      throw new Error(`[CompilerChild] Manifest ve ${label} kümesi eşleşmiyor.`);
    }
    for (const [id, content] of sourceFiles) {
      const page = sourcePages.get(id)!;
      const bytes = Buffer.from(content, "utf8");
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
      if (page.byteLength !== bytes.byteLength || page.sha256 !== sha256) {
        throw new Error(`[CompilerChild] ${label} bütünlüğü uyuşmuyor: ${id}`);
      }
    }
  };

  verifyTextArtifacts("index", compiled.manifest.indexPages ?? [], compiled.indexFiles, "indexId");
  verifyTextArtifacts("metadata", compiled.manifest.metadataPages ?? [], compiled.metadataFiles, "metadataId");
}

export async function runCompileChild(args: CompileChildArgs): Promise<void> {
  const { inputPath, outputPath, sourceVersionKey = "v1", fileId } = args;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`[CompilerChild] Girdi dosyası bulunamadı: ${inputPath}`);
  }
  const finalOutputPath = path.resolve(outputPath);
  if (fs.existsSync(finalOutputPath)) {
    throw new Error(`[CompilerChild] output path already exists: ${finalOutputPath}`);
  }

  const fileBytes = fs.readFileSync(inputPath);
  const ext = path.extname(inputPath).toLowerCase();
  const sourceSha256 = crypto.createHash("sha256").update(fileBytes).digest("hex");

  let canonical;
  if (ext === ".dxf") {
    canonical = await parseDxfToCanonical(fileBytes, {
      sourceVersionKey,
      sourceSha256,
    });
  } else if (ext === ".dwg") {
    canonical = await parseDwgToCanonical(fileBytes, {
      sourceVersionKey,
      sourceSha256,
    });
  } else {
    throw new Error(`[CompilerChild] Desteklenmeyen uzantı: ${ext}`);
  }

  const sceneId = fileId
    ? computeSceneIdentity({
        fileId,
        sourceSha256,
        authoritativeRevision: sourceVersionKey,
        fontDigest: FontLayoutEngine.getFontDigest(),
      }).sceneId
    : undefined;
  const compiled = compileCanonicalToScene(canonical, {
    ...(sceneId ? { sceneId, fileId } : {}),
    authoritativeRevision: sourceVersionKey,
  });

  verifyCompiledArtifactSets(compiled);
  fs.mkdirSync(path.dirname(finalOutputPath), { recursive: true });
  const stagingPath = fs.mkdtempSync(path.join(
    path.dirname(finalOutputPath),
    `.cad-v2-compiler-${path.basename(finalOutputPath)}-${process.pid}-`,
  ));
  let published = false;
  try {
    for (const [chunkId, chunkBytes] of compiled.chunks) {
      fs.writeFileSync(path.join(stagingPath, `${chunkId}.bin`), chunkBytes);
    }
    for (const [indexId, content] of compiled.indexFiles ?? []) {
      fs.writeFileSync(path.join(stagingPath, `index_${indexId}.json`), content, "utf8");
    }
    for (const [metadataId, content] of compiled.metadataFiles ?? []) {
      fs.writeFileSync(path.join(stagingPath, `meta_${metadataId}.json`), content, "utf8");
    }

    // Manifest görünür directory'ye yalnız bütün bağımlı dosyalar hazır olduktan sonra taşınır.
    fs.writeFileSync(path.join(stagingPath, "manifest.json"), JSON.stringify(compiled.manifest, null, 2), "utf8");
    if (fs.existsSync(finalOutputPath)) {
      throw new Error(`[CompilerChild] output path already exists: ${finalOutputPath}`);
    }
    fs.renameSync(stagingPath, finalOutputPath);
    published = true;
  } finally {
    if (!published) fs.rmSync(stagingPath, { recursive: true, force: true });
  }

  console.log(`[CompilerChild] Derleme başarıyla tamamlandı: ${compiled.manifest.sceneId}`);
}

/** Read and verify the complete immutable artifact directory produced by this child. */
export function readCompiledSceneOutput(outputPath: string): CompiledSceneOutput {
  const resolvedPath = path.resolve(outputPath);
  const manifest = JSON.parse(fs.readFileSync(path.join(resolvedPath, "manifest.json"), "utf8")) as CompiledSceneOutput["manifest"];
  if (!Array.isArray(manifest.chunks) || !Array.isArray(manifest.indexPages) || !Array.isArray(manifest.metadataPages)) {
    throw new Error("[CompilerChild] Manifest artifact listeleri eksik veya geçersiz.");
  }
  if (
    new Set(manifest.chunks.map((page) => page.chunkId)).size !== manifest.chunks.length ||
    new Set(manifest.indexPages.map((page) => page.indexId)).size !== manifest.indexPages.length ||
    new Set(manifest.metadataPages.map((page) => page.metadataId)).size !== manifest.metadataPages.length
  ) {
    throw new Error("[CompilerChild] Manifest artifact listelerinde yinelenen kimlik var.");
  }

  const assertSafeId = (id: string) => {
    if (!/^[A-Za-z0-9_.-]+$/.test(id) || id.includes("..")) {
      throw new Error(`[CompilerChild] Güvenli olmayan artifact kimliği: ${id}`);
    }
  };
  const chunks = new Map<string, Uint8Array>();
  for (const page of manifest.chunks) {
    assertSafeId(page.chunkId);
    chunks.set(page.chunkId, fs.readFileSync(path.join(resolvedPath, `${page.chunkId}.bin`)));
  }
  const indexFiles = new Map<string, string>();
  for (const page of manifest.indexPages) {
    assertSafeId(page.indexId);
    indexFiles.set(page.indexId, fs.readFileSync(path.join(resolvedPath, `index_${page.indexId}.json`), "utf8"));
  }
  const metadataFiles = new Map<string, string>();
  for (const page of manifest.metadataPages) {
    assertSafeId(page.metadataId);
    metadataFiles.set(page.metadataId, fs.readFileSync(path.join(resolvedPath, `meta_${page.metadataId}.json`), "utf8"));
  }

  const compiled: CompiledSceneOutput = { manifest, chunks, indexFiles, metadataFiles };
  verifyCompiledArtifactSets(compiled);
  const expectedEntries = new Set([
    "manifest.json",
    ...[...chunks.keys()].map((id) => `${id}.bin`),
    ...[...indexFiles.keys()].map((id) => `index_${id}.json`),
    ...[...metadataFiles.keys()].map((id) => `meta_${id}.json`),
  ]);
  const actualEntries = new Set(fs.readdirSync(resolvedPath));
  if (actualEntries.size !== expectedEntries.size || [...actualEntries].some((entry) => !expectedEntries.has(entry))) {
    throw new Error("[CompilerChild] Çocuk çıktısında manifest tarafından listelenmeyen veya eksik artifact var.");
  }
  return compiled;
}
