import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

let baseUrl = "";
let serverProcess = null;

try {
  const ping = await fetch("http://127.0.0.1:3000/kategori/araclar/donati-hesabi");
  if (ping.ok) {
    baseUrl = "http://127.0.0.1:3000/kategori/araclar/donati-hesabi";
  }
} catch {
  // port 3000 not running
}

if (!baseUrl) {
  const portProbe = http.createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const address = portProbe.address();
  const port = address.port;
  await new Promise((resolve, reject) => portProbe.close((error) => (error ? reject(error) : resolve())));

  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  serverProcess = spawn(
    process.execPath,
    [nextCli, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: process.cwd(), stdio: "ignore", windowsHide: true },
  );
  baseUrl = `http://127.0.0.1:${port}/kategori/araclar/donati-hesabi`;

  const readyDeadline = Date.now() + 120000;
  let serverReady = false;
  while (!serverReady && Date.now() < readyDeadline) {
    try {
      const response = await fetch(baseUrl);
      serverReady = response.ok;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  assert(serverReady, "Donatı sayfası için yerel Next sunucusu başlatılamadı.");
}
const executablePath = getBrowserExecutablePath();
assert(executablePath, "Headless doğrulama için Chrome veya Edge bulunamadı.");
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

const scenarios = [
  { width: 320, height: 720, theme: "dark" },
  { width: 360, height: 800, theme: "dark" },
  { width: 375, height: 812, theme: "dark" },
  { width: 390, height: 844, theme: "dark" },
  { width: 412, height: 915, theme: "dark" },
  { width: 430, height: 932, theme: "dark" },
  { width: 768, height: 1024, theme: "dark" },
  { width: 1024, height: 768, theme: "dark" },
  { width: 1280, height: 800, theme: "dark" },
  { width: 1440, height: 900, theme: "dark" },
  { width: 390, height: 844, theme: "light" },
  { width: 1440, height: 900, theme: "light" },
];
const screenshotDirectory = process.env.DONATI_SCREENSHOT_DIR;
if (screenshotDirectory) fs.mkdirSync(screenshotDirectory, { recursive: true });

try {
  for (const scenario of scenarios) {
    const page = await browser.newPage();
    await page.setViewport({
      width: scenario.width,
      height: scenario.height,
      deviceScaleFactor: 1,
      isMobile: scenario.width < 768,
      hasTouch: scenario.width < 768,
    });
    await page.evaluateOnNewDocument((theme) => localStorage.setItem("theme", theme), scenario.theme);
    const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    assert(response?.ok(), `${scenario.width}px/${scenario.theme}: rota yüklenemedi.`);
    await page.waitForSelector('[data-testid="rebar-result"]');

    const metrics = await page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll("main button, main summary, main input, main [role='combobox']"));
      const undersized = interactive
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && rect.width > 0 && rect.height > 0 && rect.height < 43;
        })
        .map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 40), height: element.getBoundingClientRect().height }))
        .slice(0, 8);
      return {
        h1: document.querySelector("h1")?.textContent?.trim(),
        result: document.querySelector('[data-testid="rebar-result"]')?.textContent,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        footerVisibleInDocument: Boolean(document.querySelector("footer")),
        bodyOverflowY: window.getComputedStyle(document.body).overflowY,
        contentOverflow: Array.from(
          document.querySelectorAll(
            "main section, main details, main input, main svg, [data-testid='mobile-equivalent-list'], [data-testid='desktop-equivalent-table']",
          ),
        )
          .filter((element) => {
            const style = window.getComputedStyle(element);
            if (style.display === "none") return false;
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
          })
          .map((element) => ({
            element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
            left: Math.round(element.getBoundingClientRect().left),
            right: Math.round(element.getBoundingClientRect().right),
          })),
        mainBottom: document.querySelector("main")?.getBoundingClientRect().bottom ?? 0,
        footerTop: document.querySelector("footer")?.getBoundingClientRect().top ?? 0,
        undersized,
      };
    });

    assert(metrics.h1 === "Donatı Alanı Hesabı", `${scenario.width}px: başlık yanlış.`);
    assert(metrics.result?.includes("7,70") && metrics.result.includes("769,69"), `${scenario.width}px: başlangıç sonucu yanlış.`);
    assert(!metrics.horizontalOverflow, `${scenario.width}px: yatay taşma oluştu.`);
    assert(metrics.bodyOverflowY !== "hidden", `${scenario.width}px: gövde kaydırması kilitli.`);
    assert(metrics.contentOverflow.length === 0, `${scenario.width}px: içerik viewport dışına taşıyor ${JSON.stringify(metrics.contentOverflow)}`);
    if (metrics.footerVisibleInDocument) {
      assert(metrics.footerTop >= metrics.mainBottom - 1, `${scenario.width}px: footer ana içerikle çakışıyor.`);
    }
    assert(metrics.undersized.length === 0, `${scenario.width}px: küçük dokunma hedefi ${JSON.stringify(metrics.undersized)}`);

    const footerReachable = await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const footer = document.querySelector("footer");
      if (!footer) return true;
      const rect = footer.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    assert(footerReachable, `${scenario.width}px: footer kaydırılarak görünür hâle getirilemiyor.`);

    if (screenshotDirectory && scenario.theme === "dark" && [390, 1440].includes(scenario.width)) {
      await page.screenshot({
        path: path.join(screenshotDirectory, `donati-${scenario.width}-${scenario.theme}.png`),
        fullPage: true,
      });
    }
    await page.close();
  }

  const interactionPage = await browser.newPage();
  await interactionPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await interactionPage.evaluateOnNewDocument(() => localStorage.setItem("theme", "dark"));
  await interactionPage.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

  assert(
    (await interactionPage.$$eval('[data-testid="mobile-equivalent-list"] > button[aria-pressed]', (buttons) => buttons.length)) === 7,
    "Mobilde Ø8–Ø20 aralığındaki yedi eşdeğer doğrudan gösterilmeli.",
  );

  const alternativeButtons = await interactionPage.$$('[data-testid="mobile-equivalent-list"] > button[aria-pressed]');
  await alternativeButtons[1].click();
  assert(
    (await interactionPage.$$eval('[data-testid="mobile-equivalent-list"] > button[aria-pressed="true"]', (buttons) => buttons.length)) === 1,
    "Eşdeğer seçimi etkin satırı güncellemedi.",
  );

  await interactionPage.evaluate(() => {
    const summary = document.querySelector('[data-testid="rebar-formula-details"] summary');
    if (summary) summary.click();
  });
  assert(await interactionPage.$eval('[data-testid="rebar-formula-details"]', (details) => details.open), "Formül detayı açılmadı.");

  // Test diameter quick chip interaction
  const diameterChips = await interactionPage.$$('button[aria-pressed]');
  if (diameterChips.length > 0) {
    await diameterChips[0].click(); // click first chip (e.g. Ø8)
    assert(await interactionPage.$eval('[data-testid="rebar-result"]', (el) => el.textContent?.includes("Ø8")), "Çap çipi seçimi sonuç alanına yansımadı.");
  }

  // Test quantity invalid validation
  await interactionPage.focus("#rebar-quantity");
  await interactionPage.$eval("#rebar-quantity", (input) => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await interactionPage.type("#rebar-quantity", "0");
  assert(await interactionPage.$eval("#rebar-quantity", (input) => input.getAttribute("aria-invalid") === "true"), "Geçersiz adet işaretlenmedi.");

  // Test large valid quantity
  await interactionPage.click("#rebar-quantity", { clickCount: 3 });
  await interactionPage.type("#rebar-quantity", "1000000");
  assert(await interactionPage.$eval("#rebar-quantity", (input) => input.getAttribute("aria-invalid") === "false"), "Büyük geçerli adet reddedildi.");
  assert(
    !(await interactionPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
    "Büyük adet sonucu yatay taşma oluşturdu.",
  );

  await interactionPage.keyboard.press("Tab");
  assert(await interactionPage.evaluate(() => document.activeElement !== document.body), "Klavye odağı etkileşimli öğeye taşınmadı.");
  await interactionPage.close();

  console.log(`Donatı sayfası ${scenarios.length} viewport ve etkileşim senaryosunda doğrulandı.`);
} finally {
  await browser.close();
  if (serverProcess) {
    serverProcess.kill();
  }
}
