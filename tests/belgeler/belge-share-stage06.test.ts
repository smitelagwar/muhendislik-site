import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import { validateShareCreateRequest, RequestValidationError } from "../../src/lib/belge-paylasim/request-validation";
import { buildBelgeShareUrl, getBelgeSharePublicOrigin } from "../../src/lib/site-config";
import { getShareTransportError, parseShareCreateResponse } from "../../src/hooks/use-belge-share";
import { PDFDocument } from "pdf-lib";
import { generateBelgeDocument, ISTIFA_DILEKCESI_DEFAULT_DATA } from "../../src/lib/pdf-engine";
import { DOCUMENT_PDF_ONLY_FIELDS } from "../../src/lib/document-field-contracts";
import { getDocumentPdfProfiles } from "../../src/lib/belgeler-pdf-profiles";

const MAX_BYTES = 64 * 1024;
const requestId = createHash("sha256").update("stage06-valid-request").digest("base64url");

function requestFor(body: string | ReadableStream<Uint8Array>, headers: Record<string, string> = {}): Request {
  const init = {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      origin: "http://localhost:3000",
      host: "localhost:3000",
      ...headers,
    },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" };
  return new Request("http://localhost:3000/api/belgeler/paylasim", init);
}

async function expectValidationCode(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) => error instanceof RequestValidationError && error.code === code);
}

