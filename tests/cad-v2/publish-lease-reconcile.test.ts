import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  CadV2DurableRepository,
  type CadV2SqlExecutor,
  type CadV2SqlStatement,
} from "../../src/lib/cad-v2/db/repository";
import { applyCadV2DurableRepositoryMigration } from "../../src/lib/cad-v2/db/migrate";
import {
  reconcileCadV2ExpiredPublishGenerations,
  type CadV2ReconcileBlobStore,
} from "../../src/lib/cad-v2/db/reconcile";

class MemoryReconcileBlobStore implements CadV2ReconcileBlobStore {
  readonly objects = new Map<string, Date>();
  readonly deleted: string[] = [];
  failNextDelete = false;

  async list({ prefix, cursor }: { prefix: string; cursor?: string }) {
    const entries = Array.from(this.objects.entries())
      .filter(([pathname]) => pathname.startsWith(prefix))
      .sort(([left], [right]) => left.localeCompare(right));
    const offset = Number(cursor ?? 0);
    const page = entries.slice(offset, offset + 1).map(([pathname, uploadedAt]) => ({ pathname, uploadedAt }));
    const nextOffset = offset + page.length;
    return { blobs: page, hasMore: nextOffset < entries.length, cursor: nextOffset < entries.length ? String(nextOffset) : undefined };
  }

  async delete(pathname: string) {
    if (this.failNextDelete) {
      this.failNextDelete = false;
      throw new Error("INJECTED_RECONCILE_DELETE_FAILURE");
    }
    this.deleted.push(pathname);
    this.objects.delete(pathname);
  }
}

