import http from "http";
import next from "next";
import puppeteer from "puppeteer";

const port = Number(process.argv[2] ?? "3007");
const baseUrl = `http://127.0.0.1:${port}`;
const routeUrl = `${baseUrl}/hesaplamalar/tahmini-insaat-alani`;
const detailedDraftKey = "estimated_construction_area_detailed_draft_v1";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function getText(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  const text = await page.$eval(selector, (element) => element.textContent ?? "");
  return normalizeWhitespace(text);
}

async function waitForText(page, selector, expected) {
  await page.waitForFunction(
    ({ targetSelector, targetText }) =>
      (document.querySelector(targetSelector)?.textContent ?? "")
        .replace(/\s+/g, " ")
        .includes(targetText),
    { timeout: 5000 },
    { targetSelector: selector, targetText: expected }
  );
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
    window.localStorage.removeItem(key);
  }, detailedDraftKey);
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="estimated-area-input-arsa"]', { visible: true });
  steps.push("page-load");

  await setInputValue(page, '[data-testid="estimated-area-input-arsa"]', "1000");
  await setInputValue(page, '[data-testid="estimated-area-input-taks"]', "0.30");
  await setInputValue(page, '[data-testid="estimated-area-input-kaks"]', "1.50");
  await setInputValue(page, '[data-testid="estimated-area-input-kat"]', "4");

  await waitForText(page, '[data-testid="estimated-area-result-taban"]', "300");
  assert(
    (await getText(page, '[data-testid="estimated-area-result-taban"]')).includes("300"),
    "Ground area result did not resolve to 300 m2."
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-emsal"]')).includes("1.500"),
    "Emsal area result did not resolve to 1.500 m2."
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-toplam"]')).includes("1.500"),
    "Total area without basement did not resolve to 1.500 m2."
  );
  assert(
    (await getText(page, '[data-testid="estimated-area-result-status"]')).includes("Kontrol"),
    "Status should be warning when 4 floors cannot carry the KAKS area."
  );
  steps.push("quick-base-calculation");

  await setInputValue(page, '[data-testid="estimated-area-input-kat"]', "5");
  await waitForText(page, '[data-testid="estimated-area-result-status"]', "Uyumlu");
  assert(
    (await getText(page, '[data-testid="estimated-area-result-ortalama"]')).includes("300"),
    "Average floor area should resolve to 300 m2 when 5 floors are entered."
  );
  steps.push("quick-floor-compatibility");

  await page.click('[data-testid="estimated-area-basement-yes"]');
  await page.waitForSelector('[data-testid="estimated-area-basement-fields"]', { visible: true });
  await waitForText(page, '[data-testid="estimated-area-result-toplam"]', "1.800");
  assert(
    (await getText(page, '[data-testid="estimated-area-result-basement-total"]')).includes("300"),
    "Default basement area should fall back to the max ground area."
  );
  steps.push("basement-default");

  await setInputValue(page, '[data-testid="estimated-area-input-bodrum-alan"]', "250");
  await waitForText(page, '[data-testid="estimated-area-result-toplam"]', "1.750");
  assert(
    (await getText(page, '[data-testid="estimated-area-result-basement-total"]')).includes("250"),
    "Custom basement area did not update the basement total."
  );
  steps.push("basement-custom");

  await page.click('[data-testid="estimated-area-basement-no"]');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="estimated-area-basement-fields"]'),
    { timeout: 5000 }
  );
  await waitForText(page, '[data-testid="estimated-area-result-toplam"]', "1.500");
  await page.click('[data-testid="estimated-area-basement-yes"]');
  await page.waitForSelector('[data-testid="estimated-area-basement-fields"]', { visible: true });
  await waitForText(page, '[data-testid="estimated-area-result-toplam"]', "1.750");
  steps.push("basement-toggle");

  const quickOfficialHref = await page.$eval(
    '[data-testid="estimated-area-official-link"]',
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    quickOfficialHref.includes("/hesaplamalar/resmi-birim-maliyet-2026?alan=1750"),
    "Quick official cost link does not carry the approximate total construction area."
  );

  await page.click('[data-testid="estimated-area-quick-to-detailed"]');
  await page.waitForSelector('[data-testid="estimated-area-detailed-block-basement-card"]', {
    visible: true,
  });
  await page.waitForSelector('[data-testid="estimated-area-detailed-block-ground-card"]', {
    visible: true,
  });
  steps.push("mode-switch");

  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-basement-grossIndependentAreaM2"]',
    "742.63"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-basement-commonCirculationAreaM2"]',
    "48.79"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-basement-elevatorShaftAreaM2"]',
    "7.28"
  );

  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-ground-grossIndependentAreaM2"]',
    "762.16"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-ground-commonCirculationAreaM2"]',
    "29.26"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-ground-elevatorShaftAreaM2"]',
    "7.28"
  );

  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-typical-residential-repeat"]',
    "3"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-typical-residential-grossIndependentAreaM2"]',
    "727.16"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-typical-residential-commonCirculationAreaM2"]',
    "64.20"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-typical-residential-elevatorShaftAreaM2"]',
    "7.28"
  );

  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-roof-technical-grossIndependentAreaM2"]',
    "16.06"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-roof-technical-commonCirculationAreaM2"]',
    "25.33"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-roof-technical-elevatorShaftAreaM2"]',
    "7.28"
  );

  await page.click('[data-testid="estimated-area-add-custom-block"]');
  await page.waitForSelector('[data-testid="estimated-area-detailed-block-custom-1-card"]', {
    visible: true,
  });
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-custom-1-label"]',
    "1. Kat"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-custom-1-grossIndependentAreaM2"]',
    "773.16"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-custom-1-commonCirculationAreaM2"]',
    "64.20"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-custom-1-elevatorShaftAreaM2"]',
    "7.28"
  );

  await waitForText(page, '[data-testid="estimated-area-detailed-total"]', "4.886,63");
  assert(
    (await getText(page, '[data-testid="estimated-area-detailed-total"]')).includes("4.886,63"),
    "Detailed total did not resolve to 4.886,63 m2 for the normalized fixture."
  );
  await page.waitForSelector('[data-testid="estimated-area-detailed-difference-warning"]', {
    visible: true,
  });
  steps.push("detailed-fixture");

  await page.click('[data-testid="estimated-area-detailed-block-roof-technical-add-technical"]');
  await page.waitForSelector(
    '[data-testid="estimated-area-detailed-block-roof-technical-technical-0-area"]',
    { visible: true }
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-roof-technical-technical-0-label"]',
    "Su deposu"
  );
  await setInputValue(
    page,
    '[data-testid="estimated-area-detailed-block-roof-technical-technical-0-area"]',
    "10"
  );
  await waitForText(page, '[data-testid="estimated-area-detailed-total"]', "4.896,63");
  assert(
    (await getText(page, '[data-testid="estimated-area-detailed-technical-total"]')).includes(
      "10"
    ),
    "Manual technical area did not increase the technical total."
  );
  steps.push("manual-technical-area");

  const detailedOfficialHref = await page.$eval(
    '[data-testid="estimated-area-official-link"]',
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    detailedOfficialHref.includes("/hesaplamalar/resmi-birim-maliyet-2026?alan=4896.63"),
    "Detailed official cost link does not carry the detailed total construction area."
  );
  steps.push("detailed-official-link");

  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="estimated-area-mode-detailed"]', { visible: true });
  await waitForText(page, '[data-testid="estimated-area-detailed-total"]', "4.896,63");
  steps.push("local-draft-restore");

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
