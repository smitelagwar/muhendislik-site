import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  GET as getPdfStreamRoute,
  HEAD as headPdfStreamRoute,
  POST as postPdfStreamRoute,
  DELETE as deletePdfStreamRoute,
} from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import BelgeViewerPage from "../../src/app/b/[token]/page";
import { metadata as viewerMetadata } from "../../src/app/b/[token]/layout";
import robotsConfig from "../../src/app/robots";
import {
  MemoryBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  MemoryBelgeBlobStore,
  setBelgeBlobStoreForTest,
} from "../../src/lib/belge-paylasim/blob-store";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";

const testViewToken = (seed: string) => createHash("sha256").update(seed).digest("base64url");

describe("ASAMA_06: Salt-Okunur PDF Viewer ve /b Rotası Testleri", () => {
  let memoryRepo: MemoryBelgePaylasimRepository;
  let memoryBlobStore: MemoryBelgeBlobStore;

  beforeEach(() => {
    memoryRepo = new MemoryBelgePaylasimRepository();
    memoryBlobStore = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(memoryRepo);
    setBelgeBlobStoreForTest(memoryBlobStore);
  });

  // --------------------------------------------------------------------------
  // 1. GET /api/belgeler/paylasim/[token]/pdf Akış Rotaları
  // --------------------------------------------------------------------------
  describe("1. GET /api/belgeler/paylasim/[token]/pdf Akış Rotaları", () => {
    it("1.1 Hazır ve geçerli token için 200 OK, inline PDF başlığı ve stream dönmelidir", async () => {
      const viewToken = testViewToken("valid-view-token");
      const viewTokenHash = sha256Hex(viewToken);
      const mockPdfBytes = Buffer.from("%PDF-1.4 Mock Stream Content");

      // Depoya koy
      const blobPath = "belge_paylasim/mock-stream.pdf";
      await memoryBlobStore.put(blobPath, mockPdfBytes);

      // Veritabanına ready kayıt aç
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-stream-1"),
        payloadDigest: sha256Hex("digest-stream-1"),
        tokenHash: viewTokenHash,
        manageTokenHash: sha256Hex("manage-stream-1"),
        documentId: "beton-dokum-tutanagi",
        blobPathname: blobPath,
        creatorIpHash: sha256Hex("ip-stream-1"),
        expiresAt: new Date(Date.now() + 1000000),
      });
      await memoryRepo.finalizeReady(record.id, mockPdfBytes.byteLength, "mock-sha");

      // GET isteği yap
      const req = new Request(`http://localhost:3000/api/belgeler/paylasim/${viewToken}/pdf`);
      const res = await getPdfStreamRoute(req, {
        params: Promise.resolve({ token: viewToken }),
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("Content-Type"), "application/pdf");
      assert.strictEqual(res.headers.get("Content-Disposition"), 'inline; filename="paylasilan-belge.pdf"');
      assert.strictEqual(res.headers.get("Cache-Control"), "private, no-store, no-cache, must-revalidate");
      assert.strictEqual(res.headers.get("X-Robots-Tag"), "noindex, nofollow, noarchive");
      assert.strictEqual(res.headers.get("X-Content-Type-Options"), "nosniff");

      const bodyBuffer = await res.arrayBuffer();
      assert.strictEqual(Buffer.from(bodyBuffer).toString(), "%PDF-1.4 Mock Stream Content");
    });

    it("1.2 HEAD isteği 200 OK ve başlıkları dönmeli, gövde boş olmalıdır", async () => {
      const viewToken = testViewToken("valid-head-token");
      const viewTokenHash = sha256Hex(viewToken);
      const mockPdfBytes = Buffer.from("%PDF-1.4 Mock Head Content");
      const blobPath = "belge_paylasim/mock-head.pdf";
      await memoryBlobStore.put(blobPath, mockPdfBytes);

      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-head-1"),
        payloadDigest: sha256Hex("digest-head-1"),
        tokenHash: viewTokenHash,
        manageTokenHash: sha256Hex("manage-head-1"),
        documentId: "santiye-sefi-taahhutnamesi",
        blobPathname: blobPath,
        creatorIpHash: sha256Hex("ip-head-1"),
        expiresAt: new Date(Date.now() + 1000000),
      });
      await memoryRepo.finalizeReady(record.id, mockPdfBytes.byteLength, "mock-sha");

      const req = new Request(`http://localhost:3000/api/belgeler/paylasim/${viewToken}/pdf`, {
        method: "HEAD",
      });
      let blobReads = 0;
      const originalGet = memoryBlobStore.get.bind(memoryBlobStore);
      memoryBlobStore.get = async (pathname) => {
        blobReads += 1;
        return originalGet(pathname);
      };
      const res = await headPdfStreamRoute(req, {
        params: Promise.resolve({ token: viewToken }),
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("Content-Type"), "application/pdf");
      assert.strictEqual(res.headers.get("Content-Length"), String(mockPdfBytes.byteLength));
      assert.strictEqual(res.body, null);
      assert.strictEqual(blobReads, 0, "HEAD yalnız DB metadata'sını kullanmalı, Blob get çağırmamalı");
    });

    it("1.3 İptal edilmiş (revoked) bağlantı için anında 410 Gone dönmelidir", async () => {
      const viewToken = testViewToken("revoked-view-token");
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-rev-1"),
        payloadDigest: sha256Hex("digest-rev-1"),
        tokenHash: sha256Hex(viewToken),
        manageTokenHash: sha256Hex("m-rev-1"),
        documentId: "santiye-sefi-istifa-dilekcesi",
        blobPathname: "belge_paylasim/rev.pdf",
        creatorIpHash: sha256Hex("ip-rev-1"),
        expiresAt: new Date(Date.now() + 1000000),
      });
      await memoryRepo.finalizeReady(record.id, 500, "sha");
      await memoryRepo.revokeLink(record.id);

      const req = new Request(`http://localhost:3000/api/belgeler/paylasim/${viewToken}/pdf`);
      const res = await getPdfStreamRoute(req, {
        params: Promise.resolve({ token: viewToken }),
      });

      assert.strictEqual(res.status, 410);
      assert.equal((await res.json()).code, "LINK_REVOKED");
    });

    it("1.4 Süresi dolmuş (expired) bağlantı için 410 Gone dönmelidir", async () => {
      const viewToken = testViewToken("expired-view-token");
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-exp-1"),
        payloadDigest: sha256Hex("digest-exp-1"),
        tokenHash: sha256Hex(viewToken),
        manageTokenHash: sha256Hex("m-exp-1"),
        documentId: "insaat-ruhsati-dilekcesi",
        blobPathname: "belge_paylasim/exp.pdf",
        creatorIpHash: sha256Hex("ip-exp-1"),
        expiresAt: new Date(Date.now() + 100000),
      });
      await memoryRepo.finalizeReady(record.id, 500, "sha");
      memoryRepo.updateExpiresAtForTest(record.id, new Date(Date.now() - 1000)); // Süresi bitti

      const req = new Request(`http://localhost:3000/api/belgeler/paylasim/${viewToken}/pdf`);
      const res = await getPdfStreamRoute(req, {
        params: Promise.resolve({ token: viewToken }),
      });

      assert.strictEqual(res.status, 410);
      assert.equal((await res.json()).code, "LINK_EXPIRED");
    });

    it("1.5 Bilinmeyen token için DB sorgusundan sonra 404 Not Found dönmelidir", async () => {
      const unknownToken = testViewToken("nonexistent-view");
      const req = new Request(`http://localhost:3000/api/belgeler/paylasim/${unknownToken}/pdf`);
      const res = await getPdfStreamRoute(req, {
        params: Promise.resolve({ token: unknownToken }),
      });
      assert.strictEqual(res.status, 404);
    });

    it("1.6 İzin verilmeyen yöntemler (POST, DELETE) 405 Method Not Allowed dönmelidir", async () => {
      const resPost = await postPdfStreamRoute();
      assert.strictEqual(resPost.status, 405);
      assert.strictEqual(resPost.headers.get("Allow"), "GET, HEAD, OPTIONS");

      const resDelete = await deletePdfStreamRoute();
      assert.strictEqual(resDelete.status, 405);
      assert.strictEqual(resDelete.headers.get("Allow"), "GET, HEAD, OPTIONS");
    });
  });

  // --------------------------------------------------------------------------
  // 2. /b/[token] Sunucu Sayfası ve Güvenlik Meta Verileri
  // --------------------------------------------------------------------------
  describe("2. /b/[token] Sunucu Sayfası ve Güvenlik Meta Verileri", () => {
    it("2.1 metadata index: false, follow: false ve noarchive içermelidir", () => {
      assert.deepStrictEqual(viewerMetadata.title, { absolute: "Paylaşılan PDF Belgesi" });
      assert.deepStrictEqual(viewerMetadata.robots, {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
      });
    });

    it("2.2 robots.ts dosyasında /b/ yolu disallow allowlist'inde yer almalıdır", () => {
      const robots = robotsConfig();
      const rules = robots.rules as Array<{ disallow?: string | string[] }>;
      const disallowList = rules[0]?.disallow;
      assert.ok(Array.isArray(disallowList) && disallowList.includes("/b/"));
    });

    it("2.3 BelgeViewerPage bilinmeyen token için 'Belge Bulunamadı' ekranı render etmelidir", async () => {
      const page = await BelgeViewerPage({
        params: Promise.resolve({ token: "nonexistent-token" }),
      });
      assert.ok(page);
    });

    it("2.4 BelgeViewerPage iptal edilmiş token için 'Bağlantı İptal Edildi' ekranı render etmelidir", async () => {
      const token = testViewToken("revoked-page-token");
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-p-rev"),
        payloadDigest: sha256Hex("digest-p-rev"),
        tokenHash: sha256Hex(token),
        manageTokenHash: sha256Hex("m-p-rev"),
        documentId: "beton-dokum-tutanagi",
        blobPathname: "belge_paylasim/p-rev.pdf",
        creatorIpHash: sha256Hex("ip"),
        expiresAt: new Date(Date.now() + 100000),
      });
      await memoryRepo.finalizeReady(record.id, 100, "sha");
      await memoryRepo.revokeLink(record.id);

      const page = await BelgeViewerPage({
        params: Promise.resolve({ token }),
      });
      assert.ok(page);
    });

    it("2.5 BelgeViewerPage süresi dolmuş token için 'Süre Doldu' ekranı render etmelidir", async () => {
      const token = testViewToken("expired-page-token");
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-p-exp"),
        payloadDigest: sha256Hex("digest-p-exp"),
        tokenHash: sha256Hex(token),
        manageTokenHash: sha256Hex("m-p-exp"),
        documentId: "santiye-sefi-sozlesmesi",
        blobPathname: "belge_paylasim/p-exp.pdf",
        creatorIpHash: sha256Hex("ip"),
        expiresAt: new Date(Date.now() + 100000),
      });
      await memoryRepo.finalizeReady(record.id, 100, "sha");
      memoryRepo.updateExpiresAtForTest(record.id, new Date(Date.now() - 1000));

      const page = await BelgeViewerPage({
        params: Promise.resolve({ token }),
      });
      assert.ok(page);
    });

    it("2.6 BelgeViewerPage geçerli token için BelgeShareViewer bileşenini döndürmelidir", async () => {
      const token = testViewToken("valid-page-token");
      const record = await memoryRepo.createPendingReservation({
        requestIdHash: sha256Hex("req-p-ok"),
        payloadDigest: sha256Hex("digest-p-ok"),
        tokenHash: sha256Hex(token),
        manageTokenHash: sha256Hex("m-p-ok"),
        documentId: "santiye-sefi-sozlesmesi",
        blobPathname: "belge_paylasim/p-ok.pdf",
        creatorIpHash: sha256Hex("ip"),
        expiresAt: new Date(Date.now() + 100000),
      });
      await memoryRepo.finalizeReady(record.id, 100, "sha");

      const page = await BelgeViewerPage({
        params: Promise.resolve({ token }),
      });
      assert.ok(page);
    });
  });
});
