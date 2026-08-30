import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAD_PREVIEW_V2_MANIFEST } from "../tests/fixtures/cad-preview-v2/manifest";

const ROOT = process.cwd();

function log(stage: string, message: string) {
  console.log(`\x1b[36m[CAD-RELEASE-GATE]\x1b[0m \x1b[1m${stage}:\x1b[0m ${message}`);
}

function run(cmd: string, description: string): { ok: boolean; duration: string } {
  log("RUN", `${description} (${cmd})`);
  const start = Date.now();
  try {
    execSync(cmd, {
      stdio: "inherit",
      cwd: ROOT,
      env: { ...process.env, PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || "3005" },
    });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    log("PASS", `${description} tamamlandı (${duration}s)`);
    return { ok: true, duration };
  } catch (err) {
    console.error(`\x1b[31m[CAD-RELEASE-GATE FAIL]\x1b[0m ${description} başarısız oldu:`, err);
    process.exit(1);
  }
}

function checkDbCount(expectedCount = 1133): number {
  const dbPath = resolve(ROOT, ".data/dok_db.json");
  if (!existsSync(dbPath)) {
    throw new Error(`.data/dok_db.json bulunamadı: ${dbPath}`);
  }
  const db = JSON.parse(readFileSync(dbPath, "utf8"));
  const count = db.files?.length ?? 0;
  if (count !== expectedCount) {
    throw new Error(`Veri izolasyonu ihlali! Beklenen dosya sayısı: ${expectedCount}, bulunan: ${count}`);
  }
  return count;
}

function fixtureByteCandidates(buffer: Buffer): Buffer[] {
  const normalized = Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
  return normalized.equals(buffer) ? [buffer] : [buffer, normalized];
}

function verifyFixtureManifest(): { total: number; checked: number } {
  const fixturesDir = resolve(ROOT, "tests/fixtures/cad-preview-v2");
  let checked = 0;
  for (const [id, entry] of Object.entries(CAD_PREVIEW_V2_MANIFEST)) {
    const filePath = resolve(fixturesDir, entry.fileName);
    if (!existsSync(filePath)) {
      throw new Error(`Fixture dosyası eksik: ${entry.fileName} (id: ${id})`);
    }
    const buf = readFileSync(filePath);
    const matchingBytes = fixtureByteCandidates(buf).find((candidate) => {
      const hash = createHash("sha256").update(candidate).digest("hex");
      return candidate.length === entry.sizeBytes && hash === entry.sha256;
    });
    if (!matchingBytes) {
      const rawHash = createHash("sha256").update(buf).digest("hex");
      throw new Error(
        `Fixture bütünlüğü uyuşmazlığı: ${entry.fileName} (id: ${id}). ` +
          `Beklenen: ${entry.sizeBytes} bayt / ${entry.sha256}, ` +
          `ham dosya: ${buf.length} bayt / ${rawHash}`
      );
    }
    checked++;
  }
  return { total: Object.keys(CAD_PREVIEW_V2_MANIFEST).length, checked };
}

function checkGitDiff(): boolean {
  try {
    execSync("git diff --check", { cwd: ROOT, stdio: "inherit" });
    return true;
  } catch {
    throw new Error("git diff --check whitespace veya conflict hatası buldu.");
  }
}

