import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";

const PORT = 3005;

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

async function main() {
  let serverProcess = null;
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
    if (!(await waitForServer(PORT))) {
      throw new Error("Server ayağa kalkamadı.");
    }
  }

  const browser = await chromium.launch({ headless: true });
  
  // Test Desktop 1366x768
  console.log("\n--- Testing Desktop 1366x768 ---");
  const dContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const dPage = await dContext.newPage();
  await dPage.addInitScript(() => {
    window.__pdfRenderCalls = [];
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const ctx = origGetContext.call(this, type, ...args);
      if (type === "2d" && ctx && !ctx.__instrumented) {
        ctx.__instrumented = true;
        const origDrawImage = ctx.drawImage;
        ctx.drawImage = function (...drawArgs) {
          window.__pdfRenderCalls.push({
            time: Math.round(performance.now()),
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
          });
          return origDrawImage.apply(this, drawArgs);
        };
      }
      return ctx;
    };
  });
  await dPage.goto(`http://127.0.0.1:${PORT}/belgeler/beton-dokum-tutanagi`, { waitUntil: "networkidle" });
  await dPage.waitForSelector('canvas', { timeout: 10000 });
  await dPage.waitForTimeout(1000);
  const desktopRenders = await dPage.evaluate(() => window.__pdfRenderCalls);
  console.log(`Desktop render calls count: ${desktopRenders.length}`);
  console.log(`Desktop render details:`, desktopRenders);

  // Test 5 routes cold render counts
  const routes = [
    "/belgeler/beton-dokum-tutanagi",
    "/belgeler/santiye-sefi-taahhutnamesi",
    "/belgeler/santiye-sefi-istifa-dilekcesi",
    "/belgeler/insaat-ruhsati-dilekcesi",
    "/belgeler/santiye-sefi-sozlesmesi",
  ];

  console.log("\n--- Testing 5 routes render counts ---");
  for (const route of routes) {
    const page = await dContext.newPage();
    await page.addInitScript(() => {
      window.__pdfRenderCalls = [];
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const ctx = origGetContext.call(this, type, ...args);
        if (type === "2d" && ctx && !ctx.__instrumented) {
          ctx.__instrumented = true;
          const origDrawImage = ctx.drawImage;
          ctx.drawImage = function (...drawArgs) {
            window.__pdfRenderCalls.push({
              time: Math.round(performance.now()),
              canvasWidth: this.canvas.width,
              canvasHeight: this.canvas.height,
            });
            return origDrawImage.apply(this, drawArgs);
          };
        }
        return ctx;
      };
    });
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "networkidle" });
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(600);
    const calls = await page.evaluate(() => window.__pdfRenderCalls);
    console.log(`${route}: ${calls.length} render(s)`);
    await page.close();
  }

  await browser.close();
  if (serverProcess) serverProcess.kill();
}

main().catch(console.error);
