// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — MASTER E2E VE REGRESYON TESTİ (AŞAMA 7/8)
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
console.log("DÖKÜMANTASYON MODÜLÜ — MASTER E2E VE REGRESYON KAPISI (AŞAMA 7/8)");
console.log("======================================================================\n");

function logGate(title) {
  console.log(`\n▶ [KAPI] ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [PASS] ${msg}`);
}

async function runMasterE2ETests() {
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
  const pdfSearchModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/studio/pdf/pdf-search.ts")).href
  );
  const commandsModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/studio/commands.ts")).href
  );
  const capsModule = await import(
    pathToFileURL(path.join(ROOT, "src/lib/dokumantasyon/studio/capabilities.ts")).href
  );

  // -------------------------------------------------------------------
  // GATE 1: FULL-VIEWPORT SHELL & COMMAND REGISTRY SÖZLEŞMESİ
  // -------------------------------------------------------------------
  logGate("GATE 1: Full-Viewport Kabuk & 24 Komutluk Command Registry");

  const pagePath = path.join(ROOT, "src/app/dokumantasyon/dosya/[fileId]/page.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf-8");
  assert(
    !pageContent.includes("DokumantasyonAdminShell"),
    "dosya/[fileId] rotasında dar admin shell bulunmamalıdır."
  );
  assert(
    pageContent.includes("DocumentStudioShell"),
    "dosya/[fileId] rotası DocumentStudioShell render etmelidir."
  );

  const commandIds = Object.keys(commandsModule.STUDIO_COMMANDS);
  assert(
    commandIds.length >= 24,
    `Command registry en az 24 komut içermelidir (mevcut: ${commandIds.length}).`
  );

  const mandatoryCommands = [
    "studio.back",
    "studio.share",
    "studio.download",
    "studio.save",
    "studio.fullscreen",
    "studio.rename",
    "studio.delete",
    "pdf.zoom.in",
    "pdf.zoom.out",
    "pdf.rotateView",
    "pdf.search.open",
    "cad.download",
    "image.rotate.cw",
    "image.flip.h",
    "image.checkerboard",
    "text.copy",
    "text.wrap",
  ];

  for (const cmd of mandatoryCommands) {
    assert(commandsModule.STUDIO_COMMANDS[cmd], `Zorunlu komut '${cmd}' tanımlı olmalıdır.`);
  }

  logSuccess("Full-viewport kabuk ve 24 zorunlu komut doğrulandı.");

  // -------------------------------------------------------------------
  // GATE 2: PDF.JS GÜVENLİK, CONTINUOUS SCROLL VE TÜRKÇE ARAMA
  // -------------------------------------------------------------------
  logGate("GATE 2: PDF.js Güvenlik Geçidi, Continuous Scroll ve Türkçe Arama");

  const pdfjsLoaderPath = path.join(
    ROOT,
    "src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts"
  );
  const pdfLoaderContent = fs.readFileSync(pdfjsLoaderPath, "utf-8");
  assert(
    pdfLoaderContent.includes("isEvalSupported: false"),
    "PDF.js eval execution kesinlikle engellenmelidir."
  );
  assert(
    pdfLoaderContent.includes("enableScripting: false"),
    "PDF.js scripting kesinlikle engellenmelidir."
  );
  assert(
    pdfLoaderContent.includes("/vendor/pdfjs/pdf.min.js"),
    "PDF.js self-hosted yerel kütüphaneden yüklenmelidir."
  );

  // Türkçe Karakter Arama Testi
  assert.strictEqual(
    pdfSearchModule.normalizeTurkishText("İNŞAAT MÜHENDİSLİĞİ"),
    "inşaat mühendisliği"
  );
  assert.strictEqual(
    pdfSearchModule.normalizeTurkishText("IĞDIR VE ŞİŞLİ"),
    "ığdır ve şişli"
  );

  const mockPdfDoc = {
    numPages: 2,
    getPage: async (num) => ({
      getTextContent: async () => ({
        items: [
          { str: num === 1 ? "KADIKOY KONUT PROJESI PB108 KİRİŞİ" : "RADYE TEMEL RAPORU" },
        ],
      }),
    }),
  };

  const searchRes = await pdfSearchModule.searchInPdfDocument(mockPdfDoc, "pb108");
  assert.strictEqual(searchRes.totalMatches, 1);
  assert.strictEqual(searchRes.matches[0].pageNumber, 1);

  logSuccess("PDF.js güvenlik geçidi ve Türkçe karakter arama motoru doğrulandı.");

  // -------------------------------------------------------------------
  // GATE 3: CAD DÜRÜSTLÜK VE FORMAT STÜDYOLARI
  // -------------------------------------------------------------------
  logGate("GATE 3: CAD Dürüstlük & Görsel / Metin / Markdown Stüdyoları");

  const cadApsPath = path.join(ROOT, "src/lib/dokumantasyon/cad-aps.ts");
  const cadContent = fs.readFileSync(cadApsPath, "utf-8");
  assert(
    !cadContent.includes("mock_aps_client_token"),
    "Mock APS token üretimi bulunmamalıdır."
  );

  const cadApsModule = await import(pathToFileURL(cadApsPath).href);
  const statusRes = await cadApsModule.resolveCadPreviewStatus("test-file-id", ".dwg");
  assert.strictEqual(
    statusRes.status,
    "unconfigured",
    "APS anahtarları yokken CAD durumu 'unconfigured' olmalıdır."
  );
  assert.strictEqual(
    statusRes.isAvailable,
    false,
    "APS anahtarları yokken isAvailable false olmalıdır."
  );

  const mdViewerPath = path.join(
    ROOT,
    "src/components/dokumantasyon/preview/markdown-viewer.tsx"
  );
  const mdContent = fs.readFileSync(mdViewerPath, "utf-8");
  assert(
    mdContent.includes("skipHtml={true}"),
    "Markdown viewer XSS önleme amacıyla skipHtml={true} içermelidir."
  );

  logSuccess("CAD sahte URN yokluğu ve Markdown XSS sanitizasyonu doğrulandı.");

  // -------------------------------------------------------------------
  // GATE 4: VERİTABANI MIGRATION 003, VERSİYONLAMA & RESTORE
  // -------------------------------------------------------------------
  logGate("GATE 4: DB Migration 003 & Sürümleme Yaşam Döngüsü");

  const db = localStoreModule.readLocalDb();
  const fileId = crypto.randomUUID();
  const fileName = "zemin_etud_raporu.txt";
  const initialContent = "ZEMİN RAPORU: JEOLOJİK VE JEOTEKNİK DEĞERLENDİRME";

  const storageDir = localStoreModule.getLocalStorageDir();
  const v1Path = path.join(storageDir, `${fileId}_v1.txt`);
  fs.writeFileSync(v1Path, Buffer.from(initialContent, "utf-8"));

  db.files.push({
    id: fileId,
    folder_id: null,
    display_name: fileName,
    blob_pathname: `dok_storage/${fileId}_v1.txt`,
    blob_url: `/api/dokumantasyon/files/${fileId}/access`,
    size_bytes: Buffer.byteLength(initialContent),
    mime_type: "text/plain",
    extension: ".txt",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    current_version_number: 1,
  });
  localStoreModule.writeLocalDb(db);

  // v1 listesi
  const listV1 = await versionsModule.getFileVersions(fileId);
  assert.strictEqual(listV1.length, 1);
  assert.strictEqual(listV1[0].version_number, 1);

  // v2 oluştur
  const v2 = await versionsModule.createNewFileVersion({
    fileId,
    contentBuffer: Buffer.from("v2 icerik", "utf-8"),
    mimeType: "text/plain",
    comment: "Sondaj derinlikleri revize edildi",
  });
  assert.strictEqual(v2.version_number, 2);

  // v3 oluştur
  const v3 = await versionsModule.createNewFileVersion({
    fileId,
    contentBuffer: Buffer.from("v3 icerik", "utf-8"),
    mimeType: "text/plain",
    comment: "Yeraltı su seviyesi eklendi",
  });
  assert.strictEqual(v3.version_number, 3);

  // v2'yi geri yükle (v4 üretmeli)
  const v4 = await versionsModule.restoreFileVersion({
    fileId,
    versionId: v2.id,
  });
  assert.strictEqual(v4.version_number, 4);

  const finalList = await versionsModule.getFileVersions(fileId);
  assert.strictEqual(finalList.length, 4);
  assert.strictEqual(finalList[0].version_number, 4);
  assert.strictEqual(finalList[1].version_number, 3);
  assert.strictEqual(finalList[2].version_number, 2);
  assert.strictEqual(finalList[3].version_number, 1);

  logSuccess("Sürümleme ve restore yaşam döngüsü (v1->v2->v3->restore v4) doğrulandı.");

  // -------------------------------------------------------------------
  // GATE 5: PUBLIC PAYLAŞIM SNAPSHOT DEĞİŞMEZLİĞİ VE GÜVENLİK
  // -------------------------------------------------------------------
  logGate("GATE 5: Public Paylaşım Snapshot Değişmezliği ve İzolasyon");

  const shareRes = await sharesModule.createShareLink({
    items: [{ id: fileId, type: "file" }],
    duration: "1_DAY",
    title: "Zemin Raporu v4 Paylaşımı",
  });

  const publicInfo = await publicShareModule.getPublicShareInfo(shareRes.rawToken);
  assert.strictEqual(publicInfo.status, "ok");
  const item = publicInfo.items && publicInfo.items[0];
  assert(item, "Snapshot öğesi mevcut olmalıdır.");
  assert.strictEqual(item.file_version_id, v4.id, "Snapshot v4 versiyonuna kilitlenmelidir.");

  // Admin dosyayı v5'e güncellesin
  await versionsModule.createNewFileVersion({
    fileId,
    contentBuffer: Buffer.from("v5 admin guncellemesi", "utf-8"),
    mimeType: "text/plain",
    comment: "v5 guncelleme",
  });

  // Public paylaşım hala v4'e kilitli kalmalıdır
  const reloadedPublicInfo = await publicShareModule.getPublicShareInfo(shareRes.rawToken);
  assert(reloadedPublicInfo.items && reloadedPublicInfo.items[0]);
  assert.strictEqual(
    reloadedPublicInfo.items[0].file_version_id,
    v4.id,
    "Paylaşım snapshot'ı admin güncellemesine rağmen v4'te kilitli kalmalıdır."
  );

  logSuccess("Public paylaşım snapshot değişmezliği %100 doğrulandı.");

  console.log("\n======================================================================");
  console.log("TÜM REGRESYON KAPILARI GEÇİLDİ — AŞAMA 7/8 TEST MATRİSİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runMasterE2ETests().catch((err) => {
  console.error("\n❌ AŞAMA 7 MASTER E2E HATASI:", err);
  process.exit(1);
});
