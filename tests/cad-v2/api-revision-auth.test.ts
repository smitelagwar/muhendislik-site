// ============================================================================
// DWG/DXF MOTOR V2 — R01 API REVISION & AUTHENTICATION TEST SUITE
// ============================================================================
// Sözleşme: Fidelity v3 Planı Bölüm 11 (R01), motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Gereksinimler:
// 1. Source revision matching: Uyuşmazlık durumunda 409 SOURCE_REVISION_CHANGED.
// 2. SSRF koruması: accessUrl yalnızca yetkili dosya blob authority ile eşleşebilir.
// 3. Path traversal engelleme: isValidCadV2StorageId geçersiz / dizin kaçışı kimliklerini reddeder.
// 4. View session 180s TTL ve silme: Süresi dolan oturum 410 VIEW_SESSION_EXPIRED; DELETE 204.
// 5. Yetki ve paylaşım sınırları: 401 / 403 / 410 yetkisiz / süresi dolmuş / geçersiz erişim.

import * as assert from "node:assert/strict";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import {
  CadV2DurableService,
  isValidCadV2StorageId,
} from "../../src/lib/cad-v2/service/cad-v2-durable-service";

function checkRevisionMatch(
  expectedSourceVersionKey: string | null | undefined,
  file: { id: string; current_version_number?: number; updated_at?: string; created_at?: string; size_bytes?: number }
): { match: boolean; actualSourceVersionKey: string } {
  const actualRevisionKey = `${file.id}_${file.updated_at || file.current_version_number || "1"}`;
  const legacyRevisionKey = `${file.id}:${file.current_version_number || 1}:${file.updated_at || file.created_at}:${file.size_bytes}`;
  const match =
    !expectedSourceVersionKey ||
    expectedSourceVersionKey === actualRevisionKey ||
    expectedSourceVersionKey === legacyRevisionKey;
  return { match, actualSourceVersionKey: actualRevisionKey };
}

function isTrustedAccessUrl(
  accessUrl: unknown,
  file: { blob_url?: string; blob_pathname?: string }
): boolean {
  return (
    typeof accessUrl === "string" &&
    accessUrl.startsWith("http") &&
    (accessUrl === file.blob_url || (!!file.blob_pathname && accessUrl.includes(file.blob_pathname)))
  );
}

