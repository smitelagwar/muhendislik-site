// Platformdan bağımsız (Windows/macOS/Linux) PDF v4 test başlatıcı.
//   node scripts/pdf-v4-run.mjs baseline            → bütçe uygulanmaz, ölçer (dev sunucu olur)
//   node scripts/pdf-v4-run.mjs baseline --prod     → production sunucuda ölç (önce `npm run build`)
//   node scripts/pdf-v4-run.mjs gate                → bütçe kapısı (production zorunlu)
//   node scripts/pdf-v4-run.mjs gate --cpu=4 --project=mobile      → CPU 4× yavaş mobil
//   Ek argümanlar Playwright'a geçer: --project=desktop s04 -g "metin-1000"
import { spawnSync } from "node:child_process";
import fs from "node:fs";

const [mode, ...rest] = process.argv.slice(2);
if (!["baseline", "gate"].includes(mode)) {
  console.error("Kullanım: node scripts/pdf-v4-run.mjs <baseline|gate> [--prod] [--cpu=4] [playwright argümanları]");
  process.exit(2);
}
const env = { ...process.env, PDF_V4_MODE: mode };
const pw = [];
for (const a of rest) {
  if (a.startsWith("--cpu=")) env.PDF_V4_CPU = a.slice(6);
  else if (a === "--prod") env.PLAYWRIGHT_PRODUCTION_SERVER = "1";
  else pw.push(a);
}
if (mode === "gate") env.PLAYWRIGHT_PRODUCTION_SERVER = "1";
if (env.PLAYWRIGHT_PRODUCTION_SERVER === "1" && !fs.existsSync(".next/BUILD_ID")) {
  console.error("Production sunucu için önce `npm run build` çalıştır (.next/BUILD_ID yok).");
  process.exit(2);
}
if (!fs.existsSync(".test-data/pdf-v4-fixtures/a0-vektor.pdf")) {
  const g = spawnSync("node", ["scripts/generate-pdf-fixtures-v4.mjs"], { stdio: "inherit" });
  if (g.status) process.exit(g.status);
}
const r = spawnSync("npx", ["playwright", "test", "--config=playwright.pdf-v4.config.ts", ...pw], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});
process.exit(r.status ?? 1);
