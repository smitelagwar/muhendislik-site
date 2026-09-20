// ============================================================================
// G00: DWG/DXF MOTOR V2 BASELINE & REPO FINGERPRINT VERIFICATION SCRIPT
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

interface VerificationResult {
  step: string;
  status: "PASS" | "FAIL";
  details: Record<string, unknown>;
}

const results: VerificationResult[] = [];

function sha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

console.log("=== DWG/DXF Motor V2 - G00 Baseline Doğrulama ===");

// 1. Korunan Çekirdek Dosyaların Parmak İzi Doğrulaması
const PROTECTED_CORE_FILES: Record<string, string> = {
  "src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx":
    "85e47c8a2610a327eefb6747a1ecdacb0e6b84e3a7d85d1a0b79878f471b7748",
  "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx":
    "3e8f10cc6fbc4ce8d32c527aab6dbd8903077872c491279e4f949e1e914a450a",
  "src/components/dokumantasyon/preview/cad-viewer.tsx":
    "0015c7749d9a5499b39286c5cb53c132f03d5d550c5d91455bd2726506410957",
  "src/components/dokumantasyon/preview/dxf-viewer-worker.ts":
    "181f17b9fcc7e41c4ef2d46972b78fec10023f267c2db20a1db62d6735dde1a7",
};

let corePass = true;
const coreDetails: Record<string, { current: string; expected: string; match: boolean }> = {};

for (const [relPath, expectedHash] of Object.entries(PROTECTED_CORE_FILES)) {
  const absPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    corePass = false;
    coreDetails[relPath] = { current: "FILE_MISSING", expected: expectedHash, match: false };
    continue;
  }
  const currentHash = sha256(absPath);
  const match = currentHash === expectedHash;
  if (!match) corePass = false;
  coreDetails[relPath] = { current: currentHash, expected: expectedHash, match };
}

results.push({
  step: "PROTECTED_CORE_FINGERPRINT",
  status: corePass ? "PASS" : "FAIL",
  details: coreDetails,
});

// 2. Gerçek Corpus Dosyalarının (R001–R004) Varlık ve Hash Doğrulaması
const manifestPath = path.resolve(process.cwd(), "tests/cad-v2/fixtures-manifest.json");
let corpusPass = true;
const corpusDetails: Record<string, { exists: boolean; sizeBytes: number; hashMatch: boolean }> = {};

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  for (const item of manifest.realCorpus) {
    const fileAbs = path.resolve(process.cwd(), item.relativePath);
    if (!fs.existsSync(fileAbs)) {
      corpusPass = false;
      corpusDetails[item.id] = { exists: false, sizeBytes: 0, hashMatch: false };
      continue;
    }
    const stat = fs.statSync(fileAbs);
    const hash = sha256(fileAbs);
    const sizeOk = stat.size === item.sizeBytes;
    const hashOk = hash === item.sha256;
    if (!sizeOk || !hashOk) corpusPass = false;
    corpusDetails[item.id] = { exists: true, sizeBytes: stat.size, hashMatch: hashOk };
  }
} else {
  corpusPass = false;
}

results.push({
  step: "REAL_CORPUS_INTEGRITY",
  status: corpusPass ? "PASS" : "FAIL",
  details: corpusDetails,
});

// 3. Sabit Kütüphane Sürümlerinin Doğrulaması
const REQUIRED_PACKAGES: Record<string, string> = {
  "@mlightcad/libredwg-web": "0.7.10",
  "@mlightcad/data-model": "1.14.2",
  "@mlightcad/shx-parser": "1.4.5",
  "@mlightcad/mtext-parser": "1.5.0",
  "opentype.js": "1.3.4",
  "earcut": "3.2.3",
  "three": "0.172.0",
  "d3-zoom": "3.0.0",
  "d3-selection": "3.0.0",
  "d3-drag": "3.0.0",
};

let depsPass = true;
const depsDetails: Record<string, { current: string; expected: string; match: boolean }> = {};

for (const [pkgName, expectedVer] of Object.entries(REQUIRED_PACKAGES)) {
  try {
    const pkgJsonPath = path.resolve(process.cwd(), "node_modules", pkgName, "package.json");
    if (!fs.existsSync(pkgJsonPath)) {
      depsPass = false;
      depsDetails[pkgName] = { current: "MISSING", expected: expectedVer, match: false };
      continue;
    }
    const pkgData = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const match = pkgData.version === expectedVer;
    if (!match) depsPass = false;
    depsDetails[pkgName] = { current: pkgData.version, expected: expectedVer, match };
  } catch (err: unknown) {
    depsPass = false;
    depsDetails[pkgName] = { current: String(err), expected: expectedVer, match: false };
  }
}

results.push({
  step: "REQUIRED_PACKAGES_VERSION_CHECK",
  status: depsPass ? "PASS" : "FAIL",
  details: depsDetails,
});

// 4. Test İzolasyon Kontrolü (.data/dok_db.json korunması)
const dokDbPath = path.resolve(process.cwd(), ".data/dok_db.json");
const dokDbExists = fs.existsSync(dokDbPath);
const dokDbHash = dokDbExists ? sha256(dokDbPath) : "NONE";

results.push({
  step: "TEST_DATA_ISOLATION",
  status: dokDbExists ? "PASS" : "FAIL",
  details: { dokDbPath, exists: dokDbExists, sha256: dokDbHash },
});

console.log(JSON.stringify(results, null, 2));

const allPassed = results.every((r) => r.status === "PASS");
if (allPassed) {
  console.log("\n>>> G00 BASELINE DOĞRULAMASI BAŞARILI (PASS) <<<");
  process.exit(0);
} else {
  console.error("\n>>> G00 BASELINE DOĞRULAMASINDA HATA (FAIL) <<<");
  process.exit(1);
}
