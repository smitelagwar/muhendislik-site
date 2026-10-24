import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence=dirname(fileURLToPath(import.meta.url)),root=resolve(evidence,"../..");
const sources=["src/lib/belge-filename.ts","src/lib/pdf-engine.ts","src/lib/belge-paylasim/server-pdf.ts","tests/belgeler/belge-share-stage12.test.ts","tests/belgeler/fixtures/stage12-cases.ts","tests/belgeler/fixtures/stage12-rejected-upload.ts","docs/BELGELER_SISTEMI.md"];
const artifacts=readdirSync(evidence,{recursive:true}).filter(file=>(file.startsWith("ASAMA_12")||file.startsWith("run-stage12-"))&&!file.endsWith("ASAMA_12_changes.json")&&/\.(?:md|json|log|tap|txt|ts|mjs|pdf|png)$/.test(file)).map(file=>`docs/belgeler-paylasim-v3-uygulama/${file.replaceAll("\\","/")}`);
const files=[...sources,...artifacts].sort().map(file=>({file,sha256:createHash("sha256").update(readFileSync(resolve(root,file))).digest("hex")}));
const worktree_digest=createHash("sha256").update(JSON.stringify(files)).digest("hex");
writeFileSync(resolve(evidence,"ASAMA_12_changes.json"),JSON.stringify({algorithm:"SHA-256 of sorted file paths/hashes; excludes STATE and manifest itself",worktree_digest,files},null,2)+"\n");
console.log(JSON.stringify({worktree_digest,fileCount:files.length}));