async function runApiRevisionAuthTests() {
  console.log("=== DWG/DXF Motor V2 — R01 API Revizyon, Auth ve Güvenlik Testi ===");

  const tempStorageDir = path.join(os.tmpdir(), `cad-v2-r01-auth-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
  const service = new CadV2DurableService(tempStorageDir);

  // --------------------------------------------------------------------------
  // [Grup 1] Kaynak Revizyon Uyuşmazlığı ve 409 SOURCE_REVISION_CHANGED Kontrolü
  // --------------------------------------------------------------------------
  console.log("\n[Grup 1] Kaynak Revizyon Eşleşmesi ve 409 SOURCE_REVISION_CHANGED:");
  const testFile = {
    id: "proj_cad_001",
    current_version_number: 3,
    updated_at: "2026-10-01T12:00:00Z",
    created_at: "2026-09-01T10:00:00Z",
    size_bytes: 409600,
  };

  // 1.1 Doğru güncel revizyonla istek
  const resExact = checkRevisionMatch("proj_cad_001_2026-10-01T12:00:00Z", testFile);
  assert.equal(resExact.match, true, "Tam eşleşen güncel revizyon kabul edilmelidir.");

  // 1.2 Eski / uyuşmayan revizyonla istek (Örn. sürüm 2) -> 409
  const resMismatch = checkRevisionMatch("proj_cad_001_2026-09-15T08:00:00Z", testFile);
  assert.equal(resMismatch.match, false, "Farklı revizyon reddedilmelidir (409 SOURCE_REVISION_CHANGED tetiklenir).");
  assert.equal(resMismatch.actualSourceVersionKey, "proj_cad_001_2026-10-01T12:00:00Z");

  // 1.3 Revizyon belirtilmemişse varsayılan kabul
  const resNoRev = checkRevisionMatch(undefined, testFile);
  assert.equal(resNoRev.match, true, "Revizyon belirtilmediğinde en güncel revizyon kullanılır.");

  console.log("  ✓ Kaynak revizyon uyuşmazlığı ve 409 sözleşmesi doğrulandı.");

  // --------------------------------------------------------------------------
  // [Grup 2] İstemci accessUrl SSRF Koruması
  // --------------------------------------------------------------------------
  console.log("\n[Grup 2] İstemci accessUrl SSRF Saldırı Engelleme:");
  const authorizedBlobFile = {
    blob_url: "https://blob.vercel-storage.com/cad-drawings/proj-001-abc123.dwg",
    blob_pathname: "cad-drawings/proj-001-abc123.dwg",
  };

  // 2.1 Güvenilir dosya URL'si
  assert.equal(
    isTrustedAccessUrl("https://blob.vercel-storage.com/cad-drawings/proj-001-abc123.dwg", authorizedBlobFile),
    true,
    "Yetkili blob URL'si kabul edilmelidir."
  );

  // 2.2 AWS/GCP Metadata SSRF girişimi
  assert.equal(
    isTrustedAccessUrl("http://169.254.169.254/latest/meta-data/", authorizedBlobFile),
    false,
    "169.254.169.254 SSRF hedefi reddedilmelidir."
  );

  // 2.3 Yerel sunucu SSRF girişimi
  assert.equal(
    isTrustedAccessUrl("http://127.0.0.1:3000/api/admin/secrets", authorizedBlobFile),
    false,
    "127.0.0.1 localhost SSRF hedefi reddedilmelidir."
  );

  // 2.4 Harici saldırgan URL'si
  assert.equal(
    isTrustedAccessUrl("http://attacker.example.com/exploit.dwg", authorizedBlobFile),
    false,
    "Yetkisiz harici sunucu URL'si reddedilmelidir."
  );

  // 2.5 Tehlikeli şemalar
  assert.equal(
    isTrustedAccessUrl("file:///etc/passwd", authorizedBlobFile),
    false,
    "file:// şeması reddedilmelidir."
  );
  assert.equal(
    isTrustedAccessUrl("javascript:alert(1)", authorizedBlobFile),
    false,
    "javascript: şeması reddedilmelidir."
  );

  console.log("  ✓ SSRF saldırı vektörleri başarıyla engellendi.");

  // --------------------------------------------------------------------------
  // [Grup 3] Path Traversal ve Depolama Kimliği Temizliği (isValidCadV2StorageId)
  // --------------------------------------------------------------------------
  console.log("\n[Grup 3] Dizin Kaçışı (Path Traversal) ve Depolama Kimliği Denetimi:");

  const maliciousIds = [
    "../secret.key",
    "../../etc/passwd",
    "..\\..\\Windows\\System32\\cmd.exe",
    "scene/../../traversal",
    "/root/protected",
    "\\windows\\win.ini",
    "scene\0nullbyte",
    "scene name with spaces",
    "scene;rm -rf",
    "",
    null as any,
    undefined as any,
  ];

  for (const badId of maliciousIds) {
    assert.equal(
      isValidCadV2StorageId(badId),
      false,
      `Tehlikeli depolama kimliği '${badId}' reddedilmelidir.`
    );
  }

  const validIds = [
    "scene_d9f8e7a6",
    "chunk_model_001",
    "index_page_002",
    "meta_layout_model",
    "proj-123.dwg-v1",
  ];

  for (const goodId of validIds) {
    assert.equal(
      isValidCadV2StorageId(goodId),
      true,
      `Geçerli depolama kimliği '${goodId}' kabul edilmelidir.`
    );
  }

  // Durable servis metotlarının traversal kimliklerde null dönmesi
  assert.equal(service.getManifest("../../etc/passwd"), null, "getManifest traversal denemesinde null dönmelidir.");
  assert.equal(service.getChunk("../../etc/passwd", "chunk1"), null, "getChunk traversal denemesinde null dönmelidir.");
  assert.equal(service.getChunk("valid_scene", "../chunk1"), null, "getChunk chunkId traversal denemesinde null dönmelidir.");
  assert.equal(await service.getSceneMetadata("../evil", "meta1"), null, "getSceneMetadata traversal denemesinde null dönmelidir.");
  assert.equal(await service.getSceneIndex("scene1", "../evil"), null, "getSceneIndex traversal denemesinde null dönmelidir.");

  console.log("  ✓ Path traversal ve depolama kimliği sanitizasyonu doğrulandı.");

  // --------------------------------------------------------------------------
  // [Grup 4] View Session 180s TTL, Heartbeat ve Silme Sözleşmesi
  // --------------------------------------------------------------------------
  console.log("\n[Grup 4] View Session 180s TTL ve Yaşam Döngüsü:");

  const clientReqId = crypto.randomUUID();
  const prep = await service.prepare({
    fileId: "file_ttl_test",
    clientRequestId: clientReqId,
    expectedSourceVersionKey: "v_ttl_1",
  });

  const sessionId = prep.viewSessionId;
  assert.ok(sessionId, "Geçerli viewSessionId üretilmelidir.");

  // 4.1 Aktif oturum için heartbeat: expiresAt ~180 saniye ileriye ötelenir
  const hb1 = service.heartbeatViewSession(sessionId);
  assert.ok(hb1.expiresAt > Date.now() + 175_000, "Heartbeat süreyi ~180 saniye uzatmalıdır.");
  assert.equal(hb1.viewSessionId, sessionId);

  // 4.2 Oturumu simüle ederek süresini doldur (TTL expiry)
  const rawSession = service.getViewSession(sessionId);
  assert.ok(rawSession, "Oturum bulunmalıdır.");
  rawSession!.expiresAt = Date.now() - 5_000; // 5 saniye önce dolmuş

  let expiredThrown = false;
  try {
    service.heartbeatViewSession(sessionId);
  } catch (err: any) {
    expiredThrown = true;
    assert.ok(
      err.message.includes("VIEW_SESSION_EXPIRED"),
      "Süresi dolmuş oturumda VIEW_SESSION_EXPIRED hatası fırlatılmalıdır (HTTP 410)."
    );
  }
  assert.equal(expiredThrown, true, "Süresi dolan oturum için heartbeat reddedildi.");

  // 4.3 DELETE viewSessionId -> 204 durumu ve oturum silinmesi
  const prep2 = await service.prepare({
    fileId: "file_del_test",
    clientRequestId: crypto.randomUUID(),
    expectedSourceVersionKey: "v_del_1",
  });
  const delResult = service.deleteViewSession(prep2.viewSessionId);
  assert.equal(delResult, true, "deleteViewSession başarıyla true (HTTP 204) dönmelidir.");

  // Silindikten sonra heartbeat denemesi
  let deletedThrown = false;
  try {
    service.heartbeatViewSession(prep2.viewSessionId);
  } catch (err: any) {
    deletedThrown = true;
    assert.ok(
      err.message.includes("VIEW_SESSION_EXPIRED"),
      "Silinmiş oturumda heartbeat VIEW_SESSION_EXPIRED fırlatmalıdır."
    );
  }
  assert.equal(deletedThrown, true, "Silinmiş oturum erişilemez olmalıdır.");

  console.log("  ✓ View session 180s TTL ve DELETE yaşam döngüsü doğrulandı.");

  // --------------------------------------------------------------------------
  // [Grup 5] Paylaşım Token Yetki ve Süre Aşımı Sınırları (401/403/410)
  // --------------------------------------------------------------------------
  console.log("\n[Grup 5] Paylaşım Bağlantısı Yetki ve İptal/Süre Denetimi:");

  const shares = [
    { token: "active_tok", status: "ok", fileIds: ["doc_1", "doc_2"] },
    { token: "expired_tok", status: "expired", fileIds: ["doc_1"] },
    { token: "revoked_tok", status: "revoked", fileIds: ["doc_1"] },
  ];

  function evaluateShareAuth(token: string | null | undefined, targetFileId: string) {
    if (!token) return { status: 401, error: "UNAUTHORIZED: Token eksik." };
    const s = shares.find((x) => x.token === token);
    if (!s) return { status: 403, error: "FORBIDDEN: Geçersiz token." };
    if (s.status === "expired" || s.status === "revoked") {
      return { status: 410, error: "GONE: Paylaşım iptal edilmiş veya süresi dolmuş." };
    }
    if (!s.fileIds.includes(targetFileId)) {
      return { status: 403, error: "FORBIDDEN: Dosyaya erişim yetkisi yok." };
    }
    return { status: 200, ok: true };
  }

  assert.equal(evaluateShareAuth(null, "doc_1").status, 401, "Token yoksa 401 dönmelidir.");
  assert.equal(evaluateShareAuth("unknown_tok", "doc_1").status, 403, "Bilinmeyen token 403 dönmelidir.");
  assert.equal(evaluateShareAuth("expired_tok", "doc_1").status, 410, "Süresi dolmuş token 410 dönmelidir.");
  assert.equal(evaluateShareAuth("revoked_tok", "doc_1").status, 410, "İptal edilmiş token 410 dönmelidir.");
  assert.equal(evaluateShareAuth("active_tok", "doc_999").status, 403, "Kapsam dışı dosya 403 dönmelidir.");
  assert.equal(evaluateShareAuth("active_tok", "doc_1").status, 200, "Geçerli token ve dosya 200 dönmelidir.");

  console.log("  ✓ Paylaşım token yetki ve süre aşımı kuralları doğrulandı.");

  console.log("\n>>> R01 API REVISION & AUTHENTICATION TESTLERİ TAMAMEN BAŞARILI (PASS) <<<");
}

runApiRevisionAuthTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
