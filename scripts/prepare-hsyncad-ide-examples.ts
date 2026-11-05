import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { IDE_EXAMPLES } from "../src/lib/hsyncad/ide-examples";
import { parseIde10 } from "../src/lib/hsyncad/ide-import";
import { importIdeWorkspace } from "../src/lib/hsyncad/ide-workspace";

async function main() {
  const config = JSON.parse(await readFile(".data/hsyncad/ide-examples.json", "utf8")) as Record<string, string>;
  const directory = path.resolve("public/hsyncad/examples");
  await mkdir(directory, { recursive: true });
  const manifest = [];
  for (const sample of IDE_EXAMPLES) {
    if (!config[sample.id]) throw new Error(`Missing local source: ${sample.id}`);
    const bytes = await readFile(config[sample.id]);
    const project = parseIde10(Uint8Array.from(bytes).buffer, path.basename(config[sample.id]));
    const model = importIdeWorkspace(project), snapshot = JSON.stringify(model);
    const filename = `${sample.id}.hsyncad`;
    await writeFile(path.join(directory, filename), snapshot);
    const item = { id: sample.id, filename, sourceFilename: project.filename, sourceSha256: createHash("sha256").update(bytes).digest("hex"), sha256: createHash("sha256").update(snapshot).digest("hex"), bytes: Buffer.byteLength(snapshot), floors: model.floors.length, editable: model.elements.length, references: model.ideImport!.references.length, decoded: project.elements.length };
    manifest.push(item); console.log(JSON.stringify(item));
  }
  await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
