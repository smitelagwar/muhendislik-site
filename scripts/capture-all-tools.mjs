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
    { name: "tools_showcase_desktop_dark", url: "http://localhost:3000/kategori/araclar", width: 1440, height: 1100, isMobile: false },
    { name: "tools_showcase_mobile_dark", url: "http://localhost:3000/kategori/araclar", width: 390, height: 844, isMobile: true },
    { name: "tool_beam_dark", url: "http://localhost:3000/kategori/araclar/kiris-kesiti", width: 1440, height: 1100, isMobile: false },
    { name: "tool_imar_dark", url: "http://localhost:3000/kategori/araclar/imar-hesaplayici", width: 1440, height: 1100, isMobile: false },
    { name: "tool_insulation_dark", url: "http://localhost:3000/kategori/araclar/dis-cephe-yalitim-kalinligi", width: 1440, height: 1100, isMobile: false },
    { name: "tool_base_shear_dark", url: "http://localhost:3000/kategori/araclar/taban-kesme-kuvveti", width: 1440, height: 1100, isMobile: false },
    { name: "tool_kalip_dark", url: "http://localhost:3000/kategori/araclar/kalip-sokum-suresi", width: 1440, height: 1100, isMobile: false },
    { name: "tool_period_dark", url: "http://localhost:3000/kategori/araclar/deprem-periyot-hesabi", width: 1440, height: 1100, isMobile: false },
    { name: "tool_drift_dark", url: "http://localhost:3000/kategori/araclar/goreli-kat-otelemesi", width: 1440, height: 1100, isMobile: false },
    { name: "tool_retaining_dark", url: "http://localhost:3000/kategori/araclar/iksa-toprak-basinci", width: 1440, height: 1100, isMobile: false },
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
  console.log("All tools screenshots captured successfully.");
}

main().catch(err => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
