import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { compactSceneManifestForTransport, hydrateSceneManifestIndexes, MAX_INDEX_PAGE_BYTES } from "../../src/lib/cad-v2/protocol/manifest-index-pages";
import { validateSceneManifest } from "../../src/lib/cad-v2/protocol/binary-protocol";

async function main() {
  const entityCount = 4_096;
  const document: CadCanonicalDocument = {
    sourceVersionKey: "l11-large-manifest-v1",
    sourceSha256: "l11-large-manifest-fixture",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" },
    },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: Array.from({ length: entityCount }, (_, index) => ({
      type: "LINE", handle: `L${index.toString(16)}`, layer: "0", order: BigInt(index + 1),
      start: [index * 2, 0], end: [index * 2 + 1, 1],
    } as CadLineEntity)),
  };
  const compiled = compileCanonicalToScene(document, { sceneId: "scene_l11_paged_manifest", maxPrimitivesPerChunk: 1 });
  assert(compiled.manifest.chunks.length > 1_000, "synthetic large scene creates enough chunk descriptors to exceed inline-manifest budget");
  assert(compiled.manifest.indexPages.length > 1, "large scene's index artifacts are split into bounded pages");

  const published = compactSceneManifestForTransport(compiled.manifest);
  assert(Buffer.byteLength(JSON.stringify(published), "utf8") <= published.limits.maxManifestBytes,
    "transport manifest stays within the declared 1 MiB maximum");
  assert.equal(published.chunks.length, 0, "large transport manifest does not duplicate all chunk descriptors inline");
  assert(published.indexPages.every((page) => !Array.isArray((page as { chunks?: unknown }).chunks)),
    "large transport manifest carries index references instead of inline page payloads");
  assert(published.indexPages.every((page) => Array.isArray((page as { chunkIds?: unknown }).chunkIds)),
    "each index reference carries its authorized chunk ID set");
  assert(compiled.indexFiles && [...compiled.indexFiles.values()].every((content) =>
    Buffer.byteLength(content, "utf8") <= MAX_INDEX_PAGE_BYTES), "every immutable index page stays within 256 KiB");

  let activeLoads = 0;
  let peakLoads = 0;
  const hydrated = await hydrateSceneManifestIndexes(published, async (indexId) => {
    activeLoads++;
    peakLoads = Math.max(peakLoads, activeLoads);
    await new Promise((resolve) => setTimeout(resolve, 1));
    const content = compiled.indexFiles!.get(indexId);
    activeLoads--;
    assert(content, `index artifact ${indexId} exists`);
    return new TextEncoder().encode(content);
  });
  assert(peakLoads <= 4, "index-page loading has a bounded four-request concurrency");
  const validated = validateSceneManifest(hydrated);
  assert.equal(validated.chunks.length, compiled.chunks.size, "hydration restores every manifest chunk exactly once");
  assert.equal(new Set(validated.chunks.map((chunk) => chunk.chunkId)).size, compiled.chunks.size,
    "hydrated chunk IDs are unique");

  const inlineChunk = { ...compiled.manifest.chunks[0]!, chunkId: "chunk_l11_inline_paper_001" };
  const inlineIndexId = "idx_l11_inline_paper_001";
  const inlineIndexContent = JSON.stringify({ indexId: inlineIndexId, layoutIds: ["Paper"], chunks: [inlineChunk] });
  const mixedManifest = {
    ...published,
    indexPages: [{
      indexId: inlineIndexId,
      byteLength: Buffer.byteLength(inlineIndexContent, "utf8"),
      sha256: createHash("sha256").update(inlineIndexContent, "utf8").digest("hex"),
      layoutIds: ["Paper"],
      chunks: [inlineChunk],
    }, ...published.indexPages],
  };
  const compactMixedManifest = compactSceneManifestForTransport(mixedManifest);
  assert(compactMixedManifest.indexPages.every((page) => !Array.isArray((page as { chunks?: unknown }).chunks) &&
    Array.isArray((page as { chunkIds?: unknown }).chunkIds)),
  "transport compaction derives a chunk allow-list for inline pages in a mixed-layout scene");
  const mixedHydrated = await hydrateSceneManifestIndexes(compactMixedManifest, async (indexId) => {
    const content = indexId === inlineIndexId ? inlineIndexContent : compiled.indexFiles!.get(indexId);
    assert(content, `external index artifact ${indexId} exists`);
    return new TextEncoder().encode(content);
  });
  assert.deepEqual(mixedHydrated.indexPages[0]?.chunks, [inlineChunk],
    "inline layout page remains valid when another layout uses external index pages");
  assert.equal(mixedHydrated.indexPages.length, published.indexPages.length + 1,
    "mixed inline and external layout indexes all hydrate together");

  const firstPage = published.indexPages[0]!;
  const badHashManifest = {
    ...published,
    indexPages: published.indexPages.map((page, index) => index === 0 ? { ...page, sha256: "0".repeat(64) } : page),
  };
  await assert.rejects(
    hydrateSceneManifestIndexes(badHashManifest, async (indexId) => new TextEncoder().encode(compiled.indexFiles!.get(indexId)!)),
    /SHA-256|hash/i,
    "index page hash mismatch is rejected before chunk metadata is accepted",
  );

  const rawBytes = new TextEncoder().encode(compiled.indexFiles!.get(firstPage.indexId)!);
  assert.equal(createHash("sha256").update(rawBytes).digest("hex"), firstPage.sha256,
    "index reference digest matches the actual immutable bytes");
  console.log(`large-manifest-paging: PASS (${compiled.chunks.size} chunks, ${published.indexPages.length} pages)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
