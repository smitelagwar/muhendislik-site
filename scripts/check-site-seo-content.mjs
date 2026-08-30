import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import next from "next";
import puppeteer from "puppeteer";

const port = Number(process.env.SITE_SEO_PORT ?? "3006");
const baseUrl = `http://127.0.0.1:${port}`;
const OUT_FILE = path.join(process.cwd(), ".data", "site-seo-evidence.json");

const REPRESENTATIVE_ROUTES = [
  { name: "Ana Sayfa", path: "/" },
  { name: "Hesaplamalar İndeks", path: "/hesaplamalar" },
  { name: "Hızlı Metraj", path: "/hesaplamalar/hizli-metraj" },
  { name: "İnşaat Maliyeti", path: "/hesaplamalar/insaat-maliyeti" },
  { name: "Resmi Birim Maliyet 2026", path: "/hesaplamalar/resmi-birim-maliyet-2026" },
  { name: "Tahmini İnşaat Alanı", path: "/hesaplamalar/tahmini-insaat-alani" },
  { name: "Araçlar İndeks", path: "/kategori/araclar" },
  { name: "Donatı Hesabı", path: "/kategori/araclar/donati-hesabi" },
  { name: "Kolon Ön Boyutlandırma", path: "/kategori/araclar/kolon-on-boyutlandirma" },
  { name: "Bina Aşamaları", path: "/kategori/bina-asamalari" },
  { name: "Konu Haritası", path: "/konu-haritasi" },
  { name: "Belgeler ve Şablonlar", path: "/belgeler" },
  { name: "Hakkımızda", path: "/hakkimizda" },
  { name: "Gizlilik Politikası", path: "/gizlilik" },
  { name: "Kullanım Koşulları", path: "/kullanim-kosullari" },
  { name: "İletişim", path: "/iletisim" },
];

const MOJIBAKE_REGEX = /(?:Ã§|Ã¼|ÅŸ|Ä±|Ã¶|ÄŸ|Ã‡|Ãœ|Åž|Ä°|Ã–|Äž)/;

async function checkRouteSeo(page, route) {
  const url = `${baseUrl}${route.path}`;
  const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 25_000 });
  await page.waitForSelector("h1", { timeout: 5_000 }).catch(() => null);
  const status = response ? response.status() : 0;

  const data = await page.evaluate((expectedPath) => {
    const title = document.title || "";
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "";
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
    const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute("content") || "";
    const lang = document.documentElement.getAttribute("lang") || "";

    // H1 count & text
    const h1Elements = Array.from(document.querySelectorAll("h1"));
    const h1Count = h1Elements.length;
    const h1Text = h1Elements.map((el) => (el.textContent || "").trim()).join(" | ");

    // JSON-LD structured data
    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const structuredData = [];
    let jsonLdError = null;

    for (const script of jsonLdScripts) {
      try {
        const parsed = JSON.parse(script.textContent || "{}");
        structuredData.push(parsed["@type"] || "Unknown");
      } catch (err) {
        jsonLdError = String(err);
      }
    }

    // Images missing alt
    const imagesWithoutAlt = Array.from(document.querySelectorAll("img:not([alt])")).map((img) =>
      img.getAttribute("src") || "unknown-src"
    );

    // Text content for Mojibake check
    const bodyText = document.body ? document.body.innerText.slice(0, 5000) : "";

    return {
      title,
      metaDesc,
      canonical,
      ogTitle,
      ogDesc,
      ogImage,
      twitterCard,
      lang,
      h1Count,
      h1Text,
      structuredData,
      jsonLdError,
      imagesWithoutAlt,
      bodySample: bodyText,
    };
  }, route.path);

  const errors = [];

  if (status !== 200) {
    errors.push(`HTTP status ${status} (expected 200)`);
  }
  if (!data.title || data.title.length < 10) {
    errors.push(`Title eksik veya çok kısa: "${data.title}"`);
  }
  if (!data.metaDesc || data.metaDesc.length < 30) {
    errors.push(`Description eksik veya çok kısa: "${data.metaDesc}"`);
  }
  if (!data.canonical) {
    errors.push("Canonical link eksik");
  } else if (route.path !== "/" && (data.canonical.endsWith("/") || data.canonical === baseUrl)) {
    errors.push(`Hatalı canonical: Alt sayfa ana sayfayı canonical göstermemeli: "${data.canonical}"`);
  }
  if (data.h1Count !== 1) {
    errors.push(`H1 başlık sayısı 1 olmalı (Bulunan: ${data.h1Count})`);
  }
  if (data.lang !== "tr") {
    errors.push(`HTML lang="tr" olmalı (Bulunan: "${data.lang}")`);
  }
  if (data.jsonLdError) {
    errors.push(`JSON-LD ayrıştırma hatası: ${data.jsonLdError}`);
  }
  if (data.imagesWithoutAlt.length > 0) {
    errors.push(`Alt etiketi olmayan ${data.imagesWithoutAlt.length} görsel var`);
  }
  if (MOJIBAKE_REGEX.test(data.bodySample)) {
    errors.push("Bozuk karakter (mojibake) şüphesi tespit edildi");
  }

  return {
    ...route,
    status,
    ...data,
    errors,
    isPassing: errors.length === 0,
  };
}

