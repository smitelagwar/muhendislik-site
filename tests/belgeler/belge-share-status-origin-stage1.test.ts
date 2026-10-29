import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { GET as operationGet } from "../../src/app/api/belgeler/paylasim/islem/[requestId]/route";
import { POST as bootstrapPost } from "../../src/app/api/belgeler/paylasim/kota/route";
import { getBrowserIdentity } from "../../src/lib/belge-paylasim/browser-identity";
import type { BelgeShareEnvironment } from "../../src/lib/belge-paylasim/types";
import {
  MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import {
  createShareReservation, failShareReservation, finalizeShareReservation, revokeShareByManageToken,
} from "../../src/lib/belge-paylasim/service-core";
import { parseShareOperationStatusResponse, ShareHttpError } from "../../src/hooks/use-belge-share";

const host = "localhost:3000";
const url = "http://" + host;
const proof = Buffer.alloc(32, 47).toString("base64url");
const otherProof = Buffer.alloc(32, 48).toString("base64url");
const makeId = (seed: number) => Buffer.alloc(32, seed).toString("base64url");

describe("Paylaşım işlem durumu GET: Origin başlıksız browser ve güvenli recovery", () => {
  let repository: MemoryBelgePaylasimRepository;
  let cookie: string;
  let ownerHash: string;
  let environmentKey: BelgeShareEnvironment;

  beforeEach(async () => {
    repository = new MemoryBelgePaylasimRepository();
    setBelgePaylasimRepositoryForTest(repository);
    setBelgeBlobStoreForTest(new MemoryBelgeBlobStore());
    const bootstrap = await bootstrapPost(new Request(url + "/api/belgeler/paylasim/kota", {
      method: "POST", headers: { host, origin: url },
    }));
    assert.equal(bootstrap.status, 200);
    cookie = bootstrap.headers.get("set-cookie")!.split(";")[0];
    const identity = getBrowserIdentity(new Request(url + "/api/belgeler/paylasim", {
      headers: { cookie },
    }));
    assert.ok(identity);
    ownerHash = identity.ownerHash;
    environmentKey = identity.environmentKey;
  });

  afterEach(() => {
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);
  });

  async function reserve(seed: number) {
    return createShareReservation({
      clientRequestId: makeId(seed), documentId: "santiye-sefi-sozlesmesi",
      values: {}, creatorIp: "203.0.113.8", ownerHash, environmentKey, replayProof: proof,
    });
  }
  function statusRequest(id: string, extra: Record<string, string> = {}) {
    return new Request(url + "/api/belgeler/paylasim/islem/" + id, {
      headers: { host, cookie, "x-belge-share-replay-proof": proof, ...extra },
    });
  }
  function status(id: string, extra: Record<string, string> = {}) {
    return operationGet(statusRequest(id, extra), { params: Promise.resolve({ requestId: id }) });
  }
  function assertPrivate(response: Response) {
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.ok(response.headers.get("x-request-correlation-id"));
  }

  it("normal same-origin GET without Origin supports pending, ready, failed, missing, terminal", async () => {
    const pending = await reserve(1);
    assert.equal((await status(makeId(1))).status, 202);
    assert.ok(pending.record);

    const ready = await reserve(2);
    assert.ok(ready.record && ready.tokens);
    await finalizeShareReservation(ready.record.id, 123, "sha",
      ready.record.attemptId ?? undefined, ready.record.attemptVersion);
    const response = await status(makeId(2));
    assert.equal(response.status, 200);
    assertPrivate(response);
    const body = await response.json();
    assert.equal(body.status, "ready");
    assert.equal(body.viewToken, ready.tokens.viewToken);
    assert.ok(!JSON.stringify(body).includes("santiye_sefi_ad"));

    const failed = await reserve(3);
    assert.ok(failed.record);
    await failShareReservation(failed.record.id, "INJECTED",
      failed.record.attemptId ?? undefined, failed.record.attemptVersion);
    const failedResponse = await status(makeId(3));
    assert.equal(failedResponse.status, 409);
    assertPrivate(failedResponse);
    assert.equal((await failedResponse.json()).code, "CREATE_FAILED");

    const missing = await status(makeId(4));
    assert.equal(missing.status, 404);
    assertPrivate(missing);
    assert.equal((await missing.json()).code, "OPERATION_NOT_FOUND");

    await revokeShareByManageToken(ready.tokens.manageToken);
    const terminal = await status(makeId(2));
    assert.equal(terminal.status, 410);
    assertPrivate(terminal);
    assert.equal((await terminal.json()).code, "OPERATION_EXPIRED");
  });

  it("Origin if present, Host, Fetch Metadata, identity, replay proof remain strict", async () => {
    await reserve(5);
    const id = makeId(5);
    assert.equal((await status(id, { origin: url })).status, 202);
    for (const headers of [
      { origin: "null" },
      { origin: "https://evil.example" },
      { host: "different.example" },
      { "sec-fetch-site": "cross-site" },
    ]) {
      const response = await status(id, headers);
      assert.equal(response.status, 403);
      assertPrivate(response);
      const body = await response.json();
      assert.ok(["INVALID_ORIGIN", "CROSS_SITE_FORBIDDEN"].includes(body.code));
      assert.notEqual(body.code, "INTERNAL_SERVER_ERROR");
    }
    const wrongProof = await status(id, { "x-belge-share-replay-proof": otherProof });
    assert.equal(wrongProof.status, 404);
    const noCookie = await status(id, { cookie: "" });
    assert.equal(noCookie.status, 404);
    assert.equal((await wrongProof.json()).code, (await noCookie.json()).code);
  });
});

describe("İstemci recovery: yalnız kodlu sunucu durumları nihai sayılır", () => {
  const json = (status: number, code?: string) => new Response(
    JSON.stringify(code ? { code } : { status: status === 202 ? "pending" : "ready" }), {
      status, headers: { "content-type": "application/json" },
    });

  it("pending/ready, not-found/failed/terminal doğru ayrılır", async () => {
    assert.deepEqual(await parseShareOperationStatusResponse(json(202)), { kind: "pending" });
    assert.equal((await parseShareOperationStatusResponse(json(200))).kind, "ready");
    assert.deepEqual(await parseShareOperationStatusResponse(json(404, "OPERATION_NOT_FOUND")), { kind: "not-found" });
    assert.deepEqual(await parseShareOperationStatusResponse(json(409, "CREATE_FAILED")), { kind: "failed" });
    assert.deepEqual(await parseShareOperationStatusResponse(json(410, "OPERATION_EXPIRED")), { kind: "terminal" });
  });

  it("HTML intermediary 404, incorrect JSON 409, 403, 429, 500 and malformed success never become ready/not-found", async () => {
    const failures = [
      new Response("<html>not found</html>", { status: 404, headers: { "content-type": "text/html" } }),
      json(409, "WRONG_CODE"), json(403, "INVALID_ORIGIN"), json(429, "RATE_LIMITED"),
      json(500, "INTERNAL_SERVER_ERROR"),
      new Response(JSON.stringify({ status: "pending" }), { status: 200, headers: { "content-type": "application/json" } }),
      new Response(JSON.stringify({ status: "ready" }), { status: 202, headers: { "content-type": "application/json" } }),
    ];
    for (const response of failures) {
      await assert.rejects(parseShareOperationStatusResponse(response));
    }
    await assert.rejects(parseShareOperationStatusResponse(json(403, "INVALID_ORIGIN")),
      (error: unknown) => error instanceof ShareHttpError && error.status === 403);
  });
});
