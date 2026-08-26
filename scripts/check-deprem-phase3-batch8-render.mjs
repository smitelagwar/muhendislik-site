import fs from "node:fs";
import http from "node:http";
import next from "next";
import puppeteer from "puppeteer";

const requestedPort = Number(process.argv[2] ?? "0");
const slugs = [
  "tbdy-betonarme-perde-bosluklari-modelleme",
  "tbdy-betonarme-diyafram-toplayici-baslik",
  "tbdy-2018-betonarme-analiz",
  "kisa-kolon-etkisi-tbdy-2018",
];
const routes = slugs.map((slug) => `/${slug}`);
const viewports = [
  { id: "desktop", width: 1440, height: 900, mobile: false },
  { id: "mobile", width: 390, height: 844, mobile: true },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function browserExecutablePath() {
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;
  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    // Fall through to platform candidates.
  }
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function inspectRoute(browser, baseUrl, route, theme, viewport) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  try {
    await page.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile,
    });
    await page.evaluateOnNewDocument((selectedTheme) => {
      window.localStorage.setItem("theme", selectedTheme);
    }, theme);

    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    assert(response && response.status() < 400, `${route} ${response?.status() ?? "yanıt yok"} durum kodu döndürdü.`);
    await page.waitForSelector("h1", { visible: true, timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(() => {
      const article = document.querySelector("article") ?? document.body;
      const images = [...article.querySelectorAll("img")].map((img) => ({
        alt: img.getAttribute("alt") ?? "",
        width: img.getBoundingClientRect().width,
        height: img.getBoundingClientRect().height,
      }));
      const heading = document.querySelector("h1");
      const tables = [...article.querySelectorAll("table")];
      const visibleSections = [...article.querySelectorAll("h2, h3")].filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length;
      return {
        htmlTheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        h1: heading?.textContent?.trim() ?? "",
        visibleSections,
        tableCount: tables.length,
        imageCount: images.filter((image) => image.width > 0 && image.height > 0).length,
        hasRolloutDiagram: images.some((image) => image.alt.includes("teknik kontrol şeması") && image.width > 0 && image.height > 0),
        hasPhase3ControlList: (article.textContent ?? "").includes("Proje kontrol listesi"),
      };
    });

    assert(result.htmlTheme === theme, `${route}: ${theme} teması etkinleşmedi.`);
    assert(!result.horizontalOverflow, `${route}: ${viewport.id}/${theme} görünümünde sayfa yatay taşma üretiyor.`);
    assert(Boolean(result.h1), `${route}: görünür H1 bulunamadı.`);
    assert(result.visibleSections >= 5, `${route}: profesyonel bölüm yapısı render edilmedi.`);
    assert(result.tableCount >= 1, `${route}: teknik tablo render edilmedi.`);
    assert(result.imageCount >= 2, `${route}: cover + body figure görsel kontratı render edilmedi.`);
    assert(result.hasRolloutDiagram, `${route}: rollout body diagram görünür değil.`);
    assert(result.hasPhase3ControlList, `${route}: FAZ 3 teknik kontrol listesi görünür değil.`);
    assert(pageErrors.length === 0, `${route}: page error: ${pageErrors.slice(0, 3).join(" | ")}`);

    return { route, viewport: viewport.id, theme, h1: result.h1, sections: result.visibleSections, tables: result.tableCount, images: result.imageCount };
  } finally {
    await page.close();
  }
}

const executablePath = browserExecutablePath();
assert(executablePath, "Puppeteer için Chrome/Chromium bulunamadı.");

const app = next({ dev: false, dir: process.cwd(), hostname: "127.0.0.1", port: requestedPort || 3000 });
await app.prepare();
const handle = app.getRequestHandler();
const server = http.createServer((request, response) => handle(request, response));
await new Promise((resolve) => server.listen(requestedPort, "127.0.0.1", resolve));
const resolvedPort = server.address()?.port;
const baseUrl = `http://127.0.0.1:${resolvedPort}`;
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const completed = [];

try {
  for (const route of routes) {
    for (const theme of ["light", "dark"]) {
      for (const viewport of viewports) {
        completed.push(await inspectRoute(browser, baseUrl, route, theme, viewport));
      }
    }
  }
  console.log(JSON.stringify({
    status: "ok",
    phase: "FAZ 3 batch 8",
    routes: routes.length,
    checks: completed.length,
    matrix: `${routes.length} routes × 2 themes × 2 viewports`,
    completed,
  }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}
