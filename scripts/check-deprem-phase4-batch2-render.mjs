import fs from "node:fs";
import http from "node:http";
import next from "next";
import puppeteer from "puppeteer";

const slugs = [
  "mevcut-bina-donati-tespiti-korozyon",
  "mevcut-bina-beklenen-dayanim-bilgi-katsayisi",
  "mevcut-bina-sunek-gevrek-hasar-siniflamasi",
  "mevcut-bina-dogrusal-degerlendirme-sinirlari",
];
const viewports = [
  { id: "desktop", width: 1440, height: 900, mobile: false },
  { id: "mobile", width: 390, height: 844, mobile: true },
];

function assert(value, message) {
  if (!value) throw new Error(message);
}

const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium"].find((path) => fs.existsSync(path));
assert(executablePath, "Chrome/Chromium bulunamadı.");

const app = next({ dev: false, dir: process.cwd(), hostname: "127.0.0.1", port: 0 });
await app.prepare();
const handle = app.getRequestHandler();
const server = http.createServer((request, response) => handle(request, response));
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
const completed = [];

try {
  for (const slug of slugs) {
    for (const theme of ["light", "dark"]) {
      for (const viewport of viewports) {
        const page = await browser.newPage();
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        try {
          await page.setViewport({ width: viewport.width, height: viewport.height, isMobile: viewport.mobile, hasTouch: viewport.mobile });
          await page.evaluateOnNewDocument((selectedTheme) => localStorage.setItem("theme", selectedTheme), theme);
          const response = await page.goto(`http://127.0.0.1:${port}/${slug}`, { waitUntil: "domcontentloaded", timeout: 90000 });
          assert(response && response.status() < 400, `${slug}: HTTP hatası.`);
          await page.waitForSelector("h1", { visible: true, timeout: 20000 });
          const result = await page.evaluate(() => {
            const article = document.querySelector("article") ?? document.body;
            const images = [...article.querySelectorAll("img")].filter((img) => img.getBoundingClientRect().width > 0 && img.getBoundingClientRect().height > 0);
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
              h1: document.querySelector("h1")?.textContent?.trim() ?? "",
              sections: [...article.querySelectorAll("h2, h3")].filter((node) => node.getBoundingClientRect().width > 0).length,
              tables: article.querySelectorAll("table").length,
              images: images.length,
              diagram: images.some((img) => (img.getAttribute("alt") ?? "").includes("teknik kontrol şeması")),
              checklist: (article.textContent ?? "").includes("Mühendislik kontrol listesi"),
            };
          });
          assert(result.theme === theme, `${slug}: tema hatası.`);
          assert(!result.overflow, `${slug}: ${viewport.id}/${theme} yatay taşma.`);
          assert(result.h1, `${slug}: H1 yok.`);
          assert(result.sections >= 5, `${slug}: bölüm yapısı yetersiz.`);
          assert(result.tables >= 1, `${slug}: teknik tablo yok.`);
          assert(result.images >= 2, `${slug}: görsel kontratı eksik.`);
          assert(result.diagram, `${slug}: rollout diyagramı yok.`);
          assert(result.checklist, `${slug}: mühendislik kontrol listesi yok.`);
          assert(pageErrors.length === 0, `${slug}: ${pageErrors.join(" | ")}`);
          completed.push({ route: `/${slug}`, viewport: viewport.id, theme, h1: result.h1, sections: result.sections, tables: result.tables, images: result.images });
        } finally {
          await page.close();
        }
      }
    }
  }
  console.log(JSON.stringify({ status: "ok", phase: "FAZ 4 batch 2", routes: slugs.length, checks: completed.length, matrix: "4 routes × 2 themes × 2 viewports", completed }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
