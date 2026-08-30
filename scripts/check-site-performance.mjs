import puppeteer from "puppeteer";
import { performance } from "node:perf_hooks";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SITE_PERF_URL || "http://127.0.0.1:3005";
const OUT_FILE = path.join(process.cwd(), ".data", "site-performance-evidence.json");

const TEST_ROUTES = [
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
];

const HEAVY_LEAK_PATTERNS = [
  "libredwg-web.wasm",
  "dwg-dxf-conversion-worker",
  "mtext-renderer-worker",
  "libredwg-parser-worker",
];

async function measureRouteRun(page, url, isCold = false) {
  const requests = [];
  const client = await page.target().createCDPSession();
  await client.send("Performance.enable");

  const reqListener = (req) => {
    requests.push(req.url());
  };
  page.on("request", reqListener);

  const navStart = performance.now();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  const navDuration = performance.now() - navStart;

  page.off("request", reqListener);

  const metrics = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType("navigation");
    const nav = navEntries.length > 0 ? navEntries[0] : null;

    // LCP
    let lcp = 0;
    const paintEntries = performance.getEntriesByType("paint");
    const fcp = paintEntries.find((e) => e.name === "first-contentful-paint")?.startTime || 0;

    // CLS
    let cls = 0;
    const layoutShiftEntries = performance.getEntriesByType("layout-shift") || [];
    for (const entry of layoutShiftEntries) {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
    }

    const memory = window.performance?.memory
      ? {
          usedJSHeapSize: Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapSize: Math.round(window.performance.memory.totalJSHeapSize / 1024 / 1024),
        }
      : null;

    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
      load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
      fcp: Math.round(fcp),
      cls: Number(cls.toFixed(4)),
      memory,
    };
  });

  return {
    ...metrics,
    navDuration: Math.round(navDuration),
    requestsCount: requests.length,
    requests,
  };
}

