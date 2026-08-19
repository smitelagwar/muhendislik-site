// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DEPOLAMA VE VERİTABANI MUTABAKATI (SAFE RECONCILIATION)
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
const isDeleteSafeOrphansMode = args.includes("--delete-safe-orphans");

console.log("======================================================================");
console.log(`DÖKÜMANTASYON MODÜLÜ — GÜVENLİ DEPOLAMA MUTABAKATI (MOD: ${isDeleteSafeOrphansMode ? "SAFE CLEANUP" : "REPORT ONLY / DRY-RUN"})`);
console.log("======================================================================\n");

async function runReconciliation() {
  const { isExplicitLocalDokMode, getBlobToken, hasDatabaseUrl } = await import("../src/lib/dokumantasyon/runtime-mode.ts");
  const { readLocalDb, getLocalStorageDir } = await import("../src/lib/dokumantasyon/local-store.ts");

  const hasDb = hasDatabaseUrl();
  const blobToken = getBlobToken();
  const hasBlob = Boolean(blobToken);

  let dbFiles = [];
  let physicalObjects = [];

  // 1. DB Kayıtlarını Topla
  if (hasDb) {
    try {
      const { getDb } = await import("../src/lib/dokumantasyon/db.ts");
      const sql = getDb();
      dbFiles = (await sql`
        SELECT id, display_name, blob_pathname, blob_url, size_bytes, mime_type, extension, created_at, deleted_at, purge_status
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
        const res = await list({ prefix: "dok_storage/", cursor, token: blobToken });
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

  const nowMs = Date.now();
  const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 saat grace period

  for (const phys of physicalObjects) {
    if (!dbPathnames.has(phys.pathname)) {
      const uploadTime = new Date(phys.uploadedAt).getTime();
      const isOlderThanGrace = (nowMs - uploadTime) > GRACE_PERIOD_MS;
      orphanBlobs.push({ ...phys, isOlderThanGrace });
    }
  }

  console.log(`\n▶ 2. Mutabakat Sonuçları`);
  console.log(`  ✓ Eşleşen (Sağlıklı) Dosyalar: ${matched.length}`);
  console.log(`  ⚠️ Orphan (Sahipsiz) Depo Objeleri: ${orphanBlobs.length}`);
  console.log(`  ❌ Kırık DB Kayıtları (Depoda Yok): ${brokenDbRows.length}`);
  console.log(`  ℹ Yerel URL (local:) Kayıtları: ${localUrlRows.length}`);

  if (orphanBlobs.length > 0) {
    console.log("\n▶ 3. Tespit Edilen Orphan Objeler:");
    orphanBlobs.forEach((o, idx) => {
      console.log(`   [${idx + 1}] Pathname: ${o.pathname}, Boyut: ${o.size} byte, Tarih: ${o.uploadedAt} (Grace süresi ${o.isOlderThanGrace ? "DOLDU" : "AKTİF"})`);
    });

    if (isDeleteSafeOrphansMode && hasBlob) {
      const { del } = await import("@vercel/blob");
      let deletedCount = 0;
      for (const o of orphanBlobs) {
        if (o.isOlderThanGrace) {
          try {
            await del(o.pathname, { token: blobToken });
            deletedCount++;
            console.log(`   ✓ Silindi: ${o.pathname}`);
          } catch (e) {
            console.error(`   ❌ Silinemedi (${o.pathname}):`, e.message);
          }
        }
      }
      console.log(`\n  ✓ Toplam ${deletedCount} adet süresi dolmuş sahipsiz obje kalıcı olarak temizlendi.`);
    } else {
      console.log("\n  ℹ [BİLGİ] Varsayılan mod 'Report Only'dir. 24 saatten eski sahipsiz objeleri temizlemek için '--delete-safe-orphans' bayrağını kullanabilirsiniz.");
    }
  }

  console.log("\n======================================================================");
  console.log("MUTABAKAT RAPORU TAMAMLANDI");
  console.log("======================================================================\n");
}

runReconciliation().catch((err) => {
  console.error("Reconciliation hatası:", err);
  process.exit(1);
});
