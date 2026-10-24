import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const sources = ["next.config.ts", "src/app/layout.tsx", "src/app/b/[token]/page.tsx", "src/app/b/[token]/layout.tsx", "src/app/b/[token]/error.tsx", "src/components/site-shell.tsx", "src/components/belge-paylasim/share-access-state.tsx", "src/lib/belge-paylasim/config.ts", "src/lib/belge-paylasim/service-core.ts", "src/app/api/belgeler/paylasim/[token]/pdf/route.ts", "tests/belgeler/belge-share-stage11.test.ts", "tests/belgeler/belge-share-viewer.test.ts", "tests/belgeler/fixtures/stage11-data.ts", "docs/BELGELER_SISTEMI.md"];
const artifacts = readdirSync(evidence).filter(file => (file.startsWith("ASAMA_11") || file.startsWith("run-stage11-")) && file !== "ASAMA_11_changes.json").map(file=>`docs/belgeler-paylasim-v3-uygulama/${file}`);
const files = [...sources,...artifacts].sort().map(file=>({file,sha256:createHash("sha256").update(readFileSync(resolve(root,file))).digest("hex")}));
const deletedFiles = ["src/middleware.ts"];
const worktree_digest = createHash("sha256").update(JSON.stringify({files,deletedFiles})).digest("hex");
writeFileSync(resolve(evidence,"ASAMA_11_changes.json"),JSON.stringify({algorithm:"SHA-256 of sorted file paths/hashes and deleted file list; excludes STATE and manifest itself",worktree_digest,deletedFiles,files},null,2)+"\n");
console.log(JSON.stringify({worktree_digest,fileCount:files.length,deletedFiles}));