async function verifySitemapAndRobots() {
  console.log("\n[SEO] Sitemap ve Robots.txt bütünlüğü denetleniyor...");
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  if (!sitemapRes.ok) {
    throw new Error(`sitemap.xml yüklenemedi: ${sitemapRes.status}`);
  }
  const sitemapText = await sitemapRes.text();
  const urls = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  console.log(`[SEO] Sitemap'te toplam ${urls.length} URL bulundu.`);

  // Duplication check
  const urlSet = new Set(urls);
  const duplicates = urls.length - urlSet.size;

  // Private route exclusion check
  const leakedPrivate = urls.filter((u) =>
    u.includes("/dokumantasyon") || u.includes("/admin") || u.includes("/giris") || u.includes("/p/")
  );

  // Robots.txt check
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  const robotsText = await robotsRes.text();
  const hasDisallowApi = robotsText.includes("Disallow: /api/");
  const hasDisallowDokumantasyon = robotsText.includes("Disallow: /dokumantasyon");
  const hasSitemapDirective = robotsText.includes("sitemap.xml");

  return {
    totalSitemapUrls: urls.length,
    duplicates,
    leakedPrivateUrls: leakedPrivate,
    robotsValid: hasDisallowApi && hasDisallowDokumantasyon && hasSitemapDirective,
    sitemapValid: urls.length > 100 && duplicates === 0 && leakedPrivate.length === 0,
  };
}

async function main() {
  console.log("========================================================");
  console.log("   ADIM 7/10: SEO, İÇERİK BÜTÜNLÜĞÜ VE METADATA DENETİMİ");
  console.log(`   Hedef Sunucu: ${baseUrl}                              `);
  console.log("========================================================\n");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const app = next({
    dev: false,
    dir: process.cwd(),
    hostname: "127.0.0.1",
    port,
  });

  await app.prepare();
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));

  await new Promise((resolve) => {
    server.listen(port, "127.0.0.1", resolve);
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const results = [];

  for (const route of REPRESENTATIVE_ROUTES) {
    process.stdout.write(`Denetleniyor: [${route.name}] (${route.path}) ... `);
    const routeRes = await checkRouteSeo(page, route);
    results.push(routeRes);

    if (routeRes.isPassing) {
      console.log(`[PASS] Title: "${routeRes.title.slice(0, 35)}..." | H1: 1 | Canonical: OK`);
    } else {
      console.log(`[FAIL] ${routeRes.errors.join("; ")}`);
    }
  }

  const sitemapRobots = await verifySitemapAndRobots();

  await browser.close();
  server.close();

  const failedRoutes = results.filter((r) => !r.isPassing);

  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl,
    representativeRoutesTested: results.length,
    passedRoutes: results.length - failedRoutes.length,
    failedRoutes: failedRoutes.length,
    sitemapRobots,
    results,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`\n[SEO] Kanıt dosyası kaydedildi: ${OUT_FILE}`);

  console.log("\n--- ÖZET RAPOR ---");
  console.log(`Temsilci Rotalar SEO: ${failedRoutes.length === 0 ? "BAŞARILI (Tümü Geçti)" : `${failedRoutes.length} HATA VAR`}`);
  console.log(`Sitemap Bütünlüğü: ${sitemapRobots.sitemapValid ? "BAŞARILI (0 duplicate, 0 private leak)" : "HATA"}`);
  console.log(`Robots.txt Kuralları: ${sitemapRobots.robotsValid ? "BAŞARILI" : "HATA"}`);

  if (failedRoutes.length > 0 || !sitemapRobots.sitemapValid || !sitemapRobots.robotsValid) {
    console.error("\n[SEO FAIL] Adım 7/10 denetiminde çözülmesi gereken eksiklikler bulundu.");
    process.exit(1);
  }

  console.log("\n[SEO PASS] Adım 7/10 SEO ve içerik bütünlüğü kapısı başarıyla geçti.");
}

main().catch((err) => {
  console.error("[SEO ERROR]", err);
  process.exit(1);
});
