import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

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

const outDir = path.join("C:\\Users\\hsyn\\.gemini\\antigravity-ide\\brain\\3ee0b021-1570-4b93-8371-ee46db96b4e5", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const executablePath = getBrowserExecutablePath();
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });

// 1. Full Page Captures
const viewports = [
  { name: "mobile_dark", width: 390, height: 844, isMobile: true, theme: "dark" },
  { name: "mobile_light", width: 390, height: 844, isMobile: true, theme: "light" },
  { name: "desktop_dark", width: 1440, height: 900, isMobile: false, theme: "dark" },
  { name: "desktop_light", width: 1440, height: 900, isMobile: false, theme: "light" },
];

for (const vp of viewports) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument((theme) => {
    localStorage.setItem("theme", theme);
  }, vp.theme);
  await page.goto("http://127.0.0.1:3000/kategori/araclar/donati-hesabi", { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate((theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, vp.theme);
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: true });
  await page.close();
}

// 2. Modal Popup Captures (Desktop & Mobile)
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, isMobile: false, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:3000/kategori/araclar/donati-hesabi", { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await new Promise((r) => setTimeout(r, 400));

  // Open weights tab dialog
  const weightButtons = await page.$$("button");
  for (const btn of weightButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text?.includes("Birim Ağırlık Tablosu")) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, "modal_weights_dark.png"), fullPage: false });

  // Switch to Areas tab in dialog
  const areaTriggers = await page.$$("button[role='tab']");
  for (const tab of areaTriggers) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text?.includes("Alan Matrisi")) {
      await tab.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, "modal_areas_dark.png"), fullPage: false });
  await page.close();
}

// 3. Mobile Modal Capture
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:3000/kategori/araclar/donati-hesabi", { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await new Promise((r) => setTimeout(r, 400));

  // Open areas modal directly on mobile
  const areaButtons = await page.$$("button");
  for (const btn of areaButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text?.includes("Donatı Alan Tablosu")) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, "modal_mobile_areas_dark.png"), fullPage: false });
  await page.close();
}

await browser.close();
console.log("Screenshots successfully saved to " + outDir);
