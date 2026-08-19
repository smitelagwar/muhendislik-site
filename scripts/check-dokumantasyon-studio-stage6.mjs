// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/8 PUBLIC PAYLAŞIM VE SNAPSHOT ÖNİZLEME TESTİ
// ============================================================================

import assert from "node:assert";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
process.env.NODE_ENV = "test";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/8 PUBLIC PAYLAŞIM VE SNAPSHOT TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage6Tests() {
  const localStoreModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/local-store.ts")).href
  );
  const sharesModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/shares.ts")).href
  );
  const versionsModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/versions.ts")).href
  );
  const publicShareModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/public-share.ts")).href
  );

  // -------------------------------------------------------------------
  // TEST 1: Public Snapshot İzolasyonu ve Sürüm Değişmezliği
  // -------------------------------------------------------------------
  logStep("TEST 1: Public Paylaşımda Versiyon Snapshot İzolasyonu");

  const db = localStoreModule.readLocalDb();
  const fileId = crypto.randomUUID();
  const fileName = "mimari_kesit_detay.txt";
  const initialText = "MİMARİ PROJE AŞAMA 1 — ONAYLI TASLAK";

  const storageDir = localStoreModule.getLocalStorageDir();
  const v1Path = path.join(storageDir, `${fileId}_v1.txt`);
  fs.writeFileSync(v1Path, Buffer.from(initialText, "utf-8"));

  db.files.push({
    id: fileId,
    folder_id: null,
    display_name: fileName,
    blob_pathname: `dok_storage/${fileId}_v1.txt`,
    blob_url: `/api/dokumantasyon/files/${fileId}/access`,
    size_bytes: Buffer.byteLength(initialText),
    mime_type: "text/plain",
    extension: ".txt",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    current_version_number: 1,
  });
  localStoreModule.writeLocalDb(db);

  // v1 için snapshot linki oluştur
  const share = await sharesModule.createShareLink({
    items: [{ id: fileId, type: "file" }],
    duration: "1_DAY",
    title: "Mimari Kesit v1 Paylaşımı",
  });

  // Dosyayı admin tarafında v2'ye güncelle
  const v2Text = "MİMARİ PROJE AŞAMA 2 — REVİZE EDİLMİŞ NİHAİ ÇİZİM";
  await versionsModule.createNewFileVersion({
    fileId,
    contentBuffer: Buffer.from(v2Text, "utf-8"),
    mimeType: "text/plain",
    comment: "v2 revizyonu yapıldı",
  });

  // Public paylaşım bilgilerini sorgula
  const publicInfo = await publicShareModule.getPublicShareInfo(share.rawToken);
  assert.strictEqual(publicInfo.status, "ok", "Public paylaşım durumu 'ok' olmalıdır.");
  assert.strictEqual(publicInfo.items?.length, 1, "1 adet snapshot öğesi dönmelidir.");

  const item = publicInfo.items[0];
  assert(item.file_version_id, "Snapshot öğesinde file_version_id kilitli olmalıdır.");

  // Disk üzerindeki snapshot dosyasını oku
  const freshDb = localStoreModule.readLocalDb();
  const ver = freshDb.file_versions?.find((v) => v.id === item.file_version_id);
  assert(ver, "Kilitlenen versiyon kaydı bulunmalıdır.");
  assert.strictEqual(ver.version_number, 1, "Snapshot v1'e işaret etmelidir.");

  const snapshotFileOnDisk = path.join(
    storageDir,
    path.basename(ver.blob_pathname)
  );
  const readContent = fs.readFileSync(snapshotFileOnDisk, "utf-8");
  assert.strictEqual(
    readContent,
    initialText,
    "Public kullanıcı v2 yerine orijinal v1 snapshot içeriğini okumalıdır."
  );

  logSuccess("Public snapshot değişmezliği (v1 içeriği korunması) %100 doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: Public Preview Header'ları ve Güvenlik İzolasyonu
  // -------------------------------------------------------------------
  logStep("TEST 2: Public Preview ve İndirme Güvenlik Başlıkları");

  const downloadRoutePath = path.join(
    ROOT,
    "src/app/api/dokumantasyon/public/download/[token]/[itemId]/route.ts"
  );
  assert(fs.existsSync(downloadRoutePath), "Public download route mevcut olmalıdır.");
  const routeContent = fs.readFileSync(downloadRoutePath, "utf-8");

  assert(
    routeContent.includes('responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");'),
    "Public önizleme rotası noindex ve nofollow güvenlik başlığını zorunlu kılmalıdır."
  );
  assert(
    routeContent.includes('responseHeaders.set("Referrer-Policy", "no-referrer");'),
    "Public önizleme rotası no-referrer başlığını zorunlu kılmalıdır."
  );
  assert(
    routeContent.includes('responseHeaders.set("X-Content-Type-Options", "nosniff");'),
    "Public önizleme rotası nosniff başlığını zorunlu kılmalıdır."
  );
  assert(
    routeContent.includes('isInline ? "inline" : "attachment"'),
    "Önizleme durumunda Content-Disposition inline olmalıdır."
  );

  logSuccess("Public preview başlıkları (noindex, no-referrer, nosniff, inline) doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Şifreli ve Süresi Dolan Linklerin Korunması
  // -------------------------------------------------------------------
  logStep("TEST 3: Şifreli ve Süresi Dolan Linklerde Yetkisiz Erişim Engeli");

  // Şifreli link oluştur
  const passShare = await sharesModule.createShareLink({
    items: [{ id: fileId, type: "file" }],
    duration: "1_DAY",
    title: "Şifreli Paylaşım",
    password: "GucluSifre123!",
  });

  const passInfo = await publicShareModule.getPublicShareInfo(passShare.rawToken);
  assert.strictEqual(passInfo.requiresPassword, true, "requiresPassword true olmalıdır.");

  // Geçersiz JWT ile doğrulama başarısız olmalı
  const isAuth = await publicShareModule.verifyShareAccessJwt("invalid_jwt_token", passShare.shareLink.id);
  assert.strictEqual(isAuth, false, "Sahte token şifreli linki açamamalıdır.");

  // Süresi dolmuş link testi
  const expDb = localStoreModule.readLocalDb();
  const expLink = expDb.shares.find((s) => s.id === passShare.shareLink.id);
  if (expLink) {
    expLink.expires_at = new Date(Date.now() - 100000).toISOString();
    localStoreModule.writeLocalDb(expDb);
  }

  const expInfo = await publicShareModule.getPublicShareInfo(passShare.rawToken);
  assert.strictEqual(expInfo.status, "expired", "Süresi geçmiş link expired durumu vermelidir.");

  logSuccess("Şifreli ve süresi dolmuş link güvenlik kontrolleri doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Salt-Okunur Public UI İzolasyonu
  // -------------------------------------------------------------------
  logStep("TEST 4: Public Önizleme Modalı Salt-Okunur İzolasyonu");

  const modalPath = path.join(
    ROOT,
    "src/components/dokumantasyon/public/public-preview-modal.tsx"
  );
  assert(fs.existsSync(modalPath), "public-preview-modal.tsx mevcut olmalıdır.");
  const modalContent = fs.readFileSync(modalPath, "utf-8");

  assert(
    !modalContent.includes("onContentChange"),
    "Public önizleme modalı canlı düzenleme (onContentChange) prop'unu içermemelidir."
  );
  assert(
    !modalContent.includes("studio.save"),
    "Public önizleme modalı sürüm kaydetme komutunu içermemelidir."
  );
  assert(
    !modalContent.includes("studio.delete"),
    "Public önizleme modalı silme komutunu içermemelidir."
  );

  logSuccess("Public arayüzün salt-okunur (read-only) izolasyonu doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 6/8 TEST SONUCU: PUBLIC PAYLAŞIM VE SNAPSHOT TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage6Tests().catch((err) => {
  console.error("\n❌ AŞAMA 6/8 DOĞRULAMA HATASI:", err);
  process.exit(1);
});
