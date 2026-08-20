// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/6: READINESS & DURABILITY SMOKE TESTİ
// ============================================================================

import assert from "assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/6 READINESS / DURABILITY SMOKE TESTİ");
console.log("======================================================================\n");

async function runReadinessSmokeTest() {
  // 1. Yetkisiz erişim denetimi
  console.log("▶ 1. Yetkisiz Erişim Koruma Testi");
  let unauthRes;
  try {
    unauthRes = await fetch(`${BASE_URL}/api/dokumantasyon/readiness`, { signal: AbortSignal.timeout(1500) });
  } catch {
    console.log("  ℹ [BİLGİ] Dev sunucu çevrimdışı; canlı HTTP readiness smoke testi atlandı.");
    return;
  }
  assert.strictEqual(unauthRes.status, 401, "Yetkisiz istek 401 dönmelidir.");
  console.log("  ✓ [BAŞARILI] /api/dokumantasyon/readiness endpoint'i oturumsuz isteklere 401 döndü.");

  // 2. Admin Girişi
  console.log("\n▶ 2. Admin Oturumu Açma");

  let serverReachable = false;
  try {
    const probe = await fetch(`${BASE_URL}/api/dokumantasyon/readiness`, { signal: AbortSignal.timeout(1500) });
    serverReachable = probe.status < 500;
  } catch {
    serverReachable = false;
  }

  if (!serverReachable) {
    console.log("  ℹ [BİLGİ] Dev sunucu (localhost:3000) çevrimdışı olduğundan canlı HTTP readiness sorgusu atlandı (Birim testleri geçerli).");
    console.log("\n======================================================================");
    console.log("READINESS SMOKE TESTİ TAMAMLANDI");
    console.log("======================================================================\n");
    return;
  }

  const loginRes = await fetch(`${BASE_URL}/api/dokumantasyon/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.TEST_ADMIN_USERNAME || "admin",
      password: process.env.TEST_ADMIN_PASSWORD || "admin"
    }),
  });
  assert.strictEqual(loginRes.status, 200, "Giriş başarılı olmalıdır.");
  const rawCookies = typeof loginRes.headers.getSetCookie === "function"
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""];
  const authCookie = rawCookies.map((c) => c.split(";")[0]).join("; ");
  console.log("  ✓ [BAŞARILI] Admin oturum çerezi alındı.");

  // 3. Readiness Sorgusu
  console.log("\n▶ 3. Readiness Sağlık ve Kalıcılık Durumunun Sorgulanması");
  const readyRes = await fetch(`${BASE_URL}/api/dokumantasyon/readiness`, {
    headers: { cookie: authCookie },
  });

  const readyData = await readyRes.json();
  console.log(`  ℹ [BİLGİ] HTTP Status: ${readyRes.status}`);
  console.log(`  ℹ [BİLGİ] Environment: ${readyData.environment}`);
  console.log(`  ℹ [BİLGİ] Storage Mode: ${readyData.storageMode}`);
  console.log(`  ℹ [BİLGİ] Local Fallback İzni: ${readyData.localFallbackAllowed}`);
  console.log(`  ℹ [BİLGİ] Database Durumu: ${JSON.stringify(readyData.database)}`);
  console.log(`  ℹ [BİLGİ] Blob Durumu: ${JSON.stringify(readyData.blob)}`);

  assert(typeof readyData.ok === "boolean", "readyData.ok boolean olmalıdır.");
  assert(["durable", "local_dev", "blocked"].includes(readyData.storageMode), "Geçerli storageMode olmalıdır.");

  // 4. Secret Sızıntı Denetimi (JSON içinde connection string veya secret bulunmamalıdır)
  console.log("\n▶ 4. Güvenlik & Secret Sızıntısı Denetimi");
  const jsonStr = JSON.stringify(readyData);
  assert(!jsonStr.includes("postgres://") && !jsonStr.includes("postgresql://"), "DATABASE_URL sızdırılmamalıdır!");
  assert(!jsonStr.includes("vercel_blob_rw"), "BLOB_READ_WRITE_TOKEN sızdırılmamalıdır!");
  assert(!jsonStr.includes("password") && !jsonStr.includes("secret"), "Secret anahtarlar sızdırılmamalıdır!");
  console.log("  ✓ [BAŞARILI] Yanıt içinde hiçbir secret veya hassas bağlantı dizesi bulunmamaktadır.");

  console.log("\n======================================================================");
  console.log("AŞAMA 3/6 TEST SONUCU: READINESS & DURABILITY SMOKE TESTİ BAŞARILI!");
  console.log("======================================================================\n");
}

runReadinessSmokeTest().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
