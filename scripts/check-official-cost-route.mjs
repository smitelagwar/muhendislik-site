import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";

const port = Number(process.argv[2] ?? "3006");
const baseUrl = `http://127.0.0.1:${port}`;
const routeUrl = `${baseUrl}/hesaplamalar/resmi-birim-maliyet-2026`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function waitForDownload(downloadDir, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const entries = await fs.readdir(downloadDir);
    const pdfFile = entries.find((entry) => entry.toLowerCase().endsWith(".pdf"));
    if (pdfFile) {
      return path.join(downloadDir, pdfFile);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error("PDF export did not create a file within the expected time.");
}

async function clearDirectory(directory) {
  const entries = await fs.readdir(directory);
  await Promise.all(entries.map((entry) => fs.rm(path.join(directory, entry), { force: true, recursive: true })));
}

async function getText(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  const text = await page.$eval(selector, (element) => element.textContent ?? "");
  return normalizeWhitespace(text);
}

async function setInputValue(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value);
}

const app = next({
  dev: false,
  dir: process.cwd(),
  hostname: "127.0.0.1",
  port,
});

await app.prepare();

const handle = app.getRequestHandler();
const server = http.createServer((request, response) => handle(request, response));

await new Promise((resolve) => {
  server.listen(port, "127.0.0.1", resolve);
});

const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "official-cost-download-"));
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
const pageErrors = [];
const dialogs = [];
const steps = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

page.on("requestfailed", (request) => {
  requestFailures.push({
    url: request.url(),
    error: request.failure()?.errorText ?? "unknown",
  });
});

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

page.on("dialog", async (dialog) => {
  dialogs.push({ type: dialog.type(), message: dialog.message() });
  await dialog.dismiss();
});

await page.evaluateOnNewDocument(() => {
  window.__officialPrintCalls = 0;
  window.print = () => {
    window.__officialPrintCalls += 1;
  };
});

await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
const client = await page.target().createCDPSession();
await client.send("Page.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: downloadDir,
});

