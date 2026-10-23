// ============================================================================
// BELGE PAYLAŞIM — ÖZEL DEPOLAMA (PRIVATE BLOB) ADAPTÖRÜ
// ============================================================================

import { del, get, list, put } from "@vercel/blob";
import { getBlobCommandOptions, hasBlobAccessConfiguration } from "@/lib/dokumantasyon/runtime-mode";

export interface BlobPutResult {
  pathname: string;
  url: string;
  sizeBytes: number;
}

export interface BlobItemSummary {
  pathname: string;
  url?: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface BlobListResult {
  blobs: BlobItemSummary[];
  cursor?: string;
}

export interface BelgeBlobStore {
  put(pathname: string, data: Uint8Array): Promise<BlobPutResult>;
  get(pathname: string): Promise<Response | null>;
  del(pathname: string): Promise<void>;
  list(prefix: string, options?: { cursor?: string; limit?: number }): Promise<BlobListResult>;
}

/**
 * Test ve yerel geliştirme için izole bellek-içi Blob depolama adaptörü.
 * Harici ağ veya Vercel maliyeti oluşturmaz.
 */
export class MemoryBelgeBlobStore implements BelgeBlobStore {
  private readonly store = new Map<string, { data: Uint8Array; createdAt: Date }>();

  async put(pathname: string, data: Uint8Array): Promise<BlobPutResult> {
    this.store.set(pathname, { data: data.slice(0), createdAt: new Date() });
    return {
      pathname,
      url: `https://blob.local.mock/${pathname}`,
      sizeBytes: data.byteLength,
    };
  }

  async get(pathname: string): Promise<Response | null> {
    const item = this.store.get(pathname);
    if (!item) return null;

    const dataCopy = new Uint8Array(item.data);

    return new Response(dataCopy, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(item.data.byteLength),
      },
    });
  }

  async del(pathname: string): Promise<void> {
    this.store.delete(pathname);
  }

  async list(prefix: string, options?: { cursor?: string; limit?: number }): Promise<BlobListResult> {
    const limit = options?.limit ?? 100;
    const matching: BlobItemSummary[] = [];

    for (const [pathname, item] of this.store.entries()) {
      if (pathname.startsWith(prefix)) {
        matching.push({
          pathname,
          url: `https://blob.local.mock/${pathname}`,
          sizeBytes: item.data.byteLength,
          uploadedAt: item.createdAt,
        });
      }
    }

    const blobs = matching.slice(0, limit);
    return {
      blobs,
      cursor: matching.length > limit ? "has_more" : undefined,
    };
  }

  // Test yardımcıları
  has(pathname: string): boolean {
    return this.store.has(pathname);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  getAllPathnamesForTest(): string[] {
    return Array.from(this.store.keys());
  }
}

/**
 * Vercel Private Blob depolama adaptörü (Production / Cloud).
 * Yalnız sunucu tarafında ve `access: "private"` olarak çalışır.
 * İstemciye doğrudan Blob URL'si verilmez; akış /api/belgeler/paylasim/[token]/pdf üzerinden sunulur.
 */
export class VercelBelgeBlobStore implements BelgeBlobStore {
  async put(pathname: string, data: Uint8Array): Promise<BlobPutResult> {
    const options = getBlobCommandOptions();
    const result = await put(pathname, Buffer.from(data), {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
      ...options,
    });

    return {
      pathname: result.pathname,
      url: result.url,
      sizeBytes: data.byteLength,
    };
  }

  async get(pathname: string): Promise<Response | null> {
    try {
      const options = getBlobCommandOptions();
      const result = await get(pathname, {
        access: "private",
        ...options,
      });

      if (!result || result.statusCode !== 200 || !result.stream) {
        return null;
      }

      const contentType = result.headers.get("content-type") || "application/pdf";
      const contentLength = result.headers.get("content-length") || "";
      const headers: Record<string, string> = { "Content-Type": contentType };
      if (contentLength) headers["Content-Length"] = contentLength;

      return new Response(result.stream, {
        status: 200,
        headers,
      });
    } catch {
      return null;
    }
  }

  async del(pathname: string): Promise<void> {
    const options = getBlobCommandOptions();
    await del(pathname, options);
  }

  async list(prefix: string, options?: { cursor?: string; limit?: number }): Promise<BlobListResult> {
    const commandOptions = getBlobCommandOptions();
    const result = await list({
      prefix,
      cursor: options?.cursor,
      limit: options?.limit,
      ...commandOptions,
    });

    return {
      blobs: result.blobs.map((b) => ({
        pathname: b.pathname,
        url: b.url,
        sizeBytes: b.size,
        uploadedAt: b.uploadedAt,
      })),
      cursor: result.cursor,
    };
  }
}

let activeBlobStore: BelgeBlobStore | null = null;

export function getBelgeBlobStore(): BelgeBlobStore {
  if (activeBlobStore) return activeBlobStore;

  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel) {
    if (!hasBlobAccessConfiguration()) {
      throw new Error("GÜVENLİK HATASI: Vercel Blob özel depolama erişimi yapılandırılmamış.");
    }
    activeBlobStore = new VercelBelgeBlobStore();
    return activeBlobStore;
  }

  // Yerel ortamda BLOB yapılandırması tanımlıysa VercelBlob kullan, yoksa Memory test adaptörü
  if (hasBlobAccessConfiguration()) {
    activeBlobStore = new VercelBelgeBlobStore();
    return activeBlobStore;
  }

  // Test ve geliştirme ortamı için bellek içi mağaza
  activeBlobStore = new MemoryBelgeBlobStore();
  return activeBlobStore;
}

export function setBelgeBlobStoreForTest(store: BelgeBlobStore | null): void {
  activeBlobStore = store;
}
