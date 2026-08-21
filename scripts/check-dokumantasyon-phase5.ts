// ============================================================================
// DOKÜMANTASYON — AŞAMA 5 STORAGE LIFECYCLE VE GÜVENLİK KABUL TESTİ
// ============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  STORAGE_ORPHAN_GRACE_MS,
  classifyStorageLifecycle,
  isSignedAccessExpired,
} from "../src/lib/dokumantasyon/storage-lifecycle";

const now = Date.UTC(2026, 0, 1, 12, 0, 0);
const pathname = "dok_storage/phase5.pdf";
const dbRecord = { id: "file-1", blob_pathname: pathname, deleted_at: null, purge_status: "none" };
const blob = { pathname, uploadedAt: new Date(now - STORAGE_ORPHAN_GRACE_MS - 1).toISOString() };
const activeIntent = {
  id: "intent-1",
  pathname,
  status: "issued",
  expires_at: new Date(now + 60_000).toISOString(),
};

function expectKind(
  expected: ReturnType<typeof classifyStorageLifecycle>["kind"],
  state: ReturnType<typeof classifyStorageLifecycle>
) {
  assert.equal(state.kind, expected, `Beklenen durum ${expected}, gelen ${state.kind}`);
}

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

console.log("▶ 1. Orphan ve kesintili upload matrisi");
const orphan = classifyStorageLifecycle({ pathname, physicalObject: blob, nowMs: now });
expectKind("orphan_blob", orphan); // 1: Blob var, DB yok
assert.equal(orphan.canDeletePhysicalObject, true, "Grace sonrası orphan kontrollü silinebilmelidir.");

expectKind("broken_metadata", classifyStorageLifecycle({ pathname, dbRecord, nowMs: now })); // 2: DB var, Blob yok
expectKind("interrupted_upload", classifyStorageLifecycle({ pathname, uploadIntent: activeIntent, nowMs: now })); // 3
expectKind("healthy", classifyStorageLifecycle({ pathname, dbRecord, physicalObject: blob, uploadIntent: activeIntent, nowMs: now })); // 4

const callbackMissing = classifyStorageLifecycle({ pathname, physicalObject: blob, uploadIntent: activeIntent, nowMs: now }); // 5
expectKind("awaiting_callback", callbackMissing);
assert.equal(callbackMissing.canDeletePhysicalObject, false, "Aktif callback intent'i silinemez.");

expectKind("orphan_blob", classifyStorageLifecycle({ pathname, physicalObject: blob, nowMs: now })); // 6: DB silinmiş, Blob kalmış
expectKind("broken_metadata", classifyStorageLifecycle({ pathname, dbRecord, nowMs: now })); // 7: Blob silinmiş, DB kalmış
assert.equal(isSignedAccessExpired(new Date(now - 1).toISOString(), now), true); // 8
assert.equal(isSignedAccessExpired(new Date(now + 1).toISOString(), now), false);

console.log("▶ 2. Idempotency ve güvenlik durağan denetimleri");
const filesSource = source("src/lib/dokumantasyon/files.ts");
const completionSource = source("src/lib/dokumantasyon/upload-completion.ts");
const intentSource = source("src/lib/dokumantasyon/upload-intent.ts");
const dbSource = source("src/lib/dokumantasyon/db.ts");
const securitySource = source("src/lib/dokumantasyon/security.ts");
const localUploadSource = source("src/app/api/dokumantasyon/upload/local/route.ts");
const trashSource = source("src/lib/dokumantasyon/trash.ts");
const reconcileSource = source("scripts/reconcile-dokumantasyon-storage.mjs");
const studioSource = source("src/components/dokumantasyon/studio/document-studio-shell.tsx");
const managerSource = source("src/components/dokumantasyon/file-manager.tsx");
const nextConfigSource = source("next.config.ts");

assert.match(filesSource, /ON CONFLICT \(blob_pathname\) DO NOTHING/, "Finalize aynı pathname için idempotent olmalıdır.");
assert.match(completionSource, /markUploadIntentFinalized\(intent\.intentId, file\.id\)/, "Callback intent durumunu doğru id ile bitirmelidir.");
assert.match(intentSource, /ensureDatabaseTables\(sql\)/, "Dayanıklı intent ledger yazılmadan upload başlamamalıdır.");
assert.match(dbSource, /pathname VARCHAR\(1024\) UNIQUE NOT NULL/, "Intent pathname benzersizliği şema ile korunmalıdır.");
assert.match(filesSource, /metadata korundu/, "Blob silinemediğinde DB metadata'sı korunmalıdır.");
assert.match(trashSource, /await permanentDeleteFile/, "Çöp kutusu hard-delete için aynı Blob-önce akışını kullanmalıdır.");
assert.match(localUploadSource, /canonicalPathname/, "Yerel upload güvenli canonical namespace'e yazmalıdır.");
assert.match(reconcileSource, /storage-lifecycle\.ts/, "Tek reconcile aracı ortak lifecycle matrisini kullanmalıdır.");
assert.doesNotMatch(securitySource, /super_secure_key_for_testing/, "Sabit paylaşım şifreleme anahtarı bulunmamalıdır.");
assert.match(studioSource, /dynamic\(\(\) => import\(/, "Ağır viewer'lar lazy yüklenmelidir.");
assert.doesNotMatch(managerSource, /from "\.\.\/preview\/pdf-viewer"/, "File Manager PDF viewer'ı import etmemelidir.");
assert.match(nextConfigSource, /contentSecurityPolicy/, "Görsel SVG işleme için Next image CSP tanımlı kalmalıdır.");

console.log("▶ 3. Sözleşme kaydı");
const contractSource = source("DOK_STORAGE_CONTRACT.md");
assert.match(contractSource, /Harici.*eklenmedi|provider abstraction.*eklenmedi/i, "Harici provider kararı yazılı olmalıdır.");
assert.match(contractSource, /npm run reconcile:dokumantasyon/, "Tek reconcile aracı sözleşmede yer almalıdır.");

console.log("✓ Aşama 5 storage lifecycle, idempotency, güvenlik ve lazy-viewer kabul testleri geçti.");
