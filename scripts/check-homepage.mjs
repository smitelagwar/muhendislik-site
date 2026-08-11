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
    `Anasayfa ${response?.status() ?? "bilinmeyen"} durum kodu döndürdü.`,
  );
  await page.waitForSelector('[data-testid="home-hero"]', { visible: true });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

const requestedPort = Number(process.argv[2] ?? "0");
const screenshotDirectory = process.env.HOMEPAGE_SCREENSHOT_DIR;
if (screenshotDirectory) {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
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
const checks = [];

try {
  for (const viewport of [
    { id: "desktop", name: "masaüstü", width: 1440, height: 900 },
    { id: "mobile", name: "mobil", width: 390, height: 844, isMobile: true },
  ]) {
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage();
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        isMobile: viewport.isMobile ?? false,
        hasTouch: viewport.isMobile ?? false,
      });
      await openHome(page, baseUrl, theme);

      const result = await page.evaluate(() => ({
        h1Count: document.querySelectorAll("h1").length,
        resourceCount: document.querySelectorAll('[data-testid="home-resource-grid"] article').length,
        phaseCount: document.querySelectorAll('[data-testid="home-phase-path"] article').length,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
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

      assert(result.h1Count === 1, `${viewport.name}/${theme}: tek bir h1 bulunmalı.`);
      assert(result.resourceCount === 6, `${viewport.name}/${theme}: altı araç kartı bulunmalı.`);
      assert(result.phaseCount === 6, `${viewport.name}/${theme}: altı bina fazı bulunmalı.`);
      assert(
        !result.horizontalOverflow,
        `${viewport.name}/${theme}: yatay taşma oluştu (${JSON.stringify(result.overflowElements)}).`,
      );
      if (screenshotDirectory) {
        await page.screenshot({
          path: path.join(screenshotDirectory, `${viewport.id}-${theme}.png`),
          fullPage: true,
        });
      }
      checks.push(`${viewport.name}/${theme} düzeni`);
      await page.close();
    }
  }

  const searchPage = await browser.newPage();
  await searchPage.setViewport({ width: 1440, height: 900 });
  await openHome(searchPage, baseUrl, "dark");
  await searchPage.click('[data-testid="home-hero"] button[aria-controls="command-palette-dialog"]');
  await searchPage.waitForSelector("#command-palette-dialog", { visible: true, timeout: 10000 });
  checks.push("hero arama paleti");
  await searchPage.close();

  const interactionPage = await browser.newPage();
  await interactionPage.setViewport({ width: 1440, height: 900 });
  await openHome(interactionPage, baseUrl, "dark");

  const hero = await interactionPage.$('[data-testid="home-hero"]');
  const heroBounds = await hero?.boundingBox();
  assert(heroBounds, "Hero etkileşim alanı bulunamadı.");
  await interactionPage.$eval('[data-testid="home-hero"]', (element) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: bounds.left + bounds.width * 0.72,
        clientY: bounds.top + 180,
        pointerType: "mouse",
      }),
    );
  });
  const heroPointer = await interactionPage.$eval('[data-testid="home-hero"]', (element) => ({
    x: element.style.getPropertyValue("--hero-pointer-x"),
    y: element.style.getPropertyValue("--hero-pointer-y"),
  }));
  assert(heroPointer.x && heroPointer.y, "Hero teknik ışık katmanı imleci takip etmedi.");

  await interactionPage.$eval('[data-testid="home-resource-card"]', (element) =>
    element.scrollIntoView({ block: "center" }),
  );
  const firstCard = await interactionPage.$('[data-testid="home-resource-card"]');
  const cardBounds = await firstCard?.boundingBox();
  assert(cardBounds, "Etkileşimli araç kartı bulunamadı.");
  await interactionPage.$eval('[data-testid="home-resource-card"]', (element) => {
    const bounds = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: bounds.left + bounds.width * 0.78,
        clientY: bounds.top + bounds.height * 0.25,
        pointerType: "mouse",
      }),
    );
  });
  const cardEffect = await interactionPage.$eval('[data-testid="home-resource-card"]', (element) => ({
    rotateX: element.style.getPropertyValue("--rotate-x"),
    rotateY: element.style.getPropertyValue("--rotate-y"),
    transform: window.getComputedStyle(element).transform,
  }));
  assert(cardEffect.rotateX !== "0deg" && cardEffect.rotateY !== "0deg", "Araç kartı eğim değerleri güncellenmedi.");
  assert(cardEffect.transform !== "none", "Araç kartı derinlik efekti uygulanmadı.");
  checks.push("teknik hero ışığı ve kart derinliği");
  await interactionPage.close();

  const scrollLogoPage = await browser.newPage();
  await scrollLogoPage.setViewport({ width: 1920, height: 1080 });
  await openHome(scrollLogoPage, baseUrl, "light");

  const initialLogoState = await scrollLogoPage.evaluate(() => {
    const navbarLogo = document.querySelector("[data-home-navbar-logo]");
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    return {
      navbarOpacity: Number.parseFloat(window.getComputedStyle(navbarLogo?.firstElementChild ?? navbarLogo).opacity),
      floatingOpacity: Number.parseFloat(window.getComputedStyle(floatingLogo).opacity),
    };
  });
  assert(initialLogoState.navbarOpacity > 0.9, "Sayfa tepesinde navbar logosu görünür olmalı.");
  assert(initialLogoState.floatingOpacity < 0.1, "Sayfa tepesinde sol ray logosu gizli olmalı.");

  await scrollLogoPage.evaluate(() => window.scrollTo(0, 180));
  await scrollLogoPage.waitForFunction(
    () => document.documentElement.dataset.homeLogoFloating === "true",
    { timeout: 10000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 460));

  const floatingLogoState = await scrollLogoPage.evaluate(() => {
    const navbarLogo = document.querySelector("[data-home-navbar-logo]");
    const navbarVisual = navbarLogo?.firstElementChild;
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    const navbarBounds = navbarLogo?.getBoundingClientRect();
    const floatingBounds = floatingLogo?.getBoundingClientRect();
    return {
      navbarOpacity: Number.parseFloat(window.getComputedStyle(navbarVisual ?? navbarLogo).opacity),
      navbarInert: navbarLogo?.inert ?? false,
      floatingOpacity: Number.parseFloat(window.getComputedStyle(floatingLogo).opacity),
      floatingPosition: window.getComputedStyle(floatingLogo).position,
      floatingZIndex: Number.parseInt(window.getComputedStyle(floatingLogo).zIndex, 10),
      navbarZIndex: Number.parseInt(
        window.getComputedStyle(document.querySelector("header")).zIndex,
        10,
      ),
      navbarWidth: navbarBounds?.width ?? 0,
      floatingWidth: floatingBounds?.width ?? 0,
      floatingLeft: floatingBounds?.left ?? 0,
    };
  });
  assert(floatingLogoState.navbarOpacity < 0.1, "Scroll sonrasında navbar logosu gizlenmedi.");
  assert(floatingLogoState.navbarInert, "Gizlenen navbar logosu klavye odağından çıkarılmadı.");
  assert(floatingLogoState.floatingOpacity > 0.9, "Scroll sonrasında sol ray logosu görünmedi.");
  assert(floatingLogoState.floatingPosition === "fixed", "Sol ray logosu viewport'a sabitlenmedi.");
  assert(
    floatingLogoState.floatingZIndex > floatingLogoState.navbarZIndex,
    "Kayan logo navbar katmanının üstünde değil.",
  );
  assert(floatingLogoState.floatingWidth > floatingLogoState.navbarWidth, "Sol ray logosu navbar logosundan büyük değil.");
  assert(floatingLogoState.floatingLeft >= 20, "Sol ray logosu güvenli ekran boşluğuna yerleşmedi.");
  if (screenshotDirectory) {
    await scrollLogoPage.screenshot({
      path: path.join(screenshotDirectory, "desktop-light-scroll-logo.png"),
      fullPage: false,
    });
  }

  await scrollLogoPage.evaluate(() => window.scrollTo(0, 80));
  await new Promise((resolve) => setTimeout(resolve, 180));
  const hysteresisState = await scrollLogoPage.evaluate(
    () => document.documentElement.dataset.homeLogoFloating,
  );
  assert(hysteresisState === "true", "Logo eşik çevresindeki küçük scroll hareketinde titredi.");

  await scrollLogoPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await new Promise((resolve) => setTimeout(resolve, 460));
  const bottomLogoState = await scrollLogoPage.evaluate(() => {
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    if (!(floatingLogo instanceof HTMLElement)) {
      return { opacity: 0, fixedTop: -1, visibleAboveContent: false };
    }

    const bounds = floatingLogo.getBoundingClientRect();
    const previousPointerEvents = floatingLogo.style.pointerEvents;
    floatingLogo.style.pointerEvents = "auto";
    const topElement = document.elementFromPoint(
      bounds.left + Math.min(bounds.width / 2, 80),
      bounds.top + Math.min(bounds.height / 2, 36),
    );
    floatingLogo.style.pointerEvents = previousPointerEvents;

    return {
      opacity: Number.parseFloat(window.getComputedStyle(floatingLogo).opacity),
      fixedTop: Math.round(bounds.top),
      inverse: floatingLogo.dataset.inverse,
      visibleAboveContent: topElement === floatingLogo || floatingLogo.contains(topElement),
    };
  });
  assert(bottomLogoState.opacity > 0.9, "Sayfanın sonunda sol ray logosu görünürlüğünü kaybetti.");
  assert(bottomLogoState.fixedTop > 100, "Sayfanın sonunda sol ray logosunun sabit konumu bozuldu.");
  assert(bottomLogoState.visibleAboveContent, "Sayfanın sonunda içerik katmanları sol ray logosunun önüne geçti.");
  assert(bottomLogoState.inverse === "true", "Koyu alt bölümde yüksek kontrastlı logo varyantına geçilmedi.");
  if (screenshotDirectory) {
    await scrollLogoPage.screenshot({
      path: path.join(screenshotDirectory, "desktop-light-scroll-logo-bottom.png"),
      fullPage: false,
    });
  }

  await scrollLogoPage.evaluate(() => window.scrollTo(0, 0));
  await scrollLogoPage.waitForFunction(
    () => document.documentElement.dataset.homeLogoFloating !== "true",
    { timeout: 10000 },
  );
  await new Promise((resolve) => setTimeout(resolve, 220));
  const restoredLogoState = await scrollLogoPage.evaluate(() => ({
    navbarOpacity: Number.parseFloat(
      window.getComputedStyle(document.querySelector("[data-home-navbar-logo]")?.firstElementChild).opacity,
    ),
    floatingOpacity: Number.parseFloat(
      window.getComputedStyle(document.querySelector('[data-testid="home-scroll-logo"]')).opacity,
    ),
  }));
  assert(restoredLogoState.navbarOpacity > 0.9, "Tepeye dönüşte navbar logosu geri gelmedi.");
  assert(restoredLogoState.floatingOpacity < 0.1, "Tepeye dönüşte sol ray logosu gizlenmedi.");
  checks.push("scroll ile logo taşıma ve geri dönüş");
  await scrollLogoPage.close();

  const compactDesktopPage = await browser.newPage();
  await compactDesktopPage.setViewport({ width: 1440, height: 900 });
  await openHome(compactDesktopPage, baseUrl, "light");
  await compactDesktopPage.evaluate(() => window.scrollTo(0, 240));
  await new Promise((resolve) => setTimeout(resolve, 350));
  const compactLogoState = await compactDesktopPage.evaluate(() => {
    const navbarLogo = document.querySelector("[data-home-navbar-logo]");
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    return {
      floatingState: document.documentElement.dataset.homeLogoFloating,
      floatingDisplay: window.getComputedStyle(floatingLogo).display,
      navbarOpacity: Number.parseFloat(
        window.getComputedStyle(navbarLogo?.firstElementChild ?? navbarLogo).opacity,
      ),
    };
  });
  assert(!compactLogoState.floatingState, "Dar masaüstünde kayan logo yanlışlıkla etkinleşti.");
  assert(compactLogoState.floatingDisplay === "none", "Dar masaüstünde kayan logo alan kaplıyor.");
  assert(compactLogoState.navbarOpacity > 0.9, "Dar masaüstünde navbar logosu kayboldu.");
  checks.push("dar masaüstü güvenli davranışı");
  await compactDesktopPage.close();

  const routeCleanupPage = await browser.newPage();
  await routeCleanupPage.setViewport({ width: 1920, height: 1080 });
  await openHome(routeCleanupPage, baseUrl, "dark");
  await routeCleanupPage.evaluate(() => window.scrollTo(0, 180));
  await routeCleanupPage.waitForFunction(
    () => document.documentElement.dataset.homeLogoFloating === "true",
    { timeout: 10000 },
  );
  await routeCleanupPage.click('header a[href="/hesaplamalar"]');
  await routeCleanupPage.waitForFunction(
    () => window.location.pathname === "/hesaplamalar",
    { timeout: 10000 },
  );
  const routeCleanupState = await routeCleanupPage.evaluate(() => ({
    floatingState: document.documentElement.dataset.homeLogoFloating,
    floatingLogoExists: Boolean(document.querySelector('[data-testid="home-scroll-logo"]')),
  }));
  assert(!routeCleanupState.floatingState, "Anasayfadan ayrılırken kayan logo durumu temizlenmedi.");
  assert(!routeCleanupState.floatingLogoExists, "Kayan logo diğer sayfaya taşındı.");
  checks.push("rota değişiminde logo temizliği");
  await routeCleanupPage.close();

  const reducedMotionPage = await browser.newPage();
  await reducedMotionPage.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await reducedMotionPage.setViewport({ width: 1920, height: 1080 });
  await openHome(reducedMotionPage, baseUrl, "dark");
  const reducedMotionEffects = await reducedMotionPage.evaluate(() => ({
    heroLayer: window.getComputedStyle(document.querySelector(".home-hero-pointer-layer")).display,
    cardLayer: window.getComputedStyle(document.querySelector('[data-testid="home-resource-card"]'), "::before").display,
  }));
  assert(
    reducedMotionEffects.heroLayer === "none" && reducedMotionEffects.cardLayer === "none",
    "Azaltılmış hareket tercihinde dekoratif efektler kapanmadı.",
  );
  await reducedMotionPage.evaluate(() => window.scrollTo(0, 180));
  await reducedMotionPage.waitForFunction(
    () => document.documentElement.dataset.homeLogoFloating === "true",
    { timeout: 10000 },
  );
  const reducedMotionLogo = await reducedMotionPage.evaluate(() => {
    const floatingLogo = document.querySelector('[data-testid="home-scroll-logo"]');
    return {
      opacity: Number.parseFloat(window.getComputedStyle(floatingLogo).opacity),
      activeAnimations: floatingLogo?.getAnimations().length ?? -1,
    };
  });
  assert(
    reducedMotionLogo.opacity > 0.9 && reducedMotionLogo.activeAnimations === 0,
    "Azaltılmış hareket tercihinde logo konumu animasyonsuz değişmedi.",
  );
  checks.push("azaltılmış hareket tercihi");
  await reducedMotionPage.close();

  console.log(JSON.stringify({ status: "ok", baseUrl, checks }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
