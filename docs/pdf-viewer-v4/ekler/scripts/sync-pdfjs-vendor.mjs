// pdf.js vendor senkronu (tek doğruluk kaynağı: node_modules/pdfjs-dist).
//   node scripts/sync-pdfjs-vendor.mjs            → public/vendor/pdfjs/v<sürüm>/ üretir, eskileri siler, src/lib/pdfjs-paths.ts'i günceller
//   node scripts/sync-pdfjs-vendor.mjs --check    → bayt bayt doğrular; fark varsa exit 1 (prebuild ve CI için)
//
// NEDEN: (1) Modern build eski tarayıcıda çalışmaz → LEGACY build + compat polyfill kullanılır.
//        (2) Sürüm klasörü adında olduğu için "immutable" önbellek güvenlidir; ana dosya ile worker asla karışmaz.
//        (3) Yükseltme tek komut: npm i -E pdfjs-dist@X && node scripts/sync-pdfjs-vendor.mjs
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const pkgDir = path.join(root, "node_modules", "pdfjs-dist");
const version = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")).version;
const vendorRoot = path.join(root, "public", "vendor", "pdfjs");
const dest = path.join(vendorRoot, `v${version}`);
const pathsFile = path.join(root, "src", "lib", "pdfjs-paths.ts");

const problems = [];

// package.json sürümü SABİT olmalı (^ ve ~ yok): sessiz minor yükseltmesi vendor'ı eskitir.
const rootPkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const declared = rootPkg.dependencies?.["pdfjs-dist"] ?? rootPkg.devDependencies?.["pdfjs-dist"];
if (declared !== version) problems.push(`package.json pdfjs-dist="${declared}" ama kurulu sürüm ${version}. Sabitle: npm i -E pdfjs-dist@${version}`);

const POLYFILL_SRC = path.join(root, "scripts", "pdfjs-compat-polyfills.mjs");
const WORKER_ENTRY = `// OTOMATİK ÜRETİLDİ (scripts/sync-pdfjs-vendor.mjs). Elle düzenleme.\n// Sıra önemli: önce polyfill, sonra gerçek worker.\nimport "./compat-polyfills.mjs";\nimport "./pdf.worker.min.mjs";\n`;

/** hedef yol → kaynak (dosya yolu) | {content} */
const files = new Map();
const add = (rel, src) => files.set(rel, src);
add("pdf.min.mjs", path.join(pkgDir, "legacy/build/pdf.min.mjs"));
add("pdf.worker.min.mjs", path.join(pkgDir, "legacy/build/pdf.worker.min.mjs"));
add("compat-polyfills.mjs", POLYFILL_SRC);
add("worker-entry.mjs", { content: WORKER_ENTRY });
add("LICENSE", path.join(pkgDir, "LICENSE"));
for (const dir of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  const base = path.join(pkgDir, dir);
  if (!fs.existsSync(base)) { problems.push(`pdfjs-dist/${dir} yok`); continue; }
  for (const f of fs.readdirSync(base, { recursive: true })) {
    const full = path.join(base, f);
    if (fs.statSync(full).isFile()) add(path.join(dir, f).split(path.sep).join("/"), full);
  }
}
for (const [rel, src] of files) if (typeof src === "string" && !fs.existsSync(src)) problems.push(`kaynak yok: ${src}`);

const bytesOf = (src) => (typeof src === "string" ? fs.readFileSync(src) : Buffer.from(src.content));
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");

const PATHS_TS = `// OTOMATİK ÜRETİLDİ: scripts/sync-pdfjs-vendor.mjs. Elle düzenleme; sürüm yükseltmek için script'i çalıştır.
// Tek doğruluk kaynağı: pdf.js dosyalarının URL'leri. Sürüm klasörde olduğu için "immutable" önbellek güvenlidir.
export const PDFJS_VERSION = "${version}";
export const PDFJS_BASE = \`/vendor/pdfjs/v\${PDFJS_VERSION}\`;
export const PDFJS_MAIN = \`\${PDFJS_BASE}/pdf.min.mjs\`;
export const PDFJS_POLYFILLS = \`\${PDFJS_BASE}/compat-polyfills.mjs\`;
export const PDFJS_WORKER = \`\${PDFJS_BASE}/worker-entry.mjs\`;
export const PDFJS_CMAPS = \`\${PDFJS_BASE}/cmaps/\`;
export const PDFJS_FONTS = \`\${PDFJS_BASE}/standard_fonts/\`;
export const PDFJS_WASM = \`\${PDFJS_BASE}/wasm/\`;
export const PDFJS_ICCS = \`\${PDFJS_BASE}/iccs/\`;
`;

if (check) {
  if (!fs.existsSync(dest)) problems.push(`${path.relative(root, dest)} yok. Çalıştır: node scripts/sync-pdfjs-vendor.mjs`);
  else {
    for (const [rel, src] of files) {
      const t = path.join(dest, rel);
      if (!fs.existsSync(t)) { problems.push(`eksik: ${rel}`); continue; }
      if (sha(fs.readFileSync(t)) !== sha(bytesOf(src))) problems.push(`değişmiş: ${rel}`);
    }
  }
  if (!fs.existsSync(pathsFile) || fs.readFileSync(pathsFile, "utf8") !== PATHS_TS) problems.push("src/lib/pdfjs-paths.ts güncel değil");
  const stale = fs.existsSync(vendorRoot) ? fs.readdirSync(vendorRoot).filter((n) => n !== `v${version}`) : [];
  if (stale.length) problems.push(`vendor kökünde eski/yabancı girdiler var: ${stale.join(", ")}`);
  if (problems.length) {
    console.error("pdf.js vendor DOĞRULAMASI BAŞARISIZ:\n - " + problems.join("\n - "));
    process.exit(1);
  }
  console.log(`pdf.js vendor tamam: v${version} (${files.size} dosya)`);
  process.exit(0);
}

if (problems.length) {
  console.error("Önce şunları düzelt:\n - " + problems.join("\n - "));
  process.exit(1);
}
fs.mkdirSync(vendorRoot, { recursive: true });
for (const n of fs.readdirSync(vendorRoot)) if (n !== `v${version}`) fs.rmSync(path.join(vendorRoot, n), { recursive: true, force: true });
fs.rmSync(dest, { recursive: true, force: true });
const manifest = {};
for (const [rel, src] of files) {
  const b = bytesOf(src);
  const t = path.join(dest, rel);
  fs.mkdirSync(path.dirname(t), { recursive: true });
  fs.writeFileSync(t, b);
  manifest[rel] = sha(b);
}
fs.writeFileSync(path.join(dest, "manifest.json"), JSON.stringify({ version, build: "legacy", files: manifest }, null, 2));
fs.mkdirSync(path.dirname(pathsFile), { recursive: true });
fs.writeFileSync(pathsFile, PATHS_TS);
console.log(`pdf.js vendor yazıldı: public/vendor/pdfjs/v${version} (${files.size} dosya), src/lib/pdfjs-paths.ts`);