try {
  const response = await page.goto(routeUrl, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  assert(response?.status() === 200, `Official cost route returned status ${response?.status() ?? "unknown"}.`);
  await page.waitForSelector('[data-testid="official-mode-guided"]', { visible: true });
  steps.push("page-load");

  await page.click('[data-testid="navbar-live-search"]');
  await page.waitForSelector('input[placeholder="Icerik, arac veya konu ara..."]', { visible: true });
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector('input[placeholder="Icerik, arac veya konu ara..."]'),
    { timeout: 5000 },
  );
  steps.push("command-palette");

  await page.click('[data-testid="navbar-auth-trigger"]');
  await page.waitForSelector('[data-testid="auth-modal-close"]', { visible: true });
  await page.click('[data-testid="auth-modal-close"]');
  await page.waitForFunction(() => !document.querySelector('[data-testid="auth-modal-close"]'), {
    timeout: 5000,
  });
  steps.push("auth-modal");

  const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForFunction(
    (previous) => document.documentElement.classList.contains("dark") !== previous,
    { timeout: 5000 },
    wasDark,
  );
  steps.push("theme-toggle");

  await page.click('[data-testid="official-guide-category-saglik"]');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="official-guide-category-saglik"]')
        ?.getAttribute("aria-pressed") === "true",
    { timeout: 5000 },
  );
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get("tip") === "agiz-dis-huzurevi",
    { timeout: 5000 },
  );
  steps.push("guided-category");

  await page.click('[data-testid="official-guide-option-hastane-400-ustu"]');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="official-guide-option-hastane-400-ustu"]')
        ?.getAttribute("aria-pressed") === "true",
    { timeout: 5000 },
  );
  await page.waitForFunction(() => {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("tip") === "hastane-400-ustu" &&
      url.searchParams.get("grup") === "V" &&
      url.searchParams.get("sinif") === "C"
    );
  }, { timeout: 5000 });
  assert((await getText(page, '[data-testid="official-result-class-code"]')) === "V-C", "Guided option did not update the selected class.");
  steps.push("guided-option");

  const totalBeforeAreaChange = await getText(page, '[data-testid="official-total-cost-value"]');
  await setInputValue(page, '[data-testid="official-area-input"]', "2500");
  await page.focus("body");
  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="official-area-value"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .includes("2.500"),
    { timeout: 5000 },
  );
  const totalAfterAreaChange = await getText(page, '[data-testid="official-total-cost-value"]');
  assert(totalBeforeAreaChange !== totalAfterAreaChange, "Area input did not change the calculated total.");
  steps.push("area-input");

  await page.click('[data-testid="official-mode-manual"]');
  await page.waitForSelector('[data-testid="official-search-input"]', { visible: true });
  await setInputValue(page, '[data-testid="official-search-input"]', "hastane");
  await page.waitForSelector('[data-testid="official-search-result-V-C"]', { visible: true });
  await page.click('[data-testid="official-search-result-V-C"]');
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get("mod") === "manual",
    { timeout: 5000 },
  );
  assert((await getText(page, '[data-testid="official-result-class-code"]')) === "V-C", "Manual search result did not sync to the result panel.");
  steps.push("manual-search");

  await page.select('[data-testid="official-group-select"]', "II");
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get("grup") === "II",
    { timeout: 5000 },
  );
  await page.select('[data-testid="official-class-select"]', "A");
  await page.waitForFunction(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("grup") === "II" && url.searchParams.get("sinif") === "A";
  }, { timeout: 5000 });
  assert((await getText(page, '[data-testid="official-result-class-code"]')) === "II-A", "Manual select flow did not update the resolved class.");
  steps.push("manual-selects");

  await page.click('[data-testid="official-mode-guided"]');
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get("mod") === "guided",
    { timeout: 5000 },
  );
  assert((await getText(page, '[data-testid="official-result-class-code"]')) === "V-C", "Guided state was not preserved after returning from manual mode.");
  await page.click('[data-testid="official-mode-manual"]');
  await page.waitForFunction(
    () => new URL(window.location.href).searchParams.get("mod") === "manual",
    { timeout: 5000 },
  );
  assert((await getText(page, '[data-testid="official-result-class-code"]')) === "II-A", "Manual state was not preserved after toggling back from guided mode.");
  steps.push("mode-persistence");

  const localPdfHref = await page.$eval('[data-testid="official-local-pdf-link"]', (element) => element.getAttribute("href") ?? "");
  assert(localPdfHref.includes("/hesaplamalar/2026"), "Local official PDF link is not configured.");
  const popupPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 2500);
    page.once("popup", async (popup) => {
      clearTimeout(timeout);
      resolve(popup);
    });
  });
  await page.click('[data-testid="official-local-pdf-link"]');
  const popup = await popupPromise;
  if (popup) {
    await popup.close();
  }
  const sourceHref = await page.$eval('[data-testid="official-source-link"]', (element) => element.getAttribute("href") ?? "");
  assert(sourceHref.startsWith("https://"), "Remote official source link is not configured.");
  steps.push("source-links");

  await clearDirectory(downloadDir);
  await page.click('[data-testid="official-pdf-button"]');
  const downloadedFile = await waitForDownload(downloadDir);
  assert(downloadedFile.toLowerCase().endsWith(".pdf"), "PDF export did not create a PDF file.");
  steps.push("pdf-export");

  await page.click('[data-testid="official-print-button"]');
  await page.waitForFunction(() => window.__officialPrintCalls >= 1, { timeout: 5000 });
  steps.push("print");

  const compareHref = await page.$eval('[data-testid="official-compare-link"]', (element) => element.getAttribute("href") ?? "");
  assert(compareHref.includes("/hesaplamalar/insaat-maliyeti?"), "Compare link does not point to the detailed cost route.");
  assert(compareHref.includes("grup=II") && compareHref.includes("sinif=A") && compareHref.includes("alan=2500"), "Compare link query parameters are incorrect.");
  await page.click('[data-testid="official-compare-link"]');
  await page.waitForFunction(
    () => window.location.pathname === "/hesaplamalar/insaat-maliyeti",
    { timeout: 10000 },
  );
  steps.push("compare-link");

  assert(dialogs.length === 0, `Unexpected dialog(s) opened: ${dialogs.map((item) => `${item.type}:${item.message}`).join(" | ")}`);
  assert(consoleErrors.length === 0, `Console error(s) detected: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `Page error(s) detected: ${pageErrors.join(" | ")}`);
  assert(requestFailures.length === 0, `Request failure/failures detected: ${requestFailures.map((item) => `${item.error} @ ${item.url}`).join(" | ")}`);

  console.log(
    JSON.stringify(
      {
        baseUrl,
        routeUrl,
        status: "ok",
        steps,
      },
      null,
      2,
    ),
  );
} finally {
  await page.close();
  await browser.close();
  await fs.rm(downloadDir, { recursive: true, force: true });
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