function pgliteExecutor(database: PGlite): CadV2SqlExecutor {
  return {
    query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) =>
      (await database.query<T>(text, [...params])).rows,
    transaction: async (statements: readonly CadV2SqlStatement[]) => {
      await database.exec("BEGIN");
      try {
        const results: unknown[][] = [];
        for (const statement of statements) {
          results.push((await database.query(statement.text, [...(statement.params || [])])).rows);
        }
        await database.exec("COMMIT");
        return results;
      } catch (error) {
        await database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

async function run() {
  const database = new PGlite();
  await database.waitReady;
  const executor = pgliteExecutor(database);
  const repository = new CadV2DurableRepository(executor);
  try {
    await applyCadV2DurableRepositoryMigration(executor);
    const now = Date.now();
    await repository.createPreparedRecords({
      artifactKey: "artifact_reconcile",
      sourceSha256: "a".repeat(64),
      job: {
        jobId: "job_reconcile", fileId: "file_reconcile", shareLinkId: null,
        sourceVersionKey: "rev_reconcile", clientRequestId: "request_reconcile",
        status: "running", phase: "publish", progress: 90, fence: 1, attempt: 1,
        createdAt: now, updatedAt: now,
      },
      session: {
        viewSessionId: "vs_reconcile", fileId: "file_reconcile", shareLinkId: null,
        jobId: "job_reconcile", expiresAt: now + 180_000, createdAt: now,
      },
    });
    await executor.query(
      `INSERT INTO cad_v2_job_attempts(job_id,attempt,fence,status,started_at)
       VALUES ('job_reconcile',1,1,'running',now() - interval '3 days')`
    );

    await executor.query(
      `INSERT INTO cad_v2_scenes (
        id, artifact_key, tenant_scope, file_id, source_version_key, source_sha256,
        storage_generation, compiler_revision, schema_version, render_abi, quality_profile,
        font_digest, status, created_at, updated_at
      ) VALUES ('scene_reconcile','artifact_reconcile','global','file_reconcile','rev_reconcile',
        $1,'g_reconcile','candidate-v71',1,'cad-v2-test','test','font-test','staging',
        now() - interval '3 days', now() - interval '3 days')`,
      ["a".repeat(64)]
    );

    assert.equal(await repository.beginPublishLease({
      jobId: "job_reconcile", fence: 1, sceneId: "scene_reconcile",
      storageGeneration: "g_reconcile", ownerId: "publisher-reconcile", ttlMs: 60_000,
    }), true, "publisher must persist a lease before writing generation objects");
    await executor.query(
      `UPDATE cad_v2_publish_leases SET lease_expires_at=now() - interval '3 days'
       WHERE scene_id='scene_reconcile' AND storage_generation='g_reconcile'`
    );

    assert.deepEqual(
      await repository.previewExpiredPublishLeases({ graceMs: 60_000 }),
      [],
      "an active viewer session must protect its expired publisher generation from cleanup"
    );

    await executor.query(
      `UPDATE cad_v2_view_sessions SET lease_expires_at=now() - interval '1 day'
       WHERE id='vs_reconcile'`
    );
    const candidates = await repository.previewExpiredPublishLeases({ graceMs: 60_000 });
    assert.equal(candidates.length, 1, "a lease past the grace window with no active viewer can be reviewed");
    assert.equal(candidates[0]?.sceneId, "scene_reconcile");

    const blobStore = new MemoryReconcileBlobStore();
    const stalePrefix = "cad-v2/scenes/scene_reconcile/objects/g_reconcile/";
    const stalePath = `${stalePrefix}chunk_model_001.bin`;
    const recentPath = `${stalePrefix}chunk_model_002.bin`;
    blobStore.objects.set(stalePath, new Date(Date.now() - 3 * 24 * 60 * 60_000));
    blobStore.objects.set(recentPath, new Date());
    const report = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "report", graceMs: 60_000,
    });
    assert.equal(report[0]?.deletable, 1, "report mode identifies stale generation objects after the grace period");
    assert.equal(report[0]?.preservedRecent, 1, "newly uploaded late objects receive another full grace window");
    assert.equal(report[0]?.deleted, 0, "report mode never changes Blob contents");
    assert.equal(blobStore.objects.has(stalePath), true);
    assert.equal((await repository.getJob("job_reconcile"))?.status, "running", "report mode does not fence the candidate job");
    const stagingBeforeClaim = await executor.query<{ status: string }>(
      `SELECT status FROM cad_v2_scenes WHERE id='scene_reconcile'`
    );
    assert.equal(stagingBeforeClaim[0]?.status, "staging", "report mode does not mutate scene metadata");

    assert.equal(await repository.claimExpiredPublishLease({
      sceneId: "scene_reconcile", storageGeneration: "g_reconcile", graceMs: 60_000,
    }), true, "reconcile must atomically fence the stale publisher before deleting objects");

    assert.equal((await repository.getJob("job_reconcile"))?.status, "failed");
    assert.equal((await repository.getJob("job_reconcile"))?.fence, 2);
    const expiredAttempt = await executor.query<{ status: string; completed_at: Date | string | null }>(
      `SELECT status,completed_at FROM cad_v2_job_attempts WHERE job_id='job_reconcile' AND attempt=1`
    );
    assert.equal(expiredAttempt[0]?.status, "expired", "stale durable attempt must be closed with an audit state");
    assert.ok(expiredAttempt[0]?.completed_at);
    const scene = await executor.query<{ status: string }>(
      `SELECT status FROM cad_v2_scenes WHERE id='scene_reconcile'`
    );
    assert.equal(scene[0]?.status, "orphaned", "staging metadata is quarantined, never promoted to READY");
    const lease = await executor.query<{ status: string }>(
      `SELECT status FROM cad_v2_publish_leases WHERE scene_id='scene_reconcile' AND storage_generation='g_reconcile'`
    );
    assert.equal(lease[0]?.status, "reconciling");

    blobStore.failNextDelete = true;
    await assert.rejects(
      reconcileCadV2ExpiredPublishGenerations({ repository, blobStore, mode: "apply", graceMs: 60_000 }),
      /INJECTED_RECONCILE_DELETE_FAILURE/
    );
    const afterDeleteFailure = await executor.query<{ status: string }>(
      `SELECT status FROM cad_v2_publish_leases WHERE scene_id='scene_reconcile' AND storage_generation='g_reconcile'`
    );
    assert.equal(afterDeleteFailure[0]?.status, "reconciling", "partial cleanup stays retryable after a Blob deletion error");

    const applied = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "apply", graceMs: 60_000,
    });
    assert.equal(applied[0]?.deleted, 1, "apply deletes only the claimed, unreferenced generation prefix");
    assert.equal(applied[0]?.preservedRecent, 1);
    assert.equal(applied[0]?.completed, false, "late object bytes keep the tombstone open for another pass");
    assert.deepEqual(blobStore.deleted, [stalePath]);
    assert.equal(blobStore.objects.has(recentPath), true);
    blobStore.objects.set(recentPath, new Date(Date.now() - 3 * 24 * 60 * 60_000));
    const secondPass = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "apply", graceMs: 60_000,
    });
    assert.equal(secondPass[0]?.deleted, 1);
    assert.equal(secondPass[0]?.completed, true, "the generation closes after the late object ages past grace and is removed");
    assert.deepEqual(blobStore.deleted, [stalePath, recentPath]);
    const reconciled = await executor.query<{ status: string }>(
      `SELECT status FROM cad_v2_publish_leases WHERE scene_id='scene_reconcile' AND storage_generation='g_reconcile'`
    );
    assert.equal(reconciled[0]?.status, "reconciled");
    const latePath = `${stalePrefix}chunk_model_003.bin`;
    blobStore.objects.set(latePath, new Date());
    await executor.query(
      `UPDATE cad_v2_publish_leases SET updated_at=now() - interval '3 days'
       WHERE scene_id='scene_reconcile' AND storage_generation='g_reconcile'`
    );
    const lateUploadPass = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "apply", graceMs: 60_000,
    });
    assert.equal(lateUploadPass[0]?.preservedRecent, 1, "a delayed in-flight Blob write stays hidden and is rechecked on later runs");
    assert.equal(lateUploadPass[0]?.completed, false);
    assert.equal(blobStore.objects.has(latePath), true);
    blobStore.objects.set(latePath, new Date(Date.now() - 3 * 24 * 60 * 60_000));
    const lateCleanupPass = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "apply", graceMs: 60_000,
    });
    assert.equal(lateCleanupPass[0]?.deleted, 1);
    assert.equal(lateCleanupPass[0]?.completed, true);
    assert.deepEqual(blobStore.deleted, [stalePath, recentPath, latePath]);

    const readyNow = Date.now();
    const readyJobId = "job_repo_ready_reconcile";
    const readyRequest = await repository.createPreparedRecords({
      artifactKey: "artifact_repo_ready_reconcile",
      sourceSha256: "c".repeat(64),
      job: {
        jobId: readyJobId, fileId: "file_repo_ready_reconcile", shareLinkId: null,
        sourceVersionKey: "rev_repo_ready_reconcile", clientRequestId: "request_repo_ready_reconcile",
        status: "running", phase: "publish", progress: 90, fence: 1, attempt: 1,
        createdAt: readyNow, updatedAt: readyNow,
      },
      session: {
        viewSessionId: "vs_repo_ready_reconcile", fileId: "file_repo_ready_reconcile",
        shareLinkId: null, jobId: readyJobId, expiresAt: readyNow + 180_000, createdAt: readyNow,
      },
    });
    const readyObjectBytes = Buffer.from("ready-generation-must-survive-reconcile");
    const readyObject = {
      objectId: "chunk_model_001.bin", objectType: "chunk" as const,
      byteLength: readyObjectBytes.byteLength,
      sha256: crypto.createHash("sha256").update(readyObjectBytes).digest("hex"),
      blobPath: "cad-v2/scenes/scene_repo_ready_reconcile/objects/g_repo_ready_reconcile/chunk_model_001.bin",
    };
    const manifestBytes = Buffer.from("ready-manifest");
    const readyManifest = {
      objectId: "manifest.json", objectType: "manifest" as const,
      byteLength: manifestBytes.byteLength,
      sha256: crypto.createHash("sha256").update(manifestBytes).digest("hex"),
      blobPath: "cad-v2/scenes/scene_repo_ready_reconcile/objects/g_repo_ready_reconcile/manifest.json",
    };
    const readyPublish = {
      jobId: readyJobId, fence: 1, leaseOwnerId: "lease_owner_ready_reconcile",
      sceneId: "scene_repo_ready_reconcile", fileId: "file_repo_ready_reconcile",
      sourceVersionKey: "rev_repo_ready_reconcile", sourceSha256: "c".repeat(64),
      artifactKey: "artifact_repo_ready_reconcile", tenantScope: "global",
      storageGeneration: "g_repo_ready_reconcile", compilerRevision: "candidate-v71",
      schemaVersion: 1, renderAbi: "cad-v2-test", qualityProfile: "test", fontDigest: "font-test",
      manifestSha256: "b".repeat(64), manifestBlobPath: readyManifest.blobPath,
      objects: [readyObject, readyManifest],
    };
    assert.ok(readyRequest.job.jobId);
    assert.equal(await repository.beginPublishLease({
      jobId: readyJobId, fence: 1, sceneId: readyPublish.sceneId,
      storageGeneration: readyPublish.storageGeneration, ownerId: readyPublish.leaseOwnerId, ttlMs: 60_000,
    }), true);
    assert.equal(await repository.publishSceneAndCompleteJob(readyPublish), true);
    const readyPath = readyObject.blobPath;
    blobStore.objects.set(readyPath, new Date(Date.now() - 3 * 24 * 60 * 60_000));
    await repository.deleteViewSession(readyRequest.session.viewSessionId);
    await executor.query(
      `UPDATE cad_v2_publish_leases SET status='active', lease_expires_at=now() - interval '3 days'
       WHERE scene_id=$1 AND storage_generation=$2`,
      [readyPublish.sceneId,readyPublish.storageGeneration]
    );
    const readyReport = await reconcileCadV2ExpiredPublishGenerations({
      repository, blobStore, mode: "apply", graceMs: 60_000,
    });
    assert.equal(readyReport.length, 0, "an expired lease cannot make a committed READY generation a cleanup candidate");
    assert.ok(await repository.getReadyScene(readyPublish.sceneId), "READY pointer must remain intact");
    assert.deepEqual(
      await repository.getProtectedBlobPaths("cad-v2/scenes/scene_repo_ready_reconcile/objects/g_repo_ready_reconcile/"),
      new Set([readyObject.blobPath, readyManifest.blobPath])
    );
    assert.equal(blobStore.objects.has(readyPath), true, "ready-generation Blob bytes must not be deleted");
  } finally {
    await database.close();
  }
}

run().then(() => {
  console.log("PASS: CAD V2 publish lease, report-only behavior, stale generation cleanup, and READY preservation");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
