import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { del, list } from "@vercel/blob";
import { Pool, type NeonQueryFunction } from "@neondatabase/serverless";
import { BELGE_SHARE_CONFIG } from "../../src/lib/belge-paylasim/config";
import { BelgeShareQuotaError } from "../../src/lib/belge-paylasim/quota";
import { NeonBelgePaylasimRepository } from "../../src/lib/belge-paylasim/repository";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";
import type { ReservationAttemptInput } from "../../src/lib/belge-paylasim/types";

const timeout = setTimeout(() => {
  console.error("ASAMA_13 PostgreSQL run exceeded the 10-minute safety limit.");
  process.exit(124);
}, 10 * 60 * 1000);

function createQueryClient(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }> }) {
  const tagged = Object.assign(
    async (parts: TemplateStringsArray, ...values: unknown[]) => {
      let statement = parts[0] ?? "";
      for (let index = 0; index < values.length; index += 1) {
        statement += `$${index + 1}${parts[index + 1] ?? ""}`;
      }
      return (await client.query(statement, values)).rows;
    },
    { async query(statement: string) { return (await client.query(statement)).rows; } },
  );
  return tagged as unknown as NeonQueryFunction<false, false>;
}

async function clearTestBlobs(token: string): Promise<number> {
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await list({ prefix: "belge_paylasim/", cursor, limit: 1000, token });
    if (page.blobs.length) {
      await del(page.blobs.map((blob) => blob.url), { token });
      deleted += page.blobs.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}

async function clearTestRows(client: { query: (text: string, values?: unknown[]) => Promise<{ rows: unknown[] }> }) {
  const versionResult = await client.query(
    "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE",
  );
  const schemaVersion = Number((versionResult.rows[0] as { schema_version?: unknown } | undefined)?.schema_version);
  assert.equal(schemaVersion, 9, "Only the freshly migrated V3 test schema may be reset.");

  const foreignEnvironmentRows = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM belge_paylasim_links WHERE environment_key IS DISTINCT FROM 'development') AS links,
      (SELECT COUNT(*) FROM belge_paylasim_daily_quotas WHERE environment_key <> 'development') AS quotas,
      (SELECT COUNT(*) FROM belge_paylasim_blob_obligations WHERE environment_key <> 'development') AS blobs
  `);
  const unsafeCounts = Object.values(foreignEnvironmentRows.rows[0] as Record<string, string>).map(Number);
  assert.deepEqual(unsafeCounts, [0, 0, 0], "Unexpected non-development rows in the isolated test database.");

  const counts = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM belge_paylasim_links) AS links,
      (SELECT COUNT(*) FROM belge_paylasim_daily_quotas) AS quotas,
      (SELECT COUNT(*) FROM belge_paylasim_blob_obligations) AS obligations
  `);
  const previousRows = Object.fromEntries(
    Object.entries(counts.rows[0] as Record<string, string>).map(([key, value]) => [key, Number(value)]),
  );
  await client.query(`
    TRUNCATE TABLE
      belge_paylasim_cleanup_state,
      belge_paylasim_daily_quotas,
      belge_paylasim_blob_obligations,
      belge_paylasim_links
    CASCADE
  `);
  const remainingResult = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM belge_paylasim_links) AS links,
      (SELECT COUNT(*) FROM belge_paylasim_daily_quotas) AS quotas,
      (SELECT COUNT(*) FROM belge_paylasim_blob_obligations) AS obligations
  `);
  const remainingRows = Object.fromEntries(
    Object.entries(remainingResult.rows[0] as Record<string, string>).map(([key, value]) => [key, Number(value)]),
  );
  assert.deepEqual(remainingRows, { links: 0, quotas: 0, obligations: 0 }, "Isolated test share rows must be empty after cleanup.");
  return { schemaVersion, previousRows, remainingRows };
}

function makeInput(runId: string, label: string, ownerHash: string): ReservationAttemptInput {
  const attemptId = randomUUID();
  const requestId = `${runId}-${label}`;
  return {
    requestIdHash: sha256Hex(requestId),
    payloadDigest: sha256Hex(`payload:${requestId}`),
    tokenHash: sha256Hex(`view:${requestId}`),
    manageTokenHash: sha256Hex(`manage:${requestId}`),
    documentId: "beton-dokum-tutanagi",
    blobPathname: `belge_paylasim/${attemptId}.pdf`,
    creatorIpHash: sha256Hex("ASAMA_13 synthetic shared NAT"),
    expiresAt: new Date(Date.now() + BELGE_SHARE_CONFIG.EXPIRATION_MS),
    ownerHash,
    ownerVersion: 1,
    requestVersion: 1,
    proofHash: sha256Hex(`proof:${requestId}`),
    proofVersion: 1,
    tokenVersion: 2,
    tokenKeyVersion: 1,
    reservationNonce: randomBytes(32),
    environmentKey: "development",
    attemptId,
    attemptVersion: 1,
    leaseUntil: new Date(Date.now() + BELGE_SHARE_CONFIG.ATTEMPT_LEASE_DURATION_MS),
  };
}

async function main() {
  assert.equal(process.env.BELGE_STAGE13_ALLOW_RESET, "1", "Explicit test-only reset flag is required.");
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  assert.ok(databaseUrl, "Isolated Neon test URL is required.");
  assert.ok(blobToken, "Private test Blob token is required.");

  const poolA = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 15_000, idleTimeoutMillis: 15_000 });
  const poolB = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 15_000, idleTimeoutMillis: 15_000 });
  let clientA: Awaited<ReturnType<typeof poolA.connect>> | undefined;
  let clientB: Awaited<ReturnType<typeof poolB.connect>> | undefined;
  let cleanupError: unknown;
  try {
    clientA = await poolA.connect();
    clientB = await poolB.connect();
    const pidRowsA = await clientA.query("SELECT pg_backend_pid() AS pid");
    const pidRowsB = await clientB.query("SELECT pg_backend_pid() AS pid");
    const pidA = Number(pidRowsA.rows[0]?.pid);
    const pidB = Number(pidRowsB.rows[0]?.pid);
    assert.ok(pidA > 0 && pidB > 0 && pidA !== pidB, "The two test clients must use independent PostgreSQL backends.");

    const initialBlobObjectsDeleted = await clearTestBlobs(blobToken);
    const databaseBefore = await clearTestRows(clientA);
    const runId = `stage13-${randomUUID()}`;
    const quotaConfig = { globalDailyLimit: 1000, globalMaxStorageBytes: 1024 * 1024 * 1024 };
    const sqlA = createQueryClient(clientA);
    const sqlB = createQueryClient(clientB);
    const repoA = new NeonBelgePaylasimRepository(undefined, sqlA, quotaConfig);
    const repoB = new NeonBelgePaylasimRepository(undefined, sqlB, quotaConfig);

    const parallelOwner = sha256Hex(`${runId}:parallel-owner`);
    const parallelInputs = Array.from({ length: 100 }, (_, index) =>
      makeInput(runId, `parallel-${String(index).padStart(3, "0")}`, parallelOwner),
    );
    const parallelResults = await Promise.all(parallelInputs.map((input, index) =>
      (index % 2 ? repoB : repoA).createOrGetReservation(input)
        .then((result) => ({ result }))
        .catch((error: unknown) => ({ error })),
    ));
    const parallelAccepted = parallelResults.flatMap((item) => "result" in item ? [item.result] : []);
    const parallelBlocked = parallelResults.flatMap((item) => "error" in item ? [item.error] : []);
    assert.equal(parallelAccepted.length, 50, "Exactly 50 of 100 independent request IDs may reserve.");
    assert.equal(parallelBlocked.length, 50);
    assert.ok(parallelBlocked.every((error) => error instanceof BelgeShareQuotaError && error.code === "BROWSER_QUOTA_RESERVED"));
    await Promise.all(parallelAccepted.map((result, index) => {
      const repo = index % 2 ? repoB : repoA;
      return repo.finalizeReady(result.record.id, 2048, sha256Hex(result.record.id), result.record.attemptId ?? undefined, result.record.attemptVersion);
    }));
    const parallelQuota = await repoA.getDailyQuota("development", parallelOwner);
    assert.deepEqual({ used: parallelQuota.usedLinks, reserved: parallelQuota.reservedLinks }, { used: 50, reserved: 0 });

    const repeatOwner = sha256Hex(`${runId}:repeat-owner`);
    const repeatInput = makeInput(runId, "same-id-100x", repeatOwner);
    const repeatResults = await Promise.all(Array.from({ length: 100 }, (_, index) =>
      (index % 2 ? repoB : repoA).createOrGetReservation(repeatInput),
    ));
    assert.equal(repeatResults.filter((result) => result.created).length, 1);
    assert.equal(new Set(repeatResults.map((result) => result.record.id)).size, 1);
    const repeatQuotaBeforeFinalize = await repoB.getDailyQuota("development", repeatOwner);
    assert.deepEqual({ used: repeatQuotaBeforeFinalize.usedLinks, reserved: repeatQuotaBeforeFinalize.reservedLinks }, { used: 0, reserved: 1 });
    const repeatRecord = repeatResults[0]!.record;
    assert.equal(await repoA.finalizeReady(repeatRecord.id, 1536, sha256Hex(repeatRecord.id), repeatRecord.attemptId ?? undefined, repeatRecord.attemptVersion), true);
    assert.equal(await repoB.finalizeReady(repeatRecord.id, 1536, sha256Hex(repeatRecord.id), repeatRecord.attemptId ?? undefined, repeatRecord.attemptVersion), false);
    const repeatQuotaAfterFinalize = await repoB.getDailyQuota("development", repeatOwner);
    assert.deepEqual({ used: repeatQuotaAfterFinalize.usedLinks, reserved: repeatQuotaAfterFinalize.reservedLinks }, { used: 1, reserved: 0 });

    const boundaryOwner = sha256Hex(`${runId}:boundary-owner`);
    const boundaryInputs = Array.from({ length: 50 }, (_, index) =>
      makeInput(runId, `boundary-${String(index + 1).padStart(2, "0")}`, boundaryOwner),
    );
    for (let index = 0; index < 49; index += 1) {
      const reservation = await (index % 2 ? repoB : repoA).createOrGetReservation(boundaryInputs[index]!);
      assert.equal(reservation.created, true);
      assert.equal(await (index % 2 ? repoB : repoA).finalizeReady(
        reservation.record.id, 1024, sha256Hex(reservation.record.id), reservation.record.attemptId ?? undefined, reservation.record.attemptVersion,
      ), true);
    }
    const quota49 = await repoA.getDailyQuota("development", boundaryOwner);
    assert.deepEqual({ used: quota49.usedLinks, reserved: quota49.reservedLinks }, { used: 49, reserved: 0 });
    const boundaryResult = await repoB.createOrGetReservation(boundaryInputs[49]!);
    assert.equal(boundaryResult.created, true);
    const quota49PlusReserved = await repoA.getDailyQuota("development", boundaryOwner);
    assert.deepEqual({ used: quota49PlusReserved.usedLinks, reserved: quota49PlusReserved.reservedLinks }, { used: 49, reserved: 1 });
    const quota51ReservedError = await repoA.createOrGetReservation(makeInput(runId, "boundary-51", boundaryOwner)).then(
      () => null,
      (error: unknown) => error,
    );
    assert.ok(quota51ReservedError instanceof BelgeShareQuotaError && quota51ReservedError.code === "BROWSER_QUOTA_RESERVED");
    assert.equal(await repoA.finalizeReady(
      boundaryResult.record.id, 1024, sha256Hex(boundaryResult.record.id), boundaryResult.record.attemptId ?? undefined, boundaryResult.record.attemptVersion,
    ), true);
    const quota50 = await repoB.getDailyQuota("development", boundaryOwner);
    assert.deepEqual({ used: quota50.usedLinks, reserved: quota50.reservedLinks }, { used: 50, reserved: 0 });
    const quota51FullError = await repoB.createOrGetReservation(makeInput(runId, "boundary-51", boundaryOwner)).then(
      () => null,
      (error: unknown) => error,
    );
    assert.ok(quota51FullError instanceof BelgeShareQuotaError && quota51FullError.code === "DAILY_BROWSER_QUOTA_EXCEEDED");

    const beforeCapacity = await repoA.getActiveStats();
    const storageCap = beforeCapacity.totalActiveBytes + BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES * 2;
    const capacityConfig = { globalDailyLimit: 1000, globalMaxStorageBytes: storageCap };
    const capacityRepoA = new NeonBelgePaylasimRepository(undefined, sqlA, capacityConfig);
    const capacityRepoB = new NeonBelgePaylasimRepository(undefined, sqlB, capacityConfig);
    const capacityOwner = sha256Hex(`${runId}:capacity-owner`);
    const capacityInputs = Array.from({ length: 3 }, (_, index) => makeInput(runId, `capacity-${index}`, capacityOwner));
    const capacityResults = await Promise.all(capacityInputs.map((input, index) =>
      (index % 2 ? capacityRepoB : capacityRepoA).createOrGetReservation(input)
        .then((result) => ({ result }))
        .catch((error: unknown) => ({ error })),
    ));
    const capacityAccepted = capacityResults.flatMap((item) => "result" in item ? [item.result] : []);
    const capacityBlocked = capacityResults.flatMap((item) => "error" in item ? [item.error] : []);
    assert.equal(capacityAccepted.length, 2);
    assert.equal(capacityBlocked.length, 1);
    assert.ok(capacityBlocked[0] instanceof BelgeShareQuotaError && capacityBlocked[0].code === "STORAGE_CAPACITY_UNAVAILABLE");
    assert.equal((await repoA.getActiveStats()).totalActiveBytes, storageCap);
    const firstCapacityRecord = capacityAccepted[0]!.record;
    assert.equal(await capacityRepoA.markFailed(firstCapacityRecord.id, "STAGE13_CAPACITY_REFUND", firstCapacityRecord.attemptId ?? undefined, firstCapacityRecord.attemptVersion, "not_started"), true);
    assert.equal((await repoB.getActiveStats()).totalActiveBytes, storageCap - BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES);
    const secondCapacityRecord = capacityAccepted[1]!.record;
    assert.equal(await capacityRepoB.markFailed(secondCapacityRecord.id, "STAGE13_CAPACITY_REFUND", secondCapacityRecord.attemptId ?? undefined, secondCapacityRecord.attemptVersion, "not_started"), true);
    assert.equal((await repoA.getActiveStats()).totalActiveBytes, beforeCapacity.totalActiveBytes);

    const renderOwner = sha256Hex(`${runId}:render-failure-owner`);
    const renderFailure = await repoA.createOrGetReservation(makeInput(runId, "render-failure", renderOwner));
    assert.equal(await repoA.markFailed(renderFailure.record.id, "STAGE13_RENDER_FAILURE", renderFailure.record.attemptId ?? undefined, renderFailure.record.attemptVersion, "not_started"), true);
    assert.equal(await repoB.markFailed(renderFailure.record.id, "STAGE13_RENDER_FAILURE", renderFailure.record.attemptId ?? undefined, renderFailure.record.attemptVersion, "not_started"), false);
    assert.deepEqual(
      await repoA.getDailyQuota("development", renderOwner).then(({ usedLinks, reservedLinks }) => ({ used: usedLinks, reserved: reservedLinks })),
      { used: 0, reserved: 0 },
    );

    const uploadOwner = sha256Hex(`${runId}:upload-failure-owner`);
    const uploadFailure = await repoA.createOrGetReservation(makeInput(runId, "uploaded-finalize-failure", uploadOwner));
    assert.equal(await repoA.finalizeReady(
      uploadFailure.record.id, 4096, sha256Hex(uploadFailure.record.id), randomUUID(), uploadFailure.record.attemptVersion,
    ), false, "Wrong attempt fencing must reject a late finalize.");
    assert.equal(await repoB.markFailed(uploadFailure.record.id, "STAGE13_FINALIZE_FAILURE", uploadFailure.record.attemptId ?? undefined, uploadFailure.record.attemptVersion, "present", 1234), true);
    assert.equal(await repoA.markFailed(uploadFailure.record.id, "STAGE13_FINALIZE_FAILURE", uploadFailure.record.attemptId ?? undefined, uploadFailure.record.attemptVersion, "present", 1234), false);
    assert.equal((await repoA.getActiveStats()).totalActiveBytes, beforeCapacity.totalActiveBytes + 1234);
    await repoB.markBlobDeleted("development", uploadFailure.record.blobPathname);
    assert.equal((await repoB.getActiveStats()).totalActiveBytes, beforeCapacity.totalActiveBytes);

    const ackOwner = sha256Hex(`${runId}:lost-ack-owner`);
    const ackReservation = await repoA.createOrGetReservation(makeInput(runId, "lost-finalize-ack", ackOwner));
    assert.equal(await repoA.finalizeReady(
      ackReservation.record.id, 777, sha256Hex(ackReservation.record.id), ackReservation.record.attemptId ?? undefined, ackReservation.record.attemptVersion,
    ), true);
    assert.equal(await repoB.finalizeReady(
      ackReservation.record.id, 777, sha256Hex(ackReservation.record.id), ackReservation.record.attemptId ?? undefined, ackReservation.record.attemptVersion,
    ), false, "A repeated finalize after a lost acknowledgement must not double-account.");
    const ackQuota = await repoA.getDailyQuota("development", ackOwner);
    assert.deepEqual({ used: ackQuota.usedLinks, reserved: ackQuota.reservedLinks }, { used: 1, reserved: 0 });

    const finalStats = await repoA.getActiveStats();
    const finalBlobObjectsDeleted = await clearTestBlobs(blobToken);
    const databaseAfter = await clearTestRows(clientA);
    console.log(JSON.stringify({
      status: "PASS",
      independentPostgresBackends: true,
      schemaVersion: databaseBefore.schemaVersion,
      initialBlobObjectsDeleted,
      finalBlobObjectsDeleted,
      databaseBefore,
      databaseAfter,
      uniqueIds: { attempted: 100, accepted: parallelAccepted.length, quotaBlocked: parallelBlocked.length, finalized: parallelQuota.usedLinks },
      sameId: { attempts: repeatResults.length, created: repeatResults.filter((result) => result.created).length, reservedBeforeFinalize: repeatQuotaBeforeFinalize.reservedLinks, usedAfterFinalize: repeatQuotaAfterFinalize.usedLinks },
      browserQuotaBoundary: { at49: quota49.usedLinks, at49PlusReserved: quota49PlusReserved.reservedLinks, afterFinalize: quota50.usedLinks, reservation51Blocked: true, daily51Blocked: true },
      byteCapacity: { accepted: capacityAccepted.length, blocked: capacityBlocked.length, byteRefundVerified: true },
      failureInjection: { renderRefundOnce: true, uploadedFinalizeFailureRetainedBytesUntilDelete: true, lostFinalizeAckNotDoubleCounted: true },
      finalStatsBeforeCleanup: finalStats,
    }));
  } finally {
    try {
      if (clientA) {
        await clearTestBlobs(blobToken!);
        await clearTestRows(clientA);
      }
    } catch (error) {
      cleanupError = error;
    }
    clientA?.release();
    clientB?.release();
    await Promise.all([poolA.end(), poolB.end()]);
    clearTimeout(timeout);
    if (cleanupError) throw cleanupError;
  }
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown live PostgreSQL test failure.";
    console.error(`ASAMA_13 PostgreSQL test failed: ${message}`);
    process.exit(1);
  });
