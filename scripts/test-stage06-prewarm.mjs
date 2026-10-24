import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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

function stats(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const p75 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))];
  return { min, max, median, p75 };
}

async function measureRoute(browser, routePath, routeId) {
  const coldTimes = [];
  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/belgeler`, { waitUntil: "domcontentloaded", timeout: 20000 });

    const link = page.locator(`article#${routeId} a:has-text("Stüdyoda doldur")`).first();
    await link.waitFor({ state: "visible", timeout: 5000 });

    const t0 = Date.now();
    await link.click();

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-studio-locked="true"] span[role="status"]');
        const hasCanvas = !!document.querySelector('[data-studio-locked="true"] canvas');
        return el && el.textContent && el.textContent.includes("hazır") && hasCanvas;
      },
      { timeout: 25000 }
    );
    coldTimes.push(Date.now() - t0);
    await ctx.close();
  }
  return stats(coldTimes);
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
      if (!(await waitForServer(PORT))) throw new Error("Server başlatılamadı.");
    }

    browser = await chromium.launch({ headless: true });

    console.log("=== ASAMA_06: PREWARM ÖNCESİ SÜRELER ===");
    const res1 = await measureRoute(browser, "/belgeler/beton-dokum-tutanagi", "beton-dokum-tutanagi");
    console.log(`Beton Döküm Tutanağı Cold STU-PDF -> Medyan: ${res1.median}ms | p75: ${res1.p75}ms`);

    const res2 = await measureRoute(browser, "/belgeler/santiye-sefi-taahhutnamesi", "santiye-sefi-taahhutnamesi");
    console.log(`Şantiye Şefi Taahhütnamesi Cold STU-PDF -> Medyan: ${res2.median}ms | p75: ${res2.p75}ms`);

  } catch (err) {
    console.error(err);
  } finally {
    if (browser) await browser.close();
    if (serverProcess) spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
    process.exit(0);
  }
}

main();
