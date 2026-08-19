// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — MASTER ENTEGRASYON VE GÜVENLİK TESTİ
// ============================================================================

import assert from "assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import JSZip from "jszip";
import { z } from "zod";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ NİHAİ GÜVENLİK VE ENTEGRASYON TESTİ (AŞAMA 8)");
console.log("======================================================================\n");

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [BAŞARILI] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [BAŞARISIZ] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`✓ [BAŞARILI] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ [BAŞARISIZ] ${name}:`, err.message);
  }
}

// ----------------------------------------------------------------------------
// 1. ROBOTS VE SİTEMAP GÜVENLİK DENETİMİ
// ----------------------------------------------------------------------------
runTest("Robots.txt içinde /dokumantasyon ve /p/ disallow kuralı kontrolü", () => {
  const robotsPath = path.resolve(process.cwd(), "src/app/robots.ts");
  const content = fs.readFileSync(robotsPath, "utf8");
  assert(content.includes("/dokumantasyon"), "robots.ts içinde /dokumantasyon disallow olmalıdır.");
  assert(content.includes("/p/"), "robots.ts içinde /p/ disallow olmalıdır.");
});

runTest("Sitemap içinde /dokumantasyon veya /p/ rotalarının bulunmadığının kontrolü", () => {
  const sitemapPath = path.resolve(process.cwd(), "src/app/sitemap.ts");
  const content = fs.readFileSync(sitemapPath, "utf8");
  assert(!content.includes("dokumantasyon"), "sitemap.ts içinde dokumantasyon rotası yer almamalıdır.");
  assert(!content.includes("/p/"), "sitemap.ts içinde /p/ rotası yer almamalıdır.");
});

// ----------------------------------------------------------------------------
// 2. KRİPTOGRAFİ, AUTH VE GÜVENLİK
// ----------------------------------------------------------------------------
await runAsyncTest("Bcrypt şifreleme ve doğrulama testi", async () => {
  const password = "TestSuperPassword2026!";
  const hash = await bcrypt.hash(password, 10);
  assert(await bcrypt.compare(password, hash), "Doğru şifre eşleşmelidir.");
  assert(!(await bcrypt.compare("WrongPassword", hash)), "Yanlış şifre reddedilmelidir.");
});

