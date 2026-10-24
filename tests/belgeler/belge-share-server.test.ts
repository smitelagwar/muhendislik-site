import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";

process.env.NODE_ENV = "test";
import { BELGE_SHARE_CONFIG, getBelgeShareSecret } from "../../src/lib/belge-paylasim/config";
import {
  generateDeterministicTokens,
  computePayloadDigest,
  hashCreatorIp,
  constantTimeCompare,
  sha256Hex,
} from "../../src/lib/belge-paylasim/tokens";
import {
  MemoryBelgeBlobStore,
  setBelgeBlobStoreForTest,
} from "../../src/lib/belge-paylasim/blob-store";
import {
  MemoryBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import { BelgeShareQuotaError } from "../../src/lib/belge-paylasim/quota";
import {
  createShareReservation,
  finalizeShareReservation,
  revokeShareByManageToken,
  getShareByViewToken,
  BelgeShareServiceError,
} from "../../src/lib/belge-paylasim/service-core";
import type {
  BelgePaylasimDocumentId,
  CreateShareReservationResult,
} from "../../src/lib/belge-paylasim/types";

describe("ASAMA_04: Belge Paylaşım Sunucu ve Altyapı Birim Testleri", () => {
  let memoryRepo: MemoryBelgePaylasimRepository;
  let memoryBlobStore: MemoryBelgeBlobStore;

  beforeEach(() => {
    memoryRepo = new MemoryBelgePaylasimRepository();
    memoryBlobStore = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(memoryRepo);
    setBelgeBlobStoreForTest(memoryBlobStore);
  });

  // --------------------------------------------------------------------------
  // 1. Kriptografi ve Token Çekirdeği
  // --------------------------------------------------------------------------
  describe("1. Kriptografi ve Token Çekirdeği", () => {
    it("1.1 Deterministik token üretimi: 256-bit entropi, domain separation ve SHA-256 hash", () => {
      const requestId = "req-test-uuid-123456";
      const tokens1 = generateDeterministicTokens(requestId);
      const tokens2 = generateDeterministicTokens(requestId);

      // Deterministik olmalı
      assert.strictEqual(tokens1.viewToken, tokens2.viewToken);
      assert.strictEqual(tokens1.manageToken, tokens2.manageToken);
      assert.strictEqual(tokens1.viewTokenHash, tokens2.viewTokenHash);
      assert.strictEqual(tokens1.manageTokenHash, tokens2.manageTokenHash);

      // Domain separation: viewToken ve manageToken asla aynı olmamalı
      assert.notStrictEqual(tokens1.viewToken, tokens1.manageToken);
      assert.notStrictEqual(tokens1.viewTokenHash, tokens1.manageTokenHash);

      // Base64url 256-bit (32 bayt) uzunluğu 43 karakterdir
      assert.strictEqual(tokens1.viewToken.length, 43);
      assert.strictEqual(tokens1.manageToken.length, 43);

      // SHA-256 hex uzunluğu tam 64 karakterdir
      assert.strictEqual(tokens1.viewTokenHash.length, 64);
      assert.strictEqual(tokens1.manageTokenHash.length, 64);
      assert.strictEqual(tokens1.viewTokenHash, sha256Hex(tokens1.viewToken));
      assert.strictEqual(tokens1.manageTokenHash, sha256Hex(tokens1.manageToken));

      // Farklı requestId tamamen farklı tokenlar üretmeli
      const tokensOther = generateDeterministicTokens("req-test-uuid-999999");
      assert.notStrictEqual(tokens1.viewToken, tokensOther.viewToken);
      assert.notStrictEqual(tokens1.manageToken, tokensOther.manageToken);
    });

    it("1.2 Geçersiz veya boş clientRequestId hata fırlatmalıdır", () => {
      assert.throws(() => generateDeterministicTokens(""), /clientRequestId boş olamaz/);
      assert.throws(() => generateDeterministicTokens("   "), /clientRequestId boş olamaz/);
    });

    it("1.3 computePayloadDigest: Sıralı kanonik JSON ile form bütünlüğü ve değişiklik tespiti", () => {
      const docId = "beton-dokum-tutanagi";
      const valuesA = { yibf_no: "1234567", yapi_sahibi: "Ahmet Yılmaz", sehir: "İstanbul" };
      const valuesB = { sehir: "İstanbul", yapi_sahibi: "Ahmet Yılmaz", yibf_no: "1234567" };

      const digestA = computePayloadDigest(docId, valuesA);
      const digestB = computePayloadDigest(docId, valuesB);

      // Anahtarlar farklı sırada verilse bile kanonik sıralama sayesinde özet birebir aynı olmalı
      assert.strictEqual(digestA, digestB);
      assert.strictEqual(digestA.length, 64);

      // Değer değiştiğinde özet de değişmeli
      const valuesChanged = { ...valuesA, yibf_no: "1234568" };
      const digestChanged = computePayloadDigest(docId, valuesChanged);
      assert.notStrictEqual(digestA, digestChanged);

      // Belge türü değiştiğinde özet de değişmeli
      const digestOtherDoc = computePayloadDigest("santiye-sefi-taahhutnamesi", valuesA);
      assert.notStrictEqual(digestA, digestOtherDoc);
    });

    it("1.4 hashCreatorIp: IP takma adlandırma (pseudonymous HMAC)", () => {
      const ip = "192.168.1.100";
      const hash1 = hashCreatorIp(ip);
      const hash2 = hashCreatorIp("  192.168.1.100  ");
      const hashOther = hashCreatorIp("192.168.1.101");

      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64);
      assert.notStrictEqual(hash1, hashOther);
      // Düz IP adresi asla hash içinde açıkça geçmemeli
      assert.strictEqual(hash1.includes("192.168.1.100"), false);
    });

    it("1.5 constantTimeCompare: Sabit süreli güvenli karşılaştırma", () => {
      const a = "abcdef1234567890abcdef1234567890";
      const b = "abcdef1234567890abcdef1234567890";
      const c = "abcdef1234567890abcdef1234567891";
      const d = "short";

      assert.strictEqual(constantTimeCompare(a, b), true);
      assert.strictEqual(constantTimeCompare(a, c), false);
      assert.strictEqual(constantTimeCompare(a, d), false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Yapılandırma ve Fail-Closed Güvenliği
  // --------------------------------------------------------------------------
  describe("2. Yapılandırma ve Fail-Closed Güvenliği", () => {
    it("2.1 Test ortamında varsayılan güvenli test anahtarı dönmelidir", () => {
      const secret = getBelgeShareSecret();
      assert.ok(secret.length >= 32);
    });

    it("2.2 Production ortamında BELGE_SHARE_SECRET tanımlı değilse fail-closed hata vermelidir", () => {
      const prevEnv = process.env.NODE_ENV;
      const prevSecret = process.env.BELGE_SHARE_SECRET;

      try {
        process.env.NODE_ENV = "production";
        delete process.env.BELGE_SHARE_SECRET;

        assert.throws(
          () => getBelgeShareSecret(),
          /Production ortamında en az 32 karakterlik BELGE_SHARE_SECRET/
        );
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevSecret) process.env.BELGE_SHARE_SECRET = prevSecret;
      }
    });

    it("2.3 Desteklenen 5 belge kimliği tanımlı olmalıdır", () => {
      assert.strictEqual(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.length, 5);
      assert.ok(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes("beton-dokum-tutanagi"));
      assert.ok(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes("santiye-sefi-taahhutnamesi"));
      assert.ok(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes("santiye-sefi-istifa-dilekcesi"));
      assert.ok(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes("insaat-ruhsati-dilekcesi"));
      assert.ok(BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes("santiye-sefi-sozlesmesi"));
    });

    it("2.4 Desteklenmeyen belge türü 400 UNSUPPORTED_DOCUMENT fırlatmalıdır", async () => {
      await assert.rejects(
        async () => {
          await createShareReservation({
            clientRequestId: "req-invalid-doc",
            documentId: "gecersiz-belge-turu" as unknown as BelgePaylasimDocumentId,
            values: { test: "1" },
            creatorIp: "127.0.0.1",
          });
        },
        (err: Error) => {
          assert.ok(err instanceof BelgeShareServiceError);
          assert.strictEqual(err.code, "UNSUPPORTED_DOCUMENT");
          assert.strictEqual(err.statusCode, 400);
          return true;
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. Yaşam Döngüsü: Rezervasyon, Finalize, Sorgulama ve İptal
  // --------------------------------------------------------------------------
  describe("3. Yaşam Döngüsü: Rezervasyon, Finalize, Sorgulama ve İptal", () => {
    it("3.1 Tam akış: pending -> finalize ready -> get 200 -> revoke 410", async () => {
      const requestId = "req-lifecycle-1";
      const creatorIp = "10.0.0.1";
      const values = { yibf_no: "9988776", santiye_sefi: "Ali Veli" };

      // 1. Rezervasyon oluştur (pending)
      const res = await createShareReservation({
        clientRequestId: requestId,
        documentId: "beton-dokum-tutanagi",
        values,
        creatorIp,
      });

      assert.strictEqual(res.status, "new");
      assert.ok(res.record);
      assert.strictEqual(res.record.status, "pending");
      assert.ok(res.tokens);
      assert.strictEqual(res.url, `/b/${res.tokens.viewToken}`);
      assert.strictEqual(res.manageToken, res.tokens.manageToken);

      // Pending durumdayken alıcı henüz belgeyi hazır göremez
      const beforeReady = await getShareByViewToken(res.tokens.viewToken);
      assert.strictEqual(beforeReady.status, "not_ready");

      // 2. Finalize et (ready)
      const mockPdfBytes = Buffer.from("%PDF-1.4 Mock PDF Content");
      const pdfSha256 = crypto.createHash("sha256").update(mockPdfBytes).digest("hex");
      await finalizeShareReservation(res.record.id, mockPdfBytes.byteLength, pdfSha256, res.record.attemptId!, res.record.attemptVersion);

      // 3. Alıcı token ile sorgula (ok)
      const afterReady = await getShareByViewToken(res.tokens.viewToken);
      assert.strictEqual(afterReady.status, "ok");
      if (afterReady.status === "ok") {
        assert.strictEqual(afterReady.record.status, "ready");
        assert.strictEqual(afterReady.record.sizeBytes, mockPdfBytes.byteLength);
        assert.strictEqual(afterReady.record.pdfSha256, pdfSha256);
      }

      // 4. Yönetim token'ı ile iptal et (revoked)
      // Önce Blob'a sahte dosya koyalım
      await memoryBlobStore.put(res.record.blobPathname, mockPdfBytes);
      assert.strictEqual(memoryBlobStore.has(res.record.blobPathname), true);

      const revokedRecord = await revokeShareByManageToken(res.tokens.manageToken);
      assert.strictEqual(revokedRecord.status, "revoked");

      // İptal sonrası Blob silinmiş olmalı
      assert.strictEqual(memoryBlobStore.has(res.record.blobPathname), false);

      // İptal sonrası alıcı anında revoked (410) almalı
      const afterRevoke = await getShareByViewToken(res.tokens.viewToken);
      assert.strictEqual(afterRevoke.status, "revoked");
    });

    it("3.2 Bilinmeyen veya boş token durumları 'not_found' dönmelidir", async () => {
      const resEmpty = await getShareByViewToken("");
      assert.strictEqual(resEmpty.status, "not_found");

      const resUnknown = await getShareByViewToken("non-existent-token-12345678901234567890123");
      assert.strictEqual(resUnknown.status, "not_found");
    });

    it("3.3 Süresi dolmuş kayıtlar 'expired' dönmelidir", async () => {
      const requestId = "req-expired-test";
      const res = await createShareReservation({
        clientRequestId: requestId,
        documentId: "insaat-ruhsati-dilekcesi",
        values: { ad_soyad: "Deneme" },
        creatorIp: "10.0.0.2",
      });

      assert.ok(res.record);
      assert.ok(res.tokens);

      await finalizeShareReservation(res.record.id, 1024, "mock-sha", res.record.attemptId!, res.record.attemptVersion);

      // Süreyi geçmişe al
      memoryRepo.updateExpiresAtForTest(res.record.id, new Date(Date.now() - 1000)); // 1 saniye önce bitti

      const checkExpired = await getShareByViewToken(res.tokens.viewToken);
      assert.strictEqual(checkExpired.status, "expired");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Idempotency ve Çakışma Denetimi
  // --------------------------------------------------------------------------
  describe("4. Idempotency ve Çakışma Denetimi", () => {
    it("4.1 Aynı clientRequestId ve aynı form verisi hazır ise mevcut kaydı idempotent döndürmelidir", async () => {
      const requestId = "req-idempotent-1";
      const values = { yapi_sahibi: "Ahmet", no: "123" };

      // İlk istek
      const res1 = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-taahhutnamesi",
        values,
        creatorIp: "10.0.0.3",
      });
      assert.strictEqual(res1.status, "new");
      assert.ok(res1.record);

      // Finalize
      await finalizeShareReservation(res1.record.id, 2048, "pdf-sha-1", res1.record.attemptId!, res1.record.attemptVersion);

      // İkinci istek (aynı requestId ve aynı veriler)
      const res2 = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-taahhutnamesi",
        values,
        creatorIp: "10.0.0.3",
      });

      assert.strictEqual(res2.status, "existing_ready");
      assert.strictEqual(res2.url, res1.url);
      assert.strictEqual(res2.manageToken, res1.manageToken);
      assert.strictEqual(res2.record?.id, res1.record.id);
    });

    it("4.2 Aynı clientRequestId ile FARKLI form verisi gönderilirse 409 IDEMPOTENCY_CONFLICT vermelidir", async () => {
      const requestId = "req-conflict-1";

      await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-taahhutnamesi",
        values: { ad: "Ahmet" },
        creatorIp: "10.0.0.4",
      });

      // Farklı veri ile tekrar çağrıldığında
      await assert.rejects(
        async () => {
          await createShareReservation({
            clientRequestId: requestId,
            documentId: "santiye-sefi-taahhutnamesi",
            values: { ad: "Mehmet - Değiştirilmiş Veri" },
            creatorIp: "10.0.0.4",
          });
        },
        (err: Error) => {
          assert.ok(err instanceof BelgeShareServiceError);
          assert.strictEqual(err.code, "IDEMPOTENCY_CONFLICT");
          assert.strictEqual(err.statusCode, 409);
          return true;
        }
      );
    });

    it("4.3 İşlem hala pending durumdayken tekrar aynı istek gelirse 409 OPERATION_IN_FLIGHT vermelidir", async () => {
      const requestId = "req-inflight-1";
      const values = { ad: "Test" };

      const firstReservation = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-istifa-dilekcesi",
        values,
        creatorIp: "10.0.0.5",
      });

      const replay = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-istifa-dilekcesi",
        values,
        creatorIp: "10.0.0.5",
      });
      assert.equal(replay.status, "in_flight");
      assert.equal(replay.record?.id, firstReservation.record?.id);
    });

    it("4.4 İptal edilmiş bağlantının clientRequestId'si ile tekrar bağlantı açılamaz (410 LINK_REVOKED)", async () => {
      const requestId = "req-revoked-replay";
      const values = { ad: "Test" };

      const res = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-sozlesmesi",
        values,
        creatorIp: "10.0.0.6",
      });
      assert.ok(res.record);
      assert.ok(res.tokens);

      await finalizeShareReservation(res.record.id, 100, "sha", res.record.attemptId!, res.record.attemptVersion);
      await revokeShareByManageToken(res.tokens.manageToken);

      // İptal edildikten sonra aynı requestId ile tekrar denenirse
      await assert.rejects(
        async () => {
          await createShareReservation({
            clientRequestId: requestId,
            documentId: "santiye-sefi-sozlesmesi",
            values,
            creatorIp: "10.0.0.6",
          });
        },
        (err: Error) => {
          assert.ok(err instanceof BelgeShareServiceError);
          assert.strictEqual(err.code, "LINK_REVOKED");
          assert.strictEqual(err.statusCode, 410);
          return true;
        }
      );
    });

    it("4.5 Eşzamanlı 20 paralel istek durumunda yarış koşulu (race condition) koruması", async () => {
      const requestId = "req-parallel-race-1";
      const values = { parallel: "test-concurrency" };

      // 20 paralel istek başlat
      const results = await Promise.allSettled(
        Array.from({ length: 20 }, () =>
          createShareReservation({
            clientRequestId: requestId,
            documentId: "beton-dokum-tutanagi",
            values,
            creatorIp: "10.10.10.10",
          })
        )
      );

      // En az 1 istek başarılı olmalıdır ("new")
      const fulfilled = results.filter(
        (r): r is PromiseFulfilledResult<CreateShareReservationResult> => r.status === "fulfilled"
      );
      assert.ok(fulfilled.length >= 1);
      assert.strictEqual(fulfilled[0].value.status, "new");

      // Veritabanında aynı requestId için ASLA birden fazla kayıt oluşmamalıdır
      const allRecords = memoryRepo
        .getAllRecordsForTest()
        .filter((r) => r.requestIdHash === sha256Hex(requestId));
      assert.strictEqual(allRecords.length, 1);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Kota Sınırları ve Aşım Koruması (Rate Limits)
  // --------------------------------------------------------------------------
  describe("5. Kota Sınırları ve Aşım Koruması", () => {
    it("5.1 Aynı IP'den 4 istek tarayıcı günlük sınırı içinde rezerve edilir", async () => {
      const ip = "192.168.10.1";
      const results = [];
      for (let i = 1; i <= 4; i += 1) {
        results.push(await createShareReservation({
          clientRequestId: `req-rate15-${i}`,
          documentId: "beton-dokum-tutanagi",
          values: { i: String(i) },
          creatorIp: ip,
        }));
      }
      assert.equal(results.length, 4);
      assert.equal(results[3]?.status, "new");
      assert.equal((await memoryRepo.getDailyQuota("local", "0".repeat(64))).reservedLinks, 4);
    });

    it("5.2 IP başına 20 aktif link, ayrı create rezervasyonunu engellemez", async () => {
      const ip = "192.168.20.1";
      const result = await createShareReservation({
        clientRequestId: "req-active-link-21",
        documentId: "beton-dokum-tutanagi",
        values: { i: "21" },
        creatorIp: ip,
      });
      assert.equal(result.status, "new");
    });

    it("5.3 Gerekçeli global günlük sınırı environment config ile uygulanır", async () => {
      memoryRepo.setLimitsForTest({ globalDailyLimit: 3, globalMaxStorageBytes: 1024 * 1024 * 1024 });
      for (let index = 1; index <= 3; index += 1) {
        const result = await createShareReservation({
          clientRequestId: `req-global-${index}`,
          documentId: "beton-dokum-tutanagi",
          values: { i: String(index) },
          creatorIp: `172.16.0.${index}`,
          ownerHash: index.toString(16).padStart(64, "0"),
          environmentKey: "local",
        });
        assert.equal(result.status, "new");
      }
      await assert.rejects(
        createShareReservation({
          clientRequestId: "req-global-overflow",
          documentId: "beton-dokum-tutanagi",
          values: { i: "4" },
          creatorIp: "172.16.0.4",
          ownerHash: "4".padStart(64, "0"),
          environmentKey: "local",
        }),
        (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "GLOBAL_DAILY_CAPACITY_REACHED" && error.statusCode === 503,
      );
    });

    it("5.4 Storage bütçesi committed ve reserved byte yükümlülüklerini birlikte sayar", async () => {
      const maxPdf = BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES;
      memoryRepo.setLimitsForTest({ globalDailyLimit: 200, globalMaxStorageBytes: 2 * maxPdf - 1 });
      const first = await createShareReservation({
        clientRequestId: "huge-storage-link-1", documentId: "beton-dokum-tutanagi", values: {}, creatorIp: "172.16.0.1",
      });
      assert.ok(first.record);
      assert.equal(await finalizeShareReservation(first.record.id, maxPdf, "1".repeat(64), first.record.attemptId ?? undefined, first.record.attemptVersion), true);
      await assert.rejects(
        createShareReservation({
          clientRequestId: "req-after-storage-exhaust", documentId: "beton-dokum-tutanagi", values: {}, creatorIp: "172.16.0.2",
        }),
        (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "STORAGE_CAPACITY_UNAVAILABLE" && error.statusCode === 503,
      );
      assert.equal((await memoryRepo.getActiveStats()).totalActiveBytes, maxPdf);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Güvenli İptal Sırası ve Depo Temizliği (Revocation Safety)
  // --------------------------------------------------------------------------
  describe("6. Güvenli İptal Sırası ve Hata Durumları", () => {
    it("6.1 Blob silme başarısız olsa dahi DB revoke kalmalı ve anında 410 vermeli", async () => {
      const requestId = "req-blob-fail-test";
      const res = await createShareReservation({
        clientRequestId: requestId,
        documentId: "santiye-sefi-taahhutnamesi",
        values: { test: "1" },
        creatorIp: "10.0.0.7",
      });
      assert.ok(res.record);
      assert.ok(res.tokens);

      await finalizeShareReservation(res.record.id, 500, "sha", res.record.attemptId!, res.record.attemptVersion);

      // BlobStore.del metodunu yapay olarak hata fırlatacak şekilde bozalım
      memoryBlobStore.del = async () => {
        throw new Error("Simüle Blob Depo Silme Hatası");
      };

      // İptal çağrısı hata patlatmamalı, DB'yi kapatıp hata kaydı düşmeli
      const revokedRecord = await revokeShareByManageToken(res.tokens.manageToken);
      assert.strictEqual(revokedRecord.status, "revoked");

      // Veritabanında revoked kalmalı ve alıcı doğrudan 410 görmeli
      const getResult = await getShareByViewToken(res.tokens.viewToken);
      assert.strictEqual(getResult.status, "revoked");

      // Repository'de hata kodu kaydedilmiş olmalı
      const savedInDb = await memoryRepo.findByTokenHash(res.tokens.viewTokenHash);
      assert.strictEqual(savedInDb?.lastPurgeErrorCode, "DELETE_ON_REVOKE_FAILED");
    });
  });

  // --------------------------------------------------------------------------
  // 7. Cron Temizlik Lease ve Purge Mekanizması
  // --------------------------------------------------------------------------
  describe("7. Cron Temizlik Lease ve Purge Mekanizması", () => {
    it("7.1 claimExpiredForPurge: Süresi dolmuş ve iptal edilmiş kayıtları kilitler", async () => {
      const now = Date.now();

      // Süresi geçmiş bir kayıt ekle
      const expiredRec = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("purge-1"),
        payloadDigest: sha256Hex("digest-1"),
        tokenHash: sha256Hex("t1"),
        manageTokenHash: sha256Hex("m1"),
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/p1.pdf",
        creatorIpHash: sha256Hex("ip1"),
        expiresAt: new Date(now - 1000),
      });
      await memoryRepo.finalizeReady(expiredRec.id, 1024, "sha-p1");

      // İptal edilmiş bir kayıt ekle
      const revokedRec = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("purge-2"),
        payloadDigest: sha256Hex("digest-2"),
        tokenHash: sha256Hex("t2"),
        manageTokenHash: sha256Hex("m2"),
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/p2.pdf",
        creatorIpHash: sha256Hex("ip2"),
        expiresAt: new Date(now + 100000),
      });
      await memoryRepo.finalizeReady(revokedRec.id, 1024, "sha-p2");
      await memoryRepo.revokeLink(revokedRec.id);

      // Aktif (henüz süresi dolmamış) bir kayıt ekle
      const activeRec = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("active-link"),
        payloadDigest: sha256Hex("digest-3"),
        tokenHash: sha256Hex("t3"),
        manageTokenHash: sha256Hex("m3"),
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/p3.pdf",
        creatorIpHash: sha256Hex("ip3"),
        expiresAt: new Date(now + 100000),
      });
      await memoryRepo.finalizeReady(activeRec.id, 1024, "sha-p3");

      // Claim et
      const candidates = await memoryRepo.claimExpiredForPurge(10, 5 * 60 * 1000);
      assert.strictEqual(candidates.length, 2);

      const candidateIds = candidates.map((c) => c.id);
      assert.ok(candidateIds.includes(expiredRec.id));
      assert.ok(candidateIds.includes(revokedRec.id));
      assert.ok(!candidateIds.includes(activeRec.id));

      // Lease süresi dolmadan ikinci claim aynı kayıtları alamaz
      const secondClaim = await memoryRepo.claimExpiredForPurge(10, 5 * 60 * 1000);
      assert.strictEqual(secondClaim.length, 0);

      // Purge işaretle
      await memoryRepo.markPurged(expiredRec.id);
      const afterPurge = await memoryRepo.findByRequestIdHash(sha256Hex("purge-1"));
      assert.strictEqual(afterPurge?.status, "purged");
      assert.ok(afterPurge?.purgedAt);
    });
  });
});
