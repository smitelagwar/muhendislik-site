import { getBlobCommandOptions } from "@/lib/dokumantasyon/runtime-mode";
import { CadV2DurableRepository, type CadV2PublishLease } from "./repository";

export interface CadV2ListedBlob {
  pathname: string;
  uploadedAt: Date | string | number;
}

export interface CadV2ReconcileBlobStore {
  list(input: { prefix: string; cursor?: string }): Promise<{
    blobs: CadV2ListedBlob[];
    cursor?: string;
    hasMore: boolean;
  }>;
  delete(pathname: string): Promise<void>;
}

export interface CadV2ReconcileResult {
  sceneId: string;
  storageGeneration: string;
  leaseStatus: CadV2PublishLease["status"];
  prefix: string;
  listed: number;
  deletable: number;
  deleted: number;
  preservedRecent: number;
  preservedReferenced: number;
  preservedInvalid: number;
  completed: boolean;
}

async function listAll(store: CadV2ReconcileBlobStore, prefix: string): Promise<CadV2ListedBlob[]> {
  const blobs: CadV2ListedBlob[] = [];
  let cursor: string | undefined;
  const cursors = new Set<string>();
  do {
    const page = await store.list({ prefix, cursor });
    blobs.push(...page.blobs);
    if (!page.hasMore) break;
    if (!page.cursor || cursors.has(page.cursor)) {
      throw new Error("CAD_V2_RECONCILE_PAGINATION_INVALID: Blob cursor ilerlemiyor.");
    }
    cursors.add(page.cursor);
    cursor = page.cursor;
  } while (true);
  return blobs;
}

function uploadedAtMillis(value: CadV2ListedBlob["uploadedAt"]): number {
  const millis = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(millis) ? millis : 0;
}

export async function reconcileCadV2ExpiredPublishGenerations(input: {
  repository: CadV2DurableRepository;
  blobStore: CadV2ReconcileBlobStore;
  mode: "report" | "apply";
  graceMs: number;
  now?: number;
  limit?: number;
}): Promise<CadV2ReconcileResult[]> {
  if (!Number.isSafeInteger(input.graceMs) || input.graceMs < 60_000) {
    throw new Error("CAD_V2_RECONCILE_GRACE_INVALID: en az bir dakikalık grace gerekir.");
  }
  const now = input.now ?? Date.now();
  const candidates = await input.repository.previewExpiredPublishLeases({
    graceMs: input.graceMs,
    limit: input.limit ?? 100,
  });
  const results: CadV2ReconcileResult[] = [];

  for (const candidate of candidates) {
    const prefix = `cad-v2/scenes/${candidate.sceneId}/objects/${candidate.storageGeneration}/`;
    if (input.mode === "apply") {
      const claimed = await input.repository.claimExpiredPublishLease({
        sceneId: candidate.sceneId,
        storageGeneration: candidate.storageGeneration,
        graceMs: input.graceMs,
      });
      if (!claimed) continue;
    }

    const protectedPaths = await input.repository.getProtectedBlobPaths(prefix, {
      sceneId: candidate.sceneId,
      storageGeneration: candidate.storageGeneration,
    });
    const blobs = await listAll(input.blobStore, prefix);
    const ageCutoff = now - input.graceMs;
    const result: CadV2ReconcileResult = {
      sceneId: candidate.sceneId,
      storageGeneration: candidate.storageGeneration,
      leaseStatus: input.mode === "apply" ? "reconciling" : candidate.status,
      prefix,
      listed: blobs.length,
      deletable: 0,
      deleted: 0,
      preservedRecent: 0,
      preservedReferenced: 0,
      preservedInvalid: 0,
      completed: false,
    };
    const deletable: string[] = [];
    for (const blob of blobs) {
      if (!blob.pathname.startsWith(prefix) || blob.pathname.includes("..") || blob.pathname.includes("\\")) {
        result.preservedInvalid++;
        continue;
      }
      if (protectedPaths.has(blob.pathname)) {
        result.preservedReferenced++;
        continue;
      }
      const uploadedAt = uploadedAtMillis(blob.uploadedAt);
      if (!uploadedAt || uploadedAt > ageCutoff) {
        result.preservedRecent++;
        continue;
      }
      deletable.push(blob.pathname);
    }
    result.deletable = deletable.length;

    if (input.mode === "apply") {
      for (const pathname of deletable) {
        await input.blobStore.delete(pathname);
        result.deleted++;
      }
      const remaining = await listAll(input.blobStore, prefix);
      if (remaining.length === 0) {
        result.completed = await input.repository.finishPublishLeaseReconciliation({
          sceneId: candidate.sceneId,
          storageGeneration: candidate.storageGeneration,
        });
      }
    }
    results.push(result);
  }
  return results;
}

export function createVercelCadV2ReconcileBlobStore(): CadV2ReconcileBlobStore {
  return {
    async list({ prefix, cursor }) {
      const { list } = await import("@vercel/blob");
      const page = await list({
        prefix,
        cursor,
        limit: 1000,
        ...getBlobCommandOptions(),
      });
      return {
        blobs: page.blobs.map((blob) => ({ pathname: blob.pathname, uploadedAt: blob.uploadedAt })),
        cursor: page.cursor,
        hasMore: page.hasMore,
      };
    },
    async delete(pathname) {
      const { del } = await import("@vercel/blob");
      await del(pathname, getBlobCommandOptions());
    },
  };
}
