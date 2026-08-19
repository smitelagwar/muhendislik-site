// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 4/6: DEPOLAMA VE VERİTABANI MUTABAKATI (RECONCILIATION)
// ============================================================================

import fs from "fs";
import path from "path";
import crypto from "crypto";

// .env.local varsa otomatik yükle
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

const args = process.argv.slice(2);
const isRepairMode = args.includes("--repair-orphans");

console.log("======================================================================");
console.log(`DÖKÜMANTASYON MODÜLÜ — DEPOLAMA MUTABAKAT VE KURTARMA (MOD: ${isRepairMode ? "REPAIR" : "REPORT ONLY"})`);
console.log("======================================================================\n");

async function runReconciliation() {
  const { isExplicitLocalDokMode } = await import("../src/lib/dokumantasyon/runtime-mode.ts");
  const { readLocalDb, writeLocalDb, getLocalStorageDir } = await import("../src/lib/dokumantasyon/local-store.ts");

  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  let dbFiles = [];
  let physicalObjects = [];

  // 1. DB Kayıtlarını Topla
  if (hasDb) {
    try {
      const { getDb } = await import("../src/lib/dokumantasyon/db.ts");
      const sql = getDb();
      dbFiles = (await sql`
        SELECT id, display_name, blob_pathname, blob_url, size_bytes, mime_type, extension, created_at, deleted_at
        FROM dok_files;
      `) || [];
    } catch (err) {
      console.error("  ❌ Veritabanı sorgu hatası:", err.message);
      process.exit(1);
    }
  } else if (isExplicitLocalDokMode()) {
    const db = readLocalDb();
    dbFiles = db.files || [];
  } else {
    console.log("  ⚠️ Ne DATABASE_URL ne de açık yerel mod tanımlı. Mutabakat yapılamıyor.");
    process.exit(0);
  }

  // 2. Fiziksel Depo Objelerini Topla (Blob veya Local Storage)
  if (hasBlob) {
    try {
      const { list } = await import("@vercel/blob");
      let cursor;
      do {
        const res = await list({ prefix: "dok_storage/", cursor });
        physicalObjects.push(
          ...res.blobs.map((b) => ({
            pathname: b.pathname,
            url: b.url,
            size: b.size,
            uploadedAt: b.uploadedAt,
          }))
        );
        cursor = res.cursor;
      } while (cursor);
    } catch (err) {
      console.error("  ❌ Vercel Blob listeleme hatası:", err.message);
    }
  } else if (isExplicitLocalDokMode()) {
    const storageDir = getLocalStorageDir();
    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      physicalObjects = files.map((f) => {
        const fullPath = path.join(storageDir, f);
        const stat = fs.statSync(fullPath);
        return {
          pathname: `dok_storage/${f}`,
          url: `local:${f}`,
          size: stat.size,
          uploadedAt: stat.mtime,
        };
      });
    }
  }

  console.log(`▶ 1. Envanter Özeti`);
  console.log(`  ℹ [BİLGİ] Veritabanı Kayıt Sayısı: ${dbFiles.length}`);
  console.log(`  ℹ [BİLGİ] Fiziksel Depo Obje Sayısı: ${physicalObjects.length}`);

  // 3. Karşılaştırma Matrisi
  const dbPathnames = new Map(dbFiles.map((f) => [f.blob_pathname, f]));
  const physicalPathnames = new Map(physicalObjects.map((p) => [p.pathname, p]));

  const matched = [];
  const orphanBlobs = [];
  const brokenDbRows = [];
  const localUrlRows = [];

  for (const dbFile of dbFiles) {
    if (dbFile.blob_url?.startsWith("local:")) {
      localUrlRows.push(dbFile);
    }

    if (physicalPathnames.has(dbFile.blob_pathname)) {
      matched.push({ dbFile, physical: physicalPathnames.get(dbFile.blob_pathname) });
    } else {
      brokenDbRows.push(dbFile);
    }
  }

  for (const phys of physicalObjects) {
    if (!dbPathnames.has(phys.pathname)) {
      orphanBlobs.push(phys);
    }
  }

  console.log(`\n▶ 2. Mutabakat Sonuçları`);
  console.log(`  ✓ Eşleşen (Sağlıklı) Dosyalar: ${matched.length}`);
  console.log(`  ⚠️ Orphan (Sahipsiz / Kurtarılabilir) Depo Objeleri: ${orphanBlobs.length}`);
  console.log(`  ❌ Kırık DB Kayıtları (Depoda Yok): ${brokenDbRows.length}`);
  console.log(`  ℹ Yerel URL (local:) Kayıtları: ${localUrlRows.length}`);

  if (orphanBlobs.length > 0) {
    console.log("\n▶ 3. Tespit Edilen Orphan Objeler:");
    orphanBlobs.forEach((o, idx) => {
      console.log(`   [${idx + 1}] Pathname: ${o.pathname}, Boyut: ${o.size} byte, Tarih: ${o.uploadedAt}`);
    });

    if (isRepairMode) {
      console.log("\n▶ 4. Kurtarma İşlemi Gerçekleştiriliyor (--repair-orphans)...");
      let recoveredCount = 0;

      for (const o of orphanBlobs) {
        const ext = path.extname(o.pathname) || ".bin";
        const shortId = path.basename(o.pathname, ext).slice(0, 8);
        const displayName = `Kurtarılan_Dosya_${shortId}${ext}`;

        if (hasDb) {
          const { getDb } = await import("../src/lib/dokumantasyon/db.ts");
          const sql = getDb();
          await sql`
            INSERT INTO dok_files (
              id, display_name, folder_id, blob_url, blob_pathname, size_bytes, mime_type, extension, created_at, updated_at
            ) VALUES (
              ${crypto.randomUUID()},
              ${displayName},
              NULL,
              ${o.url},
              ${o.pathname},
              ${o.size},
              ${"application/octet-stream"},
              ${ext.toLowerCase()},
              NOW(),
              NOW()
            );
          `;
          recoveredCount++;
        } else if (isExplicitLocalDokMode()) {
          const db = readLocalDb();
          db.files.push({
            id: crypto.randomUUID(),
            display_name: displayName,
            folder_id: null,
            blob_url: o.url,
            blob_pathname: o.pathname,
            size_bytes: o.size,
            mime_type: "application/octet-stream",
            extension: ext.toLowerCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          writeLocalDb(db);
          recoveredCount++;
        }
      }
      console.log(`  ✓ ${recoveredCount} adet orphan obje veritabanına başarıyla kurtarıldı!`);
    } else {
      console.log("\n  ℹ [BİLGİ] Bu orphan objeleri veritabanına kurtarmak için komutu '--repair-orphans' bayrağıyla çalıştırabilirsiniz.");
    }
  }

  console.log("\n======================================================================");
  console.log("AŞAMA 4/6: RECONCILIATION DENETİMİ TAMAMLANDI!");
  console.log("======================================================================\n");
}

runReconciliation().catch((err) => {
  console.error("Reconciliation hatası:", err);
  process.exit(1);
});
