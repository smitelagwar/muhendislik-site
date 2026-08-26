import fs from "node:fs";
import http from "node:http";
import next from "next";
import puppeteer from "puppeteer";

const targets = [
  { slug: "yapi-denetimi-statik-proje-kontrolu", expected: "Form-1" },
  { slug: "yapi-denetimi-betonarme-uygulama-cizimleri", expected: "revizyon" },
  { slug: "yapi-denetimi-dokum-oncesi-kalip-donati", expected: "betona nezaret" },
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
  for (const target of targets) {
    for (const theme of ["light", "dark"]) {
      for (const viewport of viewports) {
        const page = await browser.newPage();
        const pageErrors = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        try {
          await page.setViewport({ width: viewport.width, height: viewport.height, isMobile: viewport.mobile, hasTouch: viewport.mobile });
          await page.evaluateOnNewDocument((selectedTheme) => localStorage.setItem("theme", selectedTheme), theme);
          const response = await page.goto(`http://127.0.0.1:${port}/${target.slug}`, { waitUntil: "domcontentloaded", timeout: 90000 });
          assert(response && response.status() < 400, `${target.slug}: HTTP hatası.`);
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
              imageAlts: images.map((img) => img.getAttribute("alt") ?? ""),
              text: article.textContent ?? "",
            };
          });
          assert(result.theme === theme, `${target.slug}: tema hatası.`);
          assert(!result.overflow, `${target.slug}: ${viewport.id}/${theme} yatay taşma.`);
          assert(result.h1, `${target.slug}: H1 yok.`);
          assert(result.sections >= 6, `${target.slug}: bölüm yapısı yetersiz.`);
          assert(result.tables >= 1, `${target.slug}: teknik tablo yok.`);
          assert(result.images >= 2, `${target.slug}: cover/body görsel kontratı eksik.`);
          assert(result.imageAlts.some((alt) => alt.includes("teknik kontrol şeması")), `${target.slug}: rollout teknik diyagramı yok.`);
          assert(result.text.includes("Mühendislik kontrol listesi"), `${target.slug}: mühendislik kontrol listesi yok.`);
          assert(result.text.includes(target.expected), `${target.slug}: beklenen teknik işaret görünmüyor (${target.expected}).`);
          assert(pageErrors.length === 0, `${target.slug}: ${pageErrors.join(" | ")}`);
          completed.push({ route: `/${target.slug}`, classification: "C3", viewport: viewport.id, theme, h1: result.h1, sections: result.sections, tables: result.tables, images: result.images });
        } finally {
          await page.close();
        }
      }
    }
  }
  console.log(JSON.stringify({ status: "ok", phase: "FAZ 4 batch 9", routes: targets.length, checks: completed.length, matrix: "3 routes × 2 themes × 2 viewports", classifications: Object.fromEntries(targets.map((target) => [target.slug, "C3"])), completed }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
