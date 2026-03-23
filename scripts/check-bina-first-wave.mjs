import fs from "fs/promises";
import http from "http";
import path from "path";
import next from "next";
import puppeteer from "puppeteer";

const EXTERNAL_BASE_URL = process.env.BASE_URL;
const REQUESTED_PORT = Number(process.argv[2] ?? "0");
const BUILD_FILES = [".next/BUILD_ID", ".next/server/middleware-manifest.json"];
const EXPECTED_AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın";
const EXPECTED_TOC_LABEL = "İçindekiler";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProductionBuild(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const ready = await Promise.all(
      BUILD_FILES.map((file) =>
        fs
          .access(path.resolve(process.cwd(), file))
          .then(() => true)
          .catch(() => false),
      ),
    );

    if (ready.every(Boolean)) {
      return;
    }

    await wait(500);
  }

  throw new Error("Production build çıktıları zamanında hazır olmadı.");
}

async function startLocalServer() {
  await waitForProductionBuild();

  const app = next({
    dev: false,
    dir: process.cwd(),
    hostname: "127.0.0.1",
    port: REQUESTED_PORT || 3000,
  });

  await app.prepare();

  const handle = app.getRequestHandler();
  const server = http.createServer((request, response) => handle(request, response));

  await new Promise((resolve) => {
    server.listen(REQUESTED_PORT, "127.0.0.1", resolve);
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Yerel kontrol sunucusunun portu çözülemedi.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
  };
}

const contentModule = await import(new URL("../src/lib/bina-asamalari-content/index.ts", import.meta.url));
const { getFirstWaveBinaGuidePaths } = contentModule;
const firstWavePaths = getFirstWaveBinaGuidePaths().map((guidePath) => `/kategori/bina-asamalari/${guidePath}`);

const localServer = EXTERNAL_BASE_URL ? null : await startLocalServer();
const baseUrl = EXTERNAL_BASE_URL ?? localServer.baseUrl;
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const errors = [];

try {
  const rootResponse = await page.goto(`${baseUrl}/kategori/bina-asamalari`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  if (!rootResponse || rootResponse.status() >= 400) {
    errors.push(`Kök sayfa açılamadı: ${rootResponse?.status() ?? "yanıtsız"}`);
  } else {
    const rootLinks = await page.$$eval('a[href^="/kategori/bina-asamalari/"]', (anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean))],
    );

    const missingRootLinks = firstWavePaths.filter((guidePath) => !rootLinks.includes(guidePath));
    if (missingRootLinks.length > 0) {
      errors.push(`Kök ağaçta eksik ilk dalga linkleri var: ${missingRootLinks.slice(0, 8).join(", ")}`);
    }
  }

  for (const guidePath of firstWavePaths) {
    const response = await page.goto(`${baseUrl}${guidePath}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    if (!response || response.status() >= 400) {
      errors.push(`Sayfa açılamadı: ${guidePath} -> ${response?.status() ?? "yanıtsız"}`);
      continue;
    }

    const snapshot = await page.evaluate(() => {
      const text = document.body.innerText;
      const tocLinks = document.querySelectorAll('aside a[href^="#"]').length;
      const headings = document.querySelectorAll("article h2").length;
      const backLink = document.querySelector('a[href^="/kategori/bina-asamalari"]');

      return {
        text,
        tocLinks,
        headings,
        hasBackLink: Boolean(backLink),
      };
    });

    if (!snapshot.text.includes(EXPECTED_AUTHOR)) {
      errors.push(`Yazar bulunamadı: ${guidePath}`);
    }

    if (!snapshot.text.includes(EXPECTED_TOC_LABEL)) {
      errors.push(`İçindekiler bulunamadı: ${guidePath}`);
    }

    if (snapshot.text.includes("Araç kısayolu") || snapshot.text.includes("İşinize yarayabilir")) {
      errors.push(`Araç promosyonu göründü: ${guidePath}`);
    }

    const minimumHeadings = guidePath.split("/").length === 4 ? 12 : 11;
    if (snapshot.headings < minimumHeadings) {
      errors.push(`Heading sayısı yetersiz: ${guidePath} -> ${snapshot.headings}`);
    }

    if (snapshot.tocLinks < minimumHeadings) {
      errors.push(`TOC link sayısı yetersiz: ${guidePath} -> ${snapshot.tocLinks}`);
    }

    if (!snapshot.hasBackLink) {
      errors.push(`Geri/üst kategori linki görünmüyor: ${guidePath}`);
    }
  }
} finally {
  await page.close();
  await browser.close();

  if (localServer?.server) {
    localServer.server.closeIdleConnections?.();
    localServer.server.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      localServer.server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

if (errors.length > 0) {
  console.error("Bina ilk dalga tarama hataları:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Bina ilk dalga taraması geçti. Kontrol edilen sayfa sayısı: ${firstWavePaths.length + 1}`);
