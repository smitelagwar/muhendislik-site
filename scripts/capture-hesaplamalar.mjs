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
    { name: "hesaplamalar_showcase_desktop_dark", url: "http://localhost:3000/hesaplamalar", width: 1440, height: 1100, isMobile: false },
    { name: "hesaplamalar_showcase_mobile_dark", url: "http://localhost:3000/hesaplamalar", width: 390, height: 844, isMobile: true },
    { name: "calc_hizli_metraj_dark", url: "http://localhost:3000/hesaplamalar/hizli-metraj", width: 1440, height: 1100, isMobile: false },
    { name: "calc_insaat_maliyeti_dark", url: "http://localhost:3000/hesaplamalar/insaat-maliyeti", width: 1440, height: 1100, isMobile: false },
    { name: "calc_tahmini_alan_dark", url: "http://localhost:3000/hesaplamalar/tahmini-insaat-alani", width: 1440, height: 1100, isMobile: false },
    { name: "calc_resmi_maliyet_dark", url: "http://localhost:3000/hesaplamalar/resmi-birim-maliyet-2026", width: 1440, height: 1100, isMobile: false },
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
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot: ${outPath}`);
    await page.close();
  }

  await browser.close();
  console.log("All hesaplamalar screenshots captured successfully.");
}

main().catch(err => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
