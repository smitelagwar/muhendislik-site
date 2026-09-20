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
import { compileCanonicalToScene } from "../../../src/lib/cad-v2/compile/scene-compiler";

export interface CompileChildArgs {
  inputPath: string;
  outputPath: string;
  sourceVersionKey?: string;
}

export async function runCompileChild(args: CompileChildArgs): Promise<void> {
  const { inputPath, outputPath, sourceVersionKey = "v1" } = args;

  if (!fs.existsSync(inputPath)) {
    throw new Error(`[CompilerChild] Girdi dosyası bulunamadı: ${inputPath}`);
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

  const compiled = compileCanonicalToScene(canonical);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Manifest yaz
  fs.writeFileSync(
    path.join(outputPath, "manifest.json"),
    JSON.stringify(compiled.manifest, null, 2),
    "utf-8"
  );

  // Parçaları (chunks) yaz
  for (const [chunkId, chunkBytes] of compiled.chunks) {
    fs.writeFileSync(path.join(outputPath, `${chunkId}.bin`), chunkBytes);
  }

  console.log(`[CompilerChild] Derleme başarıyla tamamlandı: ${compiled.manifest.sceneId}`);
}

// Doğrudan CLI olarak çağrıldığında
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputArg = process.argv[2];
  const outputArg = process.argv[3] || path.join(process.cwd(), "out_scene");
  if (!inputArg) {
    console.error("Kullanım: node compiler-child.js <input.dwg|dxf> [output_dir]");
    process.exit(1);
  }
  runCompileChild({ inputPath: inputArg, outputPath: outputArg })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[CompilerChild] Hata:", err);
      process.exit(1);
    });
}
