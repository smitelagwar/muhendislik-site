import fs from "fs";
import http from "http";
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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProductionBuild(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const ready = BUILD_FILES.every((file) => fs.existsSync(path.resolve(process.cwd(), file)));
    if (ready) {
      return;
    }

    await wait(500);
  }

  throw new Error("Production build artifacts were not ready in time.");
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

  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function goto(page, url) {
  const response = await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  const status = response?.status() ?? 0;
  assert(status >= 200 && status < 400, `Route '${url}' returned status ${status || "unknown"}.`);
}

async function getHref(page, selector) {
  await page.waitForSelector(selector, { visible: true });
  return page.$eval(selector, (element) => element.getAttribute("href") ?? "");
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
const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setCacheEnabled(false);

await page.evaluateOnNewDocument(() => {
  window.__copiedText = "";
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (value) => {
        window.__copiedText = String(value);
      },
    },
  });
});

const results = [];

try {
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });

  await goto(page, `${baseUrl}/hesaplamalar`);
  await page.waitForSelector('a[href="/hesaplamalar/tahmini-insaat-alani"]', { visible: true });
  await page.click('a[href="/hesaplamalar/tahmini-insaat-alani"]');
  await page.waitForFunction(
    () => window.location.pathname === "/hesaplamalar/tahmini-insaat-alani",
    { timeout: 10000 }
  );
  assert(
    (await getHref(page, '[data-testid="header-context-back-link"]')) === "/hesaplamalar",
    "Estimated area back CTA should target /hesaplamalar."
  );
  await page.click('[data-testid="header-context-back-link"]');
  await page.waitForFunction(() => window.location.pathname === "/hesaplamalar", {
    timeout: 10000,
  });
  results.push("hesaplamalar -> tahmini alan -> geri");

  for (const pathname of [
    "/hesaplamalar/insaat-maliyeti",
    "/hesaplamalar/resmi-birim-maliyet-2026",
  ]) {
    await goto(page, `${baseUrl}${pathname}`);
    assert(
      (await getHref(page, '[data-testid="header-context-back-link"]')) === "/hesaplamalar",
      `${pathname} back CTA should target /hesaplamalar.`
    );
    results.push(`${pathname} back target`);
  }

  await goto(
    page,
    `${baseUrl}/hesaplamalar/tahmini-insaat-alani?arsa=1200&taks=0.35&kaks=1.2&kat=5&profil=konut&bodrum=0`
  );
  await page.waitForFunction(() => {
    const url = new URL(window.location.href);
    return !url.searchParams.has("profil") && !url.searchParams.has("bodrum");
  }, { timeout: 10000 });
  const estimatedUrl = new URL(page.url());
  assert(estimatedUrl.searchParams.get("arsa") === "1200", "Estimated area URL should keep arsa.");
  assert(!estimatedUrl.searchParams.has("profil"), "Default profile should not remain in URL.");
  assert(!estimatedUrl.searchParams.has("bodrum"), "Default bodrum=0 should not remain in URL.");
  results.push("estimated area url cleanup");

  await goto(page, `${baseUrl}/hesaplamalar/resmi-birim-maliyet-2026`);
  assert(new URL(page.url()).search === "", "Official cost default route should stay query-free.");
  const compareHref = await getHref(page, '[data-testid="official-compare-link"]');
  assert(
    !compareHref.includes("alan=1000"),
    "Official cost compare link should not carry default alan=1000."
  );
  results.push("official cost default url");

  await goto(page, `${baseUrl}/hesaplamalar/insaat-maliyeti`);
  assert(new URL(page.url()).search === "", "Construction cost route should stay query-free while editing.");
  await page.$eval('[data-testid="construction-copy-link-button"]', (element) => element.click());
  await page.waitForFunction(
    () => typeof window.__copiedText === "string" && window.__copiedText.includes("?"),
    { timeout: 10000 }
  );
  results.push("construction cost explicit share link");

  await goto(page, `${baseUrl}/beton-dokumu-kontrol-listesi`);
  const articleBackHref = await page.$eval(
    "main article a[href^='/kategori/']",
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    articleBackHref.startsWith("/kategori/"),
    "Article page should expose a section-aware back or breadcrumb link."
  );
  results.push("article section navigation");

  await goto(page, `${baseUrl}/kategori/bina-asamalari/proje-hazirlik/elektrik-projesi`);
  const guideBackHref = await page.$eval(
    "main article a[href^='/kategori/bina-asamalari/']",
    (element) => element.getAttribute("href") ?? ""
  );
  assert(
    guideBackHref === "/kategori/bina-asamalari/proje-hazirlik",
    "Nested bina aşamaları guide should point back to its logical parent."
  );
  results.push("guide parent navigation");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/hesaplamalar/tahmini-insaat-alani`);
  await page.waitForSelector('[data-testid="header-context-back-link"]', {
    visible: true,
  });
  results.push("mobile back access");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        baseUrl,
        checks: results,
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
