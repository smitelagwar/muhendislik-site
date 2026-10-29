import assert from "node:assert/strict";
import { describe, it, afterEach, beforeEach } from "node:test";
import { PDFDocument, PDFName } from "pdf-lib";
import { POST as bootstrapQuota } from "../../src/app/api/belgeler/paylasim/kota/route";
import { POST as createShare } from "../../src/app/api/belgeler/paylasim/route";
import { GET as operationStatus } from "../../src/app/api/belgeler/paylasim/islem/[requestId]/route";
import { GET as downloadPdf, HEAD as headPdf } from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import { DELETE as revokeShare } from "../../src/app/api/belgeler/paylasim/[token]/route";
import { MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest } from "../../src/lib/belge-paylasim/repository";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import type { BelgePaylasimDocumentId } from "../../src/lib/belge-paylasim/types";

const origin = "http://localhost:3000";
const host = "localhost:3000";
const makeToken = (seed: number) => Buffer.alloc(32, seed).toString("base64url");
const cases: Array<{ id: BelgePaylasimDocumentId; pages: number }> = [
  { id: "beton-dokum-tutanagi", pages: 1 },
  { id: "santiye-sefi-taahhutnamesi", pages: 1 },
  { id: "santiye-sefi-istifa-dilekcesi", pages: 1 },
  { id: "insaat-ruhsati-dilekcesi", pages: 1 },
  { id: "santiye-sefi-sozlesmesi", pages: 2 },
];

describe("Aşama 2: beş belgenin uçtan uca özel paylaşım yaşam döngüsü", () => {
  let repo: MemoryBelgePaylasimRepository;
  let blobs: MemoryBelgeBlobStore;
  let cookie: string;
  beforeEach(async () => {
    repo = new MemoryBelgePaylasimRepository();
    blobs = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(repo);
    setBelgeBlobStoreForTest(blobs);
    const response = await bootstrapQuota(new Request(origin + "/api/belgeler/paylasim/kota", {
      method: "POST", headers: { origin, host },
    }));
    assert.equal(response.status, 200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    assert.ok(cookie);
  });
  afterEach(() => {
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);
  });

  for (const [index, entry] of cases.entries()) {
    it(entry.id + ": create → recover (Origin-less GET) → private PDF → revoke 410", async () => {
      const requestId = makeToken(10 + index);
      const proof = makeToken(40 + index);
      const body = {
        clientRequestId: requestId,
        documentId: entry.id,
        values: {},
      };
      const makeCreate = () => new Request(origin + "/api/belgeler/paylasim", {
        method: "POST",
        headers: { origin, host, cookie, "content-type": "application/json", "x-belge-share-replay-proof": proof },
        body: JSON.stringify(body),
      });
      const response = await createShare(makeCreate());
      assert.equal(response.status, 201);
      const created = await response.json() as { status: string; viewToken: string; manageToken: string; url: string };
      assert.equal(created.status, "ready");
      assert.match(created.viewToken, /^[A-Za-z0-9_-]{43}$/);
      assert.match(created.manageToken, /^[A-Za-z0-9_-]{43}$/);
      assert.match(created.url, new RegExp("/b/" + created.viewToken + "$"));

      const statusUrl = origin + "/api/belgeler/paylasim/islem/" + requestId;
      const status = await operationStatus(new Request(statusUrl, {
        headers: { host, cookie, "x-belge-share-replay-proof": proof, "sec-fetch-site": "same-origin" },
      }), { params: Promise.resolve({ requestId }) });
      assert.equal(status.status, 200);
      const recovered = await status.json();
      assert.equal(recovered.viewToken, created.viewToken);
      assert.equal(recovered.manageToken, created.manageToken);
      assert.match(status.headers.get("cache-control") ?? "", /no-store/);

      const idempotent = await createShare(makeCreate());
      assert.equal(idempotent.status, 200);
      assert.equal((await idempotent.json()).viewToken, created.viewToken);

      const pdfUrl = origin + "/api/belgeler/paylasim/" + created.viewToken + "/pdf";
      const params = { params: Promise.resolve({ token: created.viewToken }) };
      const head = await headPdf(new Request(pdfUrl, { method: "HEAD" }), params);
      assert.equal(head.status, 200);
      assert.match(head.headers.get("content-type") ?? "", /application\/pdf/);
      const pdf = await downloadPdf(new Request(pdfUrl), params);
      assert.equal(pdf.status, 200);
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
      const parsed = await PDFDocument.load(bytes);
      assert.equal(parsed.getPageCount(), entry.pages);
      assert.equal(parsed.catalog.has(PDFName.of("AcroForm")), false);
      assert.equal(parsed.getForm().getFields().length, 0);

      const revoke = await revokeShare(new Request(origin + "/api/belgeler/paylasim/" + created.viewToken, {
        method: "DELETE", headers: { origin, host, "x-manage-token": created.manageToken },
      }), params);
      assert.equal(revoke.status, 200);
      assert.equal((await downloadPdf(new Request(pdfUrl), params)).status, 410);
      assert.equal((await operationStatus(new Request(statusUrl, {
        headers: { host, cookie, "x-belge-share-replay-proof": proof },
      }), { params: Promise.resolve({ requestId }) })).status, 410);
    });
  }

  it("veritabanı kesintisi operation status'u 404 değil güvenli 503 yapar", async () => {
    repo.findByRequestIdHash = async () => { throw new Error("DO_NOT_LEAK_DATABASE_URL"); };
    const requestId = makeToken(90);
    const response = await operationStatus(new Request(origin + "/api/belgeler/paylasim/islem/" + requestId, {
      headers: { host, cookie, "x-belge-share-replay-proof": makeToken(91) },
    }), { params: Promise.resolve({ requestId }) });
    assert.equal(response.status, 503);
    const body = await response.text();
    assert.match(body, /DATABASE_UNAVAILABLE/);
    assert.doesNotMatch(body, /DO_NOT_LEAK_DATABASE_URL/);
    assert.ok(response.headers.get("x-request-correlation-id"));
  });
});

describe("Aşama 2: rezervasyon veritabanı kesintisi tanısı", () => {
  it("GET kimliği sağlamken POST kayıt araması çöküyorsa güvenli 503 döner", async () => {
    const repo = new MemoryBelgePaylasimRepository();
    setBelgePaylasimRepositoryForTest(repo);
    setBelgeBlobStoreForTest(new MemoryBelgeBlobStore());
    try {
      const boot = await bootstrapQuota(new Request(origin + "/api/belgeler/paylasim/kota", {
        method: "POST", headers: { origin, host },
      }));
      const cookie = boot.headers.get("set-cookie")?.split(";")[0];
      assert.ok(cookie);
      repo.findByRequestIdHash = async () => { throw new Error("DO_NOT_EXPOSE_DB_PASSWORD"); };
      const response = await createShare(new Request(origin + "/api/belgeler/paylasim", {
        method: "POST",
        headers: { origin, host, cookie, "content-type": "application/json", "x-belge-share-replay-proof": makeToken(98) },
        body: JSON.stringify({ clientRequestId: makeToken(99), documentId: "santiye-sefi-sozlesmesi", values: {} }),
      }));
      assert.equal(response.status, 503);
      const text = await response.text();
      assert.match(text, /DATABASE_UNAVAILABLE/);
      assert.doesNotMatch(text, /DO_NOT_EXPOSE_DB_PASSWORD/);
    } finally {
      setBelgePaylasimRepositoryForTest(null);
      setBelgeBlobStoreForTest(null);
    }
  });
});
