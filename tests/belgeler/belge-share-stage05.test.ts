import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { BELGE_SHARE_CONFIG } from "../../src/lib/belge-paylasim/config";
import { BelgeShareQuotaError } from "../../src/lib/belge-paylasim/quota";
import {
  MemoryBelgePaylasimRepository,
  NeonBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  createShareReservation,
  failShareReservation,
  finalizeShareReservation,
} from "../../src/lib/belge-paylasim/service-core";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";
import type { BelgePaylasimDocumentId, ReservationAttemptInput } from "../../src/lib/belge-paylasim/types";

const DOCUMENT_ID: BelgePaylasimDocumentId = "beton-dokum-tutanagi";
const OWNER_HASH = "d".repeat(64);
const PROOF = Buffer.alloc(32, 71).toString("base64url");
const projectRoot = path.resolve(process.cwd());

describe("ASAMA_05: atomik 50/gün ve fiziksel Blob byte muhasebesi", () => {
  let repo: MemoryBelgePaylasimRepository;

  beforeEach(() => {
    repo = new MemoryBelgePaylasimRepository();
    setBelgePaylasimRepositoryForTest(repo);
  });

  function params(requestId: string, ownerHash = OWNER_HASH) {
    return {
      clientRequestId: requestId,
      documentId: DOCUMENT_ID,
      values: { yer: "İstanbul" },
      creatorIp: "198.51.100.22",
      ownerHash,
      environmentKey: "local" as const,
      replayProof: PROOF,
    };
  }

  async function createAndFinalize(requestId: string, size = 1024, ownerHash = OWNER_HASH) {
    const result = await createShareReservation(params(requestId, ownerHash));
    assert.ok(result.record);
    assert.equal(result.status, "new");
    const ready = await finalizeShareReservation(
      result.record.id,
      size,
      "f".repeat(64),
      result.record.attemptId ?? undefined,
      result.record.attemptVersion,
    );
    assert.equal(ready, true);
    return result.record;
  }

  it("1, 49 ve 50 başarılı link hakkını verir; 51. başarı 429 günlük kotasıdır", async () => {
    await createAndFinalize("quota-boundary-0001");
    assert.deepEqual(await repo.getDailyQuota("local", OWNER_HASH).then(({ usedLinks, reservedLinks }) => ({ usedLinks, reservedLinks })), {
      usedLinks: 1, reservedLinks: 0,
    });
    for (let index = 2; index <= 49; index += 1) await createAndFinalize(`quota-boundary-${String(index).padStart(4, "0")}`);
    assert.equal((await repo.getDailyQuota("local", OWNER_HASH)).usedLinks, 49);
    await createAndFinalize("quota-boundary-0050");
    const quota = await repo.getDailyQuota("local", OWNER_HASH);
    assert.equal(quota.usedLinks, 50);
    await assert.rejects(
      createShareReservation(params("quota-boundary-0051")),
      (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "DAILY_BROWSER_QUOTA_EXCEEDED" && error.statusCode === 429,
    );
  });

  it("49 used + 1 reserved geçişini ayırır ve başarıdan sonra kalan hakkı sıfırlar", async () => {
    for (let index = 1; index <= 49; index += 1) await createAndFinalize(`quota-mixed-${String(index).padStart(4, "0")}`);
    const last = await createShareReservation(params("quota-mixed-reserved-0050"));
    assert.equal(last.status, "new");
    const before = await repo.getDailyQuota("local", OWNER_HASH);
    assert.equal(before.usedLinks, 49);
    assert.equal(before.reservedLinks, 1);
    await assert.rejects(
      createShareReservation(params("quota-mixed-reserved-0051")),
      (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "BROWSER_QUOTA_RESERVED" && error.statusCode === 409,
    );
    assert.ok(last.record);
    assert.equal(await finalizeShareReservation(last.record.id, 900, "a".repeat(64), last.record.attemptId ?? undefined, last.record.attemptVersion), true);
    await assert.rejects(
      createShareReservation(params("quota-mixed-reserved-0052")),
      (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "DAILY_BROWSER_QUOTA_EXCEEDED",
    );
  });

  it("100 farklı ID paralelinde tam 50 rezervasyon alır; aynı ID tekrarları yeni hak tüketmez", async () => {
    const results = await Promise.all(Array.from({ length: 100 }, async (_, index) => {
      try { return await createShareReservation(params(`quota-parallel-${String(index).padStart(4, "0")}`)); }
      catch (error) { return error; }
    }));
    const accepted = results.filter((result) => !(result instanceof Error));
    const blocked = results.filter((result) => result instanceof BelgeShareQuotaError);
    assert.equal(accepted.length, 50);
    assert.equal(blocked.length, 50);
    assert.ok(blocked.every((error) => (error as BelgeShareQuotaError).code === "BROWSER_QUOTA_RESERVED"));
    assert.deepEqual(
      await repo.getDailyQuota("local", OWNER_HASH).then(({ usedLinks, reservedLinks }) => ({ usedLinks, reservedLinks })),
      { usedLinks: 0, reservedLinks: 50 },
    );
    for (const result of accepted) {
      const reservation = result as Awaited<ReturnType<typeof createShareReservation>>;
      assert.ok(reservation.record);
      assert.equal(await finalizeShareReservation(reservation.record.id, 512, "b".repeat(64), reservation.record.attemptId ?? undefined, reservation.record.attemptVersion), true);
    }
    assert.equal((await repo.getDailyQuota("local", OWNER_HASH)).usedLinks, 50);

    const repeatedRepo = new MemoryBelgePaylasimRepository();
    setBelgePaylasimRepositoryForTest(repeatedRepo);
    const first = await createShareReservation(params("quota-same-id-repeat-0001"));
    const repeat = await createShareReservation(params("quota-same-id-repeat-0001"));
    assert.equal(first.status, "new");
    assert.equal(repeat.status, "in_flight");
    assert.equal(repeatedRepo.getAllRecordsForTest().length, 1);
    assert.equal((await repeatedRepo.getDailyQuota("local", OWNER_HASH)).reservedLinks, 1);
  });

  it("başarısız iş hakkı bir kez iade eder; aynı proof ile retry tekrar rezervasyon alır", async () => {
    const first = await createShareReservation(params("quota-refund-retry-0001"));
    assert.ok(first.record);
    assert.equal(await failShareReservation(first.record.id, "PDF_RENDER_FAILED", first.record.attemptId ?? undefined, first.record.attemptVersion, "not_started"), true);
    assert.equal(await failShareReservation(first.record.id, "PDF_RENDER_FAILED", first.record.attemptId ?? undefined, first.record.attemptVersion, "not_started"), false);
    assert.deepEqual(
      await repo.getDailyQuota("local", OWNER_HASH).then(({ usedLinks, reservedLinks }) => ({ usedLinks, reservedLinks })),
      { usedLinks: 0, reservedLinks: 0 },
    );
    const retry = await createShareReservation(params("quota-refund-retry-0001"));
    assert.equal(retry.status, "retry");
    assert.equal((await repo.getDailyQuota("local", OWNER_HASH)).reservedLinks, 1);
    assert.ok(retry.record);
    assert.equal(await finalizeShareReservation(retry.record.id, 700, "c".repeat(64), retry.record.attemptId ?? undefined, retry.record.attemptVersion), true);
    assert.equal((await repo.getDailyQuota("local", OWNER_HASH)).usedLinks, 1);
  });

  it("İstanbul gece yarısını aşan rezervasyon yeni güne atomik taşınır; dolu yeni gün başarı sayılmaz", async () => {
    let now = new Date("2026-10-23T20:59:59.000Z");
    const clockRepo = new MemoryBelgePaylasimRepository({ clock: () => new Date(now) });
    setBelgePaylasimRepositoryForTest(clockRepo);
    const first = await createShareReservation(params("quota-midnight-open-0001"));
    assert.ok(first.record);
    const oldDay = first.record.quotaDay;
    now = new Date("2026-10-23T21:00:01.000Z");
    first.record.leaseUntil = new Date(now.getTime() + 60_000);
    clockRepo.extendAttemptLeaseForTest(first.record.id, first.record.leaseUntil);
    assert.equal(await finalizeShareReservation(first.record.id, 400, "d".repeat(64), first.record.attemptId ?? undefined, first.record.attemptVersion), true);
    const newDay = (await clockRepo.getDailyQuota("local", OWNER_HASH)).quotaDay;
    assert.notEqual(newDay, oldDay);
    assert.equal((await clockRepo.getDailyQuota("local", OWNER_HASH)).usedLinks, 1);
    assert.equal((await clockRepo.getDailyQuota("local", OWNER_HASH)).reservedLinks, 0);

    const fullDayRepo = new MemoryBelgePaylasimRepository({ clock: () => new Date("2026-10-23T20:59:59.000Z") });
    setBelgePaylasimRepositoryForTest(fullDayRepo);
    const pending = await createShareReservation(params("quota-midnight-full-0001"));
    assert.ok(pending.record);
    const fullDay = "2026-10-24";
    fullDayRepo.setDailyQuotaForTest("local", OWNER_HASH, fullDay, { usedLinks: 50, reservedLinks: 0 });
    fullDayRepo.setClockForTest(() => new Date("2026-10-23T21:00:01.000Z"));
    fullDayRepo.extendAttemptLeaseForTest(pending.record.id, new Date("2026-10-23T21:02:00.000Z"));
    assert.equal(await finalizeShareReservation(pending.record.id, 400, "e".repeat(64), pending.record.attemptId ?? undefined, pending.record.attemptVersion), false);
    const failedRecord = await fullDayRepo.findByRequestIdHash(sha256Hex("quota-midnight-full-0001"));
    assert.equal(failedRecord?.status, "failed");
    assert.equal(failedRecord?.quotaAccountingStatus, "released");
    assert.equal((await fullDayRepo.getDailyQuota("local", OWNER_HASH)).usedLinks, 50);
    assert.equal((await fullDayRepo.getDailyQuota("local", OWNER_HASH)).reservedLinks, 0);
  });

  it("bir byte boşluk bırakan iki PUT rezervasyonundan yalnız ilkini alır", async () => {
    const maxPdf = BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES;
    repo.setLimitsForTest({ globalDailyLimit: 200, globalMaxStorageBytes: 3 * maxPdf + 1 });
    await createAndFinalize("quota-bytes-base-0001", maxPdf);
    await createAndFinalize("quota-bytes-base-0002", maxPdf);
    const first = await createShareReservation(params("quota-bytes-first-put-0001"));
    assert.equal(first.status, "new");
    await assert.rejects(
      createShareReservation(params("quota-bytes-second-put-0001")),
      (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "STORAGE_CAPACITY_UNAVAILABLE" && error.statusCode === 503,
    );
    assert.equal((await repo.getActiveStats()).totalActiveBytes, 3 * maxPdf);
  });

  it("iptal ve Blob silme hatası kapasiteyi boşaltmaz; fiziksel silme onayında boşaltır", async () => {
    const maxPdf = BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES;
    repo.setLimitsForTest({ globalDailyLimit: 200, globalMaxStorageBytes: 3 * maxPdf });
    const first = await createAndFinalize("quota-delete-failure-0001", maxPdf);
    await createAndFinalize("quota-delete-failure-0002", maxPdf);
    await createAndFinalize("quota-delete-failure-0003", maxPdf);
    await repo.revokeLink(first.id);
    await repo.recordPurgeError(first.id, "BLOB_DELETE_FAILED");
    assert.equal((await repo.getActiveStats()).totalActiveBytes, 3 * maxPdf);
    await assert.rejects(
      createShareReservation(params("quota-delete-failure-blocked-0001")),
      (error: unknown) => error instanceof BelgeShareQuotaError && error.code === "STORAGE_CAPACITY_UNAVAILABLE",
    );
    await repo.markBlobDeleted("local", first.blobPathname);
    assert.equal((await repo.getActiveStats()).totalActiveBytes, 2 * maxPdf);
    const afterDelete = await createShareReservation(params("quota-delete-failure-after-0001"));
    assert.equal(afterDelete.status, "new");
  });

  it("PGlite SQL fonksiyonu iki repository örneğinde 100 ID'yi 50 rezervasyonda keser", async () => {
    const database = new PGlite();
    const migrations = [
      "001_dokumantasyon_base.sql", "002_upload_integrity.sql", "004_cad_aps_derivatives.sql",
      "005_belge_paylasim.sql", "006_belge_paylasim_v3_runtime.sql",
      "007_belge_paylasim_token_key_version.sql", "008_belge_paylasim_atomic_quota.sql",
      "009_belge_paylasim_cleanup_queue.sql",
    ];
    try {
      for (const file of migrations) await database.exec(await readFile(path.join(projectRoot, "db/migrations", file), "utf8"));
      const queryClient = Object.assign(
        async (parts: TemplateStringsArray, ...values: unknown[]) => {
          let statement = parts[0] ?? "";
          for (let index = 0; index < values.length; index += 1) statement += `$${index + 1}${parts[index + 1] ?? ""}`;
          return (await database.query(statement, values as never[])).rows;
        },
        { async query(statement: string) { return (await database.query(statement)).rows; } },
      ) as unknown as NeonQueryFunction<false, false>;
      const repoA = new NeonBelgePaylasimRepository(undefined, queryClient);
      const repoB = new NeonBelgePaylasimRepository(undefined, queryClient);
      const inputs = Array.from({ length: 100 }, (_, index): ReservationAttemptInput => {
        const requestId = `pglite-quota-${String(index).padStart(4, "0")}`;
        const attemptId = crypto.randomUUID();
        return {
          requestIdHash: sha256Hex(requestId), payloadDigest: sha256Hex(`payload-${index}`),
          tokenHash: sha256Hex(`view-${index}`), manageTokenHash: sha256Hex(`manage-${index}`),
          documentId: DOCUMENT_ID, blobPathname: `belge_paylasim/${attemptId}.pdf`,
          creatorIpHash: sha256Hex("same-nat"), expiresAt: new Date(Date.now() + BELGE_SHARE_CONFIG.EXPIRATION_MS),
          ownerHash: "e".repeat(64), ownerVersion: 1, requestVersion: 1,
          proofHash: sha256Hex(`proof-${index}`), proofVersion: 1, tokenVersion: 2, tokenKeyVersion: 1,
          reservationNonce: crypto.randomBytes(32), environmentKey: "local", attemptId, attemptVersion: 1,
          leaseUntil: new Date(Date.now() + BELGE_SHARE_CONFIG.ATTEMPT_LEASE_DURATION_MS),
        };
      });
      const results: (Awaited<ReturnType<typeof repoA.createOrGetReservation>> | Error)[] = [];
      for (const [index, input] of inputs.entries()) {
        try {
          results.push(await (index % 2 ? repoA : repoB).createOrGetReservation(input));
        } catch (error) {
          results.push(error instanceof Error ? error : new Error("Unknown SQL reservation error"));
        }
      }
      const accepted = results.filter((result) => !(result instanceof Error));
      const blocked = results.filter((result) => result instanceof BelgeShareQuotaError);
      assert.equal(accepted.length, 50);
      assert.equal(blocked.length, 50);
      assert.ok(blocked.every((error) => (error as BelgeShareQuotaError).code === "BROWSER_QUOTA_RESERVED"));
      const daily = await repoA.getDailyQuota("local", "e".repeat(64));
      assert.equal(daily.reservedLinks, 50);
      assert.equal(daily.usedLinks, 0);
      for (const result of accepted) {
        const row = result as { record: { id: string; attemptId?: string | null; attemptVersion: number } };
        assert.equal(await repoA.finalizeReady(row.record.id, 2048, sha256Hex(row.record.id), row.record.attemptId ?? undefined, row.record.attemptVersion), true);
      }
      const finalized = await repoB.getDailyQuota("local", "e".repeat(64));
      assert.equal(finalized.usedLinks, 50);
      assert.equal(finalized.reservedLinks, 0);
      const bytes = await database.query<{ total: string }>("SELECT SUM(liable_bytes)::text AS total FROM belge_paylasim_blob_obligations WHERE byte_state <> 'deleted'");
      assert.equal(Number(bytes.rows[0]?.total), 50 * 2048);
    } finally {
      await database.close();
    }
  });

  it("PGlite SQL refund idempotenttir; silme yükümlülüğü ancak onayda kapasiteden düşer", async () => {
    const database = new PGlite();
    const migrations = [
      "001_dokumantasyon_base.sql", "002_upload_integrity.sql", "004_cad_aps_derivatives.sql",
      "005_belge_paylasim.sql", "006_belge_paylasim_v3_runtime.sql",
      "007_belge_paylasim_token_key_version.sql", "008_belge_paylasim_atomic_quota.sql",
      "009_belge_paylasim_cleanup_queue.sql",
    ];
    try {
      for (const file of migrations) await database.exec(await readFile(path.join(projectRoot, "db/migrations", file), "utf8"));
      const queryClient = Object.assign(
        async (parts: TemplateStringsArray, ...values: unknown[]) => {
          let statement = parts[0] ?? "";
          for (let index = 0; index < values.length; index += 1) statement += `$${index + 1}${parts[index + 1] ?? ""}`;
          return (await database.query(statement, values as never[])).rows;
        },
        { async query(statement: string) { return (await database.query(statement)).rows; } },
      ) as unknown as NeonQueryFunction<false, false>;
      const sqlRepo = new NeonBelgePaylasimRepository(undefined, queryClient, {
        globalDailyLimit: 200,
        globalMaxStorageBytes: BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES,
      });
      const id = "sql-failure-refund-0001";
      const attemptId = crypto.randomUUID();
      const input: ReservationAttemptInput = {
        requestIdHash: sha256Hex(id), payloadDigest: sha256Hex("sql-payload"),
        tokenHash: sha256Hex("sql-view"), manageTokenHash: sha256Hex("sql-manage"),
        documentId: DOCUMENT_ID, blobPathname: `belge_paylasim/${attemptId}.pdf`, creatorIpHash: sha256Hex("ip"),
        expiresAt: new Date(Date.now() + BELGE_SHARE_CONFIG.EXPIRATION_MS), ownerHash: "f".repeat(64),
        ownerVersion: 1, requestVersion: 1, proofHash: sha256Hex("sql-proof"), proofVersion: 1,
        tokenVersion: 2, tokenKeyVersion: 1, reservationNonce: crypto.randomBytes(32), environmentKey: "local",
        attemptId, attemptVersion: 1, leaseUntil: new Date(Date.now() + BELGE_SHARE_CONFIG.ATTEMPT_LEASE_DURATION_MS),
      };
      const first = await sqlRepo.createOrGetReservation(input);
      assert.equal(first.created, true);
      assert.equal(await sqlRepo.markFailed(first.record.id, "RENDER_FAILED", attemptId, 1, "not_started"), true);
      assert.equal(await sqlRepo.markFailed(first.record.id, "RENDER_FAILED", attemptId, 1, "not_started"), false);
      assert.deepEqual(
        await sqlRepo.getDailyQuota("local", input.ownerHash).then(({ usedLinks, reservedLinks }) => ({ usedLinks, reservedLinks })),
        { usedLinks: 0, reservedLinks: 0 },
      );
      assert.equal(first.record.environmentKey, "local");
    } finally {
      await database.close();
    }
  });
});
