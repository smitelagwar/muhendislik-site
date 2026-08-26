import fs from "node:fs";
import http from "node:http";
import next from "next";
import puppeteer from "puppeteer";

const targets = [
  { slug: "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu", expected: "2,52 m²" },
  { slug: "asansor-makine-daireli-ve-dairesiz-sistemler", expected: "ayda en az bir" },
  { slug: "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu", expected: "120 gün" },
  { slug: "asansor-deprem-sirasinda-otomatik-park-ozelligi", expected: "TS EN 81-77" },
];

const viewports = [
  { id: "desktop", width: 1440, height: 900, mobile: false },
  { id: "mobile", width: 390, height: 844, mobile: true },
];

function assert(value, message) { if (!value) throw new Error(message); }

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
const matrixPasses = new Map(targets.map((target) => [target.slug, 0]));

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
            const links = [...document.querySelectorAll("a[href]")].map((node) => node.getAttribute("href") ?? "");
            return {
              theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
              overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
              h1: document.querySelector("h1")?.textContent?.trim() ?? "",
              sections: [...article.querySelectorAll("h2, h3")].filter((node) => node.getBoundingClientRect().width > 0).length,
              tables: article.querySelectorAll("table").length,
              images: images.length,
              imageAlts: images.map((img) => img.getAttribute("alt") ?? ""),
              links,
              text: document.body.textContent ?? "",
            };
          });
          assert(result.theme === theme, `${target.slug}: tema hatası.`);
          assert(!result.overflow, `${target.slug}: ${viewport.id}/${theme} yatay taşma.`);
          assert(result.h1, `${target.slug}: H1 yok.`);
          assert(result.sections >= 7, `${target.slug}: bölüm yapısı yetersiz (${result.sections}/7).`);
          assert(result.tables >= 1, `${target.slug}: teknik tablo kontratı eksik.`);
          assert(result.images >= 2, `${target.slug}: cover/body görsel kontratı eksik.`);
          assert(result.imageAlts.every((alt) => Boolean(alt.trim())), `${target.slug}: görünür görsellerden birinde alt metni boş.`);
          assert(result.imageAlts.some((alt) => alt.includes("teknik kontrol şeması")), `${target.slug}: rollout teknik diyagramı yok.`);
          assert(result.text.includes(target.expected), `${target.slug}: beklenen teknik işaret görünmüyor (${target.expected}).`);
          assert(result.text.includes("Mühendislik kontrol listesi"), `${target.slug}: mühendislik kontrol listesi görünmüyor.`);
          assert(result.text.includes("İnşaat Mühendisi Hüseyin GÜNAYDIN"), `${target.slug}: canonical yazar görünmüyor.`);
          assert(result.text.includes("26 Ağustos 2026"), `${target.slug}: güncelleme tarihi görünmüyor.`);
          assert(result.links.some((href) => href.includes("resmigazete.gov.tr") || href.includes("csb.gov.tr") || href.includes("afad.gov.tr") || href.includes(".bel.tr")), `${target.slug}: resmî/kamu kaynak linki görünmüyor.`);
          assert(!result.links.some((href) => href.includes("/deprem-yonetmelik/araclar/")), `${target.slug}: eski araç route'u görünür durumda.`);
          assert(pageErrors.length === 0, `${target.slug}: ${pageErrors.join(" | ")}`);
          matrixPasses.set(target.slug, (matrixPasses.get(target.slug) ?? 0) + 1);
          completed.push({ route: `/${target.slug}`, classification: "C3", viewport: viewport.id, theme, h1: result.h1, sections: result.sections, tables: result.tables, images: result.images });
        } finally {
          await page.close();
        }
      }
    }
  }

  const qualityScores = Object.fromEntries(targets.map((target) => {
    const passed = matrixPasses.get(target.slug) ?? 0;
    assert(passed === 4, `${target.slug}: responsive kalite matrisi 4/4 değil (${passed}/4).`);
    const layoutScore = passed === 4 ? 10 : 0;
    const finalScoreFloor = 80 + layoutScore;
    assert(finalScoreFloor >= 90, `${target.slug}: kalite skoru tabanı 90/100 altı (${finalScoreFloor}/100).`);
    return [target.slug, { classification: "C3", staticScoreFloor: 80, layoutScore, finalScoreFloor }];
  }));

  console.log(JSON.stringify({
    status: "ok",
    phase: "FAZ 6 batch 4 — Asansör",
    routes: targets.length,
    checks: completed.length,
    matrix: "4 routes × 2 themes × 2 viewports",
    classifications: Object.fromEntries(targets.map((target) => [target.slug, "C3"])),
    qualityScoreContract: "preceding static gate >=80/90 + this layout gate 10/10 => final >=90/100",
    qualityScores,
    completed,
  }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
