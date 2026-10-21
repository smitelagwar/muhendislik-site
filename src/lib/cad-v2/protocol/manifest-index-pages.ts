/**
 * Bounded transport helpers for large CAD scene manifests.
 * Index artifacts are immutable; their digest and exact chunk allow-list are
 * checked before the host accepts any chunk metadata from them.
 */

export const MAX_INDEX_PAGE_BYTES = 256 * 1024;
export const MAX_MANIFEST_INDEX_CONCURRENCY = 4;

export interface SceneManifestIndexReference {
  indexId: string;
  byteLength: number;
  sha256: string;
  layoutIds: string[];
  chunkIds: string[];
  chunks?: Array<Record<string, unknown>>;
}

const bytesToHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

async function sha256(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto SHA-256 is unavailable for scene index validation.");
  const input = new Uint8Array(bytes.byteLength);
  input.set(bytes);
  return bytesToHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", input.buffer)));
}

export function compactSceneManifestForTransport<T extends Record<string, any>>(manifest: T): T {
  const maxBytes = manifest.limits?.maxManifestBytes;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("Scene manifest has no valid maxManifestBytes limit.");
  }
  const hasExternalIndex = Array.isArray(manifest.indexPages) && manifest.indexPages.some(
    (page: SceneManifestIndexReference) => page.chunks === undefined,
  );
  const currentBytes = new TextEncoder().encode(JSON.stringify(manifest)).byteLength;
  if (!hasExternalIndex && currentBytes <= maxBytes) return manifest;

  const compact = {
    ...manifest,
    chunks: [],
    indexPages: manifest.indexPages.map((page: SceneManifestIndexReference) => ({
      indexId: page.indexId,
      byteLength: page.byteLength,
      sha256: page.sha256,
      layoutIds: [...page.layoutIds],
      chunkIds: page.chunkIds ? [...page.chunkIds] : (page.chunks || []).map((chunk: any) => String(chunk.chunkId)),
    })),
  } as T;
  const encodedBytes = new TextEncoder().encode(JSON.stringify(compact)).byteLength;
  if (encodedBytes > maxBytes) {
    throw new Error(`Scene transport manifest exceeds maxManifestBytes: ${encodedBytes} > ${maxBytes}.`);
  }
  return compact;
}

export async function hydrateSceneManifestIndexes<T extends Record<string, any>>(
  manifest: T,
  loadIndex: (indexId: string) => Promise<Uint8Array>,
  concurrency = MAX_MANIFEST_INDEX_CONCURRENCY,
): Promise<T> {
  if (!Array.isArray(manifest.indexPages)) return manifest;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_MANIFEST_INDEX_CONCURRENCY) {
    throw new Error(`Scene index concurrency must be between 1 and ${MAX_MANIFEST_INDEX_CONCURRENCY}.`);
  }

  const references: SceneManifestIndexReference[] = manifest.indexPages;
  if (references.every((page) => Array.isArray(page.chunks))) return manifest;
  const ids = new Set<string>();
  for (const page of references) {
    if (!page || typeof page.indexId !== "string" || !page.indexId || ids.has(page.indexId)) {
      throw new Error("Scene manifest contains an invalid or duplicate index page ID.");
    }
    ids.add(page.indexId);
    if (!Number.isSafeInteger(page.byteLength) || page.byteLength < 1 || page.byteLength > MAX_INDEX_PAGE_BYTES) {
      throw new Error(`Scene index ${page.indexId} has an invalid bounded byteLength.`);
    }
    if (!/^[a-f0-9]{64}$/i.test(page.sha256)) throw new Error(`Scene index ${page.indexId} has an invalid SHA-256 digest.`);
    if (!Array.isArray(page.layoutIds) || !Array.isArray(page.chunkIds) || page.chunkIds.length === 0) {
      throw new Error(`Scene index ${page.indexId} is missing its layout or chunk allow-list.`);
    }
  }

  const loaded: Array<Record<string, unknown> | undefined> = new Array(references.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= references.length) return;
      const reference = references[index]!;
      if (Array.isArray(reference.chunks)) {
        loaded[index] = reference as unknown as Record<string, unknown>;
        continue;
      }
      const bytes = await loadIndex(reference.indexId);
      if (!(bytes instanceof Uint8Array) || bytes.byteLength !== reference.byteLength) {
        throw new Error(`Scene index ${reference.indexId} byte length does not match its immutable reference.`);
      }
      if (await sha256(bytes) !== reference.sha256.toLowerCase()) {
        throw new Error(`Scene index ${reference.indexId} SHA-256 hash does not match its immutable reference.`);
      }
      let page: any;
      try {
        page = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch {
        throw new Error(`Scene index ${reference.indexId} is not valid UTF-8 JSON.`);
      }
      if (!page || page.indexId !== reference.indexId || !Array.isArray(page.layoutIds) || !Array.isArray(page.chunks)) {
        throw new Error(`Scene index ${reference.indexId} payload shape does not match its reference.`);
      }
      if (page.layoutIds.length !== reference.layoutIds.length ||
          page.layoutIds.some((layoutId: unknown, i: number) => layoutId !== reference.layoutIds[i])) {
        throw new Error(`Scene index ${reference.indexId} layout allow-list does not match its reference.`);
      }
      const payloadChunkIds = page.chunks.map((chunk: any) => chunk?.chunkId);
      if (payloadChunkIds.length !== reference.chunkIds.length ||
          payloadChunkIds.some((chunkId: unknown, i: number) => chunkId !== reference.chunkIds[i])) {
        throw new Error(`Scene index ${reference.indexId} chunk allow-list does not match its reference.`);
      }
      loaded[index] = page as Record<string, unknown>;
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, references.length) }, () => worker()));

  const allChunkIds = new Set<string>();
  const indexPages = references.map((reference, index) => {
    const page = loaded[index]!;
    for (const chunk of page.chunks as Array<{ chunkId?: unknown }>) {
      if (typeof chunk?.chunkId !== "string" || allChunkIds.has(chunk.chunkId)) {
        throw new Error(`Scene indexes contain an invalid or duplicate chunk ID: ${String(chunk?.chunkId)}.`);
      }
      allChunkIds.add(chunk.chunkId);
    }
    return { ...reference, ...page };
  });
  const flatChunks = Array.isArray(manifest.chunks) ? manifest.chunks : [];
  if (flatChunks.length > 0) {
    const flatIds = new Set(flatChunks.map((chunk: any) => chunk?.chunkId));
    if (flatIds.size !== allChunkIds.size || [...flatIds].some((id) => !allChunkIds.has(id))) {
      throw new Error("Scene index chunk set does not match the flat manifest chunk set.");
    }
  }
  return { ...manifest, chunks: flatChunks, indexPages };
}
