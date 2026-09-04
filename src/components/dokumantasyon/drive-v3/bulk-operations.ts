// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — BULK OPERATIONS CLIENT ENGINE
// ============================================================================

import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

export interface BulkItem {
  id: string;
  type: "file" | "folder";
}

export interface BulkFailureItem {
  id: string;
  type: "file" | "folder";
  code: string;
  message: string;
}

export interface BulkResult {
  succeeded: string[];
  failed: BulkFailureItem[];
  totalProcessed: number;
}

export const BULK_CHUNK_SIZE = 250;

export function chunkItems<T>(items: T[], size: number = BULK_CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function executeBulkTrash(
  items: BulkItem[],
  onProgress?: (progress: { processed: number; total: number }) => void
): Promise<BulkResult> {
  const chunks = chunkItems(items, BULK_CHUNK_SIZE);
  const succeeded: string[] = [];
  const failed: BulkFailureItem[] = [];
  let processed = 0;

  for (const chunk of chunks) {
    const res = await requestDokMutation<{ succeeded: string[]; failed: BulkFailureItem[] }>(
      "/api/dokumantasyon/bulk/trash",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk }),
      }
    );

    if (!res.ok) {
      for (const item of chunk) {
        failed.push({
          id: item.id,
          type: item.type,
          code: "NETWORK_OR_SERVER_ERROR",
          message: res.message || "Bilinmeyen sunucu hatası",
        });
      }
    } else {
      succeeded.push(...res.data.succeeded);
      failed.push(...res.data.failed);
    }

    processed += chunk.length;
    onProgress?.({ processed, total: items.length });
  }

  return { succeeded, failed, totalProcessed: items.length };
}

export async function executeBulkMove(
  items: BulkItem[],
  targetFolderId: string | null,
  onProgress?: (progress: { processed: number; total: number }) => void
): Promise<BulkResult> {
  const chunks = chunkItems(items, BULK_CHUNK_SIZE);
  const succeeded: string[] = [];
  const failed: BulkFailureItem[] = [];
  let processed = 0;

  for (const chunk of chunks) {
    const res = await requestDokMutation<{ succeeded: string[]; failed: BulkFailureItem[] }>(
      "/api/dokumantasyon/bulk/move",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk, targetFolderId }),
      }
    );

    if (!res.ok) {
      for (const item of chunk) {
        failed.push({
          id: item.id,
          type: item.type,
          code: "NETWORK_OR_SERVER_ERROR",
          message: res.message || "Bilinmeyen sunucu hatası",
        });
      }
    } else {
      succeeded.push(...res.data.succeeded);
      failed.push(...res.data.failed);
    }

    processed += chunk.length;
    onProgress?.({ processed, total: items.length });
  }

  return { succeeded, failed, totalProcessed: items.length };
}

export async function executeBulkStar(
  items: BulkItem[],
  starred: boolean,
  onProgress?: (progress: { processed: number; total: number }) => void
): Promise<BulkResult> {
  const chunks = chunkItems(items, BULK_CHUNK_SIZE);
  const succeeded: string[] = [];
  const failed: BulkFailureItem[] = [];
  let processed = 0;

  for (const chunk of chunks) {
    const res = await requestDokMutation<{ succeeded: string[]; failed: BulkFailureItem[] }>(
      "/api/dokumantasyon/bulk/star",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk, starred }),
      }
    );

    if (!res.ok) {
      for (const item of chunk) {
        failed.push({
          id: item.id,
          type: item.type,
          code: "NETWORK_OR_SERVER_ERROR",
          message: res.message || "Bilinmeyen sunucu hatası",
        });
      }
    } else {
      succeeded.push(...res.data.succeeded);
      failed.push(...res.data.failed);
    }

    processed += chunk.length;
    onProgress?.({ processed, total: items.length });
  }

  return { succeeded, failed, totalProcessed: items.length };
}

export async function executeBulkRestore(
  items: BulkItem[],
  onProgress?: (progress: { processed: number; total: number }) => void
): Promise<BulkResult> {
  const chunks = chunkItems(items, BULK_CHUNK_SIZE);
  const succeeded: string[] = [];
  const failed: BulkFailureItem[] = [];
  let processed = 0;

  for (const chunk of chunks) {
    const res = await requestDokMutation<{ succeeded: string[]; failed: BulkFailureItem[] }>(
      "/api/dokumantasyon/bulk/restore",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunk }),
      }
    );

    if (!res.ok) {
      for (const item of chunk) {
        failed.push({
          id: item.id,
          type: item.type,
          code: "NETWORK_OR_SERVER_ERROR",
          message: res.message || "Bilinmeyen sunucu hatası",
        });
      }
    } else {
      succeeded.push(...res.data.succeeded);
      failed.push(...res.data.failed);
    }

    processed += chunk.length;
    onProgress?.({ processed, total: items.length });
  }

  return { succeeded, failed, totalProcessed: items.length };
}
