/** Resolve the XCLIP filter reachable from an INSERT extension dictionary. */
export interface DwgDictionaryRecord {
  handle?: string;
  entries?: Record<string, unknown>;
}

export interface DwgSpatialFilterRecord {
  handle?: string;
  ownerHandle?: string | number;
  vertices?: unknown;
  origin?: { x?: number; y?: number; z?: number } | null;
  extrusionDirection?: { x?: number; y?: number; z?: number } | null;
  isInverted?: boolean | number;
  inverted?: boolean | number;
  frontClippingPlaneFlag?: boolean | number;
  backClippingPlaneFlag?: boolean | number;
  matrix?: unknown;
  clipBoundaryVisible?: boolean;
}

export function resolveDwgInsertSpatialFilter(
  insert: { ownerDictionaryHardId?: unknown },
  dictionariesByHandle: Map<string, DwgDictionaryRecord>,
  filtersByHandle: Map<string, DwgSpatialFilterRecord>
): { present: boolean; filter?: DwgSpatialFilterRecord } {
  const get = (handle: unknown) => dictionariesByHandle.get(String(handle || "").toUpperCase());
  const extension = get(insert?.ownerDictionaryHardId);
  const filterDictionaryHandle = extension?.entries?.ACAD_FILTER;
  const filterDictionary = get(filterDictionaryHandle);
  const spatialFilterHandle = filterDictionary?.entries?.SPATIAL;

  // No SPATIAL entry means the INSERT has no XCLIP object this decoder knows
  // about. Once the pointer exists, however, a missing/bad target is an
  // unresolved clip and callers must not render the INSERT unbounded.
  if (!spatialFilterHandle) return { present: false };
  const filter = filtersByHandle.get(String(spatialFilterHandle).toUpperCase());
  if (!filter || (filter.ownerHandle && String(filter.ownerHandle).toUpperCase() !== String(filterDictionaryHandle).toUpperCase())) {
    return { present: true };
  }
  return { present: true, filter };
}
