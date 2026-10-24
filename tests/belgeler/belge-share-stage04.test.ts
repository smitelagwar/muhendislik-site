import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { GET as getOperationRoute } from "../../src/app/api/belgeler/paylasim/islem/[requestId]/route";
import { POST as createShareRoute } from "../../src/app/api/belgeler/paylasim/route";
import { POST as bootstrapQuotaRoute } from "../../src/app/api/belgeler/paylasim/kota/route";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import { BelgeShareRuntimeError } from "../../src/lib/belge-paylasim/config";
import { getBrowserIdentity } from "../../src/lib/belge-paylasim/browser-identity";
import {
  MemoryBelgePaylasimRepository,
  NeonBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  createShareReservation,
  failShareReservation,
  finalizeShareReservation,
  getShareOperationStatus,
  revokeShareByManageToken,
  BelgeShareServiceError,
} from "../../src/lib/belge-paylasim/service-core";
import { validateShareCreateRequest } from "../../src/lib/belge-paylasim/request-validation";
import {
  computePayloadDigest,
  generateDeterministicTokens,
  generateReservationTokens,
  sha256Hex,
} from "../../src/lib/belge-paylasim/tokens";
import type { BelgePaylasimDocumentId } from "../../src/lib/belge-paylasim/types";

const DOCUMENT_ID: BelgePaylasimDocumentId = "beton-dokum-tutanagi";
const PROOF = Buffer.alloc(32, 31).toString("base64url");
const OTHER_PROOF = Buffer.alloc(32, 32).toString("base64url");
const OWNER_HASH = "a".repeat(64);
const projectRoot = path.resolve(process.cwd());
const testRequestId = (seed: string) => createHash("sha256").update(seed).digest("base64url");