async function main() {
  const overallStart = Date.now();
  console.log("\n========================================================");
  console.log("   CAD PREVIEW V2 — REAL USER RELEASE GATE (AŞAMA 8/8)  ");
  console.log("========================================================\n");

  // 1. Pre-flight checks
  log("PRE-FLIGHT", "Kullanıcı veri tabanı dosya sayısı denetleniyor...");
  const initialDbCount = checkDbCount(1133);
  log("PRE-FLIGHT", `Veri tabanı dosya sayısı doğrulandı: ${initialDbCount}`);

  log("PRE-FLIGHT", "Fixture manifest SHA-256 bütünlüğü denetleniyor...");
  const manifestResult = verifyFixtureManifest();
  log("PRE-FLIGHT", `${manifestResult.checked}/${manifestResult.total} fixture SHA-256 ve boyutu tam eşleşti.`);

  // 2. Static quality gates
  const tscResult = run("npx tsc --noEmit --incremental false", "TypeScript Tip Denetimi");
  const eslintResult = run(
    'npx eslint "src/lib/dokumantasyon/cad-upstream/**/*.ts" "src/components/dokumantasyon/preview/cad-*.tsx" "tests/document-studio/cad-*.ts" "scripts/check-cad-*.ts"',
    "Hedefli ESLint Kalite Denetimi"
  );

  // 3. Browser matrix tests: Desktop Chromium (All 13 suites)
  const chromiumResult = run("npm run check:cad-preview-v2", "Desktop Chromium (52 test) Regresyon Paketi");

  // 4. Browser matrix tests: Mobile Chromium (Pixel 7)
  const mobileResult = run(
    "npx playwright test --config=playwright.config.ts tests/document-studio/cad-stage7-layer-mobile-ux.spec.ts tests/document-studio/cad-stage6-area-measurement.spec.ts tests/document-studio/cad-stage5-distance-measurement.spec.ts tests/document-studio/cad-stage3-view-navigation.spec.ts tests/document-studio/cad-stage4-loading-error.spec.ts --project=mobile-chromium",
    "Mobile Chromium (Pixel 7 Touch Matrix) Test Paketi"
  );

  // 5. Post-flight checks
  log("POST-FLIGHT", "Test sonrası veri tabanı dosya sayısı kontrol ediliyor...");
  const finalDbCount = checkDbCount(1133);
  log("POST-FLIGHT", `Veri tabanı dosya sayısı sabit (0 sızıntı): ${finalDbCount}`);

  log("POST-FLIGHT", "Git diff whitespace ve conflict kontrolü...");
  checkGitDiff();
  log("POST-FLIGHT", "Git diff temiz.");

  const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(1);

  // 6. Evidence collection
  const evidence = {
    gate: "CAD_PREVIEW_V2_REAL_USER_RELEASE_GATE",
    status: "RELEASE_READY",
    timestamp: new Date().toISOString(),
    totalDurationSeconds: totalDuration,
    databaseIsolation: {
      initialFilesCount: initialDbCount,
      finalFilesCount: finalDbCount,
      delta: finalDbCount - initialDbCount,
      isolated: true,
    },
    manifestIntegrity: {
      fixturesCount: manifestResult.total,
      verifiedCount: manifestResult.checked,
      allMatch: true,
    },
    qualityGates: {
      typecheck: { status: "PASS", durationSeconds: tscResult.duration },
      eslint: { status: "PASS", durationSeconds: eslintResult.duration },
      desktopChromium: { status: "PASS", durationSeconds: chromiumResult.duration },
      mobileChromium: { status: "PASS", durationSeconds: mobileResult.duration },
      gitDiffCheck: { status: "PASS" },
    },
  };

  try {
    const evidenceDir = resolve(ROOT, ".data");
    if (!existsSync(evidenceDir)) mkdirSync(evidenceDir, { recursive: true });
    writeFileSync(resolve(evidenceDir, "cad-real-user-release-evidence.json"), JSON.stringify(evidence, null, 2), "utf8");
    log("EVIDENCE", "Release kanıtı .data/cad-real-user-release-evidence.json dosyasına yazıldı.");
  } catch (err) {
    console.warn("Evidence save warning:", err);
  }

  console.log("\n========================================================");
  console.log(`   CAD PREVIEW V2 RELEASE GATE: PASS (${totalDuration}s)       `);
  console.log("   DURUM: RELEASE READY (Kalan Zorunlu Aşama: 0)        ");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("\x1b[31m[CAD-RELEASE-GATE CRITICAL FAIL]\x1b[0m", err);
  process.exit(1);
});
