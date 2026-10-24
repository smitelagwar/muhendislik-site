import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import { executeBelgePaylasimCleanup } from "../../src/lib/belge-paylasim/cleanup";
import { GET as cronGet } from "../../src/app/api/cron/belge-paylasim-temizlik/route";
import {
  MemoryBelgePaylasimRepository,
  NeonBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";
import type { ReservationAttemptInput } from "../../src/lib/belge-paylasim/types";

const projectRoot = path.resolve(process.cwd());
const DOCUMENT_ID = "beton-dokum-tutanagi" as const;
const OWNER_HASH = sha256Hex("stage09-cleanup-owner");
const MAX_STORAGE_BYTES = 100 * 1024 * 1024 * 1024;

async function withSqlRepository<T>(
  run: (database: PGlite, repository: NeonBelgePaylasimRepository, client: NeonQueryFunction<false, false>) => Promise<T>,
): Promise<T> {
  const database = new PGlite();
  try {
    for (const file of [
      "001_dokumantasyon_base.sql",
      "002_upload_integrity.sql",
      "004_cad_aps_derivatives.sql",
      "005_belge_paylasim.sql",
      "006_belge_paylasim_v3_runtime.sql",
      "007_belge_paylasim_token_key_version.sql",
      "008_belge_paylasim_atomic_quota.sql",
      "009_belge_paylasim_cleanup_queue.sql",
    ]) {
      await database.exec(await readFile(path.join(projectRoot, "db/migrations", file), "utf8"));
    }
    const client = Object.assign(
      async (parts: TemplateStringsArray, ...values: unknown[]) => {
        let statement = parts[0] ?? "";
        for (let index = 0; index < values.length; index += 1) statement += `$${index + 1}${parts[index + 1] ?? ""}`;
        return (await database.query(statement, values as never[])).rows;
      },
      { async query(statement: string) { return (await database.query(statement)).rows; } },
    ) as unknown as NeonQueryFunction<false, false>;
    const repository = new NeonBelgePaylasimRepository(undefined, client, {
      globalDailyLimit: 20_000,
      globalMaxStorageBytes: MAX_STORAGE_BYTES,
    });
    return await run(database, repository, client);
  } finally {
    await database.close();
  }
}

function reservationInput(id: string): ReservationAttemptInput {
  const attemptId = crypto.randomUUID();
  return {
    requestIdHash: sha256Hex(`request-${id}`),
    payloadDigest: sha256Hex(`payload-${id}`),
    tokenHash: sha256Hex(`view-${id}`),
    manageTokenHash: sha256Hex(`manage-${id}`),
    documentId: DOCUMENT_ID,
    blobPathname: `belge_paylasim/${attemptId}.pdf`,
    creatorIpHash: sha256Hex("198.51.100.19"),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    ownerHash: OWNER_HASH,
    ownerVersion: 1,
    requestVersion: 1,
    proofHash: sha256Hex(`proof-${id}`),
    proofVersion: 1,
    tokenVersion: 2,
    tokenKeyVersion: 1,
    reservationNonce: crypto.randomBytes(32),
    environmentKey: "local",
    attemptId,
    attemptVersion: 1,
    leaseUntil: new Date(Date.now() + 120_000),
  };
}

async function createReady(repository: NeonBelgePaylasimRepository, id: string, sizeBytes = 4096) {
  const input = reservationInput(id);
  const created = await repository.createOrGetReservation(input);
  assert.equal(created.created, true);
  assert.equal(await repository.finalizeReady(
    created.record.id, sizeBytes, sha256Hex(`pdf-${id}`), input.attemptId, input.attemptVersion,
  ), true);
  return created.record;
}

function ageBlob(store: MemoryBelgeBlobStore, pathname: string, ageMs = 25 * 60 * 60 * 1000): void {
  const item = (store as unknown as { store: Map<string, { data: Uint8Array; createdAt: Date }> }).store.get(pathname);
  if (item) item.createdAt = new Date(Date.now() - ageMs);
}

describe("ASAMA_09: kalıcı cleanup checkpoint, fencing, pagination ve byte borcu", () => {
  it("ilk sayfa sürekli kayıtlı olsa da 120/500/1000 yetimi bütün sayfalarda tarar ve temizler", async () => {
    for (const orphanCount of [120, 500, 1000]) {
      const repository = new MemoryBelgePaylasimRepository();
      const store = new MemoryBelgeBlobStore();
      const activeCount = 50;
      for (let index = 0; index < activeCount; index += 1) {
        const pathname = `belge_paylasim/000-active-${String(index).padStart(3, "0")}.pdf`;
        await repository.createPendingReservation({
          requestIdHash: `active-request-${orphanCount}-${index}`,
          payloadDigest: `active-payload-${index}`,
          tokenHash: `active-view-${orphanCount}-${index}`,
          manageTokenHash: `active-manage-${orphanCount}-${index}`,
          documentId: DOCUMENT_ID,
          blobPathname: pathname,
          creatorIpHash: "test-ip",
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          environmentKey: "local",
          attemptId: crypto.randomUUID(),
          leaseUntil: new Date(Date.now() + 120_000),
        });
        await store.put(pathname, new Uint8Array([1]));
      }
      for (let index = 0; index < orphanCount; index += 1) {
        const pathname = `belge_paylasim/100-orphan-${String(index).padStart(4, "0")}.pdf`;
        await store.put(pathname, new Uint8Array([index & 255, 9]));
        ageBlob(store, pathname);
      }

      const stats = await executeBelgePaylasimCleanup({
        repository, blobStore: store, environmentKey: "local", pageSize: 50, batchLimit: 100, maxDurationMs: 30_000,
      });

      assert.equal(stats.success, true, `orphanCount=${orphanCount}: ${JSON.stringify(stats.errors)}`);
      assert.equal(stats.orphanBlobCount, orphanCount);
      assert.equal(stats.purgedCount, orphanCount);
      assert.equal(stats.listPageCount, Math.ceil((activeCount + orphanCount) / 50));
      assert.equal(store.size(), activeCount);
      assert.equal((await repository.getCleanupMetrics("local")).pendingDeleteCount, 0);
    }
  });

  it("deadline sonrası cursor ve byte borcunu saklar; sonraki cron kaldığı sayfadan tamamlar", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    for (let index = 0; index < 120; index += 1) {
      const pathname = `belge_paylasim/restart-${String(index).padStart(3, "0")}.pdf`;
      await store.put(pathname, new Uint8Array([1, 2, 3]));
      ageBlob(store, pathname);
    }
    const firstPage = store.list.bind(store);
    let delayFirstPage = true;
    store.list = async (prefix, options) => {
      const page = await firstPage(prefix, options);
      if (delayFirstPage) {
        delayFirstPage = false;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return page;
    };

    const partial = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local", pageSize: 20, maxDurationMs: 30 });
    assert.equal(partial.success, false);
    assert.equal(partial.partial, true);
    assert.equal(partial.listPageCount, 1);
    assert.equal(store.size(), 120, "tam tarama tamamlanmadan Blob silinmemeli");
    assert.equal((await repository.getCleanupMetrics("local")).pendingDeleteCount, 20);

    const resumed = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local", pageSize: 20, maxDurationMs: 30_000 });
    assert.equal(resumed.success, true, JSON.stringify(resumed.errors));
    assert.equal(resumed.listPageCount, 5);
    assert.equal(store.size(), 0);
    assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
  });

  it("bozuk SDK cursor'ı baştan tarayarak düzeltir ve aynı yetim yükümlülüğünü çoğaltmaz", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    for (let index = 0; index < 3; index += 1) {
      const pathname = `belge_paylasim/cursor-${index}.pdf`;
      await store.put(pathname, new Uint8Array([index]));
      ageBlob(store, pathname);
    }
    const lease = await repository.claimCleanupRun(crypto.randomUUID(), 90_000);
    assert.equal(lease.acquired, true);
    assert.equal(await repository.saveCleanupCheckpoint(lease.ownerId, lease.leaseVersion, "invalid:stale", new Date(), 90_000), true);
    assert.equal(await repository.finishCleanupRun(lease.ownerId, lease.leaseVersion, "partial"), true);

    const stats = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local", pageSize: 2 });
    assert.equal(stats.success, true, JSON.stringify(stats.errors));
    assert.equal(stats.purgedCount, 3);
    assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
  });

  it("iki eşzamanlı cron'dan yalnız biri lease alır", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    let markEntered!: () => void;
    let releaseFirst!: () => void;
    const entered = new Promise<void>((resolve) => { markEntered = resolve; });
    const hold = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const originalList = store.list.bind(store);
    let held = false;
    store.list = async (prefix, options) => {
      if (!held) {
        held = true;
        markEntered();
        await hold;
      }
      return originalList(prefix, options);
    };

    const firstRun = executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
    await entered;
    const secondRun = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
    assert.equal(secondRun.alreadyRunning, true);
    assert.equal(secondRun.success, false);
    releaseFirst();
    assert.equal((await firstRun).success, true);
  });

  it("silme hatası ham SDK mesajını açığa çıkarmaz ve byte borcu retry backoff'a kadar korunur", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    const pathname = "belge_paylasim/delete-failure.pdf";
    await store.put(pathname, new Uint8Array([7, 8, 9, 10]));
    ageBlob(store, pathname);
    store.del = async () => { throw new Error("https://private.example/blob?token=secret"); };

    const stats = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
    assert.equal(stats.success, false);
    assert.equal(stats.errorCount, 1);
    assert.equal(JSON.stringify(stats).includes("private.example"), false);
    assert.equal(JSON.stringify(stats).includes("secret"), false);
    assert.equal(store.has(pathname), true);
    const metrics = await repository.getCleanupMetrics("local");
    assert.equal(metrics.pendingDeleteCount, 1);
    assert.equal(metrics.failedDeleteCount, 1);
    assert.equal(metrics.pendingDeleteBytes, 4);
    assert.equal(metrics.liableBytes, 4);
  });

  it("başarısız ilk kayıt retry backoff'a alınır; batch=1 iken sonraki iş aç kalmaz", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    const failedPath = "belge_paylasim/aaa-failed-once.pdf";
    const nextPath = "belge_paylasim/bbb-next.pdf";
    await store.put(failedPath, new Uint8Array([1]));
    await store.put(nextPath, new Uint8Array([2]));
    ageBlob(store, failedPath);
    ageBlob(store, nextPath);
    const originalDelete = store.del.bind(store);
    let failedOnce = false;
    store.del = async (pathname) => {
      if (pathname === failedPath && !failedOnce) {
        failedOnce = true;
        throw new Error("private store failure");
      }
      await originalDelete(pathname);
    };

    const stats = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local", batchLimit: 1 });
    assert.equal(stats.success, false);
    assert.equal(stats.errorCount, 1);
    assert.equal(store.has(failedPath), true);
    assert.equal(store.has(nextPath), false);
    assert.equal((await repository.getCleanupMetrics("local")).pendingDeleteCount, 1);
  });

  it("cleanup hatası cron HTTP sözleşmesinde 503 olur ve SDK URL/secret dışarı çıkmaz", async () => {
    const previousSecret = process.env.CRON_SECRET;
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    const pathname = "belge_paylasim/cron-delete-failure.pdf";
    await store.put(pathname, new Uint8Array([4, 5]));
    ageBlob(store, pathname);
    store.del = async () => { throw new Error("https://private.example/?token=secret"); };
    process.env.CRON_SECRET = "stage09-test-cron-secret-with-more-than-32-bytes";
    setBelgePaylasimRepositoryForTest(repository);
    setBelgeBlobStoreForTest(store);
    try {
      const response = await cronGet(new Request("http://localhost/api/cron/belge-paylasim-temizlik", {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }));
      assert.equal(response.status, 503);
      const body = await response.text();
      assert.match(body, /"success":false/);
      assert.equal(body.includes("private.example"), false);
      assert.equal(body.includes("secret"), false);
    } finally {
      setBelgePaylasimRepositoryForTest(null);
      setBelgeBlobStoreForTest(null);
      if (previousSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previousSecret;
    }
  });

  it("yanlış prefix'li Blob listesini yok sayar", async () => {
    const repository = new MemoryBelgePaylasimRepository();
    const store = new MemoryBelgeBlobStore();
    store.list = async () => ({
      blobs: [{ pathname: "dok_storage/other.pdf", sizeBytes: 99, uploadedAt: new Date(Date.now() - 30 * 60 * 60 * 1000) }],
      hasMore: false,
    });
    const stats = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
    assert.equal(stats.success, true);
    assert.equal(stats.orphanBlobCount, 0);
    assert.equal(store.size(), 0);
    assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
  });

  it("PGlite adapter: global lease fencing eski cron'un checkpoint ve bitişini reddeder", async () => {
    await withSqlRepository(async (database, repoA, client) => {
      const repoB = new NeonBelgePaylasimRepository(undefined, client, {
        globalDailyLimit: 20_000,
        globalMaxStorageBytes: MAX_STORAGE_BYTES,
      });
      const oldOwner = crypto.randomUUID();
      const oldLease = await repoA.claimCleanupRun(oldOwner, 90_000);
      assert.equal(oldLease.acquired, true);
      await database.query("UPDATE belge_paylasim_cleanup_state SET lease_until = NOW() - INTERVAL '1 second' WHERE singleton = TRUE");
      const newLease = await repoB.claimCleanupRun(crypto.randomUUID(), 90_000);
      assert.equal(newLease.acquired, true);
      assert.ok(newLease.leaseVersion > oldLease.leaseVersion);
      assert.equal(await repoA.saveCleanupCheckpoint(oldOwner, oldLease.leaseVersion, "old-cursor", new Date(), 90_000), false);
      assert.equal(await repoA.finishCleanupRun(oldOwner, oldLease.leaseVersion, "success"), false);
    });
  });

  it("PGlite adapter: 1.000 orphan'ı checkpoint'li sayfalarda temizler ve ilk aktif sayfayı korur", async (t) => {
    await withSqlRepository(async (database, repository) => {
      const store = new MemoryBelgeBlobStore();
      for (let index = 0; index < 20; index += 1) {
        const pathname = `belge_paylasim/000-active-${String(index).padStart(3, "0")}.pdf`;
        await repository.createPendingReservation({
          requestIdHash: sha256Hex(`sql-active-request-${index}`),
          payloadDigest: sha256Hex(`sql-active-payload-${index}`),
          tokenHash: sha256Hex(`sql-active-view-${index}`),
          manageTokenHash: sha256Hex(`sql-active-manage-${index}`),
          documentId: DOCUMENT_ID,
          blobPathname: pathname,
          creatorIpHash: sha256Hex("active-ip"),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
        await store.put(pathname, new Uint8Array([1]));
      }
      await database.query("UPDATE belge_paylasim_links SET lease_until = NOW() + INTERVAL '2 minutes' WHERE blob_pathname LIKE 'belge_paylasim/000-active-%'");
      for (let index = 0; index < 1000; index += 1) {
        const pathname = `belge_paylasim/100-orphan-${String(index).padStart(4, "0")}.pdf`;
        await store.put(pathname, new Uint8Array([index & 255, 8]));
        ageBlob(store, pathname);
      }
      const startedAt = Date.now();
      const stats = await executeBelgePaylasimCleanup({
        repository, blobStore: store, environmentKey: "local", pageSize: 20, batchLimit: 100, maxDurationMs: 30_000,
      });
      const elapsedMs = Date.now() - startedAt;
      t.diagnostic(`PGlite + Memory Blob adapter: 1,000 orphan / 51 pages / ${elapsedMs}ms; limit=30,000ms.`);
      assert.equal(stats.success, true, JSON.stringify(stats.errors));
      assert.equal(stats.listPageCount, 51);
      assert.equal(stats.orphanBlobCount, 1000);
      assert.equal(stats.purgedCount, 1000);
      assert.ok(elapsedMs < 30_000, `bounded 1,000-item cleanup took ${elapsedMs}ms`);
      assert.equal(store.size(), 20);
      assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
    });
  });

  it("PGlite adapter: expired link physical delete sonucu byte borcunu atomik kapatır", async () => {
    await withSqlRepository(async (database, repository) => {
      const record = await createReady(repository, "expired-link");
      await database.query("UPDATE belge_paylasim_links SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1", [record.id]);
      const expiration = await database.query<{ expires_at: Date }>("SELECT expires_at FROM belge_paylasim_links WHERE id = $1", [record.id]);
      const pendingMetrics = await repository.getCleanupMetrics("local");
      assert.equal(pendingMetrics.dueDeleteCount, 1);
      assert.ok(pendingMetrics.oldestPendingDeleteAt);
      assert.ok(Math.abs(pendingMetrics.oldestPendingDeleteAt.getTime() - new Date(expiration.rows[0]!.expires_at).getTime()) < 2_000);
      const lease = await repository.claimCleanupRun(crypto.randomUUID(), 90_000);
      const claims = await repository.claimDueCleanupBlobs("local", lease.ownerId, lease.leaseVersion, 10, 30_000);
      assert.equal(claims.length, 1);
      assert.equal(await repository.completeCleanupBlob(claims[0]!), true);
      const updated = await repository.findByRequestIdHash(sha256Hex("request-expired-link"));
      assert.equal(updated?.status, "purged");
      assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
      assert.equal((await repository.getDailyQuota("local", OWNER_HASH)).usedLinks, 1);
    });
  });

  it("PGlite adapter: delete queue lease kalıntısını partial raporlar, eski owner'ı fence eder ve lease bitince sürdürür", async () => {
    await withSqlRepository(async (database, repository) => {
      const store = new MemoryBelgeBlobStore();
      const record = await createReady(repository, "leased-delete-backlog", 4);
      await database.query("UPDATE belge_paylasim_links SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1", [record.id]);
      await store.put(record.blobPathname, new Uint8Array([1, 2, 3, 4]));

      const oldLease = await repository.claimCleanupRun(crypto.randomUUID(), 90_000);
      const oldClaims = await repository.claimDueCleanupBlobs("local", oldLease.ownerId, oldLease.leaseVersion, 1, 120_000);
      assert.equal(oldClaims.length, 1);
      assert.equal(await repository.finishCleanupRun(oldLease.ownerId, oldLease.leaseVersion, "partial"), true);

      const blocked = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
      assert.equal(blocked.success, false);
      assert.equal(blocked.outcome, "partial");
      assert.equal(blocked.metrics?.dueDeleteCount, 1);
      assert.equal(blocked.metrics?.leasedDeleteCount, 1);
      assert.equal(await repository.completeCleanupBlob(oldClaims[0]!), false, "run fencing stale row-lease sahibini reddetmeli");
      assert.equal(store.has(record.blobPathname), true);

      await database.query(
        "UPDATE belge_paylasim_blob_obligations SET cleanup_lease_until = NOW() - INTERVAL '1 second' WHERE blob_pathname = $1",
        [record.blobPathname],
      );
      const resumed = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
      assert.equal(resumed.success, true, JSON.stringify(resumed.errors));
      assert.equal(store.has(record.blobPathname), false);
      assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
    });
  });

  it("PGlite adapter: failed PUT byte borcu cleanup kuyruğunda silinir ve finalize ile dirilmez", async () => {
    await withSqlRepository(async (_database, repository) => {
      const store = new MemoryBelgeBlobStore();
      const input = reservationInput("failed-put-is-cleaned");
      const { record } = await repository.createOrGetReservation(input);
      await store.put(input.blobPathname, new Uint8Array([6, 7, 8, 9]));
      assert.equal(await repository.markFailed(record.id, "PUT_UNCERTAIN", input.attemptId, input.attemptVersion, "present", 4), true);

      const stats = await executeBelgePaylasimCleanup({ repository, blobStore: store, environmentKey: "local" });
      assert.equal(stats.success, true, JSON.stringify(stats.errors));
      assert.equal(store.has(input.blobPathname), false);
      assert.equal(await repository.finalizeReady(record.id, 4, sha256Hex("late-pdf"), input.attemptId, input.attemptVersion), false);
      assert.equal((await repository.findByRequestIdHash(input.requestIdHash))?.status, "failed");
      assert.equal((await repository.getCleanupMetrics("local")).liableBytes, 0);
    });
  });

  it("PGlite adapter: silme hatası retry zamanı ve byte yükümlülüğünü korur", async () => {
    await withSqlRepository(async (database, repository) => {
      const input = reservationInput("failed-delete-sql");
      const { record } = await repository.createOrGetReservation(input);
      assert.equal(await repository.markFailed(record.id, "PUT_UNCERTAIN", input.attemptId, input.attemptVersion, "present", 2048), true);
      const lease = await repository.claimCleanupRun(crypto.randomUUID(), 90_000);
      const claims = await repository.claimDueCleanupBlobs("local", lease.ownerId, lease.leaseVersion, 10, 30_000);
      assert.equal(claims.length, 1);
      assert.equal(await repository.failCleanupBlob(claims[0]!, "BLOB_DELETE_FAILED"), true);
      const metrics = await repository.getCleanupMetrics("local");
      assert.equal(metrics.pendingDeleteCount, 1);
      assert.equal(metrics.failedDeleteCount, 1);
      assert.equal(metrics.pendingDeleteBytes, 2048);
      assert.equal(metrics.liableBytes, 2048);
      assert.equal(metrics.dueDeleteCount, 0, "retry backoff içindeki kayıt due backlog sayılmamalı");
      const obligation = await database.query<{ next_attempt_at: Date }>(
        "SELECT next_attempt_at FROM belge_paylasim_blob_obligations WHERE blob_pathname = $1", [input.blobPathname],
      );
      assert.ok(new Date(obligation.rows[0]!.next_attempt_at).getTime() > Date.now());
    });
  });

  it("PGlite adapter: expired attempt failed olur ve eski Blob borcu 24 saat bekletilir", async () => {
    await withSqlRepository(async (database, repository) => {
      const input = reservationInput("expired-attempt");
      const { record } = await repository.createOrGetReservation(input);
      await database.query("UPDATE belge_paylasim_links SET lease_until = NOW() - INTERVAL '1 second' WHERE id = $1", [record.id]);
      const lease = await repository.claimCleanupRun(crypto.randomUUID(), 90_000);
      assert.equal(await repository.reclaimStalePendingAttempts(
        lease.ownerId, lease.leaseVersion, new Date(Date.now() - 86_400_000), 10, 86_400_000,
      ), 1);
      const updated = await repository.findByRequestIdHash(input.requestIdHash);
      assert.equal(updated?.status, "failed");
      assert.equal(updated?.quotaAccountingStatus, "released");
      assert.equal(await repository.finalizeReady(record.id, 1024, sha256Hex("late-finalize"), input.attemptId, input.attemptVersion), false);
      assert.equal((await repository.getDailyQuota("local", OWNER_HASH)).reservedLinks, 0);
      const obligations = await database.query<{ byte_state: string; next_attempt_at: Date }>(
        "SELECT byte_state, next_attempt_at FROM belge_paylasim_blob_obligations WHERE blob_pathname = $1", [input.blobPathname],
      );
      assert.equal(obligations.rows[0]?.byte_state, "unknown");
      assert.ok(new Date(obligations.rows[0]!.next_attempt_at).getTime() > Date.now() + 23 * 60 * 60 * 1000);
      assert.equal(await repository.finalizeReady(record.id, 2048, sha256Hex("late"), input.attemptId, input.attemptVersion), false);
      assert.equal((await repository.getCleanupMetrics("local")).dueDeleteCount, 0, "24 saatlik bilinmeyen upload grace'i içinde silme due olmamalı");
    });
  });
});