describe("ASAMA_04: replay proof, V2 token ve attempt fencing", () => {
  let repo: MemoryBelgePaylasimRepository;
  let blob: MemoryBelgeBlobStore;

  beforeEach(() => {
    repo = new MemoryBelgePaylasimRepository();
    blob = new MemoryBelgeBlobStore();
    setBelgePaylasimRepositoryForTest(repo);
    setBelgeBlobStoreForTest(blob);
  });

  function createParams(requestId: string, values: Record<string, string> = { yer: "Kadıköy" }, proof = PROOF) {
    return {
      clientRequestId: requestId,
      documentId: DOCUMENT_ID,
      values,
      creatorIp: "203.0.113.5",
      ownerHash: OWNER_HASH,
      environmentKey: "local" as const,
      replayProof: proof,
    };
  }

  it("V2 tokens are stable for the stored nonce and change after tombstone GC", async () => {
    const nonce = Buffer.alloc(32, 1);
    const firstTokens = generateReservationTokens("request-v2-0001", nonce, 1, "unit-test-secret-key-32-bytes-minimum");
    const repeatedTokens = generateReservationTokens("request-v2-0001", nonce, 1, "unit-test-secret-key-32-bytes-minimum");
    const anotherNonceTokens = generateReservationTokens("request-v2-0001", Buffer.alloc(32, 2), 1, "unit-test-secret-key-32-bytes-minimum");
    assert.deepEqual(repeatedTokens, firstTokens);
    assert.notEqual(firstTokens.viewToken, anotherNonceTokens.viewToken);
    assert.notEqual(firstTokens.manageToken, anotherNonceTokens.manageToken);
    assert.notEqual(generateDeterministicTokens("request-v2-0001").viewToken, firstTokens.viewToken);

    const first = await createShareReservation(createParams("request-gc-0001"));
    assert.ok(first.record && first.tokens);
    await finalizeShareReservation(first.record.id, 100, "sha", first.record.attemptId!, first.record.attemptVersion);
    await revokeShareByManageToken(first.tokens.manageToken);
    await repo.purgeOldTombstones(new Date(Date.now() + 1), 10);

    const afterGc = await createShareReservation(createParams("request-gc-0001"));
    assert.equal(afterGc.status, "new");
    assert.notEqual(afterGc.tokens?.viewToken, first.tokens.viewToken);
    assert.notEqual(afterGc.tokens?.manageToken, first.tokens.manageToken);
    assert.equal(await repo.findByTokenHash(first.tokens.viewTokenHash), null);
  });

  it("only the same owner, proof and payload can recover a ready reservation", async () => {
    const first = await createShareReservation(createParams("request-replay-0001", { yer: "PRIVATE-FORM-VALUE" }));
    assert.ok(first.record && first.tokens);
    assert.equal(first.status, "new");
    await finalizeShareReservation(first.record.id, 100, "sha", first.record.attemptId!, first.record.attemptVersion);

    const replay = await createShareReservation(createParams("request-replay-0001", { yer: "PRIVATE-FORM-VALUE" }));
    assert.equal(replay.status, "existing_ready");
    assert.equal(replay.tokens?.viewToken, first.tokens.viewToken);
    assert.equal(replay.manageToken, first.manageToken);

    await assert.rejects(
      createShareReservation(createParams("request-replay-0001", { yer: "changed" }, OTHER_PROOF)),
      (error: unknown) => error instanceof BelgeShareServiceError && error.code === "REPLAY_NOT_FOUND" && error.statusCode === 404,
    );
    await assert.rejects(
      createShareReservation({ ...createParams("request-replay-0001", { yer: "PRIVATE-FORM-VALUE" }), ownerHash: "b".repeat(64) }),
      (error: unknown) => error instanceof BelgeShareServiceError && error.code === "REPLAY_NOT_FOUND" && error.statusCode === 404,
    );
    await assert.rejects(
      createShareReservation(createParams("request-replay-0001", { yer: "changed" })),
      (error: unknown) => error instanceof BelgeShareServiceError && error.code === "IDEMPOTENCY_CONFLICT" && error.statusCode === 409,
    );
  });

  it("legacy requestId-only records never regenerate a manage token", async () => {
    const requestId = "request-legacy-0001";
    const oldTokens = generateDeterministicTokens(requestId);
    await repo.createPendingReservation({
      requestIdHash: sha256Hex(requestId),
      payloadDigest: computePayloadDigest(DOCUMENT_ID, { yer: "legacy" }),
      tokenHash: oldTokens.viewTokenHash,
      manageTokenHash: oldTokens.manageTokenHash,
      documentId: DOCUMENT_ID,
      blobPathname: "belge_paylasim/legacy.pdf",
      creatorIpHash: sha256Hex("legacy-ip"),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await assert.rejects(
      createShareReservation(createParams(requestId, { yer: "legacy" })),
      (error: unknown) => error instanceof BelgeShareServiceError && error.code === "LEGACY_REPLAY_UNAVAILABLE" && error.statusCode === 409,
    );
  });

  it("a failed operation retries as a new fenced attempt while preserving its logical tokens", async () => {
    const first = await createShareReservation(createParams("request-retry-0001"));
    assert.ok(first.record && first.tokens);
    const marked = await failShareReservation(first.record.id, "RENDER_FAILED", first.record.attemptId!, first.record.attemptVersion);
    assert.equal(marked, true);

    const retried = await createShareReservation(createParams("request-retry-0001"));
    assert.equal(retried.status, "retry");
    assert.notEqual(retried.record?.attemptId, first.record.attemptId);
    assert.equal(retried.record?.attemptVersion, first.record.attemptVersion + 1);
    assert.notEqual(retried.record?.blobPathname, first.record.blobPathname);
    assert.equal(retried.tokens?.viewToken, first.tokens.viewToken);
    assert.equal(retried.tokens?.manageToken, first.tokens.manageToken);
    assert.equal((await createShareReservation(createParams("request-retry-0001"))).status, "in_flight");
  });

  it("expired lease takeover fences late finalize and revoke cannot be undone", async () => {
    const first = await createShareReservation(createParams("request-fence-0001"));
    assert.ok(first.record && first.tokens);
    repo.expireAttemptLeaseForTest(first.record.id);
    const takeover = await createShareReservation(createParams("request-fence-0001"));
    assert.equal(takeover.status, "retry");
    assert.equal(await finalizeShareReservation(
      first.record.id, 10, "late", first.record.attemptId!, first.record.attemptVersion,
    ), false);
    assert.equal(await finalizeShareReservation(
      takeover.record!.id, 20, "current", takeover.record!.attemptId!, takeover.record!.attemptVersion,
    ), true);

    const second = await createShareReservation(createParams("request-revoke-fence-0001"));
    assert.ok(second.record && second.tokens);
    await revokeShareByManageToken(second.tokens.manageToken);
    assert.equal(await finalizeShareReservation(
      second.record.id, 20, "after-revoke", second.record.attemptId!, second.record.attemptVersion,
    ), false);
    const saved = await repo.findByRequestIdHash(sha256Hex("request-revoke-fence-0001"));
    assert.equal(saved?.status, "purged");
    assert.ok(saved?.revokedAt);
  });

  it("20 simultaneous replays create one logical reservation without UNIQUE failures", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => createShareReservation(createParams("request-parallel-0001"))),
    );
    assert.equal(repo.getAllRecordsForTest().length, 1);
    assert.equal(results.filter((result) => result.status === "new").length, 1);
    assert.equal(results.filter((result) => result.status === "in_flight").length, 19);
  });

  it("isolated PostgreSQL retries the same request id and keeps one row", async () => {
    const database = new PGlite();
    const migrationFiles = [
      "001_dokumantasyon_base.sql",
      "002_upload_integrity.sql",
      "004_cad_aps_derivatives.sql",
      "005_belge_paylasim.sql",
      "006_belge_paylasim_v3_runtime.sql",
      "007_belge_paylasim_token_key_version.sql",
      "008_belge_paylasim_atomic_quota.sql",
      "009_belge_paylasim_cleanup_queue.sql",
    ];
    try {
      for (const file of migrationFiles) {
        await database.exec(await readFile(path.join(projectRoot, "db/migrations", file), "utf8"));
      }
      const queryClient = Object.assign(
        async (parts: TemplateStringsArray, ...values: unknown[]) => {
          let statement = parts[0] ?? "";
          for (let index = 0; index < values.length; index += 1) {
            statement += `$${index + 1}${parts[index + 1] ?? ""}`;
          }
          return (await database.query(statement, values as never[])).rows;
        },
        {
          async query(statement: string) {
            return (await database.query(statement)).rows;
          },
        },
      ) as unknown as NeonQueryFunction<false, false>;
      setBelgePaylasimRepositoryForTest(new NeonBelgePaylasimRepository(undefined, queryClient));

      const results = [];
      for (let index = 0; index < 20; index += 1) {
        results.push(await createShareReservation({
          ...createParams("request-pglite-parallel-0001"),
          ownerHash: "c".repeat(64),
        }));
      }
      const rows = await database.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM belge_paylasim_links WHERE request_id_hash = $1",
        [sha256Hex("request-pglite-parallel-0001")],
      );
      assert.equal(Number(rows.rows[0]?.count), 1);
      assert.equal(results.filter((result) => result.status === "new").length, 1);
      assert.equal(results.filter((result) => result.status === "in_flight").length, 19);
    } finally {
      setBelgePaylasimRepositoryForTest(repo);
      await database.close();
    }
  });

  it("status GET requires cookie and proof, returns ready tokens without any form fields and is no-store", async () => {
    const bootstrap = await bootstrapQuotaRoute(new Request("http://localhost:3000/api/belgeler/paylasim/kota", {
      method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    }));
    const cookie = bootstrap.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    const identityRequest = new Request("http://localhost:3000/api/belgeler/paylasim", { headers: { cookie } });
    const identity = getBrowserIdentity(identityRequest);
    assert.ok(identity);
    const proof = Buffer.alloc(32, 41).toString("base64url");
    const requestId = testRequestId("request-status-0001");
    const createBody = JSON.stringify({ clientRequestId: requestId, documentId: DOCUMENT_ID, values: { yer: "PRIVATE-FORM-VALUE" } });
    const normalized = await validateShareCreateRequest(new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000" },
      body: createBody,
    }));
    const created = await createShareReservation({
      clientRequestId: requestId,
      documentId: normalized.documentId,
      values: normalized.values,
      creatorIp: normalized.creatorIp,
      ownerHash: identity.ownerHash,
      environmentKey: identity.environmentKey,
      replayProof: proof,
    });
    assert.ok(created.record && created.tokens);

    const pendingPost = await createShareRoute(new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST",
      headers: {
        "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000",
        cookie, "x-belge-share-replay-proof": proof,
      },
      body: createBody,
    }));
    assert.equal(pendingPost.status, 202);
    assert.match(pendingPost.headers.get("cache-control") ?? "", /no-store/);

    const request = (id: string, replayProof: string) => new Request(
      `http://localhost:3000/api/belgeler/paylasim/islem/${id}`,
      { headers: { origin: "http://localhost:3000", host: "localhost:3000", cookie, "x-belge-share-replay-proof": replayProof } },
    );
    const pendingResponse = await getOperationRoute(request(requestId, proof), { params: Promise.resolve({ requestId }) });
    assert.equal(pendingResponse.status, 202);
    assert.match(pendingResponse.headers.get("cache-control") ?? "", /no-store/);

    const wrongProof = await getOperationRoute(request(requestId, OTHER_PROOF), { params: Promise.resolve({ requestId }) });
    const missingRequestId = testRequestId("request-status-missing");
    const noRecord = await getOperationRoute(request(missingRequestId, proof), { params: Promise.resolve({ requestId: missingRequestId }) });
    assert.equal(wrongProof.status, 404);
    assert.equal((await wrongProof.json()).code, (await noRecord.json()).code);

    assert.equal(await finalizeShareReservation(
      created.record.id, 200, "sha", created.record.attemptId!, created.record.attemptVersion,
    ), true);
    const readyResponse = await getOperationRoute(request(requestId, proof), { params: Promise.resolve({ requestId }) });
    assert.equal(readyResponse.status, 200);
    assert.match(readyResponse.headers.get("cache-control") ?? "", /no-store/);
    const readyBody = await readyResponse.text();
    assert.match(readyBody, new RegExp(created.tokens.viewToken));
    assert.match(readyBody, new RegExp(created.tokens.manageToken));
    assert.doesNotMatch(readyBody, /PRIVATE-FORM-VALUE/);

    const failedRequestId = testRequestId("request-status-failed");
    const failed = await createShareReservation({
      clientRequestId: failedRequestId,
      documentId: DOCUMENT_ID,
      values: {},
      creatorIp: "203.0.113.5",
      ownerHash: identity.ownerHash,
      environmentKey: identity.environmentKey,
      replayProof: proof,
    });
    assert.ok(failed.record);
    await failShareReservation(failed.record.id, "RENDER_FAILED", failed.record.attemptId!, failed.record.attemptVersion);
    const failedResponse = await getOperationRoute(request(failedRequestId, proof), {
      params: Promise.resolve({ requestId: failedRequestId }),
    });
    assert.equal(failedResponse.status, 409);
    assert.match(failedResponse.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(await getShareOperationStatus({ clientRequestId: requestId, ownerHash: identity.ownerHash, replayProof: proof }), {
      status: "ready",
      record: await repo.findByRequestIdHash(sha256Hex(requestId)),
      tokens: created.tokens,
    });
  });

  it("Blob PUT sonrası finalize hatası failed olur; aynı payload yeni path ile retry edilir", async () => {
    class FailFirstFinalizeRepository extends MemoryBelgePaylasimRepository {
      finalizeCalls = 0;

      override async finalizeReady(
        id: string,
        sizeBytes: number,
        pdfSha256: string,
        attemptId?: string,
        attemptVersion?: number,
      ): Promise<boolean> {
        this.finalizeCalls += 1;
        if (this.finalizeCalls === 1) throw new Error("injected database finalize error");
        return super.finalizeReady(id, sizeBytes, pdfSha256, attemptId, attemptVersion);
      }
    }

    const failingRepo = new FailFirstFinalizeRepository();
    setBelgePaylasimRepositoryForTest(failingRepo);
    const bootstrap = await bootstrapQuotaRoute(new Request("http://localhost:3000/api/belgeler/paylasim/kota", {
      method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    }));
    const cookie = bootstrap.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    const requestId = testRequestId("request-api-put-error-0001");
    const body = JSON.stringify({ clientRequestId: requestId, documentId: DOCUMENT_ID, values: { tarih: "23.10.2026", yer: "İstanbul" } });
    const makeRequest = () => new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        cookie,
        "x-belge-share-replay-proof": PROOF,
      },
      body,
    });

    const failedResponse = await createShareRoute(makeRequest());
    assert.equal(failedResponse.status, 500);
    assert.equal((await failedResponse.json()).code, "INTERNAL_SERVER_ERROR");
    const failedRecord = await failingRepo.findByRequestIdHash(sha256Hex(requestId));
    assert.equal(failedRecord?.status, "failed");
    assert.ok(failedRecord);
    const orphanPath = failedRecord.blobPathname;
    assert.equal(blob.has(orphanPath), false);
    assert.equal((await failingRepo.getActiveStats()).totalActiveBytes, 0);

    const retryResponse = await createShareRoute(makeRequest());
    assert.equal(retryResponse.status, 201);
    const readyRecord = await failingRepo.findByRequestIdHash(sha256Hex(requestId));
    assert.equal(readyRecord?.status, "ready");
    assert.notEqual(readyRecord?.blobPathname, orphanPath);
    assert.equal(blob.has(orphanPath), false);
    assert.equal(blob.has(readyRecord!.blobPathname), true);
  });

  it("finalize commit yanıtı kaybolursa genel hata hazır kaydı failed yapmaz", async () => {
    class CommitThenThrowRepository extends MemoryBelgePaylasimRepository {
      throwAfterCommit = true;

      override async finalizeReady(
        id: string,
        sizeBytes: number,
        pdfSha256: string,
        attemptId?: string,
        attemptVersion?: number,
      ): Promise<boolean> {
        const committed = await super.finalizeReady(id, sizeBytes, pdfSha256, attemptId, attemptVersion);
        if (committed && this.throwAfterCommit) {
          this.throwAfterCommit = false;
          throw new Error("injected lost finalize acknowledgement");
        }
        return committed;
      }
    }

    const committedRepo = new CommitThenThrowRepository();
    setBelgePaylasimRepositoryForTest(committedRepo);
    const bootstrap = await bootstrapQuotaRoute(new Request("http://localhost:3000/api/belgeler/paylasim/kota", {
      method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" },
    }));
    const cookie = bootstrap.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(cookie);
    const requestId = testRequestId("request-api-lost-response-0001");
    const response = await createShareRoute(new Request("http://localhost:3000/api/belgeler/paylasim", {
      method: "POST",
      headers: {
        "content-type": "application/json", host: "localhost:3000", origin: "http://localhost:3000",
        cookie, "x-belge-share-replay-proof": PROOF,
      },
      body: JSON.stringify({ clientRequestId: requestId, documentId: DOCUMENT_ID, values: { yer: "İstanbul" } }),
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "ready");
    assert.equal((await committedRepo.findByRequestIdHash(sha256Hex(requestId)))?.status, "ready");
  });

  it("unavailable stored key version fails closed rather than changing old token hashes", async () => {
    const first = await createShareReservation(createParams("request-key-version-0001"));
    assert.ok(first.record);
    assert.equal(await finalizeShareReservation(
      first.record.id, 100, "sha", first.record.attemptId!, first.record.attemptVersion,
    ), true);
    const oldVersion = process.env.BELGE_SHARE_TOKEN_KEY_VERSION;
    try {
      process.env.BELGE_SHARE_TOKEN_KEY_VERSION = "2";
      await assert.rejects(
        createShareReservation(createParams("request-key-version-0001")),
        (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "TOKEN_KEY_VERSION_UNAVAILABLE" && error.statusCode === 503,
      );
    } finally {
      if (oldVersion === undefined) delete process.env.BELGE_SHARE_TOKEN_KEY_VERSION;
      else process.env.BELGE_SHARE_TOKEN_KEY_VERSION = oldVersion;
    }
  });
});
