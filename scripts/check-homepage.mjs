import fs from "fs";
import http from "http";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";

function assert(condition, message) {
  if (!condition) {
    process.exitCode = 1;
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

async function openHome(page, baseUrl, theme) {
  await page.evaluateOnNewDocument((selectedTheme) => {
    window.localStorage.setItem("theme", selectedTheme);
  }, theme);

  const response = await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  assert(
    response && [200, 304].includes(response.status()),
    `Ana sayfa ${response?.status() ?? "bilinmeyen"} durum kodu döndürdü.`,
  );
  await page.waitForSelector('[data-testid="home-hero"]', { visible: true });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

const requestedPort = Number(process.argv[2] ?? "0");
const screenshotDirectory = process.env.HOMEPAGE_SCREENSHOT_DIR;
if (screenshotDirectory) {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
}

const executablePath = getBrowserExecutablePath();
assert(executablePath, "Puppeteer için yerel Chrome veya Edge bulunamadı.");

const externalBaseUrl = process.env.HOMEPAGE_BASE_URL;
let server;
let baseUrl = externalBaseUrl;

if (!baseUrl) {
  const app = next({
    dev: false,
    dir: process.cwd(),
    hostname: "127.0.0.1",
    port: requestedPort || 3000,
  });

  await app.prepare();
  const handle = app.getRequestHandler();
  server = http.createServer((request, response) => handle(request, response));
  await new Promise((resolve) => server.listen(requestedPort, "127.0.0.1", resolve));
  const resolvedPort = server.address()?.port;
  baseUrl = `http://127.0.0.1:${resolvedPort}`;
}
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const checks = [];

const scenarios = [
  { id: "phone-320-dark", name: "320 px telefon/koyu", width: 320, height: 720, theme: "dark", isMobile: true },
  { id: "phone-390-dark", name: "390 px telefon/koyu", width: 390, height: 844, theme: "dark", isMobile: true },
  { id: "phone-390-light", name: "390 px telefon/açık", width: 390, height: 844, theme: "light", isMobile: true },
  { id: "tablet-768-dark", name: "768 px tablet/koyu", width: 768, height: 1024, theme: "dark", isMobile: true },
  { id: "desktop-1440-dark", name: "1440 px masaüstü/koyu", width: 1440, height: 900, theme: "dark" },
  { id: "desktop-1440-light", name: "1440 px masaüstü/açık", width: 1440, height: 900, theme: "light" },
  { id: "desktop-1920-dark", name: "1920 px geniş ekran/koyu", width: 1920, height: 1080, theme: "dark" },
];

try {
  for (const scenario of scenarios) {
    const page = await browser.newPage();
    await page.setViewport({
      width: scenario.width,
      height: scenario.height,
      deviceScaleFactor: 1,
      isMobile: scenario.isMobile ?? false,
      hasTouch: scenario.isMobile ?? false,
    });
    await openHome(page, baseUrl, scenario.theme);

    const result = await page.evaluate(() => ({
      h1Count: document.querySelectorAll("h1").length,
      featuredCalculationCount: document.querySelectorAll('[data-testid="home-featured-calculation"]').length,
      resourceCount: document.querySelectorAll('[data-testid="home-resource-link"]').length,
      leadArticleCount: document.querySelectorAll('[data-testid="home-lead-article"]').length,
      supportingArticleCount: document.querySelectorAll('[data-testid="home-supporting-article"]').length,
      workflowCount: document.querySelectorAll('[data-testid="home-workflow-step"]').length,
      phaseCount: document.querySelectorAll('[data-testid="home-phase-link"]').length,
      closingLinkCount: document.querySelectorAll('[data-testid="home-closing"] a').length,
      floatingLogoCount: document.querySelectorAll('[data-testid="home-scroll-logo"]').length,
      floatingLogoDisplay: window.getComputedStyle(document.querySelector('[data-testid="home-scroll-logo"]')).display,
      floatingLogoOpacity: Number.parseFloat(
        window.getComputedStyle(document.querySelector('[data-testid="home-scroll-logo"]')).opacity,
      ),
      navbarLogoOpacity: Number.parseFloat(
        window.getComputedStyle(
          document.querySelector("[data-home-navbar-logo]")?.firstElementChild ??
            document.querySelector("[data-home-navbar-logo]"),
        ).opacity,
      ),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollHeight: document.documentElement.scrollHeight,
      overflowElements: Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}.${Array.from(element.classList).join(".")}`,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          };
        })
        .filter(({ left, right }) => left < -1 || right > window.innerWidth + 1)
        .slice(0, 8),
    }));

    assert(result.h1Count === 1, `${scenario.name}: tek bir h1 bulunmalı.`);
    assert(result.featuredCalculationCount === 1, `${scenario.name}: bir öne çıkan hesap bulunmalı.`);
    assert(result.resourceCount === 5, `${scenario.name}: beş hızlı kaynak bağlantısı bulunmalı.`);
    assert(result.leadArticleCount === 1, `${scenario.name}: bir ana teknik içerik bulunmalı.`);
    assert(result.supportingArticleCount === 2, `${scenario.name}: iki destekleyici içerik bulunmalı.`);
    assert(result.workflowCount === 4, `${scenario.name}: dört fizibilite adımı bulunmalı.`);
    assert(result.phaseCount === 6, `${scenario.name}: altı bina fazı bulunmalı.`);
    assert(result.closingLinkCount === 2, `${scenario.name}: iki kapanış yolu bulunmalı.`);
    assert(result.floatingLogoCount === 1, `${scenario.name}: kayan logo bileşeni bulunamadı.`);
    assert(result.navbarLogoOpacity > 0.9, `${scenario.name}: navbar logosu görünür değil.`);
    if (scenario.width < 1720) {
      assert(result.floatingLogoDisplay === "none", `${scenario.name}: kayan logo dar ekranda alan kaplıyor.`);
    } else {
      assert(result.floatingLogoOpacity < 0.1, `${scenario.name}: sayfa tepesinde kayan logo gizli olmalı.`);
    }
    assert(
      !result.horizontalOverflow,
      `${scenario.name}: yatay taşma oluştu (${JSON.stringify(result.overflowElements)}).`,
    );
    if (scenario.width <= 390) {
      assert(result.scrollHeight < 9000, `${scenario.name}: mobil sayfa hâlâ fazla uzun (${result.scrollHeight}px).`);
    }

    if (screenshotDirectory) {
      await page.screenshot({
        path: path.join(screenshotDirectory, `${scenario.id}.png`),
        fullPage: true,
      });
    }
    checks.push(`${scenario.name} düzeni (${result.scrollHeight}px)`);
    await page.close();
  }

  const interactionPage = await browser.newPage();
  await interactionPage.setViewport({ width: 1440, height: 900 });
  await openHome(interactionPage, baseUrl, "dark");

  await interactionPage.click('[data-testid="home-hero"] button[aria-controls="command-palette-dialog"]');
  await interactionPage.waitForSelector("#command-palette-dialog", { visible: true, timeout: 10000 });
  await interactionPage.keyboard.press("Escape");

  await interactionPage.$eval('[data-testid="home-hero-visual"]', (element) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: bounds.left + bounds.width * 0.76,
        clientY: bounds.top + bounds.height * 0.52,
        pointerType: "mouse",
      }),
    );
  });
  const scanPosition = await interactionPage.$eval(
    '[data-testid="home-hero-visual"]',
    (element) => element.style.getPropertyValue("--hero-scan-x"),
  );
  assert(scanPosition && scanPosition !== "42%", "Hero tarama çizgisi imleci takip etmedi.");

  const workflowHrefs = await interactionPage.$$eval('[data-testid="home-workflow-step"]', (links) =>
    links.map((link) => link.getAttribute("href")),
  );
  assert(
    JSON.stringify(workflowHrefs) ===
      JSON.stringify([
        "/kategori/araclar/imar-hesaplayici",
        "/hesaplamalar/tahmini-insaat-alani",
        "/hesaplamalar/insaat-maliyeti",
        "/kategori/bina-asamalari/proje-hazirlik",
      ]),
    "Ön fizibilite karar yolu beklenen rotalara bağlanmıyor.",
  );

  await interactionPage.keyboard.press("Home");
  await interactionPage.keyboard.press("Tab");
  const focusedElement = await interactionPage.evaluate(() => ({
    tag: document.activeElement?.tagName,
    label: document.activeElement?.getAttribute("aria-label"),
    href: document.activeElement?.getAttribute("href"),
  }));
  assert(
    focusedElement.tag === "A" || focusedElement.tag === "BUTTON",
    `Klavye odağı etkileşimli bir öğeye geçmedi (${JSON.stringify(focusedElement)}).`,
  );
  checks.push("arama, karar yolu ve klavye odağı");
  await interactionPage.close();

  const scrollLogoPage = await browser.newPage();
  await scrollLogoPage.setViewport({ width: 1920, height: 1080 });
  await openHome(scrollLogoPage, baseUrl, "light");
  await scrollLogoPage.evaluate(() => window.scrollTo(0, 180));
  await scrollLogoPage.waitForFunction(
    () => document.documentElement.dataset.homeLogoFloating === "true",
    { timeout: 10000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 460));

  const floatingLogoState = await scrollLogoPage.evaluate(() => {
    const navbarLogo = document.querySelector("[data-home-navbar-logo]");
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    const navbarBounds = navbarLogo?.getBoundingClientRect();
    const floatingBounds = floatingLogo?.getBoundingClientRect();
    return {
      navbarOpacity: Number.parseFloat(
        window.getComputedStyle(navbarLogo?.firstElementChild ?? navbarLogo).opacity,
      ),
      navbarInert: navbarLogo?.inert ?? false,
      floatingOpacity: Number.parseFloat(window.getComputedStyle(floatingLogo).opacity),
      floatingPosition: window.getComputedStyle(floatingLogo).position,
      navbarWidth: navbarBounds?.width ?? 0,
      floatingWidth: floatingBounds?.width ?? 0,
    };
  });
  assert(floatingLogoState.navbarOpacity < 0.1, "Kaydırmada navbar logosu gizlenmedi.");
  assert(floatingLogoState.navbarInert, "Gizlenen navbar logosu klavye odağından çıkarılmadı.");
  assert(floatingLogoState.floatingOpacity > 0.9, "Kaydırmada sol ray logosu görünmedi.");
  assert(floatingLogoState.floatingPosition === "fixed", "Kayan logo viewport'a sabitlenmedi.");
  assert(floatingLogoState.floatingWidth > floatingLogoState.navbarWidth, "Kayan logo navbar logosundan büyük değil.");

  await scrollLogoPage.evaluate(() => window.scrollTo(0, 0));
  await scrollLogoPage.waitForFunction(
    () => !document.documentElement.dataset.homeLogoFloating,
    { timeout: 10000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 560));
  const restoredNavbarOpacity = await scrollLogoPage.evaluate(() => {
    const navbarLogo = document.querySelector("[data-home-navbar-logo]");
    return Number.parseFloat(window.getComputedStyle(navbarLogo?.firstElementChild ?? navbarLogo).opacity);
  });
  assert(restoredNavbarOpacity > 0.9, "Sayfa tepesine dönüldüğünde navbar logosu geri gelmedi.");
  checks.push("kayan logo geçişi ve geri dönüşü");
  await scrollLogoPage.close();

  const reducedMotionPage = await browser.newPage();
  await reducedMotionPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await reducedMotionPage.setViewport({ width: 1440, height: 900 });
  await openHome(reducedMotionPage, baseUrl, "dark");
  const reducedMotionState = await reducedMotionPage.evaluate(() => ({
    scanDisplay: window.getComputedStyle(document.querySelector(".home-hero-scan-line")).display,
    floatingLogoDisplay: window.getComputedStyle(document.querySelector('[data-testid="home-scroll-logo"]')).display,
  }));
  assert(reducedMotionState.scanDisplay === "none", "Azaltılmış harekette hero tarama çizgisi kapanmadı.");
  assert(reducedMotionState.floatingLogoDisplay === "none", "Kayan logo dar ekranda alan kaplıyor.");
  checks.push("azaltılmış hareket tercihi");
  await reducedMotionPage.close();

  console.log(JSON.stringify({ status: "ok", baseUrl, checks }, null, 2));
} finally {
  await browser.close();
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
