import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import fsSync from "fs";
import next from "next";
import puppeteer from "puppeteer";

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

function parseTurkishNumber(value) {
  const match = value.match(/-?[\d.,]+/);
  if (!match) {
    return Number.NaN;
  }

  return Number.parseFloat(match[0].replaceAll(".", "").replace(",", "."));
}

function shouldIgnoreRequestFailure(request) {
  const errorText = request.failure()?.errorText ?? "";
  const url = request.url();

  return errorText === "net::ERR_ABORTED" && url.includes("?_rsc=");
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

async function getValue(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  return page.$eval(selector, (element) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return element.value;
    }

    return "";
  });
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

async function selectValue(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.select(selector, value);
}

async function isDisabled(page, selector) {
  await page.waitForSelector(selector);
  return page.$eval(selector, (element) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return element.disabled;
    }

    return false;
  });
}

async function waitForQueryParam(page, key, expectedValue) {
  await page.waitForFunction(
    ({ expectedKey, expected }) =>
      new URL(window.location.href).searchParams.get(expectedKey) === expected,
    { timeout: 7000 },
    { expectedKey: key, expected: expectedValue }
  );
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

async function openPopupFromClick(page, selector) {
  await page.waitForSelector(selector, { visible: true });
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
  await wait(700);
  assert(popup.url() !== "", `Popup from '${selector}' did not resolve to a URL.`);
  await popup.close();
}

async function toggleOfficialOverride(page) {
  const toggled = await page.evaluate(() => {
    const label = [...document.querySelectorAll("label")].find((element) =>
      (element.textContent ?? "").includes("Resmî sınıfı elle sabitle")
    );

    if (!(label instanceof HTMLLabelElement)) {
      return false;
    }

    const input = label.querySelector('input[type="checkbox"]');
    if (!(input instanceof HTMLInputElement)) {
      return false;
    }

    input.click();
    return true;
  });

  assert(toggled, "Override checkbox could not be toggled.");
}

await waitForProductionBuild();
const executablePath = getBrowserExecutablePath();
assert(executablePath, "No local Chrome/Edge executable was found for Puppeteer.");

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
const routeUrl = `${baseUrl}/hesaplamalar/hizli-metraj?tip=villa-bungalov&alan=220&kat=2&bodrumKat=0&gel=1`;

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const consoleErrors = [];
const requestFailures = [];
const pageErrors = [];
const steps = [];
const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "quick-quantity-download-"));

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

page.on("requestfailed", (request) => {
  if (shouldIgnoreRequestFailure(request)) {
    return;
  }

  requestFailures.push({
    url: request.url(),
    error: request.failure()?.errorText ?? "unknown",
  });
});

page.on("pageerror", (error) => {
  pageErrors.push(error.message);
});

