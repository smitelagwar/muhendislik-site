import fs from "fs";
import http from "http";
import next from "next";
import puppeteer from "puppeteer";

const requestedPort = Number(process.argv[2] ?? "0");
const screenshotDirectory = process.env.VISUAL_SYSTEM_SCREENSHOT_DIR;

const routes = [
  "/",
  "/hesaplamalar",
  "/kategori/araclar",
  "/kategori/yapi-tasarimi",
  "/kategori/deprem-yonetmelik",
  "/kategori/bina-asamalari",
  "/beton-dokumu-kontrol-listesi",
  "/konu-haritasi",
  "/hakkimizda",
  "/iletisim",
  "/kaydedilenler",
];

const mobileRoutes = new Set([
  "/",
  "/hesaplamalar",
  "/kategori/araclar",
  "/kategori/deprem-yonetmelik",
  "/beton-dokumu-kontrol-listesi",
  "/kategori/bina-asamalari",
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

function safeFileName(route) {
  return route === "/" ? "anasayfa" : route.slice(1).replaceAll("/", "-");
}

async function inspectRoute(browser, baseUrl, route, theme, viewport) {
  const page = await browser.newPage();

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

    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    assert(response && response.status() < 400, `${route} ${response?.status() ?? "yanıt yok"} durum kodu döndürdü.`);
    await page.waitForSelector("body", { visible: true });
    await page.waitForSelector('[data-testid="theme-toggle"]', { visible: true, timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);

    const result = await page.evaluate(() => {
      const toggle = document.querySelector('[data-testid="theme-toggle"]');
      const toggleRect = toggle?.getBoundingClientRect();
      const visibleHeading = Array.from(document.querySelectorAll("h1, h2")).some((heading) => {
        const rect = heading.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      return {
        htmlTheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        toggleWidth: toggleRect?.width ?? 0,
        toggleHeight: toggleRect?.height ?? 0,
        visibleHeading,
      };
    });

    assert(result.htmlTheme === theme, `${route}: ${theme} teması etkinleşmedi.`);
    assert(!result.horizontalOverflow, `${route}: ${viewport.id}/${theme} görünümünde yatay taşma oluştu.`);
    assert(result.visibleHeading, `${route}: görünür sayfa başlığı bulunamadı.`);
    assert(result.toggleWidth >= 78 && result.toggleHeight >= 38, `${route}: ay–güneş tema switch'i korunmadı.`);

    if (screenshotDirectory) {
      fs.mkdirSync(screenshotDirectory, { recursive: true });
      await page.screenshot({
        path: `${screenshotDirectory}/${safeFileName(route)}-${viewport.id}-${theme}.png`,
        fullPage: true,
      });
    }
  } finally {
    await page.close();
  }
}

const executablePath = getBrowserExecutablePath();
assert(executablePath, "Puppeteer için yerel Chrome veya Edge bulunamadı.");

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
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const completed = [];

try {
  for (const route of routes) {
    for (const theme of ["dark", "light"]) {
      await inspectRoute(browser, baseUrl, route, theme, {
        id: "desktop",
        width: 1440,
        height: 900,
        mobile: false,
      });
      completed.push(`${route} masaüstü/${theme}`);

      if (mobileRoutes.has(route)) {
        await inspectRoute(browser, baseUrl, route, theme, {
          id: "mobile",
          width: 390,
          height: 844,
          mobile: true,
        });
        completed.push(`${route} mobil/${theme}`);
      }
    }
  }

  console.log(JSON.stringify({ status: "ok", baseUrl, checks: completed }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
