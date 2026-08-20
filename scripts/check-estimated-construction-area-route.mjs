import fs from "fs/promises";
import fsSync from "fs";
import http from "http";
import os from "os";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";

const requestedPort = Number(process.argv[2] ?? "0");
const BUILD_FILES = [".next/BUILD_ID", ".next/server/middleware-manifest.json"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function getBrowserExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Users\\hsyn\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => fsSync.existsSync(candidate));
}

async function waitForProductionBuild(timeoutMs = 60000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const ready = await Promise.all(
      BUILD_FILES.map((file) => fs.access(path.resolve(process.cwd(), file)).then(() => true).catch(() => false))
    );
    if (ready.every(Boolean)) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error("Production build artifacts were not ready in time.");
}

async function getText(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  return normalizeWhitespace(await page.$eval(selector, (element) => element.textContent ?? ""));
}

async function setInputValue(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value);
}

async function waitForDownload(downloadDirectory, extension, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const entries = await fs.readdir(downloadDirectory);
    const match = entries.find((entry) => entry.toLowerCase().endsWith(extension));
    if (match) return path.join(downloadDirectory, match);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Expected ${extension} download was not created in time.`);
}

async function clearDownloads(downloadDirectory) {
  const entries = await fs.readdir(downloadDirectory);
  await Promise.all(entries.map((entry) => fs.rm(path.join(downloadDirectory, entry), { force: true })));
}

async function expectPopup(page, selector) {
  const popupPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);
    page.once("popup", (popup) => {
      clearTimeout(timeout);
      resolve(popup);
    });
  });
  await page.click(selector);
  return popupPromise;
}

function isIgnorablePrefetchFailure({ url, error }) {
  const parsed = new URL(url);
  return (
    error === "net::ERR_ABORTED" &&
    parsed.pathname === "/dokumantasyon" &&
    parsed.searchParams.has("_rsc")
  );
}

async function main() {
  await waitForProductionBuild();
  const executablePath = getBrowserExecutablePath();
  assert(executablePath, "No local Chrome/Edge executable was found for Puppeteer.");

  const app = next({ dev: false, dir: process.cwd(), hostname: "127.0.0.1", port: requestedPort || 3000 });
  await app.prepare();
  const server = http.createServer((request, response) => app.getRequestHandler()(request, response));
  await new Promise((resolve) => server.listen(requestedPort, "127.0.0.1", resolve));

  const resolvedPort = server.address()?.port;
  const baseUrl = `http://127.0.0.1:${resolvedPort}`;
  const legacyUrl = `${baseUrl}/hesaplamalar/tahmini-insaat-alani?arsa=1200&taks=0.35&kaks=1.2&kat=5&profil=konut`;
  const browser = await puppeteer.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const downloadDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ruhsat-report-download-"));
  const consoleErrors = [];
  const requestFailures = [];
  const pageErrors = [];
  const steps = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    requestFailures.push({ url: request.url(), error: request.failure()?.errorText ?? "unknown" });
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDirectory });
    await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });
    const response = await page.goto(legacyUrl, { waitUntil: "networkidle2", timeout: 30000 });
    assert(response?.status() === 200, `Ruhsat route returned status ${response?.status() ?? "unknown"}.`);
    await page.waitForSelector('[data-testid="ruhsat-input-flow"]', { visible: true });
    await page.waitForFunction(() => window.location.search === "", { timeout: 5000 });
    steps.push("canonical-url-and-empty-state");

    const seoState = await page.evaluate(async () => {
      const sitemap = await fetch("/sitemap.xml").then((response) => response.text());
      return {
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
        hasSoftwareSchema: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).some((script) => script.textContent?.includes("SoftwareApplication")),
        sitemap,
      };
    });
    assert(seoState.title.includes("Ruhsat Ön Fizibilite"), "Route metadata should use the ruhsat product title.");
    assert(seoState.canonical.endsWith("/hesaplamalar/tahmini-insaat-alani"), "Route should publish its canonical path.");
    assert(seoState.description.includes("Parsel"), "Route should publish a useful Turkish description.");
    assert(seoState.hasSoftwareSchema, "Route should expose SoftwareApplication JSON-LD.");
    assert(seoState.sitemap.includes("/hesaplamalar/tahmini-insaat-alani"), "Route should remain registered in the sitemap.");
    steps.push("metadata-schema-and-sitemap");

    assert((await getText(page, '[data-testid="ruhsat-result-status"]')).includes("kritik veri eksik"), "Empty state should explain missing critical data.");
    assert((await getText(page, '[data-testid="ruhsat-confidence"]')).includes("henüz"), "Empty state should show below-A confidence.");

    await setInputValue(page, '[data-testid="ruhsat-input-permit-date"]', "2026-07-15");
    await setInputValue(page, '[data-testid="ruhsat-input-parcel-area"]', "1.000,00");
    await setInputValue(page, '[data-testid="ruhsat-input-taks"]', "0,40");
    await setInputValue(page, '[data-testid="ruhsat-input-kaks"]', "1,50");
    await setInputValue(page, '[data-testid="ruhsat-input-floor-count"]', "5");
    await page.waitForFunction(
      () => (document.querySelector('[data-testid="ruhsat-result-status"]')?.textContent ?? "").includes("hesaplandı"),
      { timeout: 5000 }
    );
    assert((await getText(page, '[data-testid="ruhsat-result-taks-max"]')).includes("400,00"), "Comma decimal TAKS should resolve to 400,00 m².");
    assert((await getText(page, '[data-testid="ruhsat-result-emsal-max"]')).includes("1.500,00"), "Comma decimal KAKS should resolve to 1.500,00 m².");
    await page.waitForSelector('[data-testid="ruhsat-scenario-ready"]', { visible: true });
    steps.push("localized-decimal-and-calculation");

    await page.waitForSelector('[data-testid="ruhsat-results-experience"]', { visible: true });
    assert(await page.$$eval('[data-testid^="ruhsat-scenario-"][aria-pressed]', (elements) => elements.length === 3), "Exactly three canonical scenario cards should be shown.");
    assert((await getText(page, '[data-testid="ruhsat-main-bottleneck"]')).includes("Geometri"), "The missing manual geometry should be the primary bottleneck.");
    await page.focus('[data-testid="ruhsat-scenario-COMPACT_MAX_UNITS"]');
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.querySelector('[data-testid="ruhsat-scenario-COMPACT_MAX_UNITS"]')?.getAttribute("aria-pressed") === "true",
      { timeout: 5000 }
    );
    await page.click('[data-testid="ruhsat-why-details"] summary');
    assert((await getText(page, '[data-testid="ruhsat-why-details"]')).includes("Teknik kontrol özeti"), "The why view should expose technical trigger context.");
    await page.click('[data-testid="ruhsat-evidence-details"] summary');
    assert((await getText(page, '[data-testid="ruhsat-evidence-details"]')).includes("TAKS üst sınırı"), "The evidence view should expose legal trace provenance.");
    steps.push("scenario-compare-explainability-and-keyboard-selection");

    const initialCompactScenario = await getText(page, '[data-testid="ruhsat-scenario-COMPACT_MAX_UNITS"]');
    await setInputValue(page, '[data-testid="ruhsat-input-kaks"]', "0,60");
    await page.waitForFunction(
      (previous) => (document.querySelector('[data-testid="ruhsat-scenario-COMPACT_MAX_UNITS"]')?.textContent ?? "").replace(/\s+/g, " ").trim() !== previous,
      { timeout: 5000 },
      initialCompactScenario
    );
    await setInputValue(page, '[data-testid="ruhsat-input-kaks"]', "1,50");
    await page.waitForFunction(
      (expected) => (document.querySelector('[data-testid="ruhsat-scenario-COMPACT_MAX_UNITS"]')?.textContent ?? "").replace(/\s+/g, " ").trim() === expected,
      { timeout: 5000 },
      initialCompactScenario
    );
    steps.push("scenario-recalculation-no-stale-result");

    await page.waitForSelector('[data-testid="ruhsat-report-actions"]', { visible: true });
    await page.click('[data-testid="ruhsat-report-pdf"]');
    const pdfDownload = await waitForDownload(downloadDirectory, ".pdf");
    assert((await fs.stat(pdfDownload)).size > 10_000, "The generated ruhsat PDF should contain a real document payload.");
    await clearDownloads(downloadDirectory);
    await page.click('[data-testid="ruhsat-report-json"]');
    const jsonDownload = await waitForDownload(downloadDirectory, ".json");
    const jsonExport = JSON.parse(await fs.readFile(jsonDownload, "utf8"));
    assert(jsonExport.schemaVersion === "ruhsat-on-fizibilite-export@1", "JSON export should carry its schema version.");
    assert(jsonExport.analysis?.versions?.ruleSnapshot, "JSON export should retain the rule snapshot trace.");
    const printPopup = await expectPopup(page, '[data-testid="ruhsat-report-print"]');
    assert(printPopup, "Printable ruhsat report should open a dedicated browser tab.");
    await printPopup.close();
    const privacyState = await page.evaluate(() => ({
      search: window.location.search,
      ruhsatStorageKeys: Object.keys(window.localStorage).filter((key) => key.toLocaleLowerCase("tr-TR").includes("ruhsat")),
    }));
    assert(privacyState.search === "", "Ruhsat data should not be placed in the route query string.");
    assert(privacyState.ruhsatStorageKeys.length === 0, "Ruhsat data should not be persisted in localStorage.");
    steps.push("local-pdf-print-json-export-and-privacy");

    await page.click('[data-testid="ruhsat-advanced-parcel"] summary');
    await page.waitForSelector('[data-testid="ruhsat-input-geometry"]', { visible: true });
    await page.click('[data-testid="ruhsat-assumptions"] summary');
    await page.waitForSelector('#ruhsat-COMPACT_MAX_UNITS-targetNetAreaM2', { visible: true });
    steps.push("progressive-disclosure");

    await setInputValue(page, '[data-testid="ruhsat-input-parcel-area"]', "0");
    await page.waitForFunction(
      () => (document.querySelector('[data-testid="ruhsat-result-status"]')?.textContent ?? "").includes("Girdileri kontrol edin"),
      { timeout: 5000 }
    );
    await page.waitForSelector('[data-testid="ruhsat-missing-data"]', { visible: true });
    await page.waitForSelector('[data-testid="ruhsat-results-empty"]', { visible: true });
    assert((await page.$('[data-testid="ruhsat-report-actions"]')) === null, "Invalid input must remove stale report actions.");
    steps.push("invalid-input");

    await page.focus('[data-testid="ruhsat-input-parcel-area"]');
    await page.keyboard.press("Tab");
    const activeElementId = await page.evaluate(() => document.activeElement?.id ?? "");
    assert(activeElementId.length > 0, "Keyboard focus should move through the form.");
    steps.push("keyboard-flow");

    const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForFunction((previous) => document.documentElement.classList.contains("dark") !== previous, { timeout: 5000 }, wasDark);
    steps.push("theme-toggle");

    await setInputValue(page, '[data-testid="ruhsat-input-parcel-area"]', "1000");
    await page.waitForSelector('[data-testid="ruhsat-results-experience"]', { visible: true });
    await page.setViewport({ width: 360, height: 1100, deviceScaleFactor: 1 });
    await page.waitForSelector('[data-testid="ruhsat-input-flow"]', { visible: true });
    const hasMobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth > 4);
    assert(!hasMobileOverflow, "Ruhsat route should not overflow horizontally at 360 px.");
    const mobileHierarchy = await page.evaluate(() => {
      const results = document.querySelector('[data-testid="ruhsat-results-experience"]')?.getBoundingClientRect();
      const input = document.querySelector('[data-testid="ruhsat-input-flow"]')?.getBoundingClientRect();
      return Boolean(results && input && results.top < input.top);
    });
    assert(mobileHierarchy, "Mobile layout should prioritize the results experience above the input flow.");
    steps.push("mobile-layout");

    assert(consoleErrors.length === 0, `Console error(s) detected: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `Page error(s) detected: ${pageErrors.join(" | ")}`);
    const relevantFailures = requestFailures.filter((item) => !isIgnorablePrefetchFailure(item));
    assert(relevantFailures.length === 0, `Request failure(s) detected: ${relevantFailures.map((item) => `${item.error} @ ${item.url}`).join(" | ")}`);

    console.log(JSON.stringify({ baseUrl, status: "ok", steps }, null, 2));
  } finally {
    await page.close();
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await fs.rm(downloadDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