try {
  await page.setViewport({ width: 1440, height: 1800, deviceScaleFactor: 1 });

  const response = await page.goto(routeUrl, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  assert(
    response?.status() === 200,
    `Quick quantity route returned status ${response?.status() ?? "unknown"}.`
  );

  await page.waitForSelector('[data-testid="hizli-metraj-result-total-area"]', { visible: true });
  steps.push("page-load");

  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-kat-alani"]')) === "220",
    "Initial area query value should be restored."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-normal-kat"]')) === "2",
    "Initial floor count query value should be restored."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-bodrum-kat"]')) === "0",
    "Initial basement count query value should be restored."
  );
  assert(
    (await getText(page, '[data-testid="hizli-metraj-result-total-area"]')).includes("440"),
    "Villa scenario should produce 440 m2 total area."
  );
  assert(
    (await isDisabled(page, '[data-testid="hizli-metraj-input-bodrum-alan"]')) === true,
    "Basement area input should be disabled when basement count is zero."
  );
  assert(
    (await isDisabled(page, '[data-testid="hizli-metraj-select-perde"]')) === true,
    "Retaining-wall selector should be disabled when basement count is zero."
  );
  steps.push("initial-query-state");

  const villaRebarIntensity = parseTurkishNumber(
    await getText(page, '[data-testid="hizli-metraj-result-rebar-intensity"]')
  );
  assert(villaRebarIntensity > 0, "Villa scenario should produce a positive rebar intensity.");

  const previousIntensityText = await getText(page, '[data-testid="hizli-metraj-result-rebar-intensity"]');
  await clickSelector(page, '[data-testid="hizli-metraj-arketip-apartman-4-7-kat"]');
  await page.waitForFunction(
    (previous) => {
      const text =
        document.querySelector('[data-testid="hizli-metraj-result-rebar-intensity"]')?.textContent ??
        "";
      return text.replace(/\s+/g, " ").trim() !== previous;
    },
    { timeout: 5000 },
    previousIntensityText
  );
  const apartmentRebarIntensity = parseTurkishNumber(
    await getText(page, '[data-testid="hizli-metraj-result-rebar-intensity"]')
  );
  assert(
    apartmentRebarIntensity > villaRebarIntensity,
    "Mid-rise apartment preset should produce a higher rebar intensity than villa preset."
  );
  steps.push("preset-comparison");

  await clickSelector(page, '[data-testid="hizli-metraj-arketip-apartman-11-17-kat"]');
  await setInputValue(page, '[data-testid="hizli-metraj-input-kat-alani"]', "475");
  await setInputValue(page, '[data-testid="hizli-metraj-input-normal-kat"]', "6");
  await setInputValue(page, '[data-testid="hizli-metraj-input-bodrum-kat"]', "2");
  await setInputValue(page, '[data-testid="hizli-metraj-input-bodrum-alan"]', "520");
  await selectValue(page, '[data-testid="hizli-metraj-select-tasiyici"]', "cercevePerde");
  await selectValue(page, '[data-testid="hizli-metraj-select-doseme"]', "kirisli");
  await selectValue(page, '[data-testid="hizli-metraj-select-temel"]', "surekli");
  await selectValue(page, '[data-testid="hizli-metraj-select-zemin"]', "ZE");
  await selectValue(page, '[data-testid="hizli-metraj-select-deprem"]', "dusuk");
  await selectValue(page, '[data-testid="hizli-metraj-select-plan"]', "girintili");
  await selectValue(page, '[data-testid="hizli-metraj-select-perde"]', "kismi");
  await selectValue(page, '[data-testid="hizli-metraj-select-aciklik"]', "genis");

  await waitForQueryParam(page, "tip", "apartman-11-17-kat");
  await waitForQueryParam(page, "alan", "475");
  await waitForQueryParam(page, "kat", "6");
  await waitForQueryParam(page, "bodrumKat", "2");
  await waitForQueryParam(page, "bodrumAlan", "520");
  await waitForQueryParam(page, "tasiyici", "cercevePerde");
  await waitForQueryParam(page, "doseme", "kirisli");
  await waitForQueryParam(page, "temel", "surekli");
  await waitForQueryParam(page, "zemin", "ZE");
  await waitForQueryParam(page, "deprem", "dusuk");
  await waitForQueryParam(page, "plan", "girintili");
  await waitForQueryParam(page, "perde", "kismi");
  await waitForQueryParam(page, "aciklik", "genis");
  await waitForQueryParam(page, "gel", "1");
  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="hizli-metraj-result-total-area"]')?.textContent ?? "")
        .replace(/\s+/g, " ")
        .includes("3.890"),
    { timeout: 5000 }
  );
  steps.push("query-roundtrip");

  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForSelector('[data-testid="hizli-metraj-result-total-area"]', { visible: true });
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-kat-alani"]')) === "475",
    "Reload should preserve area input."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-normal-kat"]')) === "6",
    "Reload should preserve normal floor count."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-bodrum-kat"]')) === "2",
    "Reload should preserve basement count."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-input-bodrum-alan"]')) === "520",
    "Reload should preserve basement area."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-tasiyici"]')) === "cercevePerde",
    "Reload should preserve structural system."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-doseme"]')) === "kirisli",
    "Reload should preserve slab system."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-temel"]')) === "surekli",
    "Reload should preserve foundation type."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-zemin"]')) === "ZE",
    "Reload should preserve soil class."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-deprem"]')) === "dusuk",
    "Reload should preserve seismic demand."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-plan"]')) === "girintili",
    "Reload should preserve plan compactness."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-perde"]')) === "kismi",
    "Reload should preserve retaining-wall choice."
  );
  assert(
    (await getValue(page, '[data-testid="hizli-metraj-select-aciklik"]')) === "genis",
    "Reload should preserve span class."
  );
  steps.push("reload-state");

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });

  await openPopupFromClick(page, '[data-testid="hizli-metraj-pdf-preview-button"]');
  steps.push("pdf-preview");

  await clickSelector(page, '[data-testid="hizli-metraj-pdf-download-button"]');
  const downloadedPdf = await waitForDownloadedFile(downloadDir, ".pdf");
  assert(downloadedPdf.toLowerCase().endsWith(".pdf"), "PDF download did not create a pdf file.");
  steps.push("pdf-download");

  await openPopupFromClick(page, '[data-testid="hizli-metraj-pdf-print-button"]');
  steps.push("pdf-print");

  const nextStepHref = await page.$eval(
    '[data-testid="hizli-metraj-next-step-link"]',
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    nextStepHref.startsWith("/hesaplamalar/insaat-maliyeti?"),
    "Next step link should carry the user to construction cost analysis."
  );

  const officialHref = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((element) =>
      (element.getAttribute("href") ?? "").startsWith("/hesaplamalar/resmi-birim-maliyet-2026?")
    );

    return link?.getAttribute("href") ?? "";
  });
  assert(
    officialHref.startsWith("/hesaplamalar/resmi-birim-maliyet-2026?"),
    "Official cost CTA should carry the recalculated context."
  );
  steps.push("cta-links");

  await page.setViewport({
    width: 390,
    height: 1100,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await wait(600);

  const hasMobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth > 4
  );
  assert(!hasMobileOverflow, "Quick quantity route should not overflow horizontally on mobile.");
  steps.push("mobile-layout");

  await page.setViewport({ width: 1440, height: 1800, deviceScaleFactor: 1 });
  await wait(400);

  await toggleOfficialOverride(page);
  await page.waitForSelector('[data-testid="hizli-metraj-select-official-group"]', {
    visible: true,
  });
  await selectValue(page, '[data-testid="hizli-metraj-select-official-group"]', "V");
  await selectValue(page, '[data-testid="hizli-metraj-select-official-class"]', "B");
  await page.waitForSelector('[data-testid="hizli-metraj-error"]', { visible: true });
  assert(
    (await getText(page, '[data-testid="hizli-metraj-error"]')).includes(
      "Seçilen resmî sınıf bu v1 metraj aracında desteklenmiyor"
    ),
    "Unsupported official selection should produce a Turkish validation message."
  );
  await waitForQueryParam(page, "grup", "V");
  await waitForQueryParam(page, "sinif", "B");
  steps.push("unsupported-official-class");

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
        status: "ok",
        steps,
        baseUrl,
        routeUrl,
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
