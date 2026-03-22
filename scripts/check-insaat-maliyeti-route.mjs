import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";
import * as XLSX from "xlsx";

const requestedPort = Number(process.argv[2] ?? "0");
const BUILD_FILES = [".next/BUILD_ID", ".next/server/middleware-manifest.json"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProductionBuild(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const ready = await Promise.all(
      BUILD_FILES.map((file) =>
        fs
          .access(path.resolve(process.cwd(), file))
          .then(() => true)
          .catch(() => false)
      )
    );

    if (ready.every(Boolean)) {
      return;
    }

    await wait(500);
  }

  throw new Error("Production build artifacts were not ready in time.");
}

async function getText(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  const text = await page.$eval(selector, (element) => element.textContent ?? "");
  return normalizeWhitespace(text);
}

async function clickSelector(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(selector, (element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    element.click();
  });
}

async function setInputValue(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type(selector, value);
}

async function waitForDownloadedFile(downloadDir, extension, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const entries = await fs.readdir(downloadDir);
    const file = entries.find((entry) => entry.toLowerCase().endsWith(extension));
    if (file) {
      return path.join(downloadDir, file);
    }

    await wait(250);
  }

  throw new Error(`Download '${extension}' was not created within the expected time.`);
}

async function waitForScenarioCount(page, expectedCount) {
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('[data-testid="construction-scenario-card"]').length === count,
    { timeout: 5000 },
    expectedCount
  );
}

async function clickButtonByText(page, rootSelector, text) {
  const clicked = await page.evaluate(
    ({ rootSelector: root, textToMatch }) => {
      const scope = root ? document.querySelector(root) : document;
      if (!scope) return false;

      const button = [...scope.querySelectorAll("button")].find((element) =>
        (element.textContent ?? "").includes(textToMatch)
      );

      if (!button) return false;
      button.click();
      return true;
    },
    { rootSelector, textToMatch: text }
  );

  assert(clicked, `Button containing '${text}' was not found inside '${rootSelector}'.`);
}

async function openPopupFromClick(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.waitForFunction(
    (targetSelector) => {
      const element = document.querySelector(targetSelector);
      if (!(element instanceof HTMLElement)) return false;
      if (element instanceof HTMLButtonElement) {
        return !element.disabled;
      }

      return !element.hasAttribute("disabled");
    },
    { timeout: 5000 },
    selector
  );
  await page.$eval(selector, (element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });

  const popupPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 4000);
    page.once("popup", async (popup) => {
      clearTimeout(timeout);
      resolve(popup);
    });
  });

  await page.click(selector, { delay: 20 });
  const popup = await popupPromise;
  assert(popup, `Popup was not opened from '${selector}'.`);
  await wait(800);
  assert(popup.url() !== "", `Popup from '${selector}' did not resolve to a URL.`);
  await popup.close();
}

async function readWorkbook(filePath) {
  const workbookBuffer = await fs.readFile(filePath);
  const workbook = XLSX.read(workbookBuffer, { type: "buffer" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const lastSheet = workbook.Sheets[workbook.SheetNames[workbook.SheetNames.length - 1]];

  return {
    sheetNames: workbook.SheetNames,
    summaryRows: XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }),
    scenarioRows: XLSX.utils.sheet_to_json(lastSheet, { defval: "" }),
  };
}

await waitForProductionBuild();

const app = next({
  dev: false,
  dir: process.cwd(),
  hostname: "127.0.0.1",
  port: requestedPort || 3000,
});

await app.prepare();

const handle = app.getRequestHandler();
const server = http.createServer((request, response) => handle(request, response));
await new Promise((resolve) => server.listen(requestedPort, "127.0.0.1", resolve));

const resolvedPort = server.address()?.port;
const baseUrl = `http://127.0.0.1:${resolvedPort}`;
const routeUrl = `${baseUrl}/hesaplamalar/insaat-maliyeti`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
const pageErrors = [];
const steps = [];
const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "construction-cost-download-"));

await page.evaluateOnNewDocument(() => {
  const clipboard = {
    writeText: async (value) => {
      window.__copiedText = value;
    },
  };

  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
});

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

