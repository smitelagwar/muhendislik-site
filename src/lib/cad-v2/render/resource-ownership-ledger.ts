export interface CadV2ResourceOwner {
  ownerScene: string;
  generation: number;
  chunkId: string;
}

export interface CadV2ResourceByteEstimate {
  cpuResidentBytes: number;
  gpuBufferBytesEstimate: number;
}

export interface CadV2OwnedResourceInput {
  resource: object;
  kind: string;
  byteEstimate: CadV2ResourceByteEstimate;
  dispose: () => void;
}

export interface CadV2ResourceOwnershipSnapshotEntry {
  resourceId: number;
  kind: string;
  refCount: number;
  byteEstimate: CadV2ResourceByteEstimate;
  owners: Array<CadV2ResourceOwner & { refCount: number }>;
}

interface ResourceRecord {
  resourceId: number;
  resource: object;
  kind: string;
  refCount: number;
  byteEstimate: CadV2ResourceByteEstimate;
  dispose: () => void;
  owners: Map<string, { owner: CadV2ResourceOwner; refCount: number }>;
}

interface LeaseRecord {
  ownerKey: string;
  resourceRecords: ResourceRecord[];
}

/** Tracks one ownership lease per scene generation and chunk, deduplicating shared resource objects. */
export class CadV2ResourceOwnershipLedger {
  private readonly resources = new Map<object, ResourceRecord>();
  private readonly leases = new Map<symbol, LeaseRecord>();
  private nextResourceId = 1;

  public constructor(private readonly onDisposeError?: (error: unknown) => void) {}

  public acquire(owner: CadV2ResourceOwner, inputs: CadV2OwnedResourceInput[]): { release: () => void } {
    if (!owner.ownerScene || !owner.chunkId || !Number.isSafeInteger(owner.generation) || owner.generation < 0) {
      throw new Error("Invalid CAD resource owner identity");
    }

    const ownerKey = JSON.stringify([owner.ownerScene, owner.generation, owner.chunkId]);
    const uniqueInputs = new Map<object, CadV2OwnedResourceInput>();
    for (const input of inputs) {
      if (!input.resource || typeof input.resource !== "object" || !input.kind ||
          !Number.isFinite(input.byteEstimate.cpuResidentBytes) || input.byteEstimate.cpuResidentBytes < 0 ||
          !Number.isFinite(input.byteEstimate.gpuBufferBytesEstimate) || input.byteEstimate.gpuBufferBytesEstimate < 0) {
        throw new Error("Invalid CAD resource ownership entry");
      }
      if (!uniqueInputs.has(input.resource)) uniqueInputs.set(input.resource, input);
    }
    for (const input of uniqueInputs.values()) {
      const existing = this.resources.get(input.resource);
      if (existing && existing.kind !== input.kind) throw new Error("A CAD resource cannot change ownership kind");
    }

    const records: ResourceRecord[] = [];
    for (const input of uniqueInputs.values()) {
      let record = this.resources.get(input.resource);
      if (!record) {
        record = {
          resourceId: this.nextResourceId++,
          resource: input.resource,
          kind: input.kind,
          refCount: 0,
          byteEstimate: { ...input.byteEstimate },
          dispose: input.dispose,
          owners: new Map(),
        };
        this.resources.set(input.resource, record);
      } else {
        // Keep a conservative estimate if a shared resource reports different measurements.
        record.byteEstimate.cpuResidentBytes = Math.max(record.byteEstimate.cpuResidentBytes, input.byteEstimate.cpuResidentBytes);
        record.byteEstimate.gpuBufferBytesEstimate = Math.max(
          record.byteEstimate.gpuBufferBytesEstimate,
          input.byteEstimate.gpuBufferBytesEstimate,
        );
      }
      record.refCount++;
      const ownerRef = record.owners.get(ownerKey);
      if (ownerRef) ownerRef.refCount++;
      else record.owners.set(ownerKey, { owner: { ...owner }, refCount: 1 });
      records.push(record);
    }

    const leaseId = Symbol("cad-v2-resource-owner");
    this.leases.set(leaseId, { ownerKey, resourceRecords: records });
    let released = false;
    return {
      release: () => {
        if (released) return;
        released = true;
        this.releaseLease(leaseId);
      },
    };
  }

  public getSnapshot(): CadV2ResourceOwnershipSnapshotEntry[] {
    return Array.from(this.resources.values(), (record) => ({
      resourceId: record.resourceId,
      kind: record.kind,
      refCount: record.refCount,
      byteEstimate: { ...record.byteEstimate },
      owners: Array.from(record.owners.values(), ({ owner, refCount }) => ({ ...owner, refCount }))
        .sort((left, right) => left.ownerScene.localeCompare(right.ownerScene) ||
          left.generation - right.generation || left.chunkId.localeCompare(right.chunkId)),
    })).sort((left, right) => left.resourceId - right.resourceId);
  }

  public getAggregateByteEstimate(): CadV2ResourceByteEstimate {
    let cpuResidentBytes = 0;
    let gpuBufferBytesEstimate = 0;
    for (const record of this.resources.values()) {
      cpuResidentBytes += record.byteEstimate.cpuResidentBytes;
      gpuBufferBytesEstimate += record.byteEstimate.gpuBufferBytesEstimate;
    }
    return { cpuResidentBytes, gpuBufferBytesEstimate };
  }

  /** Replaces a live mutable resource's estimate after its attributes or retained buffers change. */
  public updateResourceByteEstimate(resource: object, byteEstimate: CadV2ResourceByteEstimate): void {
    const record = this.resources.get(resource);
    if (!record) return;
    if (!Number.isFinite(byteEstimate.cpuResidentBytes) || byteEstimate.cpuResidentBytes < 0 ||
        !Number.isFinite(byteEstimate.gpuBufferBytesEstimate) || byteEstimate.gpuBufferBytesEstimate < 0) {
      throw new Error("Invalid CAD resource byte estimate update");
    }
    record.byteEstimate = { ...byteEstimate };
  }

  public getResourceCount(kind?: string): number {
    if (kind === undefined) return this.resources.size;
    let count = 0;
    for (const resource of this.resources.values()) if (resource.kind === kind) count++;
    return count;
  }

  public releaseOwner(owner: CadV2ResourceOwner): void {
    const ownerKey = JSON.stringify([owner.ownerScene, owner.generation, owner.chunkId]);
    for (const [leaseId, lease] of Array.from(this.leases.entries())) {
      if (lease.ownerKey === ownerKey) this.releaseLease(leaseId);
    }
  }

  private releaseLease(leaseId: symbol): void {
    const lease = this.leases.get(leaseId);
    if (!lease) return;
    this.leases.delete(leaseId);

    for (const record of lease.resourceRecords) {
      const ownerRef = record.owners.get(lease.ownerKey);
      if (ownerRef) {
        ownerRef.refCount--;
        if (ownerRef.refCount === 0) record.owners.delete(lease.ownerKey);
      }
      record.refCount--;
      if (record.refCount !== 0) continue;
      this.resources.delete(record.resource);
      try {
        record.dispose();
      } catch (error) {
        this.onDisposeError?.(error);
      }
    }
  }
}
