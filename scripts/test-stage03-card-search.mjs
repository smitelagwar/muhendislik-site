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
      serverProcess = spawn("node", ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
        stdio: "ignore",
        detached: false,
        env: {
          ...process.env,
          NODE_ENV: "production",
          BELGE_SHARE_SECRET: "dev-local-belge-share-secret-key-32-bytes-minimum-length!",
        },
      });
      if (!(await waitForServer(PORT))) throw new Error("Sunucu başlatılamadı.");
    }

    browser = await chromium.launch({ headless: true });

    // Masaüstü 1366px Testi (Kart Hover & MouseMove)
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/belgeler`, { waitUntil: "networkidle", timeout: 25000 });

    console.log("=== ASAMA_03: KART POINTER & ARAMA ÖLÇÜMÜ ===");

    // 1. Kart üzerinde 100 ardışık mousemove olayı simülasyonu
    const card = page.locator("article[id]").first();
    const box = await card.boundingBox();

    const hoverTimes = [];
    for (let i = 0; i < 50; i++) {
      const x = box.x + 20 + (i % 20) * 10;
      const y = box.y + 20 + (i % 15) * 10;
      const t0 = Date.now();
      await page.mouse.move(x, y);
      await page.waitForTimeout(16);
      hoverTimes.push(Date.now() - t0);
    }
    const hoverStats = stats(hoverTimes);
    console.log(`[Kart Hover Yanıtı] Medyan: ${hoverStats.median}ms | p75: ${hoverStats.p75}ms`);

    // 2. Arama Girişi Hızlı Tuş Basımı Ölçümü (Search TTI & Filter Latency)
    const searchInput = page.locator('input[type="search"]');
    const queries = ["ş", "şan", "şantiye", "şantiye ş", "şantiye şefi", ""];

    const searchDurations = [];
    for (const q of queries) {
      const t0 = Date.now();
      await searchInput.fill(q);
      await page.waitForTimeout(30);
      searchDurations.push(Date.now() - t0);
    }
    const searchStats = stats(searchDurations);
    console.log(`[Arama Giriş Yanıtı] Medyan: ${searchStats.median}ms | p75: ${searchStats.p75}ms`);

    const results = {
      hover: hoverStats,
      search: searchStats,
    };

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "stage03-interaction-metrics.json"),
      JSON.stringify(results, null, 2),
      "utf8"
    );

    await ctx.close();
  } catch (err) {
    console.error("[Stage03 Test] Hata:", err);
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
