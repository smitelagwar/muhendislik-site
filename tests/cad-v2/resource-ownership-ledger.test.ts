import assert from "node:assert/strict";
import {
  CadV2ResourceOwnershipLedger,
  type CadV2OwnedResourceInput,
} from "../../src/lib/cad-v2/render/resource-ownership-ledger";

function owned(resource: object, kind: string, cpu: number, gpu: number, dispose: () => void): CadV2OwnedResourceInput {
  return { resource, kind, byteEstimate: { cpuResidentBytes: cpu, gpuBufferBytesEstimate: gpu }, dispose };
}

const ledger = new CadV2ResourceOwnershipLedger();
let disposeCount = 0;
const sharedGeometry = {};
const ownerA = { ownerScene: "scene-A", generation: 4, chunkId: "chunk-7" };
const ownerB = { ownerScene: "scene-A", generation: 4, chunkId: "chunk-8" };

const leaseA = ledger.acquire(ownerA, [
  owned(sharedGeometry, "geometry", 100, 100, () => disposeCount++),
  owned(sharedGeometry, "geometry", 100, 100, () => disposeCount++),
]);
assert.equal(ledger.getResourceCount("geometry"), 1, "one owner lease deduplicates repeated resource references");
assert.deepEqual(ledger.getAggregateByteEstimate(), { cpuResidentBytes: 100, gpuBufferBytesEstimate: 100 });

const leaseB = ledger.acquire(ownerB, [owned(sharedGeometry, "geometry", 120, 112, () => disposeCount++)]);
const sharedSnapshot = ledger.getSnapshot()[0]!;
assert.equal(sharedSnapshot.refCount, 2, "shared geometry has one live lease per owner chunk");
assert.equal(sharedSnapshot.owners.length, 2, "ledger retains scene, generation, and chunk identity for both owners");
assert.deepEqual(sharedSnapshot.byteEstimate, { cpuResidentBytes: 120, gpuBufferBytesEstimate: 112 },
  "shared resource is counted once using the conservative byte estimate");
leaseA.release();
leaseA.release();
assert.equal(disposeCount, 0, "removing one owner does not dispose a shared geometry");
assert.deepEqual(ledger.getAggregateByteEstimate(), { cpuResidentBytes: 120, gpuBufferBytesEstimate: 112 });
leaseB.release();
assert.equal(disposeCount, 1, "last owner disposes shared geometry exactly once");
assert.equal(ledger.getSnapshot().length, 0, "disposed resources leave no ownership record");

const oldGenerationResource = {};
const currentGenerationResource = {};
const oldLease = ledger.acquire({ ownerScene: "scene-B", generation: 9, chunkId: "chunk-1" }, [
  owned(oldGenerationResource, "material", 8, 0, () => disposeCount++),
]);
ledger.acquire({ ownerScene: "scene-B", generation: 10, chunkId: "chunk-1" }, [
  owned(currentGenerationResource, "material", 16, 0, () => disposeCount++),
]);
ledger.releaseOwner({ ownerScene: "scene-B", generation: 10, chunkId: "chunk-1" });
assert.equal(ledger.getSnapshot().length, 1, "generation cleanup leaves resources owned by an older, distinct lease untouched");
assert.deepEqual(ledger.getSnapshot()[0]!.owners[0], {
  ownerScene: "scene-B", generation: 9, chunkId: "chunk-1", refCount: 1,
}, "snapshot identifies the remaining owner without attributing it to the new generation");
oldLease.release();
assert.equal(ledger.getSnapshot().length, 0, "releasing the previous generation leaves no stale resource owner");

const replacementSharedResource = {};
const replacementOwner = { ownerScene: "scene-C", generation: 2, chunkId: "chunk-3" };
const oldGroupLease = ledger.acquire(replacementOwner, [
  owned(replacementSharedResource, "material", 4, 0, () => disposeCount++),
]);
const newGroupLease = ledger.acquire(replacementOwner, [
  owned(replacementSharedResource, "material", 4, 0, () => disposeCount++),
]);
oldGroupLease.release();
assert.equal(ledger.getSnapshot()[0]!.refCount, 1, "replacement overlap retains a shared resource until the old group retires");
newGroupLease.release();
assert.equal(ledger.getSnapshot().length, 0, "replacement final lease disposes and removes its resource");

const transactionalLedger = new CadV2ResourceOwnershipLedger();
const preexistingResource = {};
const uncommittedResource = {};
const preexistingLease = transactionalLedger.acquire({ ownerScene: "scene-D", generation: 1, chunkId: "chunk-1" }, [
  owned(preexistingResource, "material", 2, 0, () => {}),
]);
assert.throws(() => transactionalLedger.acquire({ ownerScene: "scene-D", generation: 1, chunkId: "chunk-2" }, [
  owned(uncommittedResource, "geometry", 10, 10, () => {}),
  owned(preexistingResource, "geometry", 2, 0, () => {}),
]), /cannot change ownership kind/);
assert.equal(transactionalLedger.getSnapshot().length, 1, "invalid mixed acquisition does not leave a partial resource lease");
preexistingLease.release();

console.log("PASS: CAD renderer shared-resource ownership, accounting, generations, replacement, and final-owner disposal");
