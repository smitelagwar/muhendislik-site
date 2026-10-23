// ============================================================================
// TESTS — BELGE PAYLAŞIM: RETENTION, CRON, PURGE VE ORPHAN RECONCILE
// ============================================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  MemoryBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  MemoryBelgeBlobStore,
  setBelgeBlobStoreForTest,
} from "../../src/lib/belge-paylasim/blob-store";
import { executeBelgePaylasimCleanup } from "../../src/lib/belge-paylasim/cleanup";
import { GET as cronGet, POST as cronPost } from "../../src/app/api/cron/belge-paylasim-temizlik/route";
import { GET as getPdfRoute } from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";

describe("Belge Paylaşım — Retention, Cron ve Purge Mekanizması", () => {
  let memoryRepo: MemoryBelgePaylasimRepository;
  let memoryBlobStore: MemoryBelgeBlobStore;
  const TEST_CRON_SECRET = "test-cron-secret-at-least-32-chars-long-secure-token!";

  beforeEach(() => {
    memoryRepo = new MemoryBelgePaylasimRepository();
    memoryBlobStore = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(memoryRepo);
    setBelgeBlobStoreForTest(memoryBlobStore);
    process.env.CRON_SECRET = TEST_CRON_SECRET;
  });

  describe("1. Cron Rota Yetkilendirme ve Güvenlik", () => {
    it("CRON_SECRET ortam değişkeni yoksa fail-closed 401 dönmelidir", async () => {
      delete process.env.CRON_SECRET;

      const req = new Request("http://localhost/api/cron/belge-paylasim-temizlik", {
        method: "GET",
        headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
      });

      const res = await cronGet(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.ok(json.error.includes("yapılandırılmamış"));
    });

    it("Authorization başlığı eksikse 401 dönmelidir", async () => {
      const req = new Request("http://localhost/api/cron/belge-paylasim-temizlik", {
        method: "GET",
      });

      const res = await cronGet(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.ok(json.error.includes("Geçersiz yetkilendirme"));
    });

    it("Yanlış veya sahte Bearer token ile istek 401 dönmelidir", async () => {
      const req = new Request("http://localhost/api/cron/belge-paylasim-temizlik", {
        method: "GET",
        headers: { Authorization: "Bearer wrong-secret-token" },
      });

      const res = await cronGet(req);
      assert.equal(res.status, 401);
    });

    it("GET dışındaki HTTP yöntemleri (POST, PUT, DELETE) 405 dönmelidir", async () => {
      const res = await cronPost();
      assert.equal(res.status, 405);
      assert.equal(res.headers.get("Allow"), "GET");
    });

    it("Doğru Bearer token ile 200 ve JSON temizlik istatistiği dönmelidir", async () => {
      const req = new Request("http://localhost/api/cron/belge-paylasim-temizlik", {
        method: "GET",
        headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
      });

      const res = await cronGet(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(typeof json.stats.durationMs === "number");
    });
  });

  describe("2. Süresi Dolan (Expired) ve İptal Edilen (Revoked) Kayıtların Temizliği", () => {
    it("Süresi dolmuş (expiresAt geçmişte) bir kayıt ve Blob nesnesi başarıyla silinmelidir", async () => {
      // 1. Blob nesnesi yükle
      const blobPath = "belge_paylasim/test-expired-1.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2, 3, 4]));
      assert.equal(memoryBlobStore.has(blobPath), true);

      // 2. Geçmişte süresi dolmuş rezervasyon oluştur
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 saat önce dolmuş
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-1",
        payloadDigest: "digest-1",
        tokenHash: "token-hash-1",
        manageTokenHash: "manage-hash-1",
        documentId: "beton-dokum-tutanagi",
        blobPathname: blobPath,
        creatorIpHash: "ip-1",
        expiresAt: pastDate,
      });
      await memoryRepo.finalizeReady(rec.id, 4, "sha256-mock");

      // 3. Cleanup çalıştır
      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.processedCount, 1);
      assert.equal(stats.purgedCount, 1);
      assert.equal(stats.errorCount, 0);

      // Blob silinmiş olmalı
      assert.equal(memoryBlobStore.has(blobPath), false);

      // DB kaydı 'purged' durumunda olmalı
      const updated = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(updated?.status, "purged");
      assert.ok(updated?.purgedAt instanceof Date);
    });

    it("İptal edilmiş (status='revoked') bir kayıt süresi dolmamış olsa bile Blob'u silinip purged yapılmalıdır", async () => {
      const blobPath = "belge_paylasim/test-revoked-1.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2, 3]));

      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 gün sonra
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-rev",
        payloadDigest: "digest-rev",
        tokenHash: "token-hash-rev",
        manageTokenHash: "manage-hash-rev",
        documentId: "santiye-sefi-taahhutnamesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-rev",
        expiresAt: futureDate,
      });
      await memoryRepo.finalizeReady(rec.id, 3, "sha256-mock");
      await memoryRepo.revokeLink(rec.id);

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.purgedCount, 1);
      assert.equal(memoryBlobStore.has(blobPath), false);
      const updated = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(updated?.status, "purged");
    });

    it("Henüz süresi dolmamış ve iptal edilmemiş aktif kayıtlar asla silinmemelidir", async () => {
      const blobPath = "belge_paylasim/test-active-1.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2, 3]));

      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-act",
        payloadDigest: "digest-act",
        tokenHash: "token-hash-act",
        manageTokenHash: "manage-hash-act",
        documentId: "santiye-sefi-sozlesmesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-act",
        expiresAt: futureDate,
      });
      await memoryRepo.finalizeReady(rec.id, 3, "sha256-mock");

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.processedCount, 0);
      assert.equal(stats.purgedCount, 0);
      assert.equal(memoryBlobStore.has(blobPath), true);

      const updated = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(updated?.status, "ready");
    });
  });

  describe("3. Eşzamanlılık ve Lease Mekanizması", () => {
    it("Aktif lease süresi bulunan kayıt diğer cron tarafından işlenmemelidir", async () => {
      const blobPath = "belge_paylasim/test-leased-1.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2]));

      const pastDate = new Date(Date.now() - 1000 * 60);
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-lease",
        payloadDigest: "digest-lease",
        tokenHash: "token-hash-lease",
        manageTokenHash: "manage-hash-lease",
        documentId: "insaat-ruhsati-dilekcesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-lease",
        expiresAt: pastDate,
      });
      await memoryRepo.finalizeReady(rec.id, 2, "sha256-mock");

      // Başka bir işlem 5 dakikalık lease almış gibi simüle edelim:
      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.leaseUntil = new Date(Date.now() + 5 * 60 * 1000);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.processedCount, 0);
      assert.equal(stats.purgedCount, 0);
      // Blob henüz silinmemiş olmalı
      assert.equal(memoryBlobStore.has(blobPath), true);
    });

    it("Lease süresi dolduğunda kayıt yeniden işlenebilmelidir", async () => {
      const blobPath = "belge_paylasim/test-expired-lease.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2]));

      const pastDate = new Date(Date.now() - 1000 * 60);
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-lease-2",
        payloadDigest: "digest-lease-2",
        tokenHash: "token-hash-lease-2",
        manageTokenHash: "manage-hash-lease-2",
        documentId: "insaat-ruhsati-dilekcesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-lease-2",
        expiresAt: pastDate,
      });
      await memoryRepo.finalizeReady(rec.id, 2, "sha256-mock");

      // Lease süresi geçmişte:
      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.leaseUntil = new Date(Date.now() - 1000 * 10);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.processedCount, 1);
      assert.equal(stats.purgedCount, 1);
      assert.equal(memoryBlobStore.has(blobPath), false);
    });
  });

  describe("4. Hata Yönetimi ve Retry (Yeniden Deneme)", () => {
    it("Blob silme hatasında hata kaydedilmeli ve sonraki deneme için lease serbest bırakılmalıdır", async () => {
      const blobPath = "belge_paylasim/test-error-del.pdf";

      // del() çağrıldığında kasıtlı hata fırlatan sahte depolama
      const faultBlobStore: MemoryBelgeBlobStore = new MemoryBelgeBlobStore();
      faultBlobStore.del = async () => {
        throw new Error("BLOB_SERVICE_UNAVAILABLE");
      };

      const pastDate = new Date(Date.now() - 1000 * 60);
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-hash-err",
        payloadDigest: "digest-err",
        tokenHash: "token-hash-err",
        manageTokenHash: "manage-hash-err",
        documentId: "santiye-sefi-istifa-dilekcesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-err",
        expiresAt: pastDate,
      });
      await memoryRepo.finalizeReady(rec.id, 2, "sha256-mock");

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: faultBlobStore,
      });

      assert.equal(stats.errorCount, 1);
      assert.equal(stats.purgedCount, 0);

      const updated = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(updated?.purgeAttempts, 1);
      assert.equal(updated?.lastPurgeErrorCode, "BLOB_SERVICE_UNAVAILABLE");
      assert.equal(updated?.leaseUntil, null); // Sonraki cronda retry için serbest bırakılmış
      assert.notEqual(updated?.status, "purged"); // Purged olarak işaretlenmemeli
    });
  });

  describe("5. Takılı Kalan 'pending' Rezervasyonları Uzlaştırma", () => {
    it("24 saatten eski 'pending' kayıtları purge edilmeli ve blob'u temizlenmelidir", async () => {
      const blobPath = "belge_paylasim/stale-pending.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([5, 6, 7]));

      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 saat önce oluşturulmuş
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-stale-pending",
        payloadDigest: "digest-stale",
        tokenHash: "token-stale",
        manageTokenHash: "manage-stale",
        documentId: "beton-dokum-tutanagi",
        blobPathname: blobPath,
        creatorIpHash: "ip-stale",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      });

      // Oluşturulma tarihini 25 saat öncesine çekelim:
      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.createdAt = oldDate;
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
        orphanGraceHours: 24,
      });

      assert.equal(stats.stalePendingCount, 1);
      assert.equal(memoryBlobStore.has(blobPath), false);

      const updated = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(updated?.status, "purged");
    });

    it("24 saatten yeni 'pending' kayıtları henüz finalized olmasa bile silinmemelidir", async () => {
      const blobPath = "belge_paylasim/fresh-pending.pdf";
      await memoryBlobStore.put(blobPath, new Uint8Array([5, 6]));

      const recentDate = new Date(Date.now() - 10 * 60 * 1000); // 10 dakika önce
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-fresh-pending",
        payloadDigest: "digest-fresh",
        tokenHash: "token-fresh",
        manageTokenHash: "manage-fresh",
        documentId: "beton-dokum-tutanagi",
        blobPathname: blobPath,
        creatorIpHash: "ip-fresh",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      });

      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.createdAt = recentDate;
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
        orphanGraceHours: 24,
      });

      assert.equal(stats.stalePendingCount, 0);
      assert.equal(memoryBlobStore.has(blobPath), true);
    });
  });

  describe("6. Yetim (Orphan) Blob Taraması ve İzolasyon", () => {
    it("belge_paylasim/ öneki altındaki ve DB kaydı olmayan 24h eski yetim Blob silinmelidir", async () => {
      const orphanPath = "belge_paylasim/orphan-file-123.pdf";
      await memoryBlobStore.put(orphanPath, new Uint8Array([9, 9, 9]));

      // 25 saat önce yüklenmiş gibi tarihi güncelleyelim:
      // (MemoryBelgeBlobStore list() item.createdAt döner)
      // Store map'indeki createdAt'i değiştirelim
      const item = (memoryBlobStore as unknown as { store: Map<string, { data: Uint8Array; createdAt: Date }> }).store.get(orphanPath);
      if (item) {
        item.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
        orphanGraceHours: 24,
      });

      assert.equal(stats.orphanBlobCount, 1);
      assert.equal(memoryBlobStore.has(orphanPath), false);
    });

    it("Farklı bir önek altındaki (ör. dok_storage/) nesnelere KESİNLİKLE DOKUNULMAMALIDIR", async () => {
      const dokStoragePath = "dok_storage/important-contract.pdf";
      await memoryBlobStore.put(dokStoragePath, new Uint8Array([10, 10, 10]));

      const item = (memoryBlobStore as unknown as { store: Map<string, { data: Uint8Array; createdAt: Date }> }).store.get(dokStoragePath);
      if (item) {
        item.createdAt = new Date(Date.now() - 100 * 60 * 60 * 1000); // 100 saat önce
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
      });

      assert.equal(stats.orphanBlobCount, 0);
      assert.equal(memoryBlobStore.has(dokStoragePath), true);
    });
  });

  describe("7. Mezar Taşı (Tombstone) Temizliği", () => {
    it("30 günden eski 'purged' kayıtları veritabanından tamamen silinmelidir", async () => {
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-tombstone-old",
        payloadDigest: "digest-tomb",
        tokenHash: "token-tomb",
        manageTokenHash: "manage-tomb",
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/tomb-old.pdf",
        creatorIpHash: "ip-tomb",
        expiresAt: new Date(Date.now() - 1000 * 60),
      });
      await memoryRepo.markPurged(rec.id);

      // purgedAt tarihini 35 gün öncesine çekelim:
      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.purgedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
        tombstoneRetentionDays: 30,
      });

      assert.equal(stats.tombstonePurgedCount, 1);
      const remaining = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.equal(remaining, undefined);
    });

    it("30 günden yeni 'purged' kayıtları mezar taşı olarak korunmalıdır", async () => {
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-tombstone-fresh",
        payloadDigest: "digest-fresh-tomb",
        tokenHash: "token-fresh-tomb",
        manageTokenHash: "manage-fresh-tomb",
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/tomb-fresh.pdf",
        creatorIpHash: "ip-fresh-tomb",
        expiresAt: new Date(Date.now() - 1000 * 60),
      });
      await memoryRepo.markPurged(rec.id);

      // purgedAt 5 gün önce:
      const internalRec = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      if (internalRec) {
        internalRec.purgedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository: memoryRepo,
        blobStore: memoryBlobStore,
        tombstoneRetentionDays: 30,
      });

      assert.equal(stats.tombstonePurgedCount, 0);
      const remaining = memoryRepo.getAllRecordsForTest().find((r) => r.id === rec.id);
      assert.ok(remaining);
      assert.equal(remaining?.status, "purged");
    });
  });

  describe("8. Cron Henüz Çalışmasa Bile Anında 410 Expiry Davranışı", () => {
    it("Süresi dolan link, cron henüz Blob'u silmemiş olsa dahi /pdf akışından anında 410 dönmelidir", async () => {
      const rawToken = "raw-view-token-test-expiry-410";
      const tokenH = sha256Hex(rawToken);
      const blobPath = "belge_paylasim/not-yet-croned.pdf";

      await memoryBlobStore.put(blobPath, new Uint8Array([1, 2, 3]));

      // Süresi 1 dakika önce dolmuş:
      const rec = await memoryRepo.createPendingReservation({
        requestIdHash: "req-expiry-instant",
        payloadDigest: "digest-instant",
        tokenHash: tokenH,
        manageTokenHash: "manage-instant",
        documentId: "santiye-sefi-taahhutnamesi",
        blobPathname: blobPath,
        creatorIpHash: "ip-instant",
        expiresAt: new Date(Date.now() - 60 * 1000),
      });
      await memoryRepo.finalizeReady(rec.id, 3, "sha256-mock");

      // Blob hala duruyor (cron henüz çalışmadı)
      assert.equal(memoryBlobStore.has(blobPath), true);

      // PDF akış isteği:
      const req = new Request(`http://localhost/api/belgeler/paylasim/${rawToken}/pdf`, {
        method: "GET",
      });
      const res = await getPdfRoute(req, {
        params: Promise.resolve({ token: rawToken }),
      });

      // Anında 410 Gone dönmeli!
      assert.equal(res.status, 410);
      const text = await res.text();
      assert.ok(text.includes("süresi dolmuştur"));
    });
  });
});
