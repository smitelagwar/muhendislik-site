import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GET, HEAD, POST, OPTIONS } from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import SharePage from "../../src/app/b/[token]/page";
import { metadata } from "../../src/app/b/[token]/layout";
import { MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest } from "../../src/lib/belge-paylasim/repository";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import { BelgeShareRuntimeError } from "../../src/lib/belge-paylasim/config";
import { getShareByViewToken } from "../../src/lib/belge-paylasim/service-core";
import { stage11Token, stage11Record } from "./fixtures/stage11-data";

describe("ASAMA_11: lifecycle, HEAD metadata, error privacy and storage semantics", () => {
  let repository: MemoryBelgePaylasimRepository;
  let store: MemoryBelgeBlobStore;
  let blobReads: number;
  const bytes = new TextEncoder().encode("%PDF-1.7\nisolated fixture bytes");
  const params = (name: string) => ({ params: Promise.resolve({ token: stage11Token(name) }) });
  const request = (method = "GET") => new Request("http://localhost/isolated/pdf", { method });
  function headers(response: Response) {
    assert.match(response.headers.get("cache-control") ?? "", /private.*no-store/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex.*noarchive/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.ok(response.headers.get("x-request-correlation-id"));
  }
  beforeEach(() => {
    blobReads = 0;
    repository = new MemoryBelgePaylasimRepository();
    store = new MemoryBelgeBlobStore();
    repository.findByTokenHash = async (hash) => {
      for (const name of ["ready", "revoked", "expired", "pending", "purged-revoked"]) {
        const record = stage11Record(name, bytes.length);
        if (hash === record.tokenHash) return record;
      }
      return null;
    };
    store.get = async () => { blobReads++; return new Response(bytes); };
    setBelgePaylasimRepositoryForTest(repository);
    setBelgeBlobStoreForTest(store);
  });
  afterEach(() => { setBelgePaylasimRepositoryForTest(null); setBelgeBlobStoreForTest(null); });

  for (const [name, status, code] of [
    ["unknown", 404, "NOT_FOUND"], ["revoked", 410, "LINK_REVOKED"],
    ["expired", 410, "LINK_EXPIRED"], ["pending", 425, "LINK_NOT_READY"],
    ["purged-revoked", 410, "LINK_REVOKED"],
  ] as const) {
    it(`${name}: GET=${status}, HEAD=${status}, no Blob read; revokedAt wins over purge/expiry`, async () => {
      const get = await GET(request(), params(name));
      assert.equal(get.status, status); headers(get);
      assert.equal((await get.json()).code, code);
      const head = await HEAD(request("HEAD"), params(name));
      assert.equal(head.status, status); headers(head);
      assert.equal(await head.text(), ""); assert.equal(blobReads, 0);
      if (name === "pending") assert.equal(head.headers.get("retry-after"), "2");
    });
  }
  it("ready HEAD validates DB metadata and never touches even an unavailable Blob factory", async () => {
    setBelgeBlobStoreForTest(null);
    const head = await HEAD(request("HEAD"), params("ready"));
    assert.equal(head.status, 200); headers(head);
    assert.equal(head.headers.get("content-type"), "application/pdf");
    assert.equal(head.headers.get("content-length"), String(bytes.length));
    assert.match(head.headers.get("content-disposition") ?? "", /^inline/);
    assert.equal(head.body, null); assert.equal(blobReads, 0);
  });
  it("Range defaults to full 200 stream without advertising 206 or Accept-Ranges", async () => {
    const response = await GET(new Request("http://localhost/isolated/pdf", { headers: { Range: "bytes=0-10" } }), params("ready"));
    assert.equal(response.status, 200); headers(response);
    assert.equal(response.headers.get("accept-ranges"), null); assert.equal(response.headers.get("content-range"), null);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes); assert.equal(blobReads, 1);
  });
  it("missing, rejected or thrown Blob reads map to 502; configuration unavailable maps to 503", async () => {
    for (const result of [null, new Response("upstream rejected", { status: 503 }), new Error("synthetic blob failure"), new BelgeShareRuntimeError("BLOB_NOT_CONFIGURED")]) {
      store.get = async () => { if (result instanceof Error) throw result; return result; };
      const response = await GET(request(), params("ready"));
      assert.equal(response.status, result instanceof BelgeShareRuntimeError ? 503 : 502); headers(response);
      const body = JSON.stringify(await response.json());
      assert.ok(!body.includes("synthetic blob failure") && !body.includes("upstream rejected"));
    }
  });
  it("DB transport error is sanitized to 503, never not_found; GET/HEAD never open Blob", async () => {
    repository.findByTokenHash = async () => { throw new Error("sensitive connection data"); };
    await assert.rejects(getShareByViewToken(stage11Token("ready")), (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "DATABASE_UNAVAILABLE");
    const original = console.error;
    const logs: unknown[][] = [];
    console.error = (...args) => { logs.push(args); };
    try {
      const get = await GET(request(), params("ready"));
      assert.equal(get.status, 503); headers(get);
      assert.equal((await get.json()).code, "DATABASE_UNAVAILABLE");
      const head = await HEAD(request("HEAD"), params("ready"));
      assert.equal(head.status, 503); headers(head); assert.equal(head.body, null);
    } finally { console.error = original; }
    assert.equal(blobReads, 0);
    const log = JSON.stringify(logs);
    assert.ok(!log.includes("sensitive connection data") && !log.includes(stage11Token("ready")));
    assert.ok(log.includes("requestCorrelationId"));
  });
  it("invalid token is rejected before DB, bodyless HEAD and 405/204 retain privacy headers", async () => {
    let lookups = 0;
    repository.findByTokenHash = async () => { lookups++; return null; };
    const invalid = { params: Promise.resolve({ token: "bad" }) };
    const get = await GET(request(), invalid); const head = await HEAD(request("HEAD"), invalid);
    assert.equal(get.status, 400); assert.equal(head.status, 400); assert.equal(head.body, null);
    assert.equal(lookups, 0);
    const post = POST(); assert.equal(post.status, 405);
    const options = OPTIONS(); assert.equal(options.status, 204);
    for (const response of [get, head, post, options]) headers(response);
  });
  it("HTML pending and DB unavailable are explicit retry states, terminal states do not offer retry", async () => {
    const pending = renderToStaticMarkup(await SharePage(params("pending")));
    assert.match(pending, /Belge Hazırlanıyor/); assert.match(pending, /Yeniden dene/);
    for (const name of ["unknown", "expired", "revoked", "purged-revoked"]) {
      const html = renderToStaticMarkup(await SharePage(params(name)));
      assert.ok(!html.includes("Yeniden dene"));
    }
    repository.findByTokenHash = async () => { throw new Error("sensitive connection data"); };
    const html = renderToStaticMarkup(await SharePage(params("ready")));
    assert.match(html, /Belgeye Şu Anda Erişilemiyor/); assert.ok(!html.includes("Belge Bulunamadı"));
    assert.ok(!html.includes("sensitive connection data"));
  });
  it("share metadata suppresses inherited previews/canonical and sets noarchive/no-referrer", () => {
    assert.equal(metadata.openGraph, null); assert.equal(metadata.twitter, null);
    assert.deepEqual(metadata.alternates, { canonical: null });
    assert.equal(metadata.referrer, "no-referrer");
    assert.equal(typeof metadata.robots === "object" && metadata.robots?.noarchive, true);
    assert.ok(!JSON.stringify(metadata).includes("token"));
  });
});
