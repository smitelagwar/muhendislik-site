import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import next from "next";

const port = Number(process.env.SITE_RESILIENCE_PORT ?? "3008");
const baseUrl = `http://127.0.0.1:${port}`;
const OUT_FILE = path.join(process.cwd(), ".data", "site-resilience-evidence.json");

async function testFaultInjection() {
  console.log("[RESILIENCE] Hata toleransı ve dayanıklılık sınır testleri...");

  const testCases = [
    {
      name: "Bozuk JSON Payload (Syntax Error)",
      url: `${baseUrl}/api/dokumantasyon/public/verify-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid_json: ,,,",
      expectedStatuses: [400, 422, 500, 503],
    },
    {
      name: "Eksik Gövde (Empty Body POST)",
      url: `${baseUrl}/api/dokumantasyon/public/verify-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
      expectedStatuses: [400, 422, 500, 503],
    },
    {
      name: "Aşırı Büyük Payload (Body Limit)",
      url: `${baseUrl}/api/dokumantasyon/public/verify-password`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hugeData: "A".repeat(500_000) }),
      expectedStatuses: [400, 413, 422, 500, 503],
    },
    {
      name: "Geçersiz HTTP Metodu (/api/search PUT)",
      url: `${baseUrl}/api/search`,
      method: "PUT",
      expectedStatuses: [405, 404, 400],
    },
    {
      name: "Olmayan API Uç Noktası (404 Not Found)",
      url: `${baseUrl}/api/non-existent-endpoint-test-404`,
      method: "GET",
      expectedStatuses: [404],
    },
    {
      name: "Kayıp Rota (HTML 404 Sayfası)",
      url: `${baseUrl}/kesinlikle-olmayan-sayfa-404-kontrol`,
      method: "GET",
      expectedStatuses: [404],
    },
  ];

  const results = [];

  for (const tc of testCases) {
    try {
      const opts = {
        method: tc.method || "GET",
        headers: tc.headers || {},
      };
      if (tc.body !== undefined) opts.body = tc.body;

      const res = await fetch(tc.url, opts);
      const isPassing = tc.expectedStatuses.includes(res.status);
      const body = await res.text().catch(() => "");
      const leaksStack = body.includes("at Object.<anonymous>") || body.includes("webpack-internal://");

      console.log(`  - ${tc.name}: HTTP ${res.status} | Beklenen: ${tc.expectedStatuses.join(", ")} | StackLeak: ${leaksStack} | Geçti: ${isPassing && !leaksStack}`);

      results.push({
        name: tc.name,
        status: res.status,
        expected: tc.expectedStatuses,
        leaksStack,
        isPassing: isPassing && !leaksStack,
      });
    } catch (err) {
      console.log(`  - ${tc.name}: Hata fırlattı: ${err.message}`);
      results.push({
        name: tc.name,
        error: String(err),
        isPassing: false,
      });
    }
  }

  return results;
}

async function main() {
  console.log("========================================================");
  console.log("   ADIM 9/10: STABİLİTE, HATA TOLERANSI VE GÖZLEMLENEBİLİRLİK");
  console.log(`   Hedef Sunucu: ${baseUrl}                                `);
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

  const injectionResults = await testFaultInjection();

  server.close();

  const allPassed = injectionResults.every((r) => r.isPassing);

  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl,
    totalTests: injectionResults.length,
    passedCount: injectionResults.filter((r) => r.isPassing).length,
    allPassed,
    results: injectionResults,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`\n[RESILIENCE] Kanıt kaydedildi: ${OUT_FILE}`);

  if (!allPassed) {
    console.error("[RESILIENCE FAIL] Bazı hata enjeksiyon senaryoları başarısız oldu!");
    process.exit(1);
  }

  console.log("[RESILIENCE PASS] Adım 9/10 Hata toleransı ve stabilite kapısı başarıyla tamamlandı.");
}

main().catch((err) => {
  console.error("[RESILIENCE ERROR]", err);
  process.exit(1);
});
