import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EVIDENCE_DIR = path.join(process.cwd(), "docs", "belgeler-performans-v5", "evidence");

const STUDIO_ROUTES = [
  { id: "beton-dokum-tutanagi", name: "Beton Döküm Tutanağı", path: "/belgeler/beton-dokum-tutanagi" },
  { id: "santiye-sefi-taahhutnamesi", name: "Şantiye Şefi Taahhütnamesi", path: "/belgeler/santiye-sefi-taahhutnamesi" },
  { id: "santiye-sefi-istifa-dilekcesi", name: "Şantiye Şefi İstifa Dilekçesi", path: "/belgeler/santiye-sefi-istifa-dilekcesi" },
  { id: "insaat-ruhsati-dilekcesi", name: "İnşaat Ruhsatı Dilekçesi", path: "/belgeler/insaat-ruhsati-dilekcesi" },
  { id: "santiye-sefi-sozlesmesi", name: "Şantiye Şefi Hizmet Sözleşmesi", path: "/belgeler/santiye-sefi-sozlesmesi" },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/belgeler`, (res) => resolve(true));
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port, maxWait = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    if (await checkPort(port)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function calculateStats(numbers) {
  if (!numbers || numbers.length === 0) return { min: 0, max: 0, median: 0, p75: 0, mean: 0 };
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const p75Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
  const p75 = sorted[p75Index];
  const mean = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
  return { min, max, median, p75, mean };
}

async function main() {
  let serverProcess = null;
  let browser = null;

  try {
    const isRunning = await checkPort(PORT);
    if (!isRunning) {
      console.log(`[Stage02 Verify] Server 127.0.0.1:${PORT} başlatılıyor...`);
      serverProcess = spawn("node", ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
        stdio: "ignore",
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: "production",
          BELGE_SHARE_SECRET: "dev-local-belge-share-secret-key-32-bytes-minimum-length!",
        },
      });
      if (!(await waitForServer(PORT))) {
        throw new Error("Server ayağa kalkamadı.");
      }
    }

    browser = await chromium.launch({ headless: true });

    // 1. Mobil Kaydırma Tepkiselliği (390px, 7 tekrarlı set)
    console.log("\n--- [1/3] Mobil Kaydırma ve Kompozit Ölçümü ---");
    const mContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mPage = await mContext.newPage();
    await mPage.goto(`${BASE_URL}/belgeler`, { waitUntil: "networkidle", timeout: 25000 });

    const scrollRuns = [];
    for (let r = 0; r < 7; r++) {
      const times = [];
      for (let s = 0; s < 10; s++) {
        const delta = s % 2 === 0 ? 300 : -250;
        const t0 = Date.now();
        await mPage.evaluate((d) => window.scrollBy(0, d), delta);
        await mPage.waitForTimeout(40);
        times.push(Date.now() - t0);
      }
      scrollRuns.push(calculateStats(times).median);
    }
    const mobileScrollStats = calculateStats(scrollRuns);
    console.log(`Mobil Kaydırma Yanıtı: Medyan=${mobileScrollStats.median}ms | p75=${mobileScrollStats.p75}ms (ASAMA_01 Baseline: 746ms)`);
    await mContext.close();

    // 2. Beş Belge Stüdyosu Açılış Süreleri (7 Tekrar: Cold & Warm)
    console.log("\n--- [2/3] 5 Stüdyo Rotası Tıklama -> Hazır PDF Doğrulaması ---");
    const studioResults = {};

    for (const route of STUDIO_ROUTES) {
      console.log(`Ölçülüyor: [${route.name}]`);
      const cold = { stuShell: [], stuPdf: [], stuEdit: [] };
      const warm = { stuShell: [], stuPdf: [], stuEdit: [] };

      for (let run = 1; run <= 7; run++) {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const page = await ctx.newPage();
        await page.goto(`${BASE_URL}/belgeler`, { waitUntil: "domcontentloaded", timeout: 20000 });

        const selector = run % 2 === 1
          ? `article#${route.id} a:has-text("Stüdyoda doldur")`
          : `article#${route.id} h2 a`;

        const link = page.locator(selector).first();
        await link.waitFor({ state: "visible", timeout: 5000 });

        const tClick = Date.now();
        await link.click();

        await page.locator('[data-studio-locked="true"]').waitFor({ state: "visible", timeout: 15000 });
        const shellTime = Date.now() - tClick;

        await page.waitForFunction(
          () => {
            const el = document.querySelector('[data-studio-locked="true"] span[role="status"]');
            const hasCanvas = !!document.querySelector('[data-studio-locked="true"] canvas');
            return el && el.textContent && el.textContent.includes("hazır") && hasCanvas;
          },
          { timeout: 25000 }
        );
        const pdfTime = Date.now() - tClick;

        const formBtn = page.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Formu Düzenle" });
        if (await formBtn.isVisible()) await formBtn.click();
        await page.locator('input:not([type="hidden"]), textarea').first().waitFor({ state: "visible", timeout: 5000 });
        const editTime = Date.now() - tClick;

        cold.stuShell.push(shellTime);
        cold.stuPdf.push(pdfTime);
        cold.stuEdit.push(editTime);

        // Warm run
        const backBtn = page.locator('a[aria-label="Tüm belgelere dön"]').first();
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.locator("article[id]").first().waitFor({ state: "visible", timeout: 10000 });
          await page.waitForTimeout(100);

          const wClick = Date.now();
          const wLink = page.locator(selector).first();
          await wLink.click();

          await page.locator('[data-studio-locked="true"]').waitFor({ state: "visible", timeout: 15000 });
          const wShell = Date.now() - wClick;

          await page.waitForFunction(
            () => {
              const el = document.querySelector('[data-studio-locked="true"] span[role="status"]');
              const hasCanvas = !!document.querySelector('[data-studio-locked="true"] canvas');
              return el && el.textContent && el.textContent.includes("hazır") && hasCanvas;
            },
            { timeout: 25000 }
          );
          const wPdf = Date.now() - wClick;

          const wForm = page.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Formu Düzenle" });
          if (await wForm.isVisible()) await wForm.click();
          await page.locator('input:not([type="hidden"]), textarea').first().waitFor({ state: "visible", timeout: 5000 });
          const wEdit = Date.now() - wClick;

          warm.stuShell.push(wShell);
          warm.stuPdf.push(wPdf);
          warm.stuEdit.push(wEdit);
        }

        await ctx.close();
      }

      studioResults[route.id] = {
        name: route.name,
        coldPdf: calculateStats(cold.stuPdf),
        warmPdf: calculateStats(warm.stuPdf),
        coldShell: calculateStats(cold.stuShell),
      };
      console.log(`  Cold STU-PDF Medyan: ${studioResults[route.id].coldPdf.median}ms | Warm STU-PDF Medyan: ${studioResults[route.id].warmPdf.median}ms`);
    }

    // 3. Karşılaştırma Raporu
    console.log("\n--- [3/3] ASAMA_01 ile Karşılaştırma ---");
    const baselineRaw = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, "baseline-metrics.json"), "utf8"));
    const reportLines = [
      "# ASAMA_02 Doğrulama ve Karşılaştırma Raporu",
      "",
      `**Tarih:** ${new Date().toISOString()}`,
      `**Uygulanan Değişiklik:** \`src/components/belgeler-glass-bg.tsx\` üzerinde \`[contain:strict]\`, \`will-change: auto\` (aşırı VRAM optimizasyonu) ve \`prefers-reduced-motion\` desteği.`,
      "",
      "## 1. Mobil Kaydırma Yanıtı (Scroll Response / Latency)",
      "",
      `- **ASAMA_01 Baseline:** 746 ms medyan`,
      `- **ASAMA_02 Sonuç:** **${mobileScrollStats.median} ms medyan** (%${Math.round(((746 - mobileScrollStats.median) / 746) * 100)} İyileşme)`,
      "",
      "## 2. 5 Stüdyo Rotası Açılış Karşılaştırması (Cold & Warm STU-PDF)",
      "",
      "| Belge | Cold STU-PDF Baseline | Cold STU-PDF Stage 2 | Fark (ms) | Warm STU-PDF Baseline | Warm STU-PDF Stage 2 | Fark (ms) | Regresyon? |",
      "|---|---|---|---|---|---|---|---|",
    ];

    let hasRegression = false;
    for (const r of STUDIO_ROUTES) {
      const bCold = baselineRaw.studioBenchmarks[r.id].cold.stuPdf.median;
      const bWarm = baselineRaw.studioBenchmarks[r.id].warm.stuPdf.median;
      const sCold = studioResults[r.id].coldPdf.median;
      const sWarm = studioResults[r.id].warmPdf.median;

      const diffCold = sCold - bCold;
      const diffWarm = sWarm - bWarm;

      // >100ms ve >%5 birlikte ise alarm
      const regCold = diffCold > 100 && (diffCold / bCold) > 0.05;
      const regWarm = diffWarm > 100 && (diffWarm / bWarm) > 0.05;
      const reg = regCold || regWarm;
      if (reg) hasRegression = true;

      reportLines.push(
        `| ${r.name} | ${bCold}ms | **${sCold}ms** | ${diffCold > 0 ? `+${diffCold}` : diffCold}ms | ${bWarm}ms | **${sWarm}ms** | ${diffWarm > 0 ? `+${diffWarm}` : diffWarm}ms | ${reg ? "❌ REGRESYON" : "✅ SIFIR REGRESYON"} |`
      );
    }

    reportLines.push("");
    reportLines.push(`**Genel Durum:** ${hasRegression ? "❌ Regresyon tespit edildi" : "✅ TÜM ROTARLARDA SIFIR REGRESYON KORUNDU"}`);

    const outPath = path.join(EVIDENCE_DIR, "stage02-verification-report.md");
    fs.writeFileSync(outPath, reportLines.join("\n"), "utf8");
    console.log(`\nRapor kaydedildi: ${outPath}`);
    console.log(reportLines.join("\n"));

  } catch (err) {
    console.error("[Stage02 Verify] Hata:", err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (serverProcess) {
      spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
    }
    process.exit(process.exitCode || 0);
  }
}

main();
