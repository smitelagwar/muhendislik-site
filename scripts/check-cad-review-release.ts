import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), ".data/dok_db.json");
const MIN_EXPECTED_DB_FILE_COUNT = 50;

function getDbFileCount(): number {
  if (!fs.existsSync(DB_PATH)) return 0;
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  return db.files?.length ?? 0;
}


function run(command: string, label: string) {
  console.log(`\n[CAD-REVIEW-RELEASE-GATE] RUN: ${label}`);
  console.log(`[CAD-REVIEW-RELEASE-GATE] CMD: ${command}`);
  const start = Date.now();
  try {
    execSync(command, {
      stdio: "inherit",
      env: {
        ...process.env,
        CI: "1",
        FORCE_COLOR: "1",
        PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || "3005",
      },
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[CAD-REVIEW-RELEASE-GATE] PASS: ${label} (${elapsed}s)`);
  } catch (err) {
    console.error(`[CAD-REVIEW-RELEASE-GATE] FAIL: ${label} başarısız oldu!`);
    throw err;
  }
}


async function main() {
  const globalStart = Date.now();
  console.log("\n========================================================");
  console.log("   CAD REVIEW WORKSPACE V1 — COMPOSITE RELEASE GATE");
  console.log("========================================================\n");

  // 1. PRE-FLIGHT
  const initialDbCount = getDbFileCount();
  console.log(`[CAD-REVIEW-RELEASE-GATE] PRE-FLIGHT: Veri tabanı dosya sayısı: ${initialDbCount}`);
  if (initialDbCount < MIN_EXPECTED_DB_FILE_COUNT) {
    throw new Error(
      `Beklenen minimum dosya sayısı (${MIN_EXPECTED_DB_FILE_COUNT}) sağlanamadı: ${initialDbCount}`
    );
  }

  // 2. TYPESCRIPT CHECK
  run("npx tsc --noEmit --incremental false", "TypeScript Tip Denetimi");

  // 3. TARGETED ESLINT
  run(
    'npx eslint "src/lib/dokumantasyon/cad-review/**/*.ts" "src/components/dokumantasyon/preview/cad-review-*.tsx" "tests/document-studio/cad-*.spec.ts"',
    "Targeted ESLint Statik Kod Analizi"
  );

  // 4. CAD REVIEW PLAYWRIGHT SUITE (Stages 3-10)
  const reviewSpecs = [
    "tests/document-studio/cad-chain-measurement.spec.ts",
    "tests/document-studio/cad-text-search.spec.ts",
    "tests/document-studio/cad-markup-tools.spec.ts",
    "tests/document-studio/cad-freehand-stroke.spec.ts",
    "tests/document-studio/cad-a11y-responsive-ux.spec.ts",
    "tests/document-studio/cad-review-export.spec.ts",
    "tests/document-studio/cad-review-security-qa.spec.ts",
    "tests/document-studio/cad-review-rollback.spec.ts",
  ].join(" ");

  run(
    `npx playwright test --config=playwright.config.ts ${reviewSpecs} --project=chromium`,
    "CAD Review Workspace V1 Aşama 3-10 Test Paketi"
  );

  // PORT COOLDOWN: Step 4 ve Step 5 aynı PLAYWRIGHT_PORT=3005 kullanıyor.
  // Playwright'ın webServer süreci tam kapanmadan yeni süreç başlarsa port çakışması
  // data-cad-upstream-state="loading" (hiç "ready" olmaz) şeklinde gözükür.
  // 2 saniyelik bekleme Next.js sunucusunun tam kapanmasını garantiler.
  await new Promise(r => setTimeout(r, 2000));

  // 5. BASE REAL USER RELEASE GATE
  run("npm run check:cad-real-user-release", "CAD Real User Release Gate (52 Desktop + 17 Mobile)");

  // 6. PRODUCTION NEXT.JS BUILD
  run("npm run build", "Production Next.js Derleme (npm run build)");

  // 7. GIT DIFF CHECK
  run("git diff --check", "Git Diff Whitespace ve Conflict Denetimi");

  // 8. POST-FLIGHT
  const finalDbCount = getDbFileCount();
  console.log(`\n[CAD-REVIEW-RELEASE-GATE] POST-FLIGHT: Veri tabanı dosya sayısı: ${finalDbCount}`);
  if (finalDbCount !== initialDbCount) {
    throw new Error(
      `Testler veri tabanında sızıntı bıraktı! Başlangıç: ${initialDbCount}, Bitiş: ${finalDbCount}`
    );
  }
  console.log("[CAD-REVIEW-RELEASE-GATE] POST-FLIGHT: Veri tabanı temiz (0 sızıntı).");

  const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);
  console.log("\n========================================================");
  console.log(`   CAD REVIEW WORKSPACE V1 RELEASE GATE: PASS (${totalElapsed}s)`);
  console.log("   DURUM: %100 RELEASE READY");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});