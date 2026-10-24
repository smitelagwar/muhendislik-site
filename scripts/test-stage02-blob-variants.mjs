import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const EVIDENCE_DIR = path.join(process.cwd(), "docs", "belgeler-performans-v5", "evidence");

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

function stats(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const p75 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
  const mean = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
  return { min, max, median, p75, mean };
}

async function main() {
  let serverProcess = null;
  let browser = null;

  try {
    const isRunning = await checkPort(PORT);
    if (!isRunning) {
      console.log(`[Stage02] Server 127.0.0.1:${PORT} başlatılıyor...`);
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
        throw new Error("Server başlatılamadı.");
      }
    }

    browser = await chromium.launch({ headless: true });

    // 390px mobil viewport
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/belgeler`, { waitUntil: "networkidle", timeout: 25000 });

    console.log("=== ASAMA_02: 4 BLOB MİKRO VARYANT KARŞILAŞTIRMASI ===");

    // Test fonksiyonu: 10 saniye scroll simülasyonu ve kare süreleri
    async function measureScrollJank(label) {
      const frameTimes = [];
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);

      // 10 sn yerine 30 adımdan oluşan hızlı kaydırma ölçümü
      for (let i = 0; i < 30; i++) {
        const delta = i % 2 === 0 ? 250 : -200;
        const t0 = Date.now();
        await page.evaluate((d) => window.scrollBy(0, d), delta);
        await page.waitForTimeout(40);
        frameTimes.push(Date.now() - t0);
      }

      const res = stats(frameTimes);
      console.log(`[${label}] Scroll yanıtı -> Medyan: ${res.median}ms | p75: ${res.p75}ms | Mean: ${res.mean}ms`);
      return res;
    }

    // 1. Durum 0: Mevcut Kod (Baseline)
    const baselineStats = await measureScrollJank("V0: Mevcut Baseline");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "screenshots", "stage02-v0-baseline.png") });

    // 2. Durum 1: contain: strict + will-change kaldırma
    await page.addStyleTag({
      id: "variant-1",
      content: `
        [aria-hidden="true"].pointer-events-none.fixed {
          contain: strict !important;
        }
        [aria-hidden="true"] div[style*="blur"] {
          will-change: auto !important;
        }
      `,
    });
    const v1Stats = await measureScrollJank("V1: contain:strict + will-change:auto");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "screenshots", "stage02-v1-contain.png") });

    // 3. Durum 2: Responsive mobil boyutlar (max-width: 768px'te w-[420px] h-[420px], blur: 65px)
    await page.addStyleTag({
      id: "variant-2",
      content: `
        @media (max-width: 767px) {
          [aria-hidden="true"] div[style*="blur(110px)"] {
            filter: blur(65px) !important;
            -webkit-filter: blur(65px) !important;
            width: 420px !important;
            height: 420px !important;
          }
          [aria-hidden="true"] div[style*="blur(100px)"] {
            filter: blur(55px) !important;
            -webkit-filter: blur(55px) !important;
            width: 380px !important;
            height: 380px !important;
          }
        }
      `,
    });
    const v2Stats = await measureScrollJank("V2: Responsive Mobil Boyut + 65px Blur");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "screenshots", "stage02-v2-responsive.png") });

    // 4. Durum 3: V2 + Reduced Motion Desteği
    await page.addStyleTag({
      id: "variant-3",
      content: `
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] div[style*="orb-drift"] {
            animation: none !important;
          }
        }
      `,
    });
    const v3Stats = await measureScrollJank("V3: V2 + Reduced-Motion Safe");
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "screenshots", "stage02-v3-reduced-motion.png") });

    const summary = {
      baseline: baselineStats,
      variant1: v1Stats,
      variant2: v2Stats,
      variant3: v3Stats,
    };

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "stage02-micro-benchmarks.json"),
      JSON.stringify(summary, null, 2),
      "utf8"
    );
    console.log("\nSonuçlar kaydedildi: stage02-micro-benchmarks.json");

    await context.close();
  } catch (err) {
    console.error("[Stage02 Test] Hata:", err);
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
