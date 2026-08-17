import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const targetDir = "C:\\Users\\hsyn\\.gemini\\antigravity-ide\\brain\\3ee0b021-1570-4b93-8371-ee46db96b4e5\\screenshots";
mkdirSync(targetDir, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const urls = [
    { name: "neurobank_dashboard_full_desktop", url: "http://localhost:3000/hesaplamalar", width: 1440, height: 1100, isMobile: false, fullPage: true },
    { name: "neurobank_dashboard_full_mobile", url: "http://localhost:3000/hesaplamalar", width: 390, height: 844, isMobile: true, fullPage: true },
  ];

  for (const item of urls) {
    const page = await browser.newPage();
    await page.setViewport({ width: item.width, height: item.height, isMobile: item.isMobile, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });
    
    console.log(`Navigating to ${item.url}...`);
    await page.goto(item.url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(r => setTimeout(r, 1200));

    const outPath = resolve(targetDir, `${item.name}.png`);
    await page.screenshot({ path: outPath, fullPage: item.fullPage });
    console.log(`Saved screenshot: ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log("Full page screenshots captured.");
}

main().catch(err => {
  console.error("Full screenshot capture failed:", err);
  process.exit(1);
});
