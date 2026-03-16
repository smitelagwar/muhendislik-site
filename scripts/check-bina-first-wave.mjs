import puppeteer from "puppeteer";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const EXPECTED_AUTHOR = "İnşaat Mühendisi Hüseyin Günaydın";

const contentModule = await import(new URL("../src/lib/bina-asamalari-content/index.ts", import.meta.url));
const { getFirstWaveBinaGuidePaths } = contentModule;

const firstWavePaths = getFirstWaveBinaGuidePaths().map((path) => `/kategori/bina-asamalari/${path}`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const errors = [];

try {
  const rootResponse = await page.goto(`${BASE_URL}/kategori/bina-asamalari`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  if (!rootResponse || rootResponse.status() >= 400) {
    errors.push(`Kok sayfa acilmadi: ${rootResponse?.status() ?? "yanitsiz"}`);
  } else {
    const rootLinks = await page.$$eval('a[href^="/kategori/bina-asamalari/"]', (anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean))],
    );

    const missingRootLinks = firstWavePaths.filter((path) => !rootLinks.includes(path));
    if (missingRootLinks.length > 0) {
      errors.push(`Kok agacta eksik ilk dalga linkleri var: ${missingRootLinks.slice(0, 8).join(", ")}`);
    }
  }

  for (const path of firstWavePaths) {
    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    if (!response || response.status() >= 400) {
      errors.push(`Sayfa acilmadi: ${path} -> ${response?.status() ?? "yanitsiz"}`);
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
      errors.push(`Yazar bulunamadi: ${path}`);
    }

    if (!snapshot.text.includes("İçindekiler")) {
      errors.push(`Icindekiler bulunamadi: ${path}`);
    }

    if (snapshot.text.includes("Araç kısayolu") || snapshot.text.includes("İşinize yarayabilir")) {
      errors.push(`Arac promosyonu gorundu: ${path}`);
    }

    const minimumHeadings = path.split("/").length === 4 ? 12 : 11;
    if (snapshot.headings < minimumHeadings) {
      errors.push(`Heading sayisi yetersiz: ${path} -> ${snapshot.headings}`);
    }

    if (snapshot.tocLinks < minimumHeadings) {
      errors.push(`TOC link sayisi yetersiz: ${path} -> ${snapshot.tocLinks}`);
    }

    if (!snapshot.hasBackLink) {
      errors.push(`Geri/ust kategori linki gorunmuyor: ${path}`);
    }
  }
} finally {
  await browser.close();
}

if (errors.length > 0) {
  console.error("Bina ilk dalga tarama hataları:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Bina ilk dalga taraması geçti. Kontrol edilen sayfa sayısı: ${firstWavePaths.length + 1}`);