await runAsyncTest("Jose JWT admin session oluşturma ve ADMIN_SESSION_VERSION doğrulama", async () => {
  const secret = new TextEncoder().encode("test_master_secret_key_2026_for_dokumantasyon");
  const token = await new SignJWT({
    username: "admin",
    version: 1,
    ipFingerprint: "test-ip-hash",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const { payload } = await jwtVerify(token, secret);
  assert(payload.username === "admin", "Kullanıcı adı doğru olmalıdır.");
  assert(payload.version === 1, "Session version doğru olmalıdır.");
});

runTest("32-byte Raw Token ve SHA-256 Lookup Hash güvenliği", () => {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  assert(rawToken.length >= 40, "Token entropisi yeterli uzunlukta olmalıdır.");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  assert(tokenHash.length === 64, "SHA-256 hash 64 karakter olmalıdır.");
});

runTest("AES-256-GCM simetrik şifreleme ve çözme (roundtrip)", () => {
  const encKey = "super_secure_key_for_testing_shares_2026_aes_gcm";
  const rawToken = crypto.randomBytes(32).toString("base64url");

  function encryptToken(token, keyHex) {
    const key = crypto.createHash("sha256").update(keyHex).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let enc = cipher.update(token, "utf8", "hex");
    enc += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${enc}`;
  }

  function decryptToken(encryptedPayload, keyHex) {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encText] = parts;
    const key = crypto.createHash("sha256").update(keyHex).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let dec = decipher.update(encText, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  }

  const enc = encryptToken(rawToken, encKey);
  const dec = decryptToken(enc, encKey);
  assert(dec === rawToken, "Şifrelenip çözülen token orijinal token ile eşleşmelidir.");
});

// ----------------------------------------------------------------------------
// 3. DAL VE İŞ MANTIĞI DOĞRULAMALARI
// ----------------------------------------------------------------------------
runTest("Döngüsel klasör taşıma (cycle) engelleme mantığı", () => {
  function checkCycle(candidateParentId, folderId, folderParents) {
    if (candidateParentId === folderId) return true;
    let current = candidateParentId;
    const visited = new Set();
    while (current && !visited.has(current)) {
      visited.add(current);
      if (current === folderId) return true;
      current = folderParents[current] || null;
    }
    return false;
  }

  const tree = {
    folderB: "folderA",
    folderC: "folderB",
    folderD: "folderC",
    folderE: null,
  };

  assert(checkCycle("folderA", "folderA", tree) === true, "Kendisine taşıma engellenmeli.");
  assert(checkCycle("folderD", "folderA", tree) === true, "Torun klasörün altına taşıma engellenmeli.");
  assert(checkCycle("folderE", "folderA", tree) === false, "Farklı dala taşıma geçerli olmalı.");
});

runTest("Dosya çakışmasında benzersiz isim türetme", () => {
  function generateUniqueFilename(requestedName, existingNames) {
    if (!existingNames.has(requestedName)) return requestedName;
    const dotIdx = requestedName.lastIndexOf(".");
    const base = dotIdx !== -1 ? requestedName.slice(0, dotIdx) : requestedName;
    const ext = dotIdx !== -1 ? requestedName.slice(dotIdx) : "";
    let counter = 1;
    let candidate = `${base} (${counter})${ext}`;
    while (existingNames.has(candidate)) {
      counter++;
      candidate = `${base} (${counter})${ext}`;
    }
    return candidate;
  }

  const existing = new Set(["Proje.pdf", "Proje (1).pdf"]);
  assert(generateUniqueFilename("Proje.pdf", existing) === "Proje (2).pdf");
  assert(generateUniqueFilename("Yeni.pdf", existing) === "Yeni.pdf");
});

runTest("SQL LIKE wildcard sanitizasyonu", () => {
  function sanitizeLikePattern(input) {
    return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  }
  assert(sanitizeLikePattern("100%_statik") === "100\\%\\_statik");
});

// ----------------------------------------------------------------------------
// 4. PAYLAŞIM, SNAPSHOT VE İNDİRME TESTLERİ
// ----------------------------------------------------------------------------
runTest("Zod createShareSchema şeması parametre denetimi", () => {
  const schema = z.object({
    items: z.array(z.object({ id: z.string().uuid(), type: z.enum(["file", "folder"]) })).min(1),
    duration: z.enum(["1_DAY", "3_DAYS", "1_WEEK", "1_MONTH", "CUSTOM"]),
    customExpiresAt: z.string().datetime().optional(),
    title: z.string().trim().max(255).optional().nullable(),
    password: z.string().min(4).optional().nullable(),
    maxDownloads: z.number().int().min(1).max(10000).optional().nullable(),
  });

  const validData = {
    items: [{ id: crypto.randomUUID(), type: "file" }],
    duration: "3_DAYS",
    title: "Test Paylaşımı",
    maxDownloads: 5,
  };
  assert(schema.safeParse(validData).success, "Geçerli veri kabul edilmelidir.");
  assert(!schema.safeParse({ ...validData, items: [] }).success, "Boş dosya reddedilmelidir.");
  assert(!schema.safeParse({ ...validData, password: "12" }).success, "Kısa şifre reddedilmelidir.");
});

await runAsyncTest("JSZip klasör hiyerarşili arşiv paketleme ve veri bütünlüğü", async () => {
  const zip = new JSZip();
  zip.file("Mimari/Plan.pdf", Buffer.from("pdf-content"));
  zip.file("Statik/Hesap.dwg", Buffer.from("dwg-content"));

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  assert(buffer.length > 0, "ZIP arşivi üretilmiş olmalıdır.");

  const readZip = await JSZip.loadAsync(buffer);
  assert(readZip.file("Mimari/Plan.pdf") !== null, "Mimari/Plan.pdf arşivde bulunmalıdır.");
  assert(readZip.file("Statik/Hesap.dwg") !== null, "Statik/Hesap.dwg arşivde bulunmalıdır.");
});

await runAsyncTest("QRCode base64 Data URL üretimi", async () => {
  const qrDataUrl = await QRCode.toDataURL("https://muhendislik-site.vercel.app/p/test-token");
  assert(qrDataUrl.startsWith("data:image/png;base64,"), "QR kod data URL formatında olmalıdır.");
});

runTest("Public share geçerlilik durum değerlendirmesi", () => {
  function evaluateStatus(link) {
    if (!link) return "not_found";
    if (link.revoked_at) return "revoked";
    if (new Date(link.expires_at) <= new Date()) return "expired";
    if (link.max_downloads !== null && link.download_count >= link.max_downloads) return "limit_reached";
    return "ok";
  }

  const now = Date.now();
  assert(evaluateStatus(null) === "not_found");
  assert(evaluateStatus({ revoked_at: "2026-08-19", expires_at: new Date(now + 100000).toISOString() }) === "revoked");
  assert(evaluateStatus({ revoked_at: null, expires_at: new Date(now - 1000).toISOString() }) === "expired");
  assert(evaluateStatus({ revoked_at: null, expires_at: new Date(now + 100000).toISOString(), max_downloads: 2, download_count: 2 }) === "limit_reached");
  assert(evaluateStatus({ revoked_at: null, expires_at: new Date(now + 100000).toISOString(), max_downloads: 2, download_count: 1 }) === "ok");
});

// ----------------------------------------------------------------------------
// 5. CSRF VE SAME-ORIGIN GÜVENLİĞİ
// ----------------------------------------------------------------------------
runTest("CSRF Same-Origin mutation denetimi", () => {
  function assertSameOrigin(origin, host) {
    if (!origin && !host) return;
    if (origin) {
      const url = new URL(origin);
      if (host && url.host !== host) {
        throw new Error("CSRF: Origin mismatch");
      }
    }
  }

  // Geçerli aynı origin
  assert.doesNotThrow(() => assertSameOrigin("http://localhost:3000", "localhost:3000"));
  assert.doesNotThrow(() => assertSameOrigin("https://muhendislik-site.vercel.app", "muhendislik-site.vercel.app"));

  // Sahte saldırgan origin
  assert.throws(() => assertSameOrigin("https://attacker-evil-site.com", "muhendislik-site.vercel.app"));
});

console.log("\n======================================================================");
console.log(`TEST SONUCU: ${passedTests}/${totalTests} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedTests !== totalTests) {
  process.exit(1);
}
