import * as path from "node:path";
import { runCompileChild } from "./compiler-child";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || path.join(process.cwd(), "out_scene");
const sourceVersionKey = process.argv[4] || "v1";
const fileId = process.argv[5] || undefined;

if (!inputPath) {
  console.error("Kullanım: node compiler-child-entry.js <input.dwg|dxf> [output_dir] [source_revision] [file_id]");
  process.exit(1);
}

void runCompileChild({ inputPath, outputPath, sourceVersionKey, fileId }).then(
  () => process.exit(0),
  (error) => {
    console.error("[CompilerChild] Hata:", error);
    process.exit(1);
  },
);
