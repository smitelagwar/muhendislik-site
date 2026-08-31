import fs from "fs";
import http from "http";
import next from "next";
import puppeteer from "puppeteer";

const requestedPort = Number(process.argv[2] ?? "0");

// 30 Mühendislik Aracının ID Listesi
const TOOL_IDS = [
  "donati-hesabi",
  "kolon-on-boyutlandirma",
  "kiris-kesiti",
  "doseme-kalinligi",
  "pas-payi",
  "zimbalama-kontrolu",
  "kiris-kesme-etriye",
  "kenetlenme-boyu",
  "taban-kesme-kuvveti",
  "duzensizlik-kontrolu",
  "zemin-sinifi",
  "deprem-periyot-hesabi",
  "goreli-kat-otelemesi",
  "radye-temel-hesabi",
  "iksa-toprak-basinci",
  "sev-stabilitesi",
  "celik-profil-secimi",
  "celik-birlestesi-hesabi",
  "ahsap-eleman-hesabi",
  "kalip-sokum-suresi",
  "dis-cephe-yalitim-kalinligi",
  "imar-hesaplayici",
  "beton-metraj-hesabi",
  "hafriyat-metraj-hesabi",
  "pratik-donati-metraji",
  "pratik-kalip-metraji",
  "duvar-metraji-hesabi",
  "siva-boya-metraji",
  "cati-kaplama-metraji",
  "seramik-fayans-metraji",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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
    // Fall through
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

async function startServer() {
  const app = next({ dev: false, dir: process.cwd() });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  await new Promise((resolve) => server.listen(requestedPort, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : requestedPort;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}

async function inspectToolPage(browser, baseUrl, toolId) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore favicon or non-critical 404s
      if (!text.includes("favicon") && !text.includes("404")) {
        consoleErrors.push(text);
      }
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  const route = `/kategori/araclar/${toolId}`;

  try {
    await page.setViewport({ width: 1280, height: 800 });

    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    assert(response && response.status() < 400, `${route} ${response?.status()} durum kodu döndürdü.`);
    await page.waitForSelector("body", { visible: true });
    await page.waitForFunction(
      () => {
        const text = document.body?.innerText || "";
        return (
          !text.includes("Sayfa yükleniyor") &&
          (document.querySelectorAll("input, select, button").length > 0 ||
            document.querySelectorAll("h1").length > 0)
        );
      },
      { timeout: 15000 },
    );

    // Sayfa içeriği kontrolleri
    const pageData = await page.evaluate((id) => {
      const bodyText = document.body.innerText;
      const hasPlaceholder =
        bodyText.includes("Hesaplama Modülü Yapılandırılıyor") ||
        bodyText.includes("modülü hazırlanıyor");
      const hasNaN = /\bNaN\b/.test(bodyText);
      const hasInfinity = /\bInfinity\b/.test(bodyText);
      const hasInputs = document.querySelectorAll("input, select, button").length > 0;
      const h1 = document.querySelector("h1")?.innerText || "";

      // 4 Pilot Araç Özel Güven Primitive Kontrolleri
      const isPilot = ["donati-hesabi", "kiris-kesiti", "taban-kesme-kuvveti", "beton-metraj-hesabi"].includes(id);
      const lowerBody = bodyText.toLocaleLowerCase("tr");
      const hasScopeOrStamp =
        lowerBody.includes("mühendislik tahkiki") ||
        lowerBody.includes("ön boyutlandırma") ||
        lowerBody.includes("ön keşif") ||
        lowerBody.includes("yaklaşık ön keşif");
      const allButtonsText = Array.from(document.querySelectorAll("button"))
        .map((b) => b.innerText.toLocaleLowerCase("tr"))
        .join(" ");
      const hasLimitations =
        lowerBody.includes("kapsam") ||
        lowerBody.includes("doğrulama şartları") ||
        allButtonsText.includes("kapsam") ||
        allButtonsText.includes("şartları");
      const hasDiagram = document.querySelectorAll("figure svg, svg").length > 0;

      return {
        hasPlaceholder,
        hasNaN,
        hasInfinity,
        hasInputs,
        h1,
        isPilot,
        hasScopeOrStamp,
        hasLimitations,
        hasDiagram,
      };
    }, toolId);

    assert(!pageData.hasPlaceholder, `${route}: Sayfada placeholder metni tespit edildi!`);
    assert(!pageData.hasNaN, `${route}: Sayfada NaN değeri tespit edildi!`);
    assert(!pageData.hasInfinity, `${route}: Sayfada Infinity değeri tespit edildi!`);
    assert(pageData.hasInputs, `${route}: Sayfada etkileşimli input/kontrol bulunamadı!`);
    assert(pageData.h1.length > 0, `${route}: H1 başlığı bulunamadı!`);
    assert(pageErrors.length === 0, `${route}: Runtime hatası: ${pageErrors.join("; ")}`);

    if (pageData.isPilot) {
      assert(pageData.hasScopeOrStamp, `${route}: Pilot araçta ToolScopeBadge veya ToolSourceStamp bulunamadı!`);
      assert(pageData.hasLimitations, `${route}: Pilot araçta ToolLimitations paneli bulunamadı!`);
      if (["donati-hesabi", "taban-kesme-kuvveti"].includes(toolId)) {
        assert(pageData.hasDiagram, `${route}: Pilot araçta SVG mühendislik diyagramı bulunamadı!`);
      }
    }

    return {
      toolId,
      title: pageData.h1,
      status: "PASS",
    };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("==================================================================");
  console.log("FAZ 9 & 10 — 30/30 MÜHENDİSLİK ARAÇLARI BROWSER SMOKE TESTİ");
  console.log("==================================================================\n");

  const executablePath = getBrowserExecutablePath();
  assert(executablePath, "Puppeteer veya uyumlu tarayıcı binary'si bulunamadı.");

  console.log("Next.js sunucusu başlatılıyor...");
  const server = await startServer();
  console.log(`Sunucu hazır: ${server.baseUrl}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const results = [];
  try {
    for (let i = 0; i < TOOL_IDS.length; i++) {
      const toolId = TOOL_IDS[i];
      process.stdout.write(`[${(i + 1).toString().padStart(2, "0")}/30] Test ediliyor: ${toolId}... `);
      const res = await inspectToolPage(browser, server.baseUrl, toolId);
      results.push(res);
      console.log(`✅ PASS (${res.title.slice(0, 30)}...)`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log("\n==================================================================");
  console.log(`✅ 30/30 ARAÇ BROWSER SMOKE TESTİ BAŞARIYLA TAMAMLANDI (${results.length}/30 PASS).`);
  console.log("==================================================================\n");
}

main().catch((err) => {
  console.error("\n❌ BROWSER SMOKE TEST HATASI:", err);
  process.exit(1);
});