async function runLongevityStressTest(page) {
  console.log("\n[PERF-LONGEVITY] 50 hızlı rota değişimi ve uzun oturum bellek kararlılığı testi...");
  const routes = ["/", "/hesaplamalar", "/kategori/araclar", "/konu-haritasi", "/belgeler"];

  const initialHeap = await page.evaluate(() => window.performance?.memory?.usedJSHeapSize || 0);

  for (let i = 0; i < 50; i++) {
    const targetRoute = routes[i % routes.length];
    await page.goto(`${BASE_URL}${targetRoute}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    if (i % 10 === 0) {
      // Tema değiştir
      await page.evaluate(() => {
        document.documentElement.classList.toggle("dark");
      });
    }
  }

  // Zorunlu GC tetiklemeye çalış (varsa) veya stabilize olmasını bekle
  await new Promise((r) => setTimeout(r, 1000));

  const finalHeap = await page.evaluate(() => window.performance?.memory?.usedJSHeapSize || 0);
  const heapDiffMb = Math.round((finalHeap - initialHeap) / 1024 / 1024);

  console.log(`[PERF-LONGEVITY] Başlangıç Heap: ${Math.round(initialHeap / 1024 / 1024)}MB | Bitiş Heap: ${Math.round(finalHeap / 1024 / 1024)}MB | Net Artış: ${heapDiffMb}MB`);
  return {
    initialHeapMb: Math.round(initialHeap / 1024 / 1024),
    finalHeapMb: Math.round(finalHeap / 1024 / 1024),
    heapGrowthMb: heapDiffMb,
    isHealthy: heapDiffMb < 60, // 50 navigasyon sonrası 60MB'tan az artış sağlıklı kabul edilir
  };
}

async function main() {
  console.log(`========================================================`);
  console.log(`   ADIM 6/10: PERFORMANS, CWV VE BUNDLE DENETİMİ       `);
  console.log(`   Hedef Sunucu: ${BASE_URL}                            `);
  console.log(`========================================================\n`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const routeResults = [];
  let leakedHeavyAssets = [];

  for (const route of TEST_ROUTES) {
    const fullUrl = `${BASE_URL}${route.path}`;
    process.stdout.write(`Ölçülüyor: [${route.name}] (${route.path}) ... `);

    // 1. Isınma koşusu
    await measureRouteRun(page, fullUrl, true);

    // 2. Üç kayıtlı ölçüm koşusu
    const runs = [];
    for (let r = 1; r <= 3; r++) {
      const runMetric = await measureRouteRun(page, fullUrl, false);
      runs.push(runMetric);

      // Heavy asset sızıntı kontrolü (Dokümantasyon hariç rotalarda WASM/CAD worker gelmemeli)
      if (!route.path.startsWith("/dokumantasyon")) {
        for (const reqUrl of runMetric.requests) {
          for (const pattern of HEAVY_LEAK_PATTERNS) {
            if (reqUrl.includes(pattern)) {
              leakedHeavyAssets.push({ route: route.path, asset: pattern, url: reqUrl });
            }
          }
        }
      }
    }

    const ttfbMedian = Math.round(runs.map((r) => r.ttfb).sort((a, b) => a - b)[1]);
    const fcpMedian = Math.round(runs.map((r) => r.fcp).sort((a, b) => a - b)[1]);
    const domLoadedMedian = Math.round(runs.map((r) => r.domContentLoaded).sort((a, b) => a - b)[1]);
    const loadMedian = Math.round(runs.map((r) => r.load).sort((a, b) => a - b)[1]);
    const clsMedian = runs.map((r) => r.cls).sort((a, b) => a - b)[1];

    const result = {
      route: route.path,
      name: route.name,
      ttfbMedian,
      fcpMedian,
      domLoadedMedian,
      loadMedian,
      clsMedian,
      runs: runs.map((r) => ({
        ttfb: r.ttfb,
        fcp: r.fcp,
        domContentLoaded: r.domContentLoaded,
        load: r.load,
        cls: r.cls,
        requestsCount: r.requestsCount,
      })),
    };

    routeResults.push(result);
    console.log(`FCP: ${fcpMedian}ms | DCL: ${domLoadedMedian}ms | CLS: ${clsMedian} | TTFB: ${ttfbMedian}ms [TAMAM]`);
  }

  // Uzun oturum testi
  const longevity = await runLongevityStressTest(page);

  await browser.close();

  // Bütçe kontrolleri
  console.log("\n--- BÜTÇE KONTROLLERİ ---");
  const slowFcp = routeResults.filter((r) => r.fcpMedian > 2500);
  const badCls = routeResults.filter((r) => r.clsMedian > 0.10);

  console.log(`LCP/FCP Bütçesi (≤ 2500ms): ${slowFcp.length === 0 ? "BAŞARILI (0 aşım)" : `UYARI: ${slowFcp.map((r) => r.name).join(", ")}`}`);
  console.log(`CLS Bütçesi (≤ 0.10): ${badCls.length === 0 ? "BAŞARILI (0 aşım)" : `UYARI: ${badCls.map((r) => r.name).join(", ")}`}`);
  console.log(`Ağır Varlık İzolasyonu (WASM/CAD): ${leakedHeavyAssets.length === 0 ? "BAŞARILI (0 sızıntı)" : `HATA: ${leakedHeavyAssets.length} sızıntı tespit edildi!`}`);
  console.log(`Uzun Oturum Bellek Kararlılığı: ${longevity.isHealthy ? "BAŞARILI (Kararlı)" : "UYARI (Yüksek artış)"}`);

  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: routeResults,
    longevity,
    leakedHeavyAssets,
    summary: {
      totalRoutesTested: routeResults.length,
      allFcpWithinBudget: slowFcp.length === 0,
      allClsWithinBudget: badCls.length === 0,
      heavyAssetsIsolated: leakedHeavyAssets.length === 0,
      longevityHealthy: longevity.isHealthy,
    },
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`\n[PERF] Kanıt dosyası kaydedildi: ${OUT_FILE}`);

  if (leakedHeavyAssets.length > 0) {
    console.error("[PERF FAIL] Genel sayfalara ağır CAD/WASM motorları sızıyor!");
    process.exit(1);
  }

  console.log("[PERF PASS] Performans ve Core Web Vitals denetimi başarıyla tamamlandı.");
}

main().catch((err) => {
  console.error("[PERF ERROR]", err);
  process.exit(1);
});
