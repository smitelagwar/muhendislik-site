/**
 * Renders both sözleşme pages to tmp/pdfs for visual QA.
 * Uses PyMuPDF, which is part of the repository's PDF verification toolchain.
 * Run: node scripts/render-sozlesme-preview.mjs
 */
import { mkdirSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const input = join(process.cwd(), "public", "belgeler", "santiye-sefi-sozlesmesi.pdf");
const outputDir = join(process.cwd(), "tmp", "pdfs");
mkdirSync(outputDir, { recursive: true });

const python = String.raw`
import fitz, pathlib, sys
source = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2])
doc = fitz.open(source)
for index, page in enumerate(doc):
    target = out / f"sozlesme-preview-page-{index + 1}.png"
    page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(target)
    print(f"Rendered page {index + 1}: {target}")
`;

const result = spawnSync("python", ["-c", python, input, outputDir], {
  encoding: "utf8",
  stdio: "pipe",
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
