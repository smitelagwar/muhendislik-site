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
  if (!condition) {
    throw new Error(message);
  }
}

function shouldIgnoreRequestFailure(request) {
  const errorText = request.failure()?.errorText ?? "";
  const url = request.url();

  return errorText === "net::ERR_ABORTED" && url.includes("?_rsc=");
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

async function clickSelector(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.$eval(selector, (element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
    element.click();
  });
}

async function getText(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  const text = await page.$eval(selector, (element) => element.textContent ?? "");
  return normalizeWhitespace(text);
}

async function getInputValue(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  return page.$eval(selector, (element) => {
    if (element instanceof HTMLInputElement) {
      return element.value;
    }

    return "";
  });
}

async function setInputValue(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press("Backspace");

  if (value) {
    await page.type(selector, value);
  }
}

async function expectDisabled(page, selector, expected) {
  await page.waitForSelector(selector, { visible: true });
  const disabled = await page.$eval(selector, (element) => {
    if (element instanceof HTMLButtonElement) {
      return element.disabled;
    }

    return element.hasAttribute("disabled");
  });

  assert(disabled === expected, `${selector} disabled state should be ${expected}.`);
}

async function openPopupFromClick(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  await page.waitForFunction(
    (targetSelector) => {
      const element = document.querySelector(targetSelector);
      if (!(element instanceof HTMLElement)) return false;
      if (element instanceof HTMLButtonElement) return !element.disabled;
      return !element.hasAttribute("disabled");
    },
    { timeout: 5000 },
    selector
  );

  const popupPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 5000);
    page.once("popup", async (popup) => {
      clearTimeout(timeout);
      resolve(popup);
    });
  });

  await clickSelector(page, selector);
  const popup = await popupPromise;
  assert(popup, `Popup was not opened from '${selector}'.`);
  await wait(900);
  assert(popup.url() !== "", `Popup from '${selector}' did not resolve to a URL.`);
  return popup;
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

async function canvasHasContent(page) {
  await page.waitForSelector("#report-canvas", { visible: true });
  await wait(300);

  return page.$eval("#report-canvas", (canvas) => {
    if (!(canvas instanceof HTMLCanvasElement)) {
      return false;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return false;
    }

    const { width, height } = canvas;
    const samples = [
      context.getImageData(120, 82, 360, 80).data,
      context.getImageData(120, 220, 360, 235).data,
      context.getImageData(506, 220, 774, 670).data,
      context.getImageData(506, 1060, 774, 250).data,
    ];

    let nonWhitePixels = 0;
    for (const data of samples) {
      for (let index = 0; index < data.length; index += 4) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        if (alpha > 0 && (r < 245 || g < 245 || b < 245)) {
          nonWhitePixels += 1;
        }
      }
    }

    return width === 1400 && height === 1600 && nonWhitePixels > 5000;
  });
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
const routeUrl = `${baseUrl}/hesaplamalar/insaat-maliyeti?alan=2500`;
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
const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "construction-v3-download-"));

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
  await page.setViewport({ width: 1440, height: 1500, deviceScaleFactor: 1 });

  const response = await page.goto(routeUrl, {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  assert(
    response?.status() === 200,
    `Construction cost route returned status ${response?.status() ?? "unknown"}.`
  );

  await page.waitForSelector('[data-testid="construction-wizard"]', { visible: true });
  steps.push("page-load");

  await clickSelector(page, '[data-testid="construction-structure-villa"]');
  await clickSelector(page, '[data-testid="construction-next-button"]');
  await page.waitForSelector('[data-testid="construction-total-area-input"]', { visible: true });
  assert(
    (await getInputValue(page, '[data-testid="construction-total-area-input"]')) === "2500",
    "Query parameter should seed the total area input."
  );
  steps.push("query-area-seed");

  await setInputValue(page, '[data-testid="construction-total-area-input"]', "");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("boş bırakılamaz"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-next-button"]', true);
  steps.push("empty-validation");

  await setInputValue(page, '[data-testid="construction-total-area-input"]', "-10");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("en az 50"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-next-button"]', true);
  steps.push("negative-validation");

  await setInputValue(page, '[data-testid="construction-total-area-input"]', "600000");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("en fazla 500.000"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-next-button"]', true);
  steps.push("large-validation");

  await setInputValue(page, '[data-testid="construction-total-area-input"]', "1800");
  await setInputValue(page, '[data-testid="construction-floor-count-input"]', "0");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("en az 1"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-next-button"]', true);
  await setInputValue(page, '[data-testid="construction-floor-count-input"]', "6");
  await setInputValue(page, '[data-testid="construction-basement-floors-input"]', "7");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("en fazla 5"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-next-button"]', true);
  await setInputValue(page, '[data-testid="construction-basement-floors-input"]', "1");
  await expectDisabled(page, '[data-testid="construction-next-button"]', false);
  await clickSelector(page, '[data-testid="construction-next-button"]');
  steps.push("step-two-validation");

  await clickSelector(page, '[data-testid="construction-city-istanbul"]');
  await clickSelector(page, '[data-testid="construction-soil-kotu"]');
  await clickSelector(page, '[data-testid="construction-next-button"]');
  steps.push("location-step");

  await clickSelector(page, '[data-testid="construction-quality-luks"]');
  await clickSelector(page, '[data-testid="construction-facade-cam_giydirme"]');
  await setInputValue(page, '[data-testid="construction-elevator-count-input"]', "0");
  await page.waitForFunction(
    () => (document.body.textContent ?? "").includes("Asansör adedi en az 1"),
    { timeout: 5000 }
  );
  await expectDisabled(page, '[data-testid="construction-calculate-button"]', true);
  await setInputValue(page, '[data-testid="construction-elevator-count-input"]', "2");
  await expectDisabled(page, '[data-testid="construction-calculate-button"]', false);
  await clickSelector(page, '[data-testid="construction-calculate-button"]');
  await page.waitForSelector('[data-testid="construction-result-dashboard"]', { visible: true });
  assert(
    (await getText(page, '[data-testid="construction-grand-total-value"]')).includes("₺"),
    "Result dashboard should show a Turkish Lira grand total."
  );
  steps.push("result-dashboard");

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
  });

  const pdfPopup = await openPopupFromClick(page, '[data-testid="construction-pdf-preview-button"]');
  assert(pdfPopup.url().startsWith("blob:"), `PDF preview should open a blob URL, received ${pdfPopup.url()}.`);
  await pdfPopup.close();
  steps.push("pdf-preview-blob");

  const imagePopup = await openPopupFromClick(page, '[data-testid="construction-image-preview-button"]');
  assert(await canvasHasContent(imagePopup), "Image preview canvas should render nonblank report content.");
  await imagePopup.close();
  steps.push("image-preview-canvas");

  await clickSelector(page, '[data-testid="construction-pdf-download-button"]');
  const downloadedPdf = await waitForDownloadedFile(downloadDir, ".pdf");
  assert(downloadedPdf.toLowerCase().endsWith(".pdf"), "PDF download did not create a pdf file.");
  steps.push("pdf-download");

  const printPopup = await openPopupFromClick(page, '[data-testid="construction-print-button"]');
  assert(printPopup.url().startsWith("blob:"), `Print should open a blob URL, received ${printPopup.url()}.`);
  await printPopup.close();
  steps.push("print-blob");

  await page.setViewport({
    width: 390,
    height: 1000,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await wait(600);
  const hasMobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth > 4
  );
  assert(!hasMobileOverflow, "Construction cost v3 route should not overflow horizontally on mobile viewport.");
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
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(downloadDir, { recursive: true, force: true });
}
