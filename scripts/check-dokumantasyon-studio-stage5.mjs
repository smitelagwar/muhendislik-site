// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/8 VERSİYONLAMA VE EDİTÖR DOĞRULAMA TESTİ
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
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/8 VERSİYONLAMA VE EDİTÖR DOĞRULAMA");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage5Tests() {
  // -------------------------------------------------------------------
  // TEST 1: Migration 003 ve Şema Versiyonu Doğrulaması
  // -------------------------------------------------------------------
  logStep("TEST 1: Migration 003 ve dok_file_versions Şema Bütünlüğü");

  const dbPath = path.join(ROOT, "src/lib/dokumantasyon/db.ts");
  assert(fs.existsSync(dbPath), "db.ts mevcut olmalıdır.");
  const dbContent = fs.readFileSync(dbPath, "utf-8");

  assert(
    dbContent.includes('LATEST_REQUIRED_SCHEMA_VERSION = "003"'),
    "db.ts LATEST_REQUIRED_SCHEMA_VERSION '003' olarak tanımlı olmalıdır."
  );
  assert(
    dbContent.includes("CREATE TABLE IF NOT EXISTS dok_file_versions"),
    "db.ts dok_file_versions tablosunu oluşturmalıdır."
  );
  assert(
    dbContent.includes("current_version_number INT NOT NULL DEFAULT 1"),
    "db.ts dok_files.current_version_number alanını eklemelidir."
  );
  assert(
    dbContent.includes("file_version_id UUID NULL REFERENCES dok_file_versions"),
    "db.ts dok_share_items.file_version_id alanını eklemelidir."
  );
  logSuccess("Migration 003 ve tablo şeması tanımları doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: Versiyonlama Servisi (v1, v2, v3, Restore Round-trip)
  // -------------------------------------------------------------------
  logStep("TEST 2: Versioned Save ve Versiyon Geçmişi Servis Testi");

  const versionsServicePath = path.join(ROOT, "src/lib/dokumantasyon/versions.ts");
  assert(fs.existsSync(versionsServicePath), "versions.ts mevcut olmalıdır.");
  const versionsModule = await import(pathToFileURL(versionsServicePath).href);

  const localStorePath = path.join(ROOT, "src/lib/dokumantasyon/local-store.ts");
  const localStoreModule = await import(pathToFileURL(localStorePath).href);

  // Test dosyası oluştur
  const db = localStoreModule.readLocalDb();
  const testFileId = crypto.randomUUID();
  const testFileName = "statik_hesap_raporu.txt";
  const initialContent = "PROJE: KADIKOY KONUT PROJESI\nBETON SINIFI: C30/37\nDEMIR: B420C";

  const storageDir = localStoreModule.getLocalStorageDir();
  const initialFilePath = path.join(storageDir, `${testFileId}_v1.txt`);
  fs.writeFileSync(initialFilePath, Buffer.from(initialContent, "utf-8"));

  db.files.push({
    id: testFileId,
    folder_id: null,
    display_name: testFileName,
    blob_pathname: `dok_storage/${testFileId}_v1.txt`,
    blob_url: `/api/dokumantasyon/files/${testFileId}/access`,
    size_bytes: Buffer.byteLength(initialContent),
    mime_type: "text/plain",
    extension: ".txt",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    current_version_number: 1,
  });
  localStoreModule.writeLocalDb(db);

  // 1. İlk Versiyon Sorgusu (v1 otomatik sentezlenmeli)
  const v1List = await versionsModule.getFileVersions(testFileId);
  assert.strictEqual(v1List.length, 1, "İlk versiyon listesi 1 kayıt içermelidir.");
  assert.strictEqual(v1List[0].version_number, 1, "İlk kayıt v1 olmalıdır.");

  // 2. Yeni Versiyon Kaydet (v2)
  const v2Content = initialContent + "\nKOLON KESITI: 50x50 cm\nKIRIS KESITI: 30x60 cm";
  const v2 = await versionsModule.createNewFileVersion({
    fileId: testFileId,
    contentBuffer: Buffer.from(v2Content, "utf-8"),
    mimeType: "text/plain",
    comment: "Kolon ve kiriş boyutları eklendi",
    username: "muhendis_ali",
  });

  assert.strictEqual(v2.version_number, 2, "Yeni versiyon v2 olmalıdır.");
  assert.strictEqual(v2.size_bytes, Buffer.byteLength(v2Content), "v2 boyutu güncellenmelidir.");

  // 3. Yeni Versiyon Kaydet (v3)
  const v3Content = v2Content + "\nTEMEL TIPI: RADYE TEMEL 70 cm";
  const v3 = await versionsModule.createNewFileVersion({
    fileId: testFileId,
    contentBuffer: Buffer.from(v3Content, "utf-8"),
    mimeType: "text/plain",
    comment: "Temel tipi radye olarak revize edildi",
    username: "muhendis_ali",
  });

  assert.strictEqual(v3.version_number, 3, "Yeni versiyon v3 olmalıdır.");

  // 4. Versiyon Listesini Denetle
  const fullList = await versionsModule.getFileVersions(testFileId);
  assert.strictEqual(fullList.length, 3, "Versiyon listesinde 3 kayıt (v3, v2, v1) bulunmalıdır.");
  assert.strictEqual(fullList[0].version_number, 3);
  assert.strictEqual(fullList[1].version_number, 2);
  assert.strictEqual(fullList[2].version_number, 1);

  // 5. v2 Sürümünü Geri Yükle (v4 üretmeli)
  const v4 = await versionsModule.restoreFileVersion({
    fileId: testFileId,
    versionId: v2.id,
    username: "admin",
  });
  assert.strictEqual(v4.version_number, 4, "Geri yükleme v4 olarak yeni versiyon oluşturmalıdır.");
  assert(v4.comment?.includes("v2"), "Geri yükleme açıklamasında kaynak sürüm belirtilmelidir.");

  logSuccess("Versiyonlama yaşam döngüsü (v1 -> v2 -> v3 -> restore v4) %100 doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Public Share Link Snapshot Kilitlenmesi Testi
  // -------------------------------------------------------------------
  logStep("TEST 3: Paylaşım Linklerinde Versiyon Snapshot Kilitleme Testi");

  const sharesPath = path.join(ROOT, "src/lib/dokumantasyon/shares.ts");
  assert(fs.existsSync(sharesPath), "shares.ts mevcut olmalıdır.");
  const sharesModule = await import(pathToFileURL(sharesPath).href);

  const shareResult = await sharesModule.createShareLink({
    items: [{ id: testFileId, type: "file" }],
    duration: "1_DAY",
    title: "Statik Rapor v4 Paylaşımı",
  });

  assert(shareResult.shareLink.id, "Share link oluşturulmalıdır.");

  const currentDb = localStoreModule.readLocalDb();
  const shareItem = currentDb.share_items.find(
    (si) => si.share_link_id === shareResult.shareLink.id && si.file_id === testFileId
  );
  assert(shareItem, "dok_share_items içinde snapshot kaydı bulunmalıdır.");
  assert.strictEqual(
    shareItem.file_version_id,
    v4.id,
    "Paylaşım oluşturulurken o anki aktif versiyon (v4) snapshot olarak kilitlenmelidir."
  );

  // Dosyayı admin tarafında v5'e güncelle
  await versionsModule.createNewFileVersion({
    fileId: testFileId,
    contentBuffer: Buffer.from("v5 icerigi", "utf-8"),
    mimeType: "text/plain",
    comment: "v5 guncellemesi",
  });

  // Share item'in kilitli versiyonu DEĞİŞMEMELİDİR (Snapshot Immutability)
  const reloadedDb = localStoreModule.readLocalDb();
  const lockedItem = reloadedDb.share_items.find(
    (si) => si.share_link_id === shareResult.shareLink.id && si.file_id === testFileId
  );
  assert.strictEqual(
    lockedItem.file_version_id,
    v4.id,
    "Ana dosya güncellense dahi daha önce üretilen link v4 snapshot'ında kilitli kalmalıdır."
  );

  logSuccess("Snapshot immutability ve link versiyon kilitleme doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Editor & Annotation Capabilities Sözleşmesi
  // -------------------------------------------------------------------
  logStep("TEST 4: Editor ve Annotation Capabilities Sözleşmesi");

  const capsPath = path.join(ROOT, "src/lib/dokumantasyon/studio/capabilities.ts");
  const capsModule = await import(pathToFileURL(capsPath).href);

  const textCaps = capsModule.getStudioCapabilities(".txt", "text");
  assert.strictEqual(textCaps.trueContentEdit, true, "Metin için trueContentEdit aktif olmalıdır.");
  assert.strictEqual(textCaps.versionedSave, true, "Metin için versionedSave aktif olmalıdır.");

  const mdCaps = capsModule.getStudioCapabilities(".md", "markdown");
  assert.strictEqual(mdCaps.trueContentEdit, true, "Markdown için trueContentEdit aktif olmalıdır.");
  assert.strictEqual(mdCaps.versionedSave, true, "Markdown için versionedSave aktif olmalıdır.");

  const pdfCaps = capsModule.getStudioCapabilities(".pdf", "pdf");
  assert.strictEqual(
    pdfCaps.requiresExternalProvider,
    "apryse",
    "PDF anotasyon Apryse harici sağlayıcısı gerektirmelidir."
  );

  logSuccess("Capabilities sözleşmesi ve provider gereksinimleri doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 5/8 TEST SONUCU: VERSİYONLAMA VE EDİTÖR TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage5Tests().catch((err) => {
  console.error("\n❌ AŞAMA 5/8 DOĞRULAMA HATASI:", err);
  process.exit(1);
});
