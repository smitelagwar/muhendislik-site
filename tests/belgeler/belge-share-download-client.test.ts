import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getSharedPdfDownloadUrl,
  parseContentDispositionFilename,
  downloadSharedPdf,
} from "../../src/lib/belge-paylasim/download-client";

describe("ASAMA_06: Güvenli İndirme İstemcisi (downloadSharedPdf) Testleri", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("1. getSharedPdfDownloadUrl URL Formatı", () => {
    it("1.1 Token'ı güvenle kodlamalı ve ?download=1 sorgu parametresi eklemelidir", () => {
      const url = getSharedPdfDownloadUrl("token123_abc-def");
      assert.strictEqual(url, "/api/belgeler/paylasim/token123_abc-def/pdf?download=1");

      const encodedUrl = getSharedPdfDownloadUrl("tok/en+test=");
      assert.strictEqual(encodedUrl, "/api/belgeler/paylasim/tok%2Fen%2Btest%3D/pdf?download=1");
    });
  });

  describe("2. parseContentDispositionFilename Başlık Ayrıştırma", () => {
    it("2.1 Tırnak içindeki standart dosya adını ayıklamalıdır", () => {
      const fn = parseContentDispositionFilename('attachment; filename="Santiye-Sefi-Sozlesmesi.pdf"');
      assert.strictEqual(fn, "Santiye-Sefi-Sozlesmesi.pdf");
    });

    it("2.2 Tırnaksız dosya adını ayıklamalıdır", () => {
      const fn = parseContentDispositionFilename("attachment; filename=Beton-Dokum-Tutanagi.pdf");
      assert.strictEqual(fn, "Beton-Dokum-Tutanagi.pdf");
    });

    it("2.3 RFC 5987 UTF-8 yıldızlı dosya adını ayıklamalıdır", () => {
      const fn = parseContentDispositionFilename("attachment; filename*=UTF-8''Insaat-Ruhsati-Dilekcesi.pdf");
      assert.strictEqual(fn, "Insaat-Ruhsati-Dilekcesi.pdf");
    });

    it("2.4 Yol ayracı ve enjeksiyon karakterlerini temizlemelidir", () => {
      const fn = parseContentDispositionFilename('attachment; filename="../../etc/passwd.pdf"');
      assert.strictEqual(fn, "etc-passwd.pdf");
    });

    it("2.5 Boş veya eksik başlıkta null dönmelidir", () => {
      assert.strictEqual(parseContentDispositionFilename(null), null);
      assert.strictEqual(parseContentDispositionFilename(""), null);
      assert.strictEqual(parseContentDispositionFilename("inline"), null);
    });
  });

  describe("3. downloadSharedPdf İndirme ve Hata Yönetimi", () => {
    it("3.1 Başarılı 200 PDF yanıtında ok: true ve dosya adı dönmelidir", async () => {
      const mockBlob = new Blob(["%PDF-1.4 Mock Bytes"], { type: "application/pdf" });
      globalThis.fetch = async () =>
        new Response(mockBlob, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": 'attachment; filename="Test-Belge.pdf"',
          },
        });

      const res = await downloadSharedPdf("valid-token");
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.filename, "Test-Belge.pdf");
    });

    it("3.2 410 Yanıtında bağlantının süresi doldu/iptal edildi hatası dönmelidir", async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ code: "LINK_EXPIRED" }), {
          status: 410,
          headers: { "content-type": "application/json" },
        });

      const res = await downloadSharedPdf("expired-token");
      assert.strictEqual(res.ok, false);
      assert.ok(res.error?.includes("süresi dolmuş veya bağlantı iptal edilmiş"));
    });

    it("3.3 404 Yanıtında belge bulunamadı hatası dönmelidir", async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ code: "NOT_FOUND" }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });

      const res = await downloadSharedPdf("nonexistent-token");
      assert.strictEqual(res.ok, false);
      assert.ok(res.error?.includes("bulunamadı"));
    });

    it("3.4 200 Yanıtında Content-Type application/pdf değilse (HTML/JSON hata gövdesi) indirme reddedilmelidir", async () => {
      globalThis.fetch = async () =>
        new Response("<html>Error</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });

      const res = await downloadSharedPdf("html-error-token");
      assert.strictEqual(res.ok, false);
      assert.ok(res.error?.includes("geçerli bir PDF yanıtı alınamadı"));
    });

    it("3.5 Eşzamanlı çift indirme engellenmelidir (in-flight guard)", async () => {
      let finishFirst: () => void = () => {};
      const slowPromise = new Promise<Response>((resolve) => {
        finishFirst = () => {
          resolve(
            new Response(new Blob(["%PDF-1.4"], { type: "application/pdf" }), {
              status: 200,
              headers: { "content-type": "application/pdf" },
            })
          );
        };
      });

      globalThis.fetch = async () => slowPromise;

      const p1 = downloadSharedPdf("concurrent-token");
      const p2 = downloadSharedPdf("concurrent-token");

      const r2 = await p2;
      assert.strictEqual(r2.ok, false);
      assert.ok(r2.error?.includes("zaten devam ediyor"));

      finishFirst();
      const r1 = await p1;
      assert.strictEqual(r1.ok, true);
    });
  });
});
