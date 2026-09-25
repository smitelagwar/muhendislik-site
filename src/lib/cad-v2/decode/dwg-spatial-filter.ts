/** Resolve the XCLIP filter reachable from an INSERT extension dictionary. */
export function resolveDwgInsertSpatialFilter(
  insert: any,
  dictionariesByHandle: Map<string, any>,
  filtersByHandle: Map<string, any>
): { present: boolean; filter?: any } {
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
