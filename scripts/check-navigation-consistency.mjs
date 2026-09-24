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
  const explicit = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (explicit && fs.existsSync(explicit)) {
    return explicit;
  }

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) {
      return bundled;
    }
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
    "C:\\Users\\hsyn\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

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
assert(executablePath, "No Chrome/Chromium/Edge executable was found for Puppeteer.");

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
  await page.waitForFunction(() => new URL(window.location.href).search === "", { timeout: 10000 });
  assert(
    new URL(page.url()).search === "",
    "Estimated area route should clear incoming query parameters while editing."
  );
  results.push("estimated area query cleanup");

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
  const articleBackHref = await getHref(page, '[data-testid="page-context-back-link"]');
  assert(
    articleBackHref === "/",
    "Reclassified application article should fall back to the home page instead of a retired category."
  );
  results.push("retired-section article fallback");

  await goto(page, `${baseUrl}/rehber/proje-hazirlik/elektrik-projesi`);
  const guideBackHref = await getHref(page, '[data-testid="header-context-back-link"]');
  assert(
    guideBackHref === "/rehber/proje-hazirlik",
    "Nested technical guide header back should point to its canonical logical parent."
  );
  const duplicateGuideBackCount = await page.$eval(
    '[data-testid="page-context-back-link"]',
    (elements) => elements.length
  );
  assert(
    duplicateGuideBackCount === 0,
    "Technical guide should not render a second page-level back control when header back exists."
  );
  results.push("canonical guide parent navigation without duplicate back");

  await page.goto(`${baseUrl}/kategori/bina-asamalari/proje-hazirlik/elektrik-projesi`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  assert(
    new URL(page.url()).pathname === "/rehber/proje-hazirlik/elektrik-projesi",
    "Legacy bina guide URL should permanently resolve to the canonical /rehber path."
  );
  results.push("legacy guide redirect");

  for (const retiredPath of [
    "/konu-haritasi",
    "/kaydedilenler",
    "/kategori/bina-asamalari",
    "/kategori/yapi-tasarimi",
    "/kategori/santiye",
  ]) {
    const response = await page.goto(`${baseUrl}${retiredPath}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    assert(
      response?.status() === 404,
      `Retired surface '${retiredPath}' should return 404, got ${response?.status() ?? "unknown"}.`
    );
  }
  results.push("retired surfaces return 404");

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/beton-dokumu-kontrol-listesi`);
  await page.waitForSelector('[data-testid="navbar-live-search"]', { visible: true });
  const desktopNavLabels = await page.$$eval('[data-testid="desktop-nav-item"]', (items) =>
    items.map((item) => item.textContent?.trim() ?? "")
  );
  assert(
    JSON.stringify(desktopNavLabels) ===
      JSON.stringify(["Ana Sayfa", "Mevzuat", "Hesaplamalar", "Araçlar", "Belgeler", "Dokümantasyon"]),
    `Desktop navigation order is wrong: ${JSON.stringify(desktopNavLabels)}`
  );
  const desktopHeaderOverflow = await page.$eval(
    "[data-site-header]",
    (header) => header.scrollWidth > header.clientWidth + 1
  );
  assert(!desktopHeaderOverflow, "Desktop header overflows at 1440px.");
  results.push("desktop nav order + article search access + header fit");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/kategori/araclar`);
  await page.waitForSelector('[data-testid="global-bottom-nav"]', { visible: true });

  const bottomNavState = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="global-bottom-nav"]');
    const spacer = document.querySelector('[data-testid="global-bottom-nav-spacer"]');
    const items = Array.from(nav?.querySelectorAll("[data-bottom-nav-item]") ?? []);
    const labels = items.map((item) => item.querySelector("[data-bottom-nav-label]")?.textContent?.trim() ?? "");
    const activeIds = items
      .filter((item) => item.getAttribute("data-active") === "true")
      .map((item) => item.getAttribute("data-bottom-nav-item"));
    const overflowingLabels = items
      .map((item) => {
        const label = item.querySelector("[data-bottom-nav-label]");
        if (!(label instanceof HTMLElement)) return null;
        return label.scrollWidth > label.clientWidth + 1 ? label.textContent?.trim() ?? "unknown" : null;
      })
      .filter(Boolean);
    return {
      labels,
      activeIds,
      overflowingLabels,
      navHeight: nav?.getBoundingClientRect().height ?? 0,
      spacerHeight: spacer?.getBoundingClientRect().height ?? 0,
    };
  });

  assert(
    JSON.stringify(bottomNavState.labels) ===
      JSON.stringify(["Ana Sayfa", "Ara", "Araçlar", "Belgeler", "Dokümantasyon"]),
    `Mobile bottom navigation order is wrong: ${JSON.stringify(bottomNavState.labels)}`
  );
  assert(
    JSON.stringify(bottomNavState.activeIds) === JSON.stringify(["araclar"]),
    `Mobile bottom navigation active state is wrong: ${JSON.stringify(bottomNavState.activeIds)}`
  );
  assert(
    bottomNavState.overflowingLabels.length === 0,
    `Mobile bottom navigation labels overflow: ${JSON.stringify(bottomNavState.overflowingLabels)}`
  );
  assert(
    bottomNavState.spacerHeight >= bottomNavState.navHeight - 2,
    `Bottom navigation spacer is too short: spacer=${bottomNavState.spacerHeight}, nav=${bottomNavState.navHeight}`
  );
  results.push("mobile bottom nav order + active state + safe spacer");

  await page.click('button[aria-controls="mobile-navigation-drawer"]');
  await page.waitForSelector("#mobile-navigation-drawer", { visible: true });
  const drawerLabels = await page.$$eval('[data-testid="mobile-menu-item"]', (items) =>
    items.map((item) => item.textContent?.trim() ?? "")
  );
  assert(
    JSON.stringify(drawerLabels) ===
      JSON.stringify(["Ana Sayfa", "Mevzuat", "Hesaplamalar", "Araçlar", "Belgeler", "Dokümantasyon", "İletişim"]),
    `Mobile drawer order is wrong: ${JSON.stringify(drawerLabels)}`
  );
  results.push("mobile drawer simplified order");

  await page.setViewport({ width: 320, height: 720, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/`);
  const compactOverflow = await page.$$eval(
    '[data-testid="global-bottom-nav"] [data-bottom-nav-label]',
    (labels) =>
      labels
        .filter((label) => label instanceof HTMLElement && label.scrollWidth > label.clientWidth + 1)
        .map((label) => label.textContent?.trim() ?? "unknown")
  );
  assert(
    compactOverflow.length === 0,
    `320px bottom navigation label overflow: ${JSON.stringify(compactOverflow)}`
  );

  await page.evaluate(() => window.scrollTo(0, Math.min(900, document.documentElement.scrollHeight)));
  await wait(350);
  const floatingOverlap = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="global-bottom-nav"]');
    const backToTop = document.querySelector('button[aria-label="Başa dön"]');
    if (!(nav instanceof HTMLElement) || !(backToTop instanceof HTMLElement)) {
      return { overlaps: false };
    }
    const navRect = nav.getBoundingClientRect();
    const buttonRect = backToTop.getBoundingClientRect();
    return { overlaps: buttonRect.bottom > navRect.top + 1 };
  });
  assert(!floatingOverlap.overlaps, "Back-to-top button overlaps the mobile bottom navigation.");
  results.push("320px labels + floating control clearance");

  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/`);
  const tabletNavigationState = await page.evaluate(() => {
    const bottomNav = document.querySelector('[data-testid="global-bottom-nav"]');
    const menuButton = document.querySelector('button[aria-controls="mobile-navigation-drawer"]');
    return {
      bottomDisplay: bottomNav ? window.getComputedStyle(bottomNav).display : "missing",
      menuDisplay: menuButton ? window.getComputedStyle(menuButton).display : "missing",
    };
  });
  assert(
    tabletNavigationState.bottomDisplay === "none",
    `Tablet should not show phone bottom nav: ${JSON.stringify(tabletNavigationState)}`
  );
  assert(
    tabletNavigationState.menuDisplay !== "none" && tabletNavigationState.menuDisplay !== "missing",
    `Tablet should keep hamburger navigation: ${JSON.stringify(tabletNavigationState)}`
  );
  results.push("tablet uses drawer without phone bottom bar");

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await goto(page, `${baseUrl}/rehber/proje-hazirlik/elektrik-projesi`);
  const mobileBreadcrumbState = await page.$eval('nav[aria-label="Sayfa konumu"]', (nav) => {
    const visibleItems = Array.from(nav.children).filter((item) => {
      const style = window.getComputedStyle(item);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    return {
      visibleCount: visibleItems.length,
      text: visibleItems.map((item) => item.textContent?.trim() ?? ""),
    };
  });
  assert(
    mobileBreadcrumbState.visibleCount <= 3,
    `Mobile breadcrumb should stay compact: ${JSON.stringify(mobileBreadcrumbState)}`
  );
  assert(
    mobileBreadcrumbState.text.some((text) => text.includes("Elektrik Projesi")),
    `Mobile breadcrumb should retain current page: ${JSON.stringify(mobileBreadcrumbState)}`
  );
  results.push("mobile breadcrumb compaction");

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
} catch (error) {
  console.error(error);
  process.exitCode = 1;
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
