import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";

const port = Number(process.argv[2] ?? "3007");
const baseUrl = `http://127.0.0.1:${port}`;
const routeUrl = `${baseUrl}/hesaplamalar/tahmini-insaat-alani?mod=detailed&arsa=1200&taks=0.35&kaks=1.2&kat=5&profil=konut&bodrum=1`;
const legacyDraftKey = "estimated_construction_area_detailed_draft_v1";

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
  await Promise.all(
    entries.map((entry) => fs.rm(path.join(directory, entry), { force: true, recursive: true }))
  );
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

async function expectPopup(page, clickSelector) {
  const popupPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 2500);
    page.once("popup", async (popup) => {
      clearTimeout(timeout);
      resolve(popup);
    });
  });

  await page.click(clickSelector);
  return popupPromise;
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

const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "estimated-area-download-"));
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
const pageErrors = [];
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

await page.setViewport({ width: 1440, height: 1800, deviceScaleFactor: 1 });
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

  assert(
    response?.status() === 200,
    `Estimated area route returned status ${response?.status() ?? "unknown"}.`
  );

  await page.evaluate((key) => {
    window.localStorage.setItem(key, JSON.stringify({ stale: true }));
  }, legacyDraftKey);
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="estimated-area-input-arsa"]', { visible: true });
  steps.push("page-load");

  await page.waitForFunction(
    () => !new URL(window.location.href).searchParams.has("mod"),
    { timeout: 5000 }
  );
  const legacyDraftValue = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    legacyDraftKey
  );
  assert(legacyDraftValue === null, "Legacy detailed draft should be removed on load.");
  steps.push("legacy-cleanup");

  const bodyText = await page.evaluate(() => document.body.innerText);
  assert(!bodyText.includes("Hızlı Mod"), "Hızlı Mod text should not appear anymore.");
  assert(!bodyText.includes("Detaylı Mod"), "Detaylı Mod text should not appear anymore.");
  steps.push("single-mode");

  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="estimated-area-result-total"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .includes("2.220"),
    { timeout: 5000 }
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-profile"]')) === "Konut",
    "Default profile should resolve to Konut."
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-non-emsal-ratio"]')).includes("%25,0"),
    "Konut scenario should apply a %25,0 non-emsal ratio."
  );
  steps.push("base-calculation");

  await page.click('[data-testid="estimated-area-profile-ticariOfis"]');
  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="estimated-area-result-profile"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .includes("Ticari / Ofis"),
    { timeout: 5000 }
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-total"]')).includes("2.133,60"),
    "Ticari / Ofis profile should reduce the total area."
  );
  steps.push("profile-change");

  await page.click('[data-testid="estimated-area-basement-no"]');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="estimated-area-basement-fields"]'),
    { timeout: 5000 }
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-basement-total"]')).includes("0"),
    "Basement total should reset to zero when basement is disabled."
  );
  steps.push("basement-off");

  await page.click('[data-testid="estimated-area-basement-yes"]');
  await page.waitForSelector('[data-testid="estimated-area-basement-fields"]', { visible: true });
  await setInputValue(page, '[data-testid="estimated-area-input-bodrum-kat"]', "2");
  await setInputValue(page, '[data-testid="estimated-area-input-bodrum-alan"]', "360");
  await page.click('[data-testid="estimated-area-profile-karma"]');
  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="estimated-area-result-total"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .includes("2.491,20"),
    { timeout: 5000 }
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-basement-total"]')).includes("720"),
    "Two 360 m2 basement floors should resolve to 720 m2."
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-profile"]')) === "Karma Kullanım",
    "Profile should switch to Karma Kullanım."
  );
  steps.push("basement-custom");

  const previewPopup = await expectPopup(page, '[data-testid="estimated-area-pdf-preview-button"]');
  assert(previewPopup, "PDF preview did not open a new tab.");
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert(previewPopup.url() !== "", "PDF preview popup did not resolve to a URL.");
  await previewPopup.close();
  steps.push("pdf-preview");

  await clearDirectory(downloadDir);
  await page.click('[data-testid="estimated-area-pdf-button"]');
  const downloadedFile = await waitForDownload(downloadDir);
  assert(downloadedFile.toLowerCase().endsWith(".pdf"), "PDF export did not create a PDF file.");
  steps.push("pdf-export");

  const printPopup = await expectPopup(page, '[data-testid="estimated-area-print-button"]');
  assert(printPopup, "Print action did not open a printable PDF tab.");
  await new Promise((resolve) => setTimeout(resolve, 500));
  assert(printPopup.url() !== "", "Print popup did not resolve to a URL.");
  await printPopup.close();
  steps.push("print");

  const officialHref = await page.$eval(
    '[data-testid="estimated-area-official-link"]',
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    officialHref.includes("/hesaplamalar/resmi-birim-maliyet-2026?alan=2491.2"),
    "Official cost link should carry the recalculated total construction area."
  );
  steps.push("official-link");

  const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.click('[data-testid="theme-toggle"]');
  await page.waitForFunction(
    (previous) => document.documentElement.classList.contains("dark") !== previous,
    { timeout: 5000 },
    wasDark
  );
  steps.push("theme-toggle");

  await page.setViewport({ width: 390, height: 1100, deviceScaleFactor: 1 });
  await page.waitForSelector('[data-testid="estimated-area-pdf-preview-button"]', {
    visible: true,
  });
  const hasMobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth > 4
  );
  assert(
    !hasMobileOverflow,
    "Estimated construction area route should not overflow horizontally on mobile viewport."
  );
  steps.push("mobile-layout");

  assert(consoleErrors.length === 0, `Console error(s) detected: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `Page error(s) detected: ${pageErrors.join(" | ")}`);
  assert(
    requestFailures.length === 0,
    `Request failure/failures detected: ${requestFailures
      .map((item) => `${item.error} @ ${item.url}`)
      .join(" | ")}`
  );

  console.log(
    JSON.stringify(
      {
        baseUrl,
        routeUrl,
        status: "ok",
        steps,
      },
      null,
      2
    )
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
