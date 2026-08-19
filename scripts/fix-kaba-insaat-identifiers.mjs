import fs from "fs";
import path from "path";

const targetFiles = [
  "src/lib/bina-asamalari-content/pages/kaba-insaat-concrete-batch-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-curing-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-donati-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-formwork-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-frame-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-leaf-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-leaves.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-masonry-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-masonry-topic-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-rebar-roof-batch-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat-structural-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/kaba-insaat.ts",
  "src/lib/bina-asamalari-content/pages/structure-envelope-batch-deep-overrides.ts",
  "src/lib/bina-asamalari-content/pages/teras-cati-deep-overrides.ts"
];

for (const relPath of targetFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, "utf-8");
  let modified = content
    .replace(/BRANCH_SOURCE_LEDGER\["kaba-inşaat"\]/g, 'BRANCH_SOURCE_LEDGER["kaba-insaat"]')
    .replace(/from "\.\/kaba-inşaat-leaves"/g, 'from "./kaba-insaat-leaves"');

  if (modified !== content) {
    fs.writeFileSync(fullPath, modified, "utf-8");
    console.log("Restored code identifier in:", relPath);
  }
}
