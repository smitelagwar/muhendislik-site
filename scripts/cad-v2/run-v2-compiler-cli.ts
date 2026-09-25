// ============================================================================
// DWG/DXF MOTOR V2 — CLI SCENE COMPILER (STANDALONE)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G05)
// Kullanım: npx tsx scripts/cad-v2/run-v2-compiler-cli.ts [--input <path>] [--output <dir>]

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";

interface CliOptions {
  inputPath: string;
  outputDir: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let inputPath = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  let outputDir = path.resolve(process.cwd(), ".data/cad-v2-scenes");

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      inputPath = path.resolve(process.cwd(), args[i + 1]);
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      outputDir = path.resolve(process.cwd(), args[i + 1]);
      i++;
    } else if (!args[i].startsWith("--")) {
      inputPath = path.resolve(process.cwd(), args[i]);
    }
  }

  return { inputPath, outputDir };
}

export async function runCompilerCli(options: CliOptions): Promise<{
  sceneId: string;
  manifestPath: string;
  chunkPaths: string[];
  entityCount: number;
}> {
  const startTime = Date.now();
  console.log(`\n========================================================`);
  console.log(`[CAD V2 COMPILER CLI] Başlatılıyor...`);
  console.log(`Girdi dosyası: ${options.inputPath}`);
  console.log(`Çıktı dizini:  ${options.outputDir}`);
  console.log(`========================================================\n`);

  if (!fs.existsSync(options.inputPath)) {
    throw new Error(`Girdi dosyası bulunamadı: ${options.inputPath}`);
  }

  const rawBytes = fs.readFileSync(options.inputPath);
  const fileHash = crypto.createHash("sha256").update(rawBytes).digest("hex");
  const fileName = path.basename(options.inputPath);
  const ext = path.extname(options.inputPath).toLowerCase();

  console.log(`Kaynak boyutu: ${rawBytes.byteLength.toLocaleString()} bayt`);
  console.log(`Kaynak SHA-256: ${fileHash}`);

  // 1. Dosya türünü tespit et ve decode et
  let canonicalDoc: CadCanonicalDocument;
  const isDxf = ext === ".dxf" || (rawBytes[0] === 0x30 && rawBytes[1] === 0x0a);

  if (isDxf) {
    console.log(`-> DXF Adaptörü (@mlightcad/data-model) çalıştırılıyor...`);
    canonicalDoc = await parseDxfToCanonical(rawBytes, { sourceSha256: fileHash, sourceVersionKey: fileName });
  } else {
    console.log(`-> DWG Adaptörü (@mlightcad/libredwg-web) çalıştırılıyor...`);
    canonicalDoc = await parseDwgToCanonical(rawBytes, { sourceSha256: fileHash, sourceVersionKey: fileName });
  }

  console.log(`-> Dekoder tamamlandı. Model alanı varlık sayısı: ${canonicalDoc.modelSpaceEntities.length}`);
  console.log(`-> Katman sayısı: ${Object.keys(canonicalDoc.layers).length}`);

  // 2. Sahneye derle (DV2SCN01)
  console.log(`-> Sahne derleyicisi çalıştırılıyor (DV2SCN01 ikili formatı)...`);
  const { computeSceneIdentity } = await import("../../src/lib/cad-v2/service/scene-identity");
  const idResult = computeSceneIdentity({
    fileId: fileName,
    sourceSha256: fileHash,
    authoritativeRevision: fileName,
  });
  const compiled = compileCanonicalToScene(canonicalDoc, {
    sceneId: idResult.sceneId,
    authoritativeRevision: fileName,
    fileId: fileName,
  });

  // 3. Çıktı dizinine kaydet
  const targetSceneDir = path.join(options.outputDir, compiled.manifest.sceneId);
  fs.mkdirSync(targetSceneDir, { recursive: true });

  const manifestPath = path.join(targetSceneDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(compiled.manifest, null, 2), "utf-8");
  console.log(`-> Manifest yazıldı: ${manifestPath}`);

  if (compiled.indexFiles) {
    for (const [idxId, idxContent] of compiled.indexFiles.entries()) {
      fs.writeFileSync(path.join(targetSceneDir, `index_${idxId}.json`), idxContent, "utf-8");
    }
  }
  if (compiled.metadataFiles) {
    for (const [metaId, metaContent] of compiled.metadataFiles.entries()) {
      fs.writeFileSync(path.join(targetSceneDir, `meta_${metaId}.json`), metaContent, "utf-8");
    }
  }

  const chunkPaths: string[] = [];
  for (const [chunkId, chunkBytes] of compiled.chunks.entries()) {
    const chunkPath = path.join(targetSceneDir, `${chunkId}.bin`);
    fs.writeFileSync(chunkPath, chunkBytes);
    chunkPaths.push(chunkPath);

    const actualHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
    const manifestChunk = compiled.manifest.chunks.find((c) => c.chunkId === chunkId);
    if (!manifestChunk || manifestChunk.sha256 !== actualHash) {
      throw new Error(`Parça SHA-256 tutarsızlığı! chunkId: ${chunkId}`);
    }
    console.log(`-> Parça yazıldı: ${chunkPath} (${chunkBytes.byteLength.toLocaleString()} bayt, hash: ${actualHash.slice(0, 16)}...)`);
  }

  const durationMs = Date.now() - startTime;
  console.log(`\n========================================================`);
  console.log(`[CAD V2 COMPILER CLI] Başarıyla Tamamlandı!`);
  console.log(`Sahne ID:      ${compiled.manifest.sceneId}`);
  console.log(`BBox:          [${compiled.manifest.layouts[0].bbox.map((n) => n.toFixed(2)).join(", ")}]`);
  console.log(`Toplam süre:   ${durationMs} ms`);
  console.log(`========================================================\n`);

  return {
    sceneId: compiled.manifest.sceneId,
    manifestPath,
    chunkPaths,
    entityCount: canonicalDoc.modelSpaceEntities.length,
  };
}

// CLI doğrudan çalıştırıldığında
if (process.argv[1] && process.argv[1].includes("run-v2-compiler-cli")) {
  const opts = parseArgs();
  runCompilerCli(opts)
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("[CAD V2 COMPILER CLI] HATA:", err);
      process.exit(1);
    });
}
