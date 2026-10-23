import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { POST as createShareRoute, GET as methodNotAllowedCreate } from "../../src/app/api/belgeler/paylasim/route";
import { DELETE as revokeShareRoute, GET as methodNotAllowedRevoke } from "../../src/app/api/belgeler/paylasim/[token]/route";
import {
  MemoryBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  MemoryBelgeBlobStore,
  setBelgeBlobStoreForTest,
} from "../../src/lib/belge-paylasim/blob-store";
import type { BelgePaylasimDocumentId } from "../../src/lib/belge-paylasim/types";

describe("ASAMA_05: Belge Paylaşım API ve Sunucu PDF Üretimi Testleri", () => {
  let memoryRepo: MemoryBelgePaylasimRepository;
  let memoryBlobStore: MemoryBelgeBlobStore;

  beforeEach(() => {
    memoryRepo = new MemoryBelgePaylasimRepository();
    memoryBlobStore = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(memoryRepo);
    setBelgeBlobStoreForTest(memoryBlobStore);
  });

  function createMockRequest(
    body: Record<string, unknown> | string,
    options: {
      headers?: Record<string, string>;
      method?: string;
    } = {}
  ): Request {
    const rawBody = typeof body === "string" ? body : JSON.stringify(body);
    const headers = new Headers({
      "content-type": "application/json; charset=utf-8",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "x-forwarded-for": "127.0.0.1",
      ...(options.headers || {}),
    });

    return new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: options.method || "POST",
      headers,
      body: rawBody,
    });
  }

  // --------------------------------------------------------------------------
  // 1. Her 5 Belge Türü İçin Başarılı POST ve Sunucuda Flatten PDF Üretimi
  // --------------------------------------------------------------------------
  describe("1. Her 5 Belge Türü İçin Başarılı POST ve Sunucu Flatten PDF", () => {
    const samplePayloads: Array<{ docId: BelgePaylasimDocumentId; values: Record<string, string> }> = [
      {
        docId: "beton-dokum-tutanagi",
        values: {
          tarih: "23.10.2026",
          yer: "Kadıköy / İstanbul",
          yibf: "1234567",
          olay_aciklamasi: "Beton dökümü başarıyla tamamlandı.",
        },
      },
      {
        docId: "santiye-sefi-taahhutnamesi",
        values: {
          santiye_sefi_ad_soyad: "Ahmet Yılmaz",
          unvan: "İnşaat Mühendisi",
          oda_sicil_no: "12345",
          tc_kimlik_no: "12345678901",
        },
      },
      {
        docId: "santiye-sefi-istifa-dilekcesi",
        values: {
          tarih: "23.10.2026",
          ad_soyad: "Mehmet Demir",
          unvan: "Şantiye Şefi",
          tc_deger: "98765432109",
        },
      },
      {
        docId: "insaat-ruhsati-dilekcesi",
        values: {
          tarih: "23.10.2026",
          belediye_adi: "Kadıköy Belediyesi",
          mudurluk_adi: "İmar ve Şehircilik Müdürlüğü",
          ad_soyad: "Ayşe Kaya",
        },
      },
      {
        docId: "santiye-sefi-sozlesmesi",
        values: {
          muteahhit_unvan: "Örnek İnşaat Ltd. Şti.",
          santiye_sefi_ad: "Fatma Çelik",
          sozlesme_tarihi: "2026-10-23",
          ucret: "45000",
        },
      },
    ];

    for (const item of samplePayloads) {
      it(`1.${samplePayloads.indexOf(item) + 1} ${item.docId} için PDF üretip 201 Created dönmelidir`, async () => {
        const requestId = `req-test-${item.docId}-${Date.now()}`;
        const req = createMockRequest({
          clientRequestId: requestId,
          documentId: item.docId,
          values: item.values,
        });

        const res = await createShareRoute(req);
        assert.strictEqual(res.status, 201);

        const data = await res.json();
        assert.strictEqual(data.status, "ready");
        assert.strictEqual(data.documentId, item.docId);
        assert.ok(data.viewToken);
        assert.ok(data.manageToken);
        assert.strictEqual(data.url, `/b/${data.viewToken}`);
        assert.ok(data.expiresAt);

        // Header kontrolleri (güvenlik ve noindex)
        assert.strictEqual(res.headers.get("Cache-Control"), "private, no-store, no-cache, must-revalidate");
        assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");
        assert.strictEqual(res.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");

        // Blob store kontrolü
        assert.strictEqual(memoryBlobStore.size(), 1);
        const storedPath = memoryBlobStore.getAllPathnamesForTest()[0];
        assert.ok(storedPath.startsWith("belge_paylasim/"));
        assert.ok(storedPath.endsWith(".pdf"));

        const blobResponse = await memoryBlobStore.get(storedPath);
        assert.ok(blobResponse);
        const buffer = await blobResponse.arrayBuffer();
        const header = Buffer.from(buffer.slice(0, 5)).toString("utf-8");
        assert.strictEqual(header, "%PDF-");
        assert.ok(buffer.byteLength > 1000);

        // Sunucuda AcroForm alanlarının tamamen düzleştirildiğini (flatten: true) doğrula
        const { PDFDocument } = await import("pdf-lib");
        const loadedPdf = await PDFDocument.load(buffer);
        assert.strictEqual(loadedPdf.getForm().getFields().length, 0);
      });
    }
  });

  // --------------------------------------------------------------------------
  // 2. Idempotency ve Çakışma Denetimi
  // --------------------------------------------------------------------------
  describe("2. Idempotency ve Çakışma Denetimi", () => {
    it("2.1 Aynı clientRequestId ve aynı verilerle ikinci POST 200 OK ve aynı bağlantıyı dönmelidir", async () => {
      const requestId = "req-idempotent-api-1";
      const payload = {
        clientRequestId: requestId,
        documentId: "beton-dokum-tutanagi",
        values: { yibf: "5554443", yer: "Beşiktaş" },
      };

      // 1. İstek (201 Created)
      const res1 = await createShareRoute(createMockRequest(payload));
      assert.strictEqual(res1.status, 201);
      const data1 = await res1.json();

      // 2. İstek (Aynı parametrelerle idempotent tekrar -> 200 OK)
      const res2 = await createShareRoute(createMockRequest(payload));
      assert.strictEqual(res2.status, 200);
      const data2 = await res2.json();

      assert.strictEqual(data2.status, "ready");
      assert.strictEqual(data2.url, data1.url);
      assert.strictEqual(data2.viewToken, data1.viewToken);
      assert.strictEqual(data2.manageToken, data1.manageToken);

      // İkinci istekte Blob sayısı artmamalıdır (aynı dosya korunur)
      assert.strictEqual(memoryBlobStore.size(), 1);
    });

    it("2.2 Aynı clientRequestId ile farklı form verisi gönderilirse 409 IDEMPOTENCY_CONFLICT vermelidir", async () => {
      const requestId = "req-conflict-api-1";

      const res1 = await createShareRoute(
        createMockRequest({
          clientRequestId: requestId,
          documentId: "santiye-sefi-istifa-dilekcesi",
          values: { ad_soyad: "Ahmet" },
        })
      );
      assert.strictEqual(res1.status, 201);

      // Farklı veri ile tekrar deneme
      const res2 = await createShareRoute(
        createMockRequest({
          clientRequestId: requestId,
          documentId: "santiye-sefi-istifa-dilekcesi",
          values: { ad_soyad: "Mehmet - Değiştirilmiş" },
        })
      );
      assert.strictEqual(res2.status, 409);
      const err = await res2.json();
      assert.strictEqual(err.error, "IDEMPOTENCY_CONFLICT");
    });
  });

  // --------------------------------------------------------------------------
  // 3. İstek Doğrulama ve Güvenlik Filtresi (Validation & Security)
  // --------------------------------------------------------------------------
  describe("3. İstek Doğrulama ve Güvenlik Filtresi", () => {
    it("3.1 Cross-Site istekleri 403 CROSS_SITE_FORBIDDEN ile engellenmelidir", async () => {
      const req = createMockRequest(
        { clientRequestId: "req-sec-1", documentId: "beton-dokum-tutanagi", values: {} },
        { headers: { "sec-fetch-site": "cross-site" } }
      );
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error, "CROSS_SITE_FORBIDDEN");
    });

    it("3.2 Uyuşmayan Origin başlığı 403 INVALID_ORIGIN ile engellenmelidir", async () => {
      const req = createMockRequest(
        { clientRequestId: "req-sec-2", documentId: "beton-dokum-tutanagi", values: {} },
        { headers: { origin: "https://evil-hacker-site.com" } }
      );
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.error, "INVALID_ORIGIN");
    });

    it("3.3 Yanlış Content-Type 415 UNSUPPORTED_MEDIA_TYPE dönmelidir", async () => {
      const req = createMockRequest(
        JSON.stringify({ clientRequestId: "req-sec-3", documentId: "beton-dokum-tutanagi", values: {} }),
        { headers: { "content-type": "text/plain" } }
      );
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 415);
      const data = await res.json();
      assert.strictEqual(data.error, "UNSUPPORTED_MEDIA_TYPE");
    });

    it("3.4 64 KiB tavanını aşan gövde 413 PAYLOAD_TOO_LARGE dönmelidir", async () => {
      const hugeString = "A".repeat(70 * 1024); // ~70 KiB
      const req = createMockRequest(
        JSON.stringify({
          clientRequestId: "req-large-1",
          documentId: "beton-dokum-tutanagi",
          values: { extra: hugeString },
        })
      );
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 413);
      const data = await res.json();
      assert.strictEqual(data.error, "PAYLOAD_TOO_LARGE");
    });

    it("3.5 Geçersiz JSON sözdizimi 400 INVALID_JSON dönmelidir", async () => {
      const req = createMockRequest("bu geçerli bir json değil {", {
        headers: { "content-type": "application/json" },
      });
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "INVALID_JSON");
    });

    it("3.6 Geçersiz veya kısa clientRequestId 400 dönmelidir", async () => {
      const req = createMockRequest({
        clientRequestId: "short", // < 8 karakter
        documentId: "beton-dokum-tutanagi",
        values: {},
      });
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "INVALID_CLIENT_REQUEST_ID");
    });

    it("3.7 Desteklenmeyen belge türü 400 UNSUPPORTED_DOCUMENT dönmelidir", async () => {
      const req = createMockRequest({
        clientRequestId: "req-valid-12345",
        documentId: "bilinmeyen-belge",
        values: {},
      });
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "UNSUPPORTED_DOCUMENT");
    });

    it("3.8 Form allowlist dışı alanlar 400 UNKNOWN_FIELD dönmelidir", async () => {
      const req = createMockRequest({
        clientRequestId: "req-valid-12345",
        documentId: "beton-dokum-tutanagi",
        values: { bu_alan_belgede_yok: "zararlı kod veya yabancı veri" },
      });
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "UNKNOWN_FIELD");
    });

    it("3.9 2000 karakteri aşan form alanı 400 FIELD_TOO_LONG dönmelidir", async () => {
      const req = createMockRequest({
        clientRequestId: "req-valid-12345",
        documentId: "beton-dokum-tutanagi",
        values: { yer: "B".repeat(2001) },
      });
      const res = await createShareRoute(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "FIELD_TOO_LONG");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Kota Aşımı (Rate Limit) ve HTTP 429
  // --------------------------------------------------------------------------
  describe("4. Kota Aşımı ve HTTP 429", () => {
    it("4.1 15 dakikada 3 bağlantı sonrası 4. istek 429 ve Retry-After: 900 almalıdır", async () => {
      const ip = "192.168.1.50";

      for (let i = 1; i <= 3; i++) {
        const res = await createShareRoute(
          createMockRequest(
            {
              clientRequestId: `req-quota-${i}-${Date.now()}`,
              documentId: "beton-dokum-tutanagi",
              values: {},
            },
            { headers: { "x-forwarded-for": ip } }
          )
        );
        assert.strictEqual(res.status, 201);
      }

      // 4. İstek
      const res4 = await createShareRoute(
        createMockRequest(
          {
            clientRequestId: `req-quota-4-${Date.now()}`,
            documentId: "beton-dokum-tutanagi",
            values: {},
          },
          { headers: { "x-forwarded-for": ip } }
        )
      );

      assert.strictEqual(res4.status, 429);
      assert.strictEqual(res4.headers.get("Retry-After"), "900");
      const data = await res4.json();
      assert.strictEqual(data.error, "QUOTA_EXCEEDED");
    });
  });

  // --------------------------------------------------------------------------
  // 5. DELETE /api/belgeler/paylasim/[token] (İptal ve Yetki Denetimi)
  // --------------------------------------------------------------------------
  describe("5. DELETE /api/belgeler/paylasim/[token] İptal Rotaları", () => {
    it("5.1 Başarılı iptal: DB revoke edilir, Blob silinir ve anında 200 revoked döner", async () => {
      // Önce bir bağlantı oluşturalım
      const createRes = await createShareRoute(
        createMockRequest({
          clientRequestId: "req-delete-success-1",
          documentId: "santiye-sefi-sozlesmesi",
          values: { santiye_sefi_ad: "Ahmet" },
        })
      );
      assert.strictEqual(createRes.status, 201);
      const created = await createRes.json();

      assert.strictEqual(memoryBlobStore.size(), 1);

      // İptal isteği gönder
      const deleteReq = new Request(
        `http://localhost:3000/api/belgeler/paylasim/${created.viewToken}`,
        {
          method: "DELETE",
          headers: {
            "x-manage-token": created.manageToken,
          },
        }
      );

      const deleteRes = await revokeShareRoute(deleteReq, {
        params: Promise.resolve({ token: created.viewToken }),
      });

      assert.strictEqual(deleteRes.status, 200);
      const deleteData = await deleteRes.json();
      assert.strictEqual(deleteData.status, "revoked");
      assert.ok(deleteData.revokedAt);

      // Blob silinmiş olmalı
      assert.strictEqual(memoryBlobStore.size(), 0);

      // Tekrar silme denemesi idempotent olarak 200 dönmeli
      const secondDeleteRes = await revokeShareRoute(deleteReq, {
        params: Promise.resolve({ token: created.viewToken }),
      });
      assert.strictEqual(secondDeleteRes.status, 200);

      // İptal edilen link ile tekrar POST yapılırsa 410 LINK_REVOKED dönmeli
      const replayPost = await createShareRoute(
        createMockRequest({
          clientRequestId: "req-delete-success-1",
          documentId: "santiye-sefi-sozlesmesi",
          values: { santiye_sefi_ad: "Ahmet" },
        })
      );
      assert.strictEqual(replayPost.status, 410);
    });

    it("5.2 x-manage-token başlığı eksikse 400 MISSING_MANAGE_TOKEN dönmelidir", async () => {
      const deleteReq = new Request(
        "http://localhost:3000/api/belgeler/paylasim/view-token-12345",
        {
          method: "DELETE",
        }
      );

      const deleteRes = await revokeShareRoute(deleteReq, {
        params: Promise.resolve({ token: "view-token-12345" }),
      });

      assert.strictEqual(deleteRes.status, 400);
      const data = await deleteRes.json();
      assert.strictEqual(data.error, "MISSING_MANAGE_TOKEN");
    });

    it("5.3 Bilinmeyen token 404 NOT_FOUND dönmelidir", async () => {
      const deleteReq = new Request(
        "http://localhost:3000/api/belgeler/paylasim/unknown-token",
        {
          method: "DELETE",
          headers: { "x-manage-token": "some-manage-token" },
        }
      );

      const deleteRes = await revokeShareRoute(deleteReq, {
        params: Promise.resolve({ token: "unknown-token" }),
      });

      assert.strictEqual(deleteRes.status, 404);
      const data = await deleteRes.json();
      assert.strictEqual(data.error, "NOT_FOUND");
    });

    it("5.4 Başka bağlantının yönetim anahtarı ile silme denemesi 403 FORBIDDEN dönmelidir", async () => {
      // 1. Bağlantı
      const res1 = await createShareRoute(
        createMockRequest({
          clientRequestId: "req-share-one",
          documentId: "beton-dokum-tutanagi",
          values: {},
        })
      );
      const data1 = await res1.json();

      // 2. Bağlantı
      const res2 = await createShareRoute(
        createMockRequest({
          clientRequestId: "req-share-two",
          documentId: "beton-dokum-tutanagi",
          values: {},
        })
      );
      const data2 = await res2.json();

      // 1. Bağlantıyı 2. Bağlantının manageToken'ı ile silmeyi dene
      const deleteReq = new Request(
        `http://localhost:3000/api/belgeler/paylasim/${data1.viewToken}`,
        {
          method: "DELETE",
          headers: { "x-manage-token": data2.manageToken }, // Başkasının anahtarı!
        }
      );

      const deleteRes = await revokeShareRoute(deleteReq, {
        params: Promise.resolve({ token: data1.viewToken }),
      });

      assert.strictEqual(deleteRes.status, 403);
      const err = await deleteRes.json();
      assert.strictEqual(err.error, "FORBIDDEN");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Yanlış HTTP Yöntemleri (405 Method Not Allowed)
  // --------------------------------------------------------------------------
  describe("6. İzin Verilmeyen Yöntemler (405)", () => {
    it("6.1 GET /api/belgeler/paylasim 405 Method Not Allowed dönmelidir", async () => {
      const res = await methodNotAllowedCreate();
      assert.strictEqual(res.status, 405);
      assert.strictEqual(res.headers.get("Allow"), "POST");
    });

    it("6.2 GET /api/belgeler/paylasim/[token] 405 Method Not Allowed dönmelidir", async () => {
      const res = await methodNotAllowedRevoke();
      assert.strictEqual(res.status, 405);
      assert.strictEqual(res.headers.get("Allow"), "DELETE");
    });
  });
});