try {
  await page.setViewport({ width: 1440, height: 1600, deviceScaleFactor: 1 });

  const response = await page.goto(routeUrl, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  assert(
    response?.status() === 200,
    `Construction cost route returned status ${response?.status() ?? "unknown"}.`
  );

  await page.waitForSelector('[data-testid="construction-add-scenario-button"]', {
    visible: true,
  });
  await page.waitForSelector('[data-testid="construction-total-value"]', { visible: true });
  steps.push("page-load");

  const initialTotal = await getText(page, '[data-testid="construction-total-value"]');
  await clickSelector(page, '[data-testid="construction-load-example-button"]');
  await page.waitForFunction(
    (previous) =>
      (document.querySelector('[data-testid="construction-total-value"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim() !== previous,
    { timeout: 5000 },
    initialTotal
  );
  steps.push("load-example");

  const exampleTotal = await getText(page, '[data-testid="construction-total-value"]');
  await clickSelector(page, '[data-testid="construction-reset-button"]');
  await page.waitForFunction(
    (previous) =>
      (document.querySelector('[data-testid="construction-total-value"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim() !== previous,
    { timeout: 5000 },
    exampleTotal
  );
  steps.push("reset");

  await clickSelector(page, '[data-testid="construction-load-example-button"]');
  await page.waitForFunction(
    (previous) =>
      (document.querySelector('[data-testid="construction-total-value"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim() !== previous,
    { timeout: 5000 },
    await getText(page, '[data-testid="construction-total-value"]')
  );
  steps.push("reload-example");

  await page.click('[data-testid="construction-add-scenario-button"]');
  await waitForScenarioCount(page, 2);
  steps.push("scenario-add");

  await clickSelector(page, '[data-testid="construction-mode-toggle-button"]');
  await page.waitForFunction(() => !document.querySelector("#construction-compare"), {
    timeout: 5000,
  });
  await clickSelector(page, '[data-testid="construction-mode-toggle-button"]');
  await page.waitForSelector("#construction-compare", { visible: true });
  steps.push("mode-toggle");

  await clickButtonByText(page, '[data-testid="construction-scenario-card"]', "Kopyala");
  await waitForScenarioCount(page, 3);
  steps.push("scenario-duplicate");

  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid="construction-scenario-card"]')];
    const lastCard = cards[cards.length - 1];
    const deleteButton = [...lastCard.querySelectorAll("button")].find((element) =>
      (element.textContent ?? "").includes("Sil")
    );
    deleteButton?.click();
  });
  await waitForScenarioCount(page, 2);
  steps.push("scenario-remove");

  if (!(await page.$('[data-testid="construction-total-area-input"]'))) {
    await clickSelector(page, '[data-testid="construction-area-mode-toggle-button"]');
    await page.waitForSelector('[data-testid="construction-total-area-input"]', {
      visible: true,
    });
  }

  const totalBefore = await getText(page, '[data-testid="construction-total-value"]');
  await setInputValue(page, '[data-testid="construction-total-area-input"]', "2400");
  await page.waitForFunction(
    (previous) =>
      (document.querySelector('[data-testid="construction-total-value"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim() !== previous,
    { timeout: 5000 },
    totalBefore
  );
  steps.push("area-input");

  await setInputValue(page, '[data-testid="construction-breakdown-search-input"]', "KDV");
  await page.waitForFunction(
    () => {
      const root = document.getElementById("construction-breakdown");
      return Boolean(root && /KDV/i.test(root.textContent ?? ""));
    },
    { timeout: 5000 }
  );
  steps.push("breakdown-search");

  await clickSelector(page, '#construction-breakdown [data-testid="construction-line-item-edit-button"]');
  await page.waitForSelector(
    '#construction-breakdown [data-testid="construction-line-item-edit-input"]',
    { visible: true }
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '#construction-breakdown [data-testid="construction-line-item-edit-input"]'
      ),
    { timeout: 5000 }
  );
  steps.push("line-item-edit");

  await setInputValue(page, '[data-testid="construction-breakdown-search-input"]', "");
  await clickSelector(page, '[data-testid="construction-high-impact-toggle-button"]');
  await page.waitForFunction(
    () => {
      const root = document.getElementById("construction-breakdown");
      return Boolean(root && /yuksek|etki|yüksek/i.test(root.textContent ?? ""));
    },
    { timeout: 5000 }
  );
  await clickSelector(page, '[data-testid="construction-high-impact-toggle-button"]');
  steps.push("high-impact-filter");

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });

  await openPopupFromClick(page, '[data-testid="construction-pdf-preview-button"]');
  steps.push("pdf-preview");

  await clickSelector(page, '[data-testid="construction-copy-link-button"]');
  await page.waitForFunction(
    () =>
      typeof window.__copiedText === "string" &&
      window.__copiedText.includes("/hesaplamalar/insaat-maliyeti"),
    { timeout: 5000 }
  );
  steps.push("copy-link");

  await clickSelector(page, '[data-testid="construction-pdf-download-button"]');
  const downloadedPdf = await waitForDownloadedFile(downloadDir, ".pdf");
  assert(downloadedPdf.toLowerCase().endsWith(".pdf"), "PDF download did not create a pdf file.");
  steps.push("pdf-download");

  await openPopupFromClick(page, '[data-testid="construction-print-button"]');
  steps.push("print");

  await clickSelector(page, '[data-testid="construction-excel-download-button"]');
  const downloadedExcel = await waitForDownloadedFile(downloadDir, ".xlsx");
  const workbook = await readWorkbook(downloadedExcel);
  assert(workbook.sheetNames.length >= 4, "Excel export should include all workbook sheets.");
  assert(workbook.scenarioRows.length >= 2, "Excel export should include scenario rows.");
  assert(
    workbook.summaryRows.some((row) => Array.isArray(row) && row.includes("Rapor")),
    "Excel summary sheet should include report metadata."
  );
  steps.push("excel");

  await clickSelector(page, '[data-testid="construction-json-export-button"]');
  const exportedJsonPath = await waitForDownloadedFile(downloadDir, ".json");
  const exportedJson = JSON.parse(await fs.readFile(exportedJsonPath, "utf-8"));
  assert(Array.isArray(exportedJson.scenarios), "JSON export should contain scenarios.");
  assert(exportedJson.scenarios.length >= 2, "JSON export should include active scenarios.");
  assert(exportedJson.version === 2, "JSON export should preserve collection version.");
  steps.push("json-export");

  const importJsonPath = path.join(downloadDir, "import-scenario.json");
  await fs.writeFile(
    importJsonPath,
    JSON.stringify(
      {
        activeScenarioId: "import-a",
        comparisonMode: "single",
        version: 2,
        scenarios: [
          {
            id: "import-a",
            name: "Imported Scenario",
            inputs: {
              projectName: "JSON Test",
              structureKind: "villa",
              qualityLevel: "premium",
              floorCount: 2,
              basementCount: 1,
              unitCount: 1,
              saleableArea: 420,
              commonAreaRatio: 0.08,
              facadeComplexity: 1.1,
              elevatorCount: 0,
              area: {
                advancedMode: false,
                totalArea: 540,
                basementArea: 0,
                normalArea: 0,
                mezzanineArea: 0,
                roofTerraceArea: 0,
                parkingArea: 60,
                landscapeArea: 240,
              },
              commercial: {
                contractorMarginRate: 0.18,
                vatRate: 0.2,
                overheadRate: 0.1,
                contingencyRate: 0.05,
                targetSalePrice: 68000,
                durationMonths: 12,
                monthlyInflationRate: 0.018,
                contractorProfile: "bireysel",
              },
              site: {
                region: "antalya",
                soilClass: "ZC",
                siteDifficulty: "orta",
                climateZone: "sicakNemli",
                heatingSystem: "bireyselKombi",
                facadeSystem: "tasCephe",
                mepLevel: "orta",
                parkingType: "acik",
                wetAreaDensity: "orta",
              },
              reference: {
                officialSelection: null,
              },
            },
            manualOverrides: {
              mekanik: 1234567,
            },
          },
        ],
      },
      null,
      2
    )
  );

  const importInput = await page.$('input[type="file"][accept="application/json"]');
  assert(importInput, "JSON import input was not found.");
  await importInput.uploadFile(importJsonPath);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[data-testid="construction-scenario-card"] input')].some(
        (input) => (input.value || "").includes("Imported Scenario")
      ),
    { timeout: 5000 }
  );
  steps.push("json-import");

  await setInputValue(page, '[data-testid="construction-breakdown-search-input"]', "Mekanik");
  await clickSelector(page, '[data-testid="construction-overrides-toggle-button"]');
  await page.waitForSelector(
    '#construction-breakdown [data-testid="construction-line-item-overridden-badge"]',
    { visible: true }
  );
  await page.waitForSelector(
    '#construction-breakdown [data-testid="construction-line-item-reset-button"]',
    { visible: true }
  );
  steps.push("override-restore");

  await clickSelector(page, '#construction-breakdown [data-testid="construction-line-item-reset-button"]');
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '#construction-breakdown [data-testid="construction-line-item-reset-button"]'
      ),
    { timeout: 5000 }
  );
  await clickSelector(page, '[data-testid="construction-overrides-toggle-button"]');
  await setInputValue(page, '[data-testid="construction-breakdown-search-input"]', "");
  steps.push("override-reset");

  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await wait(600);

  await page.waitForSelector('[data-testid="construction-mobile-open-summary-button"]', {
    visible: true,
  });
  await clickSelector(page, '[data-testid="construction-mobile-copy-link-button"]');
  await page.waitForFunction(
    () =>
      typeof window.__copiedText === "string" &&
      window.__copiedText.includes("/hesaplamalar/insaat-maliyeti"),
    { timeout: 5000 }
  );
  steps.push("mobile-copy-link");

  await page.evaluate(() => {
    window.__openCallCount = 0;
    const fakeWindow = {
      close() {},
      focus() {},
      print() {},
      location: {
        href: "",
      },
    };
    window.open = () => {
      window.__openCallCount += 1;
      return fakeWindow;
    };
  });
  await clickSelector(page, '[data-testid="construction-mobile-preview-button"]');
  await page.waitForFunction(() => window.__openCallCount >= 1, { timeout: 5000 });
  steps.push("mobile-preview");

  await clickSelector(page, '[data-testid="construction-mobile-open-summary-button"]');
  await page.waitForSelector('[data-testid="construction-mobile-close-summary-button"]', {
    visible: true,
  });
  await clickSelector(page, '[data-testid="construction-mobile-sheet-copy-link-button"]');
  await page.waitForFunction(
    () =>
      typeof window.__copiedText === "string" &&
      window.__copiedText.includes("/hesaplamalar/insaat-maliyeti"),
    { timeout: 5000 }
  );
  await clickSelector(page, '[data-testid="construction-mobile-close-summary-button"]');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="construction-mobile-close-summary-button"]'),
    { timeout: 5000 }
  );
  steps.push("mobile-sheet");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        steps,
        consoleErrors,
        requestFailures,
        pageErrors,
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(downloadDir, { recursive: true, force: true });
}
