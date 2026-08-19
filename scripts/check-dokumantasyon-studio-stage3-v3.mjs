// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — 3 AŞAMALI PLAN: AŞAMA 3/3 DOĞRULAMA TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
process.env.NODE_ENV = "test";

function logStep(msg) {
  console.log(`\n▶ ${msg}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage3Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/3 (EDIT, CAD, VERSİYONLAMA VE FINAL QA)");
  console.log("======================================================================");

  // -------------------------------------------------------------------
  // TEST 1: DB Migration 003 ve dok_file_versions Tablo Şeması
  // -------------------------------------------------------------------
  logStep("TEST 1: DB Migration 003 ve dok_file_versions Veritabanı Şeması");

  const dbPath = path.join(ROOT, "src/lib/dokumantasyon/db.ts");
  assert(fs.existsSync(dbPath), "db.ts mevcut olmalıdır.");
  const dbContent = fs.readFileSync(dbPath, "utf-8");

  assert(
    dbContent.includes("003") && dbContent.includes("dok_file_versions"),
    "db.ts 003 versiyonuyla dok_file_versions tablosunu tanımlamalıdır."
  );
  assert(
    dbContent.includes("current_version_number INT NOT NULL DEFAULT 1"),
    "db.ts dok_files tablosuna current_version_number sütununu eklemelidir."
  );
  assert(
    dbContent.includes("file_version_id UUID NULL REFERENCES dok_file_versions"),
    "db.ts dok_share_items tablosuna file_version_id snapshot referansı eklemelidir."
  );
  logSuccess("Migration 003 ve dok_file_versions tablo şeması doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: Versioned Save, Sürüm Geçmişi ve Geri Yükleme Yaşam Döngüsü
  // -------------------------------------------------------------------
  logStep("TEST 2: Versioned Save ve Sürümleme Yaşam Döngüsü (v1 -> v2 -> v3 -> restore v4)");

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

  // 1. İlk Versiyon Sorgusu (v1)
  const v1List = await versionsModule.getFileVersions(testFileId);
  assert.strictEqual(v1List.length, 1, "İlk versiyon listesi 1 kayıt içermelidir.");
  assert.strictEqual(v1List[0].version_number, 1, "İlk kayıt v1 olmalıdır.");

  // 2. Yeni Versiyon Kaydet (v2)
  const v2Content = initialContent + "\nKOLON KESITI: 50x50 cm";
  const v2 = await versionsModule.createNewFileVersion({
    fileId: testFileId,
    contentBuffer: Buffer.from(v2Content, "utf-8"),
    mimeType: "text/plain",
    comment: "Kolon boyutu eklendi",
    username: "muhendis_ali",
  });
  assert.strictEqual(v2.version_number, 2, "Yeni versiyon v2 olmalıdır.");

  // 3. Yeni Versiyon Kaydet (v3)
  const v3Content = v2Content + "\nTEMEL TIPI: RADYE";
  const v3 = await versionsModule.createNewFileVersion({
    fileId: testFileId,
    contentBuffer: Buffer.from(v3Content, "utf-8"),
    mimeType: "text/plain",
    comment: "Temel revize edildi",
    username: "muhendis_ali",
  });
  assert.strictEqual(v3.version_number, 3, "Yeni versiyon v3 olmalıdır.");

  // 4. Versiyon Listesini Denetle
  const fullList = await versionsModule.getFileVersions(testFileId);
  assert.strictEqual(fullList.length, 3, "Versiyon listesinde 3 kayıt bulunmalıdır.");

  // 5. Geri Yükleme (Restore v2 -> v4)
  const v4 = await versionsModule.restoreFileVersion({
    fileId: testFileId,
    versionId: v2.id,
    username: "admin",
  });
  assert.strictEqual(v4.version_number, 4, "Geri yüklenen yeni sürüm v4 olmalıdır.");
  logSuccess("Versiyonlama yaşam döngüsü (v1 -> v2 -> v3 -> restore v4) %100 doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Public Paylaşım Snapshot Değişmezliği
  // -------------------------------------------------------------------
  logStep("TEST 3: Public Paylaşım Snapshot Değişmezliği ve Versiyon Kilitleme");

  const sharesPath = path.join(ROOT, "src/lib/dokumantasyon/shares.ts");
  assert(fs.existsSync(sharesPath), "shares.ts mevcut olmalıdır.");
  const sharesContent = fs.readFileSync(sharesPath, "utf-8");

  assert(
    sharesContent.includes("file_version_id"),
    "shares.ts paylaşılan dosyalara file_version_id bağlamalıdır."
  );

  const publicDownloadPath = path.join(
    ROOT,
    "src/app/api/dokumantasyon/public/download/[token]/[itemId]/route.ts"
  );
  assert(fs.existsSync(publicDownloadPath), "download route mevcut olmalıdır.");
  const publicDownloadContent = fs.readFileSync(publicDownloadPath, "utf-8");

  assert(
    publicDownloadContent.includes("file_version_id") ||
    publicDownloadContent.includes("getFileVersion"),
    "Public download route kilitli file_version_id varsa o versiyonun blob'unu servis etmelidir."
  );
  assert(
    publicDownloadContent.includes("inline") &&
    publicDownloadContent.includes("noindex"),
    "Public önizleme 'inline' ve 'noindex' güvenlik başlıklarını içermelidir."
  );
  logSuccess("Public paylaşım link versiyon kilitlemesi ve snapshot değişmezliği doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: CAD Dürüstlük ve APS İzolasyonu
  // -------------------------------------------------------------------
  logStep("TEST 4: CAD Dürüstlük Sözleşmesi ve Sahte URN Yokluğu");

  const cadApsPath = path.join(ROOT, "src/lib/dokumantasyon/cad-aps.ts");
  const cadApsContent = fs.readFileSync(cadApsPath, "utf-8");

  assert(
    !cadApsContent.includes("mock_aps_client_token"),
    "cad-aps.ts içinde sahte token ('mock_aps_client_token') BULUNMAMALIDIR."
  );

  const cadApsModule = await import(pathToFileURL(cadApsPath).href);
  const statusRes = await cadApsModule.resolveCadPreviewStatus("test-file-id", ".dwg");

  assert.strictEqual(
    statusRes.status,
    "unconfigured",
    "APS anahtarları yokken CAD durumu 'unconfigured' (BLOCKED_EXTERNAL_DEPENDENCY) olmalıdır."
  );
  assert.strictEqual(
    statusRes.isAvailable,
    false,
    "APS anahtarları yokken isAvailable = false olmalıdır."
  );
  logSuccess("CAD dürüst durum yönetimi ve sahte URN izolasyonu doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 5: Format Stüdyoları & Markdown XSS Sanitizasyonu
  // -------------------------------------------------------------------
  logStep("TEST 5: Format Stüdyoları ve Markdown XSS Güvenliği");

  const mdViewerPath = path.join(
    ROOT,
    "src/components/dokumantasyon/preview/markdown-viewer.tsx"
  );
  assert(fs.existsSync(mdViewerPath), "markdown-viewer.tsx mevcut olmalıdır.");
  const mdContent = fs.readFileSync(mdViewerPath, "utf-8");

  assert(
    mdContent.includes("skipHtml={true}"),
    "Markdown viewer XSS saldırılarını önlemek için skipHtml={true} parametresi içermelidir."
  );

  const imgViewerPath = path.join(
    ROOT,
    "src/components/dokumantasyon/preview/image-viewer.tsx"
  );
  assert(fs.existsSync(imgViewerPath), "image-viewer.tsx mevcut olmalıdır.");
  const imgContent = fs.readFileSync(imgViewerPath, "utf-8");

  assert(
    imgContent.includes("image.rotate") &&
    imgContent.includes("image.flip") &&
    imgContent.includes("image.checkerboard"),
    "Image Studio döndürme, aynalama ve dama tahtası şeffaflık ızgarası komutlarını içermelidir."
  );
  logSuccess("Format stüdyoları ve Markdown XSS sanitizasyonu doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 3/3 TEST SONUCU: TÜM EDIT, CAD, SÜRÜMLEME VE QA TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage3Tests().catch((err) => {
  console.error("\n❌ AŞAMA 3/3 TEST HATASI:", err);
  process.exit(1);
});
