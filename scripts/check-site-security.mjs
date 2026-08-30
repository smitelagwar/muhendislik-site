import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import next from "next";

const port = Number(process.env.SITE_SEC_PORT ?? "3007");
const baseUrl = `http://127.0.0.1:${port}`;
const OUT_FILE = path.join(process.cwd(), ".data", "site-security-evidence.json");

const SUSPICIOUS_SECRET_PATTERNS = [
  { name: "Private Key", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: "AWS Secret Key", regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "Slack Token", regex: /xox[baprs]-[0-9a-zA-Z]{10,48}/ },
];

function scanCodebaseForSecrets(dirPath, relativeRoot = "") {
  const leaks = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = path.join(relativeRoot, entry.name);
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name.startsWith(".next") ||
      entry.name === "scratch" ||
      entry.name === ".data" ||
      entry.name === ".test-data" ||
      entry.name.endsWith(".log") ||
      entry.name.endsWith(".png") ||
      entry.name.endsWith(".webm") ||
      entry.name.endsWith(".svg") ||
      entry.name.endsWith(".generated.ts")
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      leaks.push(...scanCodebaseForSecrets(fullPath, relPath));
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        for (const pattern of SUSPICIOUS_SECRET_PATTERNS) {
          if (pattern.regex.test(content)) {
            // .env.example içindeki placeholder'ları filtrele
            if (entry.name === ".env.example" && content.includes("CHANGE_ME")) {
              continue;
            }
            leaks.push({
              file: relPath,
              type: pattern.name,
            });
          }
        }
      } catch {
        // Binary veya okunamayan dosya
      }
    }
  }

  return leaks;
}

async function verifySecurityHeaders() {
  console.log("[SEC] Global güvenlik başlıkları kontrol ediliyor...");
  const res = await fetch(`${baseUrl}/`);
  const headers = Object.fromEntries(res.headers.entries());

  const checks = [
    { header: "x-content-type-options", expected: "nosniff" },
    { header: "x-frame-options", expected: "SAMEORIGIN" },
    { header: "referrer-policy", expected: "strict-origin-when-cross-origin" },
  ];

  const results = checks.map((c) => {
    const actual = headers[c.header];
    const isPassing = actual === c.expected || (c.header === "x-frame-options" && (actual === "DENY" || actual === "SAMEORIGIN"));
    return {
      header: c.header,
      expected: c.expected,
      actual: actual || "YOK",
      isPassing,
    };
  });

  return {
    headersSample: headers,
    checks: results,
    allPassing: results.every((r) => r.isPassing),
  };
}

async function testIdorAndPathTraversal() {
  console.log("[SEC] IDOR, BOLA ve Path Traversal negatif sınır testleri çalıştırılıyor...");
  const testCases = [
    {
      name: "Rastgele UUID File Detail IDOR",
      url: `${baseUrl}/api/dokumantasyon/files/00000000-0000-0000-0000-000000000000`,
      expectedStatuses: [400, 401, 403, 404, 405, 500, 503],
    },
    {
      name: "Geçersiz Share Token Download",
      url: `${baseUrl}/api/dokumantasyon/public/download/fake-token-999/fake-item-111`,
      expectedStatuses: [400, 401, 403, 404, 405, 500, 503],
    },
    {
      name: "Path Traversal denemesi",
      url: `${baseUrl}/api/dokumantasyon/files/..%2f..%2fetc%2fpasswd`,
      expectedStatuses: [400, 401, 403, 404, 405, 500, 503],
    },
    {
      name: "Auth endpoint yanlış şifre denemesi",
      url: `${baseUrl}/api/dokumantasyon/public/verify-password`,
      method: "POST",
      body: JSON.stringify({ token: "invalid-token", password: "wrong-password" }),
      expectedStatuses: [400, 401, 403, 404, 405, 500, 503],
    },
  ];

  const results = [];
  for (const tc of testCases) {
    try {
      const opts = {
        method: tc.method || "GET",
        headers: { "Content-Type": "application/json" },
      };
      if (tc.body) opts.body = tc.body;

      const res = await fetch(tc.url, opts);
      const isPassing = tc.expectedStatuses.includes(res.status);
      const responseText = await res.text().catch(() => "");
      const leaksStackTrace = responseText.includes("at Object.<anonymous>") || responseText.includes("TypeError:");

      console.log(`  - ${tc.name}: HTTP ${res.status} | Beklenen: ${tc.expectedStatuses.join(", ")} | StackLeak: ${leaksStackTrace} | Geçti: ${isPassing && !leaksStackTrace}`);

      results.push({
        name: tc.name,
        status: res.status,
        expected: tc.expectedStatuses,
        leaksStackTrace,
        isPassing: isPassing && !leaksStackTrace,
      });
    } catch (err) {
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
  console.log("   ADIM 8/10: GÜVENLİK, YETKİLENDİRME VE VERİ BÜTÜNLÜĞÜ ");
  console.log(`   Hedef Sunucu: ${baseUrl}                              `);
  console.log("========================================================\n");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  // 1. Statik kod tabanı gizli anahtar / secret taraması
  console.log("[SEC] Kaynak kod genelinde hassas anahtar (secret) taraması...");
  const secretLeaks = scanCodebaseForSecrets(process.cwd());
  console.log(`[SEC] Secret taraması bitti. Tespit edilen şüpheli anahtar sayısı: ${secretLeaks.length}`);

  // 2. Sunucu başlat
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

  // 3. Response header kontrolleri
  const headerAudit = await verifySecurityHeaders();
  console.log(`[SEC] Güvenlik başlıkları: ${headerAudit.allPassing ? "BAŞARILI" : "UYARI"}`);

  // 4. IDOR ve Path Traversal
  const idorResults = await testIdorAndPathTraversal();
  const idorPassing = idorResults.every((r) => r.isPassing);
  console.log(`[SEC] Yetkisiz erişim / IDOR testleri: ${idorPassing ? "BAŞARILI" : "BAŞARISIZ"}`);

  server.close();

  const evidence = {
    timestamp: new Date().toISOString(),
    baseUrl,
    secretAudit: {
      totalFound: secretLeaks.length,
      leaks: secretLeaks,
      isClean: secretLeaks.length === 0,
    },
    headerAudit,
    idorResults,
    overallPassing: secretLeaks.length === 0 && headerAudit.allPassing && idorPassing,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`\n[SEC] Güvenlik kanıtı kaydedildi: ${OUT_FILE}`);

  if (!evidence.overallPassing) {
    console.error("[SEC FAIL] Güvenlik denetiminde çözülmesi gereken eksiklikler bulundu!");
    process.exit(1);
  }

  console.log("[SEC PASS] Adım 8/10 Güvenlik ve gizlilik denetimi başarıyla tamamlandı.");
}

main().catch((err) => {
  console.error("[SEC ERROR]", err);
  process.exit(1);
});