describe("ASAMA_06: sınırlı HTTP body, strict schema ve canonical share origin", () => {
  it("UTF-8 gövde tam 64 KiB iken kabul edilir", async () => {
    const json = JSON.stringify({ clientRequestId: requestId, documentId: "beton-dokum-tutanagi", values: {} });
    const body = json + " ".repeat(MAX_BYTES - Buffer.byteLength(json, "utf8"));
    assert.equal(Buffer.byteLength(body, "utf8"), MAX_BYTES);
    const result = await validateShareCreateRequest(requestFor(body, { "content-length": String(MAX_BYTES) }));
    assert.equal(result.clientRequestId, requestId);
    assert.equal(result.values.yer, "");
  });

  it("küçük yalan Content-Length'e rağmen 64 KiB+1'de akışı iptal eder", async () => {
    const json = JSON.stringify({ clientRequestId: requestId, documentId: "beton-dokum-tutanagi", values: {} });
    const firstChunk = new TextEncoder().encode(json + " ".repeat(MAX_BYTES - Buffer.byteLength(json, "utf8")));
    let pulls = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) controller.enqueue(firstChunk);
        else if (pulls === 2) controller.enqueue(new Uint8Array([0x20]));
        else controller.enqueue(new Uint8Array([0x20]));
      },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });

    await expectValidationCode(validateShareCreateRequest(requestFor(stream, { "content-length": "1" })), "PAYLOAD_TOO_LARGE");
    assert.equal(pulls, 2, "limit aşılınca sonraki stream chunk'ı okunmamalı");
    assert.equal(cancelled, true, "limit aşımında request stream iptal edilmeli");
  });

  it("doğru Content-Length olsa bile gerçek stream baytlarını sınırlar", async () => {
    const json = JSON.stringify({ clientRequestId: requestId, documentId: "beton-dokum-tutanagi", values: {} });
    const prefix = new TextEncoder().encode(json + " ".repeat(MAX_BYTES - Buffer.byteLength(json, "utf8")));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(prefix);
        controller.enqueue(new Uint8Array([0x20]));
        controller.close();
      },
    });
    await expectValidationCode(validateShareCreateRequest(requestFor(stream, { "content-length": String(MAX_BYTES) })), "PAYLOAD_TOO_LARGE");
  });

  it("Origin ve Host eksik, null, şema/port/host farklı ise DB öncesi reddeder", async () => {
    const body = JSON.stringify({ clientRequestId: requestId, documentId: "beton-dokum-tutanagi", values: {} });
    for (const headers of [
      { origin: "null" },
      { origin: "https://localhost:3000" },
      { origin: "http://localhost:3001" },
      { origin: "http://localhost:3000", host: "evil.example" },
      { origin: "http://localhost:3000/path" },
    ]) {
      await expectValidationCode(validateShareCreateRequest(requestFor(body, headers)), "INVALID_ORIGIN");
    }
    await expectValidationCode(validateShareCreateRequest(requestFor(body, { origin: "" })), "INVALID_ORIGIN");
    const missingOrigin = new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST", headers: { "content-type": "application/json", host: "localhost:3000" }, body,
    });
    const missingHost = new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000" }, body,
    });
    await expectValidationCode(validateShareCreateRequest(missingOrigin), "INVALID_ORIGIN");
    await expectValidationCode(validateShareCreateRequest(missingHost), "INVALID_ORIGIN");
  });

  it("body/values allowlist'ini, düz nesneyi ve string değerleri uygular", async () => {
    const validBase = { clientRequestId: requestId, documentId: "beton-dokum-tutanagi", values: { yer: "İstanbul" } };
    for (const body of [{ ...validBase, unexpected: true }]) {
      await expectValidationCode(validateShareCreateRequest(requestFor(JSON.stringify(body))), "UNKNOWN_BODY_FIELD");
    }
    await expectValidationCode(
      validateShareCreateRequest(requestFor(`{"clientRequestId":"${requestId}","documentId":"beton-dokum-tutanagi","values":{},"__proto__":{}}`)),
      "INVALID_BODY_KEY",
    );

    await expectValidationCode(
      validateShareCreateRequest(requestFor(JSON.stringify({ ...validBase, values: { yer: null } }))),
      "INVALID_FIELD_TYPE",
    );
    await expectValidationCode(
      validateShareCreateRequest(requestFor(JSON.stringify({ ...validBase, values: { yer: ["İstanbul"] } }))),
      "INVALID_FIELD_TYPE",
    );
    await expectValidationCode(
      validateShareCreateRequest(requestFor(JSON.stringify({ ...validBase, values: { yer: { il: "İstanbul" } } }))),
      "INVALID_FIELD_TYPE",
    );
    await expectValidationCode(
      validateShareCreateRequest(requestFor(JSON.stringify({ ...validBase, values: { adres_etiket: "sahte" } }))),
      "UNKNOWN_FIELD",
    );
    await expectValidationCode(
      validateShareCreateRequest(requestFor('{"clientRequestId":"' + requestId + '","documentId":"beton-dokum-tutanagi","values":{"__proto__":"x"}}')),
      "INVALID_FIELD_KEY",
    );

    const istifa = await validateShareCreateRequest(requestFor(JSON.stringify({
      clientRequestId: requestId,
      documentId: "santiye-sefi-istifa-dilekcesi",
      values: { adres_etiket: "sahte" },
    })));
    assert.equal(istifa.values.adres_etiket, "sahte");
  });

  it("yavaş gövdeyi zaman aşımında iptal eder", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull() { return new Promise<void>(() => undefined); },
      cancel() { cancelled = true; },
    });
    await expectValidationCode(validateShareCreateRequest(requestFor(stream), 20), "REQUEST_BODY_TIMEOUT");
    assert.equal(cancelled, true);
  });

  it("WAF HTML 403/429, Retry-After, malformed JSON ve 503'ü ayrı gösterir", async () => {
    await assert.rejects(
      parseShareCreateResponse(new Response("<html>secret-proxy-debug</html>", {
        status: 403, headers: { "content-type": "text/html" },
      })),
      (error: unknown) => error instanceof Error && error.message.includes("güvenlik filtresi") && !error.message.includes("secret-proxy-debug"),
    );
    await assert.rejects(
      parseShareCreateResponse(new Response("<html>rate limit</html>", {
        status: 429, headers: { "content-type": "text/html", "retry-after": "120" },
      })),
      (error: unknown) => error instanceof Error && error.message.includes("2 dakika"),
    );
    await assert.rejects(
      parseShareCreateResponse(new Response("{", {
        status: 200, headers: { "content-type": "application/json" },
      })),
      /geçersiz veya eksik JSON/,
    );
    await assert.rejects(
      parseShareCreateResponse(new Response(JSON.stringify({ code: "DATABASE_NOT_CONFIGURED", message: "Servis geçici olarak kullanılamıyor." }), {
        status: 503, headers: { "content-type": "application/json" },
      })),
      /Servis geçici olarak kullanılamıyor/,
    );
  });

  it("abort ve offline hatalarını kullanıcıya sınırlı, anlaşılır metinle ayırır", () => {
    assert.match(getShareTransportError(new DOMException("aborted", "AbortError")), /durduruldu/);
    assert.match(getShareTransportError(new TypeError("Failed to fetch")), /ulaşılamadı/);
  });

  it("production canonical hostunu kullanır; Preview yalnız tam allowlist origin'i kabul eder", () => {
    const keys = ["NODE_ENV", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL", "BELGE_SHARE_PREVIEW_URL", "BELGE_SHARE_PREVIEW_ORIGINS"] as const;
    const before = new Map(keys.map((key) => [key, process.env[key]]));
    const restore = () => {
      for (const key of keys) {
        const value = before.get(key);
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    };
    try {
      process.env.NODE_ENV = "production";
      process.env.VERCEL = "1";
      process.env.VERCEL_ENV = "production";
      process.env.NEXT_PUBLIC_SITE_URL = "https://canonical.example";
      process.env.VERCEL_PROJECT_PRODUCTION_URL = "deployment-abc.vercel.app";
      assert.equal(getBelgeSharePublicOrigin(), "https://canonical.example");

      process.env.VERCEL_ENV = "preview";
      process.env.BELGE_SHARE_PREVIEW_URL = "https://isolated-preview.example";
      process.env.BELGE_SHARE_PREVIEW_ORIGINS = "https://other.example,https://isolated-preview.example";
      assert.equal(getBelgeSharePublicOrigin(), "https://isolated-preview.example");
      assert.equal(buildBelgeShareUrl(Buffer.alloc(32, 3).toString("base64url")), `https://isolated-preview.example/b/${Buffer.alloc(32, 3).toString("base64url")}`);

      delete process.env.BELGE_SHARE_PREVIEW_URL;
      delete process.env.BELGE_SHARE_PREVIEW_ORIGINS;
      process.env.VERCEL = "1";
      process.env.VERCEL_URL = "muhendislik-site-random-preview.vercel.app";
      assert.equal(getBelgeSharePublicOrigin(), "https://muhendislik-site-random-preview.vercel.app");

      process.env.VERCEL = "0";
      assert.throws(() => getBelgeSharePublicOrigin(), /allowlist ile yapılandırılmamış/);
      process.env.VERCEL = "1";

      process.env.BELGE_SHARE_PREVIEW_URL = "https://isolated-preview.example";
      process.env.BELGE_SHARE_PREVIEW_ORIGINS = "https://other.example,https://isolated-preview.example";
      process.env.BELGE_SHARE_PREVIEW_ORIGINS = "https://other.example";
      assert.throws(() => getBelgeSharePublicOrigin());
      process.env.BELGE_SHARE_PREVIEW_URL = "https://canonical.example";
      process.env.BELGE_SHARE_PREVIEW_ORIGINS = "https://canonical.example";
      assert.throws(() => getBelgeSharePublicOrigin(), /production adresi olamaz/);
    } finally {
      restore();
    }
  });
});

describe("ASAMA_06: generator sabit PDF etiketlerini korur", () => {
  it("istifa PDF'sinde istemcinin taklit ettiği sabit alanlar yerine onaylı etiketleri yazar", async () => {
    const documentId = "santiye-sefi-istifa-dilekcesi";
    const hostileValues = {
      ...ISTIFA_DILEKCESI_DEFAULT_DATA,
      adres_etiket: "SAHTE ADRES ETİKETİ",
      tc_etiket: "SAHTE KİMLİK ETİKETİ",
      iletisim_etiket: "SAHTE İLETİŞİM ETİKETİ",
    };
    const result = await generateBelgeDocument(documentId, hostileValues);
    const pdf = await PDFDocument.load(result.bytes);
    const form = pdf.getForm();
    const profiles = getDocumentPdfProfiles(documentId);

    for (const key of DOCUMENT_PDF_ONLY_FIELDS[documentId]) {
      assert.equal(form.getTextField(key).getText(), profiles[key].fixedValue, key);
      assert.notEqual(form.getTextField(key).getText(), hostileValues[key as keyof typeof hostileValues], key);
    }
  });
});
