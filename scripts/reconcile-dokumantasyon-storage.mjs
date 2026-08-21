// ============================================================================
// DOKÜMANTASYON — TEK STORAGE RECONCILE ARACI (DRY-RUN DEFAULT)
// ============================================================================

import fs from "fs";
import path from "path";

const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key.trim()]) process.env[key.trim()] = rest.join("=").trim();
  }
}

const isDeleteSafeOrphansMode = process.argv.slice(2).includes("--delete-safe-orphans");

function printCount(label, items) {
  console.log(`  ${label}: ${items.length}`);
}

async function runReconciliation() {
  const runtime = await import("../src/lib/dokumantasyon/runtime-mode.ts");
  const lifecycle = await import("../src/lib/dokumantasyon/storage-lifecycle.ts");
  const { readLocalDb, getLocalStorageDir } = await import("../src/lib/dokumantasyon/local-store.ts");

  const hasDatabase = runtime.hasDatabaseUrl();
  const isLocal = runtime.isExplicitLocalDokMode();
  const hasBlob = runtime.hasBlobAccessConfiguration();
  let dbFiles = [];
  let uploadIntents = [];
  let physicalObjects = [];
  let physicalInventoryAvailable = false;

  console.log("Dokümantasyon storage reconcile");
  console.log(`Mod: ${isDeleteSafeOrphansMode ? "SAFE CLEANUP" : "REPORT ONLY / DRY-RUN"}\n`);

  if (hasDatabase) {
    try {
      const { getDb } = await import("../src/lib/dokumantasyon/db.ts");
      const sql = getDb();
      dbFiles = await sql`
        SELECT id, display_name, blob_pathname, blob_url, size_bytes, mime_type,
               extension, created_at, deleted_at, purge_status, purge_last_error
        FROM dok_files;
      `;
      try {
        uploadIntents = await sql`
          SELECT id, pathname, status, expires_at, finalized_at, file_id, last_error_code
          FROM dok_upload_intents;
        `;
      } catch {
        console.log("  Intent ledger henüz okunamadı; yalnız DB/Blob envanteri raporlanacak.");
      }
    } catch (error) {
      console.error("Veritabanı envanteri alınamadı:", error instanceof Error ? error.message : "bilinmeyen hata");
      process.exitCode = 1;
      return;
    }
  } else if (isLocal) {
    const db = readLocalDb();
    dbFiles = db.files || [];
  } else {
    console.log("Ne dayanıklı DB ne de açık yerel geliştirme modu var; reconcile çalıştırılmadı.");
    return;
  }

  if (hasBlob) {
    try {
      const { list } = await import("@vercel/blob");
      let cursor;
      do {
        const result = await list({
          prefix: "dok_storage/",
          cursor,
          ...runtime.getBlobCommandOptions(),
        });
        physicalObjects.push(
          ...result.blobs.map((blob) => ({
            pathname: blob.pathname,
            url: blob.url,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
          }))
        );
        cursor = result.cursor;
      } while (cursor);
      physicalInventoryAvailable = true;
    } catch (error) {
      console.error("Blob envanteri alınamadı; hiçbir temizleme yapılmayacak:", error instanceof Error ? error.message : "bilinmeyen hata");
    }
  } else if (isLocal) {
    const storageDir = getLocalStorageDir();
    if (fs.existsSync(storageDir)) {
      physicalObjects = fs.readdirSync(storageDir).map((name) => {
        const stat = fs.statSync(path.join(storageDir, name));
        return {
          pathname: `dok_storage/${name}`,
          url: `local:${name}`,
          size: stat.size,
          uploadedAt: stat.mtime,
        };
      });
    }
    physicalInventoryAvailable = true;
  }

  printCount("DB metadata", dbFiles);
  printCount("Physical objects", physicalObjects);
  printCount("Upload intents", uploadIntents);
  if (!physicalInventoryAvailable) {
    console.log("Physical storage listelenemediği için 'DB var, Blob yok' sonucu üretilmedi.");
    return;
  }

  const dbByPathname = new Map(dbFiles.map((file) => [file.blob_pathname, file]));
  const physicalByPathname = new Map(physicalObjects.map((object) => [object.pathname, object]));
  const intentByPathname = new Map(uploadIntents.map((intent) => [intent.pathname, intent]));
  const pathnames = new Set([...dbByPathname.keys(), ...physicalByPathname.keys(), ...intentByPathname.keys()]);
  const states = [...pathnames].map((pathname) => lifecycle.classifyStorageLifecycle({
    pathname,
    dbRecord: dbByPathname.get(pathname),
    physicalObject: physicalByPathname.get(pathname),
    uploadIntent: intentByPathname.get(pathname),
  }));

  const byKind = (kind) => states.filter((state) => state.kind === kind);
  const healthy = byKind("healthy");
  const pendingPurge = byKind("pending_purge");
  const orphanBlobs = byKind("orphan_blob");
  const awaitingCallbacks = byKind("awaiting_callback");
  const brokenMetadata = byKind("broken_metadata");
  const interruptedUploads = byKind("interrupted_upload");

  console.log("\nLifecycle sonuçları");
  printCount("Sağlıklı", healthy);
  printCount("Yeniden denenecek purge", pendingPurge);
  printCount("Orphan Blob", orphanBlobs);
  printCount("Aktif callback bekleyen", awaitingCallbacks);
  printCount("Kırık metadata (Blob yok)", brokenMetadata);
  printCount("Kesintili upload (Blob yok)", interruptedUploads);

  for (const state of [...pendingPurge, ...orphanBlobs, ...awaitingCallbacks, ...brokenMetadata, ...interruptedUploads]) {
    console.log(`  [${state.kind}] ${state.pathname}`);
  }

  const eligibleOrphans = orphanBlobs.filter((state) => state.canDeletePhysicalObject);
  if (!isDeleteSafeOrphansMode) {
    console.log("\nDry-run tamamlandı. 24 saati geçen orphan Blob'ları silmek için --delete-safe-orphans kullanın.");
    return;
  }
  if (!hasBlob) {
    console.log("Yerel modda otomatik orphan temizliği kapalıdır; hiçbir şey silinmedi.");
    return;
  }

  let deletedCount = 0;
  for (const orphan of eligibleOrphans) {
    try {
      const { del } = await import("@vercel/blob");
      await del(orphan.pathname, runtime.getBlobCommandOptions());
      deletedCount++;
      console.log(`  Silindi: ${orphan.pathname}`);
    } catch (error) {
      console.error(`  Silinemedi: ${orphan.pathname} (${error instanceof Error ? error.message : "bilinmeyen hata"})`);
    }
  }
  console.log(`\nSafe cleanup tamamlandı: ${deletedCount}/${eligibleOrphans.length} uygun orphan silindi.`);
}

runReconciliation().catch((error) => {
  console.error("Reconcile beklenmedik hatası:", error instanceof Error ? error.message : "bilinmeyen hata");
  process.exitCode = 1;
});
