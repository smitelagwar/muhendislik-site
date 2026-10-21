import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";

const chunkCount = 4_096;
const chunkIds = Array.from({ length: chunkCount }, (_, index) => `chunk_lookup_${index.toString().padStart(5, "0")}`);
const chunkBytes = new Uint8Array([1, 2, 3, 4]);
const chunkHash = createHash("sha256").update(chunkBytes).digest("hex");
let fullScanComparisons = 0;
const instrumentedChunkIds = new Proxy(chunkIds, {
  get(target, property, receiver) {
    if (property === "includes") {
      return (candidate: string) => {
        for (const chunkId of target) {
          fullScanComparisons++;
          if (chunkId === candidate) return true;
        }
        return false;
      };
    }
    return Reflect.get(target, property, receiver);
  },
});

function makeIndexPage(indexId: string, ids: string[]) {
  const chunks = ids.map((chunkId) => ({ chunkId, byteLength: chunkBytes.byteLength, sha256: chunkHash }));
  const payload = { indexId, layoutIds: ["Model"], chunks };
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  return {
    page: {
      indexId,
      layoutIds: ["Model"],
      chunkIds: ids,
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    },
    bytes,
  };
}

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), "cad-v2-large-manifest-lookup-"));
async function main(): Promise<void> {
  try {
    const memorySceneId = "scene_large_manifest_lookup";
    const memoryManifest = {
      sceneId: memorySceneId,
      storageGeneration: "g_large_manifest_lookup",
      chunks: [],
      indexPages: [{ indexId: "idx_memory", layoutIds: ["Model"], chunkIds: instrumentedChunkIds }],
      metadataPages: [],
    };
    const memoryScene = {
      manifest: memoryManifest,
      chunks: new Map(chunkIds.map((chunkId) => [chunkId, chunkBytes])),
      indexFiles: new Map([["idx_memory", "{}"]]),
      metadataFiles: new Map(),
    };
    const memoryService = new CadV2DurableService(storageDir, undefined, null);
    (memoryService as unknown as { readyScenes: Map<string, typeof memoryScene> }).readyScenes.set(memorySceneId, memoryScene);
    assert.equal(await memoryService.getManifestAsync(memorySceneId), memoryManifest, "in-memory fixture scene manifest is complete");
    for (const chunkId of chunkIds) {
      assert.equal(await memoryService.getChunkAsync(memorySceneId, chunkId), chunkBytes, `chunk ${chunkId} is authorized and returned`);
    }
    assert.ok(fullScanComparisons <= chunkCount * 2,
      `paged chunk access must build a linear allow-list once, not rescan ${chunkCount} IDs per request; observed ${fullScanComparisons} comparisons`);

    const diskSceneId = "scene_disk_manifest_cache";
    const diskStorageDir = path.join(storageDir, "disk-storage");
    const diskSceneDir = path.join(diskStorageDir, diskSceneId);
    const diskManifestPath = path.join(diskSceneDir, "manifest.json");
    const diskGeneration = "g_disk_manifest_cache";
    const initialIndexId = "idx_disk_cache_initial";
    const initialIndex = makeIndexPage(initialIndexId, chunkIds);
    const initialObjectDir = path.join(diskSceneDir, "objects", diskGeneration);
    fs.mkdirSync(initialObjectDir, { recursive: true });
    fs.writeFileSync(path.join(initialObjectDir, `index_${initialIndexId}.json`), initialIndex.bytes);
    for (const chunkId of chunkIds) {
      fs.writeFileSync(path.join(initialObjectDir, `${chunkId}.bin`), chunkBytes);
    }
    const diskManifest = {
      sceneId: diskSceneId,
      storageGeneration: diskGeneration,
      chunks: [],
      indexPages: [initialIndex.page],
      metadataPages: [],
    };
    fs.writeFileSync(diskManifestPath, JSON.stringify(diskManifest), "utf8");

    const diskService = new CadV2DurableService(diskStorageDir, undefined, null);
    const firstDiskManifest = await diskService.getManifestAsync(diskSceneId);
    assert(firstDiskManifest, "disk-backed paged manifest and its immutable artifacts load");
    const secondDiskManifest = await diskService.getManifestAsync(diskSceneId);
    assert.strictEqual(secondDiskManifest, firstDiskManifest,
      "large immutable disk manifest must reuse one parsed object across chunk requests");
    const canaryBytes = await diskService.getChunkAsync(diskSceneId, chunkIds[0]!);
    assert(canaryBytes && Buffer.from(canaryBytes).equals(Buffer.from(chunkBytes)), "disk-backed chunk is returned");

    const nextGeneration = "g_disk_manifest_cache_next";
    const nextIndexId = "idx_disk_cache_next";
    const nextIndex = makeIndexPage(nextIndexId, [chunkIds[0]!]);
    const nextObjectDir = path.join(diskSceneDir, "objects", nextGeneration);
    fs.mkdirSync(nextObjectDir, { recursive: true });
    fs.writeFileSync(path.join(nextObjectDir, `index_${nextIndexId}.json`), nextIndex.bytes);
    fs.writeFileSync(path.join(nextObjectDir, `${chunkIds[0]}.bin`), chunkBytes);
    const rewrittenManifest = {
      ...diskManifest,
      storageGeneration: nextGeneration,
      indexPages: [nextIndex.page],
    };
    fs.writeFileSync(diskManifestPath, JSON.stringify(rewrittenManifest), "utf8");
    const refreshedManifest = await diskService.getManifestAsync(diskSceneId);
    assert(refreshedManifest, "new immutable generation is revalidated and loaded");
    assert.notStrictEqual(refreshedManifest, firstDiskManifest, "new generation invalidates the parsed manifest cache");
    assert.equal(await diskService.getChunkAsync(diskSceneId, chunkIds.at(-1)!), null,
      "new generation invalidates the old chunk authorization set");
    console.log(`[L11_MANIFEST_CHUNK_LOOKUP] ${JSON.stringify({ chunkCount, fullScanComparisons, diskManifestObjectReused: true, generationCacheInvalidated: true })}`);
  } finally {
    fs.rmSync(storageDir, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
